export const cpu_z_gundam = {
  id: "cpu_z_gundam",
  name: "CPU Zガンダム",
  defaultFormId: "ms",
  isCpu: true,

  forms: {
    ms: {
      name: "Zガンダム",
      hp: 600,
      evadeMax: 5,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ビームライフル 20ダメージ×3回",
          desc: "20ダメージ×3回。射撃、ビーム",
          effect: { type: "attack", damage: 20, count: 3, attackType: "shoot", beam: true }
        },
        slot2: {
          label: "ビームサーベル 50ダメージ",
          desc: "50ダメージ。格闘、ビーム",
          effect: { type: "attack", damage: 50, count: 1, attackType: "melee", beam: true }
        },
        slot3: {
          label: "ビームサーベル投擲 40ダメージ",
          desc: "40ダメージ。射撃、ビーム。回避された時、次の1選択時1EXになる。",
          effect: { type: "attack", damage: 40, count: 1, attackType: "shoot", beam: true }
        },
        slot4: {
          label: "2ターン全攻撃回避 + 回避+2",
          desc: "2ターン間、必中を除く全攻撃を回避。さらに回避+2。",
          effect: { type: "custom", effectId: "cpu_z_two_turn_full_evade" }
        },
        slot5: {
          label: "バイオセンサー発動",
          desc: "3ターンの間、バイオセンサー状態に強化される。",
          effect: { type: "custom", effectId: "cpu_z_biosensor_activate" }
        },
        slot6: {
          label: "回復 80",
          desc: "80回復。1度使用すると6EXに切り替わる。",
          effect: { type: "heal", amount: 80 }
        }
      },
      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_z_traits",
          timing: "auto",
          actionType: "auto",
          desc: "10分の1でウェイブライダーへ変形。CPU専用自動処理。"
        }
      ]
    },

    wr: {
      name: "ウェイブライダー",
      hp: 600,
      evadeMax: 12,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "次ターン全攻撃回避",
          desc: "次のターン、必中を除く攻撃を全て回避する。",
          effect: { type: "custom", effectId: "cpu_z_next_turn_full_evade" }
        },
        slot2: {
          label: "ビームライフル 15ダメージ×3回",
          desc: "15ダメージ×3回。射撃、ビーム",
          effect: { type: "attack", damage: 15, count: 3, attackType: "shoot", beam: true }
        },
        slot3: {
          label: "次ターン全攻撃回避",
          desc: "次のターン、必中を除く攻撃を全て回避する。",
          effect: { type: "custom", effectId: "cpu_z_next_turn_full_evade" }
        },
        slot4: {
          label: "バルカン砲 10ダメージ×3回",
          desc: "10ダメージ×3回。射撃",
          effect: { type: "attack", damage: 10, count: 3, attackType: "shoot" }
        },
        slot5: {
          label: "回復 50",
          desc: "50回復。",
          effect: { type: "heal", amount: 50 }
        },
        slot6: {
          label: "突撃 60ダメージ",
          desc: "60ダメージ。格闘",
          effect: { type: "attack", damage: 60, count: 1, attackType: "melee" }
        }
      },
      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_z_wr_traits",
          timing: "auto",
          actionType: "auto",
          desc: "毎ターン回避+1。10分の1でZガンダムへ変形。"
        }
      ]
    },

    bio: {
      name: "Zガンダム(バイオセンサー)",
      hp: 600,
      evadeMax: 5,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "全攻撃回避 + 回避+2",
          desc: "次のターン、必中を除く全攻撃を回避。さらに回避+2。",
          effect: { type: "custom", effectId: "cpu_z_next_turn_full_evade_plus2" }
        },
        slot2: {
          label: "回復 150",
          desc: "150回復。",
          effect: { type: "heal", amount: 150 }
        },
        slot3: {
          label: "ハイパービームサーベル 90ダメージ",
          desc: "90ダメージ。格闘、ビーム。命中時、3EXに切り替わる。",
          effect: { type: "attack", damage: 90, count: 1, attackType: "melee", beam: true }
        },
        slot4: {
          label: "体を通して出る力 10ダメージ",
          desc: "10ダメージ。射撃。命中時、次ターンの攻撃が必中。",
          effect: { type: "attack", damage: 10, count: 1, attackType: "shoot" }
        },
        slot5: {
          label: "ビームコンフューズ 20ダメージ×5回",
          desc: "20ダメージ×5回。射撃、ビーム。命中回数分、相手の次ターン攻撃を無効化。",
          effect: { type: "attack", damage: 20, count: 5, attackType: "shoot", beam: true }
        },
        slot6: {
          label: "ウェイブライダー突撃 200ダメージ",
          desc: "200ダメージ。格闘。命中時50回復。",
          effect: { type: "attack", damage: 200, count: 1, attackType: "melee" }
        }
      },
      specials: [
        {
          name: "CPU特性",
          effectType: "cpu_z_bio_traits",
          timing: "auto",
          actionType: "auto",
          desc: "被ダメージ30軽減、ビーム半減、攻撃を完全回避された時に相手回避0。"
        }
      ]
    }
  }
};
