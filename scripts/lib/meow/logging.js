/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { world } from "@minecraft/server";
import { Settings } from "../../SystemSettings";

// 信息发送前缀
const PREFIX = "[§3MeowHouseModule§r] ";

/**
 * 将任意参数数组转换为可安全显示的字符串数组。
 * 对象会被尝试序列化为 JSON；若失败（如存在循环引用），则返回占位提示。
 * 
 * @param {any[]} args - 待格式化的参数列表
 * @returns {string[]} 格式化后的字符串数组
 */
export function formattedArgs(args) {
  return args.map(arg => {
    if (typeof arg !== 'object' || arg === null) return String(arg);
    try {
      return JSON.stringify(arg);
    } catch {
      return '[无法序列化的对象]';
    }
  });
}

/**
 * 输出调试日志（浅蓝色）
 * 仅当 Settings.log 为 true 时生效。
 * 
 * @param {...any} args - 任意数量的参数
 * @example
 * log("玩家进入", playerName, { x: 10, y: 5, z: 0 });
 */
export function log(...args) {
  if (typeof Settings === 'undefined' || !Settings.log) return;
  world.sendMessage(PREFIX + "[§3log§r] " + formattedArgs(args).join(" "));
}

/**
 * 输出警告信息（金色）
 * 仅当 Settings.warn 为 true 时生效。
 * 
 * @param {...any} args - 任意数量的参数
 */
export function warn(...args) {
  if (typeof Settings === 'undefined' || !Settings.warn) return;
  const message = PREFIX + "[§6warn§r] " + formattedArgs(args).join(" ");
  world.sendMessage(message);
  console.warn(message);
}

/**
 * 输出错误信息（红色）
 * 始终输出（不依赖 Settings），确保关键错误不被忽略。
 * 
 * @param {...any} args - 任意数量的参数
 */
export function error(...args) {
  const message = PREFIX + "[§4error§r] " + formattedArgs(args).join(" ");
  world.sendMessage(message);
  console.error(message);
}