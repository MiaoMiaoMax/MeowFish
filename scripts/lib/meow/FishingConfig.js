/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 钓鱼事件配置
 */
export const FishingConfig = {
  // 浮漂生成匹配
  HOOK_SPAWN_MATCH_DISTANCE: 1,
  HOOK_SPAWN_MATCH_TIME: 100, // 毫秒，仅在无法读取 system.currentTick 时兜底
  HOOK_SPAWN_MATCH_TICKS: 4, // 匹配窗口（tick），容忍调度延迟

  // 浮漂命中实体补报（浮漂生成回调执行前就命中实体的情况）
  HOOK_HIT_REPLAY_TICKS: 4, // 补报窗口（tick）
  HOOK_HIT_REPLAY_TIME: 500, // 毫秒，仅在无法读取 system.currentTick 时兜底

  // 稳定性判定
  STABLE_COOLDOWN_NORMAL: 1000,       // 普通模式稳定冷却（毫秒）
  STABLE_COOLDOWN_BESIDE: 1200,       // 傍水模式稳定冷却
  STABLE_MAX_DISPLACEMENT_NORMAL: 0.00025, // 进入稳定所需的最大位置变化平方值
  STABLE_MAX_DISPLACEMENT_BESIDE: 0.00051, // 傍水进入稳定所需的最大位置变化平方值
  STABLE_MAX_VY: -0.052,

  // 下沉检测
  SINK_DELTA_THRESHOLD: 0.024,   // 傍水模式速度变化阈值
  SINK_VY_THRESHOLD: -0.06,      // 普通模式速度阈值
  SINK_ABNORMAL_THRESHOLD: 3000, // 下沉异常阈值（毫秒）
  VY_HISTORY_LENGTH: 5,          // 速度历史长度（滑动窗口）

  // 首次触水稳定到允许咬钩的延迟
  FIRST_WATER_DELAY: 300, // 毫秒

  // 缓存策略 
  CACHE_STATUS_DISTANCE_SQ: 0.1,            // 复用水面状态缓存的最大位置变化平方值
  CACHE_STATUS_DISTANCE_SQ_NON_WATER: 0.01, // 非水面复用水面状态缓存的最大位置变化平方值
  CACHE_VELOCITY_DISTANCE_SQ: 0.002,        // 复用速度缓存的最大位置变化平方值

  // 功能开关
  ENABLE_ABNORMAL_DETECTION: true, // 是否启用异常下沉检测
  ENABLE_BESIDE_WATER_MODE: true,  // 是否启用傍水模式

  // 状态检查间隔（tick）
  STATE_CHECK_INTERVAL_TICKS: 2,
};
