export const cpu_mobile_ginn = {
  id: "cpu_mobile_ginn",
  name: "モビルジン",
  defaultFormId: "base",
  isCpu: true,

  forms: {
    base: {
      name: "モビルジン",
      hp: 550,
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
          label: "重斬刀 30ダメージ×2回",
          desc: "30ダメージ×2回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 2 }
        },
        slot4: {
          label: "回復 40",
          desc: "40回復",
          effect: { type: "heal", amount: 40 }
        },
        slot5: {
          label: "強襲突撃銃 20ダメージ×3回",
          desc: "20ダメージ×3回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 20, count: 3 }
        },
        slot6: {
          label: "強襲重斬刀 120ダメージ",
          desc: "120ダメージ。格闘、軽減不可",
          effect: { type: "attack", attackType: "melee", damage: 120, count: 1, ignoreReduction: true }
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
