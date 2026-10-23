# Language File Contribution Guide

<div align="center">

English | [简体中文](./CONTRIBUTING.zh_CN.md) | [繁体中文](./CONTRIBUTING.zh_TW.md)

</div>

`scripts\locales` directory contains all language files for MeowFish-AutoFish. Each language file is a standalone ES module that exports a flat `key → text` object.

We welcome contributions in any language. As long as you can express the UI text clearly in your native language, we'll take care of the rest.

---

## Table of Contents

- [1. Currently Supported Languages](#1-currently-supported-languages)
- [2. File Structure](#2-file-structure)
- [3. How to Add a New Language](#3-how-to-add-a-new-language)
- [4. What Must Be Preserved](#4-what-must-be-preserved)
- [5. Language Fallback Table](#5-language-fallback-table)
- [6. Pre-Submission Checklist](#6-pre-submission-checklist)
- [7. Terminology Reference](#7-terminology-reference)
- [8. How to Submit](#8-how-to-submit)
- [9. FAQ](#9-faq)

---

## 1. Currently Supported Languages

| Code | Language | Status | Maintainer |
| :--- | :--- | :--- | :--- |
| `en_US` | English | Complete | Official |
| `zh_CN` | Simplified Chinese | Complete | Official |
| `zh_TW` | Traditional Chinese | Complete | Official |

These three are the **baseline languages**. `en_US` is the final anchor for validation and fallback. Any newly added language must contain at least all of its keys.

---

## 2. File Structure

```
locales/
├── index.js        # Aggregated export; register new languages here
├── en_US.js        # Baseline language (English)
├── zh_CN.js        # Simplified Chinese
├── zh_TW.js        # Traditional Chinese
└── README.md       # This file
```

Every language file must keep the license header at the top, in the following form:

```js
/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

export const xx_XX = {
  // ...
};
```

---

## 3. How to Add a New Language

Using Japanese (`ja_JP`) as an example, there are 4 steps.

### Step 1: Copy the template

```bash
cp en_US.js ja_JP.js
```

### Step 2: Translate the strings on the right side

Open `ja_JP.js` and **only modify the text inside the quotes on the right side of each equals sign**. Do not touch the keys on the left, nor the license header at the top.

```js
// ✅ Correct
auto_fish: "[§3MeowFish§r -> §3あなた§r] 今回のキャストで自動釣りが有効になりました。",

// ❌ Wrong: changed the key
auto_fishing: "...",

// ❌ Wrong: removed the placeholder
gain_xp: "§b経験値§r を獲得, ",  // {xp} must be preserved

// ❌ Wrong: removed the line breaks
setting_protect: "釣り竿の耐久値を保護する（耐久値を1残す）",
// Original is "...\n\n"; both line breaks must not be lost
```

### Step 3: Register in `locales/index.js`

Open `locales/index.js` and make two edits:

```js
// Top import section
import { ja_JP } from "./ja_JP";

// translations object
export const translations = {
  en_US,
  zh_CN,
  zh_TW,
  ja_JP,   // ← New
};

// language array (order determines display order in the settings form)
export const language = ["zh_CN", "zh_TW", "en_US", "ja_JP"];  // ← New
```

### Step 4: Verify locally

Start the server and check the console.

**Normal case**: no warnings starting with `[MeowFish i18n]`.

**Missing keys**:

```
[MeowFish i18n] The following issues were found in language files:
  ja_JP is missing 2 key(s): setting_volume, item_form_mode_switch
```

**Placeholder issues**:

```
[MeowFish i18n] The following issues were found in language files:
  ja_JP.gain_xp placeholder mismatch: expected {xp}, got (none)
```

Fix them as indicated.

---

## 4. What Must Be Preserved

The following must never be lost during translation.

| Type | Example | Notes |
| :--- | :--- | :--- |
| **Placeholders** | `{lang}` `{xp}` `{current}` `{max}` `{name}` `{mode}` `{status}` | Must match `en_US.js` exactly in spelling, count, and position. Do not translate, delete, or rename them. |
| **Color codes** | `§a` `§c` `§6` `§r` `§b` `§4` | Minecraft formatting codes; keep their original position and order. |
| **Line breaks** | `\n` `\n\n` | None may be omitted, or the UI form will collapse into a single line. `\n\n` is typically used as a trailing separator after form controls. |
| **Prefix** | `[§3MeowFish§r -> §3...§r]` | Keep the overall format; only translate the pronoun after the arrow (e.g. You → 你 → あなた). |

### Example comparison

```js
// Baseline en_US
gain_xp: "Gained §b{xp} XP§r, ",

// ✅ Correct: both placeholder and color codes preserved
gain_xp: "§b{xp} 経験値§r を獲得, ",

// ❌ Wrong: {xp} lost
gain_xp: "経験値を獲得, ",

// ❌ Wrong: placeholder renamed
gain_xp: "Gained §b{experience} XP§r, ",

// ❌ Wrong: color code lost
gain_xp: "Gained {xp} XP, ",
```

---

## 5. Language Fallback Table

If a new language belongs to an existing language family (e.g. Cantonese `zh_HK` belongs to Chinese, Brazilian Portuguese `pt_BR` belongs to Portuguese), you do not need to write a full file for each variant.

Instead, register the fallback relationship in the `LANG_FALLBACK` object in `locales/index.js`:

```js
export const LANG_FALLBACK = {
  zh_HK: "zh_TW",  // Cantonese players see Traditional Chinese, better than English
  pt_PT: "pt_BR",  // Portugal players see Brazilian Portuguese
  ...
};
```

The fallback chain resolves as follows:

```
Requested language → look up LANG_FALLBACK repeatedly → en_US → [Missing translation: key]
```

For example, when a player sets `zh_HK`:

1. Check whether a `zh_HK` file exists → No
2. Check `LANG_FALLBACK.zh_HK` → resolves to `zh_TW`
3. Check whether `zh_TW` exists → Yes; use Traditional Chinese
4. If `zh_TW` did not exist, continue to `LANG_FALLBACK.zh_TW` → not found → fall back to `en_US`

This mechanism allows you to **support a batch of related language variants with a single line of code**, without maintaining multiple nearly identical translations.

---

## 6. Pre-Submission Checklist

Before submitting a PR, please go through the following items:

- [ ] The license header at the top of the file is unchanged
- [ ] All keys in `en_US.js` have been translated, none missing
- [ ] All `{xxx}` placeholders are preserved, with identical spelling and count
- [ ] All `§x` color codes are preserved
- [ ] Line break count matches `en_US.js` (especially `\n\n`)
- [ ] Registered in the `translations` object of `locales/index.js`
- [ ] Added to the `language` array of `locales/index.js` (controls display in the settings form)
- [ ] After starting the server, there are **no** `[MeowFish i18n]` warnings in the console
- [ ] Verified by actually switching to the new language in the settings form and checking the UI text

---

## 7. Terminology Reference

To keep terminology consistent within each language, refer to Minecraft's official translations and community conventions.

| English | Simplified Chinese | Traditional Chinese | Japanese (reference) |
| :--- | :--- | :--- | :--- |
| fishing rod | 钓鱼竿 | 釣魚竿 | 釣り竿 |
| durability | 耐久 | 耐久 | 耐久値 |
| loot | 战利品 | 戰利品 | 戦利品 |
| lure | 饵钓 | 魚餌 | ルアー |
| luck of the sea | 海之眷顾 | 海之祝福 | 宝釣り |
| mending | 经验修补 | 修補 | 修繕 |
| unbreaking | 耐久 | 耐久 | 耐久 |
| auto fishing | 自动钓鱼 | 自動釣魚 | 自動釣り |
| fishing farm | 钓鱼机 | 釣魚機 | 釣り堀 |
| circuit breaker | 熔断器 | 熔斷器 | サーキットブレーカー |
| biome | 群系 | 生態域 | バイオーム |
| dimension | 维度 | 維度 | ディメンション |

> **Item names do not need translation**: `getItemTranslation()` returns `{ translate: "item.xxx.name" }`, and the game client renders it in each player's own language. You only need to translate the UI text.

---

## 8. How to Submit

### Option 1: GitHub PR (recommended)

1. Fork this repository
2. Create a branch named `i18n/ja_JP`
3. Commit the complete `ja_JP.js` and the updated `locales/index.js`
4. Open a PR with the title format: `[i18n] Add 日本語 (ja_JP)`
5. PR description template:

```markdown
## Language Info
- Language: 日本語 (ja_JP)
- Code: `ja_JP`

## Native Speaker Statement
Japanese is my native language; I have proofread all keys for grammar, terminology, and consistency.

## Test Environment
- Bedrock Edition version: 1.26.0
- MeowFish version: v1.0.0
- Platform: Windows / Android / iOS

## Verification Results
- No `[MeowFish i18n]` warnings on startup: ✅
- Settings form text displays correctly after switching language: ✅
- Circuit breaker messages, rod durability messages, and item filter UI all verified: ✅

## Screenshots
(Optional: screenshots of the settings menu and in-game messages)
```

### Option 2: Attach the file in an Issue

Not familiar with Git? You can also paste the complete `ja_JP.js` file into an issue and let the maintainers merge it for you.

When creating the issue, choose the **"New Language"** template and paste the file content into a code block.

---

## 9. FAQ

### Q1: I found a typo in an existing translation (e.g. `zh_TW`). What should I do?

Just open a PR to fix it, with the title format: `[i18n] zh_TW fix several terms`. Include the before/after comparison.

### Q2: What if a phrase has no equivalent concept in my language?

Follow these principles:

- **Game-specific terms**: prefer Minecraft's official translation
- **Technical terms** (e.g. "circuit breaker", "state machine"): translate meaningfully, and include the English term in parentheses if necessary
- **Colloquial hints** (e.g. "Low durability!"): express it naturally in your language rather than translating literally

### Q3: Can I submit only a partial translation?

Yes. Missing keys will be listed by the validation script on startup, and will fall back to `en_US` (English). However, we recommend submitting a complete translation at once to avoid showing players a mix of languages.

### Q4: I've completed 80% of a translation. Can it be merged first?

Yes, but please state the completion percentage in the PR description. We will either delay registering the language in the `language` array, or add a comment such as `// TODO: complete xxx` so you can continue later.

### Q5: Can I directly put variants like `zh-HK` into `Settings.language`?

Yes. The fallback chain will resolve automatically:

- `zh-HK` → `zh_TW` (if present) → `en_US`
- `en-GB` → `en_US`
- `pt-PT` → `pt_BR` (if present) → `en_US`

See [Section 5: Language Fallback Table](#5-language-fallback-table).

### Q6: Why isn't my language file being loaded?

Check two things:

1. Is it registered in the `translations` object of `locales/index.js`?
2. Is it added to the `language` array of `locales/index.js`? (This controls whether it appears in the settings form.)

### Q7: Can I modify the license header at the top of the file?

No. The license header is maintained centrally by the original author, and must be preserved verbatim in every language copy.

---

## Contact

- **GitHub Issues**: preferred channel
- **Discussion**: discuss directly in a PR, or open an issue to discuss the translation of a specific term
- **Acknowledgements**: every language contributor will be listed in the Contributors section of the README

Thank you for contributing — together we can let more players use MeowFish in their native language 🎣


MeowFish-AutoFish  
Copyright (c) 2025 MiaoMiaoMax (2025-present)

本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问  
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit  
https://creativecommons.org/licenses/by-nc-sa/4.0/
