/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 事件信号类，用于管理事件的订阅、取消订阅和触发
 * @template T - 事件参数类型
 */
export class EventSignal {
  /** 
   * 存储所有订阅该事件的监听器函数集合
   * @private
   * @type {Set<Function>}
   */
  #listeners = new Set();
  /**
   * 订阅事件
   * @param {(arg: T) => void} callback - 事件监听器回调函数
   * @returns {(arg: T) => void} 返回传入的监听器函数
   */
  subscribe(callback) {
    this.#listeners.add(callback);
    return callback;
  }
  /**
   * 取消订阅事件
   * @param {(arg: T) => void} callback - 需要取消订阅的监听器函数
   */
  unsubscribe(callback) {
    this.#listeners.delete(callback);
  }
  /**
   * 触发事件
   * @param {T} arg - 传递给监听器的事件对象
   */
  trigger(arg) {
    this.#listeners.forEach(callback => callback(arg));
  }
}
