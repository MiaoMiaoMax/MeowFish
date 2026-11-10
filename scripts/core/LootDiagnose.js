/*
  MeowFish-AutoFish
  Copyright (c) 2025 MiaoMiaoMax (2025-present)

  本作品采用知识共享署名-非商业性-相同方式共享 4.0 国际许可协议进行许可。 要查看此许可证的副本，请访问
  https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

  This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc-sa/4.0/
*/

import { findTable, resolveCount, normalizeLuck } from "./LootTableHelper.js";
import { warn } from "../lib/meow/Logging.js";

/** 已诊断过的表 id，避免重复输出 */
const diagnosedTables = new Set();

/* ------------------------------ 诊断 ------------------------------------ */

/**
 * 诊断指定战利品表，返回一行摘要；详细信息仅在首次诊断时输出到控制台。
 * @param {string} tableId
 * @param {any} [luckLevel] - 可选，输出实际传入的 luckLevel 便于对比
 * @returns {string}
 */
export function diagnoseTable(tableId, luckLevel) {
  const isFirst = !diagnosedTables.has(tableId);
  if (isFirst) diagnosedTables.add(tableId);

  const lines = [];
  const visited = new Set();

  function walk(id, depth) {
    const indent = "  ".repeat(depth);
    const table = findTable(id);
    if (!table) {
      lines.push(`${indent}✗ 表 "${id}" 不存在（主数据与底牌均未找到）`);
      return null;
    }

    if (visited.has(id)) {
      lines.push(`${indent}[循环引用] ${id}`);
      return null;
    }
    visited.add(id);

    const pools = table.pools || [];
    lines.push(`${indent}表 "${id}"：pool 数量 ${pools.length}`);
    if (pools.length === 0) {
      lines.push(`${indent}  ✗ 没有 pool`);
      return [];
    }

    const subSummaries = [];
    let hasValidEntry = false;

    pools.forEach((pool, pi) => {
      const entries = pool.entries || [];
      const rolls = resolveCount(pool.rolls, 1);
      const bonus = resolveCount(pool.bonus_rolls, 0);
      lines.push(`${indent}  Pool #${pi}: rolls=${JSON.stringify(pool.rolls)} bonus_rolls=${JSON.stringify(pool.bonus_rolls)} → 掷取 ${rolls + bonus} 次`);
      lines.push(`${indent}    entries 数量 ${entries.length}`);

      if (entries.length === 0) {
        lines.push(`${indent}    ✗ 没有条目`);
        return;
      }

      entries.forEach((e, ei) => {
        const eid = e.id || "(无 id)";
        const etype = e.type || "(无 type)";
        const ew = e.weight ?? 0;
        const eq = e.quality ?? 0;
        const luck0W = ew + eq * 0;

        let status = "";
        const subTable = findTable(eid);
        if (subTable) {
          status = etype === "loot_table"
            ? "✓ 子表存在"
            : `⚠ type="${etype}" 但 id 在表中找到，按子表处理`;
          if (depth < 2) {
            const subSummary = walk(eid, depth + 1);
            subSummaries.push(`${eid.split("/").pop()}${subSummary ? "" : "✗"}`);
          }
        } else if (etype === "loot_table") {
          status = "✗ 子表缺失";
        } else if (etype === "item") {
          status = "物品";
        } else if (etype === "empty") {
          status = "空条目";
        } else {
          status = `⚠ 未知 type="${etype}"，且 id 找不到表`;
        }

        if (luck0W > 0 && etype !== "empty") hasValidEntry = true;

        lines.push(`${indent}    [${ei}] id="${eid}" type="${etype}" weight=${ew} quality=${eq} luck0权重=${luck0W} → ${status}`);
      });
    });

    if (!hasValidEntry) {
      lines.push(`${indent}  ✗ luck=0 下没有任何有效条目（权重全 ≤0 或 type=empty）`);
    }

    return subSummaries;
  }

  const subSummaries = walk(tableId, 0);

  let summary;
  if (subSummaries === null) summary = "表不存在";
  else if (subSummaries.length > 0) summary = "子表: " + subSummaries.join(" ");
  else summary = "无子表";

  if (isFirst) {
    const luckNote = luckLevel === undefined
      ? ""
      : `\n实际 luckLevel 原始值=${JSON.stringify(luckLevel)}（类型=${typeof luckLevel}），归一化后=${normalizeLuck(luckLevel)}`;
    warn(`战利品诊断: 表 "${tableId}" 掷取结果为空${luckNote}\n${lines.join("\n")}`);
  }

  return summary;
}
