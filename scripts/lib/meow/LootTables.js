/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

export const itemIds = [
  "minecraft:cod",
  "minecraft:salmon",
  "minecraft:tropical_fish",
  "minecraft:pufferfish",

  "minecraft:leather_boots",
  "minecraft:leather",
  "minecraft:bone",
  "minecraft:potion",
  "minecraft:string",
  "minecraft:bowl",
  "minecraft:stick",
  "minecraft:ink_sac",
  "minecraft:cocoa_beans",
  "minecraft:tripwire_hook",
  "minecraft:rotten_flesh",

  "minecraft:bamboo",

  "minecraft:nautilus_shell",
  "minecraft:waterlily",
  "minecraft:name_tag",
  "minecraft:saddle",
  "minecraft:bow",
  "minecraft:fishing_rod",
  "minecraft:enchanted_book",
];

const itemIcon = {
  "minecraft:cod": "items/fish_raw",
  "minecraft:salmon": "items/fish_salmon_raw",
  "minecraft:tropical_fish": "items/fish_clownfish_raw",
  "minecraft:pufferfish": "items/fish_pufferfish_raw",

  "minecraft:potion": "items/potion_bottle_waterBreathing",
  "minecraft:ink_sac": "items/dye_powder_black",
  "minecraft:cocoa_beans": "items/dye_powder_brown",
  "minecraft:tripwire_hook": "blocks/trip_wire_source",

  "minecraft:nautilus_shell": "items/nautilus",
  "minecraft:waterlily": "blocks/carried_waterlily",
  "minecraft:bow": "items/bow_standby",
  "minecraft:fishing_rod": "items/fishing_rod_uncast",
  "minecraft:enchanted_book": "items/book_enchanted",
}

/**
 * 获取物品图标
 * @param {string} itemId 物品ID
 * @returns {string} 物品图标键值
 */
export function getItemIcon(itemId) {
  if (itemId in itemIcon) return itemIcon[itemId];
  return  "items/" + itemId.split(":")[1];
}
