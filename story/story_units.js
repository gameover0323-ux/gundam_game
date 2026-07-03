import { buildProtoCreateGundamUnit } from "../js/js_units_proto_create_gundam.js";
import { gundam_mc } from "../js/js_units_gundam_mc.js";
import { loadStorySave } from "./story_save.js";

const storyCreateUnitLabOverrides = {};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSaveWithLabOverride(unitId) {
  const save = loadStorySave();
  const overrideLab = storyCreateUnitLabOverrides[unitId];

  if (!overrideLab) return save;

  return {
    ...save,
    createUnits: {
      ...(save.createUnits || {}),
      proto_create_gundam: {
        ...(save.createUnits?.proto_create_gundam || {}),
        lab: clone(overrideLab)
      }
    }
  };
}

function renameUnitEverywhere(unit, name) {
  const next = clone(unit);
  next.name = name;

  Object.values(next.forms || {}).forEach(form => {
    form.name = name;
  });

  return next;
}

function buildLiberalBaseUnit(save) {
  const proto = buildProtoCreateGundamUnit(save);
  proto.id = "create_gundam_liberal";
  proto.name = save.liberal?.customName || "クリエイトガンダムリベラル";

  Object.values(proto.forms || {}).forEach(form => {
    form.name = proto.name;
  });

  return proto;
}

function buildLiberalGaUnit(save) {
  const activeGaUnitId = save.liberal?.activeGaUnitId || "none";

  if (activeGaUnitId === "cpu_gundam_mc") {
    const unit = renameUnitEverywhere(gundam_mc, save.liberal?.customName || "クリエイトガンダムリベラル");
    unit.id = "gundam_mc";
    unit.storyLiberalGaSourceUnitId = "cpu_gundam_mc";
    unit.storyLiberal = true;
    return unit;
  }

  return buildLiberalBaseUnit(save);
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
  const save = buildSaveWithLabOverride(unitId);

  if (unitId === "proto_create_gundam") {
    return buildProtoCreateGundamUnit(save);
  }

  if (unitId === "create_gundam_liberal") {
    if (save.liberal?.unlocked !== true) return null;
    return buildLiberalGaUnit(save);
  }

  return null;
}

export function getActiveStoryCreateUnit() {
  const save = loadStorySave();
  const unitId = save.activeCreateUnitId || "proto_create_gundam";
  return getStoryCreateUnit(unitId) || getStoryCreateUnit("proto_create_gundam");
}

export function getStoryCreateUnitList() {
  const save = loadStorySave();
  const units = [getStoryCreateUnit("proto_create_gundam")];

  if (save.liberal?.unlocked === true) {
    units.push(getStoryCreateUnit("create_gundam_liberal"));
  }

  return units.filter(Boolean);
}

export function getStoryUnitName(unitId) {
  const unit = getStoryCreateUnit(unitId);
  return unit?.name || unitId;
}
