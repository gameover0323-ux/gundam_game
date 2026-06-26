export const zudah = {
  id: "zudah",
  name: "ヅダ",
  defaultFormId: "base",
  forms: {
    base: {
      name: "ヅダ",
      hp: 350,
      evadeMax: 5,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ザクマシンガン 10ダメージ×4回",
          desc: "10ダメージ×4回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 4 }
        },
        slot2: {
          label: "ヒートホーク 30ダメージ",
          desc: "30ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 30, count: 1 }
        },
        slot3: {
          label: "回避 +1",
          desc: "回避ストック+1",
          effect: { type: "evade", amount: 1 }
        },
        slot4: {
          label: "対艦砲 50ダメージ",
          desc: "50ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 60, count: 1 }
        },
        slot5: {
          label: "加速",
          desc: "次の行動ターンから行動数+1、回避ストック最大値と現在の回避所持数を倍加し、HP60回復。4回重ね掛けで自爆する。",
          effect: { type: "custom", customType: "zudah_accel" }
        },
        slot6: {
          label: "シュツルムファウスト 20ダメージ×2回",
          desc: "20ダメージ×2回。射撃、軽減不可",
          effect: {
            type: "attack",
            attackType: "shoot",
            damage: 20,
            count: 2,
            ignoreReduction: true
          }
        }
      },
      specials: [
        {
          name: "エンジンカット",
          effectType: "zudah_engine_cut",
          timing: "self",
          desc: "行動回数を1回に戻し、加速の重ね掛け状態を解除する。重ね掛け数×10のHPを回復する。加速1回以下では使用不可。",
          actionType: "instant"
        },
        {
          name: "シールド",
          effectType: "shield",
          timing: "reaction",
          desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。",
          actionType: "instant"
        },
        {
          name: "突撃",
          effectType: "zudah_charge",
          timing: "self",
          desc: "回避所持数を5消費して、現在ターンの行動回数を1追加する。",
          actionType: "instant"
        },
        {
          name: "翻弄",
          effectType: "zudah_feint",
          timing: "self",
          desc: "行動回数を1消費して、回避所持数を1増やす。",
          actionType: "instant"
        },
        {
          name: "特性：超回避",
          effectType: "zudah_super_evade",
          timing: "auto",
          desc: "必中攻撃を回避2消費で回避可能。",
          actionType: "auto"
        }
      ]
    }
  }
};
