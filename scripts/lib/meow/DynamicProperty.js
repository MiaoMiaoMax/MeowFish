/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { Settings } from "../../SystemSettings.js";
import { error } from "./Logging.js";

/**
 * 每个设置项的元信息。**这是唯一的权威定义**：
 *   - default：默认值。函数形式会在每次读取时惰性求值，
 *     因此运行期对 Settings 的修改（如 main.js 里语言回退）会立刻生效。
 *   - normalize：可选，读取时的钳制 / 修正。只作用于返回值，不写回缓存。
 *
 * 键名集合（即 SETTING_KEYS）由本表派生，新增设置只需在这里加一行。
 *
 * 注意：动态属性存储键为 "meow_" + 本表键名。
 */
const SETTING_META = {
  // 基础
  language:        { default: () => Settings.language },
  protect:         { default: () => Boolean(Settings.protect) },
  replace:         { default: () => Boolean(Settings.replace) },
  compulsoryAuto:  { default: () => Boolean(Settings.compulsory_auto) },
  reduceSinking:   { default: () => Boolean(Settings.reduce_sinking) },
  tip:             { default: () => Boolean(Settings.tip) },
  // jungleLoot:      { default: false },

  // 行为
  lootMode:        { default: 0 },
  particleMode:    {
    default: 2,
    // fancy_particle 关闭时把 3 钳回 2；若已存 3 而开关被关，界面不会越界
    normalize: v => Math.min(v, Settings.fancy_particle ? Number.MAX_SAFE_INTEGER : 2),
  },
  volume:          {
    default: 1,
    normalize: v => Math.max(0, Math.min(v, 1)),
  },

  // 筛选
  lootFilter:       { default: undefined },
  lootFilterSwitch: { default: 0 },
};

/** 所有动态属性键（不含 "meow_" 前缀） */
const SETTING_KEYS = Object.keys(SETTING_META);

/**
 * 缓存结构：playerId -> { data, timestamp }
 * 用 Map 而非 WeakMap —— Player 对象在换维度 / 重连后引用会变，
 * WeakMap 不会迁移缓存；playerId 是稳定字符串，通过 playerLeave 清理。
 * @type {Map<string, {data: Record<string, any>, timestamp: number}>}
 */
const cache = new Map();

/** 缓存兜底存活时间：绕过 setPlayerSetting 直接改属性时，最多 1 分后自动刷新 */
const CACHE_TTL_MS = 60000;

/**
 * 从玩家身上加载全部设置（不应用默认值）
 * @param {import("@minecraft/server").Player} player
 * @returns {Record<string, any>}
 */
function loadAllSettings(player) {
  const data = {};
  for (const key of SETTING_KEYS) {
    try {
      const value = player.getDynamicProperty(`meow_${key}`);
      if (value !== undefined) data[key] = value;
    } catch (_) {
      // 玩家可能已失效，静默忽略
    }
  }
  return data;
}

/**
 * 获取玩家的所有设置（带缓存，**原始值**，不含默认）
 * 一般业务不应直接用，除非需要区分"未设置"与"等于默认"。
 * @param {import("@minecraft/server").Player} player
 * @returns {Record<string, any>}
 */
export function getPlayerSettings(player) {
  if (!player?.isValid) return {};
  const id = player.id;
  const cached = cache.get(id);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) return cached.data;

  const data = loadAllSettings(player);
  cache.set(id, { data, timestamp: now });
  return data;
}

/**
 * 获取单个设置的**生效值**（原始值 → 否则 default → 再 normalize）
 *
 * 默认值与钳制逻辑都在 SETTING_META 里。
 *
 * @param {import("@minecraft/server").Player} player
 * @param {keyof typeof SETTING_META} key
 * @returns {any}
 */
export function getPlayerSetting(player, key) {
  const meta = SETTING_META[key];
  if (!meta) {
    // 未知键：抛错比静默返回 undefined 更好，能立刻发现拼写错误
    throw new Error(`[MeowFish] Unknown setting key: "${String(key)}"`);
  }
  const raw = getPlayerSettings(player)[key];
  const def = typeof meta.default === "function" ? meta.default() : meta.default;
  const value = raw !== undefined ? raw : def;
  return meta.normalize ? meta.normalize(value) : value;
}

/**
 * 判断玩家是否**显式设置过**某个键
 * 用于需要区分"用户没设"与"用户设成了默认值"的场景（如 TipManager）。
 * @param {import("@minecraft/server").Player} player
 * @param {keyof typeof SETTING_META} key
 * @returns {boolean}
 */
export function hasPlayerSetting(player, key) {
  return getPlayerSettings(player)[key] !== undefined;
}

/**
 * 写入单个设置并同步更新缓存
 * - 传 undefined 表示删除该属性（恢复默认）
 * - 写入不做 normalize，读取时由 SETTING_META.normalize 决定
 * @param {import("@minecraft/server").Player} player
 * @param {keyof typeof SETTING_META} key
 * @param {any} value
 */
export function setPlayerSetting(player, key, value) {
  if (!player?.isValid) return;
  if (!SETTING_META[key]) {
    error(`setPlayerSetting: unknown key "${String(key)}"`);
    return;
  }
  const propKey = `meow_${key}`;
  try {
    player.setDynamicProperty(propKey, value);
  } catch (e) {
    error("setPlayerSetting failed:", propKey, e);
    return;
  }

  const id = player.id;
  const entry = cache.get(id);
  if (entry) {
    if (value === undefined) delete entry.data[key];
    else entry.data[key] = value;
    entry.timestamp = Date.now();
  }
}

/**
 * 使某个玩家的缓存失效
 * 仅当你**绕过 setPlayerSetting 直接写动态属性**时需要调用。
 * @param {import("@minecraft/server").Player} player
 */
export function invalidatePlayerSettings(player) {
  if (player?.id) cache.delete(player.id);
}

/** 清空所有玩家缓存（全局重置用） */
export function clearAllPlayerSettingsCache() {
  cache.clear();
}

// 玩家离开时清理缓存，避免 Map 无限增长
mc.world.beforeEvents.playerLeave.subscribe(event => {
  if (event.player?.id) cache.delete(event.player.id);
});

/**
 * 清除玩家所有 MeowFish 个人设置，恢复到服务器默认值。
 *
 * - 仅清除 `meow_` 前缀的动态属性，不影响其他模组的数据
 * - 同步失效该玩家的设置缓存，下次读取会自动按默认值重新构建
 * - 不会触碰 CircuitBreaker 等安全状态（安全机制不应被"重置设置"绕过）
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {number} 实际成功清除的键数量
 */
export function resetAllPlayerSettings(player) {
  if (!player?.isValid) return 0;
  let cleared = 0;
  for (const key of SETTING_KEYS) {
    try {
      player.setDynamicProperty(`meow_${key}`, undefined);
      cleared++;
    } catch (e) {
      error(`resetAllPlayerSettings failed: meow_${key}`, e);
    }
  }
  invalidatePlayerSettings(player);
  return cleared;
}
