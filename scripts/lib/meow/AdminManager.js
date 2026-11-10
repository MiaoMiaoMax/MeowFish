/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { getRndInteger } from "./Utilities.js";
import { getLocalizedText } from "./Language.js";
import { error, info, warn } from "./Logging.js";
import {
  AUTH_LEVEL_DECAY_MS,
  AUTH_MAX_FAILURES,
  AUTH_MAX_LEVEL,
  createFreezeRecord,
  isActiveFreeze,
  registerFailure,
} from "./AdminAuthPolicy.js";

// 配置
const STORAGE_KEY = "meow_admin_data";
const MAX_USED_KEYS = 100;                 // 最多保存100个历史秘钥，防止无限增长

// 内存状态
const state = {
  currentKey: null,        // 当前有效秘钥
  usedKeys: new Set(),     // 已使用的秘钥集合（防重放）
  admins: new Map(),       // 管理员 Entity.id 和 name 集合
  authSecurity: new Map(), // 冻结记录：playerId → { level, until, lastFreezeAt }
};

/**
 * 失败窗口（仅内存）：playerId → { count, firstAt }
 * 普通失败不持久化，脚本重载后重置；只有冻结记录写入 authSecurity。
 * @type {Map<string, {count: number, firstAt: number}>}
 */
const failureState = new Map();

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * 生成随机密钥（包含大小写字母和数字）
 * @param {number} length - 密钥长度，默认8
 * @returns {string}
 */
export function generateMixKey(length = 6) {
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars[getRndInteger(0, 61)];
  }
  return key;
}

export function generateKey(length = 6) {
  let key = getRndInteger(0, 1e12 - 1).toString(36);
  while (key.length < length) {
    key += getRndInteger(0, 1e12 - 1).toString(36);
  }
  return key.slice(0, length);
}

/**
 *  持久化
 */
function getStorageData() {
  const raw = mc.world.getDynamicProperty(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      error("Failed to parse admin data:", e);
      return null;
    }
  }
  return null;
}

function setStorageData(data) {
  mc.world.setDynamicProperty(STORAGE_KEY, JSON.stringify(data));
}

/**
 * 加载管理员数据（在脚本启动时调用）
 * @returns {boolean} 是否成功加载
 */
export function loadAdminData() {
  const data = getStorageData();
  if (!data) return false;

  // 基础数据校验
  if (typeof data.currentKey !== 'string' && data.currentKey !== null) return false;
  if (!Array.isArray(data.usedKeys)) return false;
  if (typeof data.admins !== 'object' || data.admins === null) return false;

  state.currentKey = data.currentKey || null;
  state.usedKeys = new Set(data.usedKeys);

  state.admins = new Map();
  for (const [id, name] of Object.entries(data.admins)) {
    if (typeof name === 'string') {
      state.admins.set(id, name);
    }
  }

  // 冻结记录：旧存档没有该字段时视为空，不影响名单与密钥。
  // 记录在 24 小时内保留（即使冻结已到期），用于下一次冻结的等级递增；
  // 超过 24 小时才惰性清理，与 effectiveFreezeLevel 的衰减规则一致。
  state.authSecurity = new Map();
  const security = data.authSecurity;
  if (security !== undefined && security !== null) {
    if (typeof security !== "object" || Array.isArray(security)) {
      warn("Invalid admin authSecurity data, ignored");
    } else {
      const now = Date.now();
      for (const [id, record] of Object.entries(security)) {
        if (typeof record !== "object" || record === null) continue;
        const level = Number(record.level);
        const until = Number(record.until);
        const lastFreezeAt = Number(record.lastFreezeAt);
        if (!Number.isFinite(level) || !Number.isFinite(until) || !Number.isFinite(lastFreezeAt)) continue;
        if (now - lastFreezeAt > AUTH_LEVEL_DECAY_MS) continue; // 等级已衰减，清理记录
        state.authSecurity.set(id, {
          level: Math.min(Math.max(Math.floor(level), 0), AUTH_MAX_LEVEL),
          until,
          lastFreezeAt,
        });
      }
    }
  }
  return true;
}

/**
 * 保存管理员数据到持久化存储
 */
export function saveAdminData() {
  const adminsObj = Object.fromEntries(state.admins); // 转换为 { id: name, ... }

  // 24 小时内的记录都保留（含已到期），以便下一次冻结继续递增等级
  const now = Date.now();
  const authSecurity = Object.fromEntries(
    Array.from(state.authSecurity).filter(([, record]) => now - record.lastFreezeAt <= AUTH_LEVEL_DECAY_MS),
  );

  const data = {
    currentKey: state.currentKey,
    usedKeys: Array.from(state.usedKeys).slice(-MAX_USED_KEYS), // 保留秘钥历史限制，防止无限增长（可选）
    admins: adminsObj,
    authSecurity,
  };
  setStorageData(data);
}

/**
 * 刷新管理员秘钥（生成新秘钥并保存）
 * @returns {string} 新生成的秘钥
 */
export function refreshAdminKey() {
  // 确保新秘钥不与历史秘钥重复（极低概率，以防万一）
  let newKey;
  let attempts = 0;
  do {
    newKey = generateMixKey();
    attempts++;
  } while (state.usedKeys.has(newKey) && attempts < 20);

  state.currentKey = newKey;
  saveAdminData();

  // 控制台输出醒目提示（info 只进后台：密钥绝不能出现在玩家聊天栏）
  info(`
-------------------------------
Admin one-time secret key generated
key: ${state.currentKey}
This key can be used only once and will automatically refresh after use.
-------------------------------
`);

  return state.currentKey;
}

/**
 * 记录一次鉴权失败；达到阈值时写入冻结记录并持久化。
 * @param {string} playerId
 * @param {string} messageKey 基础提示文案键
 * @param {string} [lang]
 * @returns {{ success: boolean, message: string, frozen?: boolean, remainingMs?: number }}
 */
function recordAuthFailure(playerId, messageKey, lang) {
  const now = Date.now();
  const result = registerFailure(failureState.get(playerId), now);
  failureState.set(playerId, { count: result.count, firstAt: result.firstAt });

  if (!result.triggered) {
    const remaining = Math.max(0, AUTH_MAX_FAILURES - result.count);
    return {
      success: false,
      message: `${getLocalizedText(messageKey, lang)}\n${getLocalizedText("admin_fail_remaining", lang, { remaining })}`,
    };
  }

  const previous = state.authSecurity.get(playerId);
  const record = createFreezeRecord(previous?.level ?? 0, previous?.lastFreezeAt ?? 0, now);
  state.authSecurity.set(playerId, record);
  failureState.delete(playerId);
  saveAdminData();

  const remainingMs = record.until - now;
  return {
    success: false,
    frozen: true,
    remainingMs,
    message: getLocalizedText("admin_frozen", lang, { minutes: Math.ceil(remainingMs / 60000) }),
  };
}

/**
 * 验证并激活管理员权限
 * @param {string} playerId
 * @param {string} playerName
 * @param {string} inputKey
 * @param {string} [lang] 语言代码，缺省时回退到默认语言
 * @returns {{ success: boolean, message: string, frozen?: boolean, remainingMs?: number }}
 */
export function activateAdmin(playerId, playerName, inputKey, lang) {
  const now = Date.now();
  const frozen = state.authSecurity.get(playerId);
  // 已到期的记录保留在内存中，用于下一次失败时计算递增等级；不阻止本次验证
  if (isActiveFreeze(frozen, now)) {
    const remainingMs = frozen.until - now;
    return {
      success: false,
      frozen: true,
      remainingMs,
      message: getLocalizedText("admin_frozen", lang, {
        minutes: Math.max(1, Math.ceil(remainingMs / 60000)),
      }),
    };
  }
  if (state.admins.has(playerId)) {
    return { success: false, message: getLocalizedText("admin_already", lang) };
  }
  if (!state.currentKey) {
    return { success: false, message: getLocalizedText("admin_not_init", lang) };
  }
  if (typeof inputKey !== "string" || inputKey.length === 0) {
    return { success: false, message: getLocalizedText("admin_key_missing", lang) };
  }
  if (state.usedKeys.has(inputKey)) {
    return recordAuthFailure(playerId, "admin_key_used", lang);
  }
  if (inputKey !== state.currentKey) {
    return recordAuthFailure(playerId, "admin_key_invalid", lang);
  }

  // 成功：清空失败窗口与冻结等级（refreshAdminKey 会一并持久化）
  failureState.delete(playerId);
  state.authSecurity.delete(playerId);
  state.admins.set(playerId, playerName);
  state.usedKeys.add(state.currentKey);
  refreshAdminKey();
  return {
    success: true,
    message: getLocalizedText("admin_activated", lang, { name: playerName }),
  };
}

/**
 * 查询玩家剩余冻结时间（毫秒）；未冻结或已到期返回 0。
 * 到期记录会保留到 24 小时衰减期结束，用于等级递增。
 * @param {string} playerId
 * @returns {number}
 */
export function getFrozenRemainingMs(playerId) {
  const record = state.authSecurity.get(playerId);
  if (!record) return 0;
  const now = Date.now();
  if (!isActiveFreeze(record, now)) return 0;
  return record.until - now;
}

/**
 * 检查玩家是否为管理员
 * @param {string} playerId - 玩家的 Entity.id
 * @returns {boolean}
 */
export function isAdmin(playerId) {
  return state.admins.has(playerId);
}

/**
 * 获取管理员名称
 * @param {string} playerId - 玩家的 Entity.id
 * @returns {string}
 */
export function getAdminName(playerId) {
  return state.admins.get(playerId);
}

/**
 * 获取所有管理员ID和名称列表
 * @returns {({id: string, name: string})[]}
 */
export function getAdminList() {
  const list = [];
  for (const [id, name] of state.admins) {
    list.push({ id, name });
  }
  return list;
}

/**
 * 移除管理员权限
 * @param {string} playerId
 * @returns {boolean}
 */
export function removeAdmin(playerId) {
  const result = state.admins.delete(playerId);
  if (result) saveAdminData();
  return result;
}

/**
 * 获取当前有效秘钥（用于调试/控制台）
 * @returns {string|null}
 */
export function getCurrentKey() {
  return state.currentKey;
}

/**
 * 检查秘钥是否已被使用过
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyUsed(key) {
  return state.usedKeys.has(key);
}

/**
 * 获取管理员数量
 * @returns {number}
 */
export function getAdminCount() {
  return state.admins.size;
}
