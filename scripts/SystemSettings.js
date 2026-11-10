/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/*+==================分==界==线==================+*/

/** MeowFish 版本号 */
export const MEOWFISH_VERSION = "v1.0.0";

/** 项目主页地址 */
export const PROJECT_URL = "https://github.com/MiaoMiaoMax/MeowFish";

/** 许可证公开链接*/
export const LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/";

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


  // 减少浮漂下沉
  // Reduce hook sinking

  reduce_sinking: 0

  /*
    可填入"0"和"1"，
    "0"代表"不减少下沉"，
    "1"代表"减少下沉"。
    启用之后，钓浮漂下沉幅度将会减少。(避免勾到其他实体）
    
    Can fill in "0" and "1",
    "0" means "don't reduce sinking",
    "1" means "reduce sinking".
    After enabling, the fishing hook sinking amplitude will be reduced. (helps avoid hooking onto other entities).
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


  // 是否允许玩家筛选战利品
  // Whether players are allowed to filter loot

  allow_loot_filter: 1

  /*
    可填入"0"和"1"，
    "0"代表"不允许"，
    "1"代表"允许"。
    允许之后，玩家可以在「高级设置 → 战利品筛选」中打开个人开关（默认关闭），
    并按物品决定哪些战利品留在浮漂处、哪些飞向玩家。
    关闭时该功能对全部玩家失效：入口隐藏，已保存的筛选规则会被忽略（不会被删除）。

    Can fill in "0" and "1",
    "0" means "not allowed",
    "1" means "allowed".
    When allowed, each player can turn the loot filter on/off in Advanced Settings
    (per-player switch, off by default) and choose which loot stays at the hook and
    which flies to the player.
    When disabled, the feature is off for everyone: the menu is hidden and any saved
    filter rules are ignored (not deleted).
    
  */
  ,


  // 是否启用玩家熔断器
  // Whether the per-player circuit breaker is enabled

  circuit_breaker: 0

  /*
    可填入"0"和"1"，
    "0"代表"不启用"，
    "1"代表"启用"。
    启用之后，单个玩家在计数窗口内累计异常次数达到 circuit_breaker_threshold 时，
    会临时禁用该玩家的自动钓鱼（移出自动钓鱼状态并拦截收益结算），
    冷却结束后自动恢复。异常事件来自浮漂持续下沉（hookAbnormal）。

    Can fill in "0" and "1",
    "0" means "disabled",
    "1" means "enabled".
    When enabled, a player whose anomaly count reaches circuit_breaker_threshold
    within the counting window has auto-fishing temporarily disabled
    (removed from the auto-fishing state and rewards blocked), then restored after
    the cooldown. Anomalies come from a continuously sinking bobber (hookAbnormal).
    
  */
  ,


  // 是否启用世界熔断器
  // Whether the global (server-wide) circuit breaker is enabled

  global_circuit_breaker: 0

  /*
    可填入"0"和"1"，
    "0"代表"不启用"，
    "1"代表"启用"。
    启用之后，若在计数窗口内触发玩家熔断的人数达到 global_circuit_threshold，
    则暂停全服的浮漂状态检测（fishBite / hookOnWaterSurfaceChange 不再触发）。
    注意：当前版本全服熔断不会自动恢复，需要重载脚本或手动调用 resetGlobalCircuit()。

    Can fill in "0" and "1",
    "0" means "disabled",
    "1" means "enabled".
    When enabled, if the number of players tripping their own breaker within the
    counting window reaches global_circuit_threshold, bobber state checking is paused
    server-wide (fishBite / hookOnWaterSurfaceChange stop firing).
    NOTE: the global breaker does NOT auto-recover in the current version; reload the
    scripts or call resetGlobalCircuit() manually.
    
  */
  ,


  // 玩家熔断阈值：计数窗口内累计多少次异常时触发熔断
  // Per-player trip threshold: anomalies needed to trip the breaker

  circuit_breaker_threshold: 5

  /*
    可填入大于 0 的整数，单位为「次」。

    在 circuit_breaker_cooldown 指定的窗口内，同一玩家的异常次数达到该值即熔断。
    默认 5 次。

    Fill in an integer greater than 0 (number of anomalies).
    A player trips the breaker when their anomaly count reaches this value within
    the window set by circuit_breaker_cooldown. Default: 5.
    
  */
  ,


  // 玩家异常计数窗口（毫秒）
  // Per-player anomaly counting window (milliseconds)

  circuit_breaker_cooldown: 30000

  /*
    单位为毫秒（1000 毫秒 = 1 秒）。

    用于「异常计数窗口」：从该玩家的首次异常开始计时，
    超过这个时长仍未达到阈值时，计数清零并重新累计。
    默认 30000（30 秒）。

    注意：本项当前**不控制**熔断后的恢复时间——恢复时间在
    CircuitBreaker.js 中固定为 600 tick（30 秒），尚未接入本项。

    Unit: milliseconds (1000 ms = 1 second).
    This is the anomaly-counting window: counting starts at the player's first
    anomaly and is reset when the window elapses without reaching the threshold.
    Default: 30000 (30 seconds).

    NOTE: this value does NOT control the recovery delay yet; the post-trip recovery
    is fixed at 600 ticks (30 seconds) in CircuitBreaker.js.
    
  */
  ,


  // 世界熔断阈值：计数窗口内多少名玩家触发熔断则触发世界熔断
  // Global trip threshold: how many players must trip to trigger the global breaker

  global_circuit_threshold: 3

  /*
    可填入大于 0 的整数，单位为「名玩家」。

    在 global_circuit_cooldown 指定的窗口内，
    触发玩家熔断的人数达到该值即触发全服熔断。默认 3 名。

    Fill in an integer greater than 0 (number of players).
    The global breaker trips when this many players trip their own breaker within
    the window set by global_circuit_cooldown. Default: 3.
    
  */
  ,


  // 全服熔断统计窗口（毫秒）
  // Global circuit breaker counting window (milliseconds)

  global_circuit_cooldown: 60000

  /*
    单位为毫秒（1000 毫秒 = 1 秒）。

    用于「全服熔断统计窗口」：窗口内触发玩家熔断的人数达到
    global_circuit_threshold 时触发全服熔断。默认 60000（60 秒）。
    该值也会出现在全服熔断的提示日志中（"N 名玩家在 X 秒内触发熔断"）。

    注意：本项当前**不控制**全服熔断的恢复时间——自动恢复代码已在
    CircuitBreaker.js 中注释掉，触发后不会自动恢复；
    需要重载脚本或手动调用 resetGlobalCircuit()。

    Unit: milliseconds (1000 ms = 1 second).
    This is the global counting window: the breaker trips when this many players
    trip their own breaker within the window (see global_circuit_threshold).
    Default: 60000 (60 seconds). The value also appears in the trip log message.

    NOTE: this value does NOT control recovery; the auto-recovery code is commented
    out in CircuitBreaker.js, so the global breaker never recovers by itself.
    Reload the scripts or call resetGlobalCircuit() manually.
    
  */
  ,


  // 调试模式
  // Debug mode

  debug: 0

  /*
    可填入"0"和"1"，
    "0"代表"关闭"，
    "1"代表"开启"。

    开启后：
    - meow.log() 的调试日志才会输出（仅后台）；
    - meow.warn() / meow.error() 会同时在聊天栏显示（仅消息文本）。

    正式发布请保持 "0"，否则技术性错误会打扰玩家。
    无论该开关如何，Error 的调用堆栈始终只写入后台，不会进入聊天栏。

    Can fill in "0" and "1",
    "0" means "off", "1" means "on".

    When enabled:
    - meow.log() debug output is written to the console;
    - meow.warn() / meow.error() are also shown in chat (message text only).

    Keep it "0" for release builds.
    Error stacks are always written to the console only, never to chat.
  */
  ,


  /*+==================分==界==线==================+*/

}

export { Settings };
