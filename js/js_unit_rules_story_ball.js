export function getStoryBallDerivedState(state) {
  return { name: null, slots: {}, specials: {}, status: [] };
}

export function canUseStoryBallSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryBallSpecial(state, specialKey, context = {}) {
  return { handled: false, message: null };
}

export function onStoryBallTurnEnd(state, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryBallBeforeSlot(state, rolledSlotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryBallEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryBallAfterSlotResolved(state, slotNumber, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryBallActionResolved(attacker, defender, context = {}) {
  return { redraw: false, message: null };
}

export function onStoryBallDamaged(defender, attacker, context = {}) {
  return { redraw: false, message: null };
}

export function modifyStoryBallTakenDamage(defender, attacker, attack, damage) {
  return { damage, message: null };
}

export function modifyStoryBallEvadeAttempt(defender, attacker, attack, context = {}) {
  return null;
}

export function onStoryBallResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  return { handled: false, redraw: false, message: null };
}
