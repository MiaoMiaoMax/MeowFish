/*
  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { system, world } from "@minecraft/server";
import { EventSignal } from "./event_signal";
import { Vector3 } from "./vector3";

/**
 * 钓鱼事件管理类
 */
class FishingEventManager {
  /**
   * 抛竿事件信号
   * @type {import("../@types/fishing_event").castRodSignal}
   */
  castRod = new EventSignal();

  /**
   * 预收杆事件信号（可在收杆前拦截）
   * @type {import("../@types/fishing_event").beforeReelRodSignal}
   */
  beforeReelRod = new EventSignal();

  /**
   * 收杆事件信号
   * @type {import("../@types/fishing_event").reelRodSignal}
   */
  reelRod = new EventSignal();

  /**
   * 鱼钩在水面状态改变事件信号
   * @type {import("../@types/fishing_event").hookOnWaterSurfaceChangeSignal}
   */
  hookOnWaterSurfaceChange = new EventSignal();

  /**
   * 鱼钩勾到实体事件信号
   * @type {import("../@types/fishing_event").hookHitEntitySignal}
   */
  hookHitEntity = new EventSignal();

  /**
   * 鱼咬钩事件信号
   * @type {import("../@types/fishing_event").fishBiteSignal}
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
   * @type {Map<import("@minecraft/server").Player, {hook: import("@minecraft/server").Entity, hookVY: number[], hookLoc: import("@minecraft/server").Vector3, isStable: boolean, isFishing: boolean | null, isSinking: boolean, lastSinkingCheck: number | null, isOnWater: boolean, isInWater: boolean, isBesideWater: boolean, isOnWaterFirst: number | null }>}
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
   * 检查鱼钩是否在水面上或在水中
   * @param {import("@minecraft/server").Entity} hook - 鱼钩实体
   */
  isHookOnWaterSurface(hook) {
    const location = hook.location;
    const velocity = hook.getVelocity();
    const dimension = hook.dimension;
    // 检查鱼钩位置是否是水
    const block = dimension.getBlock(location);
    let isBesideWater = false;
    if (
      !block ||
      (block.typeId !== "minecraft:water" &&
        block.typeId !== "minecraft:flowing_water" &&
        !block.isWaterlogged)
    ) {
      const locX = hook.location.x;
      const locZ = hook.location.z;
      if (
        Math.abs(velocity.x) < 0.1 &&
        Math.abs(velocity.y) > 0.01 &&
        Math.abs(velocity.z) < 0.1
      ) {
        
        const checkBesideWater = (offsetX, offsetZ) => {
          const beside = block.offset({ x: offsetX, y: 0, z: offsetZ });
          return (
            beside !== undefined &&
            (beside.typeId === "minecraft:water" ||
              beside.typeId === "minecraft:flowing_water" ||
              beside.isWaterlogged)
          );
        };
        // 对角线方向检查
        if (locX >= block.x + 0.7 && locZ >= block.z + 0.7) {
          isBesideWater = checkBesideWater(1, 1); // 东南
        } else if (locX <= block.x + 0.3 && locZ >= block.z + 0.7) {
          isBesideWater = checkBesideWater(-1, 1); // 西南
        } else if (locX >= block.x + 0.7 && locZ <= block.z + 0.3) {
          isBesideWater = checkBesideWater(1, -1); // 东北
        } else if (locX <= block.x + 0.3 && locZ <= block.z + 0.3) {
          isBesideWater = checkBesideWater(-1, -1); // 西北
        }
        if (!isBesideWater) {
          const center = block.center();
          // 正方向检查
          if (!isBesideWater && locX > center.x) {
            isBesideWater = checkBesideWater(1, 0); // 东
          }
          if (!isBesideWater && locX < center.x) {
            isBesideWater = checkBesideWater(-1, 0); // 西
          }
          if (!isBesideWater && locZ > center.z) {
            isBesideWater = checkBesideWater(0, 1); // 南
          }
          if (!isBesideWater && locZ < center.z) {
            isBesideWater = checkBesideWater(0, -1); // 北
          }
        }
      }
      if (!isBesideWater) return ({ velocity, isOnWater: false, isInWater: false, isBesideWater: false });
    }
    // 检查鱼钩上方是否是空气
    const aboveBlock = block.above(1);
    if (
      !aboveBlock ||
      aboveBlock.typeId === "minecraft:water" ||
      aboveBlock.typeId === "minecraft:flowing_water"
    ) {
      return ({ velocity, isOnWater: false, isInWater: true, isBesideWater });
    }

    return ({ velocity, isOnWater: true, isInWater: false, isBesideWater });
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
      if (event.itemStack.typeId !== "minecraft:fishing_rod" || !event.source?.name) return;
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
      // console.error("1");
    });

    // 监听实体生成事件（确认抛杆）
    world.afterEvents.entitySpawn.subscribe(event => {
      if (event.entity?.typeId !== "minecraft:fishing_hook") return;
      system.runTimeout(() => {
        if (!event.entity?.isValid()) return;
        // 延迟0，使该事件排在itemUse后，确保#mfishingPlayers写入
        let player;
        this.#mfishingPlayers.forEach((t, p) => {
          if (
            Vector3.distance(
              event.entity.location,
              Vector3.subtract(
                Vector3.add(
                  Vector3.lerp(p.location, p.getHeadLocation(), 0.8),
                  Vector3.scl(p.getViewDirection(), 1.3)
                ),
                p.getVelocity()
              )
            ) < 1.3 &&
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
          hookVY: [event.entity.getVelocity().y],
          hookLoc: event.entity.location,
          isStable: false,
          isFishing: null,
          isSinking: false,
          lastSinkingCheck: null,
          isOnWater: false,
          isInWater: false,
          isBesideWater: false,
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
      if (event.removedEntity?.typeId !== "minecraft:fishing_hook") return;
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
              ...w,
            })
          );
          this.#fishend.delete(p);
        }, 1);
        this.#fishend.set(p, {
          hookId: v.hook.id,
          isFishing: v.isFishing,
          isSinking: v.isSinking,
          ...w,
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
      v.isStable = true;
      v.isFishing = false;
    });

    // 定期检查鱼钩状态
    system.runInterval(() => {
      this.#fishing.forEach((v, p) => {
        if (!p?.isValid() || !v.hook?.isValid() || v.isFishing === false) return;
        const now = Date.now();
        if (!v.isStable) {
          if (
            Math.abs(v.hook.location.x - v.hookLoc.x) < 0.0001 &&
            Math.abs(v.hook.location.y - v.hookLoc.y) < 0.02 &&
            Math.abs(v.hook.location.z - v.hookLoc.z) < 0.0001 &&
            (!v.lastSinkingCheck || now - v.lastSinkingCheck > (v.isBesideWater ? 1500 : 1000))
          ) {
            v.isStable = true;
          } else {
            v.hookLoc = v.hook.location;
          }
          return;
        }

        const currentStatus = this.isHookOnWaterSurface(v.hook);
        const vy = currentStatus.velocity.y;
        v.hookVY.push(vy);
        if (v.hookVY.length > 5) v.hookVY.shift();
        const avgY = v.hookVY.reduce((a, b) => a + b, 0) / v.hookVY.length;

        if (v.isStable && v.isFishing === null) {
          if (!currentStatus.isOnWater && !currentStatus.isBesideWater) {
            if (!currentStatus.isInWater) {
              v.isFishing = false;
            }
            return;
          }
          this.hookOnWaterSurfaceChange.trigger(
            Object.freeze({
              hook: v.hook,
              player: p,
              isFirst: true,
              ...currentStatus,
            })
          );
          v.isOnWater = currentStatus.isOnWater;
          v.isInWater = currentStatus.isInWater;
          v.isBesideWater = currentStatus.isBesideWater;
          v.isFishing = true;
          v.isOnWaterFirst = now;
          return;
        }

        // 水面状态改变
        if (v.isFishing && currentStatus.isOnWater !== v.isOnWater) {
          this.hookOnWaterSurfaceChange.trigger(
            Object.freeze({
              hook: v.hook,
              player: p,
              isFirst: false,
              ...currentStatus,
            })
          );
          v.isOnWater = currentStatus.isOnWater;
          v.isInWater = currentStatus.isInWater;
          v.isBesideWater = currentStatus.isBesideWater;
        }

        // 鱼咬钩检测
        if (v.isFishing && v.isStable && v.isOnWater) {
          const isSinking = v.isBesideWater ? Math.abs(avgY - vy) > 0.024 : vy < -0.06;

          // log(isSinking, v.isBesideWater, Math.abs(avgY - vy));
          // if (isSinking) error(Math.abs(avgY - vy));

          if (
            v.isSinking !== isSinking && now - v.isOnWaterFirst > 1000
          ) {
            if (isSinking) {
              // 触发鱼咬钩事件
              this.fishBite.trigger(
                Object.freeze({
                  hook: v.hook,
                  player: p,
                  isBesideWater: v.isBesideWater,
                })
              );
              v.lastSinkingCheck = now;
            }
            v.isStable = false;
            v.isSinking = isSinking;
          }
        }
      });
    }, 2);
  }
}

// 创建并导出钓鱼事件管理器实例
export const fishingEvents = new FishingEventManager();