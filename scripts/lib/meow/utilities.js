/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { error } from "./logging.js";

/**
 * 执行命令
 * @param {mc.Entity|mc.Dimension} object 实体或纬度对象
 * @param {string} command 命令
 * @param {boolean} isReturn 是否返回执行结果
 * @returns 
 */
export function runCommand(object, command, isReturn = false) {
  try {
    const commandResult = object.runCommand(command);
    if (isReturn) return commandResult;
  } catch (e) {
    error(`runCommand错误: command: "${command}" error: "${e}"`);
    return { object: object, command: command, error: e, successCount: 0 }
  }
}

/**
 * 生成指定范围内的随机整数 [min, max]
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {number} [min, max] 范围内的整数
 */
export function getRndInteger(min, max) {
  if (min === max) return min;
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 根据百分比返回布尔值
 * @param {number} percent 百分比 (0-100)，默认50
 * @returns {boolean}
 */
export function getRndBoolean(percent = 50) {
  return Math.random() * 100 < percent;
}

/**
 * 根据耐久附魔等级计算物品是否应该承受额外损耗
 * @param {number} unbreaking - 耐久附魔等级
 * @param {boolean} isArmor - 是否为盔甲物品
 * @returns {boolean} 是否承受损耗
 */
export function consumeDurability(unbreaking, isArmor = false) {
  return getRndBoolean(isArmor
    ? 60 + Math.floor(40 / (unbreaking + 1))
    : Math.floor(100 / (unbreaking + 1))
  );
}

/**
 * 权重抽奖
 * @template T
 * @param {T[]} items 奖品本体数组
 * @param {number[]} weights 奖品权重数组
 * @param {number} totalWeight - 必须等于 weights 的总和且 > 0
 * @throws {Error} 如果 totalWeight <= 0
 * @returns 被抽中的奖品对象
 */
export function weightedLottery(items, weights, totalWeight) {
  if (totalWeight <= 0) throw new Error("总权重必须大于0");
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] === 0) continue;
    random -= weights[i];
    if (random < 0) return items[i];
  }
  return items[items.length - 1];
}
