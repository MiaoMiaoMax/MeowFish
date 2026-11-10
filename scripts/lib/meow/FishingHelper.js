/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { FishingConfig } from "./FishingConfig.js";
import { Perf } from "./Perf.js";
import { Vector3 } from "./Vector3.js";

/**
 * 检查是否为含水方块
 * @param {import("@minecraft/server").Block} block
 * @param {number} offsetX
 * @param {number} offsetZ
 * @returns {boolean}
 */
function besideWaterStatus(block, offsetX, offsetZ) {
  Perf.block();
  const beside = block.offset({ x: offsetX, y: 0, z: offsetZ });
  if (!beside) return false;
  const besideId = beside.typeId;
  return (
    besideId === "minecraft:water" ||
    besideId === "minecraft:flowing_water" ||
    beside.isWaterlogged
  );
}

/**
 * 检查浮漂是否在水面上或在水中
 * 需要传入：漂浮所在维度，浮漂坐标
 * @param {import("@minecraft/server").Dimension} dimension - 维度
 * @param {import("@minecraft/server").Vector3} pos - 坐标
 */
export function checkHookWaterStatus(dimension, pos) {
  if (!Vector3.isSafe(dimension, pos)) {
    return { isOnWater: false, isInWater: false, isBesideWater: false };
  }
  Perf.block();
  const block = dimension.getBlock(pos);
  if (!block) {
    return { isOnWater: false, isInWater: false, isBesideWater: false };
  }
  const blockId = block.typeId;

  if (
    blockId === "minecraft:water" ||
    blockId === "minecraft:flowing_water" ||
    block.isWaterlogged
  ) {
    // 判断浮漂状态：上方为水则完全浸没，否则视为浮在水面
    Perf.block();
    const aboveBlock = block.above(1);
    if (!aboveBlock)
      return { isOnWater: true, isInWater: false, isBesideWater: false };
    const aboveBlockId = aboveBlock.typeId;
    if (
      aboveBlockId === "minecraft:water" ||
      aboveBlockId === "minecraft:flowing_water" ||
      aboveBlock.isWaterlogged
    ) {
      return { isOnWater: false, isInWater: true, isBesideWater: false };
    }
    return { isOnWater: true, isInWater: false, isBesideWater: false };
  }

  if (!FishingConfig.ENABLE_BESIDE_WATER_MODE) {
    return { isOnWater: false, isInWater: false, isBesideWater: false };
  }

  const center = block.center();
  if (pos.x > center.x && besideWaterStatus(block, 1, 0)) {
    // 东
    return { isOnWater: true, isInWater: false, isBesideWater: true };
  }
  if (pos.x < center.x && besideWaterStatus(block, -1, 0)) {
    // 西
    return { isOnWater: true, isInWater: false, isBesideWater: true };
  }
  if (pos.z > center.z && besideWaterStatus(block, 0, 1)) {
    // 南
    return { isOnWater: true, isInWater: false, isBesideWater: true };
  }
  if (pos.z < center.z && besideWaterStatus(block, 0, -1)) {
    // 北
    return { isOnWater: true, isInWater: false, isBesideWater: true };
  }

  return { isOnWater: false, isInWater: false, isBesideWater: false };
}