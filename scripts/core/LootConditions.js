/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 战利品表条件求值。
 *
 * 支持原版文档中的数值/工具类条件：
 * - random_chance
 * - random_chance_with_looting
 * - random_difficulty_chance
 * - random_regional_difficulty_chance
 * - match_tool（item / count / durability / enchantments / 标签过滤）
 *
 * 字段格式以官方文档为准：
 * - count / durability / levels 使用 range_min / range_max，只写一端时另一端不设限；
 * - durability 比较的是剩余耐久点数（maxDurability - damage），不是比例；
 * - match_tool 的标签过滤为 minecraft:match_tool_filter_any / _all / _none。
 *
 * 实体类条件（has_variant、has_mark_variant、killed_by_*、entity_killed 等）
 * 在钓鱼场景下由调用方通过 context 提供；缺省时按通过处理，避免吞掉掉落。
 * 未知条件只警告一次并按通过处理，导出侧应保留原始条件而不是静默丢弃。
 *
 * random_regional_difficulty_chance 的乘数无法从脚本 API 完整还原：官方没有公开
 * Bedrock 的乘数公式，且脚本读不到区块累计停留时间。estimateRegionalDifficulty()
 * 按 Java 的 regional difficulty 公式估算（难度 + 总白天时间 + 月相 + 可选停留时间），
 * 再转成 0..1 的 clamped 值；调用方可用 ctx.regionalDifficulty 覆盖。
 */

import { world as defaultWorld } from "@minecraft/server";
import { warn } from "../lib/meow/Logging.js";

const warnedUnknown = new Set();

function num(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeId(id) {
  if (typeof id !== "string" || id.length === 0) return id;
  return id.includes(":") ? id : `minecraft:${id}`;
}

/**
 * 解析原版数值范围。数字视为精确值；对象读取 range_min/range_max，
 * 同时兼容旧数据里的 min/max。只给一端时另一端不设限。
 */
function rangeOf(value) {
  if (typeof value === "number") {
    return { min: value, max: value };
  }
  if (!value || typeof value !== "object") return null;
  const rawMin = value.range_min ?? value.min;
  const rawMax = value.range_max ?? value.max;
  if (rawMin === undefined && rawMax === undefined) return null;
  const min = num(rawMin, 0);
  const max = num(rawMax, Infinity);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function itemHasTag(tool, tag) {
  try {
    return typeof tool?.hasTag === "function" ? !!tool.hasTag(tag) : false;
  } catch (_) {
    return false;
  }
}

function remainingDurability(tool) {
  try {
    const dur = tool.getComponent("minecraft:durability");
    if (!dur || typeof dur.maxDurability !== "number") return null;
    return Math.max(0, dur.maxDurability - num(dur.damage, 0));
  } catch (_) {
    return null;
  }
}

function toolEnchantments(tool) {
  try {
    const enc = tool.getComponent("minecraft:enchantable");
    const list = enc?.getEnchantments?.();
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function matchTool(cond, tool) {
  if (!tool) return false;

  // 官方用 item（单数）；同时兼容部分数据里的 items 数组
  const itemIds = Array.isArray(cond.items)
    ? cond.items
    : cond.item !== undefined
      ? [cond.item]
      : [];
  if (
    itemIds.length > 0 &&
    !itemIds.some(
      (id) => normalizeId(id) === normalizeId(tool.typeId) || itemHasTag(tool, id),
    )
  ) {
    return false;
  }

  if (cond.count !== undefined) {
    const range = rangeOf(cond.count);
    const count = num(tool.amount, 1);
    if (!range || count < range.min || count > range.max) return false;
  }

  if (cond.durability !== undefined) {
    const range = rangeOf(cond.durability);
    const remaining = remainingDurability(tool);
    if (!range || remaining === null) return false;
    if (remaining < range.min || remaining > range.max) return false;
  }

  if (Array.isArray(cond.enchantments) && cond.enchantments.length > 0) {
    const list = toolEnchantments(tool);
    for (const want of cond.enchantments) {
      const id = want?.enchantment ?? want?.id ?? want?.type;
      if (!id) continue;
      const found = list.find(e => normalizeId(e.type?.id ?? e.type) === normalizeId(id));
      if (!found) return false;
      const levels = rangeOf(want.levels ?? want.level);
      if (levels) {
        const level = num(found.level, 0);
        if (level < levels.min || level > levels.max) return false;
      }
    }
  }

  const filterAny = cond["minecraft:match_tool_filter_any"];
  const filterAll = cond["minecraft:match_tool_filter_all"];
  const filterNone = cond["minecraft:match_tool_filter_none"];
  if (Array.isArray(filterAny) && filterAny.length > 0 && !filterAny.some(tag => itemHasTag(tool, tag))) return false;
  if (Array.isArray(filterAll) && filterAll.length > 0 && !filterAll.every(tag => itemHasTag(tool, tag))) return false;
  if (Array.isArray(filterNone) && filterNone.some(tag => itemHasTag(tool, tag))) return false;

  return true;
}

function lootingLevel(tool) {
  const found = toolEnchantments(tool).find(e => {
    const id = e.type?.id ?? e.type;
    return id === "looting" || id === "minecraft:looting";
  });
  return found ? num(found.level, 0) : 0;
}

/**
 * world.getDifficulty() 返回 "Peaceful"/"Easy"/"Normal"/"Hard"，
 * 而条件对象的键是小写，所以统一转小写。
 */
function difficultyKey(ctx) {
  const value = ctx.difficulty;
  return typeof value === "string" && value.length > 0 ? value.toLowerCase() : "normal";
}

/**
 * 估算区域难度（clamped regional difficulty，0..1）。
 *
 * 依据 Java 版公开公式（Bedrock 未公开乘数，只能近似）：
 *   dayFactor   = clamp((totalDaytime - 72000) / 5760000, 0, 0.25)
 *   chunkFactor = clamp(inhabitedTicks / 3600000, 0, 1)
 *   普通/简单：chunkFactor *= 0.75
 *   chunkFactor += min(dayFactor, moonFullness / 4)
 *   简单：chunkFactor *= 0.5
 *   regional = 0.75 + dayFactor + chunkFactor
 *   普通 ×2，困难 ×3，和平 = 0
 * 返回 (regional - 2) / 2 并截断到 0..1；options.raw 为 true 时返回 regional。
 *
 * 脚本 API 没有区块累计停留时间（inhabitedTicks），默认 0，调用方可传入实测/估算值。
 * 月相使用 world.getMoonPhase()（0=满月，4=新月），
 * fullness = 1 - min(phase, 8 - phase) / 4（满月 1、新月 0）。
 *
 * @param {object} [options]
 * @param {string} [options.difficulty] 覆盖 world.getDifficulty()
 * @param {number} [options.day] 覆盖 world.getDay()
 * @param {number} [options.timeOfDay] 覆盖 world.getTimeOfDay()
 * @param {number} [options.moonPhase] 覆盖 world.getMoonPhase()
 * @param {number} [options.inhabitedTicks] 区块累计加载 tick，默认 0
 * @param {object} [options.world] 覆盖默认 world（测试用）
 * @param {boolean} [options.raw] 返回未截断的 regional difficulty
 * @returns {number}
 */
export function estimateRegionalDifficulty(options = {}) {
  const w = options.world ?? defaultWorld;
  const difficulty = String(
    options.difficulty ?? readWorld(() => w.getDifficulty(), "normal")
  ).toLowerCase();
  if (difficulty === "peaceful") return 0;

  const day = num(options.day ?? readWorld(() => w.getDay(), 0));
  const timeOfDay = num(options.timeOfDay ?? readWorld(() => w.getTimeOfDay(), 0));
  const moonPhase = num(options.moonPhase ?? readWorld(() => w.getMoonPhase(), 0));
  const inhabitedTicks = Math.max(0, num(options.inhabitedTicks, 0));

  const totalDaytime = day * 24000 + timeOfDay;
  const dayFactor = clamp((totalDaytime - 72000) / 5760000, 0, 0.25);
  const phase = Math.floor(moonPhase) % 8;
  const moonFullness = 1 - Math.min(phase, 8 - phase) / 4;

  let chunkFactor = clamp(inhabitedTicks / 3600000, 0, 1);
  if (difficulty === "normal" || difficulty === "easy") chunkFactor *= 0.75;
  chunkFactor += Math.min(dayFactor, moonFullness / 4);
  if (difficulty === "easy") chunkFactor *= 0.5;

  let regional = 0.75 + dayFactor + chunkFactor;
  if (difficulty === "normal") regional *= 2;
  else if (difficulty === "hard") regional *= 3;

  if (options.raw) return regional;
  return clamp01((regional - 2) / 2);
}

function readWorld(read, fallback) {
  try {
    const value = read();
    return value === undefined ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

/**
 * 原版区域难度乘数。调用方可传 ctx.regionalDifficulty（0..1）精确指定；
 * 否则用 estimateRegionalDifficulty() 估算（停留时间默认为 0）。
 */
function regionalDifficultyFactor(ctx) {
  const supplied = ctx.regionalDifficulty;
  if (typeof supplied === "number" && Number.isFinite(supplied)) return clamp01(supplied);
  return estimateRegionalDifficulty({
    world: ctx.world,
    difficulty: ctx.difficulty,
    day: ctx.day,
    timeOfDay: ctx.timeOfDay,
    moonPhase: ctx.moonPhase,
    inhabitedTicks: ctx.inhabitedTicks,
  });
}

function conditionPass(cond, ctx) {
  if (!cond) return true;
  if (typeof cond === "string") {
    if (!warnedUnknown.has(cond)) {
      warnedUnknown.add(cond);
      warn(`[loot/conditions] 条件 "${cond}" 缺少完整参数，按通过处理`);
    }
    return true;
  }

  const name = cond.condition || cond.test;
  switch (name) {
    case "random_chance":
      return Math.random() < clamp01(num(cond.chance));
    case "random_chance_with_looting": {
      const looting = ctx.looting ?? lootingLevel(ctx.tool);
      const chance = num(cond.chance) + num(cond.looting_multiplier) * looting;
      return Math.random() < clamp01(chance);
    }
    case "random_difficulty_chance": {
      const value = cond[difficultyKey(ctx)] ?? cond.default_chance ?? cond.chance ?? 0;
      return Math.random() < clamp01(num(value));
    }
    case "random_regional_difficulty_chance": {
      const chance = num(cond.max_chance) * regionalDifficultyFactor(ctx);
      return Math.random() < clamp01(chance);
    }
    case "match_tool":
      return matchTool(cond, ctx.tool);
    case "has_variant":
    case "has_mark_variant":
    case "killed_by_player":
    case "killed_by_player_or_pets":
    case "killed_by_entity":
    case "entity_killed":
      return ctx[name] !== false;
    default:
      if (!warnedUnknown.has(name)) {
        warnedUnknown.add(name);
        warn(`[loot/conditions] 未支持的条件 "${name}"，按通过处理`);
      }
      return true;
  }
}

/**
 * 条件列表必须全部通过（与原版一致）。
 * @param {any} conditions
 * @param {object} [ctx]
 * @returns {boolean}
 */
export function conditionsPass(conditions, ctx = {}) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every(cond => conditionPass(cond, ctx));
}
