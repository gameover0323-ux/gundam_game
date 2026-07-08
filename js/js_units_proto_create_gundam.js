import {
  loadStorySave,
  getProtoCreateLevelInfo,
  getProtoCreateMaxCost
} from "../story/story_save.js";

import {
  PROTO_CREATE_BASE,
  findStorySlotOption,
  findStoryEquipmentOption,
  findStorySkillOption
} from "../story/story_create_lab_data.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function toSlotEffect(option) {
  const data = option?.data || {};

  if (data.kind === "attack") {
    return {
      type: "attack",
      damage: Number(data.damage || 0),
      count: Number(data.count || 1),
      attackType: data.attackType || "shoot",
      beam: data.beam === true,
      cannotEvade: data.cannotEvade === true,
      ignoreReduction: data.ignoreReduction === true,
      onHit: data.onHit || null,

      storyReload: data.reload === true,
      storyAmmoMax: data.ammoMax || null,
      storyAmmoCostPerUse: data.ammoCostPerUse || null,
      storyReloadPerTurn: data.reloadPerTurn || null,
      storyReloadTurnInterval: data.reloadTurnInterval || null,
      storyReloadPerInterval: data.reloadPerInterval || null,

      storyEnergy: data.energy === true,
      storyEnergyCost: data.energyCost || null,
      storyEnergyIncrease: data.energyIncrease || null
    };
  }

  if (data.kind === "heal") {
    return { type: "heal", amount: Number(data.value || 0) };
  }

  if (data.kind === "evade") {
    return { type: "evade", amount: Number(data.value || 0) };
  }

  if (data.kind === "custom") {
    return {
      type: "custom",
      effectId: data.effectId || data.customType || "story_unknown",
      customType: data.effectId || data.customType || "story_unknown"
    };
  }

  return { type: "custom", effectId: "story_unknown", customType: "story_unknown" };
}
function buildSlot(slotKey, selectedId) {
  const option = findStorySlotOption(slotKey, selectedId);

  return {
    label: option?.label || "未設定",
    desc: option?.detail || "",
    storyOptionId: option?.id || selectedId,
    storyCost: Number(option?.cost || 0),
    effect: toSlotEffect(option)
  };
}

function buildSpecials(lab) {
  const equipment1 = findStoryEquipmentOption(lab.equipment?.equipment1 || "none");
  const equipment2 = findStoryEquipmentOption(lab.equipment?.equipment2 || "none");
  const skill = findStorySkillOption(lab.skill || "none");

  return [
    {
      name: "リロード",
      effectType: "story_reload",
      timing: "self",
      actionType: "instant",
      desc: "行動権を消費して、リロードが必要な武器を指定してリロードする。"
    },
    {
      name: "エネルギーチャージ",
      effectType: "story_energy_charge",
      timing: "self",
      actionType: "instant",
      desc: "行動権を消費して、エネルギーを充填する。"
    },
    {
  name: `装備品1 ${equipment1?.label || "なし"}`,
  effectType: "story_equipment_1",
  timing: String(equipment1?.label || "").includes("シールド") ? "reaction" : "self",
  actionType: equipment1?.id === "none" ? "auto" : "instant",
  desc: equipment1?.detail || "装備品1は未装備。"
},
{
  name: `装備品2 ${equipment2?.label || "なし"}`,
  effectType: "story_equipment_2",
  timing: String(equipment2?.label || "").includes("シールド") ? "reaction" : "self",
  actionType: equipment2?.id === "none" ? "auto" : "instant",
  desc: equipment2?.detail || "装備品2は未装備。"
},
    {
      name: "エネルギー調整",
      effectType: "story_energy_adjust",
      timing: "self",
      actionType: "instant",
      desc: "エネルギー武器の消費ENを同量追加し、ダメージを元値の1.5倍ぶん強化する。加算累積可能。"
    },
   {
  name: `クリエイトスキル ${skill?.label || "なし"}`,
  effectType: "story_create_skill",
  timing: skill?.data?.autoTrigger === "turn_end" ? "auto" : "self",
  actionType: skill?.id === "none" || skill?.data?.autoTrigger === "turn_end" ? "auto" : "instant",
  desc: skill?.detail || "クリエイトスキルは未装備。"
   }
  ];
}

export function buildProtoCreateGundamUnit(save = loadStorySave()) {
  const unitSave = save.createUnits?.proto_create_gundam;
  const lab = unitSave?.lab || {};
  const levelInfo = getProtoCreateLevelInfo(save);
  const maxCost = getProtoCreateMaxCost(save);

  const slots = {};
  SLOT_KEYS.forEach(slotKey => {
    slots[slotKey] = buildSlot(slotKey, lab.selectedSlots?.[slotKey]);
  });

  return {
    id: "proto_create_gundam",
    name: PROTO_CREATE_BASE.unitName,
    defaultFormId: "normal",
    storyOnly: true,
    storyLevel: levelInfo.level,
    storyTotalExp: unitSave?.totalExp || 0,
    storyMaxCost: maxCost,

    forms: {
      normal: {
        name: PROTO_CREATE_BASE.unitName,
        hp: Number(lab.hp || PROTO_CREATE_BASE.baseHp),
        evadeMax: Number(lab.evade || PROTO_CREATE_BASE.baseEvade),
        storyEnergyMax: Number(lab.energy || PROTO_CREATE_BASE.baseEnergy),
        rollableSlotOrder: SLOT_KEYS,
        ownedSlotOrder: SLOT_KEYS,
        slots,
        specials: buildSpecials(lab)
      }
    }
  };
}

export const proto_create_gundam = buildProtoCreateGundamUnit();
