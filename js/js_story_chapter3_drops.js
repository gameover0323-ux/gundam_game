function slot(id, slotKey, label, cost, detail, data) {
  return { id, type: "slot", slotKey, label, cost, detail, data };
}

function equipment(id, label, cost, detail, data) {
  return { id, type: "equipment", label, cost, detail, data };
}

function skill(id, label, cost, detail, data) {
  return { id, type: "skill", label, cost, detail, data: { kind: "create_skill", ...data } };
}

export const STORY_CHAPTER3_DROPS_BY_UNIT_ID = {
  story_leo: [
    slot("story_leo_slot1_evade_1", "slot1", "回避 1回", 5, "回避を1回獲得する。", { kind: "evade", value: 1 }),
    slot("story_leo_slot2_drum_gun", "slot2", "ドラムガン", 0, "5ダメージ×6回 / 射撃 / リロード / 弾数30 / 1ターン3リロード", { kind: "attack", damage: 5, count: 6, attackType: "shoot", reload: true, ammoMax: 30, ammoCostPerUse: 6, reloadPerTurn: 3 }),
    slot("story_leo_slot6_heal_60", "slot6", "回復 60", 15, "HPを60回復する。", { kind: "heal", value: 60 }),
    equipment("story_leo_shield_option", "リーオーシールドオプション", 15, "20%の確率で1回のダメージを10軽減する。被弾時常に自動発動。", { kind: "auto_guard", chance: 20, reduceDamage: 10 })
  ],

  story_aries: [
    slot("story_aries_slot1_evade_2", "slot1", "回避 2回", 15, "回避を2回獲得する。", { kind: "evade", value: 2 }),
    slot("story_aries_slot2_chain_rifle", "slot2", "チェーンライフル", 0, "50ダメージ / 射撃 / リロード / 弾数3 / 1ターン1装填", { kind: "attack", damage: 50, count: 1, attackType: "shoot", reload: true, ammoMax: 3, ammoCostPerUse: 1, reloadPerTurn: 1 }),
    slot("story_aries_slot3_evade_2", "slot3", "回避 2回", 15, "回避を2回獲得する。", { kind: "evade", value: 2 }),
    slot("story_aries_slot6_full_barrage", "slot6", "一斉射撃(エアリーズ)", 40, "20ダメージ×4回 / 射撃 / 軽減不可", { kind: "attack", damage: 20, count: 4, attackType: "shoot", ignoreReduction: true }),
    equipment("story_aries_flight_unit", "追加フライトユニット", 15, "回避ストック最大値+1。", { kind: "evade_max_bonus", value: 1 })
  ],

  story_tallgeese: [
    slot("story_tallgeese_slot3_evade_3", "slot3", "回避 3回", 30, "回避を3回獲得する。", { kind: "evade", value: 3 }),
    slot("story_tallgeese_slot5_dover_beam", "slot5", "ドーバーガン(ビーム)", 60, "100ダメージ / 射撃 / ビーム / 軽減不可 / リロード / 弾数3 / 2ターン1装填", { kind: "attack", damage: 100, count: 1, attackType: "shoot", beam: true, ignoreReduction: true, reload: true, ammoMax: 3, ammoCostPerUse: 1, reloadTurnInterval: 2, reloadPerInterval: 1 }),
    slot("story_tallgeese_slot6_dover_shell", "slot6", "ドーバーガン(実弾)", 60, "50ダメージ×3回 / 射撃 / リロード / 弾数3 / 2ターン1装填", { kind: "attack", damage: 50, count: 3, attackType: "shoot", reload: true, ammoMax: 3, ammoCostPerUse: 1, reloadTurnInterval: 2, reloadPerInterval: 1 }),
    equipment("story_tallgeese_super_vernier", "スーパーバーニア", 80, "ゲーム中2回まで使用可能。回避ストック最大値を現在の所持回避数の倍にし、一時的に赤上限保持する。", { kind: "equipment_special", effectId: "super_vernier_temp_evade_cap_double", uses: 2 }),
    skill("story_tallgeese_killing_acceleration", "殺人的な加速", 50, "ゲーム中3回まで、現在HPを半分消費して回避所持数を最大にする。", { effectId: "killing_acceleration", uses: 3, hpCostRate: 0.5, setEvadeToMax: true })
  ],

  story_graze: [
    slot("story_graze_slot1_rifle", "slot1", "グレイズライフル", 9, "30ダメージ / 射撃 / 軽減不可", { kind: "attack", damage: 30, count: 1, attackType: "shoot", ignoreReduction: true }),
    slot("story_graze_slot2_axe", "slot2", "グレイズアックス", 10, "30ダメージ / 格闘 / 必中", { kind: "attack", damage: 30, count: 1, attackType: "melee", cannotEvade: true }),
    slot("story_graze_slot5_heal_60", "slot5", "回復 60", 15, "HPを60回復する。", { kind: "heal", value: 60 }),
    slot("story_graze_slot6_blade", "slot6", "グレイズブレード", 13, "50ダメージ / 格闘 / 軽減不可", { kind: "attack", damage: 50, count: 1, attackType: "melee", ignoreReduction: true }),
    equipment("story_graze_ahab_reactor_mass", "エイハブリアクター(量産機)", 15, "エネルギー回復量を毎ターンさらに5回復する。", { kind: "energy_regen_bonus", value: 5 })
  ],

  story_schwalbe_graze: [
    slot("story_schwalbe_slot1_long_rifle", "slot1", "シュバルべロングライフル", 35, "60ダメージ / 射撃 / 軽減不可 / リロード / 弾数5 / 3ターン1装填", { kind: "attack", damage: 60, count: 1, attackType: "shoot", ignoreReduction: true, reload: true, ammoMax: 5, ammoCostPerUse: 1, reloadTurnInterval: 3, reloadPerInterval: 1 }),
    slot("story_schwalbe_slot2_axe", "slot2", "バトルアックス", 20, "40ダメージ / 格闘 / 必中", { kind: "attack", damage: 40, count: 1, attackType: "melee", cannotEvade: true }),
    slot("story_schwalbe_slot4_wire_claw", "slot4", "ワイヤークロー", 40, "20ダメージ / 射撃 / 次の攻撃に必中付与", { kind: "attack", damage: 20, count: 1, attackType: "shoot", onHit: "next_attack_cannot_evade" }),
    slot("story_schwalbe_slot6_lance", "slot6", "ランスユニット", 70, "100ダメージ / 格闘 / 軽減不可", { kind: "attack", damage: 100, count: 1, attackType: "melee", ignoreReduction: true }),
    skill("story_schwalbe_chivalry", "騎士道精神", 20, "5ターンに1回発動可能。2ターン間お互いの会心を無効化する。", { effectId: "chivalry_no_critical", cooldown: 5, turns: 2 })
  ],

  story_graze_ritter: [
    slot("story_ritter_slot1_knight_blade_ignore", "slot1", "ナイトブレード", 30, "50ダメージ / 格闘 / 軽減不可", { kind: "attack", damage: 50, count: 1, attackType: "melee", ignoreReduction: true }),
    slot("story_ritter_slot2_knight_blade_cannot_evade", "slot2", "ナイトブレード", 30, "50ダメージ / 格闘 / 必中", { kind: "attack", damage: 50, count: 1, attackType: "melee", cannotEvade: true }),
    slot("story_ritter_slot3_combo", "slot3", "ナイトブレード連撃", 35, "20ダメージ×3回 / 格闘 / 軽減不可", { kind: "attack", damage: 20, count: 3, attackType: "melee", ignoreReduction: true }),
    slot("story_ritter_slot6_iai", "slot6", "ナイトブレード居合", 45, "次の相手の行動が攻撃の時、50ダメージ格闘が発動。", { kind: "custom", effectId: "story_graze_ritter_iai" }),
    equipment("story_ritter_ahab_reactor_gr", "エイハブリアクター(GR)", 30, "毎ターンのエネルギー回復量がさらに+10。", { kind: "energy_regen_bonus", value: 10 })
  ],

  story_graze_ein: [
    slot("story_ein_slot1_organic_orbit", "slot1", "有機軌道", 50, "次のターン2回行動。", { kind: "custom", effectId: "story_graze_ein_organic_orbit" }),
    slot("story_ein_slot2_large_axe", "slot2", "大型アックス", 70, "60ダメージ×2回 / 格闘 / 軽減不可", { kind: "attack", damage: 60, count: 2, attackType: "melee", ignoreReduction: true }),
    slot("story_ein_slot3_machine_gun", "slot3", "40mm機関銃", 50, "10ダメージ×8回 / 射撃", { kind: "attack", damage: 10, count: 8, attackType: "shoot" }),
    slot("story_ein_slot4_evade_4", "slot4", "回避 4回", 60, "回避を4回獲得する。", { kind: "evade", value: 4 }),
    slot("story_ein_slot5_drill_kick", "slot5", "ドリルキック", 70, "90ダメージ / 格闘 / ヒット時、追加で5ダメージ×6回", { kind: "custom", effectId: "story_graze_ein_drill_kick", damage: 90, count: 1, attackType: "melee", extraDamage: 5, extraCount: 6 }),
    slot("story_ein_slot6_alaya_combo", "slot6", "阿頼耶識軌道・連撃", 100, "前回の攻撃行動を抽選し、かつもう一度スロット行動を抽選する。", { kind: "custom", effectId: "story_graze_ein_combo" }),
    equipment("story_ein_pile_bunker", "パイルバンカー", 100, "攻撃ヒット時、50ダメージ格闘を1ターンに1回のみ追加発動する。", { kind: "extra_hit_attack", damage: 50, count: 1, attackType: "melee", oncePerTurn: true }),
    equipment("story_ein_nanolaminate_armor", "ナノラミネートアーマー", 80, "エネルギーが5以上の時、1回にEN5消費してビーム属性ダメージを半減する。", { kind: "beam_damage_half_with_energy", energyCost: 5 }),
    equipment("story_ein_brain_transplant", "脳髄移植", 70, "HP最大値が半分になるが、回避ストック最大値が5増える。", { kind: "hp_half_evade_max_bonus", hpMaxRate: 0.5, evadeMaxBonus: 5 }),
    skill("story_ein_alaya_orbit", "阿頼耶識軌道", 40, "HPを半減して回避所持数を2追加する。HP5以下の時は使用できない。", { effectId: "alaya_orbit", hpCostRate: 0.5, minHpExclusive: 5, evadeGain: 2 })
  ],

  story_guncannon: [
    slot("story_guncannon_slot2_cannon", "slot2", "240mm低反動キャノン砲", 90, "40ダメージ×4回 / 射撃 / リロード / 弾数8 / 1ターン1装填", { kind: "attack", damage: 40, count: 4, attackType: "shoot", reload: true, ammoMax: 8, ammoCostPerUse: 4, reloadPerTurn: 1 }),
    slot("story_guncannon_slot6_melee", "slot6", "格闘", 70, "40ダメージ×3回 / 格闘 / 軽減不可", { kind: "attack", damage: 40, count: 3, attackType: "melee", ignoreReduction: true })
  ],

  story_guntank: [
    slot("story_guntank_slot3_missile", "slot3", "ポップミサイルランチャー", 50, "10ダメージ×8回 / 射撃", { kind: "attack", damage: 10, count: 8, attackType: "shoot" }),
    slot("story_guntank_slot4_cannon", "slot4", "120mm低反動キャノン砲", 80, "60ダメージ×2回 / 射撃", { kind: "attack", damage: 60, count: 2, attackType: "shoot" }),
    slot("story_guntank_slot5_sniping_resist", "slot5", "狙撃耐性", 70, "次の射撃攻撃に必中を付与する。", { kind: "custom", effectId: "next_shoot_cannot_evade" }),
    slot("story_guntank_slot6_cannon", "slot6", "120mm低反動キャノン砲", 80, "60ダメージ×2回 / 射撃", { kind: "attack", damage: 60, count: 2, attackType: "shoot" })
  ],

  story_gyan: [
    slot("story_gyan_slot1_hide_bomb", "slot1", "ハイドボンブ", 60, "80ダメージ / 射撃 / 被弾すると回避を消滅させる。", { kind: "attack", damage: 80, count: 1, attackType: "shoot", onHit: "clear_evade" }),
    slot("story_gyan_slot2_evade_2", "slot2", "回避 2回", 15, "回避を2回獲得する。", { kind: "evade", value: 2 }),
    slot("story_gyan_slot3_beam_saber", "slot3", "高出力ビームサーベル", 40, "100ダメージ / 格闘 / ビーム", { kind: "attack", damage: 100, count: 1, attackType: "melee", beam: true }),
    slot("story_gyan_slot4_heal_80", "slot4", "回復 80", 40, "HPを80回復する。", { kind: "heal", value: 80 }),
    slot("story_gyan_slot5_needle_missile", "slot5", "ニードルミサイル", 14, "10ダメージ×5回 / 射撃", { kind: "attack", damage: 10, count: 5, attackType: "shoot" }),
    slot("story_gyan_slot6_stab", "slot6", "連続突き", 40, "10ダメージ×10回 / 格闘 / ビーム / 軽減不可", { kind: "attack", damage: 10, count: 10, attackType: "melee", beam: true, ignoreReduction: true })
  ],

  story_gouf_chapter3: [
    slot("story_gouf_slot1_heat_rod", "slot1", "ヒートロッド", 60, "30ダメージ / 格闘 / 被弾すると所持回避消滅", { kind: "attack", damage: 30, count: 1, attackType: "melee", onHit: "clear_evade" }),
    slot("story_gouf_slot3_heat_saber", "slot3", "ヒートサーベル", 20, "80ダメージ / 格闘", { kind: "attack", damage: 80, count: 1, attackType: "melee" }),
    slot("story_gouf_slot6_capture", "slot6", "ヒートロッド捕縛", 60, "50ダメージ / 格闘 / 被弾すると次の攻撃が必中になる。", { kind: "attack", damage: 50, count: 1, attackType: "melee", onHit: "next_attack_cannot_evade" })
  ],

  story_psycho_gundam: [
    slot("story_psycho_slot5_focus_beam", "slot5", "収束ビーム砲", 0, "250ダメージ / 射撃 / ビーム / エネルギー / EN消費100 / ダメージ増加値100", { kind: "attack", damage: 250, count: 1, attackType: "shoot", beam: true, energy: true, energyCost: 100, energyIncrease: 100 })
  ],

  story_death_army: [
    slot("story_death_army_slot1_beam_rifle", "slot1", "棍棒型ビームライフル", 10, "70ダメージ / 射撃 / ビーム", { kind: "attack", damage: 70, count: 1, attackType: "shoot", beam: true }),
    slot("story_death_army_slot1_spear", "slot1", "電撃銛", 20, "50ダメージ / 格闘 / ヒット時相手回避-2", { kind: "attack", damage: 50, count: 1, attackType: "melee", onHit: "reduce_evade_2" }),
    slot("story_death_army_slot1_machine_gun", "slot1", "マシンガンデスライフル", 10, "10ダメージ×6回 / 射撃", { kind: "attack", damage: 10, count: 6, attackType: "shoot" }),
    slot("story_death_army_slot1_evade_2", "slot1", "回避 2回", 15, "回避を2回獲得する。", { kind: "evade", value: 2 }),
    slot("story_death_army_slot1_master_cross", "slot1", "マスタークロス", 20, "10ダメージ / 格闘 / ヒット時、次の攻撃必中", { kind: "attack", damage: 10, count: 1, attackType: "melee", onHit: "next_attack_cannot_evade" }),
    slot("story_death_army_slot2_club", "slot2", "棍棒", 15, "80ダメージ / 格闘", { kind: "attack", damage: 80, count: 1, attackType: "melee" }),
    slot("story_death_army_slot2_beam_cannon", "slot2", "大口径ビームキャノン", 0, "100ダメージ / 射撃 / ビーム / エネルギー / EN消費50 / ダメージ増加値50", { kind: "attack", damage: 100, count: 1, attackType: "shoot", beam: true, energy: true, energyCost: 50, energyIncrease: 50 }),
    slot("story_death_army_slot3_charge", "slot3", "銛突進", 13, "100ダメージ / 格闘", { kind: "attack", damage: 100, count: 1, attackType: "melee" }),
    slot("story_death_army_slot4_beam_cannon", "slot4", "大口径ビームキャノン", 0, "100ダメージ / 射撃 / ビーム / エネルギー / EN消費50 / ダメージ増加値50", { kind: "attack", damage: 100, count: 1, attackType: "shoot", beam: true, energy: true, energyCost: 50, energyIncrease: 50 }),
    slot("story_death_army_slot4_ranbu", "slot4", "乱舞", 45, "30ダメージ×3回 / 格闘 / 回避1回", { kind: "custom", effectId: "death_army_ranbu", damage: 30, count: 3, attackType: "melee", evadeGain: 1 }),
    slot("story_death_army_slot5_spear_combo", "slot5", "電撃銛連撃", 45, "30ダメージ×3回 / 各ヒット時相手回避-1", { kind: "attack", damage: 30, count: 3, attackType: "melee", onHit: "reduce_evade_1_each" }),
    slot("story_death_army_slot5_melee", "slot5", "格闘", 15, "20ダメージ×3回 / 格闘", { kind: "attack", damage: 20, count: 3, attackType: "melee" }),
    slot("story_death_army_slot6_fake_finger", "slot6", "フェイクダークネスフィンガー", 0, "150ダメージ / 格闘 / 軽減不可 / エネルギー / EN消費30 / ダメージ増加値20", { kind: "attack", damage: 150, count: 1, attackType: "melee", ignoreReduction: true, energy: true, energyCost: 30, energyIncrease: 20 }),
    equipment("story_death_army_master_cross", "マスタークロス", 7, "ゲーム中1度だけ行動権を2増加させる。", { kind: "action_gain_equipment", uses: 1, actionGain: 2 }),
    equipment("story_death_army_dg_cells", "DG細胞(デス)", 20, "回避所持数1以上なら毎ターンHP5回復。回避0なら毎ターン5ダメージ。", { kind: "turn_regen_or_damage_by_evade", heal: 5, damage: 5 }),
    skill("story_death_army_arts", "デスアーミーアーツ", 30, "3ターンに1回、行動権1消費でデスアーミー種のスロットを1つランダム発動する。", { effectId: "death_army_arts", cooldown: 3, actionCost: 1 })
  ],

  story_gunbarrel_dagger: [
    slot("story_gunbarrel_slot1_combo_rifle", "slot1", "ガンバレルコンビネーションライフル", 60, "20ダメージ×所持回避数。0の時50ダメージ / 射撃 / ビーム", { kind: "custom", effectId: "story_gunbarrel_combo_rifle" }),
    slot("story_gunbarrel_slot3_evade_4", "slot3", "回避 4回", 60, "回避を4回獲得する。", { kind: "evade", value: 4 }),
    slot("story_gunbarrel_slot4_heal_60", "slot4", "回復 60", 15, "HPを60回復する。", { kind: "heal", value: 60 }),
    slot("story_gunbarrel_slot5_gatling", "slot5", "ガンバレルガトリング", 12, "10ダメージ×8回 / 射撃 / リロード / 弾数8 / 1ターン2装填", { kind: "attack", damage: 10, count: 8, attackType: "shoot", reload: true, ammoMax: 8, ammoCostPerUse: 8, reloadPerTurn: 2 }),
    slot("story_gunbarrel_slot6_all_range", "slot6", "ガンバレルオールレンジショット", 100, "30ダメージ×所持回避数。0の時80ダメージ / 射撃 / ビーム", { kind: "custom", effectId: "story_gunbarrel_all_range" })
  ]
};

export function getStoryChapter3Drops(unitId, fallback = []) {
  const direct = STORY_CHAPTER3_DROPS_BY_UNIT_ID[unitId];
  if (Array.isArray(direct)) return direct;
  return Array.isArray(fallback) ? fallback : [];
}
