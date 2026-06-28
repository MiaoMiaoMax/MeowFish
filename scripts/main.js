/*
  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Settings } from "./SystemSettings";

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

    const FISHING_MAIN_ENTRIES = [
      { name: "junk",     weight: 10, quality: -2 },
      { name: "treasure", weight: 5,  quality:  2 },
      { name: "fish",     weight: 85, quality: -1 }
    ];
    // 丛林变体
    const JUNGLE_FISHING_MAIN_ENTRIES = [
      { name: "jungle_junk", weight: 10, quality: -2 },
      { name: "treasure",    weight: 5,  quality:  2 },
      { name: "jungle_fish", weight: 85, quality: -1 }
    ];

    const langOptions = [undefined].concat(meow.language);

    /**
     * 存储正在使用自动钓鱼功能的玩家ID集合
     * @type {Set<string>}
     */
    const AutoFish = new Set();
    
    /**
     * 存储钓鱼钩相关定时器的映射表
     * Key: 玩家ID, Value: 定时器ID
     * @type {Map<string, number>}
     */
    const HookTp = new Map();
    
    /**
     * 存储钓鱼战利品位置信息的映射表
     * Key: 玩家ID, Value: 战利品位置相关信息对象
     * @type {Map<string, { locF:mc.Vector3, tpLoc:mc.Vector3, time:number, lootMode:number, isBesideWater:boolean, particleData:null | number, volume:number }>}
     */
    const FishLoot = new Map();
    
    /**
     * 存储正在打开设置界面的玩家ID集合
     * 用于防止玩家重复打开设置界面
     * @type {Set<string>}
     */
    const SettingPlayer = new Set();

    // —————— 工具函数 ——————

    const isCreative = player => player.getGameMode() === mc.GameMode.creative;

    const shouldProtectRod = (durability, mendingLevel) =>
      durability.damage >= (durability.maxDurability - 1) && mendingLevel < 1;

    const showXpMessage = (player, lang, xp, suffix = "") => {
      meow.runCommand(
        player,
        `title @s actionbar ${meow.getLocalizedText("gain_xp", lang, { xp })}${suffix}`
      );
    };

    // —————— 海之眷顾附魔处理 ——————

    /**
     * 根据 luck 动态计算 fishing loot 类型
     * @param {number} luck - 海之眷顾等级（0~3+）
     * @param {boolean} useJungle - 是否使用丛林钓鱼池
     * @returns {string} loot 类型名称（如 "treasure"）
     */
    function getFishingLootType(luck, useJungle = false) {
      // if (system_luck === 1) return "junk";
      // if (system_luck === 2) return "treasure";

      const entries = useJungle ? JUNGLE_FISHING_MAIN_ENTRIES : FISHING_MAIN_ENTRIES;

      const weightedEntries = [];
      let totalWeight = 0;

      for (const entry of entries) {
        const finalWeight = Math.max(0, entry.weight + entry.quality * luck);
        if (finalWeight > 0) {
          weightedEntries.push({ name: entry.name, weight: finalWeight });
          totalWeight += finalWeight;
        }
      }

      if (totalWeight === 0) return "fish";

      const random = Math.floor(Math.random() * totalWeight);
      let cumulative = 0;

      for (const { name, weight } of weightedEntries) {
        cumulative += weight;
        if (random < cumulative) {
          return name;
        }
      }

      return weightedEntries[weightedEntries.length - 1].name;
    }

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
      // 迁移v0.1.4-beta的meow_lootAtPlayerLoc历史设置
      const oldLootSetting = event.player.getDynamicProperty("meow_lootAtPlayerLoc");
      if (oldLootSetting !== undefined) {
        event.player.setDynamicProperty("meow_lootMode", oldLootSetting ? 1 : 0);
        event.player.setDynamicProperty("meow_lootAtPlayerLoc"); // 删除旧属性
      }
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
    });

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
      meow.Events.fishing.hookHitEntity
    ].forEach(evt =>
      evt.subscribe(e => {
        const lang = e.player.getDynamicProperty("meow_language");
        if (!AutoFish.has(e.player.id)) return;
        AutoFish.delete(e.player.id);
        if (HookTp.has(e.player.id)) {
          mc.system.clearRun(HookTp.get(e.player.id));
          HookTp.delete(e.player.id);
        }
        e.player.sendMessage(meow.getLocalizedText("auto_fish_stop", lang));
      })
    );

    mc.world.beforeEvents.playerLeave.subscribe(event => {
      AutoFish.delete(event.player.id);
      if (HookTp.has(event.player.id)) {
        mc.system.clearRun(HookTp.get(event.player.id));
        HookTp.delete(event.player.id);
      }
    });

    // —————— 核心：鱼咬钩处理 ——————

    meow.Events.fishing.fishBite.subscribe(event => {
      const player = event.player;
      if (!AutoFish.has(player.id)) return;

      const selectedSlotIndex = player.selectedSlotIndex;
      const inventory = player.getComponent("minecraft:inventory")?.container;
      const item = inventory?.getItem(selectedSlotIndex);
      if (!item || item.typeId !== "minecraft:fishing_rod") return;

      const isInCreative = isCreative(player);
      if (!isInCreative) {
        item.lockMode = "slot"; // 锁定物品
        inventory.setItem(selectedSlotIndex, item);
      }

      const lang = player.getDynamicProperty("meow_language") ?? Settings.language;
      const protect = player.getDynamicProperty("meow_protect") ?? Boolean(Settings.protect);
      const replace = player.getDynamicProperty("meow_replace") ?? Boolean(Settings.replace);
      const reduceSinking = player.getDynamicProperty("meow_reduceSinking") ?? Boolean(Settings.reduce_sinking);
      const jungleLoot = player.getDynamicProperty("meow_jungleLoot") ?? false;
      const lootMode = player.getDynamicProperty("meow_lootMode") ?? 0;
      const particleMode = Math.min(player.getDynamicProperty("meow_particleMode") ?? 2, Settings.fancy_particle ? Number.MAX_SAFE_INTEGER : 2);
      const volume = Math.max(0, Math.min(player.getDynamicProperty("meow_volume") ?? 1, 1));

      const durability = item.getComponent("minecraft:durability");
      if (!durability) return meow.error("Failed to get fishing rod durability (无法获取鱼竿耐久)");
      const enchant = item.getComponent("minecraft:enchantable");
      const mending = enchant?.getEnchantment("mending")?.level ?? 0;
      const luck = Math.max(0, enchant?.getEnchantment("luck_of_the_sea")?.level ?? 0);
      const unbreaking = enchant?.getEnchantment("unbreaking")?.level ?? 0;

      // 耐久保护检查（仅生存模式）
      if (protect && !isInCreative && shouldProtectRod(durability, mending)) {
        return player.sendMessage(meow.getLocalizedText("rod_durability_warning", lang));
      }

      if (reduceSinking && !event.isBesideWater) {
        // 减少鱼钩下沉
        const locH = meow.Vector3.copy(event.hook.location);
        const r = mc.system.runInterval(() => {
          if (!event.hook?.isValid()) return;
          event.hook.teleport(locH);
          event.hook.applyImpulse(meow.Vector3.scl(event.hook.getVelocity(), -0.8));
        }, 1);
        HookTp.set(player.id, r);
        mc.system.runTimeout(() => {
          if (!HookTp.has(player?.id)) return;
          HookTp.delete(player?.id);
          mc.system.clearRun(r);
        }, 20);
      }

      // 决定战利品类型
      const lootType = getFishingLootType(luck, Settings.allow_jungle_loot && jungleLoot);
      let xp = meow.getRndInteger(1, lootType === "fish" ? 4 : lootType === "junk" ? 2 : 6);

      // 耐久处理（仅生存模式）
      // 经验修补由游戏底层在玩家拾取经验球时自动触发，无需手动处理
      if (!isInCreative && meow.consumeDurability(unbreaking)) {
        durability.damage += 1;
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
      item.lockMode = "none";
      if (needReplace) {
        if (!replaceFishingRod(player, item)) {
          messageSuffix = meow.getLocalizedText("rod_replaced_failed", lang);
          if (protect) mc.system.runTimeout(() => inventory.setItem(selectedSlotIndex, item), 1);
          else mc.system.runTimeout(() => inventory.setItem(selectedSlotIndex), 1);
        } else yesReplace = true;
      } else if (!isInCreative) {
        mc.system.runTimeout(() => {
          if (isBroken) {
            // 钓鱼竿已损坏，清空手持装备
            inventory.setItem(selectedSlotIndex);
          } else {
            // 钓鱼竿未损坏，更新手持装备耐久值
            inventory.setItem(selectedSlotIndex, item);
          }
        }, 1);
      }

      if (event.isBesideWater) messageSuffix += " " + meow.getLocalizedText("fishing_machine_mode", lang);

      // 显示经验与状态
      showXpMessage(player, lang, xp, messageSuffix);

      if (yesReplace) meow.runCommand(player, "playsound mob.villager.yes @a ^^^1 0.7");
      else if (replace && needReplace) {
        if (isBroken) meow.runCommand(player, "playsound random.break @a ^^^1 0.7");
        meow.runCommand(player, "playsound mob.villager.no @a ^^^1 0.7");
      }
      else if (isBroken) meow.runCommand(player, "playsound random.break @a ^^^1 0.7");

      meow.runCommand(player, `playsound random.orb @a ^^^1 ${""+0.2*volume} 0.5`);

      while(xp--) player.dimension.spawnEntity("minecraft:xp_orb", player.location);

      const now = Date.now();
      let particleData = null;

      // 模式0 无粒子
      if (particleMode === 1) // 少量粒子
        meow.runCommand(
          player,
          `particle minecraft:villager_happy ${event.hook.location.x} ${event.hook.location.y + 0.5
          } ${event.hook.location.z}`
        );
      else if (particleMode === 2 || (!Settings.fancy_particle && particleMode === 3)) // 正常粒子
        meow.runCommand(
          player,
          `particle minecraft:crop_growth_emitter ${event.hook.location.x} ${event.hook.location.y + 0.2
          } ${event.hook.location.z}`
        );
      else if (particleMode === 3) { // 华丽粒子 - 有检测物品类别
        switch (lootType) {
          case "fish":
          case "jungle_fish":
            meow.runCommand(
              player,
              `particle minecraft:crop_growth_emitter ${event.hook.location.x} ${event.hook.location.y + 0.2
              } ${event.hook.location.z}`
            );
            break;
          case "junk":
          case "jungle_junk":
            meow.runCommand(
              player,
              `particle minecraft:cauldron_explosion_emitter ${event.hook.location.x} ${event.hook.location.y + 0.2
              } ${event.hook.location.z}`
            );
            meow.runCommand(player, `playsound block.composter.fill @a ^^^1 ${""+0.5*volume} 1`);
            break;
          case "treasure":
            particleData = particleMode;
        }
      }

      const locD = lootMode === 1 ? player.location : event.hook.location,
        locF = meow.Vector3.floor(locD);
      meow.runCommand(player, `loot spawn ${locF.x} ${locF.y} ${locF.z} loot "gameplay/fishing/${lootType}"`);
      FishLoot.set(player.id, {
        locF,
        tpLoc: meow.Vector3.add(locD, 0, 0.5, 0),
        time: now,
        lootMode,
        isBesideWater: event.isBesideWater,
        particleData,
        volume
      });
    });

    // —————— 战利品吸附逻辑 ——————

    mc.world.afterEvents.entitySpawn.subscribe(event => {
      if (event.entity.typeId !== "minecraft:item") return;
      const now = Date.now();

      for (const [
        playerId,
        { locF, tpLoc, time, lootMode, isBesideWater, particleData, volume },
      ] of FishLoot) {
        // 检查超时情况
        const timeElapsed = now - time;
        if (timeElapsed > 500) {
          FishLoot.delete(playerId);
          continue;
        }

        const player = mc.world.getEntity(playerId);
        if (!player) continue;

        // 检查物品是否在预期的生成位置附近
        const itemPos = event.entity.location;
        if (
          (itemPos.x - locF.x) * (itemPos.x - locF.x) +
            (itemPos.y - locF.y) * (itemPos.y - locF.y) +
            (itemPos.z - locF.z) * (itemPos.z - locF.z) >
          0.01
        ) {
          continue;
        }

        if (particleData === 3) {
          const itemStack = event.entity.getComponent("minecraft:item")?.itemStack;
          const enchant = itemStack.getComponent("minecraft:enchantable");

          if (
            enchant
          ) {
            meow.runCommand(player, `playsound trial_spawner.eject_item @a ^^^1 ${""+0.5*volume} 1`);
            if (
              enchant.getEnchantments().length >
              (enchant.hasEnchantment("minecraft:vanishing") ? 3 : 2)
            ) {
              meow.runCommand(
                player,
                `particle minecraft:trial_spawner_detection ${tpLoc.x - 0.5} ${
                  tpLoc.y - 2
                } ${tpLoc.z - 0.5}`
              );
              meow.runCommand(
                player,
                `playsound chime.amethyst_block @a ^^^1 ${""+1*volume} 1`
              );
              if (enchant.getEnchantments().length > 4) {
                meow.runCommand(player, "playsound trial_spawner.detect_player @a ^^^1 0.5 1");
                meow.runCommand(
                  player,
                  `particle minecraft:totem_particle ${tpLoc.x} ${tpLoc.y + 0.2} ${tpLoc.z}`
                );
                meow.runCommand(
                  player,
                  `particle minecraft:lava_particle ${tpLoc.x} ${tpLoc.y + 0.3} ${tpLoc.z}`
                );
                meow.runCommand(
                  player,
                  `particle minecraft:lava_particle ${tpLoc.x} ${tpLoc.y + 0.3} ${tpLoc.z}`
                );
                meow.runCommand(
                  player,
                  `particle minecraft:lava_particle ${tpLoc.x} ${tpLoc.y + 0.3} ${tpLoc.z}`
                );
              }
            }
            else {
              meow.runCommand(
                player,
                `particle minecraft:trial_spawner_detection_ominous ${
                  tpLoc.x - 0.5
                } ${tpLoc.y - 2} ${tpLoc.z - 0.5}`
              );
            }
          }
          else {
            meow.runCommand(
              player,
              `particle minecraft:crop_growth_emitter ${tpLoc.x} ${tpLoc.y - 0.2
              } ${tpLoc.z}`
            );
          }
        }

        // 如果非原版风格，则无需进一步处理
        if (lootMode !== 0 || isBesideWater) {
          event.entity.teleport(tpLoc);
          FishLoot.delete(playerId);
          break;
        }

        const dirX = itemPos.x - player.location.x;
        const dirZ = itemPos.z - player.location.z;
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1; // 避免除零

        const itemPos2 = {
          x: tpLoc.x - (dirX / len),
          y: tpLoc.y,
          z: tpLoc.z - (dirZ / len)
        };
        event.entity.teleport(itemPos2);

        const playerPos = meow.Vector3.add(player.location, 0, 1, 0);
        const distance = meow.Vector3.distance(playerPos, itemPos2);

        // 如果距离太近则不处理
        if (distance < 2) {
          FishLoot.delete(playerId);
          break;
        }

        const dx = playerPos.x - itemPos2.x;
        const dy = playerPos.y - itemPos2.y;
        const dz = playerPos.z - itemPos2.z;

        const speedFactor = 0.1;
        const extraY = Math.sqrt(Math.sqrt(distance)) * 0.08;

        event.entity.applyImpulse({
          x: dx * speedFactor,
          y: dy * speedFactor + extraY,
          z: dz * speedFactor,
        });

        FishLoot.delete(playerId);
        break;
      }
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
      const tip =
        player.getDynamicProperty("meow_tip") ?? Boolean(Settings.tip);
      const lootMode = player.getDynamicProperty("meow_lootMode") ?? 0;
      const particleMode = Math.min(player.getDynamicProperty("meow_particleMode") ?? 2, Settings.fancy_particle ? Number.MAX_SAFE_INTEGER : 2);
      const volume = Math.max(0, Math.min(player.getDynamicProperty("meow_volume") ?? 1, 1));
      const jungleLoot = player.getDynamicProperty("meow_jungleLoot") ?? false;

      mc.system.run(() => {
        const form = new ModalFormData()
          .title(meow.getLocalizedText("setting_title", lang))
          .dropdown(
            meow.getLocalizedText("setting_language", lang),
            [
              "默认 Default: " +
              meow.getLocalizedText("lang", Settings.language),
              ...meow.language.map(l => meow.getLocalizedText("lang", l)),
            ],
            langIndex,
          )
          .toggle(meow.getLocalizedText("setting_protect", lang), protect)
          .toggle(meow.getLocalizedText("setting_replace", lang), replace)
          .toggle(
            meow.getLocalizedText("setting_compulsoryAuto", lang),
            compulsoryAuto,
          )
          .toggle(
            meow.getLocalizedText("setting_reduceSinking", lang),
            reduceSinking,
          )
          .toggle(meow.getLocalizedText("setting_tip", lang), tip)
          .dropdown(
            meow.getLocalizedText("setting_lootMode", lang),
            [
              meow.getLocalizedText("setting_lootMode_0", lang),
              meow.getLocalizedText("setting_lootMode_1", lang),
              meow.getLocalizedText("setting_lootMode_2", lang),
            ],
            lootMode,
          )
          .dropdown(
            meow.getLocalizedText("setting_particleMode", lang),
            [
              meow.getLocalizedText("setting_particleMode_0", lang),
              meow.getLocalizedText("setting_particleMode_1", lang),
              meow.getLocalizedText("setting_particleMode_2", lang),
            ].concat(
              Settings.fancy_particle
                ? [meow.getLocalizedText("setting_particleMode_3", lang)]
                : [],
            ),
            particleMode,
          )
          .slider(meow.getLocalizedText("setting_volume", lang), 0, 100, 1, volume * 100);
        if (Settings.allow_jungle_loot)
          form.toggle(
            meow.getLocalizedText("setting_jungleLoot", lang),
            jungleLoot
          );
        form.show(player).then(result => {
          if (result.canceled) return player.sendMessage(meow.getLocalizedText("setting_canceled", lang));
          let i = 0;
          player.setDynamicProperty(
            "meow_language",
            langOptions[result.formValues[i++]]
          );
          player.setDynamicProperty("meow_protect", result.formValues[i++]);
          player.setDynamicProperty("meow_replace", result.formValues[i++]);
          player.setDynamicProperty(
            "meow_compulsoryAuto",
            result.formValues[i++]
          );
          player.setDynamicProperty("meow_reduceSinking", result.formValues[i++]);
          player.setDynamicProperty("meow_tip", result.formValues[i++]);
          player.setDynamicProperty("meow_lootMode", result.formValues[i++]);
          player.setDynamicProperty("meow_particleMode", result.formValues[i++]);
          player.setDynamicProperty("meow_volume", result.formValues[i++] / 100);
          if (Settings.allow_jungle_loot) {
            player.setDynamicProperty("meow_jungleLoot", result.formValues[i++]);
          }
          player.sendMessage(
            meow.getLocalizedText(
              "setting_saved",
              langOptions[result.formValues[0]]
            )
          );
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