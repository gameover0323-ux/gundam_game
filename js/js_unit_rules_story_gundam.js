function addRuleEvade(state, amount, context = {}) {
  const adapter = context?.twoVtwoAdapter;
  const ownerPlayer = context?.ownerPlayer;

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

  if (typeof state.storyGundamDropNtTimer !== "number") state.storyGundamDropNtTimer = 0;
  if (typeof state.storyGundamDropNtGuessSlotKey !== "string") state.storyGundamDropNtGuessSlotKey = "";
}

function pickRandomPredictSlotKey(slotKeys) {
  const keys = Array.isArray(slotKeys)
    ? slotKeys.filter(key => typeof key === "string" && /^slot\d+$/.test(key))
    : [];
  if (!keys.length) return "";
  return keys[Math.floor(Math.random() * keys.length)];
}

function shouldUsePlayerChoice(context = {}) {
  return context.ownerPlayer === "A";
}

function makePredictionChoice(state, context = {}, source = "story_gundam_nt_prediction") {
  return {
    choiceType: "slot_predict",
    source,
    ownerPlayer: context.ownerPlayer,
    enemyPlayer: context.enemyPlayer,
    ownerUnitKey: context.ownerUnitKey || null,
    title: `${state.name} ニュータイプ感性`,
    slotKeys: context.enemyPredictableSlotKeys || []
  };
}

export function getStoryGundamDerivedState(state) {
  ensureStoryGundamState(state);

  const status = [];
  if (state.ntGuessSlotKey) status.push("ニュータイプ予測中");
  if (state.storyGundamDropNtGuessSlotKey) status.push("ニュータイプ感性予測中");
  if (state.storyGundamNtSuccessCount > 0) status.push(`予測成功:${state.storyGundamNtSuccessCount}`);

  return { name: null, slots: {}, specials: {}, status };
}

export function canUseStoryGundamSpecial() {
  return { allowed: true, message: null };
}

export function executeStoryGundamSpecial() {
  return { handled: false, redraw: false, message: null };
}

export function onStoryGundamTurnEnd(state, context = {}) {
  ensureStoryGundamState(state);

  state.ntTimer += 1;
  if (state.ntTimer < 5) return { redraw: false, message: null };

  state.ntTimer = 0;

  if (shouldUsePlayerChoice(context)) {
    return {
      redraw: true,
      message: null,
      requestChoice: makePredictionChoice(state, context, "story_gundam_nt_prediction")
    };
  }

  state.ntGuessSlotKey = pickRandomPredictSlotKey(context.enemyPredictableSlotKeys);

  return {
    redraw: true,
    message: state.ntGuessSlotKey
      ? "ガンダム：ニュータイプ予測を自動設定"
      : "ガンダム：ニュータイプ予測対象なし"
  };
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
    return { redraw: true, message: `${state.name} ニュータイプ予測成功！回避+3` };
  }

  if (state.ntGuessSlotKey) {
    state.ntGuessSlotKey = "";
    return { redraw: true, message: "ガンダム：ニュータイプ予測失敗" };
  }

  return { redraw: false, message: null };
}

export function onStoryGundamResolveChoice(state, pendingChoice, selectedValue) {
  ensureStoryGundamState(state);

  if (pendingChoice?.source === "story_gundam_nt_prediction") {
    state.ntGuessSlotKey = String(selectedValue || "");
    return { handled: true, redraw: true, message: "ニュータイプ予測を設定した" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onStoryGundamBeforeSlot(state) {
  ensureStoryGundamState(state);
  return { redraw: false, message: null };
}

export function onStoryGundamAfterSlotResolved(state) {
  ensureStoryGundamState(state);
  return { redraw: false, message: null };
}

export function onStoryGundamActionResolved(attacker) {
  ensureStoryGundamState(attacker);
  return { redraw: false, message: null };
}

export function onStoryGundamDamaged(defender) {
  ensureStoryGundamState(defender);
  return { redraw: false, message: null };
}

export function modifyStoryGundamTakenDamage(defender, attacker, attack, damage) {
  ensureStoryGundamState(defender);
  return { damage, message: null };
}

export function modifyStoryGundamEvadeAttempt(defender) {
  ensureStoryGundamState(defender);
  return { handled: false };
}

/* ドロップ品：ニュータイプ感性 */

export function getStoryGundamDropDerivedStatus(state, option) {
  ensureStoryGundamState(state);
  const result = [];

  result.push({
    text: `${option?.label || "ニュータイプ感性"}:${state.storyGundamDropNtTimer}/5`,
    color: "#99ccff",
    bold: true
  });

  if (state.storyGundamDropNtGuessSlotKey) {
    result.push({
      text: `${option?.label || "ニュータイプ感性"}予測中`,
      color: "#66ffcc",
      bold: true
    });
  }

  return result;
}

export function canUseStoryGundamDropSpecial() {
  return { allowed: false, message: "ニュータイプ感性は5ターンごとに自動発動します" };
}

export function executeStoryGundamDropSpecial() {
  return { handled: true, redraw: false, message: "ニュータイプ感性は自動発動です" };
}

export function onStoryGundamDropTurnEnd(state, option, context = {}) {
  ensureStoryGundamState(state);

  state.storyGundamDropNtTimer += 1;
  if (state.storyGundamDropNtTimer < 5) return { redraw: true, message: null };

  state.storyGundamDropNtTimer = 0;

  if (shouldUsePlayerChoice(context)) {
    return {
      redraw: true,
      message: null,
      requestChoice: makePredictionChoice(state, context, "story_gundam_drop_nt_prediction")
    };
  }

  state.storyGundamDropNtGuessSlotKey = pickRandomPredictSlotKey(context.enemyPredictableSlotKeys);

  return {
    redraw: true,
    message: state.storyGundamDropNtGuessSlotKey
      ? "ニュータイプ感性：予測を自動設定"
      : "ニュータイプ感性：予測対象なし"
  };
}

export function onStoryGundamDropResolveChoice(state, pendingChoice, selectedValue) {
  ensureStoryGundamState(state);

  if (pendingChoice?.source !== "story_gundam_drop_nt_prediction") {
    return { handled: false, redraw: false, message: null };
  }

  state.storyGundamDropNtGuessSlotKey = String(selectedValue || "");
  return { handled: true, redraw: true, message: "ニュータイプ感性：予測を設定した" };
}

export function onStoryGundamDropEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureStoryGundamState(state);

  if (
    state.storyGundamDropNtGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.storyGundamDropNtGuessSlotKey === context.enemyRolledSlotKey
  ) {
    addRuleEvade(state, 3, context);
    state.storyGundamDropNtGuessSlotKey = "";
    return { redraw: true, message: `${state.name} ニュータイプ感性成功！回避+3` };
  }

  if (state.storyGundamDropNtGuessSlotKey) {
    state.storyGundamDropNtGuessSlotKey = "";
    return { redraw: true, message: "ニュータイプ感性：予測失敗" };
  }

  return { redraw: false, message: null };
}
