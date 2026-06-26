import {
  normalizeEvadeCapState,
  reduceEvade,
  doubleEvadeRedCap
} from "./js_unit_runtime.js";

function ensureZudahState(state) {
  if (!state) return;
  if (typeof state.zudahAccelStack !== "number") state.zudahAccelStack = 0;
}

function getAdapter(context = {}) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context = {}) {
  return context?.ownerPlayer || null;
}

function getRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getEvade && ownerPlayer) {
    return adapter.getEvade(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.evade || 0));
}

function consumeRuleEvade(state, amount, context = {}) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  if (cost <= 0) return true;

  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, cost);
  }

  if (!state || Number(state.evade || 0) < cost) return false;
  reduceEvade(state, cost);
  return true;
}

function addRuleEvade(state, amount, context = {}) {
  const add = Math.max(0, Math.floor(Number(amount || 0)));
  if (add <= 0) return 0;

  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, add);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + add;
  normalizeEvadeCapState(state);
  return add;
}

function getRuleHp(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getUnifiedHp && adapter?.isUnifiedOwner?.(ownerPlayer) && adapter?.getOwnerTeam) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    return adapter.getUnifiedHp(team);
  }

  return Math.max(0, Number(state?.hp || 0));
}

function healRuleHp(state, amount, context = {}) {
  const healAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (healAmount <= 0) return 0;

  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, healAmount);
  }

  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + healAmount);
  return healAmount;
}

function setRuleHpZero(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeHp && adapter?.getUnifiedHp && adapter?.isUnifiedOwner?.(ownerPlayer) && adapter?.getOwnerTeam) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    const hp = adapter.getUnifiedHp(team);
    adapter.consumeHp(ownerPlayer, state, hp);
    return true;
  }

  if (state) state.hp = 0;
  return true;
}

function getRuleActionCount(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getActionCount && ownerPlayer) {
    return adapter.getActionCount(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.actionCount || 0));
}

function addRuleAction(state, amount, context = {}) {
  const add = Math.max(0, Math.floor(Number(amount || 0)));
  if (add <= 0) return 0;

  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, add);
  }

  if (typeof state.actionCount !== "number") state.actionCount = 1;
  state.actionCount += add;
  return add;
}

function consumeRuleAction(state, amount, context = {}) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  if (cost <= 0) return true;

  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeAction && ownerPlayer) {
    return adapter.consumeAction(ownerPlayer, state, cost);
  }

  if (!state) return false;
  if (typeof state.actionCount !== "number") state.actionCount = 1;
  if (state.actionCount < cost) return false;
  state.actionCount -= cost;
  return true;
}

function setRuleActionCount(state, amount, context = {}) {
  const next = Math.max(0, Math.floor(Number(amount || 0)));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.isUnifiedOwner?.(ownerPlayer) && adapter?.getOwnerTeam && adapter?.ensureUnifiedActionState) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    adapter.ensureUnifiedActionState(team);
    team.unifiedActionCount = next;
    return true;
  }

  if (state) state.actionCount = next;
  return true;
}

function setRuleBaseActionCount(state, amount, context = {}) {
  const next = Math.max(1, Math.floor(Number(amount || 1)));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.isUnifiedOwner?.(ownerPlayer) && adapter?.getOwnerTeam && adapter?.ensureUnifiedActionState) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    adapter.ensureUnifiedActionState(team);
    team.unifiedBaseActionCount = next;
    return true;
  }

  if (state) state.baseActionCount = next;
  return true;
}

function setZudahAccelEvadeDouble(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.applyToUnifiedPartners && ownerPlayer && adapter.applyToUnifiedPartners(ownerPlayer, unit => {
    doubleEvadeRedCap(unit);
  })) {
    return true;
  }

  doubleEvadeRedCap(state);
  return true;
}

function consumeZudahEvadeKeepCap(state, amount, context = {}) {
  return consumeRuleEvade(state, amount, context);
}

function resetSingleZudahAccelEvadeCap(unit) {
  if (!unit) return;

  const baseMax = Math.max(0, Number(unit.evadeMax || 0));

  unit.overEvadeMode = false;
  unit.overEvadeCap = baseMax;
  unit.evadeRedCap = baseMax;
  unit.evadeGoldCap = Math.max(
    baseMax,
    Number(unit.overEvadeAbsoluteMax || 50)
  );

  unit.evade = Math.min(Math.max(0, Number(unit.evade || 0)), baseMax);

  normalizeEvadeCapState(unit);
}

function resetZudahAccelEvadeCap(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.applyToUnifiedPartners && ownerPlayer && adapter.applyToUnifiedPartners(ownerPlayer, unit => {
    resetSingleZudahAccelEvadeCap(unit);
  })) {
    return true;
  }

  resetSingleZudahAccelEvadeCap(state);
  return true;
}

function isTurnStartForZudah(state, context = {}) {
  if (
    context?.phase === "turnStart" ||
    context?.timing === "turnStart" ||
    state?.isTurnStartPhase === true
  ) {
    return true;
  }

  const actionCount = getRuleActionCount(state, context);
  const accelStack = Number(state.zudahAccelStack || 0);
  const expectedStartActionCount = 1 + accelStack;

  return actionCount === expectedStartActionCount;
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
    if (state.zudahAccelStack < 2) {
      return { allowed: false, message: "加速2回以上で使用可能" };
    }

    if (!isTurnStartForZudah(state, context)) {
      return { allowed: false, message: "ターン開始時のみ使用可能" };
    }

    return { allowed: true, message: null };
  }

  if (special.effectType === "zudah_charge") {
    const ev = getRuleEvade(state, context);
    return {
      allowed: ev >= 5,
      message: ev >= 5 ? null : "回避が足りない"
    };
  }

  if (special.effectType === "zudah_feint") {
    const actionCount = getRuleActionCount(state, context);
    return {
      allowed: actionCount >= 1,
      message: actionCount >= 1 ? null : "行動回数が足りない"
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
  if (!special) {
    return { handled: true, redraw: false, message: "特殊行動データが見つからない" };
  }

  if (special.effectType === "zudah_engine_cut") {
    if (state.zudahAccelStack < 2) {
      return { handled: true, redraw: false, message: "加速2回以上で使用可能" };
    }

    if (!isTurnStartForZudah(state, context)) {
      return { handled: true, redraw: false, message: "ターン開始時のみ使用可能" };
    }

    const healAmount = state.zudahAccelStack * 10;

    state.zudahAccelStack = 0;
    setRuleBaseActionCount(state, 1, context);
    setRuleActionCount(state, 1, context);

    healRuleHp(state, healAmount, context);
    resetZudahAccelEvadeCap(state, context);

    return {
      handled: true,
      redraw: true,
      message: `エンジンカット：行動回数を1に戻し、HP${healAmount}回復`
    };
  }

  if (special.effectType === "zudah_charge") {
    if (getRuleEvade(state, context) < 5) {
      return { handled: true, redraw: false, message: "回避が足りない" };
    }

    if (!consumeZudahEvadeKeepCap(state, 5, context)) {
      return { handled: true, redraw: true, message: "回避が足りない" };
    }

    addRuleAction(state, 1, context);

    return { handled: true, redraw: true, message: "突撃：現在ターンの行動回数+1" };
  }

  if (special.effectType === "zudah_feint") {
    if (getRuleActionCount(state, context) < 1) {
      return { handled: true, redraw: false, message: "行動回数が足りない" };
    }

    if (!consumeRuleAction(state, 1, context)) {
      return { handled: true, redraw: true, message: "行動回数が足りない" };
    }

    addRuleEvade(state, 1, context);

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

    if (state.zudahAccelStack >= 4) {
      setRuleHpZero(state, context);
      return { redraw: true, message: "ヅダは加速を4回重ね掛けし、自爆した" };
    }

    setRuleBaseActionCount(state, 1 + state.zudahAccelStack, context);
    setZudahAccelEvadeDouble(state, context);
    healRuleHp(state, 60, context);

    return {
      redraw: true,
      message: `加速：行動数+1、回避上限・現在回避倍加、HP60回復（${state.zudahAccelStack}/4）`
    };
  }

  return { redraw: false, message: null };
}

export function modifyZudahTakenDamage(defender, attacker, attack, damage) {
  return { damage, message: null };
}

export function modifyZudahEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureZudahState(defender);

  if (!attack?.cannotEvade) {
    return { handled: false };
  }

  if (getRuleEvade(defender, context) < 2) {
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
    consumeByAdapter: !!(context?.twoVtwoAdapter && context?.ownerPlayer),
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
