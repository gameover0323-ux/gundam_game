export const v2_gundam = {
  id: "v2_gundam",
  name: "V2ガンダム",
  defaultFormId: "v2",
  forms: {
    v2: {
      name: "V2ガンダム",
      hp: 650,
      evadeMax: 5,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "バルカン 15ダメージ×4回", desc: "15ダメージ×4回。射撃", effect: { type: "attack", attackType: "shoot", damage: 15, count: 4 } },
        slot2: { label: "回避 +2", desc: "回避2回", effect: { type: "evade", amount: 2 } },
        slot3: { label: "ビームサーベル 50ダメージ", desc: "50ダメージ。格闘。ビーム", effect: { type: "attack", attackType: "melee", damage: 50, count: 1, beam: true } },
        slot4: { label: "ビームライフル 80ダメージ", desc: "80ダメージ。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 80, count: 1, beam: true, special: "v2_slot4" } },
        slot5: { label: "回復 60", desc: "HP60回復", effect: { type: "heal", amount: 60 } },
        slot6: { label: "光の翼", desc: "次のターンの攻撃を無効化し、無効化成功時に80ダメージ格闘ビーム軽減不可で反撃。", effect: { type: "custom", customType: "v2_wings_guard" } }
      },
      specials: [
        { name: "特性", effectType: "v2_trait", timing: "auto", actionType: "auto", desc: "A/B/C装備は初期3、最大10まで蓄積。未装備ならターン終了時+1、装備中はターン終了時-1。蓄積0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。換装時、通常換装はHP50回復、アサルトバスター系はHP100回復。" },
        { name: "マルチプルアサルト追撃", effectType: "v2_multiple_assault", timing: "self", actionType: "instant", desc: "4の行動選択時、回避2消費で4EXを続けて発動。" }
      ]
    },

    assault: {
      name: "V2アサルトガンダム",
      hp: 700,
      evadeMax: 10,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "牽制射撃 20ダメージ", desc: "20ダメージ＋回避1＋回避ストック最大値+1。射撃", effect: { type: "custom", customType: "v2_assault_slot1" } },
        slot2: { label: "回避 +3", desc: "回避3回＋補填分の回避ストック最大値増加", effect: { type: "custom", customType: "v2_assault_evade3" } },
        slot3: { label: "強襲格闘", desc: "15ダメージ×所持回避数。0の時60ダメージ。格闘", effect: { type: "custom", customType: "v2_assault_slot3" } },
        slot4: { label: "ビームサーベル 60ダメージ", desc: "60ダメージ。格闘。ビーム", effect: { type: "attack", attackType: "melee", damage: 60, count: 1, beam: true } },
        slot5: { label: "光の翼 50ダメージ", desc: "50ダメージ＋回避2＋回避ストック最大値+2。格闘。ビーム。軽減不可", effect: { type: "custom", customType: "v2_assault_slot5" } },
        slot6: { label: "ヴェスバー", desc: "所持回避数×20ダメージ。射撃。ビーム。0の時不発", effect: { type: "custom", customType: "v2_assault_slot6" } }
      },
      specials: [
        { name: "特性", effectType: "v2_assault_trait", timing: "auto", actionType: "auto", desc: "毎ターンHP-10、回避ストック最大値-1。最大値0でV2へ戻りHP50回復。A蓄積をターン終了時に-1し、0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。" },
        { name: "メガビームシールド", effectType: "v2_mega_beam_shield", timing: "reaction", actionType: "instant", desc: "3回のみ、相手の攻撃ダメージを1ターン間無効化する。アサルトと回数共有。" }
      ]
    },

    buster: {
      name: "V2バスターガンダム",
      hp: 700,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "メガビームキャノン 100ダメージ", desc: "100ダメージ。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 100, count: 1, beam: true } },
        slot2: { label: "ビームスプレーポッド 20ダメージ×3回", desc: "20ダメージ×3回。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 3, beam: true, special: "v2_buster_slot2" } },
        slot3: { label: "回復 60", desc: "HP60回復", effect: { type: "heal", amount: 60 } },
        slot4: { label: "ビームライフル 80ダメージ", desc: "80ダメージ。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 80, count: 1, beam: true, special: "v2_slot4" } },
        slot5: { label: "回復 50＋回避 2回", desc: "HP50回復＋回避2", effect: { type: "custom", customType: "v2_heal50_evade2" } },
        slot6: { label: "光の翼 50ダメージ", desc: "50ダメージ。格闘。ビーム。軽減不可。命中時50回復", effect: { type: "attack", attackType: "melee", damage: 50, count: 1, beam: true, ignoreReduction: true, special: "v2_buster_wings_hit_heal" } }
      },
      specials: [
        { name: "特性", effectType: "v2_buster_trait", timing: "auto", actionType: "auto", desc: "毎ターンHP-20。4EX追撃消費回避1。スロット3が50%で3EX。2ターン目以降20%で2EX、3回使用でV2へ戻る。B蓄積をターン終了時に-1し、0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。" },
        { name: "マルチプルアサルト追撃", effectType: "v2_multiple_assault", timing: "self", actionType: "instant", desc: "4の行動選択時、回避2消費で4EXを続けて発動。バスター特性で消費1。" }
      ]
    },

    cannon: {
      name: "V2ガンダム(キャノン装備)",
      hp: 700,
      evadeMax: 1,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } },
        slot2: { label: "ビームサーベル 80ダメージ", desc: "80ダメージ。格闘。ビーム。軽減不可", effect: { type: "attack", attackType: "melee", damage: 80, count: 1, beam: true, ignoreReduction: true } },
        slot3: { label: "チャージ", desc: "キャノン系攻撃数値+30", effect: { type: "custom", customType: "v2_cannon_charge30" } },
        slot4: { label: "回避 +1＋チャージ", desc: "回避1回＋キャノン系攻撃数値+5", effect: { type: "custom", customType: "v2_cannon_evade1_charge5" } },
        slot5: { label: "大口径ビームサーベル 150ダメージ", desc: "150ダメージ＋チャージ加算。格闘。ビーム", effect: { type: "custom", customType: "v2_cannon_saber" } },
        slot6: { label: "大口径ビームキャノン 150ダメージ", desc: "150ダメージ＋チャージ加算。射撃。ビーム", effect: { type: "custom", customType: "v2_cannon_beam_cannon" } }
      },
      specials: [
        { name: "特性", effectType: "v2_cannon_trait", timing: "auto", actionType: "auto", desc: "毎ターンHP-10。3回攻撃行動命中でV2へ戻りHP50回復。C蓄積をターン終了時に-1し、0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。" },
        { name: "出力安定化", effectType: "v2_cannon_ignore_reduction", timing: "self", actionType: "instant", desc: "攻撃行動時に回避1消費で軽減不可付与。" },
        { name: "命中補正最大", effectType: "v2_cannon_cannot_evade", timing: "self", actionType: "instant", desc: "攻撃行動時に回避5消費で必中付与。" }
      ]
    },

    assault_buster: {
      name: "V2アサルトバスターガンダム",
      hp: 800,
      evadeMax: 10,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "メガビームキャノン 120ダメージ", desc: "120ダメージ。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 120, count: 1, beam: true } },
        slot2: { label: "回復 100", desc: "HP100回復", effect: { type: "heal", amount: 100 } },
        slot3: { label: "ビームサーベル", desc: "30ダメージ×所持回避数。0の時80ダメージ。格闘。ビーム", effect: { type: "custom", customType: "v2_ab_slot3" } },
        slot4: { label: "ビームライフル 80ダメージ", desc: "80ダメージ。射撃。ビーム", effect: { type: "attack", attackType: "shoot", damage: 80, count: 1, beam: true, special: "v2_slot4" } },
        slot5: { label: "回復 30＋回避1＋上限+1", desc: "HP30回復＋回避1＋回避ストック最大値+1", effect: { type: "custom", customType: "v2_ab_slot5" } },
        slot6: { label: "光の翼", desc: "30ダメージ×所持開始数＋1ターン攻撃無効化＋回避ストック最大値+1。格闘。ビーム", effect: { type: "custom", customType: "v2_ab_slot6" } }
      },
      specials: [
        { name: "特性", effectType: "v2_ab_trait", timing: "auto", actionType: "auto", desc: "毎ターン回避+1、回避ストック最大値-1、HP-30。最大値0でV2へ戻りHP50回復。A/B蓄積をターン終了時に各-1し、いずれか0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。" },
        { name: "マルチプルアサルト追撃", effectType: "v2_multiple_assault", timing: "self", actionType: "instant", desc: "4の行動選択時、回避1消費で4EXを続けて発動。" },
        { name: "メガビームシールド", effectType: "v2_mega_beam_shield", timing: "reaction", actionType: "instant", desc: "3回のみ、相手の攻撃ダメージを1ターン間無効化する。アサルトと回数共有。" }
      ]
    },

    assault_buster_cannon: {
      name: "V2アサルトバスターガンダム(キャノン装備)",
      hp: 850,
      evadeMax: 10,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "大口径ビームキャノン 150ダメージ", desc: "150ダメージ＋チャージ加算。射撃。ビーム。次ターン相手射撃攻撃無効化", effect: { type: "custom", customType: "v2_abc_slot1" } },
        slot2: { label: "回復 150", desc: "HP150回復", effect: { type: "heal", amount: 150 } },
        slot3: { label: "大口径ビームサーベル 150ダメージ", desc: "150ダメージ＋チャージ加算。格闘。ビーム", effect: { type: "custom", customType: "v2_abc_slot3" } },
        slot4: { label: "回避 +4", desc: "回避4回＋補填分の回避ストック最大値増加", effect: { type: "custom", customType: "v2_abc_evade4" } },
        slot5: { label: "ビームサーベル", desc: "20ダメージ×所持回避数。0の時60ダメージ。格闘。ビーム", effect: { type: "custom", customType: "v2_abc_slot5" } },
        slot6: { label: "光の翼", desc: "10ダメージ×所持回避数の単発。ヒット時相手回避-3、回避ストック+3", effect: { type: "custom", customType: "v2_abc_slot6" } }
      },
      specials: [
        { name: "特性", effectType: "v2_abc_trait", timing: "auto", actionType: "auto", desc: "毎ターン回避+1、回避ストック最大値-1、HP-50。最大値0でV2へ戻りHP50回復。A/B/C蓄積をターン終了時に各-1し、いずれか0で通常V2へ戻る。" },
        { name: "シールド", effectType: "shield", timing: "reaction", actionType: "instant", desc: "3回まで、1ターン間の相手の攻撃ダメージを半減する。" },
        { name: "換装", effectType: "v2_change_form", timing: "self", actionType: "choice", desc: "通常/A/B/C/AB/ABCへ換装。対象装備の蓄積がすべて3以上必要。" },
        { name: "マルチプルアサルト追撃", effectType: "v2_multiple_assault", timing: "self", actionType: "instant", desc: "4の行動選択時、回避1消費で4EXを続けて発動。" },
        { name: "メガビームシールド", effectType: "v2_mega_beam_shield", timing: "reaction", actionType: "instant", desc: "3回のみ、相手の攻撃ダメージを1ターン間無効化する。アサルトと回数共有。" }
      ]
    }
  }
};
