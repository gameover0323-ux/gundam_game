
import { addEvade } from "./js_unit_runtime.js";

function ensureStoryGundamState(state) {
  if (!state) return;
  if (typeof state.storyGundamNtCooldown !== "number") state.storyGundamNtCooldown = 0;
  if (typeof state.storyGundamNtPredictSuccessCount !== "number") {
    state.storyGundamNtPredictSuccessCount = 0;
  }
}

export function getStoryGundamDerivedState(state) {
  ensureStoryGundamState(state);
  return null;
}

export function canUseStoryGundamSpecial(state, special, context = {}) {
  return true;
}

export function executeStoryGundamSpecial(state, special, context = {}) {
  return {
    handled: false
  };
}

export function onStoryGundamTurnEnd(state, context = {}) {
  ensureStoryGundamState(state);

  if (state.storyGundamNtCooldown > 0) {
    state.storyGundamNtCooldown -= 1;
  }

  return {
    redraw: true
  };
}

export function onStoryGundamBeforeSlot(state, slot, context = {}) {
  return null;
}

export function onStoryGundamEnemyBeforeSlot(state, enemySlot, context = {}) {
  ensureStoryGundamState(state);

  if (state.storyGundamNtCooldown > 0) return null;
  if (!enemySlot) return null;

  const predicted = true;

  if (!predicted) {
    state.storyGundamNtCooldown = 5;
    return {
      redraw: true
    };
  }

  addEvade(state, 3);
  state.storyGundamNtCooldown = 5;
  state.storyGundamNtPredictSuccessCount += 1;

  return {
    redraw: true,
    message: "ガンダムのニュータイプ感性が発動！ 相手のスロット行動を予測し、回避+3。"
  };
}

export function onStoryGundamAfterSlotResolved(state, slot, context = {}) {
  return null;
}

export function onStoryGundamActionResolved(state, context = {}) {
  return null;
}

export function onStoryGundamDamaged(state, context = {}) {
  return null;
}

export function modifyStoryGundamTakenDamage(state, damage, attack, context = {}) {
  return damage;
}

export function modifyStoryGundamEvadeAttempt(state, attack, context = {}) {
  return null;
}

export function onStoryGundamResolveChoice(state, choice, context = {}) {
  return null;
}
