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
import { checkHookWaterStatus } from "../lib/meow/FishingHelper.js";
import { Perf } from "../lib/meow/Perf.js";
import { Settings } from "../SystemSettings.js";

/**
 * 注册所有测试命令（监听 meow:t 脚本事件）
 * @listens mc.system.afterEvents.scriptEventReceive
 */
export function registerTestCommands() {
  if (!Settings.debug) return;
  mc.system.afterEvents.scriptEventReceive.subscribe(event => {
    if (!Settings.debug) return;
    if (event.id !== "meow:t") return;
    const message = event.message.trim();

    // perf 命令允许没有 sourceEntity（VS Code 扩展通过调试器下发），
    // 其余旧命令仍然要求有玩家实体。
    if (message === "perf" || message.startsWith("perf ") || message.startsWith("perfcache")) {
      const tokens = parsePerfTokens(message);
      const player = resolvePerfPlayer(event.sourceEntity, tokens.playerName);
      const result = handlePerf(player, tokens.rest, tokens);
      if (tokens.run) {
        console.warn(
          `[MFCTRL] ACK run=${tokens.run} seq=${tokens.seq} op=${result.op} success=${result.success ? 1 : 0} message=${oneLine(result.message)}`,
        );
      }
      return;
    }

    if (!event.sourceEntity) return;
    const { dimension, location } = event.sourceEntity;
    switch (event.message) {
      case "t":
        console.error(dimension.runCommand("script profiler start").successCount)
        return;
      case "c":
        dimension.runCommand("say 测试：清除 " + event.sourceEntity.nameTag + " 的个人设置");
        event.sourceEntity.clearDynamicProperties();
        return;
      case "tb":
        /**
         * 检查坐标是否落在指定群系内（兼容 @minecraft/server 1.x）
         * @param {import("@minecraft/server").Dimension} dimension
         * @param {{x:number,y:number,z:number}} pos
         * @param {string} biomeId 例如 "minecraft:jungle"
         */
        function isInBiome(dimension, pos, biomeId) {
          const x = Math.floor(pos.x);
          const y = Math.floor(pos.y);
          const z = Math.floor(pos.z);
          try {
            // time add 0 是无副作用的“哨兵”，保证 run 子句永远执行成功
            const r = dimension.runCommand(
              `execute if biome ${x} ${y} ${z} ${biomeId} run time add 0`
            );
            return r.successCount > 0;
          } catch (_) {
            return false;
          }
        }
        const biomeId = isInBiome(event.sourceEntity.dimension, event.sourceEntity.location, "minecraft:jungle")
          ? "minecraft:jungle"
          : undefined;
        console.error("bid:", biomeId);
        return;
      case "v": {
        const locv = meow.Vector3.calculateLocalCoordinates(event.sourceEntity, 1.5, 2, 3);
        // const locv2 = Coordinates.local(event.sourceEntity, 1.5, 2, 3)
        if (meow.Vector3.isSafe(dimension, locv))
          dimension.spawnParticle("minecraft:villager_happy", locv);
        else
          event.sourceEntity.runCommand(`particle minecraft:villager_happy ${locv.x} ${locv.y} ${locv.z}`);
        // if (meow.Vector3.isSafe(dimension, locv2))
        //   dimension.spawnParticle("minecraft:basic_flame_particle", locv2);
        // else
        //   event.sourceEntity.runCommand(`particle minecraft:basic_flame_particle ${locv2.x} ${locv2.y} ${locv2.z}`);
        event.sourceEntity.runCommand("particle minecraft:endrod ^1.5 ^2 ^3");
        return;
      }
      case "i": {
        const selectedSlotIndex = event.sourceEntity.selectedSlotIndex;
        const inventory = event.sourceEntity.getComponent("minecraft:inventory")?.container;
        const item = inventory?.getItem(selectedSlotIndex);
        const enchant = item.getComponent("minecraft:enchantable");
        // meow.error(Object.keys(mc.EnchantmentTypes))
        // const encs = mc.EnchantmentTypes.getAll(); //你敢信在1.21.0，getAll方法是不存在的
        // for (const e of encs) {
        //   console.error(e.id);
        // }
        console.error(enchant.hasEnchantment("vanishing")); //你敢信在1.21.0，如果附魔id有空间命名反而报错，没招了
        return;
      }
      case "l": {
        const itemIdArr = [
          "minecraft:cod", "minecraft:salmon", "minecraft:tropical_fish", "minecraft:pufferfish",
          "minecraft:leather_boots", "minecraft:leather", "minecraft:bone", "minecraft:potion",
          "minecraft:string", "minecraft:fishing_rod", "minecraft:bowl", "minecraft:stick",
          "minecraft:ink_sac", "minecraft:cocoa_beans", "minecraft:tripwire_hook", "minecraft:rotten_flesh",
          "minecraft:bamboo",
          "minecraft:nautilus_shell", "minecraft:waterlily", "minecraft:name_tag", "minecraft:saddle",
          "minecraft:bow", "minecraft:fishing_rod", "minecraft:book"
        ];
        for (const itemId of itemIdArr) {
          event.sourceEntity.sendMessage(meow.getItemTranslation(itemId));
        }
        return;
      }
      case "r": {
        const selectedSlotIndex = event.sourceEntity.selectedSlotIndex;
        const inventory = event.sourceEntity.getComponent("minecraft:inventory")?.container;
        const item = inventory?.getItem(selectedSlotIndex);
        meow.error(meow.activateAdmin(event.sourceEntity.id, event.sourceEntity.nameTag, item.nameTag));
        return;
      }
      case "ga": {
        meow.error(meow.getAdminList());
        return;
      }
      case "cr": {
        mc.world.setDynamicProperty("meow_admin_data");
        return
      }
      case "lb": {
        const r = meow.runCommand(event.sourceEntity, "locate biome minecraft:jungle"); // 除非该世界没有丛林，否则永远为1
        for (const key in r) { 
          meow.error(key + ": " + r[key]);
          if (typeof (r[key]) == "object") for (const keys in r[key]) {
            if (Object.hasOwnProperty.call(r[key], keys)) meow.error(r[key] + ": " + keys + " " + r[key][keys]);
          }
        }
        return;
      }
    }
    const createRod = (nameTag, enchantments = [], damageOffset = 0) => {
      const item = new mc.ItemStack("minecraft:fishing_rod");
      item.nameTag = nameTag;
      const durability = item.getComponent("minecraft:durability");
      if (durability) durability.damage = durability.maxDurability - damageOffset;
      const enchant = item.getComponent("minecraft:enchantable");
      if (enchant) {
        for (const { type, level } of enchantments) {
          enchant.addEnchantment({ type: mc.EnchantmentTypes.get(type), level });
        }
      }
      dimension.spawnItem(item, location);
    };
    createRod("低耐久1", [{ type: "lure", level: 3 }], 3);
    createRod("低耐久2", [{ type: "lure", level: 3 }], 3);
    createRod("低耐久3-经验修补", [{ type: "lure", level: 3 }, { type: "mending", level: 1 }], 3);
    createRod("低耐久4-耐久3", [{ type: "lure", level: 3 }, { type: "unbreaking", level: 3 }], 5);
    createRod("快满耐久5-经验修补", [{ type: "lure", level: 3 }, { type: "mending", level: 1 }], 383);
  });
}

const PERF_EXTERNAL_LEASE_MS = 30000;

/** 外部扩展（VS Code）持有 perf 控制权的租约；租约内拒绝旧的 perf auto */
const perfExternalLease = { runId: "", until: 0 };

/**
 * 从命令中剥离 run=<id> seq=<n> player=<name> 三个扩展参数
 * @param {string} message
 */
function parsePerfTokens(message) {
  let run = "";
  let seq = 0;
  let playerName = "";
  const rest = message
    .replace(/(?:^|\s)(run|seq|player)=(\S+)/g, (_match, key, value) => {
      if (key === "run") run = value;
      else if (key === "seq") seq = Number(value) || 0;
      else playerName = value;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { run, seq, playerName, rest };
}

function resolvePerfPlayer(source, playerName) {
  if (source?.typeId === "minecraft:player") return source;
  if (!playerName) return undefined;
  return mc.world.getAllPlayers().find(p => p.name === playerName || p.nameTag === playerName);
}

function oneLine(text) {
  return String(text ?? "").replace(/[\r\n]+/g, " ").trim();
}

function perfExternalActive(now = Date.now()) {
  return perfExternalLease.runId !== "" && now < perfExternalLease.until;
}

/**
 * perf 子命令：perf on | off | cache 0|1 | bench [player=<name>] | auto
 * | external begin|heartbeat|release，兼容 perfcache 0|1
 * @param {import("@minecraft/server").Player | undefined} player
 * @param {string} message
 * @param {{run?: string, seq?: number}} tokens
 * @returns {{ success: boolean, op: string, message: string }}
 */
function handlePerf(player, message, tokens = {}) {
  const parts = message.split(/\s+/);
  let sub = parts[0];
  let args = parts.slice(1);
  if (sub === "perfcache") {
    sub = "perf";
    args = ["cache", ...args];
  }
  if (sub !== "perf") return { success: false, op: "unknown", message: "unknown command" };

  const cmd = args[0] ?? "help";
  const val = (args[1] ?? "").toLowerCase();
  const chat = text => player?.sendMessage(text);

  if (cmd === "ping") {
    return { success: true, op: "ping", message: "pong" };
  }
  if (cmd === "on") {
    perfAutoToken++;
    Perf.enable();
    chat(`§a[Perf] 开始记录 · 缓存${Perf.cacheOn ? "开启" : "关闭"} · 每 100 次扫描输出一行`);
    return { success: true, op: "on", message: `recording cache=${Perf.cacheOn ? 1 : 0}` };
  }
  if (cmd === "off") {
    perfAutoToken++;
    Perf.disable();
    // 停止测量后恢复默认缓存，避免忘记切回导致离线游玩一直跑无缓存路径
    const restored = !Perf.cacheOn;
    if (restored) Perf.setCache(true);
    chat(`§a[Perf] 已停止记录${restored ? "，缓存已恢复开启" : ""}`);
    return { success: true, op: "off", message: restored ? "stopped; cache restored" : "stopped" };
  }
  if (cmd === "cache") {
    if (val !== "0" && val !== "1") {
      chat("§e[Perf] 用法：/scriptevent meow:t perf cache 0|1");
      return { success: false, op: "cache", message: "usage: cache 0|1" };
    }
    perfAutoToken++;
    Perf.setCache(val === "1");
    chat(`§a[Perf] 缓存已${Perf.cacheOn ? "开启" : "关闭"}${Perf.enabled ? "，已开新 run" : ""}`);
    return {
      success: true,
      op: "cache",
      message: `cache=${Perf.cacheOn ? 1 : 0}${Perf.enabled ? " run-started" : ""}`,
    };
  }
  if (cmd === "bench") {
    perfAutoToken++;
    if (!player) {
      return { success: false, op: "bench", message: "player required: add player=<name>" };
    }
    if (!Perf.enabled) {
      chat("§e[Perf] 先执行 /scriptevent meow:t perf on");
      return { success: false, op: "bench", message: "perf is off" };
    }
    try {
      return { success: true, op: "bench", message: runPerfBench(player) };
    } catch (err) {
      return { success: false, op: "bench", message: `bench failed: ${err?.message ?? err}` };
    }
  }
  if (cmd === "auto") {
    if (perfExternalActive()) {
      chat("§e[Perf] 扩展正在控制 perf（external lease），请先 perf external release");
      return { success: false, op: "auto", message: "external lease active" };
    }
    if (!player) {
      return { success: false, op: "auto", message: "player required" };
    }
    startPerfAuto(player);
    return { success: true, op: "auto", message: "auto started (600s + bench)" };
  }
  if (cmd === "external") {
    const op = val;
    const runId = tokens.run ?? "";
    const now = Date.now();
    if (op === "begin") {
      if (!runId) return { success: false, op: "external", message: "run id required" };
      if (perfExternalActive(now) && perfExternalLease.runId !== runId) {
        return { success: false, op: "external", message: `lease held by ${perfExternalLease.runId}` };
      }
      perfExternalLease.runId = runId;
      perfExternalLease.until = now + PERF_EXTERNAL_LEASE_MS;
      return { success: true, op: "external", message: `lease begin ${runId}` };
    }
    if (op === "heartbeat") {
      if (!perfExternalActive(now) || perfExternalLease.runId !== runId) {
        return { success: false, op: "external", message: "lease not held" };
      }
      perfExternalLease.until = now + PERF_EXTERNAL_LEASE_MS;
      return { success: true, op: "external", message: "lease renewed" };
    }
    if (op === "release") {
      if (perfExternalLease.runId === runId || !perfExternalActive(now)) {
        perfExternalLease.runId = "";
        perfExternalLease.until = 0;
        return { success: true, op: "external", message: "lease released" };
      }
      return { success: false, op: "external", message: "lease not held" };
    }
    return { success: false, op: "external", message: "usage: external begin|heartbeat|release" };
  }
  chat(
    "§e[Perf] 用法：perf on | perf off | perf cache 0|1 | perf bench [player=<name>] | perf auto | perf external begin|heartbeat|release",
  );
  return { success: false, op: cmd, message: "unknown subcommand" };
}

/**
 * 同步微基准：优先在最近的浮漂位置测，找不到浮漂则用玩家脚下
 * @param {import("@minecraft/server").Player} player
 */
function runPerfBench(player) {
  let origin = player.location;
  try {
    const hooks = player.dimension.getEntities({
      type: "minecraft:fishing_hook",
      location: player.location,
      maxDistance: 48,
    });
    if (hooks.length > 0) origin = hooks[0].location;
  } catch (_) {
    // 区块未加载时退回玩家坐标
  }
  const r = Perf.bench(player.dimension, origin, checkHookWaterStatus);
  const summary = `bench ${r.calls} 次判定：无缓存 ${r.msOff}ms（${r.blk} 次方块读取），命中路径 ${r.msOn}ms（${r.hitsOn}/${r.calls} 命中）`;
  player.sendMessage(`§a[Perf] ${summary}`);
  return summary;
}

const PERF_AUTO_PHASE_TICKS = 6000; // 5 分钟 = 6000 tick（20 tps）
let perfAutoToken = 0; // 手动执行 perf 命令或重开 auto 时作废上一轮定时器

/**
 * 自动 A/B：缓存关闭 5 分钟 → 缓存开启 5 分钟 → bench，结束自动停止并恢复缓存
 * @param {import("@minecraft/server").Player} player
 */
function startPerfAuto(player) {
  if (!hasNearbyHook(player)) {
    player.sendMessage("§e[Perf] 未找到浮漂：请先抛竿，等浮漂落水后再执行 perf auto");
    return;
  }
  const token = ++perfAutoToken;
  Perf.disable();
  Perf.setCache(false);
  Perf.enable();
  player.runCommand("script profiler start");
  player.sendMessage("§a[Perf] 自动 A/B 开始：缓存关闭 5 分钟…（结束后自动切换并执行 bench）");
  mc.system.runTimeout(() => {
    if (token !== perfAutoToken) return;
    Perf.setCache(true);
    player.runCommand("script profiler stop");
    player.runCommand("script profiler start");
    if (player?.isValid) player.sendMessage("§a[Perf] 已切换到缓存开启，再测 5 分钟…");
    mc.system.runTimeout(() => {
      if (token !== perfAutoToken) return;
      if (player?.isValid) {
        try {
          runPerfBench(player);
        } catch (_) {
          player.sendMessage("§e[Perf] bench 执行失败：浮漂或区块已卸载");
        }
      }
      Perf.disable();
      Perf.setCache(true);
      if (player?.isValid) {
        player.runCommand("script profiler stop");
        player.sendMessage("§a[Perf] 自动 A/B 完成，缓存已恢复开启；导出 ContentLog 后用分析器打开即可");
      }
    }, PERF_AUTO_PHASE_TICKS);
  }, PERF_AUTO_PHASE_TICKS);
}

/**
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean}
 */
function hasNearbyHook(player) {
  try {
    return (
      player.dimension.getEntities({
        type: "minecraft:fishing_hook",
        location: player.location,
        maxDistance: 48,
      }).length > 0
    );
  } catch (_) {
    return false;
  }
}
