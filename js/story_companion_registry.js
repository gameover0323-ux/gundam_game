import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";
import { story_gundam } from "../js/js_units_story_gundam.js";

export const STORY_COMPANION_UNITS = [
  story_zaku_ii_gene,
  story_zaku_ii_denim,
  story_gundam
];

export function buildStoryCompanionOptions() {
  return [
    {
      id: "none",
      label: "なし",
      cost: 0,
      detail: ""
    },
    ...STORY_COMPANION_UNITS
      .filter(unit => unit?.storyCompanion)
      .map(unit => ({
        id: unit.id,
        label: unit.name,
        cost: Number(unit.storyCompanion?.cost || 0),
        detail: unit.storyCompanion?.unlockCondition || "",
        sourceUnitId: unit.id
      }))
  ];
}
