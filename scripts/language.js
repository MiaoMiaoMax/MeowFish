/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { Settings } from "./SystemSettings";

// 定义各种语言的文本映射
const translations = {
    "gain_xp": {
        "zh_CN": "获得§b{xp}经验§r, ",
        "zh_TW": "獲得§b{xp}經驗§r, ",
        "en_US": "Gained §b{xp} XP§r, "
    },
    "rod_durability_info": {
        "zh_CN": "钓鱼竿耐久: {current}/{max}",
        "zh_TW": "釣魚竿耐久: {current}/{max}",
        "en_US": "Fishing rod durability: {current}/{max}"
    },
    "rod_about_to_replace": {
        "zh_CN": "钓鱼竿耐久: {current}/{max} 即将替换",
        "zh_TW": "釣魚竿耐久: {current}/{max} 即將替換",
        "en_US": "Fishing rod durability: {current}/{max} about to replace"
    },
    "creative_mode": {
        "zh_CN": "创造模式",
        "zh_TW": "創造模式",
        "en_US": "Creative mode"
    },
    "rod_replaced_successfully": {
        "zh_CN": "钓鱼竿替换成功",
        "zh_TW": "釣魚竿替換成功",
        "en_US": "Fishing rod replaced successfully"
    },
    "rod_replacement_failed": {
        "zh_CN": "钓鱼竿替换失败",
        "zh_TW": "釣魚竿替換失敗",
        "en_US": "Fishing rod replacement failed"
    },
    "rod_destroyed": {
        "zh_CN": "钓鱼竿损毁",
        "zh_TW": "釣魚竿損毀",
        "en_US": "Fishing rod destroyed"
    }
};

/**
 * 根据键名和当前语言设置获取本地化文本
 * @param {string} key - 文本键名
 * @param {Object} params - 参数对象，用于替换文本中的占位符
 * @returns {string} 本地化后的文本
 */
export function getLocalizedText(key, params = {}) {
    // 获取语言设置，默认为zh_CN
    const language = Settings.language || "zh_CN";
    
    // 获取对应键的文本映射
    const textMap = translations[key];
    if (!textMap) {
        return `[Missing translation: ${key}]`;
    }
    
    // 获取对应语言的文本
    let text = textMap[language];
    if (!text) {
        // 如果没有对应语言的文本，回退到简体中文
        text = textMap["zh_CN"] || `[Missing translation for language: ${language}]`;
    }
    
    // 替换参数中的占位符
    for (const param in params) {
        text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    }
    
    return text;
}