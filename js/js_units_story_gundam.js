export const story_gundam = {
  id: "story_gundam",
  name: "ガンダム",
  defaultFormId: "base",
  exp: 10,

  storyCompanion: {
    unlockCondition: "ドロップ品を全て入手した状態でプロトクリエイトガンダムで撃破。",
    cost: 80
  },

  storyDrops: {
    initial: [
      {
        id: "story_gundam_slot2_beam_saber_energy",
        slotKey: "slot2",
        label: "ビームサーベル 80ダメージ",
        cost: 15,
        detail: "80ダメージ / 格闘 / ビーム / エネルギー / EN消費5 / 増加値15",
        data: {
          kind: "attack",
          damage: 80,
          count: 1,
          attackType: "melee",
          beam: true,
          energy: true,
          energyCost: 5,
          energyIncrease: 15
        }
      }
    ],

    random: [
      {
        id: "story_gundam_slot5_beam_saber_energy",
        slotKey: "slot5",
        label: "ビームサーベル 80ダメージ",
        cost: 15,
        detail: "80ダメージ / 格闘 / ビーム / エネルギー / EN消費5 / 増加値15",
        data: {
          kind: "attack",
          damage: 80,
          count: 1,
          attackType: "melee",
          beam: true,
          energy: true,
          energyCost: 5,
          energyIncrease: 15
        }
      },
      {
        id: "story_gundam_slot6_hyper_bazooka_reload",
        slotKey: "slot6",
        label: "ハイパーバズーカ 100ダメージ",
        cost: 25,
        detail: "100ダメージ / 射撃 / 軽減不可 / リロード / 弾数2 / 2ターン1リロード",
        data: {
          kind: "attack",
          damage: 100,
          count: 1,
          attackType: "shoot",
          ignoreReduction: true,
          reload: true,
          ammoMax: 2,
          ammoCostPerUse: 1,
          reloadTurnInterval: 2,
          reloadPerInterval: 1
        }
      }
    ],

    equipment: [
      {
        id: "story_gundam_beam_rifle_equipment",
        label: "ビームライフル(ガンダム)",
        cost: 0,
        detail: "ゲーム中3回だけ、スロット行動の代わりに80ダメージ / 射撃 / ビームの攻撃を放てる。",
        data: {
          kind: "equipment_attack",
          damage: 80,
          count: 1,
          attackType: "shoot",
          beam: true,
          uses: 3,
          actionCost: 1
        }
      }
    ],

    conditional: [
      {
        id: "story_gundam_nt_sense",
        label: "ニュータイプ感性",
        cost: 20,
        detail: "5ターンに1度、相手のスロット行動を予測し、成功した時回避+3を得る。",
        data: {
          kind: "create_skill",
          effectId: "nt_sense_prediction",
          cooldown: 5,
          evadeGain: 3
        }
      }
    ]
  },

  forms: {
    base: {
      name: "ガンダム",
      hp: 600,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "バルカン 10ダメージ×5回",
          desc: "10ダメージ×5回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 5 }
        },
        slot2: {
          label: "ビームサーベル 80ダメージ",
          desc: "80ダメージ。格闘、ビーム",
          effect: { type: "attack", attackType: "melee", damage: 80, count: 1, beam: true }
        },
        slot3: {
          label: "回避+2",
          desc: "回避+2",
          effect: { type: "evade", amount: 2 }
        },
        slot4: {
          label: "ビームライフル 80ダメージ",
          desc: "80ダメージ。射撃、ビーム",
          effect: { type: "attack", attackType: "shoot", damage: 80, count: 1, beam: true }
        },
        slot5: {
          label: "回復 80",
          desc: "80回復",
          effect: { type: "heal", amount: 80 }
        },
        slot6: {
          label: "ハイパーバズーカ 100ダメージ",
          desc: "100ダメージ。射撃、軽減不可",
          effect: { type: "attack", attackType: "shoot", damage: 100, count: 1, ignoreReduction: true }
        }
      },
      specials: [
        {
          name: "特性 ニュータイプ感性",
          desc: "5ターンに1回、相手のスロット行動を予測し、成功時に回避+3。",
          effectType: "story_gundam_nt_prediction",
          actionType: "auto"
        }
      ]
    }
  }
};
