export function getStoryZakuIiGeneDerivedState(state) {
  return {
    name: null,
    slots: {},
    specials: {},
    status: []
  };
}

export function canUseStoryZakuIiGeneSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryZakuIiGeneSpecial(state, specialKey, context = {}) {
  return {
    handled: false,
    message: null
  };
}

export function onStoryZakuIiGeneTurnEnd(state, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiGeneBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiGeneEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiGeneAfterSlotResolved(state, slotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiGeneActionResolved(attacker, defender, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiGeneDamaged(defender, attacker, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyStoryZakuIiGeneTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function modifyStoryZakuIiGeneEvadeAttempt(defender, attacker, attack, context = {}) {
  return null;
}

export function onStoryZakuIiGeneResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  return {
    handled: false,
    redraw: false,
    message: null
  };
}
