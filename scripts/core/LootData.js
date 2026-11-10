/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  该文件为自动生成
  This file was automatically generated

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

export const LOOT_DATA = {
  version: "1.0",
  generated: "2025-11-8T19:26:00.000Z",
  source: "vanilla",
  fishing_hook: {
    base_table: "gameplay/fishing",
    conditions: [
      {
        id: "loot_jungle",
        dimension: "minecraft:overworld",
        biome: "jungle",
        table: "gameplay/jungle_fishing"
      }
    ]
  },
  enchantability: {
    "minecraft:bow": 1,
    "minecraft:enchanted_book": 1,
    "minecraft:fishing_rod": 1
  },
  pools: {
    "gameplay/fishing": {
      id: "gameplay/fishing",
      dimension: "any",
      biome: "any",
      pools: [
        {
          id: "gameplay/fishing#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "gameplay/fishing/junk",
              type: "loot_table",
              weight: 10,
              quality: -2,
              count: 1
            },
            {
              id: "gameplay/fishing/treasure",
              type: "loot_table",
              weight: 5,
              quality: 2,
              count: 1
            },
            {
              id: "gameplay/fishing/fish",
              type: "loot_table",
              weight: 85,
              quality: -1,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/jungle_fishing": {
      id: "gameplay/jungle_fishing",
      dimension: "minecraft:overworld",
      biome: "jungle",
      pools: [
        {
          id: "gameplay/jungle_fishing#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "gameplay/fishing/jungle_junk",
              type: "loot_table",
              weight: 10,
              quality: -2,
              count: 1
            },
            {
              id: "gameplay/fishing/treasure",
              type: "loot_table",
              weight: 5,
              quality: 2,
              count: 1
            },
            {
              id: "gameplay/fishing/jungle_fish",
              type: "loot_table",
              weight: 85,
              quality: -1,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/fishing/fish": {
      id: "gameplay/fishing/fish",
      dimension: "any",
      biome: "any",
      pools: [
        {
          id: "gameplay/fishing/fish#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "minecraft:cod",
              type: "item",
              weight: 60,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:salmon",
              type: "item",
              weight: 25,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:tropical_fish",
              type: "item",
              weight: 2,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:pufferfish",
              type: "item",
              weight: 13,
              quality: 0,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/fishing/jungle_fish": {
      id: "gameplay/fishing/jungle_fish",
      dimension: "minecraft:overworld",
      biome: "jungle",
      pools: [
        {
          id: "gameplay/fishing/jungle_fish#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "minecraft:cod",
              type: "item",
              weight: 60,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:salmon",
              type: "item",
              weight: 40,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:tropical_fish",
              type: "item",
              weight: 2,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:pufferfish",
              type: "item",
              weight: 13,
              quality: 0,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/fishing/junk": {
      id: "gameplay/fishing/junk",
      dimension: "any",
      biome: "any",
      pools: [
        {
          id: "gameplay/fishing/junk#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "minecraft:leather_boots",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.9
              }
            },
            {
              id: "minecraft:waterlily",
              type: "item",
              weight: 17,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:ink_sac",
              type: "item",
              weight: 1,
              quality: 0,
              count: 10
            },
            {
              id: "minecraft:leather",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:bone",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:potion",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:string",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:fishing_rod",
              type: "item",
              weight: 2,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.9
              }
            },
            {
              id: "minecraft:bowl",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:stick",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:ink_sac",
              type: "item",
              weight: 1,
              quality: 0,
              count: 10
            },
            {
              id: "minecraft:tripwire_hook",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:rotten_flesh",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/fishing/jungle_junk": {
      id: "gameplay/fishing/jungle_junk",
      dimension: "minecraft:overworld",
      biome: "jungle",
      pools: [
        {
          id: "gameplay/fishing/jungle_junk#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "minecraft:leather_boots",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.9
              }
            },
            {
              id: "minecraft:leather",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:bone",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:potion",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:string",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:fishing_rod",
              type: "item",
              weight: 2,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.9
              }
            },
            {
              id: "minecraft:bowl",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:stick",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:ink_sac",
              type: "item",
              weight: 1,
              quality: 0,
              count: 10
            },
            {
              id: "minecraft:cocoa_beans",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:tripwire_hook",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:rotten_flesh",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:bamboo",
              type: "item",
              weight: 10,
              quality: 0,
              count: 1
            }
          ]
        }
      ]
    },
    "gameplay/fishing/treasure": {
      id: "gameplay/fishing/treasure",
      dimension: "any",
      biome: "any",
      pools: [
        {
          id: "gameplay/fishing/treasure#0",
          rolls: {
            min: 1,
            max: 1
          },
          bonus_rolls: null,
          entries: [
            {
              id: "minecraft:nautilus_shell",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:name_tag",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:saddle",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1
            },
            {
              id: "minecraft:bow",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.25
              },
              enchantments: [
                {
                  type: "levels",
                  levels: 30,
                  treasure: true
                }
              ]
            },
            {
              id: "minecraft:fishing_rod",
              type: "item",
              weight: 5,
              quality: 0,
              count: 1,
              durability: {
                min: 0,
                max: 0.25
              },
              enchantments: [
                {
                  type: "levels",
                  levels: 30,
                  treasure: true
                }
              ]
            },
            {
              id: "minecraft:enchanted_book",
              type: "item",
              weight: 6,
              quality: 0,
              count: 1,
              enchantments: [
                {
                  type: "levels",
                  levels: 30,
                  treasure: true
                }
              ]
            }
          ]
        }
      ]
    }
  }
};
