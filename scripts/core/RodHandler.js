/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/**
 * 判断是否应该保护钓鱼竿（耐久接近耗尽且无经验修补）
 * @param {import("@minecraft/server").ItemDurabilityComponent} durability
 * @param {number} mendingLevel
 * @returns {boolean}
 */
export function shouldProtectRod(durability, mendingLevel) {
  if (!durability) return false;
  return durability.damage >= (durability.maxDurability - 1) && mendingLevel < 1;
}

/**
 * 在玩家背包中搜索可用钓鱼竿
 * @param {import("@minecraft/server").Player} player
 * @param {number} selectedSlotIndex
 * @param {boolean} isProtect - 是否开启保护模式
 * @param {Set<number>} [excludeSlots] - 本次结算已经占用的槽位
 */
export function replaceFishingRod(
  player,
  selectedSlotIndex,
  isProtect,
  excludeSlots = null,
) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return false;

  for (let slot = 0; slot < inventory.size; slot++) {
    if (slot === selectedSlotIndex) continue;
    if (excludeSlots?.has(slot)) continue;

    const item = inventory.getItem(slot);
    if (!item || item.typeId !== "minecraft:fishing_rod") continue;
    // 已损坏或锁定在背包/槽位的竿不再参与替换，避免把不可用物品换到手上
    if (item.lockMode && item.lockMode !== "none") continue;

    const newDurability = item.getComponent("minecraft:durability");
    if (
      newDurability &&
      newDurability.damage >= newDurability.maxDurability
    )
      continue;

    const newEnchant = item.getComponent("minecraft:enchantable");
    const mendingLevel = newEnchant?.getEnchantment("mending")?.level ?? 0;

    if (isProtect && shouldProtectRod(newDurability, mendingLevel)) continue;

    return { item, slot };
  }
  return false;
}

/**
 * 获取鱼竿的完整信息对象。
 * luck 与 unbreaking 都做有限性检查，避免 NaN / 非数字传播到权重计算。
 * @param {import("@minecraft/server").ItemStack} item
 */
export function getRodInfo(item) {
  const durability = item.getComponent("minecraft:durability");
  const enchant = item.getComponent("minecraft:enchantable");

  const rawMending = enchant?.getEnchantment("mending")?.level;
  const rawLuck = enchant?.getEnchantment("luck_of_the_sea")?.level;
  const rawUnbreaking = enchant?.getEnchantment("unbreaking")?.level;

  const mending = typeof rawMending === "number" && Number.isFinite(rawMending) ? rawMending : 0;
  const luckLevel = typeof rawLuck === "number" && Number.isFinite(rawLuck) ? rawLuck : 0;
  const luck = Math.max(0, luckLevel);
  const unbreaking = typeof rawUnbreaking === "number" && Number.isFinite(rawUnbreaking) ? rawUnbreaking : 0;
  const maxDur = durability?.maxDurability ?? 0;

  return { durability, mending, luck, unbreaking, maxDur };
}
