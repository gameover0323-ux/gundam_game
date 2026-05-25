export const exia = {
  id: "exia",
  name: "ガンダムエクシア",
  defaultFormId: "base",
  forms: {
    base: {
      name: "ガンダムエクシア",
      hp: 500,
      evadeMax: 4,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"],
      slots: {
        slot1: { label: "GNｿｰﾄﾞﾗｲﾌﾙﾓｰﾄﾞ 30ダメージ×2回", desc: "30ダメージ×2回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 30, count: 2, beam: true } },
        slot2: { label: "GNﾋﾞｰﾑｻｰﾍﾞﾙ 60ダメージ", desc: "60ダメージ。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 60, count: 1, beam: true } },
        slot3: { label: "回避 +2", desc: "回避ストック+2", effect: { type: "evade", amount: 2 } },
        slot4: { label: "GNソード 70ダメージ", desc: "70ダメージ。格闘", effect: { type: "attack", attackType: "melee", damage: 70, count: 1 } },
        slot5: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } },
        slot6: { label: "GNダガー 20ダメージ", desc: "20ダメージ。相手に回避がある時にヒットすると行動回数+1。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 1, beam: true, special: "exia_gn_dagger_action_plus" } },
        slot7: { label: "セブンソードコンビネーション", desc: "30ダメージ×任意消費回避数。最大7回。格闘", effect: { type: "custom", customType: "exia_seven_sword" } }
      },
      specials: [
        { name: "ｾﾌﾞﾝｿｰﾄﾞｺﾝﾋﾞﾈｰｼｮﾝ", effectType: "exia_seven_sword", timing: "self", desc: "使用すると次の自分ターンが行動不能になる。回避を1〜7消費し、消費数ぶん30ダメージ格闘攻撃を行う。", actionType: "choice" },
        { name: "シールド", effectType: "shield", timing: "reaction", desc: "エクシアリペア以外の4形態でゲーム中3回まで、1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "TRANS-AM発動", effectType: "exia_trans_am", timing: "self", desc: "ガンダムエクシア（TRANS-AM）に変化する。自分ターン開始時にHP50減少。解除時は次の自分ターンが行動不能。", actionType: "instant" },
        { name: "アヴァランチユニット", effectType: "exia_avalanche", timing: "self", desc: "行動権を1消費してアヴァランチエクシアに換装する。離脱解除で使用権を放棄した場合は使用不可。", actionType: "instant" },
        { name: "エクシアリペア", effectType: "exia_repair_trait", timing: "auto", desc: "通常エクシア形態でHP0になる致命的ダメージを受けた時、エクシアリペアに換装する。", actionType: "auto" }
      ]
    },

    trans_am: {
      name: "ガンダムエクシア(TRANS-AM)",
      hp: 500,
      evadeMax: 12,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "GNｿｰﾄﾞﾗｲﾌﾙﾓｰﾄﾞ 30ダメージ×3回", desc: "30ダメージ×3回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 30, count: 3, beam: true } },
        slot2: { label: "回避 +6", desc: "回避ストック+6", effect: { type: "evade", amount: 6 } },
        slot3: { label: "GNﾋﾞｰﾑｻｰﾍﾞﾙｺﾝﾋﾞﾈｰｼｮﾝ 50ダメージ×3回", desc: "50ダメージ×3回。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 50, count: 3, beam: true } },
        slot4: { label: "GNソード突貫 150ダメージ", desc: "150ダメージ。格闘、軽減不可", effect: { type: "attack", attackType: "melee", damage: 150, count: 1, ignoreReduction: true } },
        slot5: { label: "連続斬撃", desc: "20ダメージ×所持回避数。所持0なら90ダメージ単発。格闘", effect: { type: "custom", customType: "exia_trans_am_slash" } },
        slot6: { label: "ｾﾌﾞﾝｿｰﾄﾞｺﾝﾋﾞﾈｰｼｮﾝ 30ダメージ×7回", desc: "30ダメージ×7回。格闘", effect: { type: "attack", attackType: "melee", damage: 30, count: 7 } }
      },
      specials: [
        { name: "特性", effectType: "exia_trans_am_trait", timing: "auto", desc: "自分ターン開始時にHP50減少。自壊ダメージでは敗北せずHP1で通常エクシアへ戻り、次の自分ターンが行動不能。", actionType: "auto" },
        { name: "シールド", effectType: "shield", timing: "reaction", desc: "エクシアリペア以外の4形態でゲーム中3回まで、1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "TRANS-AM最大解放", effectType: "exia_trans_am_overdrive", timing: "self", desc: "HP25を消費して行動権+1。1ターンに追加3回まで。", actionType: "instant" },
        { name: "俺がガンダムだ！", effectType: "exia_i_am_gundam", timing: "self", desc: "HP100を消費し、このターンに実際に与えた攻撃ダメージの半分を回復する。", actionType: "instant" },
        { name: "TRANS-AM解除", effectType: "exia_trans_am_release", timing: "self", desc: "通常エクシアに戻る。次の自分ターンが行動不能。", actionType: "instant" }
      ]
    },

    avalanche: {
      name: "アヴァランチエクシア",
      hp: 500,
      evadeMax: 8,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "GNビームダガー 10ダメージ×2回", desc: "10ダメージ×2回。相手に回避がある状態でフルヒットすると行動回数+1。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 10, count: 2, beam: true, special: "exia_full_hit_enemy_evade_action_plus" } },
        slot2: { label: "GNビームサーベル 20ダメージ", desc: "20ダメージ。ヒット時回避+1。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 20, count: 1, beam: true, special: "exia_hit_evade_plus_1" } },
        slot3: { label: "GNバルカン 5ダメージ×6回", desc: "5ダメージ×6回。射撃、軽減不可", effect: { type: "attack", attackType: "shoot", damage: 5, count: 6, ignoreReduction: true } },
        slot4: { label: "回避 +4", desc: "回避ストック+4", effect: { type: "evade", amount: 4 } },
        slot5: { label: "粒子放出", desc: "現在の回避所持数が倍になる。0の時は次のターンが2回行動。強化", effect: { type: "custom", customType: "exia_particle_release" } },
        slot6: { label: "GNロング＆ショートブレイド", desc: "10ダメージ×所持回避数。所持0なら20ダメージ+回避+1。格闘", effect: { type: "custom", customType: "exia_long_short_blade" } }
      },
      specials: [
        { name: "解除", effectType: "exia_avalanche_release", timing: "self", desc: "行動権を1消費して通常エクシアに戻る。", actionType: "instant" },
        { name: "シールド", effectType: "shield", timing: "reaction", desc: "エクシアリペア以外の4形態でゲーム中3回まで、1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "TRANS-AM発動", effectType: "exia_avalanche_trans_am", timing: "self", desc: "アヴァランチエクシア(TRANS-AM)に変化する。", actionType: "instant" },
        { name: "離脱解除", effectType: "exia_avalanche_escape", timing: "reaction", desc: "ゲーム中1度だけこの形態の使用権を放棄して、そのターンのダメージを無効化し通常エクシアに戻る。行動権は消費しない。", actionType: "instant" },
        { name: "超加速回避", effectType: "exia_avalanche_super_evade", timing: "auto", desc: "所持回避数が最大値を超えている時、必中攻撃を通常回避可能。", actionType: "auto" }
      ]
    },

    avalanche_trans_am: {
      name: "アヴァランチエクシア(TRANS-AM)",
      hp: 500,
      evadeMax: 24,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "GNビームダガー 30ダメージ×2回", desc: "30ダメージ×2回。相手に回避がある状態でフルヒットすると行動権+1。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 30, count: 2, beam: true, special: "exia_full_hit_enemy_evade_action_plus" } },
        slot2: { label: "GNビームサーベル 60ダメージ", desc: "60ダメージ。ヒット時回避+3。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 60, count: 1, beam: true, special: "exia_hit_evade_plus_3" } },
        slot3: { label: "GNバルカン 15ダメージ×6回", desc: "15ダメージ×6回。射撃、軽減不可", effect: { type: "attack", attackType: "shoot", damage: 15, count: 6, ignoreReduction: true } },
        slot4: { label: "回避 +12", desc: "回避ストック+12", effect: { type: "evade", amount: 12 } },
        slot5: { label: "粒子放出", desc: "回避所持数が倍になる。0の時は次のターン2回行動。", effect: { type: "custom", customType: "exia_particle_release" } },
        slot6: { label: "GNロング＆ショートブレイド", desc: "10ダメージ×所持回避数。所持0なら60ダメージ+回避+1。格闘", effect: { type: "custom", customType: "exia_trans_am_long_short_blade" } }
      },
      specials: [
        { name: "特性", effectType: "exia_trans_am_trait", timing: "auto", desc: "自分ターン開始時にHP50減少。自壊ダメージでは敗北せずHP1残り、次の自分ターンが行動不能。", actionType: "auto" },
        { name: "シールド", effectType: "shield", timing: "reaction", desc: "エクシアリペア以外の4形態でゲーム中3回まで、1ターンに受けるダメージを半減する。", actionType: "instant" },
        { name: "TRANS-AM粒子解放", effectType: "exia_avalanche_trans_am_particle_overdrive", timing: "self", desc: "回避3を消費して行動権+1。1ターンに追加3回まで。", actionType: "instant" },
        { name: "TRANS-AM超回避", effectType: "exia_trans_am_super_evade", timing: "auto", desc: "この形態では回避数があれば必中攻撃を通常回避可能。", actionType: "auto" },
        { name: "TRANS-AM解除", effectType: "exia_avalanche_trans_am_release", timing: "self", desc: "アヴァランチエクシアに戻る。次の自分ターンが行動不能。", actionType: "instant" }
      ]
    },

    repair: {
      name: "エクシアリペア",
      hp: 100,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "回避 +1", desc: "回避ストック+1", effect: { type: "evade", amount: 1 } },
        slot2: { label: "回復 20", desc: "HP20回復", effect: { type: "heal", amount: 20 } },
        slot3: { label: "GNソード 30ダメージ", desc: "30ダメージ。格闘", effect: { type: "attack", attackType: "melee", damage: 30, count: 1 } },
        slot4: { label: "GNビームライフル 20ダメージ×2回", desc: "20ダメージ×2回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 2, beam: true } },
        slot5: { label: "TRANS-AM発動", desc: "次のターンの効果が3倍になり、5が5EXになる。その次のターン休み。", effect: { type: "custom", customType: "exia_repair_trans_am" } },
        slot6: { label: "突貫 50ダメージ", desc: "50ダメージ。格闘、軽減不可", effect: { type: "attack", attackType: "melee", damage: 50, count: 1, ignoreReduction: true } }
      },
      specials: [
        { name: "特性", effectType: "exia_repair_trait", timing: "auto", desc: "変形時、初期HP100。この形態で致命的ダメージを受けた時、1度だけHP1で耐える。", actionType: "auto" },
        { name: "シールド", effectType: "shield", timing: "reaction", desc: "エクシアリペア専用。3回まで、1ターンに受けるダメージを半減する。", actionType: "instant" }
      ]
    }
  }
};
