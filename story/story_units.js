import { buildProtoCreateGundamUnit } from "../js/js_units_proto_create_gundam.js";

import { gundam_mc } from "../js/js_units_gundam_mc.js";
import { z_gundam } from "../js/js_units_z_gundam.js";
import { shining_gundam } from "../js/js_units_shining_gundam.js";
import { wing_zero } from "../js/js_units_wing_zero.js";
import { v2_gundam } from "../js/js_units_v2_gundam.js";
import { strike_gundam } from "../js/js_units_strike_gundam.js";
import { freedom_gundam } from "../js/js_units_freedom_gundam.js";
import { exia } from "../js/js_units_exia.js";
import { unicorn_gundam } from "../js/js_units_unicorn_gundam.js";
import { g_self } from "../js/js_units_g_self.js";
import { barbatos } from "../js/js_units_barbatos.js";
import { aerial } from "../js/js_units_aerial.js";
import { jegan_d_type } from "../js/js_units_jegan_d_type.js";
import { zudah } from "../js/js_units_zudah.js";

import { loadStorySave } from "./story_save.js";

const storyCreateUnitLabOverrides = {};

const GA_CPU_TO_PLAYABLE_UNIT_MAP = {
  cpu_gundam_mc: gundam_mc,
  cpu_z_gundam: z_gundam,
  cpu_shining_gundam: shining_gundam,
  cpu_wing_zero: wing_zero,
  cpu_v2_gundam: v2_gundam,
  cpu_strike_gundam: strike_gundam,
  cpu_freedom_gundam: freedom_gundam,
  cpu_exia: exia,
  cpu_unicorn_gundam: unicorn_gundam,
  cpu_g_self: g_self,
  cpu_barbatos: barbatos,
  cpu_aerial: aerial,
  cpu_jegan_d_type: jegan_d_type,
  cpu_zudah: zudah
};

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
  const playableUnit = GA_CPU_TO_PLAYABLE_UNIT_MAP[activeGaUnitId];

  if (!playableUnit) {
    return buildLiberalBaseUnit(save);
  }

  const unit = renameUnitEverywhere(
    playableUnit,
    save.liberal?.customName || "クリエイトガンダムリベラル"
  );

  unit.id = playableUnit.id;
  unit.storyLiberal = true;
  unit.storyLiberalGaSourceUnitId = activeGaUnitId;

  return unit;
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
