/*
 * 本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。
 * https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans
 */

import * as mc from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Settings } from "./SystemSettings";

// =============== 第一部分：测试钓鱼竿生成 ===============
mc.system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== "meow:t" || !event.sourceEntity) return;

  const { dimension, location } = event.sourceEntity;
  const createRod = (nameTag, enchantments = [], damageOffset = 0) => {
    const item = new mc.ItemStack("minecraft:fishing_rod");
    item.nameTag = nameTag;

    const durability = item.getComponent("minecraft:durability");
    if (durability) durability.damage = durability.maxDurability - damageOffset;

    const enchant = item.getComponent("minecraft:enchantable");
    if (enchant) {
      enchant.removeAllEnchantments();
      for (const { type, level } of enchantments) {
        enchant.addEnchantment({ type: mc.EnchantmentTypes.get(type), level });
      }
    }

    dimension.spawnItem(item, location);
  };

  // 生成四把测试钓鱼竿
  createRod("低耐久1", [{ type: "lure", level: 3 }], 3);
  createRod("低耐久2", [{ type: "lure", level: 3 }], 3);
  createRod("低耐久3-经验修补", [
    { type: "lure", level: 3 },
    { type: "mending", level: 1 }
  ], 3);
  createRod("低耐久4-耐久3", [
    { type: "lure", level: 3 },
    { type: "unbreaking", level: 3 }
  ], 5);
});

// =============== 第二部分：自动钓鱼系统（按需加载） ===============
if (Settings.auto) {
  await import("./lib/index").then(meow => {
    const LOOT_ITEMS = ["junk", "treasure", "fish"];
    const LOOT_WEIGHTS = [
      [100, 50, 850],
      [81, 71, 848],
      [61, 92, 847],
      [42, 113, 845],
    ];

    const AutoFish = new Set(); // 正在自动钓鱼的玩家 ID 集合
    const FishLoot = new Map(); // 记录战利品位置信息
    const SettingPlayer = new Set(); // 防止设置界面重复打开

    // —————— 工具函数 ——————

    const isCreative = player => player.getGameMode() === mc.GameMode.creative;

    const shouldProtectRod = (durability, mendingLevel) =>
      durability?.damage >= (durability.maxDurability - 1) && mendingLevel < 1;

    const handleMending = (xp, durability) => {
      const repairAmount = Math.min(xp, Math.floor(durability.damage / 2));
      durability.damage -= repairAmount * 2;
      return xp - repairAmount;
    };

    const showXpMessage = (player, lang, xp, suffix = "") => {
      meow.runCommand(
        player,
        `title @s actionbar ${meow.getLocalizedText("gain_xp", lang, { xp })}${suffix}`
      );
    };

    // —————— 钓鱼竿替换逻辑 ——————

    const replaceFishingRod = (player, oldItem) => {
      if (isCreative(player)) return true;

      const inventory = player.getComponent("minecraft:inventory")?.container;
      if (!inventory) return false;

      const protect = player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);

      for (let i = 0; i < inventory.size; i++) {
        if (i === player.selectedSlotIndex) continue;

        const newItem = inventory.getItem(i);
        if (!newItem || newItem.typeId !== "minecraft:fishing_rod") continue;

        const newDurability = newItem.getComponent("minecraft:durability");
        const newEnchant = newItem.getComponent("minecraft:enchantable");
        const mendingLevel = newEnchant?.getEnchantment("mending")?.level ?? 0;

        if (protect && shouldProtectRod(newDurability, mendingLevel)) continue;

        if (!protect) oldItem = undefined;
        inventory.setItem(i, oldItem);
        mc.system.runTimeout(() => {
          inventory.setItem(player.selectedSlotIndex, newItem);
        }, 1);
        return true;
      }
      return false;
    };

    // —————— 事件监听 ——————

    meow.Events.fishing.castRod.subscribe(event => {
      if (!event.player.isSneaking) return;
      AutoFish.add(event.player.id);
      const lang = event.player.getDynamicProperty("meow_language");
      event.player.sendMessage(meow.getLocalizedText("auto_fish", lang));
    });

    meow.Events.fishing.beforeReelRod.subscribe(event => {
      if (!AutoFish.has(event.player.id)) return;
      AutoFish.delete(event.player.id);
      event.cancel = true;
      mc.system.run(() => event.hook?.remove());
    });

    [meow.Events.fishing.reelRod, meow.Events.fishing.hookHitEntity].forEach(evt =>
      evt.subscribe(e => AutoFish.delete(e.player.id))
    );

    mc.world.beforeEvents.playerLeave.subscribe(e => AutoFish.delete(e.playerId));

    // —————— 核心：鱼咬钩处理 ——————

    meow.Events.fishing.fishBite.subscribe(event => {
      const player = event.player;
      if (!AutoFish.has(player.id)) return;

      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable?.getEquipment(mc.EquipmentSlot.Mainhand);
      if (!item || item.typeId !== "minecraft:fishing_rod") return;

      const lang = player.getDynamicProperty("meow_language") ?? "zh_CN";
      const protect = player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);
      const replace = player.getDynamicProperty("meow_replace") ?? Boolean(Settings.replace);
      const isInCreative = isCreative(player);

      const durability = item.getComponent("minecraft:durability");
      const enchant = item.getComponent("minecraft:enchantable");
      const mending = enchant?.getEnchantment("mending")?.level ?? 0;
      const luck = enchant?.getEnchantment("luck_of_the_sea")?.level ?? 0;
      const unbreaking = enchant?.getEnchantment("unbreaking")?.level ?? 0;

      // 耐久保护检查（仅生存模式）
      if (protect && !isInCreative && shouldProtectRod(durability, mending)) {
        return player.sendMessage(meow.getLocalizedText("rod_durability_warning", lang));
      }

      // 决定战利品类型
      const lootType = meow.weightedLottery(LOOT_ITEMS, LOOT_WEIGHTS[luck] ?? LOOT_WEIGHTS[0], 1000);
      let xp = meow.getRndInteger(1, lootType === "fish" ? 4 : lootType === "junk" ? 2 : 6);

      // 耐久/经验处理（仅生存模式）
      if (!isInCreative) {
        if (mending > 0) {
          xp = handleMending(xp, durability);
        } else if (meow.consumeDurability(unbreaking)) {
          durability.damage += 1;
        }
      }

      const maxDur = durability?.maxDurability ?? 0;
      const currentDur = maxDur - (durability?.damage ?? 0);

      // 钓鱼竿是否已损坏？
      const isBroken = durability?.damage >= maxDur;

      let messageSuffix = "";
      let needReplace = false;
      let yesReplace = false;

      if (isInCreative) {
        messageSuffix = meow.getLocalizedText("creative_mode", lang);
      } else if (isBroken) {
        needReplace = replace;
        messageSuffix = replace
          ? meow.getLocalizedText("rod_replaced_successfully", lang)
          : meow.getLocalizedText("rod_destroyed", lang);
      } else {
        if (replace && currentDur <= 1) {
          needReplace = true;
          messageSuffix = meow.getLocalizedText("rod_replaced_successfully", lang);
        } else if (replace && currentDur <= 3) {
          messageSuffix = meow.getLocalizedText("rod_about_to_replace", lang, { current: currentDur, max: maxDur });
          meow.runCommand(player, "playsound dig.bone_block @a ^^^1 0.8");
        } else {
          messageSuffix = meow.getLocalizedText("rod_durability_info", lang, { current: currentDur, max: maxDur });
        }
      }

      // 执行替换或更新主手装备
      if (needReplace) {
        if (!replaceFishingRod(player, item)) {
          messageSuffix = meow.getLocalizedText("rod_replaced_failed", lang);
          mc.system.runTimeout(() => equippable.setEquipment(mc.EquipmentSlot.Mainhand), 1);
        } else yesReplace = true;
      } else if (!isInCreative) {
        mc.system.runTimeout(() => {
          if (isBroken) {
            // 钓鱼竿已损坏，清空手持装备
            equippable.setEquipment(mc.EquipmentSlot.Mainhand);
          } else {
            // 钓鱼竿未损坏，更新手持装备耐久值
            equippable.setEquipment(mc.EquipmentSlot.Mainhand, item);
          }
        }, 1);
      }

      // 显示经验与状态
      showXpMessage(player, lang, xp, messageSuffix);

      // 声音与粒子
      meow.runCommand(player, "playsound random.orb @a ^^^1 0.3");
      if (isBroken) {
        if (yesReplace) meow.runCommand(player, "playsound mob.villager.yes @a ^^^1 0.8");
        else meow.runCommand(player, "playsound random.break @a ^^^1 0.8");
      }

      // 经验与战利品
      player.addExperience(xp);
      const loc = meow.Vector3.floor(event.hook.location);
      meow.runCommand(player, `loot spawn ${loc.x} ${loc.y} ${loc.z} loot "gameplay/fishing/${lootType}"`);

      // 记录战利品位置用于吸附
      FishLoot.set(player.id, {
        lootLoc: loc,
        hookLoc: meow.Vector3.add(event.hook.location, 0, 0.5, 0),
        time: Date.now(),
      });

      meow.runCommand(
        player,
        `particle minecraft:crop_growth_emitter ${event.hook.location.x} ${event.hook.location.y} ${event.hook.location.z}`
      );
    });

    // —————— 战利品吸附逻辑 ——————

    mc.world.afterEvents.entitySpawn.subscribe(event => {
      if (event.entity.typeId !== "minecraft:item") return;

      FishLoot.forEach(({ lootLoc, hookLoc, time }, playerId) => {
        if (Date.now() - time > 2000) return FishLoot.delete(playerId);
        const player = mc.world.getEntity(playerId);
        if (!player || Date.now() - time > 1000) return;

        const dist = meow.Vector3.distance(event.entity.location, lootLoc);
        if (dist > 0.1) return;

        event.entity.teleport(hookLoc);
        const dir = meow.Vector3.subtract(player.location, event.entity.location);
        const len = Math.sqrt(dir.x**2 + dir.y**2 + dir.z**2) || 1;
        event.entity.applyImpulse({
          x: (dir.x / len) * 1.3,
          y: (dir.y / len) * 2 + 0.2,
          z: (dir.z / len) * 1.3,
        });
      });
    });

    // —————— 设置界面 ——————

    mc.world.beforeEvents.itemUse.subscribe(event => {
      const { itemStack, source: player } = event;
      if (
        itemStack.typeId !== "minecraft:paper" ||
        !["MF设置", "MF設置", "MFSetting"].includes(itemStack.nameTag)
      ) return;

      event.cancel = true;
      if (SettingPlayer.has(player.id)) return;

      SettingPlayer.add(player.id);
      mc.system.runTimeout(() => SettingPlayer.delete(player.id), 10);

      const lang = player.getDynamicProperty("meow_language");
      const langOptions = [undefined, "zh_CN", "zh_TW", "en_US"];
      const langIndex = langOptions.findIndex(l => l === lang);

      const protect = player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);
      const replace = player.getDynamicProperty("meow_replace") ?? Boolean(Settings.replace);

      mc.system.run(() => new ModalFormData()
        .title(meow.getLocalizedText("setting_title", lang))
        .dropdown(meow.getLocalizedText("setting_language", lang), ["默认 Default", "简体中文", "繁體中文", "English"], langIndex)
        .toggle(meow.getLocalizedText("setting_protect", lang), protect)
        .toggle(meow.getLocalizedText("setting_replace", lang), replace)
        .show(player)
        .then(result => {
          if (result.canceled) return;
          player.setDynamicProperty("meow_language", langOptions[result.formValues[0]]);
          player.setDynamicProperty("meow_protect", result.formValues[1]);
          player.setDynamicProperty("meow_replace", result.formValues[2]);
        })
      )
    });
  }).catch(err => {
    console.error("[MeowFish] Failed to load lib:", err);
  });
}