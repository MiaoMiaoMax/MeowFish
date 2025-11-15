/*
    本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
    https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

    This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
    http://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Settings } from "./SystemSettings";

// mc.system.afterEvents.scriptEventReceive.subscribe(event => {
//   if (event.id !== "meow:t" || !event.sourceEntity) return;

//   const { dimension, location } = event.sourceEntity;
//   const createRod = (nameTag, enchantments = [], damageOffset = 0) => {
//     const item = new mc.ItemStack("minecraft:fishing_rod");
//     item.nameTag = nameTag;

//     const durability = item.getComponent("minecraft:durability");
//     if (durability) durability.damage = durability.maxDurability - damageOffset;

//     const enchant = item.getComponent("minecraft:enchantable");
//     if (enchant) {
//       enchant.removeAllEnchantments();
//       for (const { type, level } of enchantments) {
//         enchant.addEnchantment({ type: mc.EnchantmentTypes.get(type), level });
//       }
//     }

//     dimension.spawnItem(item, location);
//   };

//   // 生成四把测试钓鱼竿
//   createRod("低耐久1", [{ type: "lure", level: 3 }], 3);
//   createRod("低耐久2", [{ type: "lure", level: 3 }], 3);
//   createRod("低耐久3-经验修补", [
//     { type: "lure", level: 3 },
//     { type: "mending", level: 1 }
//   ], 3);
//   createRod("低耐久4-耐久3", [
//     { type: "lure", level: 3 },
//     { type: "unbreaking", level: 3 }
//   ], 5);
//   createRod("快满耐久5-经验修补", [
//     { type: "lure", level: 3 },
//     { type: "mending", level: 1 }
//   ], 383)
// });

if (Settings.auto) {
  await import("./lib/index").then(meow => {

    if (!meow.language.includes(Settings.language)) {
      meow.error(
        "Unexpected value for default language:",
        Settings.language,
        ", Using English as the default language. (默认语言设置了意外值:",
        Settings.language,
        "，将使用英文作为默认语言)"
      );
      Settings.language = "en_US";
    }

    const LOOT_ITEMS = ["junk", "treasure", "fish"];
    const LOOT_ITEMS_JUNGLE = ["jungle_junk", "treasure", "jungle_fish"];
    const LOOT_WEIGHTS = [
      [100, 50, 850],
      [81, 71, 848],
      [61, 92, 847],
      [42, 113, 845],
    ];

    const AutoFish = new Set(); // 正在自动钓鱼的玩家 ID 集合
    const HookTp = new Map();
    const FishLoot = new Map(); // 记录战利品位置信息
    const SettingPlayer = new Set(); // 防止设置界面重复打开

    // —————— 工具函数 ——————

    const isCreative = player => player.getGameMode() === mc.GameMode.creative;

    const shouldProtectRod = (durability, mendingLevel) =>
      durability.damage >= (durability.maxDurability - 1) && mendingLevel < 1;

    const handleMending = (xp, durability) => {
      const damage = durability.damage - xp * 2;
      durability.damage = Math.max(0, damage);
      return (Math.floor(Math.min(0, damage / 2)) * -1);
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
      const compulsoryAuto = event.player.getDynamicProperty("meow_compulsoryAuto") ?? Boolean(Settings.compulsory_auto);
      if (!compulsoryAuto && !event.player.isSneaking) return;
      AutoFish.add(event.player.id);
      const lang = event.player.getDynamicProperty("meow_language");
      event.player.sendMessage(meow.getLocalizedText("auto_fish", lang));
    });

    meow.Events.fishing.hookOnWaterSurfaceChange.subscribe(event => {
      if (!AutoFish.has(event.player.id) || event.isOnWater) return;
      if (HookTp.has(event.player.id)) {
        mc.system.clearRun(HookTp.get(event.player.id));
        HookTp.delete(event.player.id);
      }
    })

    meow.Events.fishing.beforeReelRod.subscribe(event => {
      if (!AutoFish.has(event.player.id)) return;
      AutoFish.delete(event.player.id);
      if (HookTp.has(event.player.id)) {
        mc.system.clearRun(HookTp.get(event.player.id));
        HookTp.delete(event.player.id);
      }
      event.cancel = true;
      mc.system.run(() => event.hook?.remove());
    });

    [
      meow.Events.fishing.reelRod,
      meow.Events.fishing.hookHitEntity,
      mc.world.beforeEvents.playerLeave
    ].forEach(evt =>
      evt.subscribe(e => AutoFish.delete(e.player.id))
    );

    // —————— 核心：鱼咬钩处理 ——————

    meow.Events.fishing.fishBite.subscribe(event => {
      const player = event.player;
      if (!AutoFish.has(player.id)) return;

      const equippable = player.getComponent("minecraft:equippable");
      const item = equippable?.getEquipment(mc.EquipmentSlot.Mainhand);
      if (!item || item.typeId !== "minecraft:fishing_rod") return;

      const lang = player.getDynamicProperty("meow_language") ?? Settings.language;
      const protect = player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);
      const replace = player.getDynamicProperty("meow_replace") ?? Boolean(Settings.replace);
      const reduceSinking = player.getDynamicProperty("meow_reduceSinking") ?? Boolean(Settings.reduce_sinking);
      const jungleLoot = player.getDynamicProperty("meow_jungleLoot") ?? false;
      const isInCreative = isCreative(player);

      const durability = item.getComponent("minecraft:durability");
      if (!durability) return meow.error("Failed to get fishing rod durability (无法获取鱼竿耐久)");
      const enchant = item.getComponent("minecraft:enchantable");
      const mending = enchant?.getEnchantment("mending")?.level ?? 0;
      const luck = enchant?.getEnchantment("luck_of_the_sea")?.level ?? 0;
      const unbreaking = enchant?.getEnchantment("unbreaking")?.level ?? 0;

      // 耐久保护检查（仅生存模式）
      if (protect && !isInCreative && shouldProtectRod(durability, mending)) {
        return player.sendMessage(meow.getLocalizedText("rod_durability_warning", lang));
      }

      if (reduceSinking) {
        // 减少鱼钩下沉
        const locH = meow.Vector3.copy(event.hook.location);
        const r = mc.system.runInterval(() => {
          event.hook.teleport(locH);
          event.hook.clearVelocity();
        }, 1);
        HookTp.set(player.id, r);
        mc.system.runTimeout(() => {
          if (!HookTp.has(player?.id)) return;
          HookTp.delete(player?.id);
          mc.system.clearRun(r);
        }, 20);
      }

      // 决定战利品类型
      const lootType = meow.weightedLottery(
        Settings.allow_jungle_loot && jungleLoot
          ? LOOT_ITEMS_JUNGLE
          : LOOT_ITEMS,
        LOOT_WEIGHTS[luck] ?? LOOT_WEIGHTS[0],
        1000
      );
      let xp = meow.getRndInteger(1, lootType === "fish" ? 4 : lootType === "junk" ? 2 : 6);

      // 耐久/经验处理（仅生存模式）
      if (!isInCreative) {
        if (mending > 0) {
          xp = handleMending(xp, durability);
        } else if (meow.consumeDurability(unbreaking)) {
          durability.damage += 1;
        }
      }

      const maxDur = durability.maxDurability;
      const currentDur = maxDur - durability.damage;

      // 钓鱼竿是否已损坏？
      const isBroken = durability.damage >= maxDur;

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
          meow.runCommand(player, "playsound dig.bone_block @a ^^^1 1.2");
        } else if (currentDur <= 3) {
          messageSuffix = meow.getLocalizedText("rod_about_to_warning", lang, { current: currentDur, max: maxDur });
          meow.runCommand(player, "playsound dig.bone_block @a ^^^1 1.2");
        } else {
          messageSuffix = meow.getLocalizedText("rod_durability_info", lang, { current: currentDur, max: maxDur });
        }
      }

      // 执行替换或更新主手装备
      if (needReplace) {
        if (!replaceFishingRod(player, item)) {
          messageSuffix = meow.getLocalizedText("rod_replaced_failed", lang);
          if (protect) mc.system.runTimeout(() => equippable.setEquipment(mc.EquipmentSlot.Mainhand, item), 1);
          else mc.system.runTimeout(() => equippable.setEquipment(mc.EquipmentSlot.Mainhand), 1);
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
      if (yesReplace) meow.runCommand(player, "playsound mob.villager.yes @a ^^^1 0.7");
      else if (replace && needReplace) {
        if (isBroken) meow.runCommand(player, "playsound random.break @a ^^^1 0.7");
        meow.runCommand(player, "playsound mob.villager.no @a ^^^1 0.7");
      }
      else if (isBroken) meow.runCommand(player, "playsound random.break @a ^^^1 0.7");

      meow.runCommand(player, "playsound random.orb @a ^^^1 0.2 0.5");
      // 经验与战利品
      player.addExperience(xp);
      const locL = meow.Vector3.floor(event.hook.location);
      meow.runCommand(player, `loot spawn ${locL.x} ${locL.y} ${locL.z} loot "gameplay/fishing/${lootType}"`);

      // 记录战利品位置用于吸附
      FishLoot.set(player.id, {
        lootLoc: locL,
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
          y: (dir.y / len) * 2 + 0.3,
          z: (dir.z / len) * 1.3,
        });
        FishLoot.delete(playerId);
      });
    });

    // —————— 设置界面 ——————

    mc.world.beforeEvents.itemUse.subscribe(event => {
      const { itemStack, source: player } = event;
      if (
        itemStack.typeId !== "minecraft:paper" ||
        !["MF设置", "MF設置", "MFSetting"].includes(itemStack.nameTag)
      )
        return;

      event.cancel = true;
      if (SettingPlayer.has(player.id)) return;

      SettingPlayer.add(player.id);
      mc.system.runTimeout(() => SettingPlayer.delete(player.id), 10);

      const lang = player.getDynamicProperty("meow_language");
      const langOptions = [undefined, "zh_CN", "zh_TW", "en_US"];
      const langIndex = langOptions.findIndex(l => l === lang);

      const protect =
        player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);
      const replace =
        player.getDynamicProperty("meow_replace") ?? Boolean(Settings.replace);
      const compulsoryAuto =
        player.getDynamicProperty("meow_compulsoryAuto") ??
        Boolean(Settings.compulsory_auto);
      const reduceSinking =
        player.getDynamicProperty("meow_reduceSinking") ??
        Boolean(Settings.reduce_sinking);
      const jungleLoot = player.getDynamicProperty("meow_jungleLoot") ?? false;
      const tip =
        player.getDynamicProperty("meow_tip") ?? Boolean(Settings.tip);

      mc.system.run(() => {
        const form = new ModalFormData()
          .title(meow.getLocalizedText("setting_title", lang))
          .dropdown(
            meow.getLocalizedText("setting_language", lang),
            [
              "默认 Default: " +
                meow.getLocalizedText("lang", Settings.language),
              "简体中文",
              "繁體中文",
              "English",
            ],
            langIndex
          )
          .toggle(meow.getLocalizedText("setting_protect", lang), protect)
          .toggle(meow.getLocalizedText("setting_replace", lang), replace)
          .toggle(
            meow.getLocalizedText("setting_compulsoryAuto", lang),
            compulsoryAuto
          )
          .toggle(
            meow.getLocalizedText("setting_reduceSinking", lang),
            reduceSinking
          )
          .toggle(meow.getLocalizedText("setting_tip", lang), tip);
        if (Settings.allow_jungle_loot)
          form.toggle(
            meow.getLocalizedText("setting_jungleLoot", lang),
            jungleLoot
          );
        form.show(player).then(result => {
          if (result.canceled) return;
          player.setDynamicProperty(
            "meow_language",
            langOptions[result.formValues[0]]
          );
          player.setDynamicProperty("meow_protect", result.formValues[1]);
          player.setDynamicProperty("meow_replace", result.formValues[2]);
          player.setDynamicProperty(
            "meow_compulsoryAuto",
            result.formValues[3]
          );
          player.setDynamicProperty("meow_reduceSinking", result.formValues[4]);
          player.setDynamicProperty("meow_tip", result.formValues[5]);
        });
      });
    });

    // —————— 温馨提示 ——————

    mc.world.afterEvents.playerSpawn.subscribe(event => {
      if (!event.player?.isValid() || !event.initialSpawn) return;
      const tip = event.player.getDynamicProperty("meow_tip") ?? Boolean(Settings.tip);
      if (!tip) return;
      const lang = event.player.getDynamicProperty("meow_language");
      const compulsoryAuto = event.player.getDynamicProperty(
        "meow_compulsoryAuto"
      );
      let message = meow.getLocalizedText("tip", lang);
      if (lang === undefined)
        message += meow.getLocalizedText("tip_lang_default", lang, {
          lang: meow.getLocalizedText("lang", Settings.language),
        });
      else
        message += meow.getLocalizedText("tip_lang", lang, {
          lang: meow.getLocalizedText("lang", lang),
        });
      if (compulsoryAuto === undefined)
        message += Settings.compulsory_auto
          ? meow.getLocalizedText("tip_compulsoryAuto_default_1", lang)
          : meow.getLocalizedText("tip_compulsoryAuto_0", lang);
      else
        message += compulsoryAuto
          ? meow.getLocalizedText("tip_compulsoryAuto_1", lang)
          : meow.getLocalizedText("tip_compulsoryAuto_0", lang);
      message += meow.getLocalizedText("tip_setting", lang);
      const vd = event.player.getViewDirection();
      const r = mc.system.runInterval(() => {
        if (!event.player.isValid()) return mc.system.clearRun(r);
        if (meow.Vector3.distance(event.player.getViewDirection(), vd) === 0)
          return;
        event.player.sendMessage(message);
        mc.system.clearRun(r);
      }, 60);
    });
  }).catch(err => {
    console.error("[§3MeowFish§r] [§4error§r] Failed to load lib (自动钓鱼加载失败):", err);
  });
}