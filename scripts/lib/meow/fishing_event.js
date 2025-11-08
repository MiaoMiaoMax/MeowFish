/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { system, world } from "@minecraft/server";
import { EventSignal } from "./event_signal.js";
import { Vector3 } from "./vector3.js";

/**
 * 钓鱼事件管理类
 */
class FishingEventManager {
  /**
   * 抛竿事件信号
   * @type {import("../@types/渔.js").castRodSignal}
   */
  castRod = new EventSignal();

  /**
   * 预收杆事件信号（可在收杆前拦截）
   * @type {import("../@types/渔.js").beforeReelRodSignal}
   */
  beforeReelRod = new EventSignal();

  /**
   * 收杆事件信号
   * @type {import("../@types/渔.js").reelRodSignal}
   */
  reelRod = new EventSignal();

  /**
   * 鱼钩在水面状态改变事件信号
   * @type {import("../@types/渔.js").hookOnWaterSurfaceChangeSignal}
   */
  hookOnWaterSurfaceChange = new EventSignal();

  /**
   * 鱼钩勾到实体事件信号
   * @type {import("../@types/渔.js").hookHitEntitySignal}
   */
  hookHitEntity = new EventSignal();

  /**
   * 鱼咬钩事件信号
   * @type {import("../@types/渔.js").fishBiteSignal}
   */
  fishBite = new EventSignal();

  /**
   * 可能在钓鱼的玩家列表
   * - 键：player
   * - 值：时间戳
   * @type {Map<import("@minecraft/server").Entity, number>}
   */
  #mfishingPlayers = new Map();

  /**
   * 钓鱼信息
   * @type {Map<import("@minecraft/server").Player, {hook: import("@minecraft/server").Entity, hookLoc: import("@minecraft/server").Vector3, isStable: boolean, isFishing: boolean | null, isSinking: boolean, lastSinkingCheck: number | null, isOnWater: boolean, isOnWaterFirst: number | null }>}
   */
  #fishing = new Map();

  /**
   * 钓鱼结束信息
   * @type {Map<import("@minecraft/server").Player, {hookId: string, isFishing: boolean, isSinking: boolean, isOnWater: boolean, runId: number}>}
   */
  #fishend = new Map();
  constructor() {
    this.#init();
  }

  /**
   * 检查鱼钩是否在水面上
   * @param {import("@minecraft/server").Entity} hook - 鱼钩实体
   * @returns {boolean} 如果鱼钩在水面上返回true，否则返回false
   */
  isHookOnWaterSurface(hook) {
    const location = hook.location;
    const dimension = hook.dimension;
    // 检查鱼钩位置是否是水
    const block = dimension.getBlock(location);
    if (
      !block ||
      (block.typeId !== "minecraft:water" &&
        block.typeId !== "minecraft:flowing_water")
    ) {
      return false;
    }
    // 检查鱼钩上方是否是空气（确保在水面）
    const aboveBlock = block.above(1);
    if (
      !aboveBlock ||
      (aboveBlock.typeId !== "minecraft:air" &&
        aboveBlock.typeId !== "minecraft:cave_air" &&
        hook.getVelocity().y > -0.01)
    ) {
      return false;
    }

    return true;
  }

  /**
   * 初始化
   */
  #init() {
    // 监听使用物品事件（抛竿 和 主动收杆）
    world.beforeEvents.itemUse.subscribe(event => {
      if (
        event.itemStack.typeId !== "minecraft:fishing_rod" ||
        !this.#fishing.has(event.source)
      )
        return;
      // 触发预收杆事件，允许拦截
      const preReelRodEvent = {
        player: event.source,
        ...this.#fishing.get(event.source),
        cancel: false,
      };
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
      if (event.itemStack.typeId !== "minecraft:fishing_rod") return;
      if (this.#fishend.has(event.source)) {
        const v = this.#fishend.get(event.source);
        system.clearRun(v.runId);
        this.reelRod.trigger(
          Object.freeze({
            hookId: v.hookId,
            player: event.source,
            isActive: true,
            isFishing: v.isFishing,
            isSinking: v.isSinking,
            isOnWater: v.isOnWater,
          })
        );
        this.#fishend.delete(event.source);
        return;
      }
      this.#mfishingPlayers.set(event.source, Date.now());
    });

    // 监听实体生成事件（确认抛杆）
    world.afterEvents.entitySpawn.subscribe(event => {
      if (event.entity.typeId !== "minecraft:fishing_hook") return;
      system.runTimeout(() => {
        if (!event.entity.isValid()) return;
        // 延迟0，使该事件排在itemUse后，确保#mfishingPlayers写入
        let player;
        this.#mfishingPlayers.forEach((t, p) => {
          if (
            Vector3.distance(
              event.entity.location,
              Vector3.subtract(
                Vector3.add(
                  Vector3.lerp(p.location, p.getHeadLocation(), 0.8),
                  Vector3.scl(p.getViewDirection(), 1.5)
                ),
                p.getVelocity()
              )
            ) < 1.2 &&
            Date.now() - t < 100
          ) {
            player = p;
            return;
          }
        });
        if (!player) return;
        this.#mfishingPlayers.delete(player);
        this.#fishing.set(player, {
          hook: event.entity,
          hookLoc: event.entity.location,
          isStable: false,
          isFishing: null,
          isSinking: false,
          lastSinkingCheck: null,
          isOnWater: false,
          isOnWaterFirst: null,
        });
        this.castRod.trigger(
          Object.freeze({
            hook: event.entity,
            player: player,
          })
        );
      }, 0);
    });

    // 监听实体移除事件（收杆）
    world.beforeEvents.entityRemove.subscribe(event => {
      if (event.removedEntity.typeId !== "minecraft:fishing_hook") return;
      this.#fishing.forEach((v, p) => {
        if (v.hook !== event.removedEntity) return;
        const w = this.isHookOnWaterSurface(v.hook);
        const r = system.runTimeout(() => {
          // 延迟1tick，无itemUse拦截即被动收杆
          this.reelRod.trigger(
            Object.freeze({
              hookId: v.hook.id,
              player: p,
              isActive: false,
              isFishing: v.isFishing,
              isSinking: v.isSinking,
              isOnWater: w,
            })
          );
          this.#fishend.delete(p);
        }, 1);
        this.#fishend.set(p, {
          hookId: v.hook.id,
          isFishing: v.isFishing,
          isSinking: v.isSinking,
          isOnWater: w,
          runId: r,
        });
        this.#fishing.delete(p);
      });
    });

    // 监听玩家离开事件 清理map
    world.beforeEvents.playerLeave.subscribe(event => {
      const player = event.player;
      this.#mfishingPlayers.delete(player);
      this.#fishing.delete(player);
      if (this.#fishend.has(player)) {
        system.clearRun(this.#fishend.get(player).runId);
        this.#fishend.delete(player);
      }
    });

    // 监听实体受伤事件
    world.afterEvents.entityHurt.subscribe(event => {
      const p = event.damageSource.damagingEntity;
      if (p === undefined || !this.#fishing.has(p)) return;
      const v = this.#fishing.get(p);
      if (event.damageSource.damagingProjectile !== v.hook) return;
      this.hookHitEntity.trigger(
        Object.freeze({
          hook: v.hook,
          player: p,
          entity: event.hurtEntity,
        })
      );
      this.#fishing.set(p, { ...v, isStable: true, isFishing: false });
    });

    // 定期检查鱼钩状态
    system.runInterval(() => {
      this.#fishing.forEach((v, p) => {
        if (!p?.isValid() || !v.hook?.isValid()) return;
        const currentStatus = this.isHookOnWaterSurface(v.hook);

        if (!v.isStable) {
          if (
            Math.abs(v.hook.location.x - v.hookLoc.x) < 0.0001 &&
            Math.abs(v.hook.location.z - v.hookLoc.z) < 0.0001
          ) {
            this.#fishing.set(p, { ...v, isStable: true });
          } else {
            return this.#fishing.set(p, { ...v, hookLoc: v.hook.location });
          }
        }

        if (v.isStable && v.isFishing === null) {
          if (!currentStatus)
            return this.#fishing.set(p, {
              ...v,
              isFishing: false,
            });
          this.hookOnWaterSurfaceChange.trigger(
            Object.freeze({
              hook: v.hook,
              isFirst: true,
              isOnWater: true,
            })
          );
          return this.#fishing.set(p, {
            ...v,
            isFishing: true,
            isOnWater: true,
            isOnWaterFirst: Date.now(),
          });
        }

        // 水面状态改变
        if (v.isFishing && currentStatus !== v.isOnWater) {
          this.hookOnWaterSurfaceChange.trigger(
            Object.freeze({
              hook: v.hook,
              isFirst: false,
              isOnWater: currentStatus,
            })
          );
          this.#fishing.set(p, { ...v, isOnWater: currentStatus });
        }

        // 鱼咬钩检测
        if (v.isFishing && v.isOnWater) {
          const now = Date.now();
          // 检查鱼钩是否开始下沉（表示鱼咬钩）
          const isSinking = v.hook.getVelocity().y < -0.06;

          // 检查是否状态发生变化且距离上次检测超过一定时间
          if (
            v.isSinking !== isSinking &&
            (!v.lastSinkingCheck || now - v.lastSinkingCheck > 1000)
          ) {
            if (isSinking) {
              // 触发鱼咬钩事件
              this.fishBite.trigger(
                Object.freeze({
                  hook: v.hook,
                  player: p,
                })
              );
            }
            // 更新状态
            this.#fishing.set(p, {
              ...v,
              isSinking: isSinking,
              lastSinkingCheck: now,
            });
          }
        }
      });
    }, 2);
  }
}

// 创建并导出钓鱼事件管理器实例
export const fishingEvents = new FishingEventManager();
