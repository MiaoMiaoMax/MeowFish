/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 性能埋点（只统计，不参与任何玩法判定）
 *
 * 打开后每 100 次浮漂扫描（约 10 秒）输出一行：
 *   mfperf win cfg=1 t0=... t1=... n=100 hooks=1 st=98 sth=91 stm=7 rc=1 vq=99 vh=93 vm=6 blk=112 bite=2 bt=1791543892659,1791543901234 gapAvg=100.4 gapMax=118 ms=3
 *
 * 咬钩时间戳直接写在 win 行的 bt= 里，分析器不再依赖单独的 fishBite 行。
 * cfg=1 缓存开启、cfg=0 缓存关闭，用于同一构建内的 A/B。
 * 日志直连 console.warn（ContentLog），不经过 Logging，避免聊天栏刷屏和颜色码。
 */
export const Perf = {
  enabled: false,
  cacheOn: true,

  // 当前窗口计数
  n: 0,
  ms: 0,
  st: 0,
  sth: 0,
  stm: 0,
  rc: 0,
  vq: 0,
  vh: 0,
  vm: 0,
  blk: 0,
  bites: 0,
  bt: [],
  gapSum: 0,
  gapMax: 0,
  gapCount: 0,
  lastScan: 0,
  winStart: 0,
  hooks: 0,
  skipGap: false,

  /**
   * 清空当前窗口
   * @param {number} now
   */
  resetWindow(now = Date.now()) {
    this.n = 0;
    this.ms = 0;
    this.st = 0;
    this.sth = 0;
    this.stm = 0;
    this.rc = 0;
    this.vq = 0;
    this.vh = 0;
    this.vm = 0;
    this.blk = 0;
    this.bites = 0;
    this.bt = [];
    this.gapSum = 0;
    this.gapMax = 0;
    this.gapCount = 0;
    this.hooks = 0;
    this.winStart = now;
    this.skipGap = false;
  },

  /**
   * 开始记录
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.lastScan = 0;
    this.resetWindow();
    this.logRun();
  },

  /**
   * 停止记录（先把不完整的窗口写出去）
   */
  disable() {
    if (!this.enabled) return;
    this.flush(Date.now());
    this.enabled = false;
  },

  /**
   * 切换缓存开关（A/B 的唯一变量），切换即开新 run
   * @param {boolean} on
   */
  setCache(on) {
    const next = on !== false;
    if (this.cacheOn === next) return;
    if (this.enabled) this.flush(Date.now());
    this.cacheOn = next;
    if (this.enabled) {
      this.lastScan = 0;
      this.resetWindow();
      this.logRun();
    }
  },

  logRun() {
    console.warn(`mfperf run cfg=${this.cacheOn ? 1 : 0} t=${Date.now()}`);
  },

  /**
   * 每次扫描循环结束后调用
   * @param {number} t0 扫描开始时间
   * @param {number} t1 扫描结束时间
   * @param {number} hooks 本次扫描的浮漂数
   */
  scan(t0, t1, hooks) {
    if (!this.enabled) return;
    if (this.n === 0) this.winStart = t0;
    this.n++;
    this.ms += t1 - t0;
    if (this.lastScan !== 0) {
      const gap = t0 - this.lastScan;
      // 暂停/恢复、bench 阻塞造成的超长间隔不计入抖动统计
      if (this.skipGap) {
        this.skipGap = false;
      } else if (gap > 0 && gap < 2000) {
        this.gapSum += gap;
        if (gap > this.gapMax) this.gapMax = gap;
        this.gapCount++;
      }
    }
    this.lastScan = t0;
    if (hooks > this.hooks) this.hooks = hooks;
    if (this.n >= 100) this.flush(t1);
  },

  /**
   * 输出并清空当前窗口
   * @param {number} t1
   */
  flush(t1 = Date.now()) {
    if (this.n === 0) return;
    const gapAvg = this.gapCount > 0 ? (this.gapSum / this.gapCount).toFixed(1) : "0.0";
    const btPart = this.bt.length ? ` bt=${this.bt.join(",")}` : "";
    console.warn(
      `mfperf win cfg=${this.cacheOn ? 1 : 0} t0=${this.winStart} t1=${t1} n=${this.n} hooks=${this.hooks} ` +
        `st=${this.st} sth=${this.sth} stm=${this.stm} rc=${this.rc} vq=${this.vq} vh=${this.vh} vm=${this.vm} ` +
        `blk=${this.blk} bite=${this.bites}${btPart} gapAvg=${gapAvg} gapMax=${Math.round(this.gapMax)} ms=${this.ms}`,
    );
    this.resetWindow();
  },

  // ---- 计数（enabled 时才有开销） ----

  statusHit() {
    if (!this.enabled) return;
    this.st++;
    this.sth++;
  },

  statusMiss() {
    if (!this.enabled) return;
    this.st++;
    this.stm++;
  },

  velocityHit() {
    if (!this.enabled) return;
    this.vq++;
    this.vh++;
  },

  velocityMiss() {
    if (!this.enabled) return;
    this.vq++;
    this.vm++;
  },

  /** 咬钩候选来自缓存、强制复核水面状态 */
  recheck() {
    if (this.enabled) this.rc++;
  },

  /** 一次方块读取（getBlock / above / offset） */
  block() {
    if (this.enabled) this.blk++;
  },

  /** 咬钩（时间戳同时写入当前窗口的 bt=，无需单独的 fishBite 行也能还原间隔） */
  bite(now = Date.now()) {
    if (!this.enabled) return;
    this.bites++;
    this.bt.push(now);
  },

  /**
   * 同步微基准：同样 2000 次状态判定，测「无缓存查询」与「缓存命中路径」的耗时。
   * 2000 次 = 20 个浮漂 × 10 Hz × 10 秒。
   * 取 2 轮最小值，降低系统抖动影响。
   * @param {import("@minecraft/server").Dimension} dimension
   * @param {{x:number,y:number,z:number}} origin 浮漂（或玩家）坐标
   * @param {(dimension: import("@minecraft/server").Dimension, pos: {x:number,y:number,z:number}) => object} queryFn 真实查询函数
   * @returns {{calls:number, msOff:number, msOn:number, blk:number}}
   */
  bench(dimension, origin, queryFn) {
    const POINTS = 20;
    const CALLS = 2000;
    const ROUNDS = 2;

    // 同一方块内取 20 个点，覆盖水面/傍水判定会走到的各个方向
    const cx = Math.floor(origin.x) + 0.5;
    const cy = Math.floor(origin.y);
    const cz = Math.floor(origin.z) + 0.5;
    const pts = [];
    for (let i = 0; i < POINTS; i++) {
      const a = (i / POINTS) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * 0.35, y: cy, z: cz + Math.sin(a) * 0.35 });
    }

    // bench 自身的方块读取（预热 + 两轮）整体不计入游戏窗口统计
    const blkBefore = this.blk;

    // 预热，让 JIT 先编译热路径
    for (let i = 0; i < 100; i++) queryFn(dimension, pts[i % POINTS]);

    const timeUncached = () => {
      const blk0 = this.blk;
      const t0 = Date.now();
      for (let i = 0; i < CALLS; i++) queryFn(dimension, pts[i % POINTS]);
      return { ms: Date.now() - t0, blk: this.blk - blk0 };
    };

    // 缓存命中路径：与 HookFSM.FLOATING 相同的 TTL + 位移判定，不访问世界
    const cache = pts.map(p => ({ x: p.x, y: p.y, z: p.z, t: Date.now() }));
    const timeCached = () => {
      const now = Date.now();
      const t0 = now;
      let hits = 0;
      for (let i = 0; i < CALLS; i++) {
        const p = pts[i % POINTS];
        const c = cache[i % POINTS];
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const dz = p.z - c.z;
        if (now - c.t <= 1000 && dx * dx + dy * dy + dz * dz < 0.1) hits++;
      }
      return { ms: Date.now() - t0, hits };
    };

    let msOff = Infinity;
    let msOn = Infinity;
    let blk = 0;
    let hitsOn = 0;
    for (let r = 0; r < ROUNDS; r++) {
      const off = timeUncached();
      if (off.ms < msOff) {
        msOff = off.ms;
        blk = off.blk;
      }
      const on = timeCached();
      if (on.ms < msOn) {
        msOn = on.ms;
        hitsOn = on.hits;
      }
    }

    // bench 期间（含预热与两轮）的方块读取全部不计入游戏窗口统计
    if (this.enabled) this.blk = blkBefore;
    this.skipGap = true;

    console.warn(
      `mfperf bench cfg=0 calls=${CALLS} ms=${msOff} blk=${blk} us=${((msOff * 1000) / CALLS).toFixed(1)}`,
    );
    console.warn(`mfperf bench cfg=1 calls=${CALLS} ms=${msOn} blk=0 us=${((msOn * 1000) / CALLS).toFixed(1)}`);

    return { calls: CALLS, msOff, msOn, blk, hitsOn };
  },
};
