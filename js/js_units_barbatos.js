export const barbatos = {
  id: "barbatos",
  name: "ガンダム・バルバトス",
  defaultFormId: "form4",
  forms: {
    form4: {
      name: "ガンダム・バルバトス(第4形態)",
      hp: 600,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "滑空砲 50ダメージ",
          desc: "50ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 50, count: 1 }
        },
        slot2: {
          label: "回避 +3",
          desc: "回避ストック+3",
          effect: { type: "evade", amount: 3 }
        },
        slot3: {
          label: "メイス投擲 80ダメージ",
          desc: "80ダメージ。命中時6が6EXになる。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 80, count: 1, special: "barbatos_mace_throw" }
        },
        slot4: {
          label: "太刀攻撃 30ダメージ×3回",
          desc: "30ダメージ×3回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 3 }
        },
        slot5: {
          label: "居合",
          desc: "次の相手のスロット行動が攻撃の場合、その攻撃を無効化して次の自分ターン開始時に70ダメージ格闘で反撃。重複可。",
          effect: { type: "custom", customType: "barbatos_iai" }
        },
        slot6: {
          label: "メイス乱撃 40ダメージ×3回",
          desc: "40ダメージ×3回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 40, count: 3 }
        }
      },
      specials: [
        {
          name: "阿頼耶識軌道",
          effectType: "barbatos_alaya_orbit",
          timing: "self",
          actionType: "instant",
          desc: "残りHPを半分使用し、回避数+2。赤上限として上限超過保持可能。HP5以下では使用不可。"
        },
        {
          name: "阿頼耶識軌道・代償",
          effectType: "barbatos_alaya_cost",
          timing: "self",
          actionType: "choice",
          desc: "HP50を消費してスロット1〜6を自由に選んで実行する。次の自分ターンは行動不能。"
        },
        {
          name: "追加装甲",
          effectType: "barbatos_form6",
          timing: "self",
          actionType: "instant",
          desc: "行動権を1消費してガンダム・バルバトス(第6形態)に換装する。戻ることはできない。"
        },
        {
          name: "阿頼耶識軌道・連撃",
          effectType: "barbatos_combo",
          timing: "self",
          actionType: "instant",
          desc: "攻撃QTE中または直前の攻撃後、回避1を消費して同じ攻撃を1発追加する。6EXの追加分は40ダメージ。"
        },
        {
          name: "特性:ナノラミネート装甲",
          effectType: "barbatos_nanolaminate",
          timing: "auto",
          actionType: "auto",
          desc: "ビーム属性ダメージを常に半減する。軽減不可属性は軽減不可。"
        }
      ]
    },

    form6: {
      name: "ガンダム・バルバトス(第6形態)",
      hp: 600,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "170m機関砲 20ダメージ×3回",
          desc: "20ダメージ×3回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 20, count: 3 }
        },
        slot2: {
          label: "回避 +2",
          desc: "回避ストック+2",
          effect: { type: "evade", amount: 2 }
        },
        slot3: {
          label: "レンチメイス殴打 80ダメージ",
          desc: "80ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 80, count: 1 }
        },
        slot4: {
          label: "太刀攻撃 30ダメージ×3回",
          desc: "30ダメージ×3回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 3 }
        },
        slot5: {
          label: "パーツ鹵獲",
          desc: "前の相手の行動が攻撃の場合、射撃なら相手の射撃武器を2ターン無効化。格闘ならHP50回復し相手に50ダメージ。",
          effect: { type: "custom", customType: "barbatos_parts_capture" }
        },
        slot6: {
          label: "レンチメイス挟撃 15ダメージ×6回",
          desc: "15ダメージ×6回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 15, count: 6 }
        }
      },
      specials: [
        {
          name: "阿頼耶識軌道",
          effectType: "barbatos_alaya_orbit",
          timing: "self",
          actionType: "instant",
          desc: "残りHPを半分使用し、回避数+2。赤上限として上限超過保持可能。HP5以下では使用不可。"
        },
        {
          name: "阿頼耶識軌道・代償",
          effectType: "barbatos_alaya_cost",
          timing: "self",
          actionType: "choice",
          desc: "HP50を消費してスロット1〜6を自由に選んで実行する。次の自分ターンは行動不能。"
        },
        {
          name: "特性・ナノラミネート追加装甲",
          effectType: "barbatos_extra_armor",
          timing: "auto",
          actionType: "auto",
          desc: "相手の攻撃時、1ターンに受けるダメージを無効化する効果が3回まで強制発動する。軽減不可は通る。"
        },
        {
          name: "阿頼耶識軌道・決戦",
          effectType: "barbatos_decisive",
          timing: "self",
          actionType: "instant",
          desc: "残りHPが半分以下の時、追加装甲回数を0にして決戦形態へ移行する。"
        },
        {
          name: "特性:ナノラミネート装甲",
          effectType: "barbatos_nanolaminate",
          timing: "auto",
          actionType: "auto",
          desc: "ビーム属性ダメージを常に半減する。軽減不可属性は軽減不可。"
        }
      ]
    },

    decisive: {
      name: "ガンダム・バルバトス(決戦)",
      hp: 600,
      evadeMax: 12,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "太刀〈いなし〉 30ダメージ",
          desc: "30ダメージ。命中時、相手の回避を0にする。格闘",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 1, special: "barbatos_inashi" }
        },
        slot2: {
          label: "回避 +3",
          desc: "回避ストック+3",
          effect: { type: "evade", amount: 3 }
        },
        slot3: {
          label: "太刀〈斬撃〉40ダメージ×2回",
          desc: "40ダメージ×2回。格闘",
          effect: { type: "attack", attackType: "melee", damage: 40, count: 2 }
        },
        slot4: {
          label: "太刀〈腕落とし〉10ダメージ",
          desc: "10ダメージ。命中後、次の相手の攻撃が格闘だった時、相手の格闘を2ターン無効化する。格闘",
          effect: { type: "attack", attackType: "melee", damage: 10, count: 1, special: "barbatos_arm_cut" }
        },
        slot5: {
          label: "回避 +3",
          desc: "回避ストック+3",
          effect: { type: "evade", amount: 3 }
        },
        slot6: {
          label: "太刀〈刺突〉",
          desc: "相手回避がある時120ダメージ格闘。相手回避0の時240ダメージ格闘、軽減不可。",
          effect: { type: "custom", customType: "barbatos_pierce" }
        }
      },
      specials: [
        {
          name: "阿頼耶識軌道",
          effectType: "barbatos_alaya_orbit",
          timing: "self",
          actionType: "instant",
          desc: "残りHPを半分使用し、回避数+2。赤上限として上限超過保持可能。HP5以下では使用不可。"
        },
        {
          name: "阿頼耶識軌道・代償",
          effectType: "barbatos_alaya_cost",
          timing: "self",
          actionType: "choice",
          desc: "HP50を消費してスロット1〜6を自由に選んで実行する。次の自分ターンは行動不能。"
        },
        {
          name: "阿頼耶識軌道・全開",
          effectType: "barbatos_full_open",
          timing: "self",
          actionType: "instant",
          desc: "回避3消費で行動権+1。又は回避6以上所持時、回避を全消費して相手の回避を0にする。"
        },
        {
          name: "特性:装甲解除",
          effectType: "barbatos_armor_purge",
          timing: "auto",
          actionType: "auto",
          desc: "自分の受けるダメージが常に2倍になる。"
        },
        {
          name: "特性:ナノラミネート装甲",
          effectType: "barbatos_nanolaminate",
          timing: "auto",
          actionType: "auto",
          desc: "ビーム属性ダメージを常に半減する。軽減不可属性は軽減不可。"
        }
      ]
    }
  }
};
