export function getStoryGmDerivedState(state) {
  return {
    name: null,
    slots: {},
    specials: {},
    status: ["特性：シールド 10%"]
  };
}

export function canUseStoryGmSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryGmSpecial(state, specialKey, context = {}) {
  return { handled: false, message: null };
}

export function onStoryGmTurnEnd(state, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryGmBeforeSlot(state, rolledSlotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryGmEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryGmAfterSlotResolved(state, slotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryGmActionResolved(attacker, defender, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryGmDamaged(defender, attacker, context = {}) {
  return { redraw: false, message: null };
}

export function modifyStoryGmTakenDamage(defender, attacker, attack, damage) {
  if (attack?.ignoreReduction) {
    return { damage, message: null };
  }

  if (Math.random() >= 0.1) {
    return { damage, message: null };
  }

  return {
    damage: Math.floor(Number(damage || 0) / 2),
    message: "GM：シールド発動！被ダメージ半減"
  };
}

export function modifyStoryGmEvadeAttempt(defender, attacker, attack, context = {}) {
  return null;
}

export function onStoryGmResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  return { handled: false, redraw: false, message: null };
}
