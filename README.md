![Project Icon](./pack_icon.png)

# MeowFish

_Minecraft Bedrock Auto Fishing_

English | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md)

MeowFish is an automatic fishing behavior pack for Minecraft Bedrock Edition. It provides automatic fishing, fishing rod durability protection, loot filtering, runtime monitoring, and more.

## Current Version

**v1.0.0**

## Compatibility

- Minimum supported Minecraft version: **1.21.120**
- Dependencies:
  - `@minecraft/server` 2.3.0
  - `@minecraft/server-ui` 2.0.0
- Achievement compatibility: Achievements are compatible with supported versions except 1.26.50 and 1.26.51.

## Installation and Usage

1. Download and import the MeowFish behavior pack into Minecraft.
2. Enable MeowFish in the Behavior Packs settings of your world.
3. Hold a fishing rod and cast while sneaking to activate automatic fishing.
4. To open the personal settings menu, rename a piece of paper to one of the following names:
   - `MF设置`
   - `MF設置`
   - `MFSetting`

   Right-click the paper on PC, or long-press it on mobile.

## Features

### Automatic Fishing and Basic Settings

The personal settings menu provides the following options:

- **Language:** Simplified Chinese, Traditional Chinese, and English.
- **Forced Automatic Fishing:** Activates automatic fishing without requiring the player to sneak.
- **Durability Protection:** Protects fishing rod durability during fishing.
- **Rod Replacement:** Searches the inventory for another usable fishing rod when the current rod is depleted.
- **Reduced Bobber Sinking:** Reduces bobber sinking to help prevent interference with other entities.
- **Welcome Tips:** Controls whether usage tips are displayed when players join the world.
- **Loot Spawn Mode:** Choose between the vanilla-style effect (loot flies from the bobber to the player), spawning loot at the player's position, or spawning loot at the bobber's position.
- **Particle Effects:** Choose from disabled, minimal, normal, and fancy particle effects. The fancy option can be controlled by administrators.
- **Sound Volume:** Adjusts the fishing bite sound volume.

### Loot Filtering

When enabled by the administrator, loot filtering is available in Advanced Settings.

- Supports whitelist and blacklist modes.
- Allows individual filtering rules for each item.
- Displays item icons in the filtering interface.
- Includes a personal switch to enable or disable filtering.

### Advanced Settings and Administration

- **Reset to Defaults:** Resets personal settings.
- **Administrator Access:** Enter the administration center after verifying an administrator key.
- **Runtime Monitoring:** View players currently using automatic fishing and their states.
- **Performance and Cache Monitoring:** View cache hit rates and check counts for status and velocity caches.
- **Recent Issues:** View recently recorded runtime issues.
- **Global Controls:** Administrators can pause or resume automatic fishing and manage active player sessions.

## Loot System

MeowFish uses built-in vanilla fishing loot tables and a loot roll engine to calculate rewards. The included data covers both regular and jungle fishing loot tables, including fish, junk, and treasure sub-tables.

It also supports biome tag matching and diagnostic logs for empty or failed loot table loading.

The built-in loot data reduces reliance on runtime queries of vanilla loot tables. Compatibility with modded loot tables depends on their data and item definitions.

## Administrator Configuration

The `scripts/SystemSettings.js` file in the behavior pack provides global configuration options, including default behavior, language, loot filtering, particle effects, circuit breakers, and debug logging.

Read the comments for each option before modifying the configuration.

After making changes:

- **Single-player:** In a world with cheats enabled, execute `/reload` to reload the scripts. If cheats are not enabled, exit and reload the single-player world.
- **Server:** Enter `reload` in the server's background console to reload the scripts.

For normal gameplay, it is recommended to keep debug mode disabled.

## About

- **Author:** MiaoMiaoMax
- **Bilibili:** [CNQuanYeCha](https://space.bilibili.com/1968985335)
- **Project Repository:** [MiaoMiaoMax/MeowFish](https://github.com/MiaoMiaoMax/MeowFish)
- **License:** CC BY-NC-SA 4.0

If you find this project useful, please consider giving it a Star. Feedback and suggestions are also welcome!

## License

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

[View the license](https://creativecommons.org/licenses/by-nc-sa/4.0/)
