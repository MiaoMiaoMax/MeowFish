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
import {
  clearPlayerFishingState,
  isAutoFishing,
  startAutoFishing,
  clearSinkingTimer,
} from "./AutoFishState.js";
import { isGlobalTripped, recordAbnormal, resetPlayerCircuit } from "./CircuitBreaker.js";

/**
 * 注册所有自动钓鱼状态管理事件
 */
export function registerAutoFishingController() {
  // 抛竿事件：判断是否启用自动钓鱼
  fishingEvents.castRod.subscribe(event => {
    if (event.player?.id === undefined) return;
    if (isGlobalTripped()) {
      const lang = meow.getPlayerSetting(event.player, "language");
      event.player.sendMessage(meow.getLocalizedText("global_circuit_tripped", lang));
      return;
    }
    const compulsoryAuto = meow.getPlayerSetting(event.player, "compulsoryAuto");
    if (!compulsoryAuto && !event.player.isSneaking) return;
    const lang = meow.getPlayerSetting(event.player, "language");
    if (fishingEvents.isAdminPaused()) {
      event.player.sendMessage(meow.getLocalizedText("admin_pause_active", lang));
      return;
    }
    startAutoFishing(event.player.id);
    event.player.sendMessage(meow.getLocalizedText("auto_fish", lang));
  });

  // 浮漂水面变化：清理下沉定时器
  fishingEvents.hookOnWaterSurfaceChange.subscribe(event => {
    if (!isAutoFishing(event.player?.id) || event.isOnWater) return;
    clearSinkingTimer(event.player.id);
  });

  // 收杆前拦截（手动收杆）
  fishingEvents.beforeReelRod.subscribe(event => {
    if (isGlobalTripped()) return;
    if (!isAutoFishing(event.player?.id)) return;
    clearPlayerFishingState(event.player.id);
    event.cancel = true;
    mc.system.run(() => event.hook?.remove());
  });

  // 收杆被动触发 & 钩到实体
  [fishingEvents.reelRod, fishingEvents.hookHitEntity].forEach(
    evt => {
      evt.subscribe(e => {
        if (!isAutoFishing(e.player?.id)) return;
        const lang = meow.getPlayerSetting(e.player, "language");
        clearPlayerFishingState(e.player.id);
        e.player.sendMessage(meow.getLocalizedText("auto_fish_stop", lang));
      });
    },
  );

  // 玩家离开：清钓鱼状态，并回收熔断记录（避免 CircuitBreaker Map 随玩家数增长）
  mc.world.beforeEvents.playerLeave.subscribe(e => {
    clearPlayerFishingState(e.player?.id);
    resetPlayerCircuit(e.player?.id);
  });

  // 切维度：只清钓鱼状态，熔断计数保留（不能用传送绕过熔断）
  mc.world.afterEvents.playerDimensionChange.subscribe(e => {
    clearPlayerFishingState(e.player?.id);
  });

  fishingEvents.hookAbnormal.subscribe(event => {
    if (!isAutoFishing(event.player?.id)) return;
    recordAbnormal(event.player, event.type);
  });
}
