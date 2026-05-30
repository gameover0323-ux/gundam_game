import { resolveSlotEffect } from "./js_slot_effects.js";
import {
  getFreedomDerivedState,
  executeFreedomSpecial,
  onFreedomTurnEnd,
  onFreedomBeforeSlot,
  onFreedomEnemyBeforeSlot,
  onFreedomAfterSlotResolved,
  onFreedomActionResolved,
  onFreedomDamaged,
  modifyFreedomTakenDamage,
  modifyFreedomEvadeAttempt,
  onFreedomResolveChoice
} from "./js_unit_rules_freedom_gundam.js";

function ensureCpuFreedomState(state) {
  if (!state) return;
  if (typeof state.cpuFreedomDamageHalfActive !== "boolean") state.cpuFreedomDamageHalfActive = false;
  if (typeof state.cpuFreedomExtraActionsThisSlot !== "number") state.cpuFreedomExtraActionsThisSlot = 0;
  if (typeof state.cpuFreedomHalberdUsedTurn !== "number") state.cpuFreedomHalberdUsedTurn = -1;
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

function getCurrentTurn(context = {}) {
  return Number(context.turn || context.turnCount || context.currentTurn || 0);
}

function getSeedEffect(state) {
  return state?.stateEffects?.freedom_seed || null;
}

function isSeedActive(state) {
  return !!getSeedEffect(state);
}

function getSlotNumber(slotKey) {
  return Number(String(slotKey).replace(/^slot/, ""));
}

function getRandomSlotKey(state) {
  const keys = state.rollableSlotOrder || Object.keys(state.slots || {});
  if (!keys.length) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

function addExtraActionResult(total, next) {
  if (!next) return;
  if (Array.isArray(next.appendAttacks)) total.appendAttacks.push(...next.appendAttacks);
  if (Array.isArray(next.appendMessages)) total.appendMessages.push(...next.appendMessages);
}

function resolveAdditionalSlot(state, slotKey, context = {}) {
  const slot = state.slots?.[slotKey];
  const messages = [];
  const appendAttacks = [];

  if (!slot) return { appendAttacks, appendMessages: messages };

  const slotNumber = getSlotNumber(slotKey);
  const result = resolveSlotEffect({
    slot,
    actor: state,
    context: {
      ...context,
      ownerPlayer: context.ownerPlayer,
      enemyPlayer: context.enemyPlayer,
      twoVtwoAdapter: context.twoVtwoAdapter
    }
  });

  messages.push(`フリーダム追加行動：${slotNumber}.${slot.label}`);

  if (result.kind === "attack") {
    appendAttacks.push(...(result.attacks || []));
  }

  if (result.message) messages.push(result.message);

  if (result.kind === "custom") {
    onFreedomAfterSlotResolved(state, slotNumber, {
      ...context,
      resolveResult: result
    });
  }

  return { appendAttacks, appendMessages: messages };
}

function tryRandomAdditionalSlot(state, total, reasonText, context = {}) {
  const slotKey = getRandomSlotKey(state);
  if (!slotKey) return;
  total.appendMessages.push(reasonText);
  addExtraActionResult(total, resolveAdditionalSlot(state, slotKey, context));
}

function trySeedCancel(state, total) {
  const seed = getSeedEffect(state);
  if (
    isSeedActive(state) &&
    getRuleEvade(state) >= 3 &&
    seed &&
    Number(seed.turns || 0) === 2 &&
    Math.random() < 0.1
  ) {
    delete state.stateEffects?.freedom_seed;
    state.formId = "base";
    state.evade = Math.max(0, Number(state.evade || 0)) * 2;
    total.appendMessages.push("CPUフリーダム特性：覚醒キャンセル、回避数値を倍加");
    return true;
  }

  return false;
}

export function getCpuFreedomDerivedState(state, context = {}) {
  ensureCpuFreedomState(state);
  const derived = getFreedomDerivedState(state, context);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：10%で1ターンダメージ半減",
      "CPU特性：条件成立時に追加行動"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_freedom_traits",
        timing: "auto",
        actionType: "auto",
        desc: "10%で1ターンダメージ半減。条件成立時、行動回数を増やして追加スロット行動する。"
      }
    }
  };
}

export function executeCpuFreedomSpecial(state, specialKey, context = {}) {
  return executeFreedomSpecial(state, specialKey, context);
}

export function onCpuFreedomBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuFreedomState(state);
  state.cpuFreedomExtraActionsThisSlot = 0;

  if (Math.random() < 0.1) {
    state.cpuFreedomDamageHalfActive = true;
  }

  return onFreedomBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuFreedomEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuFreedomState(state);
  return onFreedomEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuFreedomAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuFreedomState(state);
  return onFreedomAfterSlotResolved(state, slotNumber, context);
}

export function getCpuFreedomExtraWeaponResult(state, context = {}) {
  ensureCpuFreedomState(state);

  const total = {
    appendAttacks: [],
    appendMessages: [],
    redraw: true
  };

  trySeedCancel(state, total);

  const turn = getCurrentTurn(context);
  const evade = getRuleEvade(state, context);
  const seed = getSeedEffect(state);

  if (
    evade >= Number(state.evadeMax || 0) &&
    state.cpuFreedomHalberdUsedTurn !== turn &&
    Math.random() < 0.2
  ) {
    state.cpuFreedomHalberdUsedTurn = turn;
    total.appendMessages.push("CPUフリーダム特性：アンビデクストラスハルバード成功、追加行動");
    tryRandomAdditionalSlot(state, total, "CPUフリーダム追加行動：ハルバード分", context);
  }

  while (getRuleEvade(state, context) >= 6 && Math.random() < 0.1) {
    consumeRuleEvade(state, 6, context);
    total.appendMessages.push("CPUフリーダム特性：バレルロール、回避6消費で追加行動");
    tryRandomAdditionalSlot(state, total, "CPUフリーダム追加行動：バレルロール分", context);
  }

  while (
    isSeedActive(state) &&
    seed &&
    Number(seed.turns || 0) >= 4 &&
    Math.random() < 0.2
  ) {
    seed.turns -= 1;
    total.appendMessages.push("CPUフリーダム特性：S.E.E.D.追撃、強化ターン1消費で追加行動");
    tryRandomAdditionalSlot(state, total, "CPUフリーダム追加行動：S.E.E.D.追撃分", context);
  }

  if (total.appendAttacks.length === 0 && total.appendMessages.length === 0) {
    return null;
  }

  return total;
}

export function onCpuFreedomActionResolved(attacker, defender, context = {}) {
  ensureCpuFreedomState(attacker);
  return onFreedomActionResolved(attacker, defender, context);
}

export function onCpuFreedomDamaged(defender, attacker, context = {}) {
  ensureCpuFreedomState(defender);
  return onFreedomDamaged(defender, attacker, context);
}

export function onCpuFreedomTurnEnd(state, context = {}) {
  ensureCpuFreedomState(state);
  state.cpuFreedomDamageHalfActive = false;
  state.cpuFreedomExtraActionsThisSlot = 0;
  return onFreedomTurnEnd(state, context);
}

export function modifyCpuFreedomTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureCpuFreedomState(defender);

  if (defender.cpuFreedomDamageHalfActive) {
    return {
      damage: Math.floor(Number(damage || 0) / 2),
      message: "CPUフリーダム特性：ダメージ半減"
    };
  }

  return modifyFreedomTakenDamage(defender, attacker, attack, damage, context);
}

export function modifyCpuFreedomEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuFreedomState(defender);

  if (isSeedActive(defender)) {
    return modifyFreedomEvadeAttempt(defender, attacker, attack, context);
  }

  return { handled: false };
}

export function onCpuFreedomResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuFreedomState(state);
  return onFreedomResolveChoice(state, pendingChoice, selectedValue, context);
}
