export const freedom_gundam = {
  id: "freedom_gundam",
  name: "フリーダムガンダム",
  defaultFormId: "base",
  forms: {
    base: {
      name: "フリーダムガンダム",
      hp: 600,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ルプス･ビームライフル 70ダメージ", desc: "70ダメージ。射撃、ビーム属性", effect: { type: "attack", damage: 70, count: 1, attackType: "shoot", beam: true } },
        slot2: { label: "ラケルタ･ビームサーベル 30ダメージ×2回", desc: "30ダメージ×2回。格闘、ビーム属性", effect: { type: "attack", damage: 30, count: 2, attackType: "melee", beam: true } },
        slot3: { label: "回避 3回", desc: "回避3回", effect: { type: "evade", amount: 3 } },
        slot4: { label: "回復 50", desc: "HP50回復", effect: { type: "heal", amount: 50 } },
        slot5: { label: "S.E.E.D.覚醒 3ターン強化", desc: "3ターン間、全回避・全必中状態。効果中はS.E.E.D.発動スロットへ変化。", effect: { type: "custom", effectId: "freedom_seed_activate" } },
        slot6: { label: "クスィフィアス 80ダメージ+回避1回", desc: "80ダメージ。射撃。さらに回避+1", effect: { type: "attack", damage: 80, count: 1, attackType: "shoot", special: "freedom_evade_plus_1" } }
      },
      specials: [
        { name: "シールド", effectType: "freedom_shield", timing: "reaction", desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "アンビデクストラスハルバード", effectType: "freedom_halberd", timing: "self", desc: "所持回避数が最大の時、20％の確率で成功すると行動数が1増える。1ターンに1回のみ。", actionType: "instant" },
        { name: "バレルロール", effectType: "freedom_barrel_roll", timing: "self", desc: "所持回避数が6以上の時、所持回避数を6消費してもう一度行動出来る。", actionType: "instant" }
      ]
    },
    seed: {
      name: "フリーダムガンダム(S.E.E.D.発動)",
      hp: 600,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "1EX ラケルタ連撃 20ダメージ×所持回避数", desc: "20ダメージ×所持回避数。格闘、ビーム属性、S.E.E.D.中は必中。",ex: true, effect: { type: "attack", damage: 20, count: 1, attackType: "melee", beam: true } },
        slot2: { label: "2EX バラエーナ 50ダメージ×2回", desc: "50ダメージ×2回。射撃、ビーム属性、S.E.E.D.中は必中。",ex: true, effect: { type: "attack", damage: 50, count: 2, attackType: "shoot", beam: true } },
        slot3: { label: "3EX 回避 4回", desc: "回避4回", ex: true,effect: { type: "evade", amount: 4 } },
        slot4: { label: "4EX 回復 80", desc: "HP80回復", ex: true,effect: { type: "heal", amount: 80 } },
        slot5: { label: "5EX S.E.E.D.覚醒 2ターン延長", desc: "S.E.E.D.覚醒の残りターン+2",ex: true, effect: { type: "custom", effectId: "freedom_seed_extend" } },
        slot6: { label: "6EX ハイマットフルバースト 150ダメージ", desc: "150ダメージ。射撃、ビーム属性、S.E.E.D.中は必中。",ex: true, effect: { type: "attack", damage: 150, count: 1, attackType: "shoot", beam: true } }
      },
      specials: [
        { name: "シールド", effectType: "freedom_shield", timing: "reaction", desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "アンビデクストラスハルバード", effectType: "freedom_halberd", timing: "self", desc: "所持回避数が最大の時、20％の確率で成功すると行動数が1増える。1ターンに1回のみ。", actionType: "instant" },
        { name: "バレルロール", effectType: "freedom_barrel_roll", timing: "self", desc: "所持回避数が6以上の時、所持回避数を6消費してもう一度行動出来る。", actionType: "instant" },
        { name: "S.E.E.D.追撃", effectType: "freedom_seed_chase", timing: "self", desc: "S.E.E.D.残りターンを1消費して行動回数を1追加する。", actionType: "instant" },
        { name: "覚醒キャンセル", effectType: "freedom_seed_cancel", timing: "self", desc: "残り覚醒ターンが2ターン以上の時、覚醒を中断して回避数値を倍加する。超過分は赤上限になる。", actionType: "instant" }
      ]
    }
  }
};
