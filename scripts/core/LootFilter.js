/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as meow from "../lib/index.js";
import { Settings } from "../SystemSettings.js";

/**
 * 物品筛选：压缩字符串存储
 * 
 * 存储格式：
 *   "首项|物品1|物品2|物品3"   仅被筛选的物品才填入
 * 
 * 首项含义：
 *   "0" 正选 —— 列表内为排除项（这些物品不飞向玩家）
 *   "1" 反选 —— 列表内为保留项（列表外全部排除）
 */

/** 共享空集合（只读，用于避免每次分配） */
const EMPTY_SET = Object.freeze(new Set());

/** 共享空筛选（只读） */
export const EMPTY_FILTER = Object.freeze({
  inverted: false,
  items: EMPTY_SET,
});

/**
 * 解析压缩字符串筛选数据。
 * @param {string | undefined} raw
 * @returns {{inverted: boolean, items: Set<string>}}
 */
export function parseLootFilter(raw) {
  if (!raw || typeof raw !== "string") return EMPTY_FILTER;

  const parts = raw.split("|");
  const inverted = parts[0] === "1";
  if (parts.length === 1) {
    return inverted ? { inverted: true, items: EMPTY_SET } : EMPTY_FILTER;
  }

  const items = new Set();
  for (let i = 1; i < parts.length; i++) {
    if (parts[i]) items.add(parts[i]);
  }
  if (items.size === 0) {
    return inverted ? { inverted: true, items: EMPTY_SET } : EMPTY_FILTER;
  }
  return { inverted, items };
}

/**
 * 将筛选数据编码为压缩字符串。
 * @param {boolean} inverted
 * @param {Iterable<string>} items
 * @returns {string}
 */
export function encodeLootFilter(inverted, items) {
  const parts = [inverted ? "1" : "0"];
  for (const id of items) parts.push(id);
  return parts.join("|");
}

/**
 * 判断某个物品是否应被排除。
 * @param {{inverted: boolean, items: Set<string>}} filter
 * @param {string} typeId
 * @returns {boolean}
 */
export function shouldExcludeLoot(filter, typeId) {
  if (filter.items.size === 0) return filter.inverted;
  const inList = filter.items.has(typeId);
  return filter.inverted ? !inList : inList;
}

/**
 * 物品筛选缓存 
 * 
 * 玩家ID → { raw, parsed }
 * @type {Map<string, {raw: string, parsed: {inverted: boolean, items: Set<string>}}>}
 */
const filterCache = new Map();

/**
 * 获取玩家的筛选状态（带缓存）
 * @param {mc.Player} player
 * @returns {{inverted: boolean, items: Set<string>}}
 */
export function getLootFilter(player) {
  if (!Settings.allow_loot_filter) return EMPTY_FILTER;
  if (!meow.getPlayerSetting(player, "lootFilterSwitch")) return EMPTY_FILTER;
  const raw = meow.getPlayerSetting(player, "lootFilter");
  if (!raw) return EMPTY_FILTER;

  const cached = filterCache.get(player.id);
  if (cached && cached.raw === raw) return cached.parsed;

  const parsed = parseLootFilter(raw);
  filterCache.set(player.id, { raw, parsed });
  return parsed;
}

/**
 * 使物品筛选缓存失效
 * @param {string} [playerId] - 不传则清空全部
 */
export function invalidateLootFilterCache(playerId) {
  if (playerId === undefined) filterCache.clear();
  else filterCache.delete(playerId);
}
