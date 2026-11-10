/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 管理员密钥鉴权失败与冻结策略。
 * 纯逻辑模块，不依赖任何运行时 API，可直接在 Node 下测试。
 */

/** 失败计数窗口（毫秒）：5 分钟 */
export const AUTH_WINDOW_MS = 5 * 60 * 1000;

/** 窗口内触发冻结所需的连续失败次数 */
export const AUTH_MAX_FAILURES = 5;

/** 基础冻结时长（毫秒）：2 分钟 */
export const AUTH_BASE_FREEZE_MS = 2 * 60 * 1000;

/** 每级冻结递增时长（毫秒）：2 分钟 */
export const AUTH_FREEZE_STEP_MS = 2 * 60 * 1000;

/** 冻结时长上限（毫秒）：10 分钟 */
export const AUTH_MAX_FREEZE_MS = 10 * 60 * 1000;

/** 冻结等级上限，对应 2/4/6/8/10 分钟 */
export const AUTH_MAX_LEVEL = 4;

/** 冻结等级衰减时长（毫秒）：24 小时 */
export const AUTH_LEVEL_DECAY_MS = 24 * 60 * 60 * 1000;

/**
 * 计算指定等级对应的冻结时长。
 * @param {number} level 冻结等级，负数或非数字按 0 处理，小数向下取整
 * @returns {number} 冻结时长（毫秒）
 */
export function freezeDurationMs(level) {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  return Math.min(AUTH_BASE_FREEZE_MS + safeLevel * AUTH_FREEZE_STEP_MS, AUTH_MAX_FREEZE_MS);
}

/**
 * 记录一次鉴权失败并返回新的窗口状态。
 * @param {{count: number, firstAt: number}|undefined} windowState 当前失败窗口
 * @param {number} now 当前时间戳（毫秒）
 * @returns {{count: number, firstAt: number, triggered: boolean}} 新的失败窗口
 */
export function registerFailure(windowState, now) {
  const firstAt = windowState?.firstAt;
  // 无记录、时间戳非法或超出窗口：重新计数
  if (!Number.isFinite(firstAt) || now - firstAt > AUTH_WINDOW_MS) {
    return { count: 1, firstAt: now, triggered: false };
  }
  const count = (Number.isFinite(windowState.count) ? windowState.count : 0) + 1;
  return { count, firstAt, triggered: count >= AUTH_MAX_FAILURES };
}

/**
 * 计算当前实际生效的冻结等级，超过 24 小时自动衰减。
 * @param {number} level 记录的冻结等级
 * @param {number} lastFreezeAt 上次冻结时间戳（毫秒）
 * @param {number} now 当前时间戳（毫秒）
 * @returns {number} 0~AUTH_MAX_LEVEL 的生效等级
 */
export function effectiveFreezeLevel(level, lastFreezeAt, now) {
  if (!Number.isFinite(lastFreezeAt) || lastFreezeAt <= 0) return 0;
  if (now - lastFreezeAt > AUTH_LEVEL_DECAY_MS) return 0;
  const safeLevel = Number.isFinite(level) ? Math.floor(level) : 0;
  return Math.min(Math.max(safeLevel, 0), AUTH_MAX_LEVEL);
}

/**
 * 生成新的冻结记录，等级递增并封顶。
 * @param {number} level 上一次冻结等级
 * @param {number} lastFreezeAt 上一次冻结时间戳（毫秒）
 * @param {number} now 当前时间戳（毫秒）
 * @returns {{level: number, until: number, lastFreezeAt: number}} 冻结记录
 */
export function createFreezeRecord(level, lastFreezeAt, now) {
  const effective = effectiveFreezeLevel(level, lastFreezeAt, now);
  return {
    level: Math.min(effective + 1, AUTH_MAX_LEVEL),
    until: now + freezeDurationMs(effective),
    lastFreezeAt: now,
  };
}

/**
 * 判断冻结记录当前是否仍然生效。
 * @param {{until: number}|undefined} record 冻结记录
 * @param {number} now 当前时间戳（毫秒）
 * @returns {boolean} 是否处于冻结中
 */
export function isActiveFreeze(record, now) {
  return Boolean(record) && record.until > now;
}
