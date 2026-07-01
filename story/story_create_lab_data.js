import { buildStoryCompanionOptions } from "./story_companion_registry.js";

export const PROTO_CREATE_BASE = {
  unitName: "プロトクリエイトガンダム",
  level: 0,
  maxCost: 100,

  baseHp: 200,
  baseEvade: 1,
  baseEnergy: 100,

  hpStep: 20,
  hpCostStep: 10,
  hpMax: 1000,

  evadeStep: 1,
  evadeCostStep: 20,
  evadeMax: 25,

  energyStep: 1,
  energyCostStep: 1,

  fixedSpecials: [
    "リロード",
    "エネルギーチャージ",
    "装備品1",
    "装備品2",
    "エネルギー調整"
  ]
};

export const STORY_SLOT_OPTIONS = {
  slot1: [
    {
      id: "generic_machine_gun",
      label: "汎用マシンガン",
      shortLabel: "1.汎用マシンガン",
      cost: 5,
      detail: "10ダメージ×3回 / 射撃 / リロード[R] / 弾数10 / 1ターン1装填",
      data: {
        kind: "attack",
        damage: 10,
        count: 3,
        attackType: "shoot",
        reload: true,
        ammoMax: 10,
        ammoCostPerUse: 3,
        reloadPerTurn: 1
      }
    },
    {
      id: "generic_burst_rifle",
      label: "汎用バーストライフル",
      shortLabel: "1.汎用バーストライフル",
      cost: 10,
      detail: "40ダメージ / 射撃 / リロード[R] / 弾数5 / 3ターン1装填",
      data: {
        kind: "attack",
        damage: 40,
        count: 1,
        attackType: "shoot",
        reload: true,
        ammoMax: 5,
        ammoCostPerUse: 1,
        reloadTurnInterval: 3,
        reloadPerInterval: 1
      }
    }
  ],

  slot2: [
    {
      id: "heal_30",
      label: "回復 30",
      shortLabel: "2.回復 30",
      cost: 5,
      detail: "HPを30回復する。",
      data: {
        kind: "heal",
        value: 30
      }
    },
    {
      id: "heal_60",
      label: "回復 60",
      shortLabel: "2.回復 60",
      cost: 10,
      detail: "HPを60回復する。",
      data: {
        kind: "heal",
        value: 60
      }
    }
  ],

  slot3: [
    {
      id: "evade_1",
      label: "回避 1",
      shortLabel: "3.回避 1",
      cost: 5,
      detail: "回避を1回獲得する。",
      data: {
        kind: "evade",
        value: 1
      }
    },
    {
      id: "evade_2",
      label: "回避 2",
      shortLabel: "3.回避 2",
      cost: 15,
      detail: "回避を2回獲得する。",
      data: {
        kind: "evade",
        value: 2
      }
    }
  ],

  slot4: [
    {
      id: "beam_gun",
      label: "ビームガン",
      shortLabel: "4.ビームガン",
      cost: 5,
      detail: "20ダメージ / 射撃 / ビーム / エネルギー / EN消費10 / 増加値20",
      data: {
        kind: "attack",
        damage: 20,
        count: 1,
        attackType: "shoot",
        beam: true,
        energy: true,
        energyCost: 10,
        energyIncrease: 20
      }
    },
    {
      id: "energy_sword",
      label: "エネルギーソード",
      shortLabel: "4.エネルギーソード",
      cost: 20,
      detail: "60ダメージ / 格闘 / ビーム / エネルギー / EN消費20 / 増加値30",
      data: {
        kind: "attack",
        damage: 60,
        count: 1,
        attackType: "melee",
        beam: true,
        energy: true,
        energyCost: 20,
        energyIncrease: 30
      }
    }
  ],

  slot5: [
    {
      id: "bazooka",
      label: "バズーカ",
      shortLabel: "5.バズーカ",
      cost: 20,
      detail: "80ダメージ / 射撃 / 軽減不可",
      data: {
        kind: "attack",
        damage: 80,
        count: 1,
        attackType: "shoot",
        ignoreReduction: true
      }
    },
    {
      id: "melee_15x2",
      label: "格闘",
      shortLabel: "5.格闘",
      cost: 5,
      detail: "15ダメージ×2回 / 格闘",
      data: {
        kind: "attack",
        damage: 15,
        count: 2,
        attackType: "melee"
      }
    }
  ],

  slot6: [
    {
      id: "suicide_kick",
      label: "心中蹴り",
      shortLabel: "6.心中蹴り",
      cost: 20,
      detail: "60ダメージ / 格闘 / 必中",
      data: {
        kind: "attack",
        damage: 60,
        count: 1,
        attackType: "melee",
        cannotEvade: true
      }
    },
    {
      id: "kick_30",
      label: "キック",
      shortLabel: "6.キック",
      cost: 5,
      detail: "30ダメージ / 格闘",
      data: {
        kind: "attack",
        damage: 30,
        count: 1,
        attackType: "melee"
      }
    }
  ]
};

export const STORY_EQUIPMENT_OPTIONS = [
  {
    id: "none",
    label: "なし",
    cost: 0,
    detail: ""
  },
  {
    id: "shield",
    label: "シールド",
    cost: 10,
    detail: "ゲーム中3回まで、1ターンに受けるダメージを半減する。",
    data: {
      kind: "shield",
      uses: 3,
      effect: "damage_half_one_turn"
    }
  }
];

export const STORY_SKILL_OPTIONS = [
  {
    id: "none",
    label: "なし",
    cost: 0,
    detail: ""
  },
  {
    id: "round_force",
    label: "ラウンドフォース",
    cost: 20,
    detail: "5ターンに一度、100ダメージの攻撃を放てる。格闘。",
    data: {
      kind: "attack_skill",
      damage: 100,
      count: 1,
      attackType: "melee",
      cooldown: 5
    }
  }
];

export const STORY_COMPANION_OPTIONS = buildStoryCompanionOptions();


export function createInitialProtoCreateLabState() {
  return {
    hp: PROTO_CREATE_BASE.baseHp,
    hpCost: 0,

    evade: PROTO_CREATE_BASE.baseEvade,
    evadeCost: 0,

    energy: PROTO_CREATE_BASE.baseEnergy,
    energyCost: 0,

    selectedSlots: {
      slot1: "generic_machine_gun",
      slot2: "heal_30",
      slot3: "evade_1",
      slot4: "beam_gun",
      slot5: "bazooka",
      slot6: "suicide_kick"
    },

    equipment: {
      equipment1: "none",
      equipment2: "none"
    },

    skill: "none",
    companion: "none"
  };
}

export function findStorySlotOption(slotKey, optionId) {
  return (STORY_SLOT_OPTIONS[slotKey] || []).find(option => option.id === optionId) || null;
}

export function findStoryEquipmentOption(optionId) {
  return STORY_EQUIPMENT_OPTIONS.find(option => option.id === optionId) || STORY_EQUIPMENT_OPTIONS[0];
}

export function findStorySkillOption(optionId) {
  return STORY_SKILL_OPTIONS.find(option => option.id === optionId) || STORY_SKILL_OPTIONS[0];
}

export function findStoryCompanionOption(optionId) {
  return STORY_COMPANION_OPTIONS.find(option => option.id === optionId) || STORY_COMPANION_OPTIONS[0];
}

export function calculateProtoCreateLabCost(state) {
  const slotCost = Object.entries(state.selectedSlots || {}).reduce((total, [slotKey, optionId]) => {
    const option = findStorySlotOption(slotKey, optionId);
    return total + Number(option?.cost || 0);
  }, 0);

  const equipment1 = findStoryEquipmentOption(state.equipment?.equipment1 || "none");
  const equipment2 = findStoryEquipmentOption(state.equipment?.equipment2 || "none");
  const skill = findStorySkillOption(state.skill || "none");
  const companion = findStoryCompanionOption(state.companion || "none");

  return Number(state.hpCost || 0)
    + Number(state.evadeCost || 0)
    + Number(state.energyCost || 0)
    + slotCost
    + Number(equipment1?.cost || 0)
    + Number(equipment2?.cost || 0)
    + Number(skill?.cost || 0)
    + Number(companion?.cost || 0);
}
