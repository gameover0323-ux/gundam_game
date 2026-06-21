import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect
} from "./js_unit_runtime.js";

const FORM_MAX_HP = {
  normal: 1000,
  carnage: 1750,
  tachyon: 2000,
  ignis: 2000,
  mystic: 2500
};

function ensureExtremeState(state) {
  if (!state) return;

  if (!state.formId) state.formId = "normal";

  if (typeof state.extremeTotalDamageTaken !== "number") {
    state.extremeTotalDamageTaken = Math.max(0, Number(state.maxHp || 0) - Number(state.hp || 0));
  }

  if (typeof state.extremeHighAltitudePending !== "boolean") state.extremeHighAltitudePending = false;
  if (typeof state.extremeHighAltitudeActive !== "boolean") state.extremeHighAltitudeActive = false;

  if (typeof state.extremeFullEvadePending !== "boolean") state.extremeFullEvadePending = false;
  if (typeof state.extremeFullEvadeActive !== "boolean") state.extremeFullEvadeActive = false;

  if (typeof state.extremeMeleeNullThisTurn !== "boolean") state.extremeMeleeNullThisTurn = false;
  if (typeof state.extremeMysticRerollPending !== "boolean") state.extremeMysticRerollPending = false;

  if (typeof state.extremeSkipActionTurns !== "number") state.extremeSkipActionTurns = 0;
  if (typeof state.extremeTachyonAllEvadedStunPending !== "boolean") state.extremeTachyonAllEvadedStunPending = false;

  if (typeof state.extremeIgnisMode !== "string") state.extremeIgnisMode = "evade";
  if (typeof state.extremeIgnisLastModeSide !== "string") state.extremeIgnisLastModeSide = "none";
}

function getExtremeEffect(state, key) {
  return getStateEffect(state, key);
}

function syncHpBySharedDamage(state, formId) {
  ensureExtremeState(state);

  const maxHp = FORM_MAX_HP[formId] || FORM_MAX_HP.normal;
  state.maxHp = maxHp;

  const nextHp = maxHp - state.extremeTotalDamageTaken;
  state.hp = nextHp <= 0 ? 1 : nextHp;
}

function changeExtremeForm(state, formId) {
  ensureExtremeState(state);
  setForm(state, formId);
  syncHpBySharedDamage(state, formId);

  if (formId !== "ignis") {
    state.extremeIgnisMode = "evade";
    state.extremeIgnisLastModeSide = "none";
  }
}

function enterIgnisForm(state) {
  changeExtremeForm(state, "ignis");
  state.extremeIgnisMode = "evade";
  state.extremeIgnisLastModeSide = "self";
}

function advanceIgnisModeForSide(state, side, messages) {
  ensureExtremeState(state);

  if (state.formId !== "ignis") return;
  if (state.extremeIgnisLastModeSide === side) return;

  state.extremeIgnisMode =
    state.extremeIgnisMode === "evade" ? "damage" : "evade";

  state.extremeIgnisLastModeSide = side;

  messages.push(
    state.extremeIgnisMode === "evade"
      ? "イグニスフェイズ：回避モードへ移行"
      : "イグニスフェイズ：被弾増加モードへ移行"
  );
}

function getOverlimitLevel(state) {
  const effect = getExtremeEffect(state, "extreme_overlimit");
  if (!effect) return 0;
  return Number(effect.level || 0);
}

function getAttackBonus(state) {
  return getOverlimitLevel(state) * 5;
}

function withTachyonBonus(effect, state) {
  if (!effect || effect.type !== "attack") return effect;

  const bonus = getAttackBonus(state);
  if (!bonus) return effect;

  return {
    ...effect,
    damage: Number(effect.damage || 0) + bonus
  };
}

function normalSlots() {
  return {
    slot1: {
      label: "ビームサーベル",
      desc: "40ダメージ×2回。格闘、ビーム、軽減不可。",
      effect: { type: "attack", damage: 40, count: 2, attackType: "melee", beam: true, ignoreReduction: true }
    },
    slot2: {
      label: "カルネージフェイズ換装",
      desc: "カルネージフェイズへ換装する。",
      effect: { type: "custom", effectId: "extreme_form_carnage" }
    },
    slot3: {
      label: "タキオンフェイズ換装",
      desc: "タキオンフェイズへ換装する。",
      effect: { type: "custom", effectId: "extreme_form_tachyon" }
    },
    slot4: {
      label: "イグニスフェイズ換装",
      desc: "イグニスフェイズへ換装する。",
      effect: { type: "custom", effectId: "extreme_form_ignis" }
    },
    slot5: {
      label: "ビームライフル",
      desc: "80ダメージ。射撃、ビーム、必中。",
      effect: { type: "attack", damage: 80, count: 1, attackType: "shoot", beam: true, cannotEvade: true }
    },
    slot6: {
      label: "ミスティックフェイズ換装",
      desc: "ミスティックフェイズへ換装する。",
      effect: { type: "custom", effectId: "extreme_form_mystic" }
    }
  };
}

function carnageSlots() {
  return {
    slot1: {
      label: "ファイヤーバンカー",
      desc: "20ダメージ×2回。格闘。ヒット時、相手1ターン休み。",
      effect: { type: "attack", damage: 20, count: 2, attackType: "melee", special: "extreme_stun_1turn" }
    },
    slot2: {
      label: "ビームジャミングボール",
      desc: "30ダメージ。射撃。ヒット時、3ターン間相手の攻撃を3回分無効化する。",
      effect: { type: "attack", damage: 30, count: 1, attackType: "shoot", special: "extreme_confuse_3" }
    },
    slot3: {
      label: "カルネージ・ストライカー",
      desc: "150ダメージ。射撃、軽減不可。",
      effect: { type: "attack", damage: 150, count: 1, attackType: "shoot", ignoreReduction: true }
    },
    slot4: {
      label: "高高度カルネージストライカー",
      desc: "上空に退避して相手の攻撃を無効化し、次のターンに200ダメージの射撃攻撃を行う。",
      effect: { type: "custom", effectId: "extreme_high_altitude_carnage" }
    },
    slot5: {
      label: "カルネージストライカー連射",
      desc: "60ダメージ×3回。射撃。",
      effect: { type: "attack", damage: 60, count: 3, attackType: "shoot", special: "extreme_once_hit_carnage" }
    },
    slot6: {
      label: "換装解除",
      desc: "エクストリームガンダムに戻る。次のターン、回避可能な攻撃を全て回避する。",
      effect: { type: "custom", effectId: "extreme_form_normal_full_evade" }
    }
  };
}

function tachyonSlots(state) {
  const isEx = !!getExtremeEffect(state, "extreme_overlimit");

  return {
    slot1: {
      label: "衝撃波",
      desc: "10ダメージ×5回。格闘。",
      effect: withTachyonBonus({ type: "attack", damage: 10, count: 5, attackType: "melee" }, state)
    },
    slot2: isEx ? {
      label: "サンダー連斬",
      desc: "15ダメージ×7回。格闘。",
      ex: true,
      effect: withTachyonBonus({ type: "attack", damage: 15, count: 7, attackType: "melee" }, state)
    } : {
      label: "サンダースラッシュ",
      desc: "30ダメージ。格闘。ヒット時、相手回避-2。",
      effect: withTachyonBonus({ type: "attack", damage: 30, count: 1, attackType: "melee", special: "extreme_evade_minus_2" }, state)
    },
    slot3: {
      label: "オーバーリミット",
      desc: "5ターン間、単発攻撃数値+5。重複時+3ターン、さらに+5。スロットがEXになる。",
      effect: { type: "custom", effectId: "extreme_overlimit" }
    },
    slot4: isEx ? {
      label: "タキオンスライサー伸重斬",
      desc: "150ダメージ。格闘、軽減不可。回避2所持がなければ回避不能。実消費は1。",
      ex: true,
      effect: withTachyonBonus({ type: "attack", damage: 150, count: 1, attackType: "melee", ignoreReduction: true, minEvadeRequired: 2 }, state)
    } : {
      label: "タキオンスライサー伸凪",
      desc: "150ダメージ。格闘。回避3所持がなければ回避不能。実消費は1。",
      effect: withTachyonBonus({ type: "attack", damage: 150, count: 1, attackType: "melee", minEvadeRequired: 3 }, state)
    },
    slot5: isEx ? {
      label: "タキオンソードビット",
      desc: "20ダメージ×8回。射撃。",
      ex: true,
      effect: withTachyonBonus({ type: "attack", damage: 20, count: 8, attackType: "shoot" }, state)
    } : {
      label: "タキオンスライサー連斬",
      desc: "10ダメージ×7回。格闘、軽減不可。",
      effect: withTachyonBonus({ type: "attack", damage: 10, count: 7, attackType: "melee", ignoreReduction: true }, state)
    },
    slot6: {
      label: "換装解除",
      desc: "エクストリームガンダムに戻る。次のターン、回避可能な攻撃を全て回避する。",
      effect: { type: "custom", effectId: "extreme_form_normal_full_evade" }
    }
  };
}

function ignisSlots() {
  return {
    slot1: {
      label: "シールドビット",
      desc: "3ターン間、射撃属性被ダメージを半減する。",
      effect: { type: "custom", effectId: "extreme_shield_bit" }
    },
    slot2: {
      label: "ファンネルスケートボード",
      desc: "発動ターン中、格闘属性無効。50ダメージ。格闘。",
      effect: { type: "attack", damage: 50, count: 1, attackType: "melee", special: "extreme_melee_null_this_turn" }
    },
    slot3: {
      label: "ローリング・ラインファンネル",
      desc: "100ダメージ。射撃、ビーム、必中。",
      effect: { type: "attack", damage: 100, count: 1, attackType: "shoot", beam: true, cannotEvade: true }
    },
    slot4: {
      label: "ファンネルランス・ニードルダンスコンビネーション",
      desc: "30ダメージ×4回。格闘、ビーム。",
      effect: { type: "attack", damage: 30, count: 4, attackType: "melee", beam: true }
    },
    slot5: {
      label: "ファンネル・フルバースト",
      desc: "45ダメージ×4回。射撃、ビーム、軽減不可。",
      effect: { type: "attack", damage: 45, count: 4, attackType: "shoot", beam: true, ignoreReduction: true }
    },
    slot6: {
      label: "換装解除",
      desc: "エクストリームガンダムに戻る。次のターン、回避可能な攻撃を全て回避する。",
      effect: { type: "custom", effectId: "extreme_form_normal_full_evade" }
    }
  };
}

function mysticSlots() {
  return {
    slot1: {
      label: "忘我墜星(オブビリオン・メテオ)",
      desc: "30ダメージ×4回。射撃。",
      effect: { type: "attack", damage: 30, count: 4, attackType: "shoot" }
    },
    slot2: {
      label: "天上麗舞(ソレスタル・ビューティング)",
      desc: "120ダメージ。射撃、軽減不可。ヒット時、相手回避-5。",
      effect: { type: "attack", damage: 120, count: 1, attackType: "shoot", ignoreReduction: true, special: "extreme_evade_minus_5" }
    },
    slot3: {
      label: "終焉摂理(デスティネイトプラン)",
      desc: "イクス・ファンネルミサイル。10ダメージ×8回。射撃。相手が4回以上回避すると、もう一度スロット行動する。",
      effect: { type: "attack", damage: 10, count: 8, attackType: "shoot", special: "extreme_reroll_if_evade_4" }
    },
    slot4: {
      label: "人馬一神・乱れ突き",
      desc: "10ダメージ×8回。格闘、軽減不可。1回以上被弾した場合、フィニッシュ突き120ダメージを追加。",
      effect: { type: "attack", damage: 10, count: 8, attackType: "melee", ignoreReduction: true, special: "extreme_once_hit_mystic" }
    },
    slot5: {
      label: "絶望蝶",
      desc: "相手の現在HPの半分ダメージ。月光蝶、軽減不可。",
      effect: { type: "attack", damage: 0, count: 1, attackType: "shoot", moonlightButterfly: true, ignoreReduction: true, special: "extreme_half_current_hp" }
    },
    slot6: {
      label: "換装解除",
      desc: "エクストリームガンダムに戻る。次のターン、回避可能な攻撃を全て回避する。",
      effect: { type: "custom", effectId: "extreme_form_normal_full_evade" }
    }
  };
}

function getSlotsForForm(state) {
  if (state.formId === "carnage") return carnageSlots();
  if (state.formId === "tachyon") return tachyonSlots(state);
  if (state.formId === "ignis") return ignisSlots();
  if (state.formId === "mystic") return mysticSlots();
  return normalSlots();
}

function getStatusForForm(state) {
  const status = [
    `共有被ダメージ:${state.extremeTotalDamageTaken}`
  ];

  if (state.formId === "normal") {
    status.push("特性: 1ターン毎HP50回復");
  }

  if (state.formId === "carnage") {
    status.push("特性: 1ターンの総ダメージを30軽減");
  }

  if (state.formId === "tachyon") {
    const over = getExtremeEffect(state, "extreme_overlimit");
    if (over) status.push(`オーバーリミット:${over.turns}ターン / 攻撃+${getAttackBonus(state)}`);
    if (state.extremeSkipActionTurns > 0) status.push(`行動不能:${state.extremeSkipActionTurns}ターン / 被ダメージ半減`);
  }

  if (state.formId === "ignis") {
    const shield = getExtremeEffect(state, "extreme_shield_bit");
    if (shield) status.push(`シールドビット:${shield.turns}ターン`);

    if (state.extremeIgnisMode === "damage") {
      status.push("イグニスモード: 被弾増加モード");
      status.push("特性: 被ダメージ1.5倍");
    } else {
      status.push("イグニスモード: 回避モード");
      status.push("特性: 回避可能攻撃を全回避");
    }
  }

  if (state.formId === "mystic") {
    status.push("特性: 被ダメージ常時半減");
  }

  if (
    Array.isArray(state.pendingReservedActions) &&
    state.pendingReservedActions.some((action) => action.id === "extreme_high_altitude_carnage")
  ) {
    status.push("高高度カルネージストライカー: 予約中");
  }

  if (state.extremeFullEvadeActive) status.push("換装解除効果: 回避可能攻撃を全回避");

  return status;
}

function tickEffect(state, key) {
  const effect = getExtremeEffect(state, key);
  if (!effect) return null;

  if (effect.skipNextTick) {
    effect.skipNextTick = false;
    return effect;
  }

  effect.turns -= 1;
  if (effect.turns <= 0) {
    clearStateEffect(state, key);
    return null;
  }

  return effect;
}

export function getExtremeGundamDerivedState(state) {
  ensureExtremeState(state);

  const slots = getSlotsForForm(state);

  return {
    name: state.formId === "carnage"
      ? "エクストリームガンダム・カルネージフェイズ"
      : state.formId === "tachyon"
        ? "エクストリームガンダム・タキオンフェイズ"
        : state.formId === "ignis"
          ? "エクストリームガンダム・イグニスフェイズ"
          : state.formId === "mystic"
            ? "エクストリームガンダム・ミスティックフェイズ"
            : "エクストリームガンダム",
    status: getStatusForForm(state),
    slots,
    slotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
    rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"]
  };
}

export function onExtremeGundamBeforeSlot(state) {
  ensureExtremeState(state);

  const messages = [];

  state.extremeMeleeNullThisTurn = false;

  advanceIgnisModeForSide(state, "self", messages);

  if (state.extremeFullEvadePending) {
    state.extremeFullEvadePending = false;
    state.extremeFullEvadeActive = true;
    messages.push("換装解除効果：このターン、回避可能な攻撃を全回避");
  }

  if (state.extremeTachyonAllEvadedStunPending) {
    state.extremeTachyonAllEvadedStunPending = false;
    state.extremeSkipActionTurns = Math.max(state.extremeSkipActionTurns, 1);
    messages.push("タキオンフェイズ特性：全攻撃回避されたため、このターン行動不能");
  }

  if (state.extremeSkipActionTurns > 0) {
    state.extremeSkipActionTurns -= 1;
    return {
      redraw: true,
      cancelSlot: true,
      message: messages.concat("エクストリームガンダム・タキオンフェイズは行動不能").join("\n")
    };
  }

  return { redraw: messages.length > 0, message: messages.join("\n") || null };
}

export function onExtremeGundamEnemyBeforeSlot(state) {
  ensureExtremeState(state);

  const messages = [];

  advanceIgnisModeForSide(state, "enemy", messages);

  if (state.extremeFullEvadePending) {
    state.extremeFullEvadePending = false;
    state.extremeFullEvadeActive = true;
    messages.push("換装解除効果：このターン、回避可能な攻撃を全回避");
  }

  return { redraw: messages.length > 0, message: messages.join("\n") || null };
}

export function onExtremeGundamAfterSlotResolved(state, slotNumber, context = {}) {
  ensureExtremeState(state);

  const result = context.resolveResult || {};
  const slotKey = `slot${slotNumber}`;
  const slot = state.slots?.[slotKey] || null;

  const effectId = result?.customEffectId || slot?.effect?.effectId || null;

  if (!effectId) {
    return { redraw: false, message: null };
  }

  if (effectId === "extreme_form_carnage") {
    changeExtremeForm(state, "carnage");
    return { redraw: true, message: "エクストリームガンダム・カルネージフェイズへ換装" };
  }

  if (effectId === "extreme_form_tachyon") {
    changeExtremeForm(state, "tachyon");
    return { redraw: true, message: "エクストリームガンダム・タキオンフェイズへ換装" };
  }

  if (effectId === "extreme_form_ignis") {
    enterIgnisForm(state);
    return { redraw: true, message: "エクストリームガンダム・イグニスフェイズへ換装。回避モード開始" };
  }

  if (effectId === "extreme_form_mystic") {
    changeExtremeForm(state, "mystic");
    return { redraw: true, message: "エクストリームガンダム・ミスティックフェイズへ換装" };
  }

  if (effectId === "extreme_form_normal_full_evade") {
    changeExtremeForm(state, "normal");
    state.extremeFullEvadePending = true;
    return { redraw: true, message: "エクストリームガンダムへ換装解除。次のターン、回避可能な攻撃を全て回避" };
  }

  if (effectId === "extreme_high_altitude_carnage") {
    if (!Array.isArray(state.pendingReservedActions)) {
      state.pendingReservedActions = [];
    }

    state.pendingReservedActions.push({
      id: "extreme_high_altitude_carnage",
      delay: 1,
      trigger: "turn_start",
      ownerPlayer: context.ownerPlayer,
      enemyPlayer: context.enemyPlayer,
      type: "attack",
      label: "高高度カルネージストライカー",
      attacks: [
        {
          damage: 200,
          type: "shoot",
          source: "高高度カルネージストライカー"
        }
      ]
    });

    return {
      redraw: true,
      message: "高高度カルネージストライカー：上空退避。次の自ターン開始時に200ダメージ射撃を行う"
    };
  }

  if (effectId === "extreme_overlimit") {
    const current = getExtremeEffect(state, "extreme_overlimit");
    if (current) {
      current.turns += 3;
      current.level = Number(current.level || 1) + 1;
      return { redraw: true, message: `オーバーリミット重複：残り${current.turns}ターン / 攻撃+${current.level * 5}` };
    }

    setStateEffect(state, "extreme_overlimit", {
      turns: 5,
      level: 1,
      boost: true,
      skipNextTick: true
    });
    return { redraw: true, message: "オーバーリミット発動：5ターン間、攻撃+5。スロットEX化" };
  }

  if (effectId === "extreme_shield_bit") {
    setStateEffect(state, "extreme_shield_bit", {
      turns: 3,
      skipNextTick: true
    });
    return { redraw: true, message: "シールドビット発動：3ターン間、射撃属性被ダメージ半減" };
  }

  return { redraw: false, message: null };
}

export function onExtremeGundamActionResolved(attacker, defender, context) {
  ensureExtremeState(attacker);

  const messages = [];
  let redraw = false;

  if (context.slotLabel === "ビームジャミングボール" && context.hitCount > 0) {
    defender.isConfusedTurn = true;
    defender.confuseHits = Math.max(Number(defender.confuseHits || 0), 3);
    messages.push(`${defender.name} の攻撃を3回分無効化`);
    redraw = true;
  }

  if (context.slotLabel === "ファイヤーバンカー" && context.hitCount > 0) {
    defender.pendingActionPenalty = Number(defender.pendingActionPenalty || 0) + 1;
    messages.push(`${defender.name} は次の行動権-1`);
    redraw = true;
  }

  if (context.slotLabel === "サンダースラッシュ" && context.hitCount > 0) {
    defender.evade = Math.max(0, defender.evade - 2);
    messages.push(`${defender.name} の回避-2`);
    redraw = true;
  }

  if (context.slotLabel === "天上麗舞(ソレスタル・ビューティング)" && context.hitCount > 0) {
    defender.evade = Math.max(0, defender.evade - 5);
    messages.push(`${defender.name} の回避-5`);
    redraw = true;
  }

  if (context.slotLabel === "終焉摂理(デスティネイトプラン)" && context.evadeCount >= 4) {
    attacker.actionCount = Number(attacker.actionCount || 0) + 1;
    messages.push("終焉摂理：相手が4回以上回避したため、行動回数+1");
    redraw = true;
  }

  if (context.slotLabel === "人馬一神・乱れ突き" && context.hitCount > 0) {
    messages.push("人馬一神・乱れ突き：1回以上被弾したためフィニッシュ突きが発動");
    redraw = true;

    return {
      redraw,
      message: messages.join("\n") || null,
      appendAttackLabel: "人馬一神・乱れ突き フィニッシュ突き",
      appendSlotLabel: "人馬一神・乱れ突き フィニッシュ突き",
      appendSlotDesc: "120ダメージ。格闘、軽減不可。",
      appendAttacks: [
        {
          damage: 120,
          type: "melee",
          ignoreReduction: true,
          source: "人馬一神・乱れ突き フィニッシュ突き"
        }
      ]
    };
  }

  if (attacker.formId === "tachyon" && context.totalCount > 0 && context.allEvaded) {
    attacker.extremeTachyonAllEvadedStunPending = true;
    messages.push("タキオンフェイズ特性：次のターン行動不能。行動不能中は被ダメージ半減");
    redraw = true;
  }

  if (
    context.slotLabel === "カルネージストライカー連射" &&
    context.hitCount > 0 &&
    context.appendedFrom !== "カルネージストライカー連射"
  ) {
    return {
      redraw: true,
      message: messages.concat("カルネージストライカー連射：1回以上被弾したため本命攻撃").join("\n"),
      appendAttackLabel: "カルネージストライカー連射 追撃",
      appendSlotLabel: "カルネージストライカー連射 追撃",
      appendSlotDesc: "60ダメージ。射撃。",
      appendAttacks: [
        {
          damage: 60,
          type: "shoot",
          beam: false,
          cannotEvade: false,
          ignoreReduction: false,
          ignoreDefense: false,
          source: "カルネージストライカー連射 追撃"
        }
      ]
    };
  }

  return { redraw, message: messages.join("\n") || null };
}

export function onExtremeGundamDamaged(state) {
  ensureExtremeState(state);

  const currentMax = FORM_MAX_HP[state.formId] || state.maxHp || FORM_MAX_HP.normal;
  state.extremeTotalDamageTaken = Math.max(0, currentMax - state.hp);

  return { redraw: true, message: null };
}

export function modifyExtremeGundamTakenDamage(state, attacker, attack, damage, context = {}) {
  ensureExtremeState(state);

  let nextDamage = damage;
  const messages = [];

  if (state.formId === "carnage") {
    const attackContext = context?.currentAttackContext;
    if (attackContext) {
      if (typeof attackContext.extremeCarnageReductionRemaining !== "number") {
        attackContext.extremeCarnageReductionRemaining = 30;
      }

      const reduceAmount = Math.min(
        nextDamage,
        Math.max(0, attackContext.extremeCarnageReductionRemaining)
      );

      nextDamage = Math.max(0, nextDamage - reduceAmount);
      attackContext.extremeCarnageReductionRemaining -= reduceAmount;

      if (reduceAmount > 0) {
        messages.push(`カルネージフェイズ特性：総ダメージ軽減 残り${attackContext.extremeCarnageReductionRemaining}`);
      }
    }
  }

  if (state.formId === "tachyon" && state.extremeSkipActionTurns > 0 && !attack.ignoreReduction) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("タキオンフェイズ行動不能中：被ダメージ半減");
  }

  const shield = getExtremeEffect(state, "extreme_shield_bit");
  if (state.formId === "ignis" && shield && attack.type === "shoot" && !attack.ignoreReduction) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("シールドビット：射撃被ダメージ半減");
  }

  if (state.formId === "ignis" && state.extremeIgnisMode === "damage") {
    nextDamage = Math.floor(nextDamage * 1.5);
    messages.push("イグニスフェイズ被弾増加モード：被ダメージ1.5倍");
  }

  if (state.formId === "mystic" && !attack.ignoreReduction) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("ミスティックフェイズ特性：被ダメージ半減");
  }

  return { damage: nextDamage, message: messages.join("\n") || null };
}

export function modifyExtremeGundamEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureExtremeState(defender);

  if (defender.extremeFullEvadeActive && !attack.cannotEvade) {
    return { handled: true, ok: true, consumeEvade: 0, message: "換装解除効果：自動回避" };
  }

  if (
    defender.formId === "ignis" &&
    defender.extremeIgnisMode === "evade" &&
    !attack.cannotEvade
  ) {
    return { handled: true, ok: true, consumeEvade: 0, message: "イグニスフェイズ回避モード：自動回避" };
  }

  if (attack.minEvadeRequired && defender.evade < attack.minEvadeRequired) {
    return { handled: true, ok: false, consumeEvade: 0, message: `回避には回避${attack.minEvadeRequired}以上の所持が必要` };
  }

  return { handled: false };
}

export function onExtremeGundamTurnEnd(state) {
  ensureExtremeState(state);

  const messages = [];

  if (state.formId === "normal") {
    state.hp = Math.min(state.maxHp, state.hp + 50);
    state.extremeTotalDamageTaken = Math.max(0, state.maxHp - state.hp);
    messages.push("エクストリームガンダム特性：HP50回復");
  }

  tickEffect(state, "extreme_overlimit");
  tickEffect(state, "extreme_shield_bit");

  state.extremeHighAltitudeActive = false;
  state.extremeFullEvadeActive = false;
  state.extremeMeleeNullThisTurn = false;

  return { redraw: true, message: messages.join("\n") || null };
}
