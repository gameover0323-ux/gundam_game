import { loadStorySave } from "../story/story_save.js";
import { buildProtoCreateGundamUnit } from "./js_units_proto_create_gundam.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function isCreateGundamLiberalUnlocked(save = loadStorySave()) {
  return save?.liberal?.unlocked === true || save?.flags?.createGundamLiberalUnlocked === true;
}

export function getCreateGundamLiberalCustomName(save = loadStorySave()) {
  const liberal = save?.liberal || {};
  return String(liberal.customName || liberal.name || "").trim() || "クリエイトガンダムリベラル";
}

export function buildCreateGundamLiberalUnit(save = loadStorySave()) {
  const base = buildProtoCreateGundamUnit(save);
  const unit = clone(base);
  const liberal = save?.liberal || {};
  const customName = getCreateGundamLiberalCustomName(save);

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
      const safeLabel = String(label || "").trim();
      if (safeLabel && form.slots?.[slotKey]) {
        form.slots[slotKey].label = safeLabel;
      }
    });
  }

  return unit;
}
