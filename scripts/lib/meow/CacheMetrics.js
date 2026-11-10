/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

export const CacheMetrics = {
  // 全量累计数据 (Total)
  total: {
    statusHits: 0,
    statusMisses: 0,
    velocityHits: 0,
    velocityMisses: 0,
  },

  // 近期滑动窗口数据 (Recent - 1小时)
  _BUCKET_COUNT: 12,
  _BUCKET_SIZE_MS: 5 * 60 * 1000,
  _buckets: Array.from({ length: 12 }, () => ({
    timeKey: 0, statusHits: 0, statusMisses: 0, velocityHits: 0, velocityMisses: 0,
  })),

  _getCurrentBucket() {
    const currentKey = Math.floor(Date.now() / this._BUCKET_SIZE_MS);
    const index = currentKey % this._BUCKET_COUNT;
    const bucket = this._buckets[index];
    if (bucket.timeKey !== currentKey) {
      bucket.timeKey = currentKey;
      bucket.statusHits = 0; bucket.statusMisses = 0;
      bucket.velocityHits = 0; bucket.velocityMisses = 0;
    }
    return bucket;
  },

  statusHit() { this.total.statusHits++; this._getCurrentBucket().statusHits++; },
  statusMiss() { this.total.statusMisses++; this._getCurrentBucket().statusMisses++; },
  velocityHit() { this.total.velocityHits++; this._getCurrentBucket().velocityHits++; },
  velocityMiss() { this.total.velocityMisses++; this._getCurrentBucket().velocityMisses++; },

  getSnapshot() {
    let rStatusHits = 0, rStatusMisses = 0, rVelocityHits = 0, rVelocityMisses = 0;
    for (const b of this._buckets) {
      rStatusHits += b.statusHits; rStatusMisses += b.statusMisses;
      rVelocityHits += b.velocityHits; rVelocityMisses += b.velocityMisses;
    }

    const calcRate = (hits, misses) => {
      const checks = hits + misses;
      return { hits, misses, checks, hitRate: checks > 0 ? (hits / checks * 100) : null };
    };

    return {
      cumulative: {
        status: calcRate(this.total.statusHits, this.total.statusMisses),
        velocity: calcRate(this.total.velocityHits, this.total.velocityMisses),
      },
      recent: {
        status: calcRate(rStatusHits, rStatusMisses),
        velocity: calcRate(rVelocityHits, rVelocityMisses),
      }
    };
  },
};
