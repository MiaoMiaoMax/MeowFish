/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { CacheMetrics } from "./CacheMetrics.js";
import { FishingConfig } from "./FishingConfig.js";
import { checkHookWaterStatus } from "./FishingHelper.js";
import { Perf } from "./Perf.js";
import { Vector3 } from "./Vector3.js";

export const HookState = {
  /**
   * 等待首次稳定
   */
  INIT: "INIT",
  /**
   * 等待稳定
   */
  SETTLING: "SETTLING",
  /**
   * 等待咬钩
   */
  FLOATING: "FLOATING",
  /**
   * 在地面稳定
   */
  ON_GROUND: "ON_GROUND",
  /**
   * 在实体上
   */
  ON_ENTITY: "ON_ENTITY"
};

export class HookFSM {
  /**
   * 初始化
   * @param {import("@minecraft/server").Entity} hook 
   * @param {import("@minecraft/server").Player} player 
   * @param {*} signals FishingEventManager 实例（包含事件信号）
   * @throws 如果位置在未加载的区块中，可能会抛出错误。
   */
  constructor(hook, player, signals) {
    this.state = HookState.INIT;
    this.hook = hook;
    this.player = player;
    this.hookLoc = this.hook.location;
    this.waterCacheLoc = null;
    this.dimension = this.hook.dimension
    this.biome = this.dimension.getBiome(Vector3.getSafePos(this.dimension, this.hookLoc));
    this.signals = signals; // FishingEventManager 实例（包含事件信号）

    this.mfishBite = false;

    this.beforeCachedIsOnWaterTime = null;
    this.cachedIsOnWater = false;
    this.cachedIsInWater = false;
    this.cachedIsBesideWater = false;

    this.cachedVelocity = null;

    this.hookVY = [];
    this.prevVY = null;
    this.hookLY = [];
    this.hookLYC = 0;

    // 时间戳
    this.isOnWaterFirst = null;
    this.lastSinkingCheck = null;
    this.sinkingStartTime = null;
    this.abnormalTriggered = false;
    this.waterCacheTime = 0;
  }

  /**
   * 持续下沉异常检测，FLOATING 与 SETTLING 共用
   * @param {boolean} isSinking
   * @param {{isOnWater:boolean,isInWater:boolean,isBesideWater:boolean}} status
   * @param {number} now
   */
  #trackAbnormal(isSinking, status, now) {
    if (!FishingConfig.ENABLE_ABNORMAL_DETECTION) return;
    if (isSinking) {
      if (this.sinkingStartTime === null) {
        this.sinkingStartTime = now;
        this.abnormalTriggered = false;
      } else if (
        !this.abnormalTriggered &&
        now - this.sinkingStartTime > FishingConfig.SINK_ABNORMAL_THRESHOLD
      ) {
        this.signals.hookAbnormal.trigger({
          hook: this.hook,
          player: this.player,
          type: "abnormal_sink",
          data: {
            isInWater: status.isInWater,
            isOnWater: status.isOnWater,
            isBesideWater: status.isBesideWater,
            sinkingDuration: now - this.sinkingStartTime,
          },
        });
        this.abnormalTriggered = true;
      }
    } else {
      this.sinkingStartTime = null;
      this.abnormalTriggered = false;
    }
  }

  step() {
    const now = Date.now();
    const pos = this.hook.location;
    // 鱼钩与玩家不在同一维度时不再处理，防止跨维度鱼钩被误绑定
    if (this.hook.dimension.id !== this.player.dimension.id) {
      this.destroy();
      return;
    }
    const movedSq = Vector3.distanceSquared(pos, this.hookLoc);

    switch (this.state) {
      case HookState.INIT: {
        if (this.isOnWaterFirst !== null) {
          if (now - this.isOnWaterFirst > FishingConfig.FIRST_WATER_DELAY) this.state = HookState.FLOATING;
          return;
        }
        if (movedSq < FishingConfig.STABLE_MAX_DISPLACEMENT_NORMAL) {
          const velocity = this.hook.getVelocity();
          if (velocity.y < FishingConfig.STABLE_MAX_VY) {
            this.hookLoc = pos;
            return;
          }
          const status = checkHookWaterStatus(this.dimension, pos);
          if (status.isOnWater || status.isBesideWater) {
            this.isOnWaterFirst = now;
            this.signals.hookOnWaterSurfaceChange.trigger({
              hook: this.hook,
              player: this.player,
              isFirst: true,
              ...status,
            });
          }
          else if (!status.isInWater) {
            this.state = HookState.ON_GROUND;
          }
          this.waterCacheLoc = pos;
          this.waterCacheTime = now;
          if (status.isBesideWater) {
            this.hookVY = [velocity.y];
          }
          this.cachedIsOnWater = status.isOnWater;
          this.cachedIsInWater = status.isInWater;
          this.cachedIsBesideWater = status.isBesideWater;
          this.cachedVelocity = velocity;
        } else {
          this.hookLoc = pos; // 未稳定，仅更新位置
        }
        break;
      }
      case HookState.ON_GROUND: {
        if (movedSq > 0.2) this.state = HookState.INIT;
        break;
      }
      case HookState.SETTLING: {
        // 咬钩后仍可能持续下沉，异常计时不能在此状态中断
        this.#trackAbnormal(
          this.hook.getVelocity().y < FishingConfig.SINK_VY_THRESHOLD,
          {
            isOnWater: this.cachedIsOnWater,
            isInWater: this.cachedIsInWater,
            isBesideWater: this.cachedIsBesideWater,
          },
          now,
        );
        const cooldown = this.cachedIsBesideWater
          ? FishingConfig.STABLE_COOLDOWN_BESIDE
          : FishingConfig.STABLE_COOLDOWN_NORMAL;
        const timeOk = now - this.lastSinkingCheck > cooldown;
        // console.warn(movedSq < FishingConfig.STABLE_MAX_DISPLACEMENT_BESIDE, movedSq);
        if (movedSq < (this.cachedIsBesideWater ? FishingConfig.STABLE_MAX_DISPLACEMENT_BESIDE : FishingConfig.STABLE_MAX_DISPLACEMENT_NORMAL) && timeOk) {
          this.hookLY.push(movedSq)
          if (this.hookLY.length < 3) {
            this.hookLoc = pos;
            return;
          }
          if (this.hookLY.length > 5) this.hookLY.shift()
          const avg = this.hookLY.reduce((a, b) => a + b, 0) / this.hookLY.length;
          // console.error(avg);
          if (avg > 0.0002) {
            this.hookLY = [];
            this.hookLYC = 0;
            this.hookLoc = pos;
            return;
          }
          this.hookLYC++;
          if (this.hookLYC < 3) {
            this.hookLoc = pos;
            return;
          }
          this.hookLY = [];
          this.hookLYC = 0;
          this.mfishBite = false;
          const velocity = this.hook.getVelocity();
          // console.warn(velocity.y < FishingConfig.STABLE_MAX_VY);
          if (velocity.y < FishingConfig.STABLE_MAX_VY) {
            this.hookLoc = pos;
            return;
          }
          // console.warn("进入待咬钩", now);
          this.state = HookState.FLOATING;
          this.sinkingStartTime = null;
          this.abnormalTriggered = false;
          this.waterCacheLoc = pos;
          this.waterCacheTime = now;
          const status = checkHookWaterStatus(this.dimension, pos);
          if (status.isBesideWater) {
            this.hookVY = [velocity.y];
          }
          this.prevVY = null;
          this.beforeCachedIsOnWaterTime = null;
          this.cachedIsOnWater = status.isOnWater;
          this.cachedIsInWater = status.isInWater;
          this.cachedIsBesideWater = status.isBesideWater;
          this.cachedVelocity = velocity;
        } else {
          this.hookLoc = pos;
        }
        break;
      }

      case HookState.FLOATING: {
        const waterMovedSq = Vector3.distanceSquared(pos, this.waterCacheLoc);
        let status, velocity, avgY;
        let statusFromCache = false;
        if (
          Perf.cacheOn &&
          now - this.waterCacheTime <= 1000 &&
          waterMovedSq <
            (this.cachedIsOnWater
              ? FishingConfig.CACHE_STATUS_DISTANCE_SQ
              : FishingConfig.CACHE_STATUS_DISTANCE_SQ_NON_WATER)
        ) {
          statusFromCache = true;
          CacheMetrics.statusHit();
          Perf.statusHit();
          status = {
            isOnWater: this.cachedIsOnWater,
            isInWater: this.cachedIsInWater,
            isBesideWater: this.cachedIsBesideWater,
          };
        } else {
          if (Perf.cacheOn) {
            CacheMetrics.statusMiss();
          }
          Perf.statusMiss();
          this.waterCacheLoc = pos;
          this.waterCacheTime = now;
          const oldIsOnWater = this.cachedIsOnWater;
          const oldIsInWater = this.cachedIsInWater;
          const oldIsBesideWater = this.cachedIsBesideWater;
          status = checkHookWaterStatus(this.dimension, pos);
          this.cachedIsOnWater = status.isOnWater;
          this.cachedIsInWater = status.isInWater;
          this.cachedIsBesideWater = status.isBesideWater;
          if (
            status.isOnWater !== oldIsOnWater ||
            status.isInWater !== oldIsInWater ||
            status.isBesideWater !== oldIsBesideWater
          ) {
            this.signals.hookOnWaterSurfaceChange.trigger({
              hook: this.hook,
              player: this.player,
              isFirst: false,
              ...status,
            });
            this.state = HookState.SETTLING;
            if (!status.isOnWater && !status.isInWater && !status.isBesideWater)
              return;
          }
          if (oldIsOnWater && !status.isOnWater)
            this.beforeCachedIsOnWaterTime = now;
        }

        if (
          Perf.cacheOn &&
          movedSq < FishingConfig.CACHE_VELOCITY_DISTANCE_SQ &&
          !this.cachedIsBesideWater
        ) {
          CacheMetrics.velocityHit();
          Perf.velocityHit();
          velocity = this.cachedVelocity;
        } else {
          if (Perf.cacheOn && !this.cachedIsBesideWater) {
            CacheMetrics.velocityMiss();
            Perf.velocityMiss();
          }
          velocity = this.hook.getVelocity();
          if (!this.cachedIsBesideWater) {
            if (this.cachedVelocity.y > velocity.y && velocity.y < -0.056)
              this.mfishBite = true;
            this.prevVY = this.cachedVelocity.y;
          }
          this.cachedVelocity = velocity;
          this.hookLoc = pos;
        }
        const vy = velocity.y;
        if (status.isBesideWater) {
          this.hookVY.push(vy);
          if (this.hookVY.length > FishingConfig.VY_HISTORY_LENGTH)
            this.hookVY.shift();
          avgY = this.hookVY.reduce((a, b) => a + b, 0) / this.hookVY.length;
        }

        // console.log(status.isBesideWater ? Math.abs(avgY - vy) : vy, this.mfishBite, status.isOnWater);

        // 计算是否下沉
        const isSinking = status.isBesideWater
          ? Math.abs(avgY - vy) > FishingConfig.SINK_DELTA_THRESHOLD
          : vy < FishingConfig.SINK_VY_THRESHOLD;

        // 咬钩候选若来自缓存，先复核水面状态，防止水源被移除后仍误判
        if (statusFromCache && (isSinking || this.mfishBite)) {
          Perf.recheck();
          status = checkHookWaterStatus(this.dimension, pos);
          this.cachedIsOnWater = status.isOnWater;
          this.cachedIsInWater = status.isInWater;
          this.cachedIsBesideWater = status.isBesideWater;
          this.waterCacheLoc = pos;
          this.waterCacheTime = now;
        }

        this.#trackAbnormal(isSinking, status, now);

        // if (this.mfishBite) console.warn(this.prevVY < this.cachedVelocity.y);
        if (
          isSinking ||
          (Perf.cacheOn && !isSinking && this.mfishBite && this.prevVY < this.cachedVelocity.y)
        ) {
          if (
            !status.isOnWater &&
            !(
              this.beforeCachedIsOnWaterTime !== null &&
              now - this.beforeCachedIsOnWaterTime < 300
            )
          ) {
            return;
          }
          Perf.bite(now);
          // console.warn("fishBite", now);
          let biteBiome = this.biome;
          try {
            biteBiome = this.dimension.getBiome(Vector3.getSafePos(pos));
            this.biome = biteBiome;
          } catch (_) {
            // 查询失败时回退到抛竿时的群系
          }
          this.signals.fishBite.trigger({
            hook: this.hook,
            player: this.player,
            biome: biteBiome,
            isBesideWater: this.cachedIsBesideWater,
          });
          this.state = HookState.SETTLING;
          this.lastSinkingCheck = now;
          this.sinkingStartTime = null;
        }
        break;
      }
    }
  }

  destroy() {
    this.hook = null;
    this.player = null;
    this.signals = null;
  }
}
