/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import {
  translations,
  language,
  BASE_LANGUAGE,
  resolveLanguageChain,
} from "../../locales/index.js";
import { Settings } from "../../SystemSettings.js";

export { language };

const itemKey = {
  "minecraft:cod": "item.fish.name",
  "minecraft:tropical_fish": "item.clownfish.name",
  "minecraft:potion": "potion.emptyPotion.name",
  "minecraft:tripwire_hook": "tile.tripwire_hook.name",
  "minecraft:ink_sac": "item.dye.black.name",
  "minecraft:cocoa_beans": "item.dye.brown.name",
  "minecraft:bamboo": "tile.bamboo.name",
  "minecraft:waterlily": "tile.waterlily.name",
};

/**
 * 获取物品的翻译
 * @param {string} itemId - 物品ID
 */
export function getItemTranslation(itemId) {
  if (itemId in itemKey) return { translate: itemKey[itemId] };
  return { translate: `item.${itemId.split(":")[1]}.name` };
}

/**
 * 预编译的正则缓存，避免重复创建 RegExp。
 */
const regexCache = (() => {
  const cache = new Map();
  ["xp", "lang", "current", "max"].forEach(p => {
    cache.set(p, new RegExp(`{${p}}`, "g"));
  });
  return cache;
})();

function getRegexForParam(param) {
  if (!regexCache.has(param)) {
    regexCache.set(param, new RegExp(`{${param}}`, "g"));
  }
  return regexCache.get(param);
}

/**
 * 根据键名和当前语言设置获取本地化文本。
 *
 * 回退链：
 *   请求语言 → (LANG_FALLBACK 中的语系近似语言) → BASE_LANGUAGE → `[Missing translation: key]`
 *
 * 语言代码支持 `zh_CN` / `zh-CN` / `en_US` 等常见写法，内部会归一化。
 *
 * @param {string} key - 文本键名
 * @param {string} [language] - 请求的语言，缺省使用 Settings.language 或 BASE_LANGUAGE
 * @param {Object<string, string|number>} [params] - 占位符替换参数
 * @returns {string}
 */
export function getLocalizedText(
  key,
  language = Settings.language ?? BASE_LANGUAGE,
  params = {},
) {
  const chain = resolveLanguageChain(language);

  let text;
  for (const lang of chain) {
    const dict = translations[lang];
    if (dict && typeof dict[key] === "string") {
      text = dict[key];
      break;
    }
  }
  if (text === undefined) {
    text = `[Missing translation: ${key}]`;
  }

  for (const param in params) {
    const regex = getRegexForParam(param);
    text = text.replace(regex, params[param]);
  }

  return text;
}
