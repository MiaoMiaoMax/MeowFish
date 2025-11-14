/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { Settings } from "../../SystemSettings";

// 定义各种语言的文本映射
const translations = {
  auto_fish: {
    zh_CN: "[§3MeowFish§r -> §3你§r] 本次钓鱼已启用自动钓鱼",
    zh_TW: "[§3MeowFish§r -> §3你§r] 本次釣魚已啟用自動釣魚",
    en_US: "[§3MeowFish§r -> §3You§r] This fishing has been enabled automatically",
  },
  gain_xp: {
    zh_CN: "获得§b{xp}经验§r, ",
    zh_TW: "獲得§b{xp}經驗§r, ",
    en_US: "Gained §b{xp} XP§r, ",
  },
  rod_durability_info: {
    zh_CN: "钓鱼竿耐久: {current}/{max}",
    zh_TW: "釣魚竿耐久: {current}/{max}",
    en_US: "Fishing rod durability: {current}/{max}",
  },
  rod_durability_warning: {
    zh_CN: "[§3MeowFish§r -> §3你§r] 钓鱼竿没有耐久啦",
    zh_TW: "[§3MeowFish§r -> §3你§r] 釣魚竿沒有耐久啦",
    en_US: "[§3MeowFish§r -> §3You§r] Fishing rod is out of durability",
  },
  rod_about_to_replace: {
    zh_CN: "钓鱼竿耐久: {current}/{max} 即将替换",
    zh_TW: "釣魚竿耐久: {current}/{max} 即將替換",
    en_US: "Fishing rod durability: {current}/{max} about to replace",
  },
  rod_about_to_warning: {
    zh_CN: "钓鱼竿耐久: {current}/{max} §6低耐久！",
    zh_TW: "釣魚竿耐久: {current}/{max} §6低耐久！",
    en_US: "Fishing rod durability: {current}/{max} §6low durability!",
  },
  creative_mode: {
    zh_CN: "创造模式",
    zh_TW: "創造模式",
    en_US: "Creative mode",
  },
  rod_replaced_successfully: {
    zh_CN: "§a钓鱼竿替换成功",
    zh_TW: "§a釣魚竿替換成功",
    en_US: "§aFishing rod replaced successfully",
  },
  rod_replaced_failed: {
    zh_CN: "§c钓鱼竿替换失败",
    zh_TW: "§c釣魚竿替換失敗",
    en_US: "§cFishing rod replacement failed",
  },
  rod_destroyed: {
    zh_CN: "§c钓鱼竿损毁",
    zh_TW: "§c釣魚竿損毀",
    en_US: "§cFishing rod destroyed",
  },
  setting_title: {
    zh_CN: "MeowFish设置",
    zh_TW: "MeowFish設定",
    en_US: "MeowFish Settings",
  },
  setting_language: {
    zh_CN: "语言(Language): ",
    zh_TW: "語言(Language): ",
    en_US: "Language(语言): ",
  },
  setting_protect: {
    zh_CN: "保护钓鱼竿耐久（留1点耐久）\n\n",
    zh_TW: "保護釣魚竿耐久（留1點耐久）\n\n",
    en_US: "Protect fishing rod durability (leave 1 durability)\n\n",
  },
  setting_replace: {
    zh_CN: "搜索背包替换当前钓鱼竿\n（如果当前钓鱼竿没耐久）\n\n",
    zh_TW: "搜尋背包替換當前釣魚竿\n（如果當前釣魚竿沒耐久）\n\n",
    en_US: "Search inventory to replace current fishing rod\n (if current fishing rod has no durability)\n\n",
  },
  setting_compulsoryAuto: {
    zh_CN: "强制自动钓鱼（无论是否下蹲）\n\n",
    zh_TW: "強制自動釣魚（無論是否蹲下）\n\n",
    en_US: "Compulsory auto-fishing (regardless of whether you are crouching)\n\n",
  },
};

/**
 * 根据键名和当前语言设置获取本地化文本
 * @param {string} key - 文本键名
 * @param {string} language - 当前语言设置，默认为zh_CN
 * @param {Object} params - 参数对象，用于替换文本中的占位符
 * @returns {string} 本地化后的文本
 */
export function getLocalizedText(
  key,
  language = Settings.language || "zh_CN",
  params = {}
) {
  // 获取对应键的文本映射
  const textMap = translations[key];
  if (!textMap) {
    return `[Missing translation: ${key}]`;
  }

  // 获取对应语言的文本
  let text = textMap[language];
  if (!text) {
    // 如果没有对应语言的文本，回退到简体中文
    text =
      textMap["zh_CN"] || `[Missing translation for language: ${language}]`;
  }

  // 替换参数中的占位符
  for (const param in params) {
    text = text.replace(new RegExp(`{${param}}`, "g"), params[param]);
  }

  return text;
}
