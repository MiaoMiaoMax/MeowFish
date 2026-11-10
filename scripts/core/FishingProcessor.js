/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import * as meow from "../lib/index.js";
import { fishingEvents } from "../lib/meow/FishingEvent.js";
import {
  isAutoFishing,
  setSinkingTimer,
  isSinkingTimer,
  clearSinkingTimer,
} from "./AutoFishState.js";
import { shouldProtectRod, replaceFishingRod, getRodInfo } from "./RodHandler.js";
import { Settings } from "../SystemSettings.js";
import { isPlayerTripped } from "./CircuitBreaker.js";
import { resolveFishingTable, rollLootTable } from "./LootTableHelper.js";
import { diagnoseTable } from "./LootDiagnose.js";
import { getLootFilter, shouldExcludeLoot, invalidateLootFilterCache } from "./LootFilter.js";
import { makeItemFlyToPlayer, playFancyParticles } from "./FishingEffects.js";

/**
 * 待结算队列
 * 
 * 一次咬钩的奖励结算属于玩家，而不是鱼钩。鱼钩被收走/销毁后，未发完
 * 的奖励仍应继续尝试发放；重试与生命周期由本模块负责，状态机只负责
 * 判定“咬钩发生了”。
 */

/** 重试间隔（tick） */
const RETRY_INTERVAL_TICKS = 5;
/** 单个结算最多尝试次数（每次间隔 5 tick，约 3 秒） */
const MAX_ATTEMPTS = 12;

/** @type {Map<string, PendingSettlement[]>} playerId -> 待结算队列 */
const pendingByPlayer = new Map();
/** @type {number | null} */
let retryRunId = null;

/**
 * @typedef {object} PendingSettlement
 * @property {import("@minecraft/server").Player} player
 * @property {import("@minecraft/server").Entity | null} hook
 * @property {import("@minecraft/server").Dimension} dimension
 * @property {number} selectedSlotIndex
 * @property {{x:number,y:number,z:number}} hookLocation
 * @property {string | undefined} biomeId
 * @property {boolean} isBesideWater
 * @property {number} attempts
 * @property {any} settlement
 * @property {any[] | null | undefined} lootResults
 * @property {Set<number>} spawnedLoot
 * @property {number} maxRarity
 * @property {number} xp
 * @property {boolean} xpFinalized
 * @property {boolean} diagnosticsDone
 * @property {boolean} effectsDone
 */

function ensureRetryLoop() {
  if (retryRunId !== null) return;
  retryRunId = mc.system.runInterval(flushAllPending, RETRY_INTERVAL_TICKS);
}

function stopRetryLoopIfIdle() {
  if (pendingByPlayer.size > 0 || retryRunId === null) return;
  try {
    mc.system.clearRun(retryRunId);
  } catch (_) {
    // 已经结束的定时器无需处理
  }
  retryRunId = null;
}

function flushAllPending() {
  for (const playerId of [...pendingByPlayer.keys()]) {
    flushPlayer(playerId);
  }
  stopRetryLoopIfIdle();
}

/**
 * 按顺序处理某玩家的待结算队列。队首失败时保留顺序，等待下一轮重试。
 * 队首进入 fatal（回滚失败等）时，放弃当前 pending 并放弃该玩家剩余 pending，
 * 避免在背包状态不确定的情况下继续写入同一容器。
 * @param {string} playerId
 */
function flushPlayer(playerId) {
  const queue = pendingByPlayer.get(playerId);
  if (!queue || queue.length === 0) {
    pendingByPlayer.delete(playerId);
    return;
  }

  while (queue.length > 0) {
    const pending = queue[0];
    let outcome;
    try {
      outcome = processPending(pending);
    } catch (err) {
      outcome = { ok: false, err };
    }

    if (outcome.ok) {
      queue.shift();
      continue;
    }

    if (outcome.fatal) {
      dropPending(pending, outcome.err, "fatal", outcome);
      queue.shift();

      // 背包状态已不确定：放弃该玩家剩余未完成结算，避免继续对同一背包写入。
      for (const rest of queue) {
        dropPending(rest, outcome.err, "fatal_blocked", outcome);
      }
      queue.length = 0;
      break;
    }

    pending.attempts++;
    const expired = pending.attempts >= MAX_ATTEMPTS;

    if (expired) {
      dropPending(pending, outcome.err, "expired");
      queue.shift();
      continue;
    }

    break;
  }

  if (queue.length === 0) pendingByPlayer.delete(playerId);
  stopRetryLoopIfIdle();
}

/**
 * @param {PendingSettlement} pending
 * @param {unknown} [err]
 * @param {"expired" | "fatal" | "fatal_blocked" | "leave" | "dimension"} [reason]
 * @param {object} [detail]
 */
function dropPending(pending, err, reason = "expired", detail = {}) {
  const settled = pending.settlement !== null;
  meow.error(
    `[FishingProcessor] 咬钩结算放弃：reason=${reason}` +
      ` player=${pending.player?.id ?? "?"}` +
      ` attempts=${pending.attempts} rodSettled=${settled}` +
      ` loot=${pending.lootResults?.length ?? 0} spawned=${pending.spawnedLoot.size}` +
      (detail.rollbackOk === undefined
        ? ""
        : ` rollbackOk=${detail.rollbackOk} restoreOk=${detail.restoreOk}` +
          ` failedSlots=[${(detail.failedRollbackSlots ?? []).join(",")}]`),
    err ?? "",
  );
}

/**
 * @param {PendingSettlement} pending
 * @returns {{ok: boolean, fatal?: boolean, err?: unknown, rollbackOk?: boolean, restoreOk?: boolean, failedRollbackSlots?: number[]}}
 */
function processPending(pending) {
  const player = pending.player;
  if (!player?.isValid) {
    return { ok: true };
  }
  if (
    pending.dimension?.id &&
    pending.dimension.id !== player.dimension.id
  ) {
    meow.error(
      `[FishingProcessor] 维度已变化，放弃未完成结算：player=${player.id}`,
    );
    return { ok: true };
  }

  if (!pending.settlement) {
    const result = settleRod(pending);
    // true=主动放弃；false=已提交；null=可重试的写入异常；
    // { fatal: true }=回滚失败，禁止自动重试。
    if (result === true) return { ok: true };
    if (result === false) {
      // 已提交，继续发奖。
    } else if (result === null) {
      return { ok: false };
    } else if (result?.fatal) {
      return {
        ok: false,
        fatal: true,
        err: result.err,
        rollbackOk: result.rollbackOk,
        restoreOk: result.restoreOk,
        failedRollbackSlots: result.failedRollbackSlots,
      };
    } else {
      return { ok: false, err: new Error("settleRod returned unexpected result") };
    }
  }

  if (pending.lootResults === undefined) {
    pending.lootResults = rollLootTableForPending(pending);
  }

  const spawned = spawnLoot(pending);
  if (!spawned) return { ok: false };

  finishPending(pending);
  return { ok: true };
}

/**
 * 掷取战利品；结果缓存在 pending 上，重试不重复掷表。
 * @param {PendingSettlement} pending
 */
function rollLootTableForPending(pending) {
  const settlement = pending.settlement;
  const dimensionId = pending.dimension?.id ?? pending.player.dimension.id;
  const tableId =
    resolveFishingTable({ dimensionId, biomeId: pending.biomeId }) ??
    "gameplay/fishing";
  const luck =
    typeof settlement.info.luck === "number" &&
    Number.isFinite(settlement.info.luck)
      ? settlement.info.luck
      : 0;

  return rollLootTable(tableId, {
    dimensionId,
    biomeId: pending.biomeId,
    luckLevel: luck,
    player: pending.player,
    tool: settlement.tool,
    difficulty: (() => {
      try {
        return mc.world.getDifficulty?.();
      } catch (_) {
        return undefined;
      }
    })(),
  });
}

/* ------------------------------ 鱼竿结算 --------------------------------- */

/**
 * 提交一次鱼竿结算。
 * 成功返回 false；主动放弃（无竿/保护不替换/替换失败）返回 true；
 * 可重试的背包写入异常且已完整恢复返回 null；
 * 回滚失败等不可重试异常返回 { fatal: true, err, rollbackOk, restoreOk, failedRollbackSlots }。
 * @param {PendingSettlement} pending
 * @returns {false | true | null | {fatal: true, err: unknown, rollbackOk: boolean, restoreOk: boolean, failedRollbackSlots: number[]}}
 */
function settleRod(pending) {
  const player = pending.player;
  const selectedSlotIndex = pending.selectedSlotIndex;

  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return true;

  const handItem = inventory.getItem(selectedSlotIndex);
  if (!handItem || handItem.typeId !== "minecraft:fishing_rod") {
    return true;
  }

  const lang = meow.getPlayerSetting(player, "language");
  const protect = meow.getPlayerSetting(player, "protect");
  const replace = meow.getPlayerSetting(player, "replace");
  const lootMode = meow.getPlayerSetting(player, "lootMode");
  const isInCreative = meow.isCreative(player);
  const safeEffect = (fn) => {
    try {
      fn();
    } catch (err) {
      meow.error("Fishing effect failed:", err);
    }
  };

  let info = getRodInfo(handItem);
  const originalLockMode = handItem.lockMode;
  // 在任何写入/扣耐久之前保存原始快照，供异常路径恢复。
  const handSnapshot = handItem.clone();

  // 一次结算只提交一次背包变更：先计算，再统一写入；异常时逆序回滚。
  const writes = [];
  const writeItem = (slot, stack) => {
    writes.push({ slot, prev: inventory.getItem(slot)?.clone() });
    inventory.setItem(slot, stack);
  };
  const rollbackWrites = () => {
    const failedSlots = [];
    let success = true;

    for (let i = writes.length - 1; i >= 0; i--) {
      const { slot, prev } = writes[i];
      try {
        inventory.setItem(slot, prev);
      } catch (err) {
        success = false;
        if (!failedSlots.includes(slot)) failedSlots.push(slot);
        meow.error(
          `[FishingProcessor] Failed to rollback slot ${slot}:`,
          err,
        );
      }
    }

    if (success) {
      writes.length = 0;
    }

    return { ok: success, failedSlots };
  };

  const handBefore = handItem;
  let working = handItem;
  let preSlot = null;
  let post = null;
  let tempLock = false;

  try {
    if (!isInCreative && originalLockMode === "none") {
      working.lockMode = "slot";
      tempLock = true;
      writeItem(selectedSlotIndex, working);
    }
    if (
      protect &&
      !isInCreative &&
      shouldProtectRod(info.durability, info.mending)
    ) {
      if (!replace) {
        working.lockMode = originalLockMode;
        writeItem(selectedSlotIndex, working);
        safeEffect(() =>
          player.sendMessage(
            meow.getLocalizedText("rod_durability_warning", lang),
          ),
        );
        return true;
      }
      const result = replaceFishingRod(
        player,
        selectedSlotIndex,
        true,
        new Set([selectedSlotIndex]),
      );
      if (result === false) {
        working.lockMode = originalLockMode;
        writeItem(selectedSlotIndex, working);
        safeEffect(() =>
          player.sendMessage(
            meow.getLocalizedText("rod_durability_warning", lang) +
              " " +
              meow.getLocalizedText("rod_replaced_failed", lang),
          ),
        );
        return true;
      }
      preSlot = result.slot;
      const oldHand = working;
      working = result.item;
      oldHand.lockMode = originalLockMode;
      working.lockMode = "slot";
      tempLock = true;
      writeItem(preSlot, oldHand);
      writeItem(selectedSlotIndex, working);
      info = getRodInfo(working);
      safeEffect(() =>
        player.sendMessage(
          meow.getLocalizedText("rod_replaced_successfully", lang),
        ),
      );
    }

    let currentDur;
    let isBroken = false;
    let needReplace = false;
    let replaceSuccess = false;
    let mendingPrepaid = false;

    if (!isInCreative) {
      // 自动钓鱼不收杆（beforeReelRod 已取消原版 itemUse），原版不会扣耐久；
      // 这里按原版规则（含耐久附魔概率）手动扣 1 点，属于替代而非叠加。
      // 经验修补竿：不扣耐久，改为发奖时预扣 1 点经验（见 finishPending）。
      if (info.mending >= 1) {
        mendingPrepaid = true;
      } else if (meow.consumeDurability(info.unbreaking)) {
        info.durability.damage += 1;
      }

      currentDur = info.maxDur - info.durability.damage;
      isBroken = info.durability.damage >= info.maxDur;

      // 经验修补竿不损耗耐久，无需因“只剩 1 点耐久”触发保护换竿；
      // 只有真正损坏（isBroken）时才换。
      if (
        replace &&
        (isBroken || (protect && !mendingPrepaid && currentDur <= 1))
      ) {
        needReplace = true;
        const excluded = new Set([selectedSlotIndex]);
        if (preSlot !== null) excluded.add(preSlot);
        const result = replaceFishingRod(
          player,
          selectedSlotIndex,
          protect,
          excluded,
        );
        if (result !== false) {
          replaceSuccess = true;
          post = result;
        }
      }

      // 统一提交：旧竿→备用槽，用过的竿→候选槽，候选竿→手上。
      // 损坏的竿一律不写回背包（即使关闭替换）。
      if (working && tempLock) working.lockMode = "none";
      if (post) post.item.lockMode = "none";
      if (preSlot !== null) writeItem(preSlot, handBefore);
      if (post) {
        writeItem(post.slot, isBroken ? undefined : working);
        writeItem(selectedSlotIndex, post.item);
      } else {
        writeItem(selectedSlotIndex, isBroken ? undefined : working);
      }
    }

    // 结算提交与标记紧邻，避免中间代码抛错导致“已扣耐久但未标记”
    pending.settlement = {
      info,
      currentDur,
      isBroken,
      needReplace,
      replaceSuccess,
      mendingPrepaid,
      messageSuffix: "",
      tool: working,
      lang,
      isInCreative,
      lootMode,
    };

    // 构建耐久/替换消息后缀
    try {
      let messageSuffix = "";
      if (isInCreative) {
        messageSuffix = meow.getLocalizedText("creative_mode", lang);
      } else if (isBroken) {
        messageSuffix = replaceSuccess
          ? meow.getLocalizedText("rod_replaced_successfully", lang)
          : meow.getLocalizedText("rod_destroyed", lang);
      } else {
        if (needReplace) {
          messageSuffix = replaceSuccess
            ? meow.getLocalizedText("rod_replaced_successfully", lang)
            : meow.getLocalizedText("rod_replaced_failed", lang);
        } else if (mendingPrepaid) {
          // 经验修补竿不扣耐久，不存在“即将替换”，只显示当前耐久。
          messageSuffix = meow.getLocalizedText("rod_durability_info", lang, {
            current: currentDur,
            max: info.maxDur,
          });
        } else if (replace && currentDur <= 3) {
          messageSuffix = meow.getLocalizedText("rod_about_to_replace", lang, {
            current: currentDur,
            max: info.maxDur,
          });
          safeEffect(() =>
            meow.playSoundInFrontOfPlayer(player, "dig.bone_block", 1.2),
          );
        } else if (currentDur <= 3) {
          messageSuffix = meow.getLocalizedText("rod_about_to_warning", lang, {
            current: currentDur,
            max: info.maxDur,
          });
          safeEffect(() =>
            meow.playSoundInFrontOfPlayer(player, "dig.bone_block", 1.2),
          );
        } else {
          messageSuffix = meow.getLocalizedText("rod_durability_info", lang, {
            current: currentDur,
            max: info.maxDur,
          });
        }
      }

      if (pending.isBesideWater)
        messageSuffix +=
          " " + meow.getLocalizedText("fishing_machine_mode", lang);

      pending.settlement.messageSuffix = messageSuffix;
    } catch (err) {
      meow.error("Failed to build rod durability message:", err);
    }

    return false;
  } catch (err) {
    const rollback = rollbackWrites();
    let restoreOk = true;

    // 回滚快照可能在扣耐久后才建立，最后再用初始快照兜底恢复手持竿。
    try {
      inventory.setItem(selectedSlotIndex, handSnapshot);
    } catch (restoreErr) {
      restoreOk = false;
      meow.error("Failed to restore fishing rod after settlement error:", restoreErr);
    }

    meow.error("Auto fishing failed to run:", err);
    // 本次未提交 settlement；仅在背包完整恢复时才允许重试。
    pending.settlement = null;

    if (!rollback.ok || !restoreOk) {
      meow.error(
        `[FishingProcessor] 结算回滚失败，终止本次 pending 并禁止自动重试：` +
          `player=${player.id} slot=${selectedSlotIndex} ` +
          `rollbackOk=${rollback.ok} restoreOk=${restoreOk} ` +
          `failedSlots=[${rollback.failedSlots.join(",")}]`,
      );
      return {
        fatal: true,
        err,
        rollbackOk: rollback.ok,
        restoreOk,
        failedRollbackSlots: rollback.failedSlots,
      };
    }

    // 背包已完整恢复，交给队列重试。
    return null;
  }
}

/* ------------------------------ 发奖 ------------------------------------- */

/**
 * @param {PendingSettlement} pending
 * @returns {boolean} 是否全部生成完成
 */
function spawnLoot(pending) {
  const loot = pending.lootResults;
  if (!loot || loot.length === 0) return true;

  const player = pending.player;
  const playerLoc = player.location;
  const hookLoc = pending.hookLocation;
  const settlement = pending.settlement;
  // 鱼钩与玩家必然同维度（FSM 已校验），发奖统一落在玩家当前维度，
  // 避免重试时持有已失效的 Dimension 引用。
  const dimension = player.dimension;

  let filter = null;
  try {
    filter = getLootFilter(player);
  } catch (err) {
    meow.error("Failed to read loot filter:", err);
  }

  for (const item of loot) {
    if (item.rarity > pending.maxRarity) pending.maxRarity = item.rarity;
  }

  let allSpawned = true;
  for (let li = 0; li < loot.length; li++) {
    if (pending.spawnedLoot.has(li)) continue;
    const entry = loot[li];

    let excluded = false;
    try {
      excluded = shouldExcludeLoot(filter, entry.item.typeId);
    } catch (err) {
      meow.error("Failed to apply loot filter:", err);
    }

    let spawnPos;
    let flyToPlayer = false;
    if (excluded || pending.isBesideWater || settlement.lootMode === 2) {
      spawnPos = hookLoc;
    } else if (settlement.lootMode === 1) {
      spawnPos = playerLoc;
    } else {
      const dirX = hookLoc.x - playerLoc.x;
      const dirZ = hookLoc.z - playerLoc.z;
      const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      spawnPos = {
        x: hookLoc.x - (dirX / len) * 0.2,
        y: hookLoc.y,
        z: hookLoc.z - (dirZ / len) * 0.2,
      };
      flyToPlayer = true;
    }

    try {
      const itemEntity = dimension.spawnItem(entry.item, spawnPos);
      if (!itemEntity) {
        allSpawned = false;
        continue;
      }
      // 实体已生成：立即记账，后续初始化即使抛错也不能再次生成。
      pending.spawnedLoot.add(li);
      try {
        itemEntity.clearVelocity();
        if (flyToPlayer) makeItemFlyToPlayer(itemEntity, playerLoc, spawnPos);
      } catch (err) {
        meow.error("Failed to initialize loot item:", err);
      }
    } catch (err) {
      allSpawned = false;
      meow.error("Failed to spawn loot item:", err);
    }
  }

  return allSpawned;
}

/**
 * @param {PendingSettlement} pending
 */
function finishPending(pending) {
  const player = pending.player;
  const settlement = pending.settlement;
  const lang = settlement.lang;
  const volume = meow.getPlayerSetting(player, "volume");
  const particleMode = meow.getPlayerSetting(player, "particleMode");
  const reduceSinking = meow.getPlayerSetting(player, "reduceSinking");
  const loot = pending.lootResults;
  const hookLoc = pending.hookLocation;

  const safeEffect = (fn) => {
    try {
      fn();
    } catch (err) {
      meow.error("Fishing effect failed:", err);
    }
  };

  if (!pending.diagnosticsDone) {
    pending.diagnosticsDone = true;
    try {
      if (loot === null) {
        meow.error(
          `[FishingProcessor] 主数据与底牌均未找到战利品表（player=${player.id}）`,
        );
      } else if (!loot || loot.length === 0) {
        const tableId =
          resolveFishingTable({
            dimensionId: pending.dimension?.id ?? player.dimension.id,
            biomeId: pending.biomeId,
          }) ?? "gameplay/fishing";
        const diag = diagnoseTable(tableId);
        meow.error(
          `[FishingProcessor] 掷表结果为空: ${tableId}（${diag}）`,
        );
      }
    } catch (err) {
      meow.error("Failed to diagnose loot table:", err);
    }
  }

  if (!pending.effectsDone) {
    if (pending.spawnedLoot.size > 0) {
      // 经验修补竿不扣耐久，改为在这里预扣 1 点经验；只计算一次，
      // 避免效果重试时重复预扣。
      let xp = pending.xp;
      if (!pending.xpFinalized) {
        xp = meow.getRndInteger(1, Math.min(6, 1 + pending.maxRarity));
        if (settlement.mendingPrepaid) xp = Math.max(0, xp - 1);
        pending.xp = xp;
        pending.xpFinalized = true;
      }

      safeEffect(() => {
        const xpPos = meow.Vector3.add(player.location, 0, 0.2, 0);
        for (let i = 0; i < xp; i++) {
          meow.spawnEntity(player.dimension, "minecraft:xp_orb", xpPos);
        }
      });

      safeEffect(() => {
        player.onScreenDisplay.setActionBar(
          `${meow.getLocalizedText("gain_xp", lang, { xp })}${settlement.messageSuffix}`,
        );
      });
    }

    safeEffect(() => {
      if (settlement.isBroken)
        meow.playSoundInFrontOfPlayer(player, "random.break", 0.7);
      if (settlement.replaceSuccess)
        meow.playSoundInFrontOfPlayer(player, "mob.villager.yes", 0.7);
      else if (settlement.needReplace)
        meow.playSoundInFrontOfPlayer(player, "mob.villager.no", 0.7);
      meow.playSoundInFrontOfPlayer(player, "random.orb", volume * 0.2, 0.5);
    });

    safeEffect(() => {
      if (particleMode === 1) {
        meow.spawnParticle(
          player.dimension,
          "minecraft:villager_happy",
          meow.Vector3.add(hookLoc, 0, 0.5, 0),
        );
      } else if (
        particleMode === 2 ||
        (!Settings.fancy_particle && particleMode === 3)
      ) {
        meow.spawnParticle(
          player.dimension,
          "minecraft:crop_growth_emitter",
          meow.Vector3.add(hookLoc, 0, 0.2, 0),
        );
      } else if (particleMode === 3) {
        playFancyParticles(player, loot ?? [], pending.maxRarity, hookLoc, volume);
      }
    });

    safeEffect(() => {
      if (!reduceSinking || pending.isBesideWater) return;
      const hook = pending.hook;
      if (!hook?.isValid) return;
      const r = mc.system.runInterval(() => {
        if (!hook.isValid) {
          clearSinkingTimer(player.id);
          return;
        }
        hook.applyImpulse(meow.Vector3.scl(hook.getVelocity(), -1));
      }, 1);
      setSinkingTimer(player.id, r);
      mc.system.runTimeout(() => {
        if (!isSinkingTimer(player?.id, r)) return;
        clearSinkingTimer(player?.id);
      }, 20);
    });

    // 所有效果都已尝试过（safeEffect 内部兜底）才标记完成，
    // 避免中途抛错后重试被 effectsDone 整段跳过。
    pending.effectsDone = true;
  }
}

/* ------------------------------ 主处理器 ---------------------------------- */

/**
 * 注册鱼咬钩事件处理器
 * @listens fishingEvents.fishBite
 */
export function registerFishingProcessor() {
  mc.world.beforeEvents.playerLeave.subscribe(event => {
    const playerId = event.player?.id;
    invalidateLootFilterCache(playerId);
    const queue = playerId ? pendingByPlayer.get(playerId) : undefined;
    if (queue && queue.length > 0) {
      for (const pending of queue) {
        dropPending(pending, undefined, "leave");
      }
      pendingByPlayer.delete(playerId);
      stopRetryLoopIfIdle();
    }
  });

  fishingEvents.fishBite.subscribe(event => {
    try {
      enqueueBite(event);
    } catch (err) {
      meow.error("Failed to enqueue fishing settlement:", err);
    }
  });
}

/**
 * 咬钩时只做“接管”：把结算放入队列并立即尝试一次。
 * @param {import("../lib/@types/FishingEvent").FishBiteEvent} event
 */
function enqueueBite(event) {
  const player = event.player;
  if (!player?.isValid) return;
  if (!isAutoFishing(player.id)) return;

  if (isPlayerTripped(player.id)) {
    const lang = meow.getPlayerSetting(player, "language");
    player.sendMessage(meow.getLocalizedText("circuit_breaker_tripped", lang));
    return;
  }

  const hook = event.hook;
  const validHook = hook?.isValid ? hook : null;
  let hookLocation;
  try {
    hookLocation = validHook?.location
      ? {
          x: validHook.location.x,
          y: validHook.location.y,
          z: validHook.location.z,
        }
      : {
          x: player.location.x,
          y: player.location.y,
          z: player.location.z,
        };
  } catch (_) {
    hookLocation = {
      x: player.location.x,
      y: player.location.y,
      z: player.location.z,
    };
  }

  /** @type {PendingSettlement} */
  const pending = {
    player,
    hook: validHook,
    dimension: validHook?.dimension ?? player.dimension,
    selectedSlotIndex: player.selectedSlotIndex,
    hookLocation,
    biomeId: event.biome?.id,
    isBesideWater: !!event.isBesideWater,
    attempts: 0,
    settlement: null,
    lootResults: undefined,
    spawnedLoot: new Set(),
    maxRarity: 0,
    xp: 0,
    xpFinalized: false,
    diagnosticsDone: false,
    effectsDone: false,
  };

  let queue = pendingByPlayer.get(player.id);
  if (!queue) {
    queue = [];
    pendingByPlayer.set(player.id, queue);
  }
  queue.push(pending);

  // 先同步尝试一次；只有确实没处理完时才启动重试定时器。
  // 正常路径不会创建/清除定时器。
  flushPlayer(player.id);
  if (pendingByPlayer.has(player.id)) ensureRetryLoop();
}
