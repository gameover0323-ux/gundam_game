import { buildProtoCreateGundamUnit } from "../js/js_units_proto_create_gundam.js";
import { loadStorySave } from "./story_save.js";

export function getStoryCreateUnit(unitId) {
  const save = loadStorySave();

  if (unitId === "proto_create_gundam") {
    return buildProtoCreateGundamUnit(save);
  }

  return null;
}

export function getStoryCreateUnitList() {
  const save = loadStorySave();

  return [
    buildProtoCreateGundamUnit(save)
  ];
}

export function getStoryUnitName(unitId) {
  const unit = getStoryCreateUnit(unitId);
  return unit?.name || unitId;
}
