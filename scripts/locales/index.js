/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { en_US } from "./en_US.js";
import { zh_CN } from "./zh_CN.js";
import { zh_TW } from "./zh_TW.js";

/**
 * 各种语言的文本映射
 * 所有已注册的语言必须在这里出现，才能被 getLocalizedText 解析。
 * @type {Record<string, Record<string, string>>}
 */
export const translations = {
  en_US,
  zh_CN,
  zh_TW,
};

/**
 * 支持的界面语言（用于设置表单选项，顺序影响显示顺序）
 * @type {string[]}
 */
export const language = ["zh_CN", "zh_TW", "en_US"];

/**
 * 基准语言：校验与回退的最终锚点。
 * 它必须存在于 translations 中，并且包含全部 key。
 */
export const BASE_LANGUAGE = "en_US";

/**
 * 语系近似回退表。
 *
 * 用途：
 *   1. 玩家传入了未注册的语言变体（如 zh_HK）时，先回退到同语系主语言；
 *   2. 若仍未注册，再回退到 BASE_LANGUAGE。
 *
 * 新增语言时，建议同时补上它的大区变体，例如 pt_BR 增加后补 pt_PT: "pt_BR"。
 *
 * @type {Record<string, string>}
 */
export const LANG_FALLBACK = {
  // 中文
  zh_HK: "zh_TW",
  zh_MO: "zh_TW",
  zh_SG: "zh_CN",

  // 西班牙语（以拉美为基准）
  es_AR: "es_MX",
  es_BO: "es_MX",
  es_CL: "es_MX",
  es_CO: "es_MX",
  es_CR: "es_MX",
  es_DO: "es_MX",
  es_EC: "es_MX",
  es_ES: "es_MX",
  es_GT: "es_MX",
  es_HN: "es_MX",
  es_NI: "es_MX",
  es_PA: "es_MX",
  es_PE: "es_MX",
  es_PR: "es_MX",
  es_PY: "es_MX",
  es_SV: "es_MX",
  es_UY: "es_MX",
  es_VE: "es_MX",

  // 葡萄牙语
  pt_PT: "pt_BR",

  // 英语区
  en_GB: "en_US",
  en_AU: "en_US",
  en_CA: "en_US",
  en_NZ: "en_US",
  en_IE: "en_US",
  en_ZA: "en_US",
  en_IN: "en_US",
};

/**
 * 归一化语言代码：把常见的横杠、大小写变体统一成 `xx_XX` 格式。
 * @param {string} code
 * @returns {string}
 */
function normalizeLangCode(code) {
  if (!code || typeof code !== "string") return BASE_LANGUAGE;
  const parts = code.replace(/-/g, "_").split("_");
  if (parts.length === 1) return parts[0].toLowerCase();
  return `${parts[0].toLowerCase()}_${parts[1].toUpperCase()}`;
}

/**
 * 解析出用于 getLocalizedText 的完整回退链。
 *
 * 结果结构：`[归一化后的请求语言, ...中间变体..., BASE_LANGUAGE?]`
 * - 第一项永远是归一化后的请求语言（即使它不存在于 translations，也会先试一次）
 * - 最后一项保证包含 BASE_LANGUAGE
 *
 * @param {string} code
 * @returns {string[]}
 */
export function resolveLanguageChain(code) {
  const chain = [];
  const seen = new Set();
  let current = normalizeLangCode(code);

  // 沿 LANG_FALLBACK 逐级回退，最多 8 跳，防止表配置错误导致死循环
  let hops = 0;
  while (current && !seen.has(current) && hops++ < 8) {
    seen.add(current);
    chain.push(current);
    // 当前语言已注册，不再依赖 LANG_FALLBACK
    if (current in translations) break;
    current = LANG_FALLBACK[current];
  }

  // 最终兜底到基准语言
  if (!chain.includes(BASE_LANGUAGE)) chain.push(BASE_LANGUAGE);
  return chain;
}

/**
 * 校验全部语言的 key 完整性与占位符一致性。
 *
 * 检查项：
 *   - 相对基准语言缺失的 key
 *   - 相对基准语言多余的 key（通常是拼写错误）
 *   - 占位符集合不一致（如基准有 {lang} 但当前语言没有）
 *
 * 不抛错；返回一个可序列化的问题清单，便于启动时集中输出。
 *
 * @returns {Array<{
 *   name: string,
 *   missing: string[],
 *   extra: string[],
 *   placeholderIssues: Array<{ key: string, expected: string[], got: string[] }>,
 * }>}
 */
export function validateTranslations() {
  const base = translations[BASE_LANGUAGE];
  if (!base) return [];
  const baseKeys = Object.keys(base);

  const issues = [];
  for (const [name, dict] of Object.entries(translations)) {
    if (name === BASE_LANGUAGE) continue;

    const missing = baseKeys.filter(k => !(k in dict));
    const extra = Object.keys(dict).filter(k => !baseKeys.includes(k));
    const placeholderIssues = [];

    for (const k of baseKeys) {
      if (!(k in dict)) continue;
      const basePlaceholders = (base[k].match(/\{(\w+)\}/g) || []).sort();
      const dictPlaceholders = (dict[k].match(/\{(\w+)\}/g) || []).sort();
      if (basePlaceholders.join() !== dictPlaceholders.join()) {
        placeholderIssues.push({
          key: k,
          expected: basePlaceholders,
          got: dictPlaceholders,
        });
      }
    }

    if (missing.length || extra.length || placeholderIssues.length) {
      issues.push({ name, missing, extra, placeholderIssues });
    }
  }
  return issues;
}

/**
 * 在控制台打印校验结果。无问题时静默。
 * @param {ReturnType<typeof validateTranslations>} issues
 */
export function reportTranslationIssues(issues) {
  if (!issues || issues.length === 0) return;
  const lines = ["[MeowFish i18n] 语言文件存在以下问题："];
  for (const it of issues) {
    if (it.missing.length) {
      lines.push(`  ${it.name} 缺失 ${it.missing.length} 个 key: ${it.missing.join(", ")}`);
    }
    if (it.extra.length) {
      lines.push(`  ${it.name} 多余 ${it.extra.length} 个 key（可能拼写错误）: ${it.extra.join(", ")}`);
    }
    for (const p of it.placeholderIssues) {
      lines.push(
        `  ${it.name}.${p.key} 占位符不一致：基准 ${p.expected.join(",") || "(无)"}，当前 ${p.got.join(",") || "(无)"}`,
      );
    }
  }
  console.warn(lines.join("\n"));
}
