export const cpu_mobile_ginn = {
  id: "cpu_mobile_ginn",
  name: "モビルジン",
  defaultFormId: "base",
  isCpu: true,

  forms: {
    base: {
      name: "モビルジン",
      hp: 450,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "突撃銃 10ダメージ×4回",
          desc: "10ダメージ×4回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 4 }
        },
        slot2: {
          label: "回避 2回",
          desc: "回避+2",
          effect: { type: "evade", amount: 2 }
        },
        slot3: {
          label: "重斬刀 25ダメージ×2回",
          desc: "25ダメージ×2回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 25, count: 2 }
        },
        slot4: {
          label: "回復 40",
          desc: "40回復",
          effect: { type: "heal", amount: 40 }
        },
        slot5: {
          label: "強襲突撃銃 15ダメージ×3回",
          desc: "15ダメージ×3回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 15, count: 3 }
        },
        slot6: {
          label: "強襲重斬刀 90ダメージ",
          desc: "90ダメージ。格闘、軽減不可",
          effect: { type: "attack", attackType: "melee", damage: 90, count: 1, ignoreReduction: true }
        }
      },

      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_mobile_ginn_traits",
          timing: "auto",
          actionType: "auto",
          desc: "1ターンの総合ヒット数×5ダメージの単発追撃ダメージを無属性で追加する。"
        }
      ]
    }
  }
};
