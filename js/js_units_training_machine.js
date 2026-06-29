export const training_machine = {
  id: "training_machine",
  name: "トレーニングマシン",
  defaultFormId: "normal",
  storyOnly: true,
  exp: 0,

  forms: {
    normal: {
      name: "トレーニングマシン",
      hp: 114514,
      displayHp: "？？？",
      evadeMax: 1,
      criticalRate: 0,

      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "演習攻撃",
          desc: "5ダメージ。格闘属性。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "melee" }
        },
        slot2: {
          label: "演習射撃",
          desc: "5ダメージ。射撃属性。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "shoot" }
        },
        slot3: {
          label: "演習属性攻撃",
          desc: "5ダメージ。射撃属性。軽減不可。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "shoot", ignoreReduction: true }
        },
        slot4: {
          label: "演習属性攻撃",
          desc: "5ダメージ。格闘属性。必中。",
          effect: { type: "attack", damage: 5, count: 1, attackType: "melee", cannotEvade: true }
        },
        slot5: {
          label: "演習連続攻撃",
          desc: "5ダメージ2回。格闘属性。",
          effect: { type: "attack", damage: 5, count: 2, attackType: "melee", criticalHit: true }
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
          desc: "ストーリー用トレーニングマシン。チュートリアル。"
        }
      ]
    }
  }
};
