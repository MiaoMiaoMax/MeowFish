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
import { Settings } from "../SystemSettings.js";

/**
 * 注册温馨提示（玩家首次进入或重新登录时触发）
 * @listens mc.world.afterEvents.playerSpawn
 */
export function registerTip() {
  mc.world.afterEvents.playerSpawn.subscribe(event => {
    if (!event.player?.isValid || !event.initialSpawn) return;
    //==== 迁移旧属性 ======
    const oldLootSetting = event.player.getDynamicProperty("meow_lootAtPlayerLoc");
    if (oldLootSetting !== undefined) {
      meow.setPlayerSetting(event.player, "lootMode", oldLootSetting ? 1 : 0);
      event.player.setDynamicProperty("meow_lootAtPlayerLoc");
    }
    //====================
    const tip = meow.getPlayerSetting(event.player, "tip");
    if (!tip) return;
        const lang = meow.getPlayerSetting(event.player, "language");
    const compulsoryAuto = meow.getPlayerSetting(event.player, "compulsoryAuto");
    const langIsExplicit = meow.hasPlayerSetting(event.player, "language");
    const compulsoryIsExplicit = meow.hasPlayerSetting(event.player, "compulsoryAuto");

    let message = meow.getLocalizedText("tip", lang);
    if (!langIsExplicit) {
      message += meow.getLocalizedText("tip_lang_default", lang, {
        lang: meow.getLocalizedText("lang", Settings.language),
      });
    } else {
      message += meow.getLocalizedText("tip_lang", lang, {
        lang: meow.getLocalizedText("lang", lang),
      });
    }
    if (!compulsoryIsExplicit) {
      message += Settings.compulsory_auto
        ? meow.getLocalizedText("tip_compulsoryAuto_default_1", lang)
        : meow.getLocalizedText("tip_compulsoryAuto_0", lang);
    } else {
      message += compulsoryAuto
        ? meow.getLocalizedText("tip_compulsoryAuto_1", lang)
        : meow.getLocalizedText("tip_compulsoryAuto_0", lang);
    }
    message += meow.getLocalizedText("tip_setting", lang);
    const vd = event.player.getViewDirection();
    let t = 0;
    const r = mc.system.runInterval(() => {
      if (++t >= 600 || !event.player?.isValid) return mc.system.clearRun(r);
      if (t < 600 && meow.Vector3.distanceSquared(event.player.getViewDirection(), vd) === 0) return;
      event.player.sendMessage(message);
      mc.system.clearRun(r);
    }, 60);
  });
}
