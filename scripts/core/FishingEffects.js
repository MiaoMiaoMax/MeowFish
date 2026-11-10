/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as meow from "../lib/index.js";

/* ------------------------------ 物理效果 --------------------------------- */

/**
 * 让刚生成的物品飞向玩家。
 * @param {mc.Entity} itemEntity
 * @param {mc.Vector3} playerLoc
 * @param {mc.Vector3} itemLoc
 */
export function makeItemFlyToPlayer(itemEntity, playerLoc, itemLoc) {
  const playerPos = meow.Vector3.add(playerLoc, 0, 1, 0);
  const distSq = meow.Vector3.distanceSquared(playerPos, itemLoc);
  if (distSq < 4) return;

  const dx = playerPos.x - itemLoc.x;
  const dy = playerPos.y - itemLoc.y;
  const dz = playerPos.z - itemLoc.z;
  const speedFactor = 0.1;
  const extraY = Math.pow(distSq, 0.25) * 0.08;

  try {
    itemEntity.applyImpulse({
      x: dx * speedFactor,
      y: dy * speedFactor + extraY,
      z: dz * speedFactor,
    });
  } catch (_) {}
}

/* ------------------------------ 粒子 ------------------------------------- */

export function playFancyParticles(player, rolledLoot, maxRarity, hookLoc, volume) {
  const dimension = player.dimension;

  if (maxRarity < 4) {
    meow.spawnParticle(
      dimension,
      "minecraft:crop_growth_emitter",
      meow.Vector3.add(hookLoc, 0, 0.2, 0),
    );
    return;
  }

  let bestEnchantCount = 0;
  let bestLoot = null;
  for (const loot of rolledLoot) {
    if (loot.enchantCount > bestEnchantCount) {
      bestEnchantCount = loot.enchantCount;
      bestLoot = loot;
    }
  }

  if (bestEnchantCount === 0 || !bestLoot) {
    meow.spawnParticle(
      dimension,
      "minecraft:crop_growth_emitter",
      meow.Vector3.add(hookLoc, 0, 0.2, 0),
    );
    return;
  }

  meow.playSoundInFrontOfPlayer(player, "trial_spawner.eject_item", volume * 0.5);

  const enchantable = bestLoot.item.getComponent("minecraft:enchantable");
  const threshold = enchantable?.hasEnchantment("vanishing") ? 3 : 2;
  if (bestEnchantCount > threshold) {
    meow.spawnParticle(
      dimension,
      "minecraft:trial_spawner_detection",
      meow.Vector3.subtract(hookLoc, 0.5, 2, 0.5),
    );
    meow.playSoundInFrontOfPlayer(player, "chime.amethyst_block", volume);
    if (bestEnchantCount > 4) {
      meow.playSoundInFrontOfPlayer(player, "trial_spawner.detect_player", volume * 0.5);
      meow.spawnParticle(
        dimension,
        "minecraft:totem_particle",
        meow.Vector3.add(hookLoc, 0, 0.2, 0),
      );
      meow.spawnParticle(
        dimension,
        "minecraft:lava_particle",
        meow.Vector3.add(hookLoc, 0, 0.3, 0),
      );
      meow.spawnParticle(
        dimension,
        "minecraft:lava_particle",
        meow.Vector3.add(hookLoc, 0, 0.3, 0),
      );
      meow.spawnParticle(
        dimension,
        "minecraft:lava_particle",
        meow.Vector3.add(hookLoc, 0, 0.3, 0),
      );
    }
  } else {
    meow.spawnParticle(
      dimension,
      "minecraft:trial_spawner_detection_ominous",
      meow.Vector3.subtract(hookLoc, 0.5, 2, 0.5),
    );
  }
}
