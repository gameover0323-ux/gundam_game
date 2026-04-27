export const gundam_mc = {
  id: "gundam_mc",
  name: "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)",

  defaultFormId: "base",

  forms: {
    base: {
      name: "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)",
      hp: 600,
      evadeMax: 5,

      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7", "slot8"],

      slots: {
  slot1: {
    label: "バルカン 15ダメージ×3回",
    desc: "15ダメージ×3。射撃",
    effect: {
      type: "attack",
      attackType: "shoot",
      damage: 15,
      count: 3
    }
  },
  slot2: {
    label: "回避 +2",
    desc: "回避ストック+2",
    effect: {
      type: "evade",
      amount: 2
    }
  },
  slot3: {
    label: "ビームサーベル 40ダメージ×2回",
    desc: "40ダメージ×2。格闘、ビーム属性",
    effect: {
      type: "attack",
      attackType: "melee",
      damage: 40,
      count: 2,
      beam: true
    }
  },
  slot4: {
    label: "回復 60",
    desc: "HP60回復",
    effect: {
      type: "heal",
      amount: 60
    }
  },
  slot5: {
    label: "ビームライフル 80ダメージ",
    desc: "80ダメージ。射撃、ビーム属性",
    effect: {
      type: "attack",
      attackType: "shoot",
      damage: 80,
      count: 1,
      beam: true
    }
  },
  slot6: {
    label: "ハイパーナパーム 120ダメージ",
    desc: "120ダメージ + 軽減不可。射撃",
    effect: {
      type: "attack",
      attackType: "shoot",
      damage: 120,
      count: 1,
      ignoreReduction: true
    }
  },
  slot7: {
    label: "ガンダムハンマー 80ダメージ",
    desc: "80ダメージ。格闘",
    effect: {
      type: "attack",
      attackType: "melee",
      damage: 80,
      count: 1
    }
  },
  slot8: {
    label: "ハイパーバズーカ 80ダメージ",
    desc: "80ダメージ。射撃",
    effect: {
      type: "attack",
      attackType: "shoot",
      damage: 80,
      count: 1
    }
  }
},

      specials: [
        {
          name: "シールド",
          effectType: "shield",
          timing: "reaction",
          desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。",
          actionType: "instant"
        },
        {
          name: "二刀流",
          effectType: "toggle_dual_mode",
          timing: "self",
          desc: "シールドを消費しきった時、任意で4の行動を4EX ビームサーベル 40ダメージ軽減不可×2回の格闘に変更できる。",
          actionType: "instant"
        },
        {
          name: "ラストシューティング",
          effectType: "last_shooting",
          timing: "auto",
          desc: "HPが50以下の時、5の行動が5EX:ラスト・シューティング 150ダメージ、射撃、ビーム属性に変更される。→HP20以下になった状態で相手の攻撃を30ダメージ以上受けた場合、5の行動を発動し、相手のHPが0になった場合勝利する。",
          actionType: "auto"
        },
        {
          name: "追加武装",
          effectType: "choice_extra_weapon",
          timing: "self",
          desc: "所持回避数を2使用して7,ガンダムハンマー 80ダメージの格闘攻撃もしくは8,ハイパーバズーカ 80ダメージの射撃攻撃を選択してこのターンのスロット行動として発動する。",
          actionType: "choice"
        },
        {
          name: "ニュータイプ感性",
          effectType: "nt_prediction",
          timing: "auto",
          desc: "3ターン毎に相手の次の出目を予想し、的中した場合回避数が3増加する",
          actionType: "auto"
        }
      ]
    }
  }
};
