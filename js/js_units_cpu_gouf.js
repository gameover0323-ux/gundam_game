export const cpu_gouf = {
  id: "cpu_gouf",
  name: "グフ",
  defaultFormId: "base",
  isCpu: true,
  forms: {
    base: {
      name: "グフ",
      hp: 600,
      evadeMax: 2,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ヒートロッド 30ダメージ",
          desc: "30ダメージ。格闘。被弾すると所持回避消滅",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 1, onHit: "gouf_heat_rod_evade_zero" }
        },
        slot2: {
          label: "回避+2回",
          desc: "回避+2回",
          effect: { type: "evade", amount: 2 }
        },
        slot3: {
          label: "ヒートサーベル 80ダメージ",
          desc: "80ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 80, count: 1 }
        },
        slot4: {
          label: "回復 80",
          desc: "80回復",
          effect: { type: "heal", amount: 80 }
        },
        slot5: {
          label: "フィンガーバルカン 10ダメージ×5回",
          desc: "10ダメージ×5回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 5 }
        },
        slot6: {
          label: "ヒートロッド捕縛 50ダメージ",
          desc: "50ダメージ。格闘。被弾すると次の攻撃が必中になる",
          effect: { type: "attack", attackType: "melee", damage: 50, count: 1, onHit: "gouf_heat_rod_bind" }
        }
      },
      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_gouf_traits",
          timing: "auto",
          actionType: "auto",
          desc: "相手が攻撃行動をしてこなかった時の次のターン、2回～3回連続でスロット行動をする。"
        }
      ]
    }
  }
};
