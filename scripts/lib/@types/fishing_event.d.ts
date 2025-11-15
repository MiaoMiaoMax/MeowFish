import { Player, Entity } from "@minecraft/server";

/**
 * 事件信号类，用于管理事件的订阅、取消订阅和触发
 */
export class EventSignal<T = any> {
  /**
   * 订阅事件
   * @param callback - 事件监听器回调函数
   * @returns 返回传入的监听器函数
   */
  subscribe(callback: (arg: T) => void): (arg: T) => void;
  
  /**
   * 取消订阅事件
   * @param callback - 需要取消订阅的监听器函数
   */
  unsubscribe(callback: (arg: T) => void): void;
}

/**
 * 抛竿事件
 */
export interface CastRodEvent {
  /**
   * 鱼钩实体
   */
  hook: Entity;
  
  /**
   * 玩家
   */
  player: Player;
}

/**
 * 预收杆事件（可在收杆前拦截）
 */
export interface BeforeReelRodEvent {
  /**
   * 玩家
   */
  player: Player;
  
  /**
   * 鱼钩实体
   */
  hook: Entity;
  
  /**
   * 鱼钩位置
   */
  hookLoc: import("@minecraft/server").Vector3;
  
  /**
   * 鱼钩是否稳定
   */
  isStable: boolean;
  
  /**
   * 是否正在钓鱼
   */
  isFishing: boolean | null;
  
  /**
   * 是否正在下沉
   */
  isSinking: boolean;
  
  /**
   * 上次下沉检查时间
   */
  lastSinkingCheck: number | null;
  
  /**
   * 是否在水面上
   */
  isOnWater: boolean;
  
  /**
   * 首次在水面上的时间
   */
  isOnWaterFirst: number | null;
  
  /**
   * 是否取消事件
   */
  cancel: boolean;
}

/**
 * 收杆事件
 */
export interface ReelRodEvent {
  /**
   * 鱼钩ID
   */
  hookId: string;
  
  /**
   * 玩家
   */
  player: Player;
  
  /**
   * 是否主动收杆
   */
  isActive: boolean;
  
  /**
   * 是否正在钓鱼
   */
  isFishing: boolean;
  
  /**
   * 是否在水面上
   */
  isOnWater: boolean;
}

/**
 * 鱼钩在水面状态改变事件
 */
export interface HookOnWaterSurfaceChangeEvent {
  /**
   * 鱼钩实体
   */
  hook: Entity;
  
  /**
   * 玩家
   */
  player: Player;
  
  /**
   * 是否首次触发
   */
  isFirst: boolean;
  
  /**
   * 是否在水面上
   */
  isOnWater: boolean;
}

/**
 * 鱼钩勾到实体事件
 */
export interface HookHitEntityEvent {
  /**
   * 鱼钩实体
   */
  hook: Entity;
  
  /**
   * 玩家
   */
  player: Player;
  
  /**
   * 被勾到的实体
   */
  entity: Entity;
}

/**
 * 鱼咬钩事件
 */
export interface FishBiteEvent {
  /**
   * 鱼钩实体
   */
  hook: Entity;
  
  /**
   * 玩家
   */
  player: Player;
}

/**
 * 抛竿事件信号
 */
export class castRodSignal extends EventSignal<CastRodEvent> { }
/**
 * 预收杆事件信号（可在收杆前拦截）
 */
export class beforeReelRodSignal extends EventSignal<BeforeReelRodEvent> { }
/**
 * 收杆事件信号
 */
export class reelRodSignal extends EventSignal<ReelRodEvent> { }
/**
 * 鱼钩在水面状态改变事件信号
 */
export class hookOnWaterSurfaceChangeSignal extends EventSignal<HookOnWaterSurfaceChangeEvent> { }
/**
 * 鱼钩勾到实体事件信号
 */
export class hookHitEntitySignal extends EventSignal<HookHitEntityEvent> { }
/**
 * 鱼咬钩事件信号
 */
export class fishBiteSignal extends EventSignal<FishBiteEvent> { }