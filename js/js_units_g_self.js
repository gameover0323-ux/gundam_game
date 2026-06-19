export const g_self = {
  id: "g_self",
  name: "G-セルフ",
  defaultFormId: "space",
  forms: {
    space: {
      name: "G-セルフ 宇宙用パック",
      hp: 500,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ビームライフル 60ダメージ", desc: "60ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 60, count: 1, beam: true } },
        slot2: { label: "シールドバルカン 10ダメージ×5回", desc: "10ダメージ×5回。射撃", effect: { type: "attack", attackType: "shoot", damage: 10, count: 5 } },
        slot3: { label: "回避 +2", desc: "回避ストック+2", effect: { type: "evade", amount: 2 } },
        slot4: { label: "ビームサーベル 60ダメージ", desc: "60ダメージ。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 60, count: 1, beam: true } },
        slot5: { label: "換装解放･リフレクター", desc: "リフレクターパックに換装可能になる。解放済みの場合は5EXに変化する。", effect: { type: "custom", customType: "gself_unlock_reflector" } },
        slot6: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } }
      },
      specials: [
        { name: "シールド(宇宙用)", effectType: "gself_space_shield", timing: "reaction", actionType: "instant", desc: "ゲーム中3回のみ、1ターンに受けるダメージを半減する。回数0で2EX開放。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    atmospheric: {
      name: "G-セルフ 大気圏パック",
      hp: 500,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ビームライフル 70ダメージ", desc: "70ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 70, count: 1, beam: true } },
        slot2: { label: "ヘッドバルカン 10ダメージ×5回", desc: "10ダメージ×5回。射撃", effect: { type: "attack", attackType: "shoot", damage: 10, count: 5 } },
        slot3: { label: "回避 +2", desc: "回避ストック+2", effect: { type: "evade", amount: 2 } },
        slot4: { label: "フォトン･シールド 30ダメージ", desc: "30ダメージ。格闘。ヒット時、次の攻撃ダメージを1回無効化する。", effect: { type: "attack", attackType: "melee", damage: 30, count: 1, special: "gself_photon_shield" } },
        slot5: { label: "換装解放･トリッキー", desc: "トリッキーパックに換装可能になる。解放済みの場合は5EXに変化する。", effect: { type: "custom", customType: "gself_unlock_tricky" } },
        slot6: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } }
      },
      specials: [
        { name: "シールド(トワサンガ)", effectType: "gself_atmospheric_shield", timing: "reaction", actionType: "instant", desc: "ゲーム中3回のみ、1ターンに受けるダメージを無効化する。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    reflector: {
      name: "G-セルフ リフレクターパック",
      hp: 500,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ビームライフル 60ダメージ", desc: "60ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 60, count: 1, beam: true } },
        slot2: { label: "ビームライフル連射 20ダメージ×3回", desc: "20ダメージ×3回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 20, count: 3, beam: true } },
        slot3: { label: "回避 +2", desc: "回避ストック+2", effect: { type: "evade", amount: 2 } },
        slot4: { label: "トラクタービーム 20ダメージ", desc: "20ダメージ。射撃、ビーム。ヒット時、相手回避-1", effect: { type: "attack", attackType: "shoot", damage: 20, count: 1, beam: true, special: "gself_evade_down_1" } },
        slot5: { label: "アサルトパック調整完了", desc: "アサルトパックに換装可能になる。解放済みの場合は5EXに変化する。", effect: { type: "custom", customType: "gself_unlock_assault" } },
        slot6: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } }
      },
      specials: [
        { name: "Iフィールド", effectType: "gself_i_field", timing: "auto", actionType: "auto", desc: "ビーム属性の武装ダメージを半減する。軽減不可の場合は軽減不可。" },
        { name: "シールド(リフレクター)", effectType: "gself_reflector_shield", timing: "reaction", actionType: "instant", desc: "ゲーム中3回のみ、1ターンに受けるダメージを半減する。" },
        { name: "リフレクター", effectType: "gself_reflector_mode", timing: "auto", actionType: "auto", desc: "相手のビームかつ射撃属性の攻撃を8回まで無効化し、次の自分の射撃攻撃に表記ダメージを上乗せする。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    tricky: {
      name: "G-セルフ トリッキーパック",
      hp: 500,
      evadeMax: 6,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "ビームライフル 60ダメージ", desc: "60ダメージ。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 60, count: 1, beam: true } },
        slot2: { label: "フラッシュ･アタック 50ダメージ", desc: "50ダメージ。射撃。ヒット時、自分の行動回数+1", effect: { type: "attack", attackType: "shoot", damage: 50, count: 1, special: "gself_action_plus_1" } },
        slot3: { label: "回避 +2", desc: "回避ストック+2", effect: { type: "evade", amount: 2 } },
        slot4: { label: "ミサイル 10ダメージ×6回", desc: "10ダメージ×6回。射撃", effect: { type: "attack", attackType: "shoot", damage: 10, count: 6 } },
        slot5: { label: "高トルクパック調整完了", desc: "高トルクパックに換装可能になる。解放済みの場合は5EXに変化する。", effect: { type: "custom", customType: "gself_unlock_high_torque" } },
        slot6: { label: "回復 80", desc: "HP80回復", effect: { type: "heal", amount: 80 } }
      },
      specials: [
        { name: "Iフィールド", effectType: "gself_i_field", timing: "auto", actionType: "auto", desc: "ビーム属性の武装ダメージを半減する。軽減不可の場合は軽減不可。" },
        { name: "イリュージョンファンネル", effectType: "gself_illusion_funnel", timing: "self", actionType: "instant", desc: "行動権を1消費して回避数を2獲得する。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    high_torque: {
      name: "G-セルフ 高トルクパック",
      hp: 500,
      evadeMax: 2,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"],
      slots: {
        slot1: { label: "高トルクパンチ 100ダメージ", desc: "100ダメージ。格闘", effect: { type: "attack", attackType: "melee", damage: 100, count: 1 } },
        slot2: { label: "ロケットブースター", desc: "次の攻撃アクションのダメージ数値に50加算する。複数回攻撃は全弾に50加算。", effect: { type: "custom", customType: "gself_rocket_booster" } },
        slot3: { label: "回避 +1", desc: "回避ストック+1", effect: { type: "evade", amount: 1 } },
        slot4: { label: "ビームサーベル 60ダメージ", desc: "60ダメージ。格闘、ビーム", effect: { type: "attack", attackType: "melee", damage: 60, count: 1, beam: true } },
        slot5: { label: "キック 80ダメージ", desc: "80ダメージ。格闘", effect: { type: "attack", attackType: "melee", damage: 80, count: 1 } },
        slot6: { label: "奇襲攻撃 30ダメージ×2回", desc: "30ダメージ×2回。格闘。各ヒット時、相手回避-1", effect: { type: "attack", attackType: "melee", damage: 30, count: 2, special: "gself_evade_down_1" } },
        slot7: { label: "高トルクパック突撃 150ダメージ", desc: "150ダメージ。格闘、軽減不可、必中", effect: { type: "attack", attackType: "melee", damage: 150, count: 1, ignoreReduction: true, cannotEvade: true } }
      },
      specials: [
        { name: "高トルクパック突撃", effectType: "gself_high_torque_charge", timing: "self", actionType: "instant", desc: "HP-200して7.高トルクパック突撃を放つ。発動後、大気圏パックへ換装し、高トルクパックの換装権利を失う。" },
        { name: "特性", effectType: "gself_high_torque_trait", timing: "auto", actionType: "auto", desc: "常にダメージを10軽減。ただしターン開始時HP-10。自壊ではHP1残る。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    assault: {
      name: "G-セルフ アサルトパック",
      hp: 500,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: { label: "大型ビームキャノン 60ダメージ×2回", desc: "60ダメージ×2回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 60, count: 2, beam: true } },
        slot2: { label: "回避 +1", desc: "回避ストック+1", effect: { type: "evade", amount: 1 } },
        slot3: { label: "回避 +1", desc: "回避ストック+1", effect: { type: "evade", amount: 1 } },
        slot4: { label: "大型ビームキャノン(高出力) 90ダメージ×2回", desc: "90ダメージ×2回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 90, count: 2, beam: true } },
        slot5: { label: "ミサイルポッド 10ダメージ×8回", desc: "10ダメージ×8回。射撃", effect: { type: "attack", attackType: "shoot", damage: 10, count: 8 } },
        slot6: { label: "一斉掃射 20ダメージ×12回", desc: "20ダメージ×12回。射撃", effect: { type: "attack", attackType: "shoot", damage: 20, count: 12 } }
      },
      specials: [
        { name: "緊急離脱", effectType: "gself_emergency_escape", timing: "reaction", actionType: "instant", desc: "この形態の換装権利を放棄して、このターンの攻撃を無効化する。その後、宇宙用パックに換装する。" },
        { name: "換装", effectType: "gself_change_pack", timing: "self", actionType: "instant", desc: "現在解放されているパックに換装する。" }
      ]
    },
    perfect: {
      name: "G-セルフ・パーフェクトパック",
      hp: 500,
      evadeMax: 12,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7"],
      slots: {
        slot1: { label: "ビームライフル 60ダメージ×3回", desc: "60ダメージ×3回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 60, count: 3, beam: true } },
        slot2: { label: "トラフィック・フィン 10ダメージ×5 + 回避2", desc: "10ダメージ×5回。射撃。さらに回避ストック+2", effect: { type: "custom", customType: "gself_traffic_fin" } },
        slot3: { label: "回避 +6", desc: "回避ストック+6", effect: { type: "evade", amount: 6 } },
        slot4: { label: "アサルトモード 150ダメージ×2回", desc: "150ダメージ×2回。射撃、ビーム", effect: { type: "attack", attackType: "shoot", damage: 150, count: 2, beam: true } },
        slot5: { label: "高トルクモード 100ダメージ×3回", desc: "100ダメージ×3回。格闘、軽減不可", effect: { type: "attack", attackType: "melee", damage: 100, count: 3, ignoreReduction: true } },
        slot6: { label: "フォトン･トルピード 100ダメージ×5回", desc: "100ダメージ×5回。射撃。回避4以下の場合回避不可。1ヒット毎自機50回復、1ヒット毎相手回避-2", effect: { type: "attack", attackType: "shoot", damage: 100, count: 5, minEvadeRequired: 5, special: "gself_photon_torpedo" } },
        slot7: { label: "フォトン･サーチャー", desc: "次の攻撃を必中化", effect: { type: "custom", customType: "gself_photon_searcher_slot" } }
      },
      specials: [
        { name: "特性 パーフェクトパック", effectType: "gself_perfect_trait", timing: "auto", actionType: "auto", desc: "毎ターン開始時HP-50。HP50以下なら撃墜、または1ターン休み＋大気圏パックへ強制換装。" },
        { name: "フォトン装甲シールド", effectType: "gself_photon_armor_shield", timing: "reaction", actionType: "instant", desc: "3回だけ1ターンに受けるダメージを半減。ビーム属性なら無効化し、表記ダメージ合計値の半分回復。" },
        { name: "リフレクターモード", effectType: "gself_reflector_mode", timing: "auto", actionType: "auto", desc: "相手のビームかつ射撃攻撃を8回まで無効化し、次の自分の射撃攻撃に表記ダメージを上乗せする。" },
        { name: "フォトン･サーチャー", effectType: "gself_photon_searcher", timing: "self", actionType: "instant", desc: "回避3消費。次のスロット行動で攻撃が出た時、全弾必中属性を付与する。" },
        { name: "全方位レーザー", effectType: "gself_omni_laser_toggle", timing: "self", actionType: "instant", desc: "スロット6をフォトン･トルピード/全方位レーザーで自由に切り替える。" }
      ]
    }
  }
};
