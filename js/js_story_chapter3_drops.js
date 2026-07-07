function slot(id, slotKey, label, cost, data = {}) {
  return { id, type: "slot", slotKey, label, cost, data };
}

function equipment(id, label, cost, data = {}) {
  return { id, type: "equipment", label, cost, data };
}

function skill(id, label, cost, data = {}) {
  return { id, type: "skill", label, cost, data: { ...data, kind: "create_skill" } };
}

export const STORY_CHAPTER3_DROPS_BY_UNIT_ID = {
  story_leo: [
    slot("story_leo_slot1_evade_1", "slot1", "スロット1.回避 1回", 5),
    slot("story_leo_slot2_drum_gun", "slot2", "スロット2.ドラムガン 5ダメージ×6回 射撃 リロード 弾数30 1ターン3リロード", 0),
    slot("story_leo_slot6_heal_60", "slot6", "スロット6.回復 60", 15),
    equipment("story_leo_shield_option", "装備品 リーオーシールドオプション", 15)
  ],

  story_aries: [
    slot("story_aries_slot1_evade_2", "slot1", "スロット1.回避 2回", 15),
    slot("story_aries_slot2_chain_rifle", "slot2", "スロット2.チェーンライフル 50ダメージ 射撃 リロード 弾数3 1ターン1装填", 0),
    slot("story_aries_slot3_evade_2", "slot3", "スロット3.回避 2回", 15),
    slot("story_aries_slot6_full_barrage", "slot6", "スロット6.一斉射撃(エアリーズ) 20ダメージ×4回 射撃 軽減不可", 40),
    equipment("story_aries_flight_unit", "装備品 追加フライトユニット", 15)
  ],

  story_tallgeese: [
    slot("story_tallgeese_slot3_evade_3", "slot3", "スロット3.回避 3回", 30),
    slot("story_tallgeese_slot5_dover_beam", "slot5", "スロット5.ドーバーガン(ビーム) 100ダメージ 射撃 ビーム 軽減不可 リロード 弾数3 2ターン1装填", 60),
    slot("story_tallgeese_slot6_dover_shell", "slot6", "スロット6.ドーバーガン(実弾) 50ダメージ×3回 射撃 リロード 弾数3 2ターン1装填", 60),
    equipment("story_tallgeese_super_vernier", "装備品 スーパーバーニア", 80),
    skill("story_tallgeese_killing_acceleration", "クリエイトスキル 殺人的な加速", 50)
  ],

  story_graze: [
    slot("story_graze_slot1_rifle", "slot1", "スロット1.グレイズライフル 30ダメージ 射撃 軽減不可", 9),
    slot("story_graze_slot2_axe", "slot2", "スロット2.グレイズアックス 30ダメージ 格闘 必中", 10),
    slot("story_graze_slot5_heal_60", "slot5", "スロット5.回復 60", 15),
    slot("story_graze_slot6_blade", "slot6", "スロット6.グレイズブレード 50ダメージ 格闘 軽減不可", 13),
    equipment("story_graze_ahab_reactor_mass", "装備品 エイハブリアクター(量産機)", 15)
  ],

  story_schwalbe_graze: [
    slot("story_schwalbe_slot1_long_rifle", "slot1", "スロット1.シュバルべロングライフル 60ダメージ 射撃 軽減不可 リロード 弾数5 3ターン1装填", 35),
    slot("story_schwalbe_slot2_axe", "slot2", "スロット2.バトルアックス 40ダメージ 格闘 必中", 20),
    slot("story_schwalbe_slot4_wire_claw", "slot4", "スロット4.ワイヤークロー 20ダメージ 射撃 次の攻撃に必中付与", 40),
    slot("story_schwalbe_slot6_lance", "slot6", "スロット6.ランスユニット 100ダメージ 格闘 軽減不可", 70),
    skill("story_schwalbe_chivalry", "クリエイトスキル 騎士道精神", 20)
  ],

  story_graze_ritter: [
    slot("story_ritter_slot1_knight_blade_ignore", "slot1", "スロット1.ナイトブレード 50ダメージ 格闘 軽減不可", 30),
    slot("story_ritter_slot2_knight_blade_cannot_evade", "slot2", "スロット2.ナイトブレード 50ダメージ 格闘 必中", 30),
    slot("story_ritter_slot3_combo", "slot3", "スロット3.ナイトブレード連撃 20ダメージ×3回 格闘 軽減不可", 35),
    slot("story_ritter_slot6_iai", "slot6", "スロット6.ナイトブレード居合 次の相手の行動が攻撃の時 50ダメージ 格闘が発動", 45),
    equipment("story_ritter_ahab_reactor_gr", "装備品 エイハブリアクター(GR)", 30)
  ],

  story_graze_ein: [
    slot("story_ein_slot1_organic_orbit", "slot1", "スロット1.有機軌道 次のターン2回行動", 50),
    slot("story_ein_slot2_large_axe", "slot2", "スロット2.大型アックス 60ダメージ×2回 格闘 軽減不可", 70),
    slot("story_ein_slot3_machine_gun", "slot3", "スロット3.40mm機関銃 10ダメージ×8回 射撃", 50),
    slot("story_ein_slot4_evade_4", "slot4", "スロット4.回避 4回", 60),
    slot("story_ein_slot5_drill_kick", "slot5", "スロット5.ドリルキック 90ダメージ 格闘 ヒット時、追加で5ダメージ×6回", 70),
    slot("story_ein_slot6_alaya_combo", "slot6", "スロット6.阿頼耶識軌道・連撃 前回の攻撃行動を抽選し、かつもう一度スロット行動を抽選する。", 100),
    equipment("story_ein_pile_bunker", "装備品 パイルバンカー", 100),
    equipment("story_ein_nanolaminate_armor", "装備品 ナノラミネートアーマー", 80),
    equipment("story_ein_brain_transplant", "装備品 脳髄移植", 70),
    skill("story_ein_alaya_orbit", "クリエイトスキル 阿頼耶識軌道", 40)
  ],

  story_guncannon: [
    slot("story_guncannon_slot2_cannon", "slot2", "スロット2.240mm低反動キャノン砲 40ダメージ×4回 射撃 リロード 弾数8 1ターン1装填", 90),
    slot("story_guncannon_slot6_melee", "slot6", "スロット6.格闘 40ダメージ×3回 格闘 軽減不可", 70)
  ],

  story_guntank: [
    slot("story_guntank_slot3_missile", "slot3", "スロット3.ポップミサイルランチャー 10ダメージ×8回 射撃", 50),
    slot("story_guntank_slot4_cannon", "slot4", "スロット4.120mm低反動キャノン砲 60ダメージ×2回 射撃", 80),
    slot("story_guntank_slot5_sniping_resist", "slot5", "スロット5.狙撃耐性 次の射撃攻撃に必中を付与", 70),
    slot("story_guntank_slot6_cannon", "slot6", "スロット6.120mm低反動キャノン砲 60ダメージ×2回 射撃", 80)
  ],

  story_gyan: [
    slot("story_gyan_slot1_hide_bomb", "slot1", "スロット1.ハイドボンブ 80ダメージ 射撃 被弾すると回避を消滅させる。", 60),
    slot("story_gyan_slot2_evade_2", "slot2", "スロット2.回避 2回", 15),
    slot("story_gyan_slot3_beam_saber", "slot3", "スロット3.高出力ビームサーベル 100ダメージ 格闘 ビーム", 40),
    slot("story_gyan_slot4_heal_80", "slot4", "スロット4.回復 80", 40),
    slot("story_gyan_slot5_needle_missile", "slot5", "スロット5.ニードルミサイル 10ダメージ×5回 射撃", 14),
    slot("story_gyan_slot6_stab", "slot6", "スロット6.連続突き 10ダメージ×10回 格闘 ビーム 軽減不可", 40)
  ],

  story_gouf_chapter3: [
    slot("story_gouf_slot1_heat_rod", "slot1", "スロット1.ヒートロッド 30ダメージ 格闘 被弾すると所持回避消滅", 60),
    slot("story_gouf_slot3_heat_saber", "slot3", "スロット3.ヒートサーベル 80ダメージ 格闘", 20),
    slot("story_gouf_slot6_capture", "slot6", "スロット6.ヒートロッド捕縛 50ダメージ 格闘 被弾すると次の攻撃が必中になる", 60)
  ],

  story_psycho_gundam: [
    slot("story_psycho_slot5_focus_beam", "slot5", "スロット5.収束ビーム砲 250ダメージ 射撃 ビーム エネルギー [EN消費100][ダメージ増加値100]", 0)
  ],

  story_death_army: [
    slot("story_death_army_slot1_beam_rifle", "slot1", "スロット1.棍棒型ビームライフル 70ダメージ 射撃 ビーム", 10),
    slot("story_death_army_slot1_spear", "slot1", "スロット1.電撃銛 50ダメージ 格闘 ヒット時相手回避-2", 20),
    slot("story_death_army_slot1_machine_gun", "slot1", "スロット1.マシンガンデスライフル 10ダメージ×6回 射撃", 10),
    slot("story_death_army_slot1_evade_2", "slot1", "スロット1.回避 2回", 15),
    slot("story_death_army_slot1_master_cross", "slot1", "スロット1.マスタークロス 10ダメージ ヒット時、次の攻撃必中", 20),
    slot("story_death_army_slot2_club", "slot2", "スロット2.棍棒 80ダメージ 格闘", 15),
    slot("story_death_army_slot2_beam_cannon", "slot2", "スロット2.大口径ビームキャノン 100ダメージ 射撃 ビーム エネルギー [EN消費50][ダメージ増加値50]", 0),
    slot("story_death_army_slot3_charge", "slot3", "スロット3.銛突進 100ダメージ 格闘", 13),
    slot("story_death_army_slot4_beam_cannon", "slot4", "スロット4.大口径ビームキャノン 100ダメージ 射撃 ビーム エネルギー [EN消費50][ダメージ増加値50]", 0),
    slot("story_death_army_slot4_ranbu", "slot4", "スロット4.乱舞 30ダメージ×3回 格闘、回避1回", 45),
    slot("story_death_army_slot5_spear_combo", "slot5", "スロット5.電撃銛連撃 30ダメージ×3回 各ヒット時相手回避-1", 45),
    slot("story_death_army_slot5_melee", "slot5", "スロット5.格闘 20ダメージ×3回 格闘", 15),
    slot("story_death_army_slot6_fake_finger", "slot6", "スロット6.フェイクダークネスフィンガー 150ダメージ 格闘、軽減不可 エネルギー [EN消費30][ダメージ増加値20]", 0),
    equipment("story_death_army_master_cross", "装備品 マスタークロス", 7),
    equipment("story_death_army_dg_cells", "装備品 DG細胞(デス)", 20),
    skill("story_death_army_arts", "スキル デスアーミーアーツ", 30)
  ],

  story_gunbarrel_dagger: [
    slot("story_gunbarrel_slot1_combo_rifle", "slot1", "スロット1.ガンバレルコンビネーションライフル 20ダメージ×所持回避数 0の時、50ダメージ 射撃 ビーム", 60),
    slot("story_gunbarrel_slot3_evade_4", "slot3", "スロット3.回避 4回", 60),
    slot("story_gunbarrel_slot4_heal_60", "slot4", "スロット4.回復 60", 15),
    slot("story_gunbarrel_slot5_gatling", "slot5", "スロット5.ガンバレルガトリング 10ダメージ×8回 射撃 リロード 弾数8 1ターン2装填", 12),
    slot("story_gunbarrel_slot6_all_range", "slot6", "スロット6.ガンバレルオールレンジショット 30ダメージ×所持回避数 0の時 80ダメージ 射撃 ビーム", 100)
  ]
};

export function getStoryChapter3Drops(unitId, fallback = []) {
  const direct = STORY_CHAPTER3_DROPS_BY_UNIT_ID[unitId];
  if (Array.isArray(direct)) return direct;
  return Array.isArray(fallback) ? fallback : [];
}
