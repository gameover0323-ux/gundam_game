export const z_gundam = {
  id: "z_gundam",
  name: "Zガンダム",

  defaultFormId: "ms",

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
          desc: "20ダメージ×3回。射撃、ビーム属性",
          effect: {
            type: "attack",
            damage: 20,
            count: 3,
            attackType: "shoot",
            beam: true
          }
        },
        slot2: {
          label: "ビームサーベル 50ダメージ",
          desc: "50ダメージ。格闘、ビーム属性",
          effect: {
            type: "attack",
            damage: 50,
            count: 1,
            attackType: "melee",
            beam: true
          }
        },
        slot3: {
          label: "ビームサーベル投擲 40ダメージ",
          desc: "40ダメージ。射撃、ビーム属性。回避された時、次の1選択時に1EXになる。",
          effect: {
            type: "attack",
            damage: 40,
            count: 1,
            attackType: "shoot",
            beam: true
          }
        },
        slot4: {
          label: "回避 +2",
          desc: "回避ストック+2",
          effect: {
            type: "evade",
            amount: 2
          }
        },
        slot5: {
          label: "バイオセンサー",
          desc: "3ターンの間、バイオセンサー状態に強化される。",
          effect: {
            type: "custom",
            effectId: "biosensor_activate"
          }
        },
        slot6: {
          label: "回復 80",
          desc: "HP80回復。1度使用すると6EXに切り替わる。",
          effect: {
            type: "heal",
            amount: 80
          }
        }
      },

      specials: [
        {
          name: "変形",
          effectType: "transform_wr",
          timing: "self",
          desc: "Zガンダムからウェイブライダーへ自由に変形できる。",
          actionType: "instant"
        },
        {
          name: "シールド",
          effectType: "shield",
          timing: "reaction",
          desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。",
          actionType: "instant"
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
          label: "回避 +2",
          desc: "回避ストック+2",
          effect: {
            type: "evade",
            amount: 2
          }
        },
        slot2: {
          label: "ビームライフル 15ダメージ×3回",
          desc: "15ダメージ×3回。射撃、ビーム属性",
          effect: {
            type: "attack",
            damage: 15,
            count: 3,
            attackType: "shoot",
            beam: true
          }
        },
        slot3: {
          label: "回避 +2",
          desc: "回避ストック+2",
          effect: {
            type: "evade",
            amount: 2
          }
        },
        slot4: {
          label: "バルカン砲 10ダメージ×3回",
          desc: "10ダメージ×3回。射撃属性",
          effect: {
            type: "attack",
            damage: 10,
            count: 3,
            attackType: "shoot",
            beam: false
          }
        },
        slot5: {
          label: "回復 50",
          desc: "HP50回復",
          effect: {
            type: "heal",
            amount: 50
          }
        },
        slot6: {
          label: "突撃 60ダメージ",
          desc: "60ダメージ。格闘属性",
          effect: {
            type: "attack",
            damage: 60,
            count: 1,
            attackType: "melee",
            beam: false
          }
        }
      },

      specials: [
        {
          name: "変形",
          effectType: "transform_ms",
          timing: "self",
          desc: "ウェイブライダーからZガンダムへ自由に変形できる。",
          actionType: "instant"
        }
      ]
    },

    bio: {
      name: "Zガンダム(バイオセンサー)",
      hp: 600,
      evadeMax: 2,

      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "回避 +2",
          desc: "回避ストック+2",
          effect: {
            type: "evade",
            amount: 2
          }
        },
        slot2: {
          label: "回復 150",
          desc: "HP150回復",
          effect: {
            type: "heal",
            amount: 150
          }
        },
        slot3: {
          label: "ハイパービームサーベル 90ダメージ",
          desc: "90ダメージ。格闘、ビーム属性。当たった時、バイオセンサー状態中3EXに切り替わる。",
          effect: {
            type: "attack",
            damage: 90,
            count: 1,
            attackType: "melee",
            beam: true
          }
        },
        slot4: {
          label: "体を通して出る力 10ダメージ",
          desc: "10ダメージ。射撃属性。次のターンの攻撃が必中になる。",
          effect: {
            type: "attack",
            damage: 10,
            count: 1,
            attackType: "shoot",
            beam: false
          }
        },
        slot5:{
          label: "ビームコンフューズ 20ダメージ×5回",
          desc: "20ダメージ×5回。射撃、ビーム属性。命中回数分、相手の次のターンの攻撃を無効化する。",
          effect: {
            type: "attack",
            damage: 20,
            count: 5,
            attackType: "shoot",
            beam: true
          }
        },
        slot6: {
          label: "ウェイブライダー突撃 200ダメージ",
          desc: "200ダメージ。格闘属性。命中時50回復。",
          effect: {
            type: "attack",
            damage: 200,
            count: 1,
            attackType: "melee",
            beam: false
          }
        }
      },

      specials: [
        {
          name: "特性",
          effectType: "trait",
          timing: "passive",
          desc:
            "【特性】相手からのダメージを30軽減する。\n" +
            "【特性】ビーム属性ダメージを半減する。\n" +
            "【特性】そのターンにZガンダム(バイオセンサー)が発動した攻撃を完全回避された時、相手の回避を0にする。",
          actionType: "auto"
        },
        {
          name: "シールド",
          effectType: "shield",
          timing: "reaction",
          desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。",
          actionType: "instant"
        }
      ]
    }
  }
};
