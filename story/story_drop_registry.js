import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";
import { story_gundam } from "../js/js_units_story_gundam.js";
import { story_ball } from "../js/js_units_story_ball.js";
import { story_gm } from "../js/js_units_story_gm.js";
import { getStoryHiddenDropOptions } from "./story_hidden_drops.js";


export const STORY_DROP_SOURCE_UNITS = [
  story_zaku_ii_gene,
  story_zaku_ii_denim,
  story_gundam,
  story_ball,
  story_gm
];

export function collectStoryDropOptions(kind = "slot") {
  const result = [];

  STORY_DROP_SOURCE_UNITS.forEach(unit => {
    const drops = unit?.storyDrops;
    if (!drops) return;

    const groups = [
      ...(Array.isArray(drops.initial) ? drops.initial : []),
      ...(Array.isArray(drops.random) ? drops.random : []),
      ...(Array.isArray(drops.conditional) ? drops.conditional : []),
      ...(Array.isArray(drops.equipment) ? drops.equipment : [])
    ];

    groups.forEach(drop => {
      if (!drop?.id) return;

      if (kind === "slot" && drop.slotKey) {
        result.push({
          ...drop,
          sourceUnitId: unit.id,
          sourceUnitName: unit.name,
          shortLabel: `${String(drop.slotKey).replace("slot", "")}.${drop.label}`
        });
      }

      if (kind === "equipment" && !drop.slotKey && drop.data?.kind !== "create_skill") {
        result.push({
          ...drop,
          sourceUnitId: unit.id,
          sourceUnitName: unit.name
        });
      }

      if (kind === "skill" && drop.data?.kind === "create_skill") {
        result.push({
          ...drop,
          sourceUnitId: unit.id,
          sourceUnitName: unit.name
        });
      }
    });
  });

    result.push(...getStoryHiddenDropOptions(kind));
  return result;
}
