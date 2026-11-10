/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import * as mc from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import * as meow from "../lib/index.js";
import { itemIds, getItemIcon } from "../lib/meow/LootTables.js";
import { Settings, MEOWFISH_VERSION } from "../SystemSettings.js";
import { fishingEvents } from "../lib/meow/FishingEvent.js";
import { CacheMetrics } from "../lib/meow/CacheMetrics.js";
import { parseLootFilter, encodeLootFilter, invalidateLootFilterCache, } from "../core/LootFilter.js";
import { showAboutForm } from "./AboutForm.js";

/** @type {Array<string|undefined>} 语言选项列表（含默认） */
const langOptions = [undefined, ...meow.language];

/** 正在打开设置界面的玩家（防止重复打开） */
const openingPlayers = new Set();

/**
 * 显示主菜单
 * @param {mc.Player} player - 玩家对象
 * @param {string} lang - 当前语言代码
 */
export function showIndexForm(player, lang) {
  const hasLootFilter =
    Settings.allow_loot_filter &&
    meow.getPlayerSetting(player, "lootFilterSwitch");
  const form = new ActionFormData()
    .title(meow.getLocalizedText("index_title", lang))
    .button(meow.getLocalizedText("index_basic", lang), "textures/ui/automation_glyph_color")
    .button(meow.getLocalizedText("index_language", lang), "textures/ui/world_glyph_color");
  if (hasLootFilter) form.button(meow.getLocalizedText("index_loot_filter", lang), "textures/ui/creative_icon");
  form.button(meow.getLocalizedText("index_advanced", lang), "textures/ui/creator_glyph_color")
    .button(meow.getLocalizedText("index_about", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      let idx = 0;
      if (result.selection === idx++) return showBasicForm(player, lang);
      if (result.selection === idx++) return showLanguageForm(player, lang);
      if (hasLootFilter && result.selection === idx++) return showItemForm(player, lang);
      if (result.selection === idx++) return showAdvancedForm(player, lang);
      if (result.selection === idx++) {
        return showAboutForm(player, lang, () => showIndexForm(player, lang));
      }
    });
}

/**
 * 显示基础设置表单
 * @param {mc.Player} player
 * @param {string} lang
 */
export function showBasicForm(player, lang) {
  const protect        = meow.getPlayerSetting(player, "protect");
  const replace        = meow.getPlayerSetting(player, "replace");
  const compulsoryAuto = meow.getPlayerSetting(player, "compulsoryAuto");
  const reduceSinking  = meow.getPlayerSetting(player, "reduceSinking");
  const tip            = meow.getPlayerSetting(player, "tip");
  const lootMode       = meow.getPlayerSetting(player, "lootMode");
  const particleMode   = meow.getPlayerSetting(player, "particleMode"); // 钳制已内置
  const volume         = meow.getPlayerSetting(player, "volume");       // 钳制已内置
  // const jungleLoot     = meow.getPlayerSetting(player, "jungleLoot");

  const form = new ModalFormData()
    .title(meow.getLocalizedText("setting_title", lang))
    .toggle(meow.getLocalizedText("setting_protect", lang), { defaultValue: protect })
    .toggle(meow.getLocalizedText("setting_replace", lang), { defaultValue: replace })
    .toggle(meow.getLocalizedText("setting_compulsoryAuto", lang), { defaultValue: compulsoryAuto })
    .toggle(meow.getLocalizedText("setting_reduceSinking", lang), { defaultValue: reduceSinking })
    .toggle(meow.getLocalizedText("setting_tip", lang), { defaultValue: tip })
    .dropdown(
      meow.getLocalizedText("setting_lootMode", lang),
      [
        meow.getLocalizedText("setting_lootMode_0", lang),
        meow.getLocalizedText("setting_lootMode_1", lang),
        meow.getLocalizedText("setting_lootMode_2", lang),
      ],
      { defaultValueIndex: lootMode },
    )
    .dropdown(
      meow.getLocalizedText("setting_particleMode", lang),
      [
        meow.getLocalizedText("setting_particleMode_0", lang),
        meow.getLocalizedText("setting_particleMode_1", lang),
        meow.getLocalizedText("setting_particleMode_2", lang),
      ].concat(Settings.fancy_particle ? [meow.getLocalizedText("setting_particleMode_3", lang)] : []),
      { defaultValueIndex: particleMode },
    )
    .slider(meow.getLocalizedText("setting_volume", lang), 0, 100, { defaultValue: volume * 100, valueStep: 1 });
  // if (Settings.allow_jungle_loot) {
  //   form.toggle(meow.getLocalizedText("setting_jungleLoot", lang), { defaultValue: jungleLoot });
  // }
  form.show(player).then(result => {
    if (result.canceled) {
      player.sendMessage(meow.getLocalizedText("setting_canceled", lang));
      return;
    }
    const values = result.formValues;
    let i = 0;
    meow.setPlayerSetting(player, "protect", values[i++]);
    meow.setPlayerSetting(player, "replace", values[i++]);
    meow.setPlayerSetting(player, "compulsoryAuto", values[i++]);
    meow.setPlayerSetting(player, "reduceSinking", values[i++]);
    meow.setPlayerSetting(player, "tip", values[i++]);
    meow.setPlayerSetting(player, "lootMode", values[i++]);
    meow.setPlayerSetting(player, "particleMode", values[i++]);
    meow.setPlayerSetting(player, "volume", values[i++] / 100);
    // if (Settings.allow_jungle_loot) {
    //   meow.setPlayerSetting(player, "jungleLoot", values[i++]);
    // }
    player.sendMessage(meow.getLocalizedText("setting_saved", lang));
  });
}

export function showLanguageForm(player, lang) {
  const hasExplicitLanguage = meow.hasPlayerSetting(player, "language");

  const form = new ActionFormData()
    .title(meow.getLocalizedText("language_title", lang))
    .body(meow.getLocalizedText("language_body", lang))
    .button(
      meow.getLocalizedText("language_default", lang, {
        lang: meow.getLocalizedText("lang", Settings.language),
      }),
      !hasExplicitLanguage ? "textures/ui/realms_green_check" : undefined,
    );
  for (let i = 0; i < meow.language.length; i++) {
    form.button(
      meow.getLocalizedText("lang", meow.language[i]),
      meow.language[i] === lang && hasExplicitLanguage
        ? "textures/ui/realms_green_check"
        : undefined,
    );
  }
  form.show(player).then(result => {
    if (result.canceled) return showIndexForm(player, lang);
    meow.setPlayerSetting(player, "language", langOptions[result.selection]);
    showLanguageForm(player, langOptions[result.selection]);
  });
}

/**
 * 显示物品筛选表单。
 *
 * 存储格式为压缩字符串：`首项|物品1|物品2|...`
 *   首项 "0" 正选 —— 列表内为排除项
 *   首项 "1" 反选 —— 列表内为保留项（列表外全部排除）
 * 只有被筛选的物品才会填入列表。
 *
 * @param {mc.Player} player
 * @param {string} lang
 */
export function showItemForm(player, lang) {
  const parsed = parseLootFilter(meow.getPlayerSetting(player, "lootFilter"));
  // 复制一份可变 Set，避免污染缓存中的共享集合
  const items = new Set(parsed.items);
  const inverted = parsed.inverted;

  // 合并 itemIds 与已存列表，保证已筛选的物品（含模组物品）始终可见
  const allItems = [...new Set([...itemIds, ...items])];

  const modeKey = inverted ? "item_form_mode_inverted" : "item_form_mode_positive";
  const bodyModeKey = inverted ? "item_form_body_inverted" : "item_form_body_positive";

  const form = new ActionFormData()
    .title(meow.getLocalizedText("item_form", lang))
    .body(meow.getLocalizedText("item_form_body_hint", lang) +
      "\n\n" + meow.getLocalizedText(bodyModeKey, lang))
    .button(meow.getLocalizedText("item_form_mode_switch", lang, {
      mode: meow.getLocalizedText(modeKey, lang),
    }), "textures/ui/icon_setting");

  for (const item of allItems) {
    const inList = items.has(item);
    const excluded = inverted ? !inList : inList;
    const label = excluded ? "§4" : "";
    form.button(
      { rawtext: [{ text: label }, meow.getItemTranslation(item)] },
      "textures/" + getItemIcon(item),
    );
  }

  form.show(player).then(result => {
    if (result.canceled) return showIndexForm(player, lang);

    // 第一个按钮：切换正选 / 反选
    if (result.selection === 0) {
      meow.setPlayerSetting(player, "lootFilter", encodeLootFilter(!inverted, items));
      invalidateLootFilterCache(player.id);
      return showItemForm(player, lang);
    }

    // 其余按钮：切换单个物品是否在列表中
    const item = allItems[result.selection - 1];
    if (item === undefined) return showItemForm(player, lang);
    if (items.has(item)) items.delete(item);
    else items.add(item);

    meow.setPlayerSetting(player, "lootFilter", encodeLootFilter(inverted, items));
    invalidateLootFilterCache(player.id);
    showItemForm(player, lang);
  });
}

export function showAdvancedForm(player, lang) {
  const form = new ActionFormData().title(meow.getLocalizedText("index_advanced", lang));
  const hasLootFilter = Settings.allow_loot_filter;
  const lootFilterSwitch = hasLootFilter ? meow.getPlayerSetting(player, "lootFilterSwitch") : 0;

  if (hasLootFilter) {
    form.button(
      meow.getLocalizedText("advanced_loot_filter", lang, {
        status: meow.getLocalizedText(
          lootFilterSwitch ? "advanced_loot_filter_on" : "advanced_loot_filter_off",
          lang,
        ),
      }),
    );
  }
  form.button(meow.getLocalizedText("index_admin", lang));
  form.button(meow.getLocalizedText("advanced_reset_all", lang));  // "textures/ui/trash",

  form.show(player).then(result => {
    if (result.canceled) return;
    let idx = 0;
    if (hasLootFilter) {
      if (result.selection === idx) {
        meow.setPlayerSetting(player, "lootFilterSwitch", lootFilterSwitch ^ 1);
        return showAdvancedForm(player, lang);
      }
      idx++;
    }
    if (result.selection === idx) {
      if (meow.isAdmin(player.id)) showAdminForm(player, lang);
      else showPermissionCheckForm(player, lang);
      return;
    }
    idx++;
    if (result.selection === idx) {
      return showResetAllConfirmForm(player, lang);
    }
    showAdvancedForm(player, lang);
  });
}

/**
 * 显示"退回默认设置"二次确认表单
 * @param {mc.Player} player
 * @param {string} lang
 */
function showResetAllConfirmForm(player, lang) {
  new MessageFormData()
    .title(meow.getLocalizedText("advanced_reset_all_title", lang))
    .body(meow.getLocalizedText("advanced_reset_all_body", lang))
    .button1(meow.getLocalizedText("advanced_reset_all_confirm", lang))
    .button2(meow.getLocalizedText("advanced_reset_all_cancel", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection !== 0) {
        return showAdvancedForm(player, lang);
      }
      meow.resetAllPlayerSettings(player);
      // 筛选设置也被清了，同步失效其缓存
      invalidateLootFilterCache(player.id);
      // 重新读取语言（重置后可能不再是原 lang）
      const newLang = meow.getPlayerSetting(player, "language");
      player.sendMessage(meow.getLocalizedText("advanced_reset_all_done", newLang));
      showIndexForm(player, newLang);
    });
}

export function showPermissionCheckForm(player, lang) {
  // 冻结期间直接进入冻结页，不提供可反复尝试的入口
  const remainingMs = meow.getFrozenRemainingMs(player.id);
  if (remainingMs > 0) return showAdminFrozenForm(player, lang, remainingMs);

  const form = new ModalFormData()
    .title(meow.getLocalizedText("permission_title", lang))
    .textField(
      meow.getLocalizedText("permission_key_label", lang),
      meow.getLocalizedText("permission_key_placeholder", lang),
    )
    .show(player).then(result => {
      if (result.canceled) return;
      const res = meow.activateAdmin(player.id, player.nameTag, result.formValues[0], lang);
      if (res.frozen) return showAdminFrozenForm(player, lang, res.remainingMs ?? 0);
      if (!res.success) return showValidationFailedForm(player, res.message, lang);
      showValidationSuccessfulForm(player, res.message, lang);
    });
}

export function showValidationFailedForm(player, message, lang) {
  new MessageFormData()
    .title(meow.getLocalizedText("permission_failed_title", lang))
    .body(`${message}`)
    .button1(meow.getLocalizedText("permission_retry", lang))
    .button2(meow.getLocalizedText("permission_close", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection === undefined || result.selection === 1) return;
      showPermissionCheckForm(player, lang);
    });
}

export function showValidationSuccessfulForm(player, message, lang) {
  new MessageFormData()
    .title(meow.getLocalizedText("permission_success_title", lang))
    .body(`${message}`)
    .button1(meow.getLocalizedText("permission_ok", lang))
    .button2(meow.getLocalizedText("permission_close", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection === undefined || result.selection === 1) return;
      showAdminForm(player, lang);
    });
}

/* ============================ 管理中心 ============================ */

/** 管理中心列表每页条数 */
const ADMIN_PAGE_SIZE = 12;

/** 状态机枚举 → 本地化键（未知状态回退到 fsm_state_unknown） */
const FSM_STATE_KEYS = {
  INIT: "fsm_state_init",
  SETTLING: "fsm_state_settling",
  FLOATING: "fsm_state_floating",
  ON_GROUND: "fsm_state_on_ground",
  ON_ENTITY: "fsm_state_on_entity",
};

/**
 * 状态机的本地化文本；不向玩家暴露原始枚举。
 * @param {string | null | undefined} state
 * @param {string} lang
 * @returns {string}
 */
function getFsmStateText(state, lang) {
  if (!state) return meow.getLocalizedText("fsm_state_none", lang);
  return meow.getLocalizedText(FSM_STATE_KEYS[state] ?? "fsm_state_unknown", lang);
}

/**
 * 缓存展示行（双轨制 + 智能单位压缩）
 * @param {object} cumulative - 累计数据
 * @param {object} recent - 近期数据
 * @param {string} lang
 * @returns {string}
 */
function getCacheDisplay(cumulative, recent, lang) {
  const labelTotal = meow.getLocalizedText("admin_cache_label_total", lang);
  const labelRecent = meow.getLocalizedText("admin_cache_label_recent", lang);
  const labelRate = meow.getLocalizedText("admin_cache_hit_rate", lang);
  const labelChecks = meow.getLocalizedText("admin_cache_checks", lang);

  // 命中率格式化：保留 3 位小数
  const formatRate = (snap) => 
    snap.hitRate !== null 
      ? snap.hitRate.toFixed(3) + "%%" 
      : meow.getLocalizedText("admin_cache_no_sample", lang);
    
  // 检查数格式化：调用通用工具函数
  const formatChecks = (snap) => meow.formatNumberCompact(snap.checks, lang);

  return [
    `  ${labelRate}: ${labelTotal} ${formatRate(cumulative)} | ${labelRecent} ${formatRate(recent)}`,
    `  ${labelChecks}: ${labelTotal} ${formatChecks(cumulative)} | ${labelRecent} ${formatChecks(recent)}`
  ].join("\n");
}

/**
 * 总页数（至少 1，保证空列表也有第 1 页）
 * @param {number} total
 * @returns {number}
 */
function getPageCount(total) {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}

/**
 * 页码钳制：内部 0 基，越界时回到有效范围。
 * @param {number} page
 * @param {number} pages
 * @returns {number}
 */
function clampPage(page, pages) {
  if (!Number.isFinite(page)) return 0;
  return Math.min(Math.max(Math.trunc(page), 0), pages - 1);
}

/**
 * 管理员权限复核；失效时提示并回到高级设置。
 * 页面入口与每个修改操作执行前都要调用。
 * @param {mc.Player} player
 * @param {string} lang
 * @returns {boolean}
 */
function requireAdmin(player, lang) {
  if (meow.isAdmin(player.id)) return true;
  player.sendMessage(meow.getLocalizedText("admin_permission_lost", lang));
  showAdvancedForm(player, lang);
  return false;
}

/**
 * 管理中心首页 / 概览
 * @param {mc.Player} player
 * @param {string} lang
 */
export function showAdminForm(player, lang) {
  if (!requireAdmin(player, lang)) return;

  const admins = meow.getAdminList();
  const running = fishingEvents.getRunningPlayers();
  const paused = fishingEvents.isAdminPaused();
  const pausedCount = paused ? fishingEvents.getAdminPauseSnapshot().length : 0;
  const globalStatus = paused
    ? (pausedCount > 0
      ? meow.getLocalizedText("admin_global_paused_count", lang, { count: pausedCount })
      : meow.getLocalizedText("admin_global_paused", lang))
    : meow.getLocalizedText("admin_global_running", lang);

  const cache = CacheMetrics.getSnapshot();
  const issues = meow.getRecentIssues().slice(0, 3);
  const issueText = issues.length > 0
    ? issues.map(issue => `· ${new Date(issue.at).toTimeString().slice(0, 5)} ${issue.message}`).join("\n")
    : meow.getLocalizedText("admin_no_issues", lang);

  const body = [
    `${meow.getLocalizedText("admin_label_version", lang)}: ${MEOWFISH_VERSION}`,
    `${meow.getLocalizedText("admin_label_admins", lang)}: ${admins.length}`,
    `${meow.getLocalizedText("admin_label_running", lang)}: ${running.length}`,
    `${meow.getLocalizedText("admin_label_global", lang)}: ${globalStatus}`,
    `${meow.getLocalizedText("admin_label_status_cache", lang)}: `,
    getCacheDisplay(cache.cumulative.status, cache.recent.status, lang),
    `${meow.getLocalizedText("admin_label_velocity_cache", lang)}: `,
    getCacheDisplay(cache.cumulative.velocity, cache.recent.velocity, lang),
    `${meow.getLocalizedText("admin_label_issues", lang)}:`,
    issueText,
  ].join("\n");

  const form = new ActionFormData()
    .title(meow.getLocalizedText("admin_center_title", lang))
    .body(body)
    .button(meow.getLocalizedText(paused ? "admin_btn_resume" : "admin_btn_pause", lang))
    .button(meow.getLocalizedText("admin_btn_players", lang))
    .button(meow.getLocalizedText("admin_btn_admins", lang))
    .button(meow.getLocalizedText("admin_btn_refresh", lang))
    .button(meow.getLocalizedText("admin_btn_back", lang));

  form.show(player).then(result => {
    if (result.canceled) return;
    if (result.selection === 0) {
      return paused
        ? showAdminResumeConfirmForm(player, lang)
        : showAdminPauseConfirmForm(player, lang);
    }
    if (result.selection === 1) return showAdminRunListForm(player, lang, 0);
    if (result.selection === 2) return showAdminListForm(player, lang, 0);
    if (result.selection === 3) return showAdminForm(player, lang);
    if (result.selection === 4) return showAdvancedForm(player, lang);
  });
}

/**
 * 临时暂停全局自动钓鱼的二次确认
 * @param {mc.Player} player
 * @param {string} lang
 */
export function showAdminPauseConfirmForm(player, lang) {
  if (!requireAdmin(player, lang)) return;

  new MessageFormData()
    .title(meow.getLocalizedText("admin_confirm_pause_title", lang))
    .body(meow.getLocalizedText("admin_confirm_pause_body", lang))
    .button1(meow.getLocalizedText("admin_confirm_pause_title", lang))
    .button2(meow.getLocalizedText("advanced_reset_all_cancel", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection !== 0) return showAdminForm(player, lang);
      if (!requireAdmin(player, lang)) return;
      const res = fishingEvents.pauseAdmin();
      player.sendMessage(meow.getLocalizedText(
        res.already ? "admin_pause_already" : "admin_paused_done", lang, { count: res.count },
      ));
      showAdminForm(player, lang);
    });
}

/**
 * 恢复全局自动钓鱼的二次确认
 * @param {mc.Player} player
 * @param {string} lang
 */
export function showAdminResumeConfirmForm(player, lang) {
  if (!requireAdmin(player, lang)) return;

  new MessageFormData()
    .title(meow.getLocalizedText("admin_confirm_resume_title", lang))
    .body(meow.getLocalizedText("admin_confirm_resume_body", lang))
    .button1(meow.getLocalizedText("admin_confirm_resume_title", lang))
    .button2(meow.getLocalizedText("advanced_reset_all_cancel", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection !== 0) return showAdminForm(player, lang);
      if (!requireAdmin(player, lang)) return;
      const res = fishingEvents.resumeAdmin();
      player.sendMessage(meow.getLocalizedText(
        res.already ? "admin_resume_already" : "admin_resumed_done",
        lang,
        { restored: res.restored, skipped: res.skipped },
      ));
      showAdminForm(player, lang);
    });
}

/**
 * 运行中的玩家列表
 * @param {mc.Player} player
 * @param {string} lang
 * @param {number} [page] 0 基页码
 */
export function showAdminRunListForm(player, lang, page = 0) {
  if (!requireAdmin(player, lang)) return;

  const players = fishingEvents.getRunningPlayers();
  const pages = getPageCount(players.length);
  const current = clampPage(page, pages);
  const start = current * ADMIN_PAGE_SIZE;
  const pageItems = players.slice(start, start + ADMIN_PAGE_SIZE);

  let body = meow.getLocalizedText("admin_players_body", lang, {
    count: players.length,
    page: current + 1,
    pages,
  });
  if (players.length === 0) {
    body += "\n\n" + meow.getLocalizedText("admin_players_empty", lang);
  }

  const form = new ActionFormData()
    .title(meow.getLocalizedText("admin_players_title", lang))
    .body(body);
  for (const item of pageItems) {
    form.button(meow.getLocalizedText("admin_player_line", lang, {
      name: item.name,
      state: getFsmStateText(item.state, lang),
    }));
  }
  form.button(meow.getLocalizedText("admin_btn_prev", lang));
  form.button(meow.getLocalizedText("admin_btn_next", lang));
  form.button(meow.getLocalizedText("admin_btn_back", lang));

  form.show(player).then(result => {
    if (result.canceled) return;
    const selection = result.selection;
    if (selection < pageItems.length) {
      return showAdminRunDetailForm(player, lang, pageItems[selection].id);
    }
    if (selection === pageItems.length) return showAdminRunListForm(player, lang, current - 1);
    if (selection === pageItems.length + 1) return showAdminRunListForm(player, lang, current + 1);
    return showAdminForm(player, lang);
  });
}

/**
 * 单个玩家的运行状态详情
 * @param {mc.Player} player
 * @param {string} lang
 * @param {string} playerId
 */
export function showAdminRunDetailForm(player, lang, playerId) {
  if (!requireAdmin(player, lang)) return;

  const target = fishingEvents.getRunningPlayers().find(item => item.id === playerId);
  if (!target) {
    player.sendMessage(meow.getLocalizedText("admin_player_gone", lang));
    return showAdminRunListForm(player, lang, 0);
  }

  const state = fishingEvents.getPlayerState(playerId);
  const body = meow.getLocalizedText("admin_player_detail_body", lang, {
    state: getFsmStateText(state?.state, lang),
    dimension: state?.dimension ?? "-",
    hookId: state?.hookId ?? "-",
  });

  new ActionFormData()
    .title(meow.getLocalizedText("admin_player_detail_title", lang, { name: target.name }))
    .body(body)
    .button(meow.getLocalizedText("admin_btn_stop", lang))
    .button(meow.getLocalizedText("admin_btn_back", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      if (result.selection === 0) return showAdminStopConfirmForm(player, lang, playerId);
      showAdminRunListForm(player, lang, 0);
    });
}

/**
 * 停止单个玩家会话的二次确认
 * @param {mc.Player} player
 * @param {string} lang
 * @param {string} playerId
 */
export function showAdminStopConfirmForm(player, lang, playerId) {
  if (!requireAdmin(player, lang)) return;

  const target = fishingEvents.getRunningPlayers().find(item => item.id === playerId);
  if (!target) {
    player.sendMessage(meow.getLocalizedText("admin_player_gone", lang));
    return showAdminRunListForm(player, lang, 0);
  }

  new MessageFormData()
    .title(meow.getLocalizedText("admin_confirm_stop_title", lang))
    .body(meow.getLocalizedText("admin_confirm_stop_body", lang, { name: target.name }))
    .button1(meow.getLocalizedText("admin_confirm_stop_title", lang))
    .button2(meow.getLocalizedText("advanced_reset_all_cancel", lang))
    .show(player).then(result => {
      if (result.canceled || result.selection !== 0) return;
      if (!requireAdmin(player, lang)) return;
      const stopped = fishingEvents.stopPlayerSession(playerId);
      player.sendMessage(meow.getLocalizedText(
        stopped ? "admin_player_stopped" : "admin_player_gone", lang, { name: target.name },
      ));
      showAdminRunListForm(player, lang, 0);
    });
}

/**
 * 管理员名单（只读）
 * @param {mc.Player} player
 * @param {string} lang
 * @param {number} [page] 0 基页码
 */
export function showAdminListForm(player, lang, page = 0) {
  if (!requireAdmin(player, lang)) return;

  const admins = meow.getAdminList();
  const pages = getPageCount(admins.length);
  const current = clampPage(page, pages);
  const start = current * ADMIN_PAGE_SIZE;
  const pageItems = admins.slice(start, start + ADMIN_PAGE_SIZE);

  const sections = [meow.getLocalizedText("admin_admins_body", lang, {
    count: admins.length,
    page: current + 1,
    pages,
  })];
  if (admins.length === 0) {
    sections.push(meow.getLocalizedText("admin_admins_empty", lang));
  } else {
    sections.push(pageItems.map(item => meow.getLocalizedText("admin_admin_line", lang, {
      name: item.name,
      id: item.id,
    })).join("\n"));
  }

  new ActionFormData()
    .title(meow.getLocalizedText("admin_admins_title", lang))
    .body(sections.join("\n\n"))
    .button(meow.getLocalizedText("admin_btn_prev", lang))
    .button(meow.getLocalizedText("admin_btn_next", lang))
    .button(meow.getLocalizedText("admin_btn_refresh", lang))
    .button(meow.getLocalizedText("admin_btn_back", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      if (result.selection === 0) return showAdminListForm(player, lang, current - 1);
      if (result.selection === 1) return showAdminListForm(player, lang, current + 1);
      if (result.selection === 2) return showAdminListForm(player, lang, current);
      showAdminForm(player, lang);
    });
}

/**
 * 管理员验证冻结页：只有一个关闭按钮，不提供重试入口
 * @param {mc.Player} player
 * @param {string} lang
 * @param {number} remainingMs
 */
export function showAdminFrozenForm(player, lang, remainingMs) {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60000));

  new ActionFormData()
    .title(meow.getLocalizedText("admin_frozen_title", lang))
    .body(meow.getLocalizedText("admin_frozen_body", lang, { minutes }))
    .button(meow.getLocalizedText("admin_btn_close", lang))
    .show(player).then(result => {
      if (result.canceled) return;
      showAdvancedForm(player, lang);
    });
}

/**
 * 注册物品使用事件（打开设置界面）
 * @listens mc.world.beforeEvents.itemUse
 */
export function registerSettingTrigger() {
  mc.world.beforeEvents.itemUse.subscribe(event => {
    const { itemStack, source: player } = event;
    if (itemStack.typeId !== "minecraft:paper" || !["MF设置", "MF設置", "MFSetting"].includes(itemStack.nameTag)) return;
    event.cancel = true;
    if (openingPlayers.has(player.id)) return;
    openingPlayers.add(player.id);
    mc.system.runTimeout(() => openingPlayers.delete(player.id), 10);
    const lang = meow.getPlayerSetting(player, "language");
    mc.system.run(() => showIndexForm(player, lang));
  });
}
