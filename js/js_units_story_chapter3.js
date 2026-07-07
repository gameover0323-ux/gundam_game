import { getStoryChapter3Drops } from "./js_story_chapter3_drops.js";

const ORDER = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function attack(label, desc, attackType, damage, count = 1, extra = {}) {
  return {
    label,
    desc,
    effect: {
      type: "attack",
      attackType,
      damage,
      count,
      ...extra
    }
  };
}

function evade(label, amount) {
  return {
    label,
    desc: `回避+${amount}`,
    effect: { type: "evade", amount }
  };
}

function heal(label, amount) {
  return {
    label,
    desc: `${amount}回復`,
    effect: { type: "heal", amount }
  };
}

function custom(label, desc, customType) {
  return {
    label,
    desc,
    effect: { type: "custom", customType }
  };
}

function makeUnit({ id, name, hp, evadeMax, exp, companionCost, unlockCondition, slots, specials = [], storyDrops = [] }) {
  return {
    id,
    name,
    defaultFormId: "base",
    exp,
    storyCompanion: companionCost ? { unlockCondition: unlockCondition || "条件達成で同行可能。", cost: companionCost } : null,
    storyDrops: { random: getStoryChapter3Drops(id, storyDrops) },
    forms: {
      base: {
        name,
        hp,
        evadeMax,
        rollableSlotOrder: ORDER,
        ownedSlotOrder: ORDER,
        slots,
        specials
      }
    }
  };
}
export const story_leo = makeUnit({
  id: "story_leo",
  name: "リーオー",
  hp: 300,
  evadeMax: 2,
  exp: 7,
  companionCost: 40,
  unlockCondition: "チャプター3ショップで購入する。",
  slots: {
    slot1: evade("回避+1", 1),
    slot2: attack("ドラムガン 5ダメージ×6回", "5ダメージ×6回。射撃", "shoot", 5, 6),
    slot3: attack("ビームライフル 60ダメージ", "60ダメージ。射撃、ビーム", "shoot", 60, 1, { beam: true }),
    slot4: attack("バズーカ 70ダメージ", "70ダメージ。射撃", "shoot", 70),
    slot5: attack("ビームサーベル 30ダメージ×2回", "30ダメージ×2回。格闘、ビーム", "melee", 30, 2, { beam: true }),
    slot6: heal("回復 60", 60)
  },
  specials: [
    { name: "特性：簡易シールド", effectType: "story_chapter3_random_half_guard", timing: "auto", actionType: "auto", desc: "20%の確率で1発の被弾ダメージを半減する。" }
  ]
});

export const story_aries = makeUnit({
  id: "story_aries",
  name: "エアリーズ",
  hp: 200,
  evadeMax: 8,
  exp: 7,
  companionCost: 50,
  unlockCondition: "リーオーから改築する。",
  slots: {
    slot1: evade("回避+2", 2),
    slot2: attack("チェーンライフル 50ダメージ", "50ダメージ。射撃", "shoot", 50),
    slot3: evade("回避+2", 2),
    slot4: attack("ミサイルポッド 20ダメージ×2回", "20ダメージ×2回。射撃", "shoot", 20, 2),
    slot5: heal("回復 50", 50),
    slot6: attack("一斉射撃 20ダメージ×4回", "20ダメージ×4回。射撃、軽減不可", "shoot", 20, 4, { ignoreReduction: true })
  }
});

export const story_tallgeese = makeUnit({
  id: "story_tallgeese",
  name: "トールギス",
  hp: 550,
  evadeMax: 8,
  exp: 50,
  companionCost: 120,
  unlockCondition: "エアリーズから改築する。",
  slots: {
    slot1: custom("スーパーバーニア", "回避ストック最大値を現在の所持回避数の倍にし、一時的に赤上限保持する。", "story_tallgeese_super_vernier"),
    slot2: custom("ビームサーベル", "5×回避所持数ダメージ。格闘、ビーム", "story_tallgeese_beam_saber"),
    slot3: evade("回避+3", 3),
    slot4: heal("回復 70", 70),
    slot5: attack("ドーバーガン(ビーム) 100ダメージ", "100ダメージ。射撃、ビーム、軽減不可", "shoot", 100, 1, { beam: true, ignoreReduction: true }),
    slot6: attack("ドーバーガン(実弾) 50ダメージ×3回", "50ダメージ×3回。射撃", "shoot", 50, 3)
  },
  specials: [
    { name: "特性：高機動負荷", effectType: "story_tallgeese_overload", timing: "auto", actionType: "auto", desc: "回避9以上で被ダメージ25%上昇。回避15以上で行動後、回避1消費して15ダメージ射撃追撃。" },
    { name: "特性：簡易シールド", effectType: "story_chapter3_random_half_guard", timing: "auto", actionType: "auto", desc: "20%の確率で1発の被弾ダメージを半減する。" }
  ]
});

export const story_graze = makeUnit({
  id: "story_graze",
  name: "グレイズ",
  hp: 400,
  evadeMax: 1,
  exp: 9,
  companionCost: 35,
  unlockCondition: "チャプター3ショップで購入する。",
  slots: {
    slot1: attack("ライフル 30ダメージ", "30ダメージ。射撃、軽減不可", "shoot", 30, 1, { ignoreReduction: true }),
    slot2: attack("バトルアックス 30ダメージ", "30ダメージ。格闘、必中", "melee", 30, 1, { cannotEvade: true }),
    slot3: evade("回避+1", 1),
    slot4: attack("バズーカ 60ダメージ", "60ダメージ。射撃", "shoot", 60),
    slot5: heal("回復 60", 60),
    slot6: attack("バトルブレード 50ダメージ", "50ダメージ。格闘、軽減不可", "melee", 50, 1, { ignoreReduction: true })
  },
  specials: [
    { name: "特性：ナノラミネートアーマー", effectType: "story_graze_nanolaminate", timing: "auto", actionType: "auto", desc: "ビーム属性ダメージを常に半減する。" }
  ]
});

export const story_schwalbe_graze = makeUnit({
  id: "story_schwalbe_graze",
  name: "シュバルべグレイズ",
  hp: 450,
  evadeMax: 3,
  exp: 14,
  companionCost: 55,
  unlockCondition: "グレイズから改築する。",
  slots: {
    slot1: attack("ロングライフル 60ダメージ", "60ダメージ。射撃、軽減不可", "shoot", 60, 1, { ignoreReduction: true }),
    slot2: attack("バトルアックス 40ダメージ", "40ダメージ。格闘、必中", "melee", 40, 1, { cannotEvade: true }),
    slot3: evade("回避+2", 2),
 slot4: attack("ワイヤークロー 20ダメージ", "20ダメージ。射撃。ヒット時、次の攻撃に必中付与。", "shoot", 20, 1, { onHit: "next_attack_cannot_evade" }),
    slot5: heal("回復 60", 60),
    slot6: attack("ランスユニット 100ダメージ", "100ダメージ。格闘、軽減不可", "melee", 100, 1, { ignoreReduction: true })
  },
  specials: [
    { name: "特性：ナノラミネートアーマー", effectType: "story_graze_nanolaminate", timing: "auto", actionType: "auto", desc: "ビーム属性ダメージを常に半減する。" }
  ]
});

export const story_graze_ritter = makeUnit({
  id: "story_graze_ritter",
  name: "グレイズリッター",
  hp: 600,
  evadeMax: 3,
  exp: 20,
  companionCost: 75,
  unlockCondition: "シュバルべグレイズから改築する。",
  slots: {
    slot1: attack("ナイトブレード 50ダメージ", "50ダメージ。格闘、軽減不可", "melee", 50, 1, { ignoreReduction: true }),
    slot2: attack("ナイトブレード 50ダメージ", "50ダメージ。格闘、必中", "melee", 50, 1, { cannotEvade: true }),
    slot3: attack("ナイトブレード連撃 20ダメージ×3回", "20ダメージ×3回。格闘、軽減不可", "melee", 20, 3, { ignoreReduction: true }),
    slot4: evade("回避+2", 2),
    slot5: attack("ライフル 80ダメージ", "80ダメージ。射撃", "shoot", 80),
    slot6: custom("ナイトブレード居合", "次の相手の行動が攻撃の時、50ダメージ格闘が発動。", "story_graze_ritter_iai")
  },
  specials: [
    { name: "特性：ナノラミネートアーマー", effectType: "story_graze_nanolaminate", timing: "auto", actionType: "auto", desc: "ビーム属性ダメージを常に半減する。" }
  ]
});

export const story_graze_ein = makeUnit({
  id: "story_graze_ein",
  name: "グレイズ・アイン",
  hp: 600,
  evadeMax: 10,
  exp: 50,
  companionCost: 130,
  unlockCondition: "グレイズリッターから改築する。クリエイトガンダムリベラルのGAデータにガンダム・バルバトスが必要。",
  slots: {
    slot1: custom("有機軌道", "次のターン2回行動。", "story_graze_ein_organic_orbit"),
    slot2: attack("大型アックス 60ダメージ×2回", "60ダメージ×2回。格闘、軽減不可", "melee", 60, 2, { ignoreReduction: true }),
    slot3: attack("40mm機関銃 10ダメージ×8回", "10ダメージ×8回。射撃", "shoot", 10, 8),
    slot4: evade("回避+4", 4),
    slot5: custom("ドリルキック 90ダメージ", "90ダメージ。格闘。ヒット時、追加で5ダメージ×6回。", "story_graze_ein_drill_kick"),
    slot6: custom("阿頼耶識軌道・連撃", "前回の攻撃行動を抽選し、かつもう一度スロット行動を抽選する。", "story_graze_ein_combo")
  },
  specials: [
    { name: "特性：パイルバンカー", effectType: "story_graze_ein_pile_bunker", timing: "auto", actionType: "auto", desc: "ターン中攻撃ヒット時、50ダメージ格闘を1ターン1回追加。" },
    { name: "特性：ナノラミネートアーマー", effectType: "story_graze_nanolaminate", timing: "auto", actionType: "auto", desc: "ビーム属性ダメージを常に半減する。" }
  ]
});

export const story_guncannon = makeUnit({
  id: "story_guncannon",
  name: "ガンキャノン",
  hp: 600,
  evadeMax: 5,
  exp: 40,
  companionCost: 100,
  unlockCondition: "ガンダムを同行可能にしている状態で、単体学習で撃破する。",
  slots: {
    slot1: attack("バルカン 10ダメージ×5回", "10ダメージ×5回。射撃", "shoot", 10, 5),
    slot2: attack("240mm低反動キャノン砲 40ダメージ×4回", "40ダメージ×4回。射撃", "shoot", 40, 4),
    slot3: evade("回避+2", 2),
    slot4: attack("ビームライフル 80ダメージ", "80ダメージ。射撃、ビーム", "shoot", 80, 1, { beam: true }),
    slot5: heal("回復 40", 40),
    slot6: attack("格闘 30ダメージ×3回", "30ダメージ×3回。格闘、軽減不可", "melee", 30, 3, { ignoreReduction: true })
  },
  specials: [
    { name: "特性：重装甲", effectType: "story_guncannon_armor", timing: "auto", actionType: "auto", desc: "常にダメージ20%軽減。" }
  ]
});

export const story_guntank = makeUnit({
  id: "story_guntank",
  name: "ガンタンク",
  hp: 600,
  evadeMax: 4,
  exp: 40,
  companionCost: 100,
  unlockCondition: "ガンキャノンを同行可能にしている状態で、単体学習で撃破する。",
  slots: {
    slot1: evade("回避+1", 1),
    slot2: heal("回復 40", 40),
    slot3: attack("ポップミサイルランチャー 10ダメージ×8回", "10ダメージ×8回。射撃", "shoot", 10, 8),
    slot4: attack("120mm低反動キャノン砲 60ダメージ×2回", "60ダメージ×2回。射撃", "shoot", 60, 2),
    slot5: custom("狙撃耐性", "次の射撃攻撃に必中を付与。", "story_next_shoot_cannot_evade"),
    slot6: attack("120mm低反動キャノン砲 60ダメージ×2回", "60ダメージ×2回。射撃", "shoot", 60, 2)
  },
  specials: [
    { name: "特性：射撃耐性", effectType: "story_guntank_armor", timing: "auto", actionType: "auto", desc: "射撃攻撃ダメージを常に半減。ただし格闘攻撃ダメージは常に1.5倍。" }
  ]
});

export const story_gyan = makeUnit({
  id: "story_gyan",
  name: "ギャン",
  hp: 600,
  evadeMax: 6,
  exp: 40,
  companionCost: 100,
  unlockCondition: "単体学習で1on1状態で撃破する。",
  slots: {
    slot1: attack("ハイドボンブ 30ダメージ", "30ダメージ。射撃。被弾すると回避を消滅させる。", "shoot", 30, 1, { onHit: "clear_evade" }),
    slot2: evade("回避+1", 1),
    slot3: attack("高出力ビームサーベル 100ダメージ", "100ダメージ。格闘、ビーム", "melee", 100, 1, { beam: true }),
    slot4: heal("回復 50", 50),
    slot5: attack("ニードルミサイル 10ダメージ×5回", "10ダメージ×5回。射撃", "shoot", 10, 5),
    slot6: attack("連続突き 10ダメージ×8回", "10ダメージ×10回。格闘、ビーム、軽減不可", "melee", 10, 8, { beam: true, ignoreReduction: true })
  },
  specials: [
    { name: "特性：連続攻撃", effectType: "story_no_attack_next_double_slot", timing: "auto", actionType: "auto", desc: "相手が攻撃行動をしてこなかった時の次のターン、2回連続でスロット行動をする。" }
  ]
});

export const story_gouf_chapter3 = makeUnit({
  id: "story_gouf_chapter3",
  name: "グフ",
  hp: 600,
  evadeMax: 5,
  exp: 40,
  companionCost: 100,
  unlockCondition: "単体学習で1on1状態で撃破する。",
  slots: {
    slot1: attack("ヒートロッド 30ダメージ", "30ダメージ。格闘。被弾すると所持回避消滅。", "melee", 30, 1, { onHit: "clear_evade" }),
    slot2: evade("回避+1", 1),
    slot3: attack("ヒートサーベル 80ダメージ", "80ダメージ。格闘", "melee", 80),
    slot4: heal("回復 50", 50),
    slot5: attack("フィンガーバルカン 10ダメージ×5回", "10ダメージ×5回。射撃", "shoot", 10, 5),
    slot6: attack("ヒートロッド捕縛 20ダメージ", "20ダメージ。格闘。被弾すると次の攻撃が必中になる。", "melee", 20, 1, { onHit: "next_attack_cannot_evade" })
  },
  specials: [
    { name: "特性：連続攻撃", effectType: "story_no_attack_next_double_slot", timing: "auto", actionType: "auto", desc: "相手が攻撃行動をしてこなかった時の次のターン、2回連続でスロット行動をする。" }
  ]
});

export const story_psycho_gundam = makeUnit({
  id: "story_psycho_gundam",
  name: "サイコ・ガンダム",
  hp: 1500,
  evadeMax: 0,
  exp: 50,
  companionCost: 180,
  unlockCondition: "Zガンダムのクリエイトガンダムリベラルを使用し撃破する。",
  slots: {
    slot1: attack("シールドタックル 90ダメージ", "90ダメージ。格闘", "melee", 90),
    slot2: attack("二連装小型メガ・ビーム砲 40ダメージ×2回", "40ダメージ×2回。射撃、ビーム", "shoot", 40, 2, { beam: true }),
    slot3: attack("三連装拡散メガ粒子砲 30ダメージ×3回", "30ダメージ×3回。射撃、ビーム", "shoot", 30, 3, { beam: true }),
    slot4: heal("回復 100", 100),
    slot5: attack("収束ビーム砲 250ダメージ", "250ダメージ。射撃、ビーム", "shoot", 250, 1, { beam: true }),
    slot6: attack("ビーム砲なぎ払い 100ダメージ×2回", "100ダメージ×2回。射撃、ビーム", "shoot", 100, 2, { beam: true })
  }
});

export const story_death_army = {
  id: "story_death_army",
  name: "デスアーミー",
  defaultFormId: "base",
  exp: 25,
  storyCompanion: {
    unlockCondition: "同行学習モードで3回、デスアーミー2機編成を撃破する。",
    cost: 70
  },
  storyDrops: { random: getStoryChapter3Drops("story_death_army", []) },
  forms: {
    base: {
      name: "デスアーミー",
      hp: 450,
      evadeMax: 3,
      rollableSlotOrder: ORDER,
      ownedSlotOrder: ORDER,
      slots: {
        slot1: attack("棍棒型ビームライフル 70ダメージ", "70ダメージ。射撃、ビーム", "shoot", 70, 1, { beam: true }),
        slot2: evade("回避+2", 2),
        slot3: attack("棍棒 80ダメージ", "80ダメージ。格闘", "melee", 80),
        slot4: heal("回復 60", 60),
        slot5: attack("格闘 20ダメージ×3回", "20ダメージ×3回。格闘", "melee", 20, 3),
        slot6: custom("進化", "HPを80回復し、デスビースト、デスネイビー、デスバーディ、デスマスターのどれかになる。", "story_death_army_evolve")
      },
      specials: []
    },

    death_beast: {
      name: "デスビースト",
      hp: 600,
      evadeMax: 3,
      rollableSlotOrder: ORDER,
      ownedSlotOrder: ORDER,
      slots: {
        slot1: attack("マシンガンデスライフル 10ダメージ×6回", "10ダメージ×6回。射撃", "shoot", 10, 6),
        slot2: evade("回避+1", 1),
        slot3: heal("回復 80", 80),
        slot4: attack("デスライフル 100ダメージ", "100ダメージ。射撃", "shoot", 100),
        slot5: attack("棍棒型ビームライフル 80ダメージ", "80ダメージ。射撃、ビーム", "shoot", 80, 1, { beam: true }),
        slot6: custom("進化", "HPを80回復し、デスネイビー、デスバーディ、デスマスターのどれかになる。", "story_death_army_evolve")
      },
      specials: []
    },

    death_navy: {
      name: "デスネイビー",
      hp: 400,
      evadeMax: 1,
      rollableSlotOrder: ORDER,
      ownedSlotOrder: ORDER,
      slots: {
        slot1: attack("電撃銛 50ダメージ", "50ダメージ。格闘。ヒット時相手回避-2", "melee", 50, 1, { onHit: "reduce_evade_2" }),
        slot2: attack("銛突き連撃 20ダメージ×3回", "20ダメージ×3回。格闘", "melee", 20, 3),
        slot3: attack("銛突進 100ダメージ", "100ダメージ。格闘", "melee", 100),
        slot4: attack("魚雷 30ダメージ×2回", "30ダメージ×2回。射撃", "shoot", 30, 2),
        slot5: attack("電撃銛連撃 30ダメージ×3回", "30ダメージ×3回。各ヒット時相手回避-1", "melee", 30, 3, { onHit: "reduce_evade_1_each" }),
        slot6: custom("進化", "HPを80回復し、デスビースト、デスバーディ、デスマスターのどれかになる。", "story_death_army_evolve")
      },
      specials: []
    },

    death_birdy: {
      name: "デスバーディ",
      hp: 300,
      evadeMax: 8,
      rollableSlotOrder: ORDER,
      ownedSlotOrder: ORDER,
      slots: {
        slot1: evade("回避+2", 2),
        slot2: attack("大口径ビームキャノン 100ダメージ", "100ダメージ。射撃、ビーム", "shoot", 100, 1, { beam: true }),
        slot3: evade("回避+2", 2),
        slot4: attack("大口径ビームキャノン 100ダメージ", "100ダメージ。射撃、ビーム", "shoot", 100, 1, { beam: true }),
        slot5: evade("回避+2", 2),
        slot6: custom("進化", "HPを80回復し、デスビースト、デスネイビー、デスマスターのどれかになる。", "story_death_army_evolve")
      },
      specials: []
    },

    death_master: {
      name: "デスマスター",
      hp: 800,
      evadeMax: 6,
      rollableSlotOrder: ORDER,
      ownedSlotOrder: ORDER,
      slots: {
        slot1: attack("マスタークロス 10ダメージ", "10ダメージ。ヒット時、次の攻撃必中", "melee", 10, 1, { onHit: "next_attack_cannot_evade" }),
        slot2: attack("マスタークロス凪ぎ 60ダメージ", "60ダメージ。格闘", "melee", 60),
        slot3: custom("回避+2、回復50", "回避2回、回復50。", "story_death_master_evade_heal"),
        slot4: custom("乱舞 30ダメージ×3回", "30ダメージ×3回。格闘、回避1回。", "story_death_master_ranbu"),
        slot5: attack("フェイクダークネスフィンガー 150ダメージ", "150ダメージ。格闘、軽減不可", "melee", 150, 1, { ignoreReduction: true }),
        slot6: custom("シンクロ", "この形態中の各種攻撃ダメージが10増加する。ただし、選択2回目でリセットされ、デスアーミーに変化する。", "story_death_master_sync")
      },
      specials: []
    }
  }
};

export const story_gunbarrel_dagger = makeUnit({
  id: "story_gunbarrel_dagger",
  name: "ガンバレルダガー",
  hp: 450,
  evadeMax: 8,
  exp: 25,
  companionCost: 80,
  unlockCondition: "ガンバレルダガーの全てのドロップ品を集め、単体学習で撃破する。",
  slots: {
    slot1: custom("ガンバレルコンビネーションライフル", "20×所持回避数ダメージ。0の時50ダメージ。射撃、ビーム。", "story_gunbarrel_combo_rifle"),
    slot2: attack("ビームサーベル 30ダメージ×2回", "30ダメージ×2回。格闘、ビーム", "melee", 30, 2, { beam: true }),
    slot3: evade("回避+4", 4),
    slot4: heal("回復 60", 60),
    slot5: attack("ガンバレルガトリング 10ダメージ×8回", "10ダメージ×8回。射撃", "shoot", 10, 8),
    slot6: custom("ガンバレルオールレンジショット", "30×所持回避数ダメージ。0の時80ダメージ。射撃、ビーム。", "story_gunbarrel_all_range")
  },
  specials: [
    { name: "ガンバレル展開", effectType: "story_gunbarrel_deploy", timing: "self", actionType: "instant", desc: "所持回避数を1消費して30ダメージの追撃が可能。" },
    { name: "特性：エネルギーデメリット", effectType: "story_gunbarrel_energy_demerit", timing: "auto", actionType: "auto", desc: "回避所持中の被弾ダメージ1.5倍。回避0で行動するとスロット効果1.5倍。" }
  ]
});

export const storyChapter3Units = [
  story_leo,
  story_aries,
  story_tallgeese,
  story_graze,
  story_schwalbe_graze,
  story_graze_ritter,
  story_graze_ein,
  story_guncannon,
  story_guntank,
  story_gyan,
  story_gouf_chapter3,
  story_psycho_gundam,
  story_death_army,
  story_gunbarrel_dagger
];
