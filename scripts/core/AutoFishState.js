/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";

/**
 * 正在使用自动钓鱼的玩家 ID 集合
 * @type {Set<string>}
 */
const AutoFish = new Set();

/**
 * 下沉抑制计时器
 * Key: 玩家ID, Value: 定时器ID
 * @type {Map<string, number>}
 */
const HookTp = new Map();

/* ------------------------------ 自动钓鱼会话 ------------------------------ */

/**
 * 玩家是否处于自动钓鱼状态
 * @param {string} playerId
 * @returns {boolean}
 */
export function isAutoFishing(playerId) {
  return AutoFish.has(playerId);
}

/**
 * 开始自动钓鱼（抛竿命中时调用）
 * @param {string} playerId
 */
export function startAutoFishing(playerId) {
  AutoFish.add(playerId);
}

/* ------------------------------ 下沉抑制计时器 ---------------------------- */

/**
 * 取玩家当前的下沉抑制计时器
 * @param {string} playerId
 * @returns {number | undefined}
 */
export function getSinkingTimer(playerId) {
  return HookTp.get(playerId);
}

/**
 * 设置下沉抑制计时器。
 * 若该玩家已有旧计时器，先清掉，避免旧计时器失去引用后一直运行。
 * @param {string} playerId
 * @param {number} runId
 */
export function setSinkingTimer(playerId, runId) {
  const prev = HookTp.get(playerId);
  if (prev !== undefined && prev !== runId) mc.system.clearRun(prev);
  HookTp.set(playerId, runId);
}

/**
 * 当前计时器是否就是 runId。
 * 用于定时回调里判断自己是否已被更新的计时器替换。
 * @param {string} playerId
 * @param {number} runId
 * @returns {boolean}
 */
export function isSinkingTimer(playerId, runId) {
  return HookTp.get(playerId) === runId;
}

/**
 * 清除下沉抑制计时器（不存在时无操作）
 * @param {string} playerId
 */
export function clearSinkingTimer(playerId) {
  const runId = HookTp.get(playerId);
  if (runId === undefined) return;
  mc.system.clearRun(runId);
  HookTp.delete(playerId);
}

/* ------------------------------ 清理 ------------------------------------ */

/**
 * 清除某个玩家的「钓鱼进行中」状态：停止自动钓鱼、清下沉计时器。
 *
 * 注意：这里**不清理**熔断计数。熔断状态归 CircuitBreaker 所有，
 * 若在此清空，「30 秒内累计 N 次异常」的阈值将永远无法达到。
 *
 * @param {string} playerId - 玩家ID
 */
export function clearPlayerFishingState(playerId) {
  AutoFish.delete(playerId);
  clearSinkingTimer(playerId);
}
