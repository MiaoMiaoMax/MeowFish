/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { Settings } from "../../SystemSettings";

// 定义各种语言的文本映射
const translations = {
  lang: {
    zh_CN: "简体中文",
    zh_TW: "繁體中文",
    en_US: "English",
  },
  tip: {
    zh_CN: "本世界已启用MeowFish（自动钓鱼）\n",
    zh_TW: "本世界已啟用MeowFish（自動釣魚）\n",
    en_US: "This world has enabled MeowFish (Auto Fishing)\n",
  },
  tip_lang_default: {
    zh_CN: "当前使用默认语言设置：{lang}\n",
    zh_TW: "目前使用預設語言設定：{lang}\n",
    en_US: "Currently using default language setting: {lang}\n",
  },
  tip_lang: {
    zh_CN: "你已设置语言为：{lang}\n",
    zh_TW: "你已設定語言為：{lang}\n",
    en_US: "You've set the language to: {lang}\n",
  },
  tip_compulsoryAuto_0: {
    zh_CN: "下蹲抛竿，即可触发自动钓鱼。\n",
    zh_TW: "蹲下拋竿，即可觸發自動釣魚。\n",
    en_US: "Crouch and cast your rod to trigger auto-fishing.\n",
  },
  tip_compulsoryAuto_1: {
    zh_CN: "你已启用强制自动钓鱼，抛竿即可触发自动钓鱼。\n",
    zh_TW: "你已啟用強制自動釣魚，拋竿即可觸發自動釣魚。\n",
    en_US: "You've enabled compulsory auto-fishing, cast your rod to trigger auto-fishing.\n",
  },
  tip_compulsoryAuto_default_1: {
    zh_CN: "本世界默认启用强制自动钓鱼，抛竿即可触发自动钓鱼。\n",
    zh_TW: "本世界預設啟用強制自動釣魚，拋竿即可觸發自動釣魚。\n",
    en_US: "This world has compulsory auto-fishing enabled by default, cast your rod to trigger auto-fishing.\n",
  },
  tip_setting: {
    zh_CN: "用纸张命名为 MF设置 使用即可打开个人设置。\n",
    zh_TW: "用紙張命名為 MF設置 使用即可打開個人設置。\n",
    en_US: "Use paper named 'MFSetting' to open personal settings.\n",
  },
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
    zh_CN: "MeowFish个人设置",
    zh_TW: "MeowFish個人設定",
    en_US: "MeowFish Personal Settings",
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
  setting_reduceSinking: {
    zh_CN: "减少鱼钩下沉幅度\n（减少了鱼钩上浮时间，也许会缩短咬钩间隔）\n\n",
    zh_TW: "減少魚鉤下沉幅度\n（減少了魚鉤上浮時間，也許會縮短咬鉤間隔）\n\n",
    en_US: "Reduce hook sinking amplitude\n(Reduces the floating time of the hook, which may shorten the bite interval)\n\n",
  },
  setting_tip: {
    zh_CN: "温馨提示（进入游戏时的提示）\n\n",
    zh_TW: "温馨提示（進入遊戲時的提示）\n\n",
    en_US: "Warm tips (Tips when entering the game)\n\n",
  },
  setting_lootAtPlayerLoc: {
    zh_CN: "战利品在生成到玩家位置\n（直接在脚下生成）\n\n",
    zh_TW: "戰利品在生成到玩家位置\n（直接在脚下生成）\n\n",
    en_US: "Loot at player location\n(Generated directly at the foot)\n\n",
  },
  setting_jungleLoot: {
    zh_CN: "是否强制获取丛林群系钓鱼战利品\n（比普通战利品多了竹子等的小东西）\n\n",
    zh_TW: "是否強制獲取丛林群系釣魚戰利品\n（比普通戰利品多了竹子等的小東西）\n\n",
    en_US: "Whether to force the acquisition of loot from the Jungle biome\n(There are small things like bamboo added to the normal loot)\n\n",
  }
};

/**
 * 导出语言配置数组
 * 
 * 该数组包含了系统支持的语言选项，用于国际化配置
 */
export const language = ["zh_CN", "zh_TW", "en_US"];

/**
 * 根据键名和当前语言设置获取本地化文本
 * @param {string} key - 文本键名
 * @param {string} language - 当前语言设置，默认为zh_CN
 * @param {Object} params - 参数对象，用于替换文本中的占位符
 * @returns {string} 本地化后的文本
 */
export function getLocalizedText(
  key,
  language = Settings.language ?? "zh_CN",
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
