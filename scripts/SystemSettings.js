/*
  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/*+==================分==界==线==================+*/

const Settings = {
  /* 
    这里是核心配置文件。
  
    请不要输入无关紧要的东西，
    也不要修改除选项参数之外的东西，
    这样会让配置文件失去作用，
    所有设置都将采用默认值，
    除非你知道你在输入什么。
  
    以下每一个选项都附有说明，
    请在阅读了对应的说明再进行修改。
  
    每次载入核心都将读取并应用本配置文件内的设置。
  
    下面每一个选项都长这个样子：
    选项:[参数]
    [参数]就是你可以修改的内容。
  
    This is the core configuration file.
    
    Please do not enter irrelevant content,
    and do not modify anything other than option parameters,
    otherwise the configuration file will lose its effect
    and all settings will use default values,
    unless you know what you are entering.
    
    Each option below has instructions,
    please read the corresponding instructions before modification.
    
    This configuration file will be loaded and applied each time the core is loaded.
    
    Each option looks like this:
    Option: [parameter]
    [parameter] is what you can modify.
  */


  // 自动钓鱼开关
  // Auto fishing switch

  auto: 1

  /*
    可填入"0"和"1"，
    "0"代表"关"，
    "1"代表"开"。
    
    Can fill in "0" and "1",
    "0" means "off",
    "1" means "on".
  */
  ,


  // 温馨提示
  // Friendly reminder

  tip: 1

  /*
    可填入"0"和"1"，
    "0"代表"不显示"，
    "1"代表"显示"。
    启用之后，将在玩家进入游戏之后显示一个温馨提示。
    有玩家的自动钓鱼的个人设置信息，和自动钓鱼的使用方法。
    
    Can fill in "0" and "1",
    "0" means "do not show",
    "1" means "show".
    After enabling, a warm tip will be displayed after the player enters the game.
    It displays each player’s personal auto-fishing settings and instructions on how to use the feature.
  */
  ,


  // 强制自动钓鱼
  // Compulsory auto-fishing

  compulsory_auto: 0
  /*
    可填入"0"和"1"，
    "0"代表"不强制"，
    "1"代表"强制"。
    启用之后，无论是否下蹲，都会触发自动钓鱼。

    Can fill in "0" and "1",
    "0" means "not compulsory",
    "1" means "compulsory".
    After enabling, regardless of whether you are crouching, automatic fishing will be triggered.
  */
  ,


  // 默认语言
  // Default language

  language: "en_US"
  /*
    可填入"zh_CN", "zh_TW", "en_US"

    zh_CN 代表 简体中文
    zh_TW 代表 繁體中文
    en_US 代表 英文
    
    Can fill in "zh_CN", "zh_TW", "en_US"

    zh_CN represents Simplified Chinese
    zh_TW represents Traditional Chinese
    en_US represents English
  */
  ,


  // 默认是否保护钓鱼竿耐久（留1点耐久）
  // Whether to protect fishing rod durability by default (leave 1 point durability)
  // Protect fishing rod durability by default (keep 1 durability point)

  protect: 1

  /*
    可填入"0"和"1"，
    "0"代表"不保护"，
    "1"代表"保护"。
    
    Can fill in "0" and "1",
    "0" means "not protected",
    "1" means "protected".
  */
  ,


  // 默认是否搜索背包替换当前钓鱼竿（如果当前钓鱼竿没耐久）
  // Whether to search inventory to replace current fishing rod by default (if current fishing rod has no durability)
  // Search inventory for replacement fishing rod when current one has no durability

  replace: 0

  /*
    可填入"0"和"1"，
    "0"代表"不替换"，
    "1"代表"替换"。
    
    Can fill in "0" and "1",
    "0" means "do not replace",
    "1" means "replace".
  */
  ,


  // 减少鱼钩下沉
  // Reduce hook sinking

  reduce_sinking: 0

  /*
    可填入"0"和"1"，
    "0"代表"不减少下沉"，
    "1"代表"减少下沉"。
    启用之后，钓鱼钩下沉幅度将会减少。(避免勾到其他实体）
    
    Can fill in "0" and "1",
    "0" means "don't reduce sinking",
    "1" means "reduce sinking".
    After enabling, the fishing hook sinking amplitude will be reduced. (helps avoid hooking onto other entities).
  */
  ,


  // 是否允许玩家强制获取丛林群系钓鱼战利品
  // Whether players are allowed to forcefully obtain loot from the jungle biome

  allow_jungle_loot: 0

  /*
    可填入"0"和"1"，
    "0"代表"不允许"，
    "1"代表"允许"。
    启用之后，玩家将能够自行设置是否强制获取丛林群系钓鱼战利品。
    
    Can fill in "0" and "1",
    "0" means "not allowed",
    "1" means "allowed".
    When enabled, players can choose whether to force-enable jungle biome fishing loot.
  */
  ,


  // 是否允许玩家选择华丽粒子特效
  // Whether players are allowed to choose fancy particle effects

  fancy_particle: 1

  /*
    可填入"0"和"1"，
    "0"代表"不允许"，
    "1"代表"允许"。
    启用之后，玩家将能够自行选择华丽粒子特效。
    华丽粒子的触发判定会消耗一定的服务端资源。
    
    Can fill in "0" and "1",
    "0" means "not allowed",
    "1" means "allowed".
    When enabled, players can choose fancy particle effects.
    The triggering of fancy particles will consume a certain amount of server resources.
  */
  ,

  /*+==================分==界==线==================+*/

}

export { Settings };