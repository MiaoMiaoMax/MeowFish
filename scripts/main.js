/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { Settings } from "./SystemSettings.js";

// 根据设置动态导入相关模块
if (Settings.auto) {
  await import("./lib/index.js").then((meow) => {

    const LOOT_ITEMS = ["junk", "treasure", "fish"];
    const LOOT_WEIGHTS = [
      [100, 50, 850],
      [81, 71, 848],
      [61, 92, 847],
      [42, 113, 845]
    ];

    const AutoFish = new Set();
    const FishLoot = new Map();

    meow.Events.fishing.castRod.subscribe(event => {
      if (!event.player.isSneaking) return;
      AutoFish.add(event.player.id);
      event.player.sendMessage("[§3MeowFish§r -> §3你§r] 本次钓鱼已启用自动钓鱼")
    })

    meow.Events.fishing.beforeReelRod.subscribe(event => {
      if (!AutoFish.has(event.player.id)) return;
      AutoFish.delete(event.player.id);
      event.cancel = true;
      mc.system.run(() => event.hook.remove());
    })

    meow.Events.fishing.reelRod.subscribe(event => {
      AutoFish.delete(event.player.id);
    })

    meow.Events.fishing.hookHitEntity.subscribe(event => {
      AutoFish.delete(event.player.id);
    })

    mc.world.beforeEvents.playerLeave.subscribe(event => {
      AutoFish.delete(event.player.id);
    })

    meow.Events.fishing.fishBite.subscribe(event => {
      const player = event.player;
      if (!AutoFish.has(player.id)) return;
      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable.getEquipment(mc.EquipmentSlot.Mainhand);
      if (!item || item.typeId !== "minecraft:fishing_rod") return;
      const durability = item.getComponent("minecraft:durability");
      if (!durability || durability.damage >= durability.maxDurability) {
        return player.sendMessage("[§3MeowHouseModule§r -> §3你§r] 钓鱼竿没有耐久啦");
      }
      const enchant = item.getComponent("minecraft:enchantable");
      const luck_of_the_sea = enchant?.getEnchantment("luck_of_the_sea")?.level ?? 0;
      const unbreaking = enchant?.getEnchantment("unbreaking")?.level ?? 0;
      const mending = enchant?.getEnchantment("mending")?.level ?? 0;
      const type = meow.weightedLottery(LOOT_ITEMS, LOOT_WEIGHTS[luck_of_the_sea], 1000);
      let xp = meow.getRndInteger(1, type === "fish" ? 4 : type === "junk" ? 2 : 6);
      if (mending) {
        const damage = durability.damage - xp * 2;
        xp = Math.min(0, damage / 2) * -1;
        durability.damage = Math.max(0, damage);
      } else if (meow.consumeDurability(unbreaking)) {
        durability.damage += 1;
      }
      meow.runCommand(player, `title @s actionbar 获得§b${xp}经验§r, 钓鱼竿耐久: ${durability.maxDurability - durability.damage}/${durability.maxDurability}`)
      mc.system.runTimeout(() => equippable.setEquipment(mc.EquipmentSlot.Mainhand, item), 1);
      player.addExperience(xp);
      meow.runCommand(player, `particle minecraft:crop_growth_emitter ${event.hook.location.x} ${event.hook.location.y} ${event.hook.location.z}`);
      const loc = meow.Vector3.floor(event.hook.location);
      meow.runCommand(player, `loot spawn ${loc.x} ${loc.y} ${loc.z} loot "gameplay/fishing/${type}"`);
      FishLoot.set(player, { lootLoc: loc, hookLoc: meow.Vector3.add(event.hook.location, 0, 0.5, 0), time: Date.now() });
      meow.runCommand(player, "playsound random.orb @a ^^^1 0.3");
    })

    mc.world.afterEvents.entitySpawn.subscribe(event => {
      FishLoot.forEach(({ lootLoc, hookLoc, time }, player) => {
        if (event.entity.typeId !== "minecraft:item" || meow.Vector3.distance(event.entity.location, lootLoc) > 0.1 || Date.now() - time > 1000) return;
        event.entity.teleport(hookLoc);
        const direction = meow.Vector3.subtract(player.location, event.entity.location);
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        const impulse = {
          x: direction.x / length * 1.3,
          y: direction.y / length * 2 + 0.2,
          z: direction.z / length * 1.3
        };
        event.entity.applyImpulse(impulse);
      })
    })

  });
}