/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

/*
  合并顺序（后者覆盖前者）：
    - vanilla (71): 新增 71，覆盖 0
    - vanilla_1.16 (4): 新增 4，覆盖 0
    - vanilla_1.18.0 (8): 新增 8，覆盖 0
    - vanilla_1.19.0 (2): 新增 2，覆盖 0
    - vanilla_1.19.80 (2): 新增 0，覆盖 2
    - vanilla_1.20.0 (1): 新增 1，覆盖 0
    - vanilla_1.21.50 (1): 新增 1，覆盖 0
    - vanilla_1.21.80 (1): 新增 0，覆盖 1
    - vanilla_1.21.90 (3): 新增 0，覆盖 3
    - vanilla_1.21.100 (4): 新增 0，覆盖 4
    - vanilla_1.26.0 (30): 新增 0，覆盖 30
    - vanilla_1.26.30 (1): 新增 1，覆盖 0
    - vanilla_1.26.50 (22): 新增 1，覆盖 21
  游戏版本：1.26.52.03
  群系数：89，标签数：98
*/

/** 标签 → 群系 id 列表（升序，带 minecraft: 命名空间） */
export const BIOME_TAGS = {
  "animal": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:dappled_forest",
    "minecraft:extreme_hills",
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:flower_forest",
    "minecraft:forest",
    "minecraft:forest_hills",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_hills",
    "minecraft:jungle_mutated",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:plains",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:roofed_forest",
    "minecraft:roofed_forest_mutated",
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated",
    "minecraft:sunflower_plains",
    "minecraft:swampland",
    "minecraft:swampland_mutated",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:taiga_mutated"
  ],
  "bamboo": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills"
  ],
  "basalt_deltas": [
    "minecraft:basalt_deltas"
  ],
  "beach": [
    "minecraft:beach",
    "minecraft:cold_beach",
    "minecraft:stone_beach"
  ],
  "bee_habitat": [
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_mutated",
    "minecraft:cherry_grove",
    "minecraft:flower_forest",
    "minecraft:forest",
    "minecraft:forest_hills",
    "minecraft:meadow",
    "minecraft:plains",
    "minecraft:sunflower_plains"
  ],
  "birch": [
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated"
  ],
  "caves": [
    "minecraft:deep_dark",
    "minecraft:dripstone_caves",
    "minecraft:lush_caves",
    "minecraft:sulfur_caves"
  ],
  "cherry_grove": [
    "minecraft:cherry_grove"
  ],
  "cold": [
    "minecraft:cold_beach",
    "minecraft:cold_ocean",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:deep_cold_ocean",
    "minecraft:grove"
  ],
  "crimson_forest": [
    "minecraft:crimson_forest"
  ],
  "dappled_forest": [
    "minecraft:dappled_forest"
  ],
  "deep": [
    "minecraft:deep_cold_ocean",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean"
  ],
  "deep_dark": [
    "minecraft:deep_dark"
  ],
  "desert": [
    "minecraft:desert",
    "minecraft:desert_hills",
    "minecraft:desert_mutated"
  ],
  "dripstone_caves": [
    "minecraft:dripstone_caves"
  ],
  "edge": [
    "minecraft:extreme_hills_edge",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated"
  ],
  "extreme_hills": [
    "minecraft:extreme_hills",
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated"
  ],
  "fast_fishing": [
    "minecraft:cold_ocean",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:frozen_ocean",
    "minecraft:legacy_frozen_ocean",
    "minecraft:lukewarm_ocean",
    "minecraft:ocean",
    "minecraft:warm_ocean"
  ],
  "flower_forest": [
    "minecraft:flower_forest"
  ],
  "forest": [
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:dappled_forest",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:forest",
    "minecraft:forest_hills",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:roofed_forest",
    "minecraft:roofed_forest_mutated",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:taiga_mutated"
  ],
  "frozen": [
    "minecraft:deep_frozen_ocean",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:legacy_frozen_ocean",
    "minecraft:snowy_slopes"
  ],
  "frozen_peaks": [
    "minecraft:frozen_peaks"
  ],
  "grove": [
    "minecraft:grove"
  ],
  "has_structure_abandoned_camp": [
    "minecraft:bamboo_jungle",
    "minecraft:birch_forest",
    "minecraft:birch_forest_mutated",
    "minecraft:cherry_grove",
    "minecraft:cold_taiga",
    "minecraft:dappled_forest",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:flower_forest",
    "minecraft:forest",
    "minecraft:jungle_edge",
    "minecraft:meadow",
    "minecraft:mega_taiga",
    "minecraft:mesa_plateau_stone",
    "minecraft:pale_garden",
    "minecraft:redwood_taiga_mutated",
    "minecraft:savanna",
    "minecraft:swampland",
    "minecraft:taiga"
  ],
  "has_structure_trail_ruins": [
    "minecraft:birch_forest_mutated",
    "minecraft:cold_taiga",
    "minecraft:jungle",
    "minecraft:mega_taiga",
    "minecraft:redwood_taiga_mutated",
    "minecraft:taiga"
  ],
  "high_seas": [
    "minecraft:cold_ocean",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:frozen_ocean",
    "minecraft:legacy_frozen_ocean",
    "minecraft:lukewarm_ocean",
    "minecraft:ocean",
    "minecraft:warm_ocean"
  ],
  "hills": [
    "minecraft:bamboo_jungle_hills",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_hills_mutated",
    "minecraft:cold_taiga_hills",
    "minecraft:desert_hills",
    "minecraft:forest_hills",
    "minecraft:jungle_hills",
    "minecraft:mega_taiga_hills",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:taiga_hills"
  ],
  "ice": [
    "minecraft:ice_mountains",
    "minecraft:ice_plains"
  ],
  "ice_plains": [
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes"
  ],
  "jagged_peaks": [
    "minecraft:jagged_peaks"
  ],
  "jungle": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_hills",
    "minecraft:jungle_mutated"
  ],
  "legacy": [
    "minecraft:legacy_frozen_ocean"
  ],
  "lukewarm": [
    "minecraft:deep_lukewarm_ocean",
    "minecraft:lukewarm_ocean"
  ],
  "lush_caves": [
    "minecraft:lush_caves"
  ],
  "mangrove_swamp": [
    "minecraft:mangrove_swamp"
  ],
  "meadow": [
    "minecraft:meadow"
  ],
  "mega": [
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated"
  ],
  "mesa": [
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated"
  ],
  "monster": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:beach",
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated",
    "minecraft:cherry_grove",
    "minecraft:cold_beach",
    "minecraft:cold_ocean",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:dappled_forest",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:desert",
    "minecraft:desert_hills",
    "minecraft:desert_mutated",
    "minecraft:dripstone_caves",
    "minecraft:extreme_hills",
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:flower_forest",
    "minecraft:forest",
    "minecraft:forest_hills",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:grove",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_hills",
    "minecraft:jungle_mutated",
    "minecraft:lukewarm_ocean",
    "minecraft:lush_caves",
    "minecraft:mangrove_swamp",
    "minecraft:meadow",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:ocean",
    "minecraft:pale_garden",
    "minecraft:plains",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:roofed_forest",
    "minecraft:roofed_forest_mutated",
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated",
    "minecraft:snowy_slopes",
    "minecraft:stone_beach",
    "minecraft:stony_peaks",
    "minecraft:sulfur_caves",
    "minecraft:sunflower_plains",
    "minecraft:swampland",
    "minecraft:swampland_mutated",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:taiga_mutated",
    "minecraft:warm_ocean"
  ],
  "mooshroom_island": [
    "minecraft:mushroom_island",
    "minecraft:mushroom_island_shore"
  ],
  "mountain": [
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:ice_mountains"
  ],
  "mountains": [
    "minecraft:cherry_grove",
    "minecraft:frozen_peaks",
    "minecraft:grove",
    "minecraft:jagged_peaks",
    "minecraft:meadow",
    "minecraft:snowy_slopes",
    "minecraft:stony_peaks"
  ],
  "mutated": [
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated",
    "minecraft:cold_taiga_mutated",
    "minecraft:desert_mutated",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:flower_forest",
    "minecraft:ice_plains_spikes",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_mutated",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:roofed_forest_mutated",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau_mutated",
    "minecraft:sunflower_plains",
    "minecraft:swampland_mutated",
    "minecraft:taiga_mutated"
  ],
  "nether": [
    "minecraft:basalt_deltas",
    "minecraft:crimson_forest",
    "minecraft:hell",
    "minecraft:soulsand_valley",
    "minecraft:warped_forest"
  ],
  "nether_wastes": [
    "minecraft:hell"
  ],
  "netherwart_forest": [
    "minecraft:crimson_forest",
    "minecraft:warped_forest"
  ],
  "no_legacy_worldgen": [
    "minecraft:roofed_forest"
  ],
  "oak_forest": [
    "minecraft:forest"
  ],
  "ocean": [
    "minecraft:cold_ocean",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:frozen_ocean",
    "minecraft:legacy_frozen_ocean",
    "minecraft:lukewarm_ocean",
    "minecraft:ocean",
    "minecraft:warm_ocean"
  ],
  "overworld": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:beach",
    "minecraft:birch_forest",
    "minecraft:birch_forest_hills",
    "minecraft:cherry_grove",
    "minecraft:cold_beach",
    "minecraft:cold_ocean",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:dappled_forest",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_dark",
    "minecraft:deep_frozen_ocean",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:desert",
    "minecraft:desert_hills",
    "minecraft:dripstone_caves",
    "minecraft:extreme_hills",
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:flower_forest",
    "minecraft:forest",
    "minecraft:forest_hills",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:grove",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_hills",
    "minecraft:legacy_frozen_ocean",
    "minecraft:lukewarm_ocean",
    "minecraft:lush_caves",
    "minecraft:mangrove_swamp",
    "minecraft:meadow",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:mushroom_island",
    "minecraft:mushroom_island_shore",
    "minecraft:ocean",
    "minecraft:pale_garden",
    "minecraft:plains",
    "minecraft:redwood_taiga_mutated",
    "minecraft:river",
    "minecraft:roofed_forest",
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated",
    "minecraft:snowy_slopes",
    "minecraft:stone_beach",
    "minecraft:stony_peaks",
    "minecraft:sulfur_caves",
    "minecraft:sunflower_plains",
    "minecraft:swampland",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:warm_ocean"
  ],
  "overworld_generation": [
    "minecraft:birch_forest_hills_mutated",
    "minecraft:birch_forest_mutated",
    "minecraft:cold_taiga_mutated",
    "minecraft:desert_mutated",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_mutated",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:roofed_forest_mutated",
    "minecraft:swampland_mutated",
    "minecraft:taiga_mutated"
  ],
  "pale_garden": [
    "minecraft:pale_garden"
  ],
  "plains": [
    "minecraft:plains",
    "minecraft:sunflower_plains"
  ],
  "plateau": [
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated"
  ],
  "rare": [
    "minecraft:jungle",
    "minecraft:mega_taiga",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_stone"
  ],
  "river": [
    "minecraft:frozen_river",
    "minecraft:river"
  ],
  "roofed": [
    "minecraft:roofed_forest",
    "minecraft:roofed_forest_mutated"
  ],
  "savanna": [
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated"
  ],
  "shore": [
    "minecraft:mushroom_island_shore"
  ],
  "slime": [
    "minecraft:mangrove_swamp",
    "minecraft:swampland",
    "minecraft:swampland_mutated"
  ],
  "snowy_slopes": [
    "minecraft:snowy_slopes"
  ],
  "soulsand_valley": [
    "minecraft:soulsand_valley"
  ],
  "spawn_endermen": [
    "minecraft:hell",
    "minecraft:soulsand_valley",
    "minecraft:warped_forest"
  ],
  "spawn_few_piglins": [
    "minecraft:hell"
  ],
  "spawn_few_zombified_piglins": [
    "minecraft:crimson_forest"
  ],
  "spawn_ghast": [
    "minecraft:basalt_deltas",
    "minecraft:hell",
    "minecraft:soulsand_valley"
  ],
  "spawn_magma_cubes": [
    "minecraft:hell"
  ],
  "spawn_many_magma_cubes": [
    "minecraft:basalt_deltas"
  ],
  "spawn_piglin": [
    "minecraft:crimson_forest"
  ],
  "spawn_zombified_piglin": [
    "minecraft:hell"
  ],
  "spawns_cold_variant_farm_animals": [
    "minecraft:cold_beach",
    "minecraft:cold_ocean",
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:dappled_forest",
    "minecraft:deep_cold_ocean",
    "minecraft:deep_dark",
    "minecraft:deep_frozen_ocean",
    "minecraft:extreme_hills",
    "minecraft:extreme_hills_edge",
    "minecraft:extreme_hills_mutated",
    "minecraft:extreme_hills_plus_trees",
    "minecraft:extreme_hills_plus_trees_mutated",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:grove",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:legacy_frozen_ocean",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:snowy_slopes",
    "minecraft:stony_peaks",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:taiga_mutated",
    "minecraft:the_end"
  ],
  "spawns_cold_variant_frogs": [
    "minecraft:cold_beach",
    "minecraft:cold_taiga_hills",
    "minecraft:deep_dark",
    "minecraft:deep_frozen_ocean",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:grove",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:snowy_slopes",
    "minecraft:the_end"
  ],
  "spawns_gold_rabbits": [
    "minecraft:desert",
    "minecraft:desert_hills",
    "minecraft:desert_mutated"
  ],
  "spawns_jungle_mobs": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_hills"
  ],
  "spawns_mesa_mobs": [
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated"
  ],
  "spawns_more_frequent_drowned": [
    "minecraft:river"
  ],
  "spawns_nether_mobs": [
    "minecraft:hell"
  ],
  "spawns_polar_bears_on_alternate_blocks": [
    "minecraft:deep_frozen_ocean",
    "minecraft:frozen_ocean",
    "minecraft:legacy_frozen_ocean"
  ],
  "spawns_reduced_water_ambient_mobs": [
    "minecraft:river"
  ],
  "spawns_river_mobs": [
    "minecraft:frozen_river",
    "minecraft:river"
  ],
  "spawns_savanna_mobs": [
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated"
  ],
  "spawns_slimes_on_surface": [
    "minecraft:mangrove_swamp",
    "minecraft:swampland",
    "minecraft:swampland_mutated"
  ],
  "spawns_snow_foxes": [
    "minecraft:cold_beach",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:grove",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:jagged_peaks",
    "minecraft:snowy_slopes"
  ],
  "spawns_tropical_fish_at_any_height": [
    "minecraft:lush_caves"
  ],
  "spawns_warm_variant_farm_animals": [
    "minecraft:bamboo_jungle",
    "minecraft:bamboo_jungle_hills",
    "minecraft:basalt_deltas",
    "minecraft:crimson_forest",
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:desert",
    "minecraft:desert_hills",
    "minecraft:desert_mutated",
    "minecraft:hell",
    "minecraft:jungle",
    "minecraft:jungle_edge",
    "minecraft:jungle_edge_mutated",
    "minecraft:jungle_hills",
    "minecraft:jungle_mutated",
    "minecraft:lukewarm_ocean",
    "minecraft:mangrove_swamp",
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated",
    "minecraft:savanna",
    "minecraft:savanna_mutated",
    "minecraft:savanna_plateau",
    "minecraft:savanna_plateau_mutated",
    "minecraft:soulsand_valley",
    "minecraft:warm_ocean",
    "minecraft:warped_forest"
  ],
  "spawns_warm_variant_frogs": [
    "minecraft:desert",
    "minecraft:mangrove_swamp",
    "minecraft:warm_ocean"
  ],
  "spawns_white_rabbits": [
    "minecraft:cold_beach",
    "minecraft:cold_taiga_hills",
    "minecraft:frozen_ocean",
    "minecraft:frozen_peaks",
    "minecraft:frozen_river",
    "minecraft:grove",
    "minecraft:ice_mountains",
    "minecraft:ice_plains",
    "minecraft:ice_plains_spikes",
    "minecraft:jagged_peaks",
    "minecraft:snowy_slopes"
  ],
  "spawns_without_patrols": [
    "minecraft:mushroom_island",
    "minecraft:mushroom_island_shore"
  ],
  "stone": [
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:stone_beach"
  ],
  "sulfur_caves": [
    "minecraft:sulfur_caves"
  ],
  "surface_mineshaft": [
    "minecraft:mesa",
    "minecraft:mesa_bryce",
    "minecraft:mesa_plateau",
    "minecraft:mesa_plateau_mutated",
    "minecraft:mesa_plateau_stone",
    "minecraft:mesa_plateau_stone_mutated"
  ],
  "swamp": [
    "minecraft:swampland",
    "minecraft:swampland_mutated"
  ],
  "swamp_water_huge_mushroom": [
    "minecraft:swampland",
    "minecraft:swampland_mutated"
  ],
  "taiga": [
    "minecraft:cold_taiga",
    "minecraft:cold_taiga_hills",
    "minecraft:cold_taiga_mutated",
    "minecraft:mega_taiga",
    "minecraft:mega_taiga_hills",
    "minecraft:redwood_taiga_hills_mutated",
    "minecraft:redwood_taiga_mutated",
    "minecraft:taiga",
    "minecraft:taiga_hills",
    "minecraft:taiga_mutated"
  ],
  "temperate_ocean": [
    "minecraft:deep_lukewarm_ocean",
    "minecraft:deep_warm_ocean",
    "minecraft:lukewarm_ocean",
    "minecraft:warm_ocean"
  ],
  "the_end": [
    "minecraft:the_end"
  ],
  "warm": [
    "minecraft:beach",
    "minecraft:deep_warm_ocean",
    "minecraft:warm_ocean"
  ],
  "warped_forest": [
    "minecraft:warped_forest"
  ]
};

/** 全部群系 id（升序） */
export const ALL_BIOME_IDS = [
  "minecraft:bamboo_jungle",
  "minecraft:bamboo_jungle_hills",
  "minecraft:basalt_deltas",
  "minecraft:beach",
  "minecraft:birch_forest",
  "minecraft:birch_forest_hills",
  "minecraft:birch_forest_hills_mutated",
  "minecraft:birch_forest_mutated",
  "minecraft:cherry_grove",
  "minecraft:cold_beach",
  "minecraft:cold_ocean",
  "minecraft:cold_taiga",
  "minecraft:cold_taiga_hills",
  "minecraft:cold_taiga_mutated",
  "minecraft:crimson_forest",
  "minecraft:dappled_forest",
  "minecraft:deep_cold_ocean",
  "minecraft:deep_dark",
  "minecraft:deep_frozen_ocean",
  "minecraft:deep_lukewarm_ocean",
  "minecraft:deep_ocean",
  "minecraft:deep_warm_ocean",
  "minecraft:desert",
  "minecraft:desert_hills",
  "minecraft:desert_mutated",
  "minecraft:dripstone_caves",
  "minecraft:extreme_hills",
  "minecraft:extreme_hills_edge",
  "minecraft:extreme_hills_mutated",
  "minecraft:extreme_hills_plus_trees",
  "minecraft:extreme_hills_plus_trees_mutated",
  "minecraft:flower_forest",
  "minecraft:forest",
  "minecraft:forest_hills",
  "minecraft:frozen_ocean",
  "minecraft:frozen_peaks",
  "minecraft:frozen_river",
  "minecraft:grove",
  "minecraft:hell",
  "minecraft:ice_mountains",
  "minecraft:ice_plains",
  "minecraft:ice_plains_spikes",
  "minecraft:jagged_peaks",
  "minecraft:jungle",
  "minecraft:jungle_edge",
  "minecraft:jungle_edge_mutated",
  "minecraft:jungle_hills",
  "minecraft:jungle_mutated",
  "minecraft:legacy_frozen_ocean",
  "minecraft:lukewarm_ocean",
  "minecraft:lush_caves",
  "minecraft:mangrove_swamp",
  "minecraft:meadow",
  "minecraft:mega_taiga",
  "minecraft:mega_taiga_hills",
  "minecraft:mesa",
  "minecraft:mesa_bryce",
  "minecraft:mesa_plateau",
  "minecraft:mesa_plateau_mutated",
  "minecraft:mesa_plateau_stone",
  "minecraft:mesa_plateau_stone_mutated",
  "minecraft:mushroom_island",
  "minecraft:mushroom_island_shore",
  "minecraft:ocean",
  "minecraft:pale_garden",
  "minecraft:plains",
  "minecraft:redwood_taiga_hills_mutated",
  "minecraft:redwood_taiga_mutated",
  "minecraft:river",
  "minecraft:roofed_forest",
  "minecraft:roofed_forest_mutated",
  "minecraft:savanna",
  "minecraft:savanna_mutated",
  "minecraft:savanna_plateau",
  "minecraft:savanna_plateau_mutated",
  "minecraft:snowy_slopes",
  "minecraft:soulsand_valley",
  "minecraft:stone_beach",
  "minecraft:stony_peaks",
  "minecraft:sulfur_caves",
  "minecraft:sunflower_plains",
  "minecraft:swampland",
  "minecraft:swampland_mutated",
  "minecraft:taiga",
  "minecraft:taiga_hills",
  "minecraft:taiga_mutated",
  "minecraft:the_end",
  "minecraft:warm_ocean",
  "minecraft:warped_forest"
];

const EMPTY = Object.freeze([]);

/** 去掉命名空间：minecraft:jungle → jungle */
function shortId(id) {
  const i = id.indexOf(":");
  return i === -1 ? id : id.slice(i + 1);
}

/** tag → Set（加速包含判断），惰性构建一次 */
const TAG_SETS = new Map();
function tagSet(tag) {
  let s = TAG_SETS.get(tag);
  if (s === undefined) {
    const list = BIOME_TAGS[tag];
    s = list ? new Set(list.map(shortId)) : null;
    TAG_SETS.set(tag, s);
  }
  return s;
}

/**
 * 取某个标签下的全部群系 id。
 * @param {string} tag 标签名，如 "jungle"（可带 minecraft: 前缀）
 * @returns {readonly string[]}
 */
export function getBiomesByTag(tag) {
  if (typeof tag !== "string") return EMPTY;
  return BIOME_TAGS[shortId(tag)] ?? EMPTY;
}

/**
 * 判断群系是否属于某个标签。
 * @param {string} biomeId 群系 id，如 "minecraft:bamboo_jungle"
 * @param {string} tag 标签名，如 "jungle"
 * @returns {boolean}
 */
export function biomeHasTag(biomeId, tag) {
  if (typeof biomeId !== "string" || typeof tag !== "string") return false;
  const s = tagSet(shortId(tag));
  return s ? s.has(shortId(biomeId)) : false;
}

/** 群系 → 标签列表（模块加载时构建一次） */
const TAGS_OF_BIOME = new Map();
for (const [tag, list] of Object.entries(BIOME_TAGS)) {
  for (const id of list) {
    const key = shortId(id);
    if (!TAGS_OF_BIOME.has(key)) TAGS_OF_BIOME.set(key, []);
    TAGS_OF_BIOME.get(key).push(tag);
  }
}

/**
 * 群系 → 标签列表。
 * @param {string} biomeId
 * @returns {readonly string[]}
 */
export function getTagsOfBiome(biomeId) {
  if (typeof biomeId !== "string") return EMPTY;
  return TAGS_OF_BIOME.get(shortId(biomeId)) ?? EMPTY;
}
