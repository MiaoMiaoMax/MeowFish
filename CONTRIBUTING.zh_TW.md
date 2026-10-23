# 語言檔案貢獻指南

<div align="center">
  
[English](./CONTRIBUTING.md) | [简体中文](./CONTRIBUTING.zh_CN.md) | 繁体中文

</div>

`scripts\locales` 目錄存放 MeowFish-AutoFish 的全部語言檔案。每份語言檔案都是一個獨立的 ES 模組，匯出一個 `key → 文字` 的扁平物件。

我們歡迎任何語言的翻譯貢獻。只要你能用母語把介面文字說清楚，剩下的事我們幫你想好。

---

## 目錄

- [一、目前支援的語言](#一目前支援的語言)
- [二、檔案結構](#二檔案結構)
- [三、如何新增一門語言](#三如何新增一門語言)
- [四、必須保留的內容](#四必須保留的內容)
- [五、語系回退表](#五語系回退表)
- [六、提交前檢查清單](#六提交前檢查清單)
- [七、術語參考](#七術語參考)
- [八、如何提交](#八如何提交)
- [九、常見問題](#九常見問題)

---

## 一、目前支援的語言

| 代碼 | 語言 | 狀態 | 維護者 |
| :--- | :--- | :--- | :--- |
| `en_US` | English | 完整 | 官方 |
| `zh_CN` | 简体中文 | 完整 | 官方 |
| `zh_TW` | 繁體中文 | 完整 | 官方 |

以上三份是**基準語言**。`en_US` 是校驗與回退的最終錨點，任何新增語言都必須至少包含它的全部 key。

---

## 二、檔案結構

```
locales/
├── index.js        # 彙總匯出，註冊新語言的位置
├── en_US.js        # 基準語言（English）
├── zh_CN.js        # 簡體中文
├── zh_TW.js        # 繁體中文
└── README.md       # 本檔案
```

每個語言檔案的頂部必須保留授權註解，內容形如：

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

## 三、如何新增一門語言

以新增日語（`ja_JP`）為例，共 4 步。

### 第一步：複製範本

```bash
cp en_US.js ja_JP.js
```

### 第二步：翻譯右側字串

打開 `ja_JP.js`，**只改等號右側引號內的文字**。左側的 key、檔案頂部的授權註解都不動。

```js
// ✅ 正確
auto_fish: "[§3MeowFish§r -> §3あなた§r] 今回のキャストで自動釣りが有効になりました。",

// ❌ 錯誤：改了 key
auto_fishing: "...",

// ❌ 錯誤：刪掉了佔位符
gain_xp: "§b経験値§r を獲得, ",  // {xp} 必須保留

// ❌ 錯誤：刪掉了換行
setting_protect: "釣り竿の耐久値を保護する（耐久値を1残す）",
// 原版是 "...\n\n"，兩個換行不能丟
```

### 第三步：在 `locales/index.js` 註冊

打開 `locales/index.js`，修改兩處：

```js
// 頂部 import 區
import { ja_JP } from "./ja_JP";

// translations 物件
export const translations = {
  en_US,
  zh_CN,
  zh_TW,
  ja_JP,   // ← 新增
};

// language 陣列（順序影響設定表單裡的顯示順序）
export const language = ["zh_CN", "zh_TW", "en_US", "ja_JP"];  // ← 新增
```

### 第四步：本機啟動驗證

啟動伺服器，觀察主控台。

**正常情況**：沒有 `[MeowFish i18n]` 開頭的警告。

**有漏翻**：

```
[MeowFish i18n] 語言檔案存在以下問題：
  ja_JP 缺少 2 個 key: setting_volume, item_form_mode_switch
```

**有佔位符問題**：

```
[MeowFish i18n] 語言檔案存在以下問題：
  ja_JP.gain_xp 佔位符不一致：基準 {xp}，目前 (無)
```

依提示補齊即可。

---

## 四、必須保留的內容

翻譯時下面幾類東西一個都不能丟。

| 類型 | 範例 | 說明 |
| :--- | :--- | :--- |
| **佔位符** | `{lang}` `{xp}` `{current}` `{max}` `{name}` `{mode}` `{status}` | 必須與 `en_US.js` 中的拼寫、數量、位置完全一致。不能被翻譯、刪除或改名。 |
| **顏色代碼** | `§a` `§c` `§6` `§r` `§b` `§4` | MC 格式化代碼，保留原有位置與順序。 |
| **換行** | `\n` `\n\n` | 一個都不能少，否則 UI 表單會擠成一行。`\n\n` 通常用於表單控制項的末尾分隔。 |
| **前綴** | `[§3MeowFish§r -> §3...§r]` | 保持統一格式，只翻譯箭頭後的人稱代名詞（如 You → 你 → あなた）。 |

### 範例對比

```js
// 基準 en_US
gain_xp: "Gained §b{xp} XP§r, ",

// ✅ 正確：佔位符與顏色代碼都保留
gain_xp: "§b{xp} 経験値§r を獲得, ",

// ❌ 錯誤：丟了 {xp}
gain_xp: "経験値を獲得, ",

// ❌ 錯誤：改了佔位符名字
gain_xp: "Gained §b{experience} XP§r, ",

// ❌ 錯誤：丟了顏色代碼
gain_xp: "Gained {xp} XP, ",
```

---

## 五、語系回退表

如果新增的語言屬於既有語系（例如粵語 `zh_HK` 屬於中文，巴西葡語 `pt_BR` 屬於葡萄牙語），你不必為每個變體單獨寫一份完整檔案。

只需在 `locales/index.js` 的 `LANG_FALLBACK` 中登記回退關係即可：

```js
export const LANG_FALLBACK = {
  zh_HK: "zh_TW",  // 粵語玩家看到繁體中文，好過看到英文
  pt_PT: "pt_BR",  // 葡萄牙本土玩家看到巴西葡語
  ...
};
```

回退鏈的解析順序為：

```
請求語言 → LANG_FALLBACK 中逐級尋找 → en_US → [Missing translation: key]
```

例如玩家設定 `zh_HK` 時：

1. 先查 `zh_HK` 是否有檔案 → 否
2. 查 `LANG_FALLBACK.zh_HK` → 得到 `zh_TW`
3. 查 `zh_TW` 是否有檔案 → 是，使用繁體中文
4. 若沒有 `zh_TW`，繼續查 `LANG_FALLBACK.zh_TW` → 無 → 回退 `en_US`

這一機制讓你可以**用一行程式碼支援一批相關語言變體**，而不必維護多份幾乎相同的翻譯。

---

## 六、提交前檢查清單

提交 PR 前請逐項檢查：

- [ ] 檔案頂部的授權註解保持原樣
- [ ] `en_US.js` 中所有 key 都已翻譯，無遺漏
- [ ] 所有 `{xxx}` 佔位符完整保留，拼寫與數量一致
- [ ] 所有 `§x` 顏色代碼完整保留
- [ ] 換行符數量與 `en_US.js` 一致（尤其是 `\n\n`）
- [ ] 已在 `locales/index.js` 的 `translations` 中註冊
- [ ] 已在 `locales/index.js` 的 `language` 陣列中新增（用於設定表單顯示）
- [ ] 啟動伺服器後，主控台**沒有** `[MeowFish i18n]` 警告
- [ ] 已在設定表單中實際切換語言，驗證介面文字顯示正常

---

## 七、術語參考

為保證同一語言內的一致性，建議參照 Minecraft 官方譯名與社群慣例。

| 英文 | 簡體中文 | 繁體中文 | 日本語（參考） |
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

> **物品名稱不需要翻譯**：`getItemTranslation()` 回傳 `{ translate: "item.xxx.name" }`，由遊戲客戶端依玩家自己的語言渲染。你只需要翻譯介面文字。

---

## 八、如何提交

### 方式一：GitHub PR（推薦）

1. Fork 本儲存庫
2. 新建分支 `i18n/ja_JP`
3. 提交完整的 `ja_JP.js` 與更新後的 `locales/index.js`
4. 發起 PR，標題格式：`[i18n] 新增 日本語 (ja_JP)`
5. PR 描述範本：

```markdown
## 語言資訊
- 語言：日本語 (ja_JP)
- 代碼：`ja_JP`

## 母語者自述
本人母語為日語，已校對全部 key 的文法、術語與一致性。

## 測試環境
- 基岩版版本：1.26.0
- MeowFish 版本：v1.0.0
- 遊戲平台：Windows / Android / iOS

## 校驗結果
- 主控台啟動無 `[MeowFish i18n]` 警告：✅
- 設定表單切換語言後文字顯示正常：✅
- 熔斷提示、釣竿耐久提示、物品篩選介面均已驗證：✅

## 截圖
（可附上設定選單 + 遊戲中提示的截圖）
```

### 方式二：Issue 附帶檔案

不會用 Git？也可以把完整的 `ja_JP.js` 檔案內容貼到 issue 裡，由維護者幫你合入。

新建 issue 時選擇 **"New Language / 新語言"** 範本，把檔案內容貼進程式碼區塊即可。

---

## 九、常見問題

### Q1：我發現現有翻譯（例如 `zh_TW`）有錯字怎麼辦？

直接提交 PR 修正即可，標題格式：`[i18n] zh_TW 修正若干術語`。附上修改前後對照。

### Q2：某句話在我母語裡沒有對應概念怎麼辦？

參考下面原則：

- **遊戲專有名詞**：優先查 Minecraft 官方譯名
- **技術術語**（如「熔斷器」、「狀態機」）：意譯為主，必要時保留英文括註
- **口語化提示**（如「低耐久！」）：依母語習慣表達，不必逐字翻譯

### Q3：能不能只提交部分翻譯？

可以。缺少的 key 會在啟動時被校驗腳本列出，回退到 `en_US` 顯示英文。但我們建議一次性提交完整翻譯，避免玩家看到中英混雜的介面。

### Q4：我為某個語言做了 80% 的翻譯，能先合入嗎？

可以，但請在 PR 描述中註明完成度，我們會把該語言在 `language` 陣列中的註冊延後，或者用註解標註 `// TODO: 補全 xxx` 讓你後續繼續完善。

### Q5：`Settings.language` 裡能直接填 `zh-HK` 這類變體嗎？

可以。回退鏈會自動解析：

- `zh-HK` → `zh_TW`（若存在）→ `en_US`
- `en-GB` → `en_US`
- `pt-PT` → `pt_BR`（若存在）→ `en_US`

詳見 [第五節：語系回退表](#五語系回退表)。

### Q6：為什麼我的語言檔案沒有被讀到？

檢查兩點：

1. `locales/index.js` 的 `translations` 物件裡是否已註冊
2. `locales/index.js` 的 `language` 陣列裡是否已加入（這一項決定設定表單是否顯示該選項）

### Q7：我可以修改檔案頂部的授權註解嗎？

不可以。授權註解由原作者統一維護，任何語言的副本都必須原樣保留。

---

## 聯絡

- **GitHub Issue**：首選管道
- **討論**：可以在 PR 中直接交流，或開 issue 討論某個術語的譯法
- **致謝**：每位語言貢獻者都會列入 README 的 Contributors 章節

感謝你的貢獻，讓更多玩家可以用母語使用 MeowFish 🎣


MeowFish-AutoFish  
Copyright (c) 2025 MiaoMiaoMax (2025-present)

本作品採用知識共享署名-非商業性-相同方式共享 4.0 國際許可協議進行許可。 要查看此許可證的副本，請訪問  
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit  
https://creativecommons.org/licenses/by-nc-sa/4.0/
