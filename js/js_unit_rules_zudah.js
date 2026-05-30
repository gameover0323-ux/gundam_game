import { reduceEvade, normalizeEvadeCapState } from "./js_unit_runtime.js";

function ensureZudahState(state) {
  if (!state) return;
  if (typeof state.zudahAccelStack !== "number") state.zudahAccelStack = 0;
}

function heal(state, amount) {
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + amount);
}

function addAction(state, amount) {
  if (typeof state.actionCount !== "number") state.actionCount = 1;
  state.actionCount += amount;
}

export function getZudahDerivedState(state) {
  ensureZudahState(state);

  const status = [
    "特性：超回避",
    `加速重ね掛け:${state.zudahAccelStack}/5`,
    `シールド残り:${Math.max(0, Number(state.shieldCount || 0))}/3`
  ];

  return { status, slots: {}, specials: {} };
}

export function canUseZudahSpecial(state, specialKey, context = {}) {
  ensureZudahState(state);

  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "zudah_engine_cut") {
    const accelOk = state.zudahAccelStack >= 2;

    const turnStartOnly =
  Number(state.actionCount || 0) === Number(state.baseActionCount || 1);

    if (!accelOk) {
      return {
        allowed: false,
        message: "加速2回以上で使用可能"
      };
    }

    if (!turnStartOnly) {
      return {
        allowed: false,
        message: "ターン開始時のみ使用可能"
      };
    }

    return {
      allowed: true,
      message: null
    };
  }

  if (special.effectType === "zudah_charge") {
    return {
      allowed: Number(state.evade || 0) >= 5,
      message: Number(state.evade || 0) >= 5 ? null : "回避が足りない"
    };
  }

  if (special.effectType === "zudah_feint") {
    return {
      allowed: Number(state.actionCount || 0) >= 1,
      message: Number(state.actionCount || 0) >= 1 ? null : "行動回数が足りない"
    };
  }

  if (special.effectType === "zudah_super_evade") {
    return { allowed: false, message: "自動特性" };
  }

  return { allowed: true, message: null };
}

export function executeZudahSpecial(state, specialKey, context = {}) {
  ensureZudahState(state);

  const special = state.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "zudah_engine_cut") {
    const turnStartOnly =
      context?.phase === "turnStart" ||
      context?.timing === "turnStart" ||
      state?.isTurnStartPhase === true;

    if (!turnStartOnly) {
      return {
        handled: true,
        redraw: false,
        message: "ターン開始時のみ使用可能"
      };
    }

    if (state.zudahAccelStack < 2) {
      return { handled: true, redraw: false, message: "加速2回以上で使用可能" };
    }

    const healAmount = state.zudahAccelStack * 10;
    state.zudahAccelStack = 0;
    state.baseActionCount = 1;
    state.actionCount = 1;
    heal(state, healAmount);
    normalizeEvadeCapState(state);

    return {
      handled: true,
      redraw: true,
      message: `エンジンカット：行動回数を1に戻し、HP${healAmount}回復`
    };
  }

  if (special.effectType === "zudah_charge") {
    if (Number(state.evade || 0) < 5) {
      return { handled: true, redraw: false, message: "回避が足りない" };
    }

    reduceEvade(state, 5);
    addAction(state, 1);

    return { handled: true, redraw: true, message: "突撃：現在ターンの行動回数+1" };
  }

  if (special.effectType === "zudah_feint") {
    if (Number(state.actionCount || 0) < 1) {
      return { handled: true, redraw: false, message: "行動回数が足りない" };
    }

    state.actionCount = Math.max(0, Number(state.actionCount || 0) - 1);
    state.evade = Math.max(0, Number(state.evade || 0) + 1);
    normalizeEvadeCapState(state);

    return { handled: true, redraw: true, message: "翻弄：行動回数-1、回避+1" };
  }
if (special.effectType === "shield") {
    if (state.shieldCount <= 0) {
      return { handled: true, redraw: false, message: "シールドはもう使えない" };
    }

    if (state.shieldActive) {
      return { handled: true, redraw: false, message: "シールドは既に展開中" };
    }

    state.shieldActive = true;
    state.shieldCount--;

    return {
      handled: true,
      redraw: true,
      message: `${state.name} シールド展開。このターンの被ダメージ半減`
    };
  }

  return { handled: false, redraw: false, message: null };
}

export function onZudahAfterSlotResolved(state, slotNumber, context = {}) {
  ensureZudahState(state);

  const resolveResult = context.resolveResult || null;
  if (
    slotNumber === 5 &&
    resolveResult &&
    resolveResult.kind === "custom" &&
    resolveResult.customEffectId === "zudah_accel"
  ) {
    state.zudahAccelStack++;

    if (state.zudahAccelStack >= 5) {
      state.hp = 0;
      return {
        redraw: true,
        message: "ヅダは加速を5回重ね掛けし、自爆した"
      };
    }

    state.baseActionCount = 1 + state.zudahAccelStack;
    state.evadeMax = Number(state.evadeMax || 0) * 2;
    state.evade = Number(state.evade || 0) * 2;
    heal(state, 60);
    normalizeEvadeCapState(state);

    return {
      redraw: true,
      message: `加速：行動数+1、回避上限・現在回避倍加、HP60回復（${state.zudahAccelStack}/5）`
    };
  }

  return { redraw: false, message: null };
}

export function modifyZudahTakenDamage(defender, attacker, attack, damage) {
  return { damage, message: null };
}

export function modifyZudahEvadeAttempt(defender, attacker, attack) {
  ensureZudahState(defender);

  if (!attack?.cannotEvade) {
    return { handled: false };
  }

  if (Number(defender.evade || 0) < 2) {
    return {
      handled: true,
      ok: false,
      reason: "noEvade",
      message: "回避が足りない"
    };
  }

  return {
    handled: true,
    ok: true,
    consumeEvade: 2,
    message: null
  };
}

export function onZudahTurnEnd(state) {
  ensureZudahState(state);
  return { redraw: false, message: null };
}

export function onZudahBeforeSlot() {
  return { redraw: false, message: null };
}

export function onZudahEnemyBeforeSlot() {
  return { redraw: false, message: null };
}

export function onZudahActionResolved() {
  return { redraw: false, message: null };
}

export function onZudahDamaged() {
  return { redraw: false, message: null };
}

export function onZudahResolveChoice() {
  return { handled: false, redraw: false, message: null };
}
