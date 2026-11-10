/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import * as meow from "../lib/index.js";
import { fishingEvents } from "../lib/meow/FishingEvent.js";
import { getPlayerSetting } from "../lib/meow/DynamicProperty.js";
import { isAutoFishing, clearPlayerFishingState } from "./AutoFishState.js";
import { Settings } from "../SystemSettings.js";

// ---------- 状态（模块私有） ----------
/**
 * 玩家熔断状态
 * @type {Map<string, {abnormalCount:number, firstAbnormalTime:number, isTripped:boolean, trippedAt:number}>}
 */
const breakers = new Map();

/** 全服熔断状态 */
const globalBreaker = {
  isTripped: false,
  trippedAt: 0,
  triggerCount: 0,
  windowStart: 0,
  players: new Set(),
};

// ---------- 玩家熔断器 ----------
/**
 * 记录一次异常（在检测到可疑行为时调用）
 * @param {mc.Player} player
 * @param {string} reason 异常原因（用于日志）
 */
export function recordAbnormal(player, reason) {
  if (!Settings.circuit_breaker) return;
  if (player?.id === undefined) return;
  if (!isAutoFishing(player.id)) return;

  const now = Date.now();
  let breaker = breakers.get(player.id);

  if (!breaker) {
    breaker = {
      abnormalCount: 0,
      firstAbnormalTime: now,
      isTripped: false,
      trippedAt: 0,
    };
    breakers.set(player.id, breaker);
  }

  // 熔断中，忽略后续异常（避免重复日志）
  if (breaker.isTripped) return;

  // 窗口过期重置（30秒）
  if (now - breaker.firstAbnormalTime > Settings.circuit_breaker_cooldown) {
    breaker.abnormalCount = 0;
    breaker.firstAbnormalTime = now;
  }

  breaker.abnormalCount++;

  // 触发阈值：窗口内达到 5 次异常
  if (breaker.abnormalCount >= Settings.circuit_breaker_threshold) {
    breaker.isTripped = true;
    breaker.trippedAt = now;
    clearPlayerFishingState(player.id); // 停止自动钓鱼并清理下沉计时器

    // 通知玩家
    const lang = getPlayerSetting(player, "language");
    player.sendMessage(meow.getLocalizedText("circuit_breaker_tripped", lang));

    // 输出日志
    meow.warn(`玩家 ${player.name} 触发熔断 (${reason})`);

    // 记录全服熔断计数
    recordGlobalAbnormal(player, reason);

    // 自动恢复（30秒后重置）
    mc.system.runTimeout(() => {
      if (!player?.isValid) return;
      const current = breakers.get(player.id);
      if (current && current.isTripped) {
        current.isTripped = false;
        current.abnormalCount = 0;
        const lang = getPlayerSetting(player, "language");
        player.sendMessage(meow.getLocalizedText("circuit_breaker_reset", lang));
      }
    }, 600); // 30秒 = 600 tick
  }
}

/**
 * 检查玩家是否处于熔断状态
 */
export function isPlayerTripped(playerId) {
  const breaker = breakers.get(playerId);
  return breaker ? breaker.isTripped : false;
}

/**
 * 手动重置玩家熔断
 */
export function resetPlayerCircuit(playerId) {
  breakers.delete(playerId);
}

// ---------- 全服熔断器 ----------
function recordGlobalAbnormal(player, reason) {
  if (!Settings.global_circuit_breaker) return;

  const global = globalBreaker;
  const now = Date.now();

  // 如果已经全服熔断，不再累计
  if (global.isTripped) return;

  // 初始化或重置窗口
  if (!global.windowStart || now - global.windowStart > Settings.global_circuit_cooldown) {
    global.windowStart = now;
    global.triggerCount = 0;
    global.players.clear();
  }

  // 同一玩家在窗口内多次触发只计一次
  global.players.add(player.id);
  global.triggerCount = global.players.size;

  if (global.triggerCount >= Settings.global_circuit_threshold) {
    // 触发全服熔断
    global.isTripped = true;
    global.trippedAt = now;
    fishingEvents.pause(); // 禁用全服自动钓鱼

    // 通知所有在线玩家
    for (const p of mc.world.getAllPlayers()) {
      p.sendMessage(meow.getLocalizedText("global_circuit_tripped", getPlayerSetting(p, "language")));
    }

    meow.error(`
-------------------------------
全服熔断器已触发！                             

原因: ${Settings.global_circuit_threshold} 名玩家在 ${Settings.global_circuit_cooldown/1000} 秒内触发熔断  
时间: ${new Date().toLocaleString()}                           
建议: 检查服务器环境或其它插件是否干扰浮漂物理行为             
-------------------------------
    `);

    // 自动恢复（仅一次，之后需手动）
    // mc.system.runTimeout(() => {
    //   if (global.isTripped) {
    //     global.isTripped = false;
    //     global.triggerCount = 0;
    //     fishingEvents.resume();
    //     for (const p of mc.world.getAllPlayers()) {
    //       p.sendMessage(meow.getLocalizedText("global_circuit_reset", getPlayerSetting(p, "language")));
    //     }
    //     console.log("[MeowFish] 全服熔断器已自动恢复（冷却结束）");
    //   }
    // }, GLOBAL_COOLDOWN / 50); // 转成 tick
  }
}

/**
 * 检查是否处于全服熔断状态
 */
export function isGlobalTripped() {
  return globalBreaker.isTripped;
}

/**
 * 手动重置全服熔断
 */
export function resetGlobalCircuit() {
  globalBreaker.isTripped = false;
  globalBreaker.triggerCount = 0;
  globalBreaker.players.clear();
  fishingEvents.resume();
}
