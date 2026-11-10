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

/* ------------------------------ 附魔 id / 附魔池缓存   --------------------- */

const enchantIdCache = new Map();
const enchantPoolCache = new Map();

/** 是否已经提示过「附魔 id 无法解析」 */
let warnedInvalidEnchant = false;

function normalizeEnchantId(id) {
  if (!id) return id;
  let v = enchantIdCache.get(id);
  if (v === undefined) {
    const idx = id.indexOf(":");
    v = idx === -1 ? id : id.slice(idx + 1);
    enchantIdCache.set(id, v);
  }
  return v;
}

function randomIntBelow(maxExclusive) {
  if (maxExclusive <= 0) return 0;
  return getRndInteger(0, maxExclusive - 1);
}

/* ------------------------------ 附魔数据 --------------------------------- */

const ENCHANT_DATA = {
  "protection":            { weight: 10, maxLevel: 4, ranges: { 1: [1, 12],  2: [12, 23], 3: [23, 34], 4: [34, 45] } },
  "fire_protection":       { weight: 5,  maxLevel: 4, ranges: { 1: [10, 22], 2: [18, 30], 3: [26, 38], 4: [34, 46] } },
  "feather_falling":       { weight: 5,  maxLevel: 4, ranges: { 1: [5, 15],  2: [11, 21], 3: [17, 27], 4: [23, 33] } },
  "blast_protection":      { weight: 2,  maxLevel: 4, ranges: { 1: [5, 17],  2: [13, 25], 3: [21, 33], 4: [29, 41] } },
  "projectile_protection": { weight: 5,  maxLevel: 4, ranges: { 1: [3, 18],  2: [9, 24],  3: [15, 30], 4: [21, 36] } },
  "respiration":           { weight: 2,  maxLevel: 3, ranges: { 1: [10, 40], 2: [20, 50], 3: [30, 60] } },
  "aqua_affinity":         { weight: 2,  maxLevel: 1, ranges: { 1: [1, 41] } },
  "thorns":                { weight: 1,  maxLevel: 3, ranges: { 1: [10, 60], 2: [30, 80], 3: [50, 100] } },
  "depth_strider":         { weight: 2,  maxLevel: 3, ranges: { 1: [10, 25], 2: [20, 35], 3: [30, 45] } },
  "frost_walker":          { weight: 2,  maxLevel: 2, ranges: { 1: [10, 25], 2: [20, 35] }, treasure: true },

  "binding":               { weight: 1,  maxLevel: 1, ranges: { 1: [25, 50] }, treasure: true },
  "vanishing":             { weight: 1,  maxLevel: 1, ranges: { 1: [25, 50] }, treasure: true },

  "sharpness":             { weight: 10, maxLevel: 5, ranges: { 1: [1, 21],  2: [12, 32], 3: [23, 43], 4: [34, 54], 5: [45, 65] } },
  "smite":                 { weight: 5,  maxLevel: 5, ranges: { 1: [1, 16],  2: [11, 26], 3: [21, 36], 4: [31, 46], 5: [41, 56] } },
  "bane_of_arthropods":    { weight: 5,  maxLevel: 5, ranges: { 1: [1, 16],  2: [11, 26], 3: [21, 36], 4: [31, 46], 5: [41, 56] } },
  "knockback":             { weight: 5,  maxLevel: 2, ranges: { 1: [1, 51],  2: [40, 90] } },
  "fire_aspect":           { weight: 2,  maxLevel: 2, ranges: { 1: [10, 60], 2: [30, 80] } },
  "looting":               { weight: 2,  maxLevel: 3, ranges: { 1: [15, 65], 2: [24, 74], 3: [33, 83] } },

  "efficiency":            { weight: 10, maxLevel: 5, ranges: { 1: [1, 51],  2: [11, 61], 3: [21, 71], 4: [31, 81], 5: [41, 91] } },
  "silk_touch":            { weight: 1,  maxLevel: 1, ranges: { 1: [15, 65] } },
  "fortune":               { weight: 2,  maxLevel: 3, ranges: { 1: [15, 65], 2: [24, 74], 3: [33, 83] } },
  "unbreaking":            { weight: 5,  maxLevel: 3, ranges: { 1: [5, 61],  2: [13, 71], 3: [21, 81] } },
  "mending":               { weight: 1,  maxLevel: 1, ranges: { 1: [25, 75] }, treasure: true },

  "power":                 { weight: 10, maxLevel: 5, ranges: { 1: [1, 16],  2: [11, 26], 3: [21, 36], 4: [31, 46], 5: [41, 56] } },
  "punch":                 { weight: 2,  maxLevel: 2, ranges: { 1: [12, 37], 2: [32, 57] } },
  "flame":                 { weight: 2,  maxLevel: 1, ranges: { 1: [20, 50] } },
  "infinity":              { weight: 1,  maxLevel: 1, ranges: { 1: [20, 50] } },

  "luck_of_the_sea":       { weight: 5,  maxLevel: 3, ranges: { 1: [15, 61], 2: [24, 71], 3: [33, 81] } },
  "lure":                  { weight: 5,  maxLevel: 3, ranges: { 1: [15, 61], 2: [24, 71], 3: [33, 81] } },

  "loyalty":               { weight: 5,  maxLevel: 3, ranges: { 1: [12, 50], 2: [19, 50], 3: [26, 50] } },
  "impaling":              { weight: 2,  maxLevel: 5, ranges: { 1: [1, 21],  2: [9, 29],  3: [17, 37], 4: [25, 45], 5: [33, 53] } },
  "riptide":               { weight: 2,  maxLevel: 3, ranges: { 1: [17, 50], 2: [24, 50], 3: [31, 50] } },
  "channeling":            { weight: 1,  maxLevel: 1, ranges: { 1: [25, 50] } },

  "multishot":             { weight: 2,  maxLevel: 1, ranges: { 1: [20, 50] } },
  "quick_charge":          { weight: 5,  maxLevel: 3, ranges: { 1: [12, 50], 2: [20, 50], 3: [28, 50] } },
  "piercing":              { weight: 10, maxLevel: 4, ranges: { 1: [1, 50],  2: [11, 50], 3: [21, 50], 4: [31, 50] } },
};

const ITEM_ENCHANT_POOL = {
  "minecraft:fishing_rod": [
    "luck_of_the_sea", "lure", "unbreaking", "mending", "vanishing",
  ],
  "minecraft:bow": [
    "power", "punch", "flame", "infinity", "unbreaking", "mending", "vanishing",
  ],
  "minecraft:enchanted_book": null,
};

const INCOMPATIBILITIES = {
  "protection":            ["fire_protection", "blast_protection", "projectile_protection"],
  "fire_protection":       ["protection", "blast_protection", "projectile_protection"],
  "blast_protection":      ["protection", "fire_protection", "projectile_protection"],
  "projectile_protection": ["protection", "fire_protection", "blast_protection"],
  "sharpness":             ["smite", "bane_of_arthropods"],
  "smite":                 ["sharpness", "bane_of_arthropods"],
  "bane_of_arthropods":    ["sharpness", "smite"],
  "silk_touch":            ["fortune"],
  "fortune":               ["silk_touch"],
  "depth_strider":         ["frost_walker"],
  "frost_walker":          ["depth_strider"],
  "infinity":              ["mending"],
  "mending":               ["infinity"],
  "riptide":               ["loyalty", "channeling"],
  "loyalty":               ["riptide"],
  "channeling":            ["riptide"],
};

/* ------------------------------ 附魔池预展开 ------------------------------ */

function getEnchantPool(itemTypeId, allowTreasure) {
  const key = `${itemTypeId}|${allowTreasure ? 1 : 0}`;
  let pool = enchantPoolCache.get(key);
  if (pool !== undefined) return pool;

  const def = ITEM_ENCHANT_POOL[itemTypeId];
  const rawIds = def === null || def === undefined ? Object.keys(ENCHANT_DATA) : def;
  const list = [];

  for (const rawId of rawIds) {
    const id = normalizeEnchantId(rawId);
    const data = ENCHANT_DATA[id];
    if (!data) continue;
    if (!allowTreasure && data.treasure) continue;
    list.push({
      id,
      weight: data.weight,
      maxLevel: data.maxLevel,
      ranges: data.ranges,
      treasure: Boolean(data.treasure),
    });
  }

  enchantPoolCache.set(key, list);
  return list;
}

/* ------------------------------ 附魔应用 --------------------------------- */

function applyEnchant(enchantable, id, level) {
  const plainId = normalizeEnchantId(id);
  try {
    const t = mc.EnchantmentTypes?.get?.(plainId);
    if (!t) {
      log(`[Enchant-apply] FAIL "${plainId}" lv${level}: EnchantmentTypes.get 返回 undefined`);
      // API 可用却查不到该 id：基本可以确定是 id 写错了（例如误用 Java 版名字）。
      // 只在本次运行提示一次，避免在掷表热路径上刷屏。
      if (!warnedInvalidEnchant && typeof mc.EnchantmentTypes?.get === "function") {
        warnedInvalidEnchant = true;
        warn(
          `附魔 id 无法解析: "${plainId}"，已跳过。` +
          `请确认使用的是基岩版 id（如 binding / vanishing），` +
          `而不是 Java 版（binding_curse / vanishing_curse）。`
        );
      }
      return false;
    }
    enchantable.addEnchantment({ type: t, level });
    log(`[Enchant-apply] OK "${plainId}" lv${level}`);
    return true;
  } catch (e) {
    log(`[Enchant-apply] FAIL "${plainId}" lv${level}: ${e?.message ?? e}`);
    return false;
  }
}

function hasEnchant(enchantable, id) {
  const plainId = normalizeEnchantId(id);
  try { if (enchantable.hasEnchantment(plainId)) return true; } catch (_) {}
  return false;
}

function dumpEnchants(enchantable) {
  try {
    if (typeof enchantable.getEnchantments !== "function") return "<无 getEnchantments>";
    const list = enchantable.getEnchantments();
    if (!Array.isArray(list)) return JSON.stringify(list);
    if (list.length === 0) return "<空>";
    return list.map(e => `${e.type?.id ?? e.type} lv${e.level}`).join(", ");
  } catch (e) {
    return `<读取失败: ${e?.message ?? e}>`;
  }
}

/**
 * 取物品的附魔能力（enchantability）。
 *
 * 数据来源：LootData.enchantability（原版全量 + 模组 items/ 覆盖）。
 * 缺失时回退到底牌数据 LootVanillaData，再回退 1（未知或不可附魔物品）。
 *
 * @param {string} itemTypeId
 * @returns {number}
 */
export function getEnchantability(itemTypeId) {
  return LOOT_DATA.enchantability?.[itemTypeId]
    ?? LOOT_VANILLA_DATA.enchantability?.[itemTypeId]
    ?? 1;
}

function calcEnchantPower(baseLevel, enchantability) {
  const half = Math.floor(enchantability / 4);
  let c = baseLevel + 1 + randomIntBelow(half + 1) + randomIntBelow(half + 1);
  const f = (Math.random() + Math.random() - 1) * 0.15;
  c = Math.round(c * (1 + f));
  return Math.max(1, c);
}

function pickEnchantFor(c, itemTypeId, enchantable, allowTreasure, appliedIds) {
  const pool = getEnchantPool(itemTypeId, allowTreasure);
  const items = [];
  const weights = [];
  let total = 0;

  for (const entry of pool) {
    const id = entry.id;
    if (appliedIds.has(id)) continue;
    if (hasEnchant(enchantable, id)) continue;

    const incompat = INCOMPATIBILITIES[id];
    if (incompat && incompat.some(x => hasEnchant(enchantable, x))) continue;

    let bestLevel = 0;
    for (let lv = entry.maxLevel; lv >= 1; lv--) {
      const range = entry.ranges[lv];
      if (!range) continue;
      if (c >= range[0] && c <= range[1]) { bestLevel = lv; break; }
    }
    if (bestLevel <= 0) continue;

    if (entry.weight > 0) {
      items.push({ id, level: bestLevel });
      weights.push(entry.weight);
      total += entry.weight;
    }
  }

  if (total === 0) return null;
  return weightedLottery(items, weights, total);
}

function applyRandomEnchant(enchantable, itemTypeId, level, allowTreasure) {
  const pool = getEnchantPool(itemTypeId, allowTreasure);
  let c = calcEnchantPower(level, getEnchantability(itemTypeId));
  log(`[Enchant] ${itemTypeId} | base=${level} | c'=${c} | pool=${pool.length}`);

  const appliedIds = new Set();
  let applied = 0;

  for (let iter = 0; iter < 32; iter++) {
    if (c < 1) { log(`[Enchant] c<1 → 结束`); break; }

    const chosen = pickEnchantFor(c, itemTypeId, enchantable, allowTreasure, appliedIds);
    if (!chosen) { log(`[Enchant] c=${c} 无候选 → 结束`); break; }

    log(`[Enchant] pick c=${c} → ${chosen.id} lv${chosen.level}`);
    if (applyEnchant(enchantable, chosen.id, chosen.level)) {
      appliedIds.add(chosen.id);
      applied++;
    }

    c = Math.floor(c / 2);
    if (c < 1) break;
    if (Math.random() >= (c + 1) / 50) { log(`[Enchant] 多魔咒判定停止`); break; }
  }

  if (appliedIds.size === 0) {
    log(`[Enchant] 兜底触发`);
    if (pool.length > 0) {
      const pick = pool[getRndInteger(0, pool.length - 1)];
      if (applyEnchant(enchantable, pick.id, pick.maxLevel)) applied++;
    } else {
      log(`[Enchant] 兜底失败：候选池为空`);
    }
  }

  logLazy(() => `[Enchant] 结束 → 书上实际: ${dumpEnchants(enchantable)}`);
  return applied;
}

export function applyEnchantments(item, enchantments) {
  if (!Array.isArray(enchantments) || enchantments.length === 0) return 0;
  const enchantable = item.getComponent("minecraft:enchantable");
  if (!enchantable) {
    log(`[Enchant] applyEnchantments: ${item.typeId} 无 enchantable，跳过`);
    return 0;
  }

  // 兼容数字与 {min,max} 两种等级写法
  const normalizeLevel = (levels) => {
    if (typeof levels === "number") return levels;
    if (levels && typeof levels === "object") {
      const lo = Math.floor(levels.min ?? 1);
      const hi = Math.floor(levels.max ?? lo);
      return lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    return 30;
  };

  let applied = 0;

  for (const enc of enchantments) {
    try {
      if (enc.type === "levels") {
        const level = normalizeLevel(enc.levels);
        applied += applyRandomEnchant(enchantable, item.typeId, level, enc.treasure !== false);
        continue;
      }
      if (enc.type === "random") {
        // enchant_randomly：随机一个附魔，等级 1 起
        const pool = getEnchantPool(item.typeId, enc.treasure !== false);
        if (pool.length > 0) {
          const pick = pool[getRndInteger(0, pool.length - 1)];
          const level = enc.levels === undefined
            ? getRndInteger(1, pick.maxLevel)
            : Math.max(1, Math.min(pick.maxLevel, normalizeLevel(enc.levels)));
          if (applyEnchant(enchantable, pick.id, level)) applied++;
        }
        continue;
      }
      let list = [];
      if (enc.type === "specific" && Array.isArray(enc.list)) list = enc.list;
      else if (enc.id && enc.level) list = [enc];
      for (const e of list) {
        try {
          const id = e.id ?? e.type;
          if (id && applyEnchant(enchantable, id, e.level)) applied++;
        } catch (_) {}
      }
    } catch (err) {
      log(`[Enchant] 条目处理失败:`, enc, err);
    }
  }

  return applied;
}
