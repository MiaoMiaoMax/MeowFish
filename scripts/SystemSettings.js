/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
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


  //自动钓鱼开关
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


  //强制自动钓鱼
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


  //默认语言
  // Default language

  language: "zh_CN"
  /*
    可填入"zh_CN", "zh_TW", "en-US"

    zh_CN 代表 简体中文
    zh_TW 代表 繁體中文
    en-US 代表 英文
    
    Can fill in "zh_CN", "zh_TW", "en-US"

    zh_CN represents Simplified Chinese
    zh_TW represents Traditional Chinese
    en-US represents English
  */
  ,


  //默认是否保护钓鱼竿耐久（留1点耐久）
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


  //默认是否搜索背包替换当前钓鱼竿（如果当前钓鱼竿没耐久）
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

  /*+==================分==界==线==================+*/

}

export { Settings };