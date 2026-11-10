/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import * as meow from "../lib/index.js";
import { MEOWFISH_VERSION, PROJECT_URL, LICENSE_URL } from "../SystemSettings.js";

/**
 * 显示"关于 MeowFish"主界面
 * @param {import("@minecraft/server").Player} player
 * @param {string} lang
 * @param {() => void} [onBack] - 返回主菜单回调（通常是 showIndexForm）
 */
export function showAboutForm(player, lang, onBack) {
  new ActionFormData()
    .title(meow.getLocalizedText("about_title", lang))
    .body(meow.getLocalizedText("about_body", lang, { version: MEOWFISH_VERSION }))
    .button(meow.getLocalizedText("about_license", lang))
    .button(meow.getLocalizedText("about_project", lang))
    .button(meow.getLocalizedText("about_thanks", lang))
    .button(meow.getLocalizedText("about_back_to_index", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      switch (result.selection) {
        case 0: return showLicenseForm(player, lang, onBack);
        case 1: return showProjectForm(player, lang, onBack);
        case 2: return showThanksForm(player, lang, onBack);
        case 3: onBack?.(); return;
      }
    });
}

/**
 * 许可证信息子页
 * @param {import("@minecraft/server").Player} player
 * @param {string} lang
 * @param {() => void} [onBack]
 */
function showLicenseForm(player, lang, onBack) {
  new MessageFormData()
    .title(meow.getLocalizedText("about_license_title", lang))
    .body(meow.getLocalizedText("about_license_body", lang, { url: LICENSE_URL }))
    .button1(meow.getLocalizedText("about_back_to_about", lang))
    .button2(meow.getLocalizedText("about_back_to_index", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      if (result.selection === 0) showAboutForm(player, lang, onBack);
      else if (result.selection === 1) onBack?.();
    });
}

/**
 * 项目主页子页
 * @param {import("@minecraft/server").Player} player
 * @param {string} lang
 * @param {() => void} [onBack]
 */
function showProjectForm(player, lang, onBack) {
  new MessageFormData()
    .title(meow.getLocalizedText("about_project_title", lang))
    .body(meow.getLocalizedText("about_project_body", lang, { url: PROJECT_URL }))
    .button1(meow.getLocalizedText("about_back_to_about", lang))
    .button2(meow.getLocalizedText("about_back_to_index", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      if (result.selection === 0) showAboutForm(player, lang, onBack);
      else if (result.selection === 1) onBack?.();
    });
}

/**
 * 致谢子页
 * @param {import("@minecraft/server").Player} player
 * @param {string} lang
 * @param {() => void} [onBack]
 */
function showThanksForm(player, lang, onBack) {
  new MessageFormData()
    .title(meow.getLocalizedText("about_thanks_title", lang))
    .body(meow.getLocalizedText("about_thanks_body", lang))
    .button1(meow.getLocalizedText("about_back_to_about", lang))
    .button2(meow.getLocalizedText("about_back_to_index", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      if (result.selection === 0) showAboutForm(player, lang, onBack);
      else if (result.selection === 1) onBack?.();
    });
}