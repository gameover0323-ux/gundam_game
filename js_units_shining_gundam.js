export const shining_gundam = {
  id: "shining_gundam",
  name: "シャイニングガンダム",
  defaultFormId: "base",

  forms: {
    base: {
      name: "シャイニングガンダム",
      hp: 750,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "シャイニングショット 30ダメージ",
          desc: "30ダメージ。射撃",
          effect: {
            type: "attack",
            damage: 30,
            count: 1,
            attackType: "shoot"
          }
        },
        slot2: {
          label: "回避 3回",
          desc: "回避3回",
          effect: {
            type: "evade",
            amount: 3
          }
        },
        slot3: {
          label: "格闘攻撃 20ダメージ×2回",
          desc: "20ダメージ×2回。格闘",
          effect: {
            type: "attack",
            damage: 20,
            count: 2,
            attackType: "melee"
          }
        },
        slot4: {
          label: "ビームソード 40ダメージ",
          desc: "40ダメージ。格闘、ビーム属性",
          effect: {
            type: "attack",
            damage: 40,
            count: 1,
            attackType: "melee",
            beam: true
          }
        },
        slot5: {
          label: "シャイニングフィンガー 80ダメージ",
          desc: "80ダメージ。格闘",
          effect: {
            type: "attack",
            damage: 80,
            count: 1,
            attackType: "melee"
          }
        },
        slot6: {
          label: "スーパーモード発動 5ターン強化",
          desc: "5ターン間スーパーモードに強化される。条件を満たしている場合、5ターン間明鏡止水スーパーモードに変更",
          effect: {
            type: "custom",
            effectId: "shining_activate_mode"
          }
        }
      },

      specials: [
        {
          name: "見切り行動",
          effectType: "miki_action",
          timing: "self",
          desc: "所持回避数を1消費して行動回数を1追加する。強化ターン中は使用数分だけ強化ターンを消費する。1ターンに2回まで。",
          actionType: "instant"
        },
        {
          name: "精神統一",
          effectType: "spirit_focus",
          timing: "self",
          desc: "所持回避数を3消費してスロットを選択する。",
          actionType: "instant"
        }
      ]
    },

    super: {
      name: "シャイニングガンダムS",
      hp: 750,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "回避 4回",
          desc: "回避4回",
          effect: {
            type: "evade",
            amount: 4
          }
        },
        slot2: {
          label: "シャイニングフィンガー 120ダメージ",
          desc: "120ダメージ。格闘",
          effect: {
            type: "attack",
            damage: 120,
            count: 1,
            attackType: "melee"
          }
        },
        slot3: {
          label: "瞑想 60回復",
          desc: "60回復。強化ターン+2。ゲーム中計4回発動で3EXに変化",
          effect: {
            type: "custom",
            effectId: "shining_meditation"
          }
        },
        slot4: {
          label: "シャイニングフィンガー(照射) 140ダメージ",
          desc: "140ダメージ。射撃",
          effect: {
            type: "attack",
            damage: 140,
            count: 1,
            attackType: "shoot"
          }
        },
        slot5: {
          label: "格闘連撃 20ダメージ×5回",
          desc: "20ダメージ×5回。格闘",
          effect: {
            type: "attack",
            damage: 20,
            count: 5,
            attackType: "melee"
          }
        },
        slot6: {
          label: "シャイニングフィンガーソード 170ダメージ",
          desc: "170ダメージ。格闘。命中時強化ターン+3",
          effect: {
            type: "attack",
            damage: 170,
            count: 1,
            attackType: "melee"
          }
        }
      },

      specials: [
        {
          name: "見切り行動",
          effectType: "miki_action",
          timing: "self",
          desc: "所持回避数を1消費して行動回数を1追加する。強化ターン中は使用数分だけ強化ターンを消費する。1ターンに2回まで。",
          actionType: "instant"
        },
        {
          name: "死中に活",
          effectType: "trait",
          timing: "passive",
          desc: "HP150以下の時にこの形態へ変化した場合、条件未達でも明鏡止水スーパーモードへ移行する。",
          actionType: "auto"
        }
      ]
    },

    meikyo: {
      name: "シャイニングガンダム明鏡止水S",
      hp: 750,
      evadeMax: 8,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],

      slots: {
        slot1: {
          label: "格闘連撃 20ダメージ×6回",
          desc: "20ダメージ×6回。格闘",
          effect: {
            type: "attack",
            damage: 20,
            count: 6,
            attackType: "melee"
          }
        },
        slot2: {
          label: "回復 80",
          desc: "80回復。強化ターン1ターン追加",
          effect: {
            type: "custom",
            effectId: "shining_meikyo_heal"
          }
        },
        slot3: {
          label: "回避 5回",
          desc: "回避5回",
          effect: {
            type: "evade",
              amount: 5
          }
        },
        slot4: {
          label: "シャイニングフィンガー 120ダメージ",
          desc: "120ダメージ。格闘。さらに30ダメージ×任意消費回避数の追撃可能",
          effect: {
            type: "attack",
            damage: 120,
            count: 1,
            attackType: "melee"
          }
        },
        slot5: {
          label: "シャイニングフィンガーソード 200ダメージ",
          desc: "200ダメージ。格闘、軽減不可。命中時強化ターン+2ターン追加",
          effect: {
            type: "attack",
            damage: 200,
            count: 1,
            attackType: "melee",
            ignoreReduction: true
          }
        },
        slot6: {
          label: "超級覇王電影弾 30ダメージ×8回",
          desc: "30ダメージ×8回。格闘",
          effect: {
            type: "attack",
            damage: 30,
            count: 8,
            attackType: "melee"
          }
        }
      },

      specials: [
        {
          name: "見切り行動",
          effectType: "miki_action",
          timing: "self",
          desc: "所持回避数を1消費して行動回数を1追加する。強化ターン中は使用数分だけ強化ターンを消費する。1ターンに2回まで。",
          actionType: "instant"
        },
        {
          name: "精神統一",
          effectType: "spirit_focus",
          timing: "self",
          desc: "所持回避数を3消費してスロットを選択する。",
          actionType: "instant"
        },
        {
          name: "水の一雫",
          effectType: "water_drop",
          timing: "self",
          desc: "所持回避数を5消費し、HP半減。その次にスロット行動で選ばれた攻撃行動に必中属性を付与する。攻撃系のコマンドではなかった場合、効果は保持される。",
          actionType: "instant"
        }
      ]
    }
  }
};
