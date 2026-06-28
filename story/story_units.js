import { buildProtoCreateGundamUnit } from "../js/js_units_proto_create_gundam.js";
import { loadStorySave } from "./story_save.js";

const storyCreateUnitLabOverrides = {};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSaveWithLabOverride(unitId) {
  const save = loadStorySave();
  const overrideLab = storyCreateUnitLabOverrides[unitId];

  if (!overrideLab) {
    return save;
  }

  return {
    ...save,
    createUnits: {
      ...(save.createUnits || {}),
      [unitId]: {
        ...(save.createUnits?.[unitId] || {}),
        lab: clone(overrideLab)
      }
    }
  };
}

export function setStoryCreateUnitLabOverride(unitId, labState) {
  if (!unitId || !labState) return;
  storyCreateUnitLabOverrides[unitId] = clone(labState);
}

export function clearStoryCreateUnitLabOverride(unitId) {
  if (!unitId) return;
  delete storyCreateUnitLabOverrides[unitId];
}

export function clearAllStoryCreateUnitLabOverrides() {
  Object.keys(storyCreateUnitLabOverrides).forEach(unitId => {
    delete storyCreateUnitLabOverrides[unitId];
  });
}

export function getStoryCreateUnit(unitId) {
  if (unitId === "proto_create_gundam") {
    return buildProtoCreateGundamUnit(buildSaveWithLabOverride(unitId));
  }

  return null;
}

export function getStoryCreateUnitList() {
  return [
    buildProtoCreateGundamUnit(buildSaveWithLabOverride("proto_create_gundam"))
  ];
}

export function getStoryUnitName(unitId) {
  const unit = getStoryCreateUnit(unitId);
  return unit?.name || unitId;
}
