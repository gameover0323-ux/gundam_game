function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function addRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, amount);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + amount;
  return amount;
}

function ensureStoryGundamState(state) {
  if (!state) return;
  if (typeof state.ntTimer !== "number") state.ntTimer = 0;
  if (typeof state.ntGuessSlotKey !== "string") state.ntGuessSlotKey = "";
  if (typeof state.storyGundamNtSuccessCount !== "number") state.storyGundamNtSuccessCount = 0;
}

function pickRandomPredictSlotKey(slotKeys) {
  const keys = Array.isArray(slotKeys)
    ? slotKeys.filter(key => typeof key === "string" && /^slot\d+$/.test(key))
    : [];

  if (keys.length <= 0) return "";
  return keys[Math.floor(Math.random() * keys.length)];
}

export function getStoryGundamDerivedState(state) {
  ensureStoryGundamState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.ntGuessSlotKey) {
    result.status.push("ニュータイプ予測中");
  }

  if (state.storyGundamNtSuccessCount > 0) {
    result.status.push(`予測成功:${state.storyGundamNtSuccessCount}`);
  }

  return result;
}

export function canUseStoryGundamSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryGundamSpecial(state, specialKey, context = {}) {
  return { handled: false, message: null };
}

export function onStoryGundamTurnEnd(state, context = {}) {
  ensureStoryGundamState(state);

  state.ntTimer += 1;

  if (state.ntTimer < 5) {
    return { redraw: false, message: null };
  }

  state.ntTimer = 0;

  const predictSlotKey = pickRandomPredictSlotKey(context.enemyPredictableSlotKeys);

  if (!predictSlotKey) {
    state.ntGuessSlotKey = "";
    return {
      redraw: true,
      message: "ガンダム：ニュータイプ予測対象なし"
    };
  }

  state.ntGuessSlotKey = predictSlotKey;

  return {
    redraw: true,
    message: "ガンダム：ニュータイプ予測を自動設定"
  };
}

export function onStoryGundamBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureStoryGundamState(state);
  return { redraw: false, message: null };
}

export function onStoryGundamEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureStoryGundamState(state);

  if (
    state.ntGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.ntGuessSlotKey === context.enemyRolledSlotKey
  ) {
    addRuleEvade(state, 3, context);
    state.ntGuessSlotKey = "";
    state.storyGundamNtSuccessCount += 1;

    return {
      redraw: true,
      message: `${state.name} ニュータイプ予測成功！回避+3`
    };
  }

  state.ntGuessSlotKey = "";
  return { redraw: false, message: null };
}

export function onStoryGundamAfterSlotResolved(state, slotNumber, context = {}) {
  ensureStoryGundamState(state);
  return { redraw: false, message: null };
}

export function onStoryGundamActionResolved(attacker, defender, context = {}) {
  ensureStoryGundamState(attacker);
  return { redraw: false, message: null };
}

export function onStoryGundamDamaged(defender, attacker, context = {}) {
  ensureStoryGundamState(defender);
  return { redraw: false, message: null };
}

export function modifyStoryGundamTakenDamage(defender, attacker, attack, damage) {
  ensureStoryGundamState(defender);
  return { damage, message: null };
}

export function modifyStoryGundamEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureStoryGundamState(defender);
  return null;
}

export function onStoryGundamResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureStoryGundamState(state);

  if (pendingChoice?.source === "story_gundam_nt_prediction") {
    state.ntGuessSlotKey = String(selectedValue || "");
    return { handled: true, redraw: true, message: "予測を設定した" };
  }

  return { handled: false, redraw: false, message: null };
}
