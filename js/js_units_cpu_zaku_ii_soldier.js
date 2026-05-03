export const cpu_zaku_ii_soldier = {
  id: "cpu_zaku_ii_soldier",
  name: "ザクⅡ(一般兵)",
  defaultFormId: "base",
  isCpu: true,
  forms: {
    base: {
      name: "ザクⅡ(一般兵)",
      hp: 400,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ヒートホーク 40ダメージ",
          desc: "40ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 40, count: 1 }
        },
        slot2: {
          label: "ザクマシンガン 10ダメージ×3回",
          desc: "10ダメージ×3回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 3 }
        },
        slot3: {
          label: "回復 40",
          desc: "40回復",
          effect: { type: "heal", amount: 40 }
        },
        slot4: {
          label: "ザクバズーカ 60ダメージ",
          desc: "60ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 60, count: 1 }
        },
        slot5: {
          label: "回避+3",
          desc: "回避+3",
          effect: { type: "evade", amount: 3 }
        },
        slot6: {
          label: "ヒートホーク連斬 20ダメージ×4回",
          desc: "20ダメージ×4回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 20, count: 4 }
        }
      },
      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_zaku_ii_soldier_traits",
          timing: "auto",
          actionType: "auto",
          desc: "10%の確率で与えるダメージが2倍になる。"
        }
      ]
    }
  }
};
