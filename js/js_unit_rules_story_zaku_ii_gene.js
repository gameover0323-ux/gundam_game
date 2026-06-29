
export function getStoryZakuIiGeneDerivedState(state) {
  return null;
}

export function canUseStoryZakuIiGeneSpecial(state, special, context = {}) {
  return true;
}

export function executeStoryZakuIiGeneSpecial(state, special, context = {}) {
  return {
    handled: false
  };
}

export function onStoryZakuIiGeneTurnEnd(state, context = {}) {
  return null;
}

export function onStoryZakuIiGeneBeforeSlot(state, slot, context = {}) {
  if (slot?.effect?.effectId !== "story_think") return null;

  return {
    handled: true,
    attacks: [],
    message: "ザクII(ジーン機)は思考している……。"
  };
}

export function onStoryZakuIiGeneEnemyBeforeSlot(state, slot, context = {}) {
  return null;
}

export function onStoryZakuIiGeneAfterSlotResolved(state, slot, context = {}) {
  return null;
}

export function onStoryZakuIiGeneActionResolved(state, context = {}) {
  return null;
}

export function onStoryZakuIiGeneDamaged(state, context = {}) {
  return null;
}

export function modifyStoryZakuIiGeneTakenDamage(state, damage, attack, context = {}) {
  return damage;
}

export function modifyStoryZakuIiGeneEvadeAttempt(state, attack, context = {}) {
  return null;
}

export function onStoryZakuIiGeneResolveChoice(state, choice, context = {}) {
  return null;
}
