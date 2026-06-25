import { createInitialProtoCreateLabState } from "./story_create_lab_data.js";
import { calculateStoryLevel, getCreateUnitMaxCostByLevel } from "./story_exp.js";

const STORY_SAVE_KEY = "gbs_story_save_v1";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDefaultStorySave() {
  return {
    version: 1,

    progress: {
      currentChapter: 1,
      clearedChapters: [],
      clearedEvents: []
    },

    flags: {
      chapter1Cleared: false,
      labUnlocked: false,
      storyMenuUnlocked: false,
      companionSystemUnlocked: false
    },

    inventory: {
      slots: [
        "generic_machine_gun",
        "generic_burst_rifle",
        "heal_30",
        "heal_60",
        "evade_1",
        "evade_2",
        "beam_gun",
        "energy_sword",
        "bazooka",
        "melee_15x2",
        "suicide_kick",
        "kick_30"
      ],
      equipments: [
        "shield"
      ],
      skills: [
        "round_force"
      ]
    },

    createUnits: {
      proto_create_gundam: {
        id: "proto_create_gundam",
        name: "プロトクリエイトガンダム",
        totalExp: 0,
        lab: createInitialProtoCreateLabState()
      }
    },

    companionUnits: {}
  };
}

export function loadStorySave() {
  const raw = localStorage.getItem(STORY_SAVE_KEY);
  if (!raw) {
    const save = createDefaultStorySave();
    saveStorySave(save);
    return save;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeStorySave(parsed);
  } catch {
    const save = createDefaultStorySave();
    saveStorySave(save);
    return save;
  }
}

export function saveStorySave(save) {
  localStorage.setItem(STORY_SAVE_KEY, JSON.stringify(normalizeStorySave(save)));
}

export function resetStorySave() {
  const save = createDefaultStorySave();
  saveStorySave(save);
  return save;
}

export function exportStorySaveText() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(loadStorySave()))));
}

export function importStorySaveText(text) {
  const decoded = JSON.parse(decodeURIComponent(escape(atob(String(text || "")))));
  const save = normalizeStorySave(decoded);
  saveStorySave(save);
  return save;
}

export function normalizeStorySave(input) {
  const base = createDefaultStorySave();
  const src = input && typeof input === "object" ? input : {};

  const save = {
    ...base,
    ...src,
    progress: {
      ...base.progress,
      ...(src.progress || {})
    },
    flags: {
      ...base.flags,
      ...(src.flags || {})
    },
    inventory: {
      slots: Array.isArray(src.inventory?.slots) ? src.inventory.slots : base.inventory.slots,
      equipments: Array.isArray(src.inventory?.equipments) ? src.inventory.equipments : base.inventory.equipments,
      skills: Array.isArray(src.inventory?.skills) ? src.inventory.skills : base.inventory.skills
    },
    createUnits: {
      ...base.createUnits,
      ...(src.createUnits || {})
    },
    companionUnits: {
      ...(src.companionUnits || {})
    }
  };

  if (!save.createUnits.proto_create_gundam) {
    save.createUnits.proto_create_gundam = deepClone(base.createUnits.proto_create_gundam);
  }

  const proto = save.createUnits.proto_create_gundam;
  if (!proto.lab) proto.lab = createInitialProtoCreateLabState();
  if (typeof proto.totalExp !== "number") proto.totalExp = 0;

  return save;
}

export function getProtoCreateStoryUnit(save = loadStorySave()) {
  return normalizeStorySave(save).createUnits.proto_create_gundam;
}

export function getProtoCreateLevelInfo(save = loadStorySave()) {
  const unit = getProtoCreateStoryUnit(save);
  return calculateStoryLevel(unit.totalExp);
}

export function getProtoCreateMaxCost(save = loadStorySave()) {
  const levelInfo = getProtoCreateLevelInfo(save);
  return getCreateUnitMaxCostByLevel(levelInfo.level, 100);
}

export function updateProtoCreateLabState(updater) {
  const save = loadStorySave();
  const unit = save.createUnits.proto_create_gundam;

  const currentLab = unit.lab || createInitialProtoCreateLabState();
  const nextLab = typeof updater === "function"
    ? updater(deepClone(currentLab))
    : updater;

  unit.lab = nextLab || currentLab;
  saveStorySave(save);
  return loadStorySave();
}

export function addProtoCreateExp(amount) {
  const save = loadStorySave();
  const unit = save.createUnits.proto_create_gundam;
  unit.totalExp = Math.max(0, Math.floor(Number(unit.totalExp || 0) + Number(amount || 0)));
  saveStorySave(save);
  return loadStorySave();
}

export function setStoryFlag(flagName, value = true) {
  const save = loadStorySave();
  save.flags[flagName] = value;
  saveStorySave(save);
  return loadStorySave();
}

export function hasStoryFlag(flagName) {
  return loadStorySave().flags[flagName] === true;
}
