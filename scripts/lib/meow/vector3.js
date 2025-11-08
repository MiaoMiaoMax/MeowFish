/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

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
   * 相加
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v3a 
   * @param {number|Vector3} x 可以是v3b，也可以是与v3a x相加的数值
   * @param {?number} y 与v3a y相加的数值，当x是v3b时将忽略此项
   * @param {?number} z 与v3a z相加的数值，当x是v3b时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static add(v3a, x, y, z) {
    if (typeof x === 'number') {
      if (typeof y === 'number' && typeof z === 'number') {
        return ({
          x: v3a.x + x,
          y: v3a.y + y,
          z: v3a.z + z
        })
      }
      return ({
          x: v3a.x + x,
          y: v3a.y + x,
          z: v3a.z + x
        })
    }
    return this.add(v3a, x.x, x.y, x.z);
  }
  /**
   * 相减
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v3a 被减向量
   * @param {number|Vector3} x 可以是减向量，也可以是与v3a x相减的数值
   * @param {?number} y 与v3a y相减的数值，当x是减向量时将忽略此项
   * @param {?number} z 与v3a z相减的数值，当x是减向量时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static subtract(v3a, x, y, z) {
    if (typeof x === 'number') {
      if (typeof y === 'number' && typeof z === 'number') {
        return ({
          x: v3a.x - x,
          y: v3a.y - y,
          z: v3a.z - z
        })
      }
      return ({
        x: v3a.x - x,
        y: v3a.y - x,
        z: v3a.z - x
      })
      
    }
    return this.subtract(v3a, x.x, x.y, x.z);
  }
  /**
   * 相乘
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} v3a 
   * @param {number|Vector3} x 可以是v3b，也可以是与v3a x相乘的数值
   * @param {?number} y 与v3a y相乘的数值，当x是v3b时将忽略此项
   * @param {?number} z 与v3a z相乘的数值，当x是v3b时将忽略此项
   * @returns {import("@minecraft/server").Vector3}
   */
  static scl(v3a, x, y, z) {
    if (typeof x === 'number') {
      if (typeof y === 'number' && typeof z === 'number') {
        return ({
          x: v3a.x * x,
          y: v3a.y * y,
          z: v3a.z * z
        })
      }
      return ({
        x: v3a.x * x,
        y: v3a.y * x,
        z: v3a.z * x
      })
      
    }
    return this.scl(v3a, x.x, x.y, x.z);
  }
  /**
   * 计算两个v3的距离
   * @static 静态方法
   * @param {import("@minecraft/server").Vector3} a 
   * @param {import("@minecraft/server").Vector3} b 
   * @returns 距离
   */
  static distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
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
    }
  }
}