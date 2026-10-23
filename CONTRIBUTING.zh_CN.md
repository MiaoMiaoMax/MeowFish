# 语言文件贡献指南

<div align="center">
  
[English](./CONTRIBUTING.md) | 简体中文 | [繁体中文](./CONTRIBUTING.zh_TW.md)

</div>

`scripts\locales` 目录存放 MeowFish-AutoFish 的全部语言文件。每份语言文件都是一个独立的 ES 模块，导出一个 `key → 文本` 的扁平对象。

我们欢迎任何语言的翻译贡献。只要你能用母语把界面文本说清楚，剩下的事我们帮你想好。

---

## 目录

- [一、当前支持的语言](#一当前支持的语言)
- [二、文件结构](#二文件结构)
- [三、如何新增一门语言](#三如何新增一门语言)
- [四、必须保留的内容](#四必须保留的内容)
- [五、语系回退表](#五语系回退表)
- [六、提交前检查清单](#六提交前检查清单)
- [七、术语参考](#七术语参考)
- [八、如何提交](#八如何提交)
- [九、常见问题](#九常见问题)

---

## 一、当前支持的语言

| 代码 | 语言 | 状态 | 维护者 |
| :--- | :--- | :--- | :--- |
| `en_US` | English | 完整 | 官方 |
| `zh_CN` | 简体中文 | 完整 | 官方 |
| `zh_TW` | 繁體中文 | 完整 | 官方 |

以上三份是**基准语言**。`en_US` 是校验与回退的最终锚点，任何新增语言都必须至少包含它的全部 key。

---

## 二、文件结构

```
locales/
├── index.js        # 汇总导出，注册新语言的位置
├── en_US.js        # 基准语言（English）
├── zh_CN.js        # 简体中文
├── zh_TW.js        # 繁體中文
└── README.md       # 本文件
```

每个语言文件的顶部必须保留许可证注释，内容形如：

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

## 三、如何新增一门语言

以添加日语（`ja_JP`）为例，共 4 步。

### 第一步：复制模板

```bash
cp en_US.js ja_JP.js
```

### 第二步：翻译右侧字符串

打开 `ja_JP.js`，**只改等号右侧引号内的文本**。左侧的 key、文件顶部的许可证注释都不动。

```js
// ✅ 正确
auto_fish: "[§3MeowFish§r -> §3あなた§r] 今回のキャストで自動釣りが有効になりました。",

// ❌ 错误：改了 key
auto_fishing: "...",

// ❌ 错误：删掉了占位符
gain_xp: "§b経験値§r を獲得, ",  // {xp} 必须保留

// ❌ 错误：删掉了换行
setting_protect: "釣り竿の耐久値を保護する（耐久値を1残す）",
// 原版是 "...\n\n"，两个换行不能丢
```

### 第三步：在 `locales/index.js` 注册

打开 `locales/index.js`，修改两处：

```js
// 顶部 import 区
import { ja_JP } from "./ja_JP";

// translations 对象
export const translations = {
  en_US,
  zh_CN,
  zh_TW,
  ja_JP,   // ← 新增
};

// language 数组（顺序影响设置表单里的显示顺序）
export const language = ["zh_CN", "zh_TW", "en_US", "ja_JP"];  // ← 新增
```

### 第四步：本地启动验证

启动服务器，观察控制台。

**正常情况**：没有 `[MeowFish i18n]` 开头的警告。

**有漏翻**：

```
[MeowFish i18n] 语言文件存在以下问题：
  ja_JP 缺失 2 个 key: setting_volume, item_form_mode_switch
```

**有占位符问题**：

```
[MeowFish i18n] 语言文件存在以下问题：
  ja_JP.gain_xp 占位符不一致：基准 {xp}，当前 (无)
```

按提示补齐即可。

---

## 四、必须保留的内容

翻译时下面几类东西一个都不能丢。

| 类型 | 示例 | 说明 |
| :--- | :--- | :--- |
| **占位符** | `{lang}` `{xp}` `{current}` `{max}` `{name}` `{mode}` `{status}` | 必须与 `en_US.js` 中的拼写、数量、位置完全一致。不能被翻译、删除或改名。 |
| **颜色代码** | `§a` `§c` `§6` `§r` `§b` `§4` | MC 格式化代码，保留原有位置与顺序。 |
| **换行** | `\n` `\n\n` | 一个都不能少，否则 UI 表单会挤成一行。`\n\n` 通常用于表单控件的末尾分隔。 |
| **前缀** | `[§3MeowFish§r -> §3...§r]` | 保持统一格式，只翻译箭头后的人称代词（如 You → 你 → あなた）。 |

### 示例对比

```js
// 基准 en_US
gain_xp: "Gained §b{xp} XP§r, ",

// ✅ 正确：占位符与颜色代码都保留
gain_xp: "§b{xp} 経験値§r を獲得, ",

// ❌ 错误：丢了 {xp}
gain_xp: "経験値を獲得, ",

// ❌ 错误：改了占位符名字
gain_xp: "Gained §b{experience} XP§r, ",

// ❌ 错误：丢了颜色代码
gain_xp: "Gained {xp} XP, ",
```

---

## 五、语系回退表

如果新增的语言属于已有语系（例如粤语 `zh_HK` 属于中文，巴西葡语 `pt_BR` 属于葡萄牙语），你不必为每个变体单独写一份完整文件。

只需在 `locales/index.js` 的 `LANG_FALLBACK` 中登记回退关系即可：

```js
export const LANG_FALLBACK = {
  zh_HK: "zh_TW",  // 粤语玩家看到繁体中文，好过看到英文
  pt_PT: "pt_BR",  // 葡萄牙本土玩家看到巴西葡语
  ...
};
```

回退链的解析顺序为：

```
请求语言 → LANG_FALLBACK 中逐级查找 → en_US → [Missing translation: key]
```

例如玩家设置 `zh_HK` 时：

1. 先查 `zh_HK` 是否有文件 → 否
2. 查 `LANG_FALLBACK.zh_HK` → 得到 `zh_TW`
3. 查 `zh_TW` 是否有文件 → 是，使用繁体中文
4. 若没有 `zh_TW`，继续查 `LANG_FALLBACK.zh_TW` → 无 → 回退 `en_US`

这一机制让你可以**用一行代码支持一批相关语言变体**，而不必维护多份几乎相同的翻译。

---

## 六、提交前检查清单

提交 PR 前请逐项检查：

- [ ] 文件顶部的许可证注释保持原样
- [ ] `en_US.js` 中所有 key 都已翻译，无遗漏
- [ ] 所有 `{xxx}` 占位符完整保留，拼写与数量一致
- [ ] 所有 `§x` 颜色代码完整保留
- [ ] 换行符数量与 `en_US.js` 一致（尤其是 `\n\n`）
- [ ] 已在 `locales/index.js` 的 `translations` 中注册
- [ ] 已在 `locales/index.js` 的 `language` 数组中添加（用于设置表单显示）
- [ ] 启动服务器后，控制台**没有** `[MeowFish i18n]` 警告
- [ ] 已在设置表单中实际切换语言，验证界面文本显示正常

---

## 七、术语参考

为保证同一语言内的一致性，建议参照 Minecraft 官方译名与社区约定。

| 英文 | 简体中文 | 繁體中文 | 日本語（参考） |
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

> **物品名称不需要翻译**：`getItemTranslation()` 返回 `{ translate: "item.xxx.name" }`，由游戏客户端按玩家自己的语言渲染。你只需要翻译界面文本。

---

## 八、如何提交

### 方式一：GitHub PR（推荐）

1. Fork 本仓库
2. 新建分支 `i18n/ja_JP`
3. 提交完整的 `ja_JP.js` 与更新后的 `locales/index.js`
4. 发起 PR，标题格式：`[i18n] 添加 日本語 (ja_JP)`
5. PR 描述模板：

```markdown
## 语言信息
- 语言：日本語 (ja_JP)
- 代码：`ja_JP`

## 母语者自述
本人母语为日语，已校对全部 key 的语法、术语与一致性。

## 测试环境
- 基岩版版本：1.26.0
- MeowFish 版本：v1.0.0
- 游戏平台：Windows / Android / iOS

## 校验结果
- 控制台启动无 `[MeowFish i18n]` 警告：✅
- 设置表单切换语言后文本显示正常：✅
- 熔断提示、鱼竿耐久提示、物品筛选界面均已验证：✅

## 截图
（可附上设置菜单 + 游戏中提示的截图）
```

### 方式二：Issue 附带文件

不会用 Git？也可以把完整的 `ja_JP.js` 文件内容贴到 issue 里，由维护者帮你合入。

新建 issue 时选择 **"New Language / 新语言"** 模板，把文件内容贴进代码块即可。

---

## 九、常见问题

### Q1：我发现现有翻译（例如 `zh_TW`）有错别字怎么办？

直接提交 PR 修正即可，标题格式：`[i18n] zh_TW 修正若干术语`。附上修改前后对照。

### Q2：某句话在我母语里没有对应概念怎么办？

参考下面原则：

- **游戏专有名词**：优先查 Minecraft 官方译名
- **技术术语**（如"熔断器"、"状态机"）：意译为主，必要时保留英文括注
- **口语化提示**（如"低耐久！"）：按母语习惯表达，不必逐字翻译

### Q3：能不能只提交部分翻译？

可以。缺失的 key 会在启动时被校验脚本列出，回退到 `en_US` 显示英文。但我们建议一次性提交完整翻译，避免玩家看到中英混杂的界面。

### Q4：我为某个语言做了 80% 的翻译，能先合入吗？

可以，但请在 PR 描述中注明完成度，我们会把该语言在 `language` 数组中的注册延后，或者用注释标注 `// TODO: 补全 xxx` 让你后续继续完善。

### Q5：`Settings.language` 里能直接填 `zh-HK` 这类变体吗？

可以。回退链会自动解析：

- `zh-HK` → `zh_TW`（若存在）→ `en_US`
- `en-GB` → `en_US`
- `pt-PT` → `pt_BR`（若存在）→ `en_US`

详见 [第五节：语系回退表](#五语系回退表)。

### Q6：为什么我的语言文件没有被读到？

检查两点：

1. `locales/index.js` 的 `translations` 对象里是否已注册
2. `locales/index.js` 的 `language` 数组里是否已加入（这一项决定设置表单是否显示该选项）

### Q7：我可以修改文件头部的许可证注释吗？

不可以。许可证注释由原作者统一维护，任何语言的副本都必须原样保留。

---

## 联系

- **GitHub Issue**：首选渠道
- **讨论**：可以在 PR 中直接交流，或开 issue 讨论某个术语的译法
- **致谢**：每位语言贡献者都会列入 README 的 Contributors 章节

感谢你的贡献，让更多玩家可以用母语使用 MeowFish 🎣


MeowFish-AutoFish  
Copyright (c) 2025 MiaoMiaoMax (2025-present)

本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问  
https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit  
https://creativecommons.org/licenses/by-nc-sa/4.0/
