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
      equipments: ["shield"],
      skills: ["round_force"],
      storyDrops: {}
    },
    createUnits: {
      proto_create_gundam: {
        id: "proto_create_gundam",
        name: "プロトクリエイトガンダム",
        totalExp: 0,
        lab: createInitialProtoCreateLabState()
      }
    },
    activeCreateUnitId: "proto_create_gundam",
    liberal: {
      unlocked: false,
      activeGaUnitId: "none",
      customName: "クリエイトガンダムリベラル",
      gaUnits: {}
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
    return normalizeStorySave(JSON.parse(raw));
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
      skills: Array.isArray(src.inventory?.skills) ? src.inventory.skills : base.inventory.skills,
      storyDrops: src.inventory?.storyDrops && typeof src.inventory.storyDrops === "object"
        ? src.inventory.storyDrops
        : {}
    },
    createUnits: {
      ...base.createUnits,
      ...(src.createUnits || {})
    },
    activeCreateUnitId: src.activeCreateUnitId || "proto_create_gundam",
    liberal: {
      ...base.liberal,
      ...(src.liberal || {}),
      gaUnits: src.liberal?.gaUnits && typeof src.liberal.gaUnits === "object"
        ? src.liberal.gaUnits
        : {}
    },
    companionUnits: {
      ...(src.companionUnits || {})
    }
  };

  if (save.flags.createGundamLiberalUnlocked === true) {
    save.liberal.unlocked = true;
  }

  if (!save.createUnits.proto_create_gundam) {
    save.createUnits.proto_create_gundam = deepClone(base.createUnits.proto_create_gundam);
  }

  const proto = save.createUnits.proto_create_gundam;
  if (!proto.lab) proto.lab = createInitialProtoCreateLabState();
  if (typeof proto.totalExp !== "number") proto.totalExp = 0;
  if (!proto.lab.companion) proto.lab.companion = "none";

  if (save.activeCreateUnitId !== "create_gundam_liberal") {
    save.activeCreateUnitId = "proto_create_gundam";
  }

  if (save.liberal.unlocked !== true) {
    save.activeCreateUnitId = "proto_create_gundam";
  }

  Object.keys(save.companionUnits || {}).forEach(unitId => {
    const unit = save.companionUnits[unitId] || {};
    save.companionUnits[unitId] = {
      ...unit,
      unlocked: unit.unlocked === true,
      cost: Number(unit.cost || 0),
      totalExp: Number(unit.totalExp || 0)
    };
  });

  return save;
}

export function getProtoCreateStoryUnit(save = loadStorySave()) {
  return normalizeStorySave(save).createUnits.proto_create_gundam;
}

export function getProtoCreateLevelInfo(save = loadStorySave()) {
  return calculateStoryLevel(getProtoCreateStoryUnit(save).totalExp);
}

export function getProtoCreateMaxCost(save = loadStorySave()) {
  return getCreateUnitMaxCostByLevel(getProtoCreateLevelInfo(save).level, 100);
}

export function getStoryUnitTotalExp(unitId, save = loadStorySave()) {
  const normalized = normalizeStorySave(save);

  if (unitId === "proto_create_gundam" || unitId === "create_gundam_liberal") {
    return Number(normalized.createUnits.proto_create_gundam.totalExp || 0);
  }

  return Number(normalized.companionUnits?.[unitId]?.totalExp || 0);
}

export function getStoryUnitLevelInfo(unitId, save = loadStorySave()) {
  return calculateStoryLevel(getStoryUnitTotalExp(unitId, save));
}

export function getStoryLevelBattleBonus(unitId, save = loadStorySave()) {
  const level = getStoryUnitLevelInfo(unitId, save).level;
  return {
    level,
    criticalRateBonus: level / 2,
    damageReductionRate: level / 2
  };
}

export function addStoryUnitExp(unitId, amount) {
  const save = loadStorySave();
  const add = Math.max(0, Math.floor(Number(amount || 0)));

  if (unitId === "proto_create_gundam" || unitId === "create_gundam_liberal") {
    save.createUnits.proto_create_gundam.totalExp =
      Math.max(0, Number(save.createUnits.proto_create_gundam.totalExp || 0) + add);
  } else {
    if (!save.companionUnits[unitId]) {
      save.companionUnits[unitId] = { unlocked: false, cost: 0, totalExp: 0 };
    }
    save.companionUnits[unitId].totalExp =
      Math.max(0, Number(save.companionUnits[unitId].totalExp || 0) + add);
  }

  saveStorySave(save);
  return loadStorySave();
}

export function addProtoCreateExp(amount) {
  return addStoryUnitExp("proto_create_gundam", amount);
}

export function unlockStoryCompanionUnit(unitId, cost = 0) {
  const save = loadStorySave();

  save.companionUnits[unitId] = {
    ...(save.companionUnits[unitId] || {}),
    unlocked: true,
    cost: Number(cost || save.companionUnits[unitId]?.cost || 0),
    totalExp: Number(save.companionUnits[unitId]?.totalExp || 0)
  };

  saveStorySave(save);
  return loadStorySave();
}

export function unlockStoryGaUnit(unit) {
  if (!unit?.id) return loadStorySave();

  const save = loadStorySave();
  save.liberal.unlocked = true;
  save.flags.createGundamLiberalUnlocked = true;
  save.flags.gaBattleUnlocked = true;
  save.liberal.gaUnits[unit.id] = {
    unlocked: true,
    sourceUnitId: unit.id,
    displayName: unit.name || unit.id
  };

  saveStorySave(save);
  return loadStorySave();
}

export function setActiveStoryCreateUnit(unitId) {
  const save = loadStorySave();

  if (unitId === "create_gundam_liberal" && save.liberal.unlocked === true) {
    save.activeCreateUnitId = "create_gundam_liberal";
  } else {
    save.activeCreateUnitId = "proto_create_gundam";
  }

  saveStorySave(save);
  return loadStorySave();
}

export function setLiberalGaUnit(unitId) {
  const save = loadStorySave();

  if (unitId === "none" || save.liberal.gaUnits?.[unitId]?.unlocked === true) {
    save.liberal.activeGaUnitId = unitId;
  }

  saveStorySave(save);
  return loadStorySave();
}

export function unlockStoryDrop(drop) {
  if (!drop?.id) return loadStorySave();

  const save = loadStorySave();
  save.inventory.storyDrops[drop.id] = true;

  if (drop.slotKey && !save.inventory.slots.includes(drop.id)) {
    save.inventory.slots.push(drop.id);
  } else if (drop.data?.kind === "create_skill" && !save.inventory.skills.includes(drop.id)) {
    save.inventory.skills.push(drop.id);
  } else if (!drop.slotKey && !save.inventory.equipments.includes(drop.id)) {
    save.inventory.equipments.push(drop.id);
  }

  saveStorySave(save);
  return loadStorySave();
}

export function updateProtoCreateLabState(updater) {
  const save = loadStorySave();
  const unit = save.createUnits.proto_create_gundam;
  const currentLab = unit.lab || createInitialProtoCreateLabState();
  const nextLab = typeof updater === "function" ? updater(deepClone(currentLab)) : updater;

  unit.lab = nextLab || currentLab;
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
