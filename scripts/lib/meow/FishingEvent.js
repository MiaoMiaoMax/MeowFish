/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { system, world } from "@minecraft/server";
import { EventSignal } from "./EventSignal.js";
import { FishingConfig } from "./FishingConfig.js";
import { HookFSM, HookState } from "./HookFSM.js";
import { Perf } from "./Perf.js";
import { Vector3 } from "./Vector3.js";
import { clearPlayerFishingState, isAutoFishing, startAutoFishing } from "../../core/AutoFishState.js";
import { Settings } from "../../SystemSettings.js";

/**
 * 钓鱼事件管理类
 *
 * 状态存储约定：
 *   - 一律以 playerId / hookId 等字符串作为 Map 键，
 *     避免跨事件 Player / Entity 引用不一致导致查找失败
 *   - 需要 Player 对象时通过 #getPlayerById 或 fsm.player 获取
 */
class FishingEventManager {
  /**
   * 抛竿事件信号
   * @type {import("../@types/FishingEvent").castRodSignal}
   */
  castRod = new EventSignal();

  /**
   * 预收杆事件信号（可在收杆前拦截）
   * @type {import("../@types/FishingEvent").beforeReelRodSignal}
   */
  beforeReelRod = new EventSignal();

  /**
   * 收杆事件信号
   * @type {import("../@types/FishingEvent").reelRodSignal}
   */
  reelRod = new EventSignal();

  /**
   * 浮漂在水面状态改变事件信号
   * @type {import("../@types/FishingEvent").hookOnWaterSurfaceChangeSignal}
   */
  hookOnWaterSurfaceChange = new EventSignal();

  /**
   * 浮漂勾到实体事件信号
   * @type {import("../@types/FishingEvent").hookHitEntitySignal}
   */
  hookHitEntity = new EventSignal();

  /**
   * 鱼咬钩事件信号
   * @type {import("../@types/FishingEvent").fishBiteSignal}
   */
  fishBite = new EventSignal();

  /**
   * 浮漂异常事件信号
   * @type {import("../@types/FishingEvent").hookAbnormalSignal}
   */
  hookAbnormal = new EventSignal();

  /**
   * 可能在钓鱼的玩家列表（等待钩子生成匹配）
   * @type {Map<string, {
   *   timestamp: number,
   *   castTick: number,
   *   dimensionId: string,
   *   predictedPos: import("@minecraft/server").Vector3
   * }>}
   */
  #mfishingPlayers = new Map();

  /**
   * 活跃的钓鱼状态机
   * @type {Map<string, HookFSM>}
   */
  #fsmMap = new Map();

  /**
   * 浮漂 ID → 玩家 ID 反向索引
   * @type {Map<string, string>}
   */
  #hookToPlayerMap = new Map();

  /**
   * 玩家 ID → 浮漂命中实体的待补报记录
   * 只存 id 与时刻，触发时再取 Player / Entity，避免长期持有失效引用
   * @type {Map<string, {
   *   hookId: string,
   *   hurtEntityId: string,
   *   tick: number,
   *   timestamp: number
   * }>}
   */
  #hookToEntity = new Map();

  /**
   * 浮漂 ID → 待结算的被动收杆信息
   * 以浮漂 ID 为键，保证同一玩家连续抛竿时记录不会互相覆盖
   * @type {Map<string, {
   *   playerId: string,
   *   isOnWater: boolean,
   *   isInWater: boolean,
   *   isBesideWater: boolean,
   *   runId: number
   * }>}
   */
  #fishend = new Map();

  /**
   * 玩家 ID → 最近一次被移除的浮漂 ID
   * 供 itemUse（主动收杆）精确定位
   * @type {Map<string, string>}
   */
  #playerPendingReel = new Map();

  /**
   * 存储轮询的 interval ID
   * @type {number | null}
   */
  #stateCheckIntervalId = null;

  /**
   * 暂停原因集合。允许多个来源同时暂停（例如熔断 + 管理员手动暂停），
   * 只有全部原因都恢复后才重新启动状态检查，避免互相覆盖。
   * @type {Set<string>}
   */
  #pauseReasons = new Set();

  /**
   * 管理员全局临时暂停标志。
   * 与 #pauseReasons 分开：管理员暂停只阻止新的自动钓鱼会话，
   * 不冻结其他玩家（手动钓鱼）的状态机步进。
   * @type {boolean}
   */
  #adminPaused = false;

  /**
   * 管理员暂停前正在自动钓鱼的玩家：playerId → 玩家名
   * 仅存内存，脚本重载后自然清空
   * @type {Map<string, string>}
   */
  #adminPausedPlayers = new Map();

  constructor() {
    this.#init();
  }

  /**
   * 按 playerId 取 Player 对象
   * 优先从现存 FSM 里拿（引用最新），否则遍历在线玩家
   * @param {string} playerId
   * @returns {import("@minecraft/server").Player | undefined}
   */
  #getPlayerById(playerId) {
    const f = this.#fsmMap.get(playerId);
    if (f?.player?.isValid) return f.player;
    return world.getAllPlayers().find(p => p.id === playerId);
  }

  /**
   * 按 entityId 取 Entity 对象，实体不存在或已失效时返回 undefined
   * @param {string} entityId
   * @returns {import("@minecraft/server").Entity | undefined}
   */
  #getEntityById(entityId) {
    try {
      const e = world.getEntity(entityId);
      return e?.isValid ? e : undefined;
    } catch {
      // world.getEntity 在 id 非法时会抛错
      return undefined;
    }
  }

  /**
   * 判断命中实体的待补报记录是否仍在窗口内
   * @param {{tick: number, timestamp: number}} info
   * @returns {boolean}
   */
  #isHitRecordFresh(info) {
    if (Number.isFinite(info.tick) && Number.isFinite(system.currentTick)) {
      return system.currentTick - info.tick <= FishingConfig.HOOK_HIT_REPLAY_TICKS;
    }
    return Date.now() - info.timestamp <= FishingConfig.HOOK_HIT_REPLAY_TIME;
  }

  /**
   * 定期检查浮漂状态的核心逻辑
   */
  #checkHooks() {
    if (this.isPaused) return;
    const t0 = Date.now();
    this.#fsmMap.forEach((f, playerId) => {
      if (!f.player?.isValid || !f.hook?.isValid) {
        if (f.hook?.id) this.#hookToPlayerMap.delete(f.hook.id);
        f.destroy();
        this.#fsmMap.delete(playerId);
        return;
      }
      try {
        f.step();
        // 只有连续失败才销毁：成功一步即清零
        if (f.stepFailures) f.stepFailures = 0;
      } catch (err) {
        // 单个鱼钩故障不得阻断其他玩家；连续失败才销毁，避免永久卡死
        f.stepFailures = (f.stepFailures ?? 0) + 1;
        console.error("[FishingEvent] hook step failed:", err);
        if (f.stepFailures >= 5) {
          if (f.hook?.id) this.#hookToPlayerMap.delete(f.hook.id);
          f.destroy();
          this.#fsmMap.delete(playerId);
        }
      }
    });
    Perf.scan(t0, Date.now(), this.#fsmMap.size);
  }

  /**
   * 初始化
   */
  #init() {
    // 监听使用物品事件（抛竿 和 主动收杆）
    world.beforeEvents.itemUse.subscribe(event => {
      if (
        !event.source?.isValid ||
        event.itemStack.typeId !== "minecraft:fishing_rod" ||
        !this.#fsmMap.has(event.source.id)
      )
        return;
      const f = this.#fsmMap.get(event.source.id);
      // 构建预收杆事件对象
      const preReelRodEvent = {
        player: event.source,
        hook: f.hook,
        state: f.state,
        lastSinkingCheck: f.lastSinkingCheck,
        isOnWater: f.cachedIsOnWater,
        isInWater: f.cachedIsInWater,
        isBesideWater: f.cachedIsBesideWater,
        isOnWaterFirst: f.isOnWaterFirst,
        cancel: false,
      };
      // 触发预收杆事件，允许拦截
      Object.keys(preReelRodEvent).forEach(key => {
        if (key !== "cancel") {
          Object.defineProperty(preReelRodEvent, key, {
            writable: false,
            configurable: false,
          });
        }
      });
      this.beforeReelRod.trigger(preReelRodEvent);
      // 如果事件被取消，则拦截钓鱼竿使用
      if (preReelRodEvent.cancel) {
        event.cancel = true;
      }
    });

    world.afterEvents.itemUse.subscribe(event => {
      if (
        !event.source?.isValid ||
        event.itemStack.typeId !== "minecraft:fishing_rod"
      )
        return;

      const playerId = event.source.id;
      const pendingHookId = this.#playerPendingReel.get(playerId);
      if (pendingHookId !== undefined) {
        const v = this.#fishend.get(pendingHookId);
        if (v && v.playerId === playerId) {
          system.clearRun(v.runId);
          this.reelRod.trigger(
            Object.freeze({
              hookId: pendingHookId,
              player: event.source,
              isActive: true,
              isOnWater: v.isOnWater,
              isInWater: v.isInWater,
              isBesideWater: v.isBesideWater,
            }),
          );
          this.#fishend.delete(pendingHookId);
        }
        this.#playerPendingReel.delete(playerId);
        return;
      }

      this.#mfishingPlayers.set(playerId, {
        timestamp: Date.now(),
        castTick: system.currentTick,
        dimensionId: event.source.dimension.id,
        predictedPos: Vector3.subtract(
          Vector3.inFrontOfEntity(event.source, 2.2, true),
          event.source.getVelocity(),
        ),
      });
    });

    // 监听实体生成事件（确认抛杆）
    world.afterEvents.entitySpawn.subscribe(event => {
      if (event.entity?.typeId !== "minecraft:fishing_hook") return;
      system.runTimeout(() => {
        if (!event.entity?.isValid) return;
        // 延迟0，使该事件排在 itemUse 后，确保 #mfishingPlayers 写入
        const now = Date.now();
        const dimensionId = event.entity.dimension.id;
        let matchedPlayerId;
        let bestDistance = Infinity;
        // 命中实体的待补报记录（浮漂生成回调执行前就已命中实体的情况）
        let hitRecord;
        for (const [playerId, d] of this.#mfishingPlayers) {
          if (this.#fsmMap.has(playerId)) continue;
          const record = this.#hookToEntity.get(playerId);
          if (
            record !== undefined &&
            record.hookId === event.entity.id &&
            this.#isHitRecordFresh(record)
          ) {
            // 该浮漂在状态机建立前已命中实体，直接认定为本次匹配
            this.#hookToEntity.delete(playerId);
            hitRecord = record;
            matchedPlayerId = playerId;
            break;
          }
          // 匹配窗口按 tick 计，避免服务器卡顿把正常抛竿判为超时
          if (
            typeof system.currentTick === "number" &&
            typeof d.castTick === "number"
          ) {
            if (
              system.currentTick - d.castTick >
              FishingConfig.HOOK_SPAWN_MATCH_TICKS
            ) {
              this.#mfishingPlayers.delete(playerId);
              continue;
            }
          } else if (now - d.timestamp > FishingConfig.HOOK_SPAWN_MATCH_TIME) {
            this.#mfishingPlayers.delete(playerId);
            continue;
          }
          // 维度必须一致，避免跨维度同坐标错绑
          if (d.dimensionId !== dimensionId) continue;
          const distance = Vector3.distanceSquared(
            event.entity.location,
            d.predictedPos,
          );
          if (distance >= FishingConfig.HOOK_SPAWN_MATCH_DISTANCE) continue;
          if (distance < bestDistance) {
            bestDistance = distance;
            matchedPlayerId = playerId;
          }
        }
        if (matchedPlayerId === undefined) return;
        this.#mfishingPlayers.delete(matchedPlayerId);
        const player = this.#getPlayerById(matchedPlayerId);
        if (!player) return;
        // 管理员全局暂停期间不建立新的状态机，也不触发 castRod
        if (this.isAdminPaused()) return;

        // 命中补报：受伤实体已被清理时按普通抛竿处理
        const hitEntity =
          hitRecord === undefined
            ? undefined
            : this.#getEntityById(hitRecord.hurtEntityId);

        let f;
        try {
          f = new HookFSM(event.entity, player, this); // 传入信号对象
        } catch (err) {
          // 区块未加载时 dimension.getBiome 等会抛错，避免这次抛竿静默丢失
          console.error("[FishingEvent] hook fsm create failed:", err);
          return;
        }
        this.#fsmMap.set(matchedPlayerId, f);
        this.#hookToPlayerMap.set(event.entity.id, matchedPlayerId);

        if (hitEntity !== undefined) {
          // 命中实体的补报：不再触发 castRod，避免重新开启自动钓鱼
          this.hookHitEntity.trigger(
            Object.freeze({
              hook: event.entity,
              player,
              entity: hitEntity,
            }),
          );
          f.state = HookState.ON_ENTITY;
          return;
        }

        this.castRod.trigger(
          Object.freeze({
            hook: event.entity,
            player,
          }),
        );
      }, 0);
    });

    // 监听实体移除事件（收杆）
    world.beforeEvents.entityRemove.subscribe(event => {
      if (event.removedEntity?.typeId !== "minecraft:fishing_hook") return;
      const hookId = event.removedEntity.id;
      // 无论是否建立过状态机，都清理该浮漂的命中待补报记录
      for (const [ownerId, record] of this.#hookToEntity) {
        if (record.hookId === hookId) this.#hookToEntity.delete(ownerId);
      }
      const playerId = this.#hookToPlayerMap.get(hookId);
      if (playerId === undefined) return;
      const f = this.#fsmMap.get(playerId);
      if (!f) {
        this.#hookToPlayerMap.delete(hookId);
        return;
      }

      const r = system.runTimeout(() => {
        // 延迟1tick，无 itemUse 拦截即被动收杆
        const v = this.#fishend.get(hookId);
        if (!v) return;
        const player = this.#getPlayerById(v.playerId);
        if (player) {
          this.reelRod.trigger(
            Object.freeze({
              hookId,
              player,
              isActive: false,
              isOnWater: v.isOnWater,
              isInWater: v.isInWater,
              isBesideWater: v.isBesideWater,
            }),
          );
        }
        this.#fishend.delete(hookId);
        if (this.#playerPendingReel.get(v.playerId) === hookId) {
          this.#playerPendingReel.delete(v.playerId);
        }
      }, 1);

      this.#fishend.set(hookId, {
        playerId,
        isOnWater: f.cachedIsOnWater,
        isInWater: f.cachedIsInWater,
        isBesideWater: f.cachedIsBesideWater,
        runId: r,
      });
      this.#playerPendingReel.set(playerId, hookId);

      f.destroy();
      this.#fsmMap.delete(playerId);
      this.#hookToPlayerMap.delete(hookId);
    });

    // 监听玩家离开事件 清理 map
    world.beforeEvents.playerLeave.subscribe(event => {
      const playerId = event.player?.id;
      if (!playerId) return;
      this.#mfishingPlayers.delete(playerId);
      this.#hookToEntity.delete(playerId);
      if (this.#fsmMap.has(playerId)) {
        const f = this.#fsmMap.get(playerId);
        if (f?.hook?.isValid) {
          this.#hookToPlayerMap.delete(f.hook.id);
        }
        f.destroy();
        this.#fsmMap.delete(playerId);
      }
      const pendingHookId = this.#playerPendingReel.get(playerId);
      if (pendingHookId !== undefined) {
        const v = this.#fishend.get(pendingHookId);
        if (v) {
          system.clearRun(v.runId);
          this.#fishend.delete(pendingHookId);
        }
        this.#playerPendingReel.delete(playerId);
      }
    });

    // 监听实体受伤事件
    world.afterEvents.entityHurt.subscribe(event => {
      if (
        !event.damageSource.damagingProjectile?.isValid ||
        event.damageSource.damagingProjectile.typeId !== "minecraft:fishing_hook"
      )
        return;
      const player = event.damageSource.damagingEntity;
      if (!player?.isValid || player.typeId !== "minecraft:player") return;
      const playerId = player.id;
      const projectileId = event.damageSource.damagingProjectile.id;
      if (!this.#fsmMap.has(playerId)) {
        // 状态机尚未建立（浮漂生成回调未执行）：先记录，等浮漂生成时补报
        const prev = this.#hookToEntity.get(playerId);
        if (
          prev !== undefined &&
          prev.hookId === projectileId &&
          this.#isHitRecordFresh(prev)
        ) {
          return;
        }
        this.#hookToEntity.set(playerId, {
          hookId: projectileId,
          hurtEntityId: event.hurtEntity.id,
          tick: system.currentTick,
          timestamp: Date.now(),
        });
        return;
      }
      const f = this.#fsmMap.get(playerId);
      if (projectileId !== f?.hook.id) return;
      this.hookHitEntity.trigger(
        Object.freeze({
          hook: f.hook,
          player,
          entity: event.hurtEntity,
        }),
      );
      f.state = HookState.ON_ENTITY;
    });

    // 定期检查浮漂状态
    this.#stateCheckIntervalId = system.runInterval(
      this.#checkHooks.bind(this),
      FishingConfig.STATE_CHECK_INTERVAL_TICKS,
    );
  }

  /** 是否存在任一全局暂停原因（目前用于熔断等内部暂停） */
  get isPaused() {
    return this.#pauseReasons.size > 0;
  }

  /** 管理员是否已开启全局临时暂停 */
  isAdminPaused() {
    return this.#adminPaused;
  }

  /**
   * 当前正在自动钓鱼的玩家快照。
   * 仅统计已建立 HookFSM 且处于自动钓鱼状态的会话；
   * FSM 对所有抛竿都会创建（含手动钓鱼），因此必须再用 isAutoFishing 过滤。
   * @returns {{id: string, name: string, state: string, dimension: string, hookId: string}[]}
   */
  getRunningPlayers() {
    const list = [];
    for (const [playerId, f] of this.#fsmMap) {
      if (!isAutoFishing(playerId)) continue;
      if (!f?.player?.isValid || !f?.hook?.isValid) continue;
      list.push({
        id: playerId,
        name: f.player.nameTag,
        state: f.state,
        dimension: f.player.dimension.id,
        hookId: f.hook.id,
      });
    }
    return list;
  }

  /**
   * 查询单个玩家的状态机信息
   * @param {string} playerId
   * @returns {{state: string, hookId: string | null, dimension: string | null} | null}
   */
  getPlayerState(playerId) {
    const f = this.#fsmMap.get(playerId);
    if (!f) return null;
    return {
      state: f.state,
      hookId: f.hook?.id ?? null,
      dimension: f.player?.isValid ? f.player.dimension.id : null,
    };
  }

  /**
   * 管理员暂停前的运行快照（playerId → name）
   * @returns {{id: string, name: string}[]}
   */
  getAdminPauseSnapshot() {
    return Array.from(this.#adminPausedPlayers, ([id, name]) => ({ id, name }));
  }

  /**
   * 停止单个玩家的自动钓鱼会话（内部版本，不修改管理员暂停快照）
   *
   * 先清 AutoFish 状态并从映射表摘除，再移除浮漂：entityRemove 处理器
   * 找不到 hookId 归属就不会再排队一次 reelRod，避免误发“已收杆”提示。
   * @param {string} playerId
   * @returns {boolean} 是否停止了运行中的会话
   */
  #stopSession(playerId) {
    const f = this.#fsmMap.get(playerId);
    if (!f) return false;
    const hook = f.hook;
    clearPlayerFishingState(playerId);
    this.#fsmMap.delete(playerId);
    if (hook?.id) this.#hookToPlayerMap.delete(hook.id);
    this.#hookToEntity.delete(playerId);
    if (hook?.isValid) {
      try {
        hook.remove();
      } catch (err) {
        console.warn("[FishingEvent] hook remove failed:", err);
      }
    }
    f.destroy();
    return true;
  }

  /**
   * 停止单个玩家：同时从管理员暂停快照中移除，避免恢复时被重新拉起。
   * @param {string} playerId
   * @returns {boolean}
   */
  stopPlayerSession(playerId) {
    const stopped = this.#stopSession(playerId);
    this.#adminPausedPlayers.delete(playerId);
    return stopped;
  }

  /**
   * 管理员全局暂停：
   * 1. 记录当前运行中的玩家；
   * 2. 置暂停标志（阻止新的 castRod / 状态机启动）；
   * 3. 用安全流程停掉当前会话；
   * 4. 不修改任何玩家个人设置。
   * @returns {{count: number, already: boolean}}
   */
  pauseAdmin() {
    if (this.isAdminPaused()) return { count: 0, already: true };
    this.#adminPaused = true;
    const running = this.getRunningPlayers();
    this.#adminPausedPlayers.clear();
    for (const p of running) {
      this.#adminPausedPlayers.set(p.id, p.name);
      this.#stopSession(p.id);
    }
    return { count: running.length, already: false };
  }

  /**
   * 管理员恢复：仅对暂停前正在运行、且当前仍在线、全局功能仍开启的玩家
   * 重新走正常启动流程；不会启动暂停前未运行的玩家。
   * @returns {{restored: number, skipped: number, already: boolean}}
   */
  resumeAdmin() {
    if (!this.isAdminPaused()) return { restored: 0, skipped: 0, already: true };
    this.#adminPaused = false;
    const online = new Set(world.getAllPlayers().map(p => p.id));
    let restored = 0;
    let skipped = 0;
    for (const playerId of this.#adminPausedPlayers.keys()) {
      // 当前版本没有“个人自动钓鱼开关”，恢复资格 = 在线 + 全局功能开启
      if (Settings.auto && online.has(playerId)) {
        startAutoFishing(playerId);
        restored++;
      } else {
        skipped++;
      }
    }
    this.#adminPausedPlayers.clear();
    return { restored, skipped, already: false };
  }

  /**
   * 暂停检查浮漂状态，受影响事件：
   * * hookOnWaterSurfaceChange
   * * fishBite
   * @param {string} [reason] 暂停来源，缺省为 "manual"
   */
  pause(reason = "manual") {
    if (this.#pauseReasons.has(reason)) return;
    this.#pauseReasons.add(reason);
    if (this.#stateCheckIntervalId !== null) {
      system.clearRun(this.#stateCheckIntervalId);
      this.#stateCheckIntervalId = null;
    }
  }

  /**
   * 恢复检查浮漂状态。仅当所有暂停原因都解除后才重建轮询间隔。
   * @param {string} [reason] 暂停来源，缺省为 "manual"
   */
  resume(reason = "manual") {
    if (!this.#pauseReasons.delete(reason)) return;
    if (this.isPaused) return;
    if (this.#stateCheckIntervalId === null) {
      this.#stateCheckIntervalId = system.runInterval(
        this.#checkHooks.bind(this),
        FishingConfig.STATE_CHECK_INTERVAL_TICKS,
      );
    }
  }
}

// 创建并导出钓鱼事件管理器实例
export const fishingEvents = new FishingEventManager();
