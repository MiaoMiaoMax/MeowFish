/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { error } from "./Logging.js";
import { Vector3 } from "./Vector3.js";
import { NumberUnits } from "../../locales/NumberUnits.js";

/**
 * 执行命令
 * @param {mc.Entity|mc.Dimension} object 实体或纬度对象
 * @param {string} command 命令
 * @returns 
 */
export function runCommand(object, command) {
  try {
    return object.runCommand(command);
  } catch (e) {
    error(`runCommand错误: command: "${command}" error: "${e}"`);
    return { object: object, command: command, error: e, successCount: 0 }
  }
}

/**
 * 指数衰减函数
 * @param {number} x 输入值
 * @param {number} k 衰减系数，默认0.1
 * @returns {number} 衰减后的结果
 */
export const exponentialDecay = (x, k = 0.1) => Math.exp(-k * x);

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

/**
 * 创建粒子
 * @param {mc.Player|mc.Dimension} target 目标对象
 * @param {string} particleId 粒子ID
 * @param {mc.Vector3} pos 粒子位置
 * @throws 如果 target 不是 Player 或 Dimension 会抛出错误
 */
export function spawnParticle(target, particleId, pos) {
  let dimension;
  if (target instanceof mc.Player) dimension = target.dimension;
  else if (target instanceof mc.Dimension) dimension = target;
  else throw new TypeError("target must be a Player or Dimension");
  if (Vector3.isSafe(dimension, pos)) target.spawnParticle(particleId, pos);
  else runCommand(target, `particle ${particleId} ${pos.x} ${pos.y} ${pos.z}`);
}

/**
 * 播放声音
 * @param {mc.Player|mc.Dimension} target 播放目标
 * @param {string} soundId 声音ID
 * @param {mc.Vector3} pos 声音位置
 * @param {number} volume 声音音量
 * @param {number} pitch 声音调高
 * @throws 如果 target 既不是 Player 也不是 Dimension 会抛出错误
 */
export function playSound(target, soundId, pos, volume = 1, pitch = 1) {
  if (target instanceof mc.Player) {
    const dimension = target.dimension;
    if (Vector3.isSafe(dimension, pos)) target.playSound(soundId, { location: pos, volume, pitch });
    else runCommand(target, `playsound ${soundId} @s ${pos.x} ${pos.y} ${pos.z} ${volume} ${pitch}`);
  }
  else if (target instanceof mc.Dimension) {
    if (Vector3.isSafe(target, pos)) target.playSound(soundId, pos, { volume, pitch });
    else runCommand(target, `playsound ${soundId} @a ${pos.x} ${pos.y} ${pos.z} ${volume} ${pitch}`);
  }
  else throw new TypeError("target must be a Player or Dimension");
}

/**
 * 在指定玩家面前播放声音并指定距离
 * @param {mc.Player} player 播放目标
 * @param {string} soundId 声音ID
 * @param {number} volume 音量
 * @param {number} pitch 调高
 * @param {number} distance 播放距离
 */
export function playSoundInFrontOfPlayer(player, soundId, volume = 1, pitch = 1, distance = 1) {
  const pos = Vector3.inFrontOfEntity(player, distance);
  playSound(player.dimension, soundId, pos, volume, pitch);
}

/**
 * 创建实体
 * @param {mc.Dimension} dimension 维度
 * @param {string} entityId 实体ID
 * @param {mc.Vector3} pos 实体位置
 */
export function spawnEntity(dimension ,entityId, pos) {
  if (Vector3.isSafe(dimension, pos)) return dimension.spawnEntity(entityId, pos);
  runCommand(dimension, `summon ${entityId} ${pos.x} ${pos.y} ${pos.z}`);
}

/**
 * 判断玩家是否为创造模式
 * @param {mc.Player} player
 * @returns {boolean}
 */
export function isCreative(player) {
  return player.getGameMode() === mc.GameMode.Creative;
}

/**
 * 智能格式化数字（自动匹配语言单位阶梯，进行大数模糊压缩）
 * 
 * < 阈值：原样展示并加千分位（如 135,568）
 * >= 阈值：进行单位模糊压缩（如 1558.5万 / 1.56M）
 * 
 * @param {number} num - 原始数字
 * @param {string} lang - 当前语言代码（如 "zh_CN", "en_US"）
 * @param {number} [threshold=1000000] - 触发压缩的阈值（默认 100 万）
 * @returns {string} 格式化后的字符串
 */
export function formatNumberCompact(num, lang, threshold = 1000000) {
  // 1. 容错处理
  if (typeof num !== "number" || Number.isNaN(num)) return "0";
  
  const absNum = Math.abs(num);
  
  // 2. 低于阈值，直接返回千分位格式
  if (absNum < threshold) {
    return num.toLocaleString();
  }

  // 3. 获取对应语言的单位阶梯，若未找到则使用 default 兜底
  const units = NumberUnits[lang] || NumberUnits.default;

  // 4. 遍历阶梯进行计算压缩
  for (const u of units) {
    if (absNum >= u.value) {
      const val = absNum / u.value;
      // toFixed(2) 保留两位小数，parseFloat 去掉末尾无用的 0 (如 1558.50 -> 1558.5)
      const formatted = parseFloat(val.toFixed(2));
      return `${num < 0 ? "-" : ""}${formatted}${u.symbol}`;
    }
  }

  // 兜底（正常逻辑走不到这里）
  return num.toLocaleString();
}
