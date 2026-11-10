/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 维度y轴安全范围
 * @type {WeakMap<import("@minecraft/server").Dimension, {min: number, max:number}>}
 */
const heightRangeCache = new WeakMap();

/**
 * 处理Vector3的方法类
 */
export class Vector3 {
  /**
   * 创建 Vector3 的备份
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v
   * @returns {import("@minecraft/server").Vector3}
   */
  static copy(v) {
    return { x: v.x, y: v.y, z: v.z };
  }

  /**
   * 截取 Vector3 的整数部分
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v
   * @returns {import("@minecraft/server").Vector3}
   */
  static floor(v) {
    return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
  }

  /**
   * 返回 x,y,z 字符串
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v 
   * @returns 
   */
  static toString(v) {
    return `${v.x},${v.y},${v.z}`;
  }

  /**
   * 相加
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {number|Vector3} x 可以是Vector3，也可以是与a x相加的数值
   * @param {number} [y] 与a y相加的数值，当x是Vector3时将忽略此项
   * @param {number} [z] 与a z相加的数值，当x是Vector3时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static add(a, x, y, z) {
    if (typeof x === "number") {
      if (typeof y === "number" && typeof z === "number") {
        return {
          x: a.x + x,
          y: a.y + y,
          z: a.z + z,
        };
      }
      return {
        x: a.x + x,
        y: a.y + x,
        z: a.z + x,
      };
    }
    return this.add(a, x.x, x.y, x.z);
  }

  /**
   * 相减
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {number|Vector3} x 可以是Vector3，也可以是与a x相减的数值
   * @param {number} [y] 与a y相减的数值，当x是Vector3时将忽略此项
   * @param {number} [z] 与a z相减的数值，当x是Vector3时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static subtract(a, x, y, z) {
    if (typeof x === "number") {
      if (typeof y === "number" && typeof z === "number") {
        return {
          x: a.x - x,
          y: a.y - y,
          z: a.z - z,
        };
      }
      return {
        x: a.x - x,
        y: a.y - x,
        z: a.z - x,
      };
    }
    return this.subtract(a, x.x, x.y, x.z);
  }

  /**
   * 相乘
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {number|Vector3} x 可以是Vector3，也可以是与a x相乘的数值
   * @param {number} [y] 与a y相乘的数值，当x是Vector3时将忽略此项
   * @param {number} [z] 与a z相乘的数值，当x是Vector3时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static scl(a, x, y, z) {
    if (typeof x === "number") {
      if (typeof y === "number" && typeof z === "number") {
        return {
          x: a.x * x,
          y: a.y * y,
          z: a.z * z,
        };
      }
      return {
        x: a.x * x,
        y: a.y * x,
        z: a.z * x,
      };
    }
    return this.scl(a, x.x, x.y, x.z);
  }

  /**
   * 计算两个向量距离的平方（避免开根号，性能更高）
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {import("@minecraft/server").Vector3} b
   * @returns {number} 距离的平方
   */
  static distanceSquared(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * 计算两个向量的欧几里得距离
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {import("@minecraft/server").Vector3} b
   * @returns 距离
   */
  static distance(a, b) {
    return Math.sqrt(this.distanceSquared(a, b));
  }
  /**
   * 按距离比例计算两个v3的距离间某点坐标值
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a
   * @param {import("@minecraft/server").Vector3} b
   * @param {number} t 区间：0~1，表示从点a到点b的距离比例
   * @returns Vector3
   */
  static lerp(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  /**
   * 计算 Minecraft 局部坐标 ^x ^y ^z 的世界坐标
   * @static 静态方法
   * @param {import("@minecraft/server").Entity} entity - 实体对象
   * @param {number} leftRight - ^左/右 (正数=左，负数=右)
   * @param {number} upDown - ^上/下 (正数=上，负数=下)
   * @param {number} forwardBack - ^前/后 (正数=前，负数=后)
   * @param {boolean} onEyes - 是否以眼睛位置为基准，默认false（脚部）
   * @returns {import("@minecraft/server").Vector3} 世界坐标
   */
  static calculateLocalCoordinates(
    entity,
    leftRight = 0,
    upDown = 0,
    forwardBack = 0,
    onEyes = false
  ) {
    const viewDir = entity.getViewDirection();
    const fwdX = viewDir.x;
    const fwdY = viewDir.y;
    const fwdZ = viewDir.z;

    // 右侧向量 = normalize(cross(forward, up))
    // up = (0, 1, 0), 所以 right = (-fwdZ, 0, fwdX) / length
    const rightLenSq = fwdX * fwdX + fwdZ * fwdZ;

    let rightX, rightZ;
    if (rightLenSq < 1e-10) {
      // 视线垂直，用世界北向量 (0,0,1) 作为参考
      // 此时右方向为 (-1,0,0) 或 (1,0,0)，取决于坐标系，这里取 (1,0,0) 对应东
      rightX = 1;
      rightZ = 0;
    } else {
      const invRightLen = 1 / Math.sqrt(rightLenSq);
      rightX = -fwdZ * invRightLen;
      rightZ = fwdX * invRightLen;
    }

    // 上方向量 = cross(right, forward)
    // 由于 right.y = 0，可以简化计算
    const upX = -rightZ * fwdY;
    const upY = rightZ * fwdX - rightX * fwdZ;
    const upZ = rightX * fwdY;

    // 组合偏移（注意：leftRight 取反以匹配 Minecraft 的 ^ 坐标系）
    const negLeftRight = -leftRight;
    const entityLoc = onEyes ? entity.getHeadLocation() : entity.location;

    return {
      x: entityLoc.x + rightX * negLeftRight + upX * upDown + fwdX * forwardBack,
      y: entityLoc.y + upY * upDown + fwdY * forwardBack,
      z: entityLoc.z + rightZ * negLeftRight + upZ * upDown + fwdZ * forwardBack,
    };
  }

  /**
   * 计算实体面前指定距离的位置（简化版 ^^distance）
   * @static 静态方法
   * @param {import("@minecraft/server").Entity} entity - 实体对象
   * @param {number} distance - 前方距离（正数=向前，负数=向后），默认 1 格
   * @param {boolean} onEyes - 是否以眼睛位置为基准，默认false（脚部）
   * @returns {import("@minecraft/server").Vector3} 世界坐标
   * @example
   * // 获取实体面前 2 格的位置
   * const pos = Vector3.inFrontOfEntity(entity, 2);
   */
  static inFrontOfEntity(entity, distance = 1,onEyes = false) {
    const viewDir = entity.getViewDirection();
    const loc = onEyes ? entity.getHeadLocation() : entity.location;

    return {
      x: loc.x + viewDir.x * distance,
      y: loc.y + viewDir.y * distance,
      z: loc.z + viewDir.z * distance,
    };
  }

  /**
   * 检查坐标是否安全
   * @static 静态方法
   * @param {import("@minecraft/server").Dimension} dimension - 维度
   * @param {import("@minecraft/server").Vector3} pos - 坐标
   * @returns {boolean} 是否安全
   */
  static isSafe(dimension, pos) {
    let range = heightRangeCache.get(dimension);
    if (!range) {
      range = { min: dimension.heightRange.min, max: dimension.heightRange.max };
      heightRangeCache.set(dimension, range);
    }
    return pos.y >= range.min && pos.y <= range.max;
  }

  /**
   * 获取安全坐标
   * @static 静态方法
   * @param {import("@minecraft/server").Dimension} dimension - 维度
   * @param {import("@minecraft/server").Vector3} pos - 坐标
   * @returns {import("@minecraft/server").Vector3} 安全坐标
   */
  static getSafePos(dimension, pos) {
    return {
      x: pos.x,
      y: Math.max(dimension.heightRange.min, Math.min(dimension.heightRange.max, pos.y)),
      z: pos.z
    }
  }
}
