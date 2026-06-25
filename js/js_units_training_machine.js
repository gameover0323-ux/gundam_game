export const training_machine = {
  id: "training_machine",
  name: "トレーニングマシン",
  defaultFormId: "normal",
  storyOnly: true,
  exp: 0,

  forms: {
    normal: {
      name: "トレーニングマシン",
      hp: 114514810,
      displayHp: "？？？",
      evadeMax: 1,
      criticalRate: 0,

      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "演習攻撃 5ダメージ",
          desc: "5ダメージ。格闘属性。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "melee" }
        },
        slot2: {
          label: "演習射撃 5ダメージ",
          desc: "5ダメージ。射撃属性。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "shoot" }
        },
        slot3: {
          label: "演習属性攻撃 5ダメージ",
          desc: "5ダメージ。射撃属性。軽減不可。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "shoot", ignoreReduction: true }
        },
        slot4: {
          label: "演習属性攻撃 5ダメージ",
          desc: "5ダメージ。格闘属性。必中。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "melee", cannotEvade: true }
        },
        slot5: {
          label: "確定会心攻撃 5ダメージ",
          desc: "5ダメージ。格闘属性。必ず会心が出る。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "melee", criticalHit: true }
        },
        slot6: {
          label: "回避 +1",
          desc: "回避ストック+1。",
          effect: { type: "evade", amount: 1 }
        }
      },

      specials: [
        {
          name: "特性",
          effectType: "training_machine_trait",
          timing: "passive",
          actionType: "auto",
          desc: "ストーリー用トレーニングマシン。この機体のみ会心率0%。"
        }
      ]
    }
  }
};
