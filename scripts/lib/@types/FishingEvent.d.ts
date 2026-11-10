/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { Player, Entity, BiomeType } from "@minecraft/server";

/**
 * 事件信号类，用于管理事件的订阅、取消订阅和触发
 *
 * @template T 事件对象类型
 */
export class EventSignal<T = unknown> {
  constructor();
  subscribe(callback: (arg: T) => void): (arg: T) => void;
  unsubscribe(callback: (arg: T) => void): void;
  trigger(arg: T): void;
}

/**
 * 浮漂状态机的状态值。
 */
export const HookState: {
  /** 等待首次稳定 */
  INIT: "INIT";
  /** 等待稳定 */
  SETTLING: "SETTLING";
  /** 等待咬钩 */
  FLOATING: "FLOATING";
  /** 在地面稳定 */
  ON_GROUND: "ON_GROUND";
  /** 在实体上 */
  ON_ENTITY: "ON_ENTITY";
};

/** HookState 的取值联合（"INIT" | "SETTLING" | "FLOATING" | "ON_GROUND" | "ON_ENTITY"） */
export type HookStateValue = (typeof HookState)[keyof typeof HookState];

/**
 * 抛竿事件（浮漂实体生成并匹配到玩家后触发）
 */
export interface CastRodEvent {
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 玩家 */
  readonly player: Player;
}

/**
 * 预收杆事件（可在收杆前拦截；除 cancel 外的字段不可写）
 */
export interface BeforeReelRodEvent {
  /** 玩家 */
  readonly player: Player;
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 浮漂当前状态 */
  readonly state: HookStateValue;
  /** 上次下沉检查时间（毫秒时间戳） */
  readonly lastSinkingCheck: number | null;
  /** 是否在水面上 */
  readonly isOnWater: boolean;
  /** 是否在水里 */
  readonly isInWater: boolean;
  /** 傍水模式 */
  readonly isBesideWater: boolean;
  /** 首次到达水面的时间（毫秒时间戳） */
  readonly isOnWaterFirst: number | null;
  /** 置为 true 可拦截本次收杆（唯一可写字段） */
  cancel: boolean;
}

/**
 * 收杆事件
 */
export interface ReelRodEvent {
  /** 浮漂 ID */
  readonly hookId: string;
  /** 玩家 */
  readonly player: Player;
  /** 是否主动收杆（true = 玩家右键；false = 被动移除） */
  readonly isActive: boolean;
  /** 是否在水面上 */
  readonly isOnWater: boolean;
  /** 是否在水里 */
  readonly isInWater: boolean;
  /** 傍水模式 */
  readonly isBesideWater: boolean;
}

/**
 * 浮漂在水面状态改变事件
 */
export interface HookOnWaterSurfaceChangeEvent {
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 玩家 */
  readonly player: Player;
  /** 是否首次触发（进入状态机时） */
  readonly isFirst: boolean;
  /** 是否在水面上 */
  readonly isOnWater: boolean;
  /** 是否在水里 */
  readonly isInWater: boolean;
  /** 傍水模式 */
  readonly isBesideWater: boolean;
}

/**
 * 浮漂勾到实体事件
 */
export interface HookHitEntityEvent {
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 玩家 */
  readonly player: Player;
  /** 被勾到的实体 */
  readonly entity: Entity;
}

/**
 * 鱼咬钩事件
 *
 * 状态机只负责宣布“咬钩发生”：触发本事件后立即转入 SETTLING，
 * 不读取监听器的返回值，也不保留事件对象。奖励结算、重试与生命周期
 * 由 FishingProcessor 的待结算队列负责。
 */
export interface FishBiteEvent {
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 玩家 */
  readonly player: Player;
  /** 浮漂所在群系（咬钩时按当前位置刷新，查询失败回退抛竿缓存） */
  readonly biome: BiomeType;
  /** 傍水模式 */
  readonly isBesideWater: boolean;
}

/**
 * 浮漂异常事件（用于熔断器判断服务器环境是否异常）
 */
export interface HookAbnormalEvent {
  /** 玩家 */
  readonly player: Player;
  /** 浮漂实体 */
  readonly hook: Entity;
  /** 异常类型（当前实现只会发出 abnormal_sink） */
  readonly type: "abnormal_sink";
  /** 异常数据 */
  readonly data: {
    readonly isInWater: boolean;
    readonly isOnWater: boolean;
    readonly isBesideWater: boolean;
    /** 已连续下沉的时长（毫秒） */
    readonly sinkingDuration: number;
    readonly [key: string]: unknown;
  };
}

/**
 * 事件信号类型（与 FishingEventManager 的 7 个信号字段一一对应）
 */

/** 抛竿事件信号 */
export type castRodSignal = EventSignal<CastRodEvent>;
/** 预收杆事件信号（可在收杆前拦截） */
export type beforeReelRodSignal = EventSignal<BeforeReelRodEvent>;
/** 收杆事件信号 */
export type reelRodSignal = EventSignal<ReelRodEvent>;
/** 浮漂在水面状态改变事件信号 */
export type hookOnWaterSurfaceChangeSignal = EventSignal<HookOnWaterSurfaceChangeEvent>;
/** 浮漂勾到实体事件信号 */
export type hookHitEntitySignal = EventSignal<HookHitEntityEvent>;
/** 鱼咬钩事件信号 */
export type fishBiteSignal = EventSignal<FishBiteEvent>;
/** 浮漂异常事件信号 */
export type hookAbnormalSignal = EventSignal<HookAbnormalEvent>;

/**
 * 钓鱼事件管理器（运行时由 lib/meow/FishingEvent.js 创建单例并导出）。
 */
export class FishingEventManager {
  readonly castRod: castRodSignal;
  readonly beforeReelRod: beforeReelRodSignal;
  readonly reelRod: reelRodSignal;
  readonly hookOnWaterSurfaceChange: hookOnWaterSurfaceChangeSignal;
  readonly hookHitEntity: hookHitEntitySignal;
  readonly fishBite: fishBiteSignal;
  readonly hookAbnormal: hookAbnormalSignal;

  /**
   * 暂停浮漂状态检测。
   * 受影响的事件：hookOnWaterSurfaceChange / fishBite / hookAbnormal。
   */
  pause(): void;

  /**
   * 恢复浮漂状态检测。
   */
  resume(): void;
}

/** 全局单例（lib/meow/FishingEvent.js 导出） */
export const fishingEvents: FishingEventManager;
