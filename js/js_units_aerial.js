export const aerial = {
  id: "aerial",
  name: "ガンダム・エアリアル",
  defaultFormId: "base",
  forms: {
    base: {
      name: "ガンダム・エアリアル",
      hp: 300,
      evadeMax: 8,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"],
      slots: {
        slot1: { label: "バルカン砲 10ダメージ×4回", desc: "10ダメージ×4回。射撃", effect: { type: "attack", attackType: "shoot", damage: 10, count: 4 } },
        slot2: { label: "ビームライフル 50ダメージ", desc: "50ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 50, count: 1, beam: true } },
        slot3: { label: "ビームサーベル 30ダメージ×2回", desc: "30ダメージ×2回。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 30, count: 2, beam: true } },
        slot4: { label: "回避 +4", desc: "回避ストック+4", effect: { type: "evade", amount: 4 } },
        slot5: { label: "エスカッシャン 120ダメージ", desc: "120ダメージ。射撃、ビーム、軽減不可", effect: { type: "attack", attackType: "shoot", damage: 120, count: 1, beam: true, ignoreReduction: true } },
        slot6: { label: "ﾊﾟｰﾒｯﾄｽｺｱ･ｼｯｸｽ", desc: "6ターンの間エアリアル・スコアシックスに強化される。", effect: { type: "custom", customType: "aerial_score_six" } },
        slot7: { label: "ガンビット 20ダメージ", desc: "20ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 1, beam: true } }
      },
      specials: [
        { name: "ガンビットシールド行動", effectType: "aerial_auto_gundbit_shield", timing: "auto", actionType: "auto", desc: "回避ストックが0の時に攻撃を受ける際、50%の確率で自動的に攻撃を無効化する。" },
        { name: "コンポジットガンビットシールド", effectType: "aerial_composite_shield", timing: "reaction", actionType: "instant", desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを無効化する。スコアシックスになるたびに使用回数が1回復する。" },
        { name: "意思", effectType: "aerial_will", timing: "auto", actionType: "auto", desc: "100ダメージ受ける毎に所持回避数が倍になる。赤上限として超過分も保持する。" },
        { name: "ガンビット連携", effectType: "aerial_gundbit_link", timing: "self", actionType: "instant", desc: "所持回避数を1消費して7.ガンビットを発動する。1ターンに3回まで。" }
      ]
    },
    score_six: {
      name: "ガンダム・エアリアル(スコアシックス)",
      hp: 300,
      evadeMax: 10,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"],
      slots: {
        slot1: { label: "有機軌道", desc: "次のターンが3回行動になる。3回行動時、1EXになる。", effect: { type: "custom", customType: "aerial_orbital_maneuver" } },
        slot2: { label: "ビームライフル 30ダメージ×4回", desc: "30ダメージ×4回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 30, count: 4, beam: true } },
        slot3: { label: "ビームサーベル", desc: "20ダメージ×所持回避数。所持0なら60ダメージ×1回。格闘、ビーム", effect: { type: "custom", customType: "aerial_score_six_saber" } },
        slot4: { label: "回避 +5", desc: "回避ストック+5", effect: { type: "evade", amount: 5 } },
        slot5: { label: "回復 120", desc: "HP120回復", effect: { type: "heal", amount: 120 } },
        slot6: { label: "エスカッシャン", desc: "30ダメージ×所持回避数の単発ダメージ。所持0なら120ダメージ。射撃、ビーム、軽減不可", effect: { type: "custom", customType: "aerial_score_six_escutcheon" } },
        slot7: { label: "ガンビット 20ダメージ", desc: "20ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 1, beam: true } }
      },
      specials: [
        { name: "ガンビットシールド行動", effectType: "aerial_auto_gundbit_shield", timing: "auto", actionType: "auto", desc: "回避ストックが0の時に攻撃を受ける際、50%の確率で自動的に攻撃を無効化する。" },
        { name: "コンポジットガンビットシールド", effectType: "aerial_composite_shield", timing: "reaction", actionType: "instant", desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを無効化する。スコアシックスになるたびに使用回数が1回復する。" },
        { name: "意思", effectType: "aerial_will", timing: "auto", actionType: "auto", desc: "100ダメージ受ける毎に所持回避数が倍になる。赤上限として超過分も保持する。" },
        { name: "ガンビット連携", effectType: "aerial_gundbit_link", timing: "self", actionType: "instant", desc: "所持回避数を1消費して7.ガンビットを発動する。1ターンに3回まで。" },
        { name: "データストーム補助", effectType: "aerial_data_storm_support", timing: "self", actionType: "instant", desc: "所持回避数を3消費して強化ターン+1。" }
      ]
    }
  }
};
