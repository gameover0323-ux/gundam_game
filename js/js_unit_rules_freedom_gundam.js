import {
  setForm,
  setStateEffect,
  getStateEffect,
  clearStateEffect,
  doubleEvadeRedCap,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

function ensureFreedomState(state) {
  if (!state) return;
  if (typeof state.freedomHalberdUsedTurn !== "number") state.freedomHalberdUsedTurn = -1;
}

function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
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
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, amount);
  }
  if (!state || Number(state.evade || 0) < amount) return false;
  state.evade = Math.max(0, Number(state.evade || 0) - amount);
  return true;
}

function addRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, amount);
  }
  state.actionCount = Math.max(0, Number(state.actionCount || 0)) + amount;
  return amount;
}

function getCurrentTurn(context = {}) {
  return Number(context.turn || context.turnCount || context.currentTurn || 0);
}

function getSeedEffect(state) {
  return getStateEffect(state, "freedom_seed");
}

function isSeedActive(state) {
  return !!getSeedEffect(state);
}

function enterSeed(state, turns) {
  setForm(state, "seed", { preserveHp: true, preserveEvade: true });
  setStateEffect(state, "freedom_seed", {
    turns,
    skipNextTick: true,
    boost: true,
    boostType: "seed",
    boostName: "S.E.E.D.覚醒"
  });
}

function extendSeed(state, turns) {
  const effect = getSeedEffect(state);
  if (effect) {
    effect.turns += turns;
  } else {
    enterSeed(state, turns);
  }
}

function exitSeed(state) {
  clearStateEffect(state, "freedom_seed");
  setForm(state, "base", { preserveHp: true, preserveEvade: true });
}

function tickSeed(state) {
  const effect = getSeedEffect(state);
  if (!effect) return false;

  if (effect.skipNextTick) {
    effect.skipNextTick = false;
    return true;
  }

  effect.turns -= 1;
  if (effect.turns <= 0) {
    exitSeed(state);
    return true;
  }

  return true;
}

function applySeedAttackAttributes(slot) {
  if (!slot?.effect || slot.effect.type !== "attack") return slot;
  return {
    ...slot,
    effect: {
      ...slot.effect,
      cannotEvade: true,
      addedCannotEvade: true
    }
  };
}

function buildSeedSlot1(state, context = {}) {
  const evade = getRuleEvade(state, context);
  return {
    label: `1EX ラケルタ連撃 20ダメージ×${evade}回`,
    desc: `20ダメージ×${evade}回。格闘、ビーム属性、S.E.E.D.中は橙必中。`,
    effect: {
      type: "attack",
      damage: 20,
      count: evade,
      attackType: "melee",
      beam: true,
      cannotEvade: true,
      addedCannotEvade: true
    },
    ex: true
  };
}

export function getFreedomDerivedState(state, context = {}) {
  ensureFreedomState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  const seed = getSeedEffect(state);
  if (!seed) return result;

  result.name = "フリーダムガンダム(S.E.E.D.発動)";
  result.status.push(`S.E.E.D.覚醒 残${seed.turns}ターン`);

  result.slots.slot1 = buildSeedSlot1(state, context);

  ["slot2", "slot6"].forEach((slotKey) => {
    const baseSlot = state.slots?.[slotKey];
    if (baseSlot) result.slots[slotKey] = applySeedAttackAttributes(baseSlot);
  });

  return result;
}

export function canUseFreedomSpecial(state, specialKey, context = {}) {
  ensureFreedomState(state);

  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つかりません" };

  const evade = getRuleEvade(state, context);
  const seed = getSeedEffect(state);

  if (special.effectType === "freedom_halberd") {
    const turn = getCurrentTurn(context);
    const allowed = evade >= Number(state.evadeMax || 0) && state.freedomHalberdUsedTurn !== turn;
    return { allowed, message: allowed ? null : "条件未達" };
  }

  if (special.effectType === "freedom_barrel_roll") {
    const allowed = evade >= 6;
    return { allowed, message: allowed ? null : "回避が足りません" };
  }

  if (special.effectType === "freedom_seed_chase") {
    const allowed = !!seed && Number(seed.turns || 0) >= 1;
    return { allowed, message: allowed ? null : "S.E.E.D.残りターンが足りません" };
  }

  if (special.effectType === "freedom_seed_cancel") {
    const allowed = !!seed && Number(seed.turns || 0) >= 2;
    return { allowed, message: allowed ? null : "S.E.E.D.残りターンが足りません" };
  }

  return { allowed: true, message: null };
}

export function executeFreedomSpecial(state, specialKey, context = {}) {
  ensureFreedomState(state);

  const special = state.specials?.[specialKey];
  if (!special) {
    return { handled: true, redraw: false, message: "特殊行動データが見つかりません" };
  }

  if (special.effectType === "freedom_halberd") {
    const can = canUseFreedomSpecial(state, specialKey, context);
    if (!can.allowed) return { handled: true, redraw: true, message: can.message };

    state.freedomHalberdUsedTurn = getCurrentTurn(context);

    if (Math.random() < 0.2) {
      addRuleAction(state, 1, context);
      return { handled: true, redraw: true, message: "アンビデクストラスハルバード成功：行動回数+1" };
    }

    return { handled: true, redraw: true, message: "アンビデクストラスハルバード失敗" };
  }

  if (special.effectType === "freedom_barrel_roll") {
    if (!consumeRuleEvade(state, 6, context)) {
      return { handled: true, redraw: true, message: "回避が足りません" };
    }
    addRuleAction(state, 1, context);
    return { handled: true, redraw: true, message: "バレルロール：回避6消費、行動回数+1" };
  }

  if (special.effectType === "freedom_seed_chase") {
    const seed = getSeedEffect(state);
    if (!seed || Number(seed.turns || 0) < 1) {
      return { handled: true, redraw: true, message: "S.E.E.D.残りターンが足りません" };
    }
    seed.turns -= 1;
    addRuleAction(state, 1, context);
    if (seed.turns <= 0) exitSeed(state);
    return { handled: true, redraw: true, message: "S.E.E.D.追撃：S.E.E.D.残り1ターン消費、行動回数+1" };
  }

  if (special.effectType === "freedom_seed_cancel") {
    const seed = getSeedEffect(state);
    if (!seed || Number(seed.turns || 0) < 2) {
      return { handled: true, redraw: true, message: "S.E.E.D.残りターンが足りません" };
    }
    exitSeed(state);
    doubleEvadeRedCap(state);
    normalizeEvadeCapState(state);
    return { handled: true, redraw: true, message: "覚醒キャンセル：S.E.E.D.終了、回避数値を倍加" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onFreedomTurnEnd(state, context = {}) {
  ensureFreedomState(state);
  return { redraw: tickSeed(state), message: null };
}

export function onFreedomBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureFreedomState(state);
  return { redraw: false, message: null };
}

export function onFreedomEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureFreedomState(state);
  return { redraw: false, message: null };
}

export function onFreedomAfterSlotResolved(state, slotNumber, context = {}) {
  ensureFreedomState(state);

  const result = context.resolveResult || null;
  if (!result || result.kind !== "custom") {
    return { redraw: false, message: null };
  }

  if (result.customEffectId === "freedom_seed_activate") {
    enterSeed(state, 3);
    return { redraw: true, message: "S.E.E.D.覚醒発動" };
  }

  if (result.customEffectId === "freedom_seed_extend") {
    extendSeed(state, 3);
    return { redraw: true, message: "S.E.E.D.覚醒 残りターン+3" };
  }

  return { redraw: false, message: null };
}

export function onFreedomActionResolved(attacker, defender, context = {}) {
  ensureFreedomState(attacker);

  if (Number(context.slotNumber || 0) === 6 && context.resolveResult?.kind === "attack") {
    attacker.evade = Math.max(0, Number(attacker.evade || 0)) + 1;
    return { redraw: true, message: "クスィフィアス：回避+1" };
  }

  return { redraw: false, message: null };
}

export function onFreedomDamaged(defender, attacker, context = {}) {
  ensureFreedomState(defender);
  return { redraw: false, message: null };
}

export function modifyFreedomTakenDamage(defender, attacker, attack, damage, context = {}) {
  return { damage, message: null };
}

export function modifyFreedomEvadeAttempt(defender, attacker, attack, context = {}) {
  if (!isSeedActive(defender)) return { handled: false };

  const evade = Number(defender?.evade || 0);

  if (attack?.cannotEvade && evade <= 0) {
    return { handled: true, evade: false, message: "S.E.E.D.覚醒中だが、必中攻撃を回避する回避が足りない" };
  }

  if (evade > 0) {
    defender.evade = Math.max(0, evade - 1);
  }

  return { handled: true, evade: true, message: "S.E.E.D.覚醒：攻撃を回避" };
}

export function onFreedomResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  return { handled: false, redraw: false, message: null };
}
