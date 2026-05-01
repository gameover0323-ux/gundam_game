export const strike_gundam = {
  id: "strike_gundam",
  name: "ストライクガンダム",
  defaultFormId: "base",

  forms: {
    base: {
      name: "ストライクガンダム",
      hp: 600,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ｲｰｹﾞﾙｼｭﾃﾙﾝ 10ダメージ×4回", desc: "10ダメージ×4回。射撃", effect: { type: "attack", damage: 10, count: 4, attackType: "shoot" } },
        slot2: { label: "バズーカ 50ダメージ", desc: "50ダメージ。射撃", effect: { type: "attack", damage: 50, count: 1, attackType: "shoot" } },
        slot3: { label: "回復 70", desc: "70回復", effect: { type: "heal", amount: 70 } },
        slot4: { label: "高ｴﾈﾙｷﾞｰﾋﾞｰﾑﾗｲﾌﾙ 60ダメージ", desc: "60ダメージ。射撃、ビーム", effect: { type: "attack", damage: 60, count: 1, attackType: "shoot", beam: true } },
        slot5: { label: "ｱｰﾏｰｼｭﾅｲﾀﾞｰ 20ダメージ×3回", desc: "20ダメージ×3回。格闘", effect: { type: "attack", damage: 20, count: 3, attackType: "melee" } },
        slot6: { label: "回避 1回", desc: "回避1回", effect: { type: "evade", amount: 1 } }
      },
      specials: [
        { name: "特性.PS装甲", effectType: "trait_ps_armor", timing: "passive", desc: "PS耐久300。ビーム・軽減不可以外の攻撃を軽減する。", actionType: "auto" },
        { name: "ストライカーパック換装", effectType: "strike_pack_change", timing: "self", desc: "通常、エール、ソード、ランチャーへ換装する。出撃後は3ターンのクールタイム。", actionType: "instant" }
      ]
    },

    aile: {
      name: "エールストライクガンダム",
      hp: 600,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "回避 3回", desc: "回避3回", effect: { type: "evade", amount: 3 } },
        slot2: { label: "高ｴﾈﾙｷﾞｰﾋﾞｰﾑﾗｲﾌﾙ 60ダメージ", desc: "60ダメージ。射撃、ビーム", effect: { type: "attack", damage: 60, count: 1, attackType: "shoot", beam: true } },
        slot3: { label: "ビームサーベル 30ダメージ×2回", desc: "30ダメージ×2回。格闘、ビーム", effect: { type: "attack", damage: 30, count: 2, attackType: "melee", beam: true } },
        slot4: { label: "S.E.E.D覚醒 5ターン", desc: "5ターンの間、攻撃必中。回避数2倍。必中攻撃も回避可能。", effect: { type: "custom", effectId: "strike_seed_awaken" } },
        slot5: { label: "回復 40", desc: "40回復", effect: { type: "heal", amount: 40 } },
        slot6: { label: "キック 90ダメージ", desc: "90ダメージ。格闘", effect: { type: "attack", damage: 90, count: 1, attackType: "melee" } }
      },
      specials: [
        { name: "特性.PS装甲", effectType: "trait_ps_armor", timing: "passive", desc: "PS耐久300。ビーム・軽減不可以外の攻撃を軽減する。", actionType: "auto" },
        { name: "ストライカーパック換装", effectType: "strike_pack_change", timing: "self", desc: "通常、エール、ソード、ランチャーへ換装する。", actionType: "instant" },
        { name: "OSチェック", effectType: "os_check", timing: "self", desc: "回避1消費。20回復。1ターン1回。", actionType: "instant" },
        { name: "シールド", effectType: "shield", timing: "reaction"  desc: "3回まで使用可能。このターンの被ダメージを半減する。",actionType: "instant" }
      ]
    },

    sword: {
      name: "ソードストライクガンダム",
      hp: 600,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "回避 2回", desc: "回避2回", effect: { type: "evade", amount: 2 } },
        slot2: { label: "ﾏｲﾀﾞｽﾒｯｻｰ 30ダメージ", desc: "30ダメージ×2回。射撃、ビーム", effect: { type: "attack", damage: 30, count: 2, attackType: "shoot", beam: true } },
        slot3: { label: "回復 40", desc: "40回復", effect: { type: "heal", amount: 40 } },
        slot4: { label: "アンカー捕縛 10ダメージ", desc: "10ダメージ。命中時相手ターンスキップ。格闘", effect: { type: "attack", damage: 10, count: 1, attackType: "melee" } },
        slot5: { label: "対艦刀ｼｭﾍﾞﾙﾄ・ｹﾞﾍﾞｰﾙ 100ダメージ", desc: "100ダメージ。格闘", effect: { type: "attack", damage: 100, count: 1, attackType: "melee" } },
        slot6: { label: "ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制 5ダメージ×6回", desc: "5ダメージ×6回。相手が回避を所持している場合、必ず回避を1回以上消費させる。射撃", effect: { type: "attack", damage: 5, count: 6, attackType: "shoot" } }
      },
      specials: [
        { name: "特性.PS装甲", effectType: "trait_ps_armor", timing: "passive", desc: "PS耐久300。ビーム・軽減不可以外の攻撃を軽減する。", actionType: "auto" },
        { name: "ストライカーパック換装", effectType: "strike_pack_change", timing: "self", desc: "通常、エール、ソード、ランチャーへ換装する。", actionType: "instant" },
        { name: "一閃", effectType: "sword_issen", timing: "self", desc: "ソードの回避上限を永続0にし、7.一閃を放つ。ゲーム中1回。", actionType: "instant" },
        { name: "覚醒", effectType: "sword_awaken", timing: "self", desc: "3EX化。特殊行動5解禁。特殊行動2は永続封印。", actionType: "instant" }
      ]
    },

    launcher: {
      name: "ランチャーストライクガンダム",
      hp: 600,
      evadeMax: 2,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ｲｰｹﾞﾙｼｭﾃﾙﾝ 10ダメージ×4回", desc: "10ダメージ×4回。射撃", effect: { type: "attack", damage: 10, count: 4, attackType: "shoot" } },
        slot2: { label: "ｺﾝﾎﾞｳｪﾎﾟﾝﾎﾟｯﾄﾞ 5ダメージ×10回", desc: "5ダメージ×10回。射撃", effect: { type: "attack", damage: 5, count: 10, attackType: "shoot" } },
        slot3: { label: "タックル 70ダメージ", desc: "70ダメージ。格闘", effect: { type: "attack", damage: 70, count: 1, attackType: "melee" } },
        slot4: { label: "回避 1回+回復30", desc: "回避1回+30回復", effect: { type: "custom", effectId: "launcher_evade_heal" } },
        slot5: { label: "アグニ(砲撃) 90ダメージ", desc: "90ダメージ。射撃、ビーム、軽減不可", effect: { type: "attack", damage: 90, count: 1, attackType: "shoot", beam: true, ignoreReduction: true } },
        slot6: { label: "アグニ(照射砲) 150ダメージ", desc: "150ダメージ。射撃、ビーム、軽減不可", effect: { type: "attack", damage: 150, count: 1, attackType: "shoot", beam: true, ignoreReduction: true } }
      },
      specials: [
        { name: "特性.PS装甲", effectType: "trait_ps_armor", timing: "passive", desc: "PS耐久300。ビーム・軽減不可以外の攻撃を軽減する。", actionType: "auto" },
        { name: "ストライカーパック換装", effectType: "strike_pack_change", timing: "self", desc: "通常、エール、ソード、ランチャーへ換装する。", actionType: "instant" },
        { name: "アグニ(フルチャージ)", effectType: "agni_full_charge", timing: "self", desc: "回避2以上で全消費。200ダメージ軽減不可。使用後1ターン行動不能、次換装まで被ダメ1.5倍。", actionType: "instant" },
{ name: "アグニ(出力解放)", effectType: "agni_output_unlock", timing: "attack", desc: "6の行動を選択した時実行可能。HP消費値の半分を単発ダメージへ加算。", actionType: "instant" }
      ]
    }
  }
};
