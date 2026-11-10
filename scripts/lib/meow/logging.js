/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { world } from "@minecraft/server";
import { Settings } from "../../SystemSettings.js";

// 信息发送前缀
const PREFIX = "[§3MeowFish§r] ";

// “最近异常”内存缓冲的最大条数
const MAX_RECENT_ISSUES = 20;

// “最近异常”内存环形缓冲，按时间从旧到新存放
const recentIssues = [];

/**
 * 是否处于调试模式。
 *
 * 由 SystemSettings.debug 控制：正式包为 0 时，技术性日志只进后台、
 * 不打扰玩家；调试时置 1 可在聊天栏同步看到 warn / error。
 *
 * @returns {boolean}
 */
function isDebug() {
  return Boolean(Settings && Settings.debug);
}

/**
 * 将任意参数数组转换为可安全显示的字符串数组。
 * 对象会被尝试序列化为 JSON；若失败（如存在循环引用），则返回占位提示。
 *
 * @param {any[]} args - 待格式化的参数列表
 * @param {boolean} [withStack=false] - 是否附带 Error 的堆栈
 * @returns {string[]} 格式化后的字符串数组
 */
function formatArgs(args, withStack = false) {
  return args.map(arg => {
    if (arg instanceof Error) {
      // 堆栈信息量大且包含脚本内部实现，只允许出现在后台日志里
      return withStack
        ? `${arg.name}: ${arg.message}\n${arg.stack}`
        : `${arg.name}: ${arg.message}`;
    }
    if (typeof arg !== "object" || arg === null) return String(arg);
    try {
      return JSON.stringify(arg);
    } catch {
      return "[Unserializable object]";
    }
  });
}

/**
 * 把一条日志同步到玩家聊天栏。
 *
 * 仅调试模式下生效：正式包里的技术性错误不应出现在玩家聊天栏中。
 * 调用方传入的文本必须已经去掉堆栈（本函数不会主动附加堆栈）。
 *
 * @param {string} tag - 已带颜色码的级别标签，如 "[§4error§r] "
 * @param {string[]} parts - 已格式化的参数
 */
function sendToChat(tag, parts) {
  if (!isDebug()) return;
  try {
    world.sendMessage(PREFIX + tag + parts.join(" "));
  } catch (_) {
    // 聊天栏发送失败（如玩家列表为空）不应影响主流程
  }
}

/**
 * 输出调试日志（青色）。
 * 仅在 Settings.debug 开启时写入后台，**不会**进入聊天栏。
 *
 * @param {...any} args - 任意数量的参数
 * @example
 * log("玩家进入", playerName, { x: 10, y: 5, z: 0 });
 */
export function log(...args) {
  if (!isDebug()) return;
  console.log(PREFIX + "[§3debug§r] " + formatArgs(args).join(" "));
}

/**
 * 惰性调试日志：仅在调试模式下才求值，避免未开启调试时白拼接字符串。
 * @param {() => any} fn
 */
export function logLazy(fn) {
  if (!isDebug()) return;
  log(fn());
}

/**
 * 输出信息（浅蓝色）。
 * 始终写入后台，**永远不会**进入聊天栏。
 *
 * @param {...any} args - 任意数量的参数
 */
export function info(...args) {
  console.log(PREFIX + "[§3info§r] " + formatArgs(args).join(" "));
}

/**
 * 输出警告（金色）。
 * 后台始终记录；调试模式下同步到聊天栏（只带消息文本，不带堆栈）。
 *
 * @param {...any} args - 任意数量的参数
 */
export function warn(...args) {
  console.warn(PREFIX + "[§6warn§r] " + formatArgs(args).join(" "));
  sendToChat("[§6warn§r] ", formatArgs(args));
}

/**
 * 输出错误（红色）。
 * 后台记录完整信息（Error 附带堆栈）；调试模式下聊天栏只显示消息本身。
 *
 * @param {...any} args - 任意数量的参数
 */
export function error(...args) {
  console.error(PREFIX + "[§4error§r] " + formatArgs(args, true).join(" "));
  // 记录最近异常，任何记录失败都不能影响原有的错误输出
  try {
    const text = formatArgs(args).join(" ");
    const message = String(text).split("\n")[0].slice(0, 200);
    recentIssues.push({ at: Date.now(), message });
    while (recentIssues.length > MAX_RECENT_ISSUES) {
      recentIssues.shift();
    }
  } catch (_) {
    // 忽略缓冲记录失败
  }
  sendToChat("[§4error§r] ", formatArgs(args));
}

/**
 * 获取“最近异常”缓冲的副本。
 * 返回的数组最新在前，元素结构为 `{ at, message }`，外部修改不会影响内部缓冲。
 *
 * @returns {{ at: number, message: string }[]}
 */
export function getRecentIssues() {
  return recentIssues
    .slice()
    .reverse()
    .map(item => ({ at: item.at, message: item.message }));
}
