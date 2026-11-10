/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { LOOT_DATA } from "./LootData.js";
import { LOOT_DATA as LOOT_VANILLA_DATA } from "../lib/meow/LootVanillaData.js";
import { getRndInteger, weightedLottery } from "../lib/meow/Utilities.js";
import { log, warn, logLazy } from "../lib/meow/Logging.js";
import { biomeHasTag } from "../lib/meow/BiomeTags.js";
import { applyEnchantments } from "./LootEnchant.js";
import { conditionsPass } from "./LootConditions.js";

/**
 * @typedef {object} RolledLootEntry
 * @property {mc.ItemStack} item      - 已生成好的物品
 * @property {number} weight          - 该条目在所属池中经幸运修正后的实际权重
 * @property {number} totalWeight     - 所属池在同一幸运等级下的总权重
 * @property {number} rarity          - 珍惜度（>= 1，无上限）
 * @property {number} enchantCount    - 实际成功添加的附魔数量
 * @property {string} tableId         - 直接产出该物品的表 id
 * @property {string} entryId         - 物品条目原始 id
 */

/* ------------------------------ 日志 ------------------------------------ */

/** 已警告过的缺失子表 id，避免重复刷屏 */
const warnedMissingTables = new Set();

/** 已警告过的物品构造失败 id，避免重复刷屏 */
const warnedItemFailures = new Set();

/** 已警告过的 luck 异常，避免重复刷屏 */
let warnedLuckAbnormal = false;

/* ------------------------------ 数值归一化 ------------------------------- */

/**
 * 将任意值归一化为有限的幸运等级。NaN / Infinity / null / undefined / 非数字
 * 一律按 0 处理，避免污染权重计算。
 * @param {any} value
 * @returns {number}
 */
export function normalizeLuck(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * 将任意值归一化为有限的正整数（用于物品数量）。
 * @param {any} value
 * @param {number} [defaultValue=1]
 * @returns {number}
 */
function normalizeCount(value, defaultValue = 1) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  return defaultValue;
}

/* ------------------------------ 静态缓存 --------------------------------- */

let tables = null;
let vanillaTables = null;
let entryCache = new WeakMap();
const tableResolveCache = new Map();
const itemIdCache = new Map();

/* --------------------------- 缓存构建 / 失效  ---------------------------- */

function buildTables() {
  tables = LOOT_DATA.pools || {};
  vanillaTables = LOOT_VANILLA_DATA.pools || {};
}

function getTables() {
  if (!tables) buildTables();
  return tables;
}

function getVanillaTables() {
  if (!vanillaTables) buildTables();
  return vanillaTables;
}

export function findTable(id) {
  return getTables()[id] ?? getVanillaTables()[id] ?? null;
}

/* ------------------------------ 基础工具 --------------------------------- */

export function resolveCount(spec, defaultValue = 1) {
  if (spec === null || spec === undefined) return defaultValue;
  if (typeof spec === "number") return Number.isFinite(spec) ? spec : defaultValue;
  if (typeof spec === "object") {
    const min = spec.min ?? defaultValue;
    const max = spec.max ?? min;
    return getRndInteger(min, max);
  }
  return defaultValue;
}





function normalizeItemId(id) {
  if (!id) return id;
  let v = itemIdCache.get(id);
  if (v === undefined) {
    v = id.includes(":") ? id : `minecraft:${id}`;
    itemIdCache.set(id, v);
  }
  return v;
}

/* ---------------------------- 表查找 / 条件匹配 --------------------------- */

export function getLootTable(tableId) {
  return findTable(tableId);
}

export function resolveFishingTable(context = {}) {
  const hook = LOOT_DATA.fishing_hook ?? LOOT_VANILLA_DATA.fishing_hook;
  if (!hook) return null;

  const dimensionId = context.dimensionId ?? context.dimension ?? "";
  const biomeRaw = context.biomeId ?? context.biome ?? "";
  const biome = typeof biomeRaw === "string" && biomeRaw.includes(":")
    ? biomeRaw.slice(biomeRaw.indexOf(":") + 1)
    : biomeRaw;

  const extraKeys = Object.keys(context).filter(
    k => k !== "dimensionId" && k !== "dimension" && k !== "biomeId" && k !== "biome"
  );
  const cacheable = extraKeys.length === 0;
  const cacheKey = `${dimensionId}|${biome}`;

  if (cacheable) {
    const cached = tableResolveCache.get(cacheKey);
    if (cached !== undefined) return cached;
  }

  const conds = Array.isArray(hook.conditions) ? hook.conditions : [];
  let bestTable = null;
  let bestScore = -1;

  for (const cond of conds) {
    if (!cond || !cond.table) continue;

    let score = 0;
    let matched = true;

    for (const [key, value] of Object.entries(cond)) {
      if (key === "id" || key === "table") continue;
      if (value === null || value === undefined || value === "any") continue;

      // 数据里的 biome 既可写群系 id，也可写群系标签（如 jungle 命中全部丛林群系）
      // 标签表见 lib/meow/BiomeTags.js
      if (key === "biome") {
        if (biome !== value && !biomeHasTag(biome, value)) {
          matched = false;
          break;
        }
        score++;
        continue;
      }

      const ctxValue = key === "dimension"
        ? context.dimensionId ?? context.dimension
        : context[key];

      if (ctxValue !== value) {
        matched = false;
        break;
      }
      score++;
    }

    if (matched && score > bestScore) {
      bestScore = score;
      bestTable = cond.table;
    }
  }

  const result = bestTable ?? hook.base_table ?? null;
  if (cacheable) tableResolveCache.set(cacheKey, result);
  return result;
}

/* ----------------------- 权重抽取（带缓存 + 回退） -------------------------- */

/**
 * 构建某一 luck 等级下的有效条目与权重。
 * @returns {{items: any[], weights: number[], total: number} | null}
 */
function buildEntryPool(entries, luck) {
  const items = [];
  const weights = [];
  let total = 0;

  for (const e of entries) {
    if (!e || e.type === "empty") continue;
    const w = (e.weight ?? 0) + (e.quality ?? 0) * luck;
    if (w > 0 && Number.isFinite(w)) {
      items.push(e);
      weights.push(w);
      total += w;
    }
  }

  return total > 0 ? { items, weights, total } : null;
}

/**
 * 获取某一 entries 数组在指定幸运等级下的有效条目与权重。
 * 若指定 luck 下无有效条目，自动回退到 luck=0 重算。
 * luckLevel 会先做归一化，避免 NaN 污染权重。
 * @returns {{items: any[], weights: number[], total: number} | null}
 */
function getEntryPool(entries, luckLevel) {
  const luck = normalizeLuck(luckLevel);

  let byLuck = entryCache.get(entries);
  if (!byLuck) {
    byLuck = new Map();
    entryCache.set(entries, byLuck);
  }
  let pool = byLuck.get(luck);
  if (pool !== undefined) return pool;

  pool = buildEntryPool(entries, luck);

  // 回退：指定 luck 下无有效条目时，用 luck=0 重算
  if (!pool && luck !== 0) {
    log(`[loot/table] luck=${luck} 下无有效条目，回退到 luck=0`);
    pool = buildEntryPool(entries, 0);
  }

  byLuck.set(luck, pool);
  return pool;
}

function pickEntry(entries, luckLevel) {
  const pool = getEntryPool(entries, luckLevel);
  if (!pool) return null;
  const entry = weightedLottery(pool.items, pool.weights, pool.total);
  if (!entry) return null;
  const index = pool.items.indexOf(entry);
  return {
    entry,
    weight: pool.weights[index],
    totalWeight: pool.total,
  };
}

function applyDurability(item, durability) {
  if (durability === undefined || durability === null) return;
  const dur = item.getComponent("minecraft:durability");
  if (!dur) return;
  // 兼容 {min,max} 与固定数字；数值表示“剩余耐久比例”（与原版 set_damage 一致）
  const min = typeof durability === "number" ? durability : durability.min ?? 0;
  const max = typeof durability === "number" ? durability : durability.max ?? min;
  const lo = Math.max(0, Math.min(1, Math.min(min, max)));
  const hi = Math.max(0, Math.min(1, Math.max(min, max)));
  const remain = lo + Math.random() * (hi - lo);
  dur.damage = Math.floor(dur.maxDurability * (1 - remain));
}

/* ------------------------------ 珍惜度 ----------------------------------- */

function computeRarity(weight, totalWeight, enchantCount, layerRatio) {
  const ratio = totalWeight > 0 ? weight / totalWeight : 1;

  let rarity;
  if (ratio >= 0.2) rarity = 1;
  else if (ratio >= 0.06) rarity = 2;
  else if (ratio >= 0.01) rarity = 3;
  else rarity = 4;

  // if (layerRatio < 0.10) rarity += 1;
  if (enchantCount >= 1) rarity += 1;
  if (enchantCount >= 3) rarity += 1;
  if (enchantCount >= 5) rarity += 1;

  return rarity;
}

/* ------------------------------ 递归掷表 --------------------------------- */

function rollTableInternal(table, tableId, options, depth, layerRatio) {
  /** @type {RolledLootEntry[]} */
  const results = [];
  if (!table || depth > 8) return results;

  // 归一化幸运等级，避免 NaN 污染权重
  const luckLevel = normalizeLuck(options.luckLevel);

  // 条件求值上下文：钓鱼场景下由调用方提供玩家、鱼竿与难度
  const conditionCtx = {
    player: options.player,
    tool: options.tool,
    looting: options.looting,
    difficulty: options.difficulty,
  };

  for (const pool of table.pools || []) {
    // 池级条件：任一不满足则整池跳过
    if (!conditionsPass(pool.conditions, conditionCtx)) continue;

    const rolls = resolveCount(pool.rolls, 1);
    const bonus = resolveCount(pool.bonus_rolls, 0);
    const totalRolls = rolls + bonus;
    const allEntries = pool.entries || [];
    // 仅在条目带条件时才过滤，未带条件时保留原数组以复用权重缓存
    const entries = allEntries.some(e => Array.isArray(e?.conditions) && e.conditions.length > 0)
      ? allEntries.filter(e => conditionsPass(e?.conditions, conditionCtx))
      : allEntries;
    if (totalRolls <= 0 || entries.length === 0) continue;

    // 计算本池 luck=0 基准总权重，用于子表层占比
    let baseTotal = 0;
    for (const e of entries) {
      if (!e || e.type === "empty") continue;
      const w = e.weight ?? 0;
      if (w > 0) baseTotal += w;
    }

    for (let i = 0; i < totalRolls; i++) {
      let picked = pickEntry(entries, luckLevel);

      // 层内兜底：指定 luck 下 pick 失败时，强制用 luck=0 再 pick 一次
      if (!picked && luckLevel !== 0) {
        picked = pickEntry(entries, 0);
        if (picked) {
          log(`[loot/table] ${tableId} 在 luck=${luckLevel} 下 pick 失败，已用 luck=0 兜底`);
        }
      }

      if (!picked) {
        if (!warnedLuckAbnormal) {
          warnedLuckAbnormal = true;
          warn(
            `战利品池掷取失败: "${tableId}" ` +
            `（luckLevel 原始值=${JSON.stringify(options.luckLevel)}，类型=${typeof options.luckLevel}，` +
            `归一化后=${luckLevel}，entries=${entries.length}）`
          );
        }
        continue;
      }

      const entry = picked.entry;

      // 子表判定：直接 findTable(entry.id)，不依赖 type 字段
      const subTable = typeof entry.id === "string" ? findTable(entry.id) : null;
      if (subTable) {
        const baseRatio = baseTotal > 0 ? (entry.weight ?? 0) / baseTotal : 1;
        const childLayer = layerRatio * baseRatio;
        const childResults = rollTableInternal(subTable, entry.id, options, depth + 1, childLayer);
        if (childResults.length === 0) {
          log(`[loot/table] 子表 "${entry.id}" 掷表返回空（父表 ${tableId}）`);
        }
        results.push(...childResults);
        continue;
      }

      // 显式声明为子表但找不到
      if (entry.type === "loot_table") {
        if (!warnedMissingTables.has(entry.id)) {
          warnedMissingTables.add(entry.id);
          warn(
            `战利品子表无法解析: "${entry.id}"（来自 ${tableId}）` +
            `。请检查 LootData.js 和 LootVanillaData.js 是否包含该表。`
          );
        }
        continue;
      }

      // 物品
      if (!entry.id || entry.id === "empty") continue;

      const id = normalizeItemId(entry.id);
      const rawCount = resolveCount(entry.count, 1);
      const count = normalizeCount(rawCount, 1);

      logLazy(() =>
        `[loot/table] 生成 ${id} x${count} enchantments=${JSON.stringify(entry.enchantments)}`
      );

      let item = null;
      try {
        item = new mc.ItemStack(id, count);
      } catch (err) {
        // 物品构造失败：不再静默跳过，按 id 去重输出一次
        if (!warnedItemFailures.has(id)) {
          warnedItemFailures.add(id);
          warn(
            `物品构造失败: id="${id}" count=${count}（原始 ${JSON.stringify(rawCount)}）` +
            `，来自表 "${tableId}"。错误: ${err?.message ?? err}`
          );
        }
        continue;
      }
      if (!item) continue;

      try { applyDurability(item, entry.durability); } catch (_) {}

      let enchantCount = 0;
      try { enchantCount = applyEnchantments(item, entry.enchantments); }
      catch (err) { log("[loot/table] 附魔处理异常:", err); }

      try { if (entry.name) item.nameTag = entry.name; } catch (_) {}

      const rarity = computeRarity(picked.weight, picked.totalWeight, enchantCount, layerRatio);

      results.push({
        item,
        weight: picked.weight,
        totalWeight: picked.totalWeight,
        rarity,
        enchantCount,
        tableId,
        entryId: entry.id,
      });
    }
  }

  return results;
}

/* ------------------------------ 公共 API -------------------------------- */

/**
 * 掷取战利品表。先查主数据（LootData），再查底牌（LootVanillaData）。
 * 返回的每个条目均携带 weight / totalWeight / rarity / enchantCount。
 * 结果为空时会在控制台输出原始 luckLevel 信息，便于排查。
 * @param {string} tableId
 * @param {object} [options]
 * @returns {RolledLootEntry[] | null}
 */
export function rollLootTable(tableId, options = {}) {
  const table = findTable(tableId);
  if (!table) return null;
  const results = rollTableInternal(table, tableId, options, 0, 1);

  if (results.length === 0) {
    warn(
      `表 "${tableId}" 掷表结果为空。` +
      `luckLevel 原始值=${JSON.stringify(options.luckLevel)}（类型=${typeof options.luckLevel}），` +
      `归一化后=${normalizeLuck(options.luckLevel)}。` +
      `若诊断显示数据正常，请检查上方是否出现「物品构造失败」警告。`
    );
  }

  return results;
}
