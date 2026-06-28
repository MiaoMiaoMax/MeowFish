![项目图标](./pack_icon.png)

# MeowFish
_我的世界基岩版自动钓鱼 Minecraft Bedrock Auto Fishing_
> Only Chinese versions available. (This sentence is machine-translated)

## 当前版本
v0.1.5-beta

## 使用方法
持有钓鱼竿，下蹲抛竿即可触发。

用纸张命名为 `MF设置` 、 `MF設置` 或 `MFSetting`   
电脑端右键使用 或 手机端长按使用 -> 可打开个人设置

个人设置里可设置以下功能：
- 语言：目前有简体中文、繁体中文、英文
- 强制自动：无论是否下蹲都会触发自动钓鱼
- 耐久保护：保护钓鱼竿耐久（留1点耐久）
- 替换：搜索背包替换当前钓鱼竿（如果当前钓鱼竿没耐久）
- 减少下沉：钓鱼钩下沉幅度将会减少。(避免勾到其他实体）
- 温馨提示：将在玩家进入游戏之后显示一个温馨提示。（有玩家的自动钓鱼的个人设置信息，和自动钓鱼的使用方法）
- 战利品生成方式：可以选择原版风格（从浮漂处飞向玩家）、战利品将生成在玩家位置、战利品将生成在浮漂位置
- 粒子效果：可以选择无粒子效果、少量粒子效果、正常粒子效果、华丽粒子效果（在 `SystemSettings.js` 中将 `fancy_particle` 设置为 `0` 禁用并隐藏华丽粒子效果选项，`fancy_particle` 默认为 `1` 即显示华丽粒子效果选项）
- 音效音量：设置上钩音效的音量
- 强制获取丛林群系钓鱼战利品：强制获取丛林生物群系的特殊钓鱼战利品（需在 `SystemSettings.js` 中将 `allow_jungle_loot` 设置为 `1` 显示该设置，`allow_jungle_loot` 默认为 `0` 即禁用并隐藏）

在 `行为包\scripts\` 目录的 [SystemSettings.js](./scripts/SystemSettings.js) 文件里有大部分功能的默认设置，设置之后只需要使用 `/reload` 命令即可刷新

## 游戏版本
适配游戏版本为 1.21.0 或 以上

**_! 在 1.21.70 或更高版本可兼容成就 !_**

## 须知
请注意钓鱼机模式为实验性模式  
准确率会比常规模式有所下降

## 其他
觉得项目有用的话，可以给个star好吗 QwQ  
目前为beta测试，如果遇到问题，欢迎反馈

> 你可以关注作者bilibli平台 [CNQuanYeCha](https://space.bilibili.com/1968985335) 的动态来获得相关消息  
> 也欢迎加入Discord [MeewFish](https://discord.gg/VshSAY4wx6)

> 本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。  
> 要查看此许可证的副本，请访问 https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh
>
> This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.  
> To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/
