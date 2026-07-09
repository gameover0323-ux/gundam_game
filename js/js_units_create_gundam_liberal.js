import { loadStorySave } from "../story/story_save.js";
import { buildProtoCreateGundamUnit } from "./js_units_proto_create_gundam.js";

export function isCreateGundamLiberalUnlocked(save = loadStorySave()) {
  return save?.liberal?.unlocked === true || save?.flags?.createGundamLiberalUnlocked === true;
}

export function buildCreateGundamLiberalUnit(save = loadStorySave()) {
  const base = buildProtoCreateGundamUnit(save);
  const liberal = save?.liberal || {};
  const customName = String(liberal.customName || "").trim() || "クリエイトガンダムリベラル";

  const unit = JSON.parse(JSON.stringify(base));

  unit.id = "create_gundam_liberal";
  unit.name = customName;
  unit.defaultFormId = "normal";
  unit.storyOnly = false;
  unit.isCreateGundamLiberal = true;

  delete unit.storyLevel;
  delete unit.storyTotalExp;
  delete unit.storyMaxCost;

  const form = unit.forms?.normal;
  if (form) {
    form.name = customName;

    Object.entries(liberal.customLabels?.slot || {}).forEach(([slotKey, label]) => {
      if (form.slots?.[slotKey] && String(label || "").trim()) {
        form.slots[slotKey].label = String(label).trim();
      }
    });
  }

  return unit;
}
