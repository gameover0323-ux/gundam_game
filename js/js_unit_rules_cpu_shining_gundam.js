import { resolveSlotEffect } from "./js_slot_effects.js";

import {
  getShiningDerivedState,
  executeShiningSpecial,
  onShiningTurnEnd,
  onShiningBeforeSlot,
  onShiningEnemyBeforeSlot,
  onShiningAfterSlotResolved,
  onShiningActionResolved,
  onShiningDamaged,
  modifyShiningTakenDamage,
  onShiningResolveChoice
} from "./js_unit_rules_shining_gundam.js";

function ensureCpuShiningState(state) {
  if (typeof state.cpuShiningExtraActionsThisSlot !== "number") {
    state.cpuShiningExtraActionsThisSlot = 0;
  }
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

function getEnemyRuleEvade(context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = context.enemyPlayer || null;
  const enemyState = context.enemyState || null;

  if (adapter?.getEvade && enemyPlayer) {
    return adapter.getEvade(enemyPlayer, enemyState);
  }

  return Math.max(0, Number(enemyState?.evade || 0));
}

function getSlotNumber(slotKey) {
  return Number(String(slotKey).replace(/^slot/, ""));
}

function getRandomSlotKey(state) {
  const keys = state.rollableSlotOrder || Object.keys(state.slots || {});
  if (!keys.length) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

function buildAttackMessage(slotNumber, slot, attacks) {
  if (!attacks || attacks.length === 0) return null;
  return `シャイニング追加行動：${slotNumber}.${slot.label}`;
}

function resolveAdditionalSlot(state, slotKey, context = {}) {
  const slot = state.slots?.[slotKey];
  const messages = [];
  const appendAttacks = [];

  if (!slot) {
    return { appendAttacks, appendMessages: messages };
  }

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

  if (result.kind === "attack") {
    appendAttacks.push(...result.attacks);
    const attackMessage = buildAttackMessage(slotNumber, slot, result.attacks);
    if (attackMessage) messages.push(attackMessage);
    return { appendAttacks, appendMessages: messages };
  }

  if (result.kind === "evade" || result.kind === "heal") {
    messages.push(`シャイニング追加行動：${slotNumber}.${slot.label}`);
    if (result.message) messages.push(result.message);
    return { appendAttacks, appendMessages: messages };
  }

  if (result.kind === "custom") {
    messages.push(`シャイニング追加行動：${slotNumber}.${slot.label}`);
    return { appendAttacks, appendMessages: messages };
  }

  messages.push(`シャイニング追加行動：${slotNumber}.${slot.label}`);
  return { appendAttacks, appendMessages: messages };
}

function addExtraActionResult(total, next) {
  if (!next) return;

  if (Array.isArray(next.appendAttacks)) {
    total.appendAttacks.push(...next.appendAttacks);
  }

  if (Array.isArray(next.appendMessages)) {
    total.appendMessages.push(...next.appendMessages);
  }
}

function tryForceSlot6(state, total, reasonText, context = {}) {
  const next = resolveAdditionalSlot(state, "slot6", context);
  total.appendMessages.push(reasonText);
  addExtraActionResult(total, next);
}

function tryRandomAdditionalSlot(state, total, reasonText, context = {}) {
  const slotKey = getRandomSlotKey(state);
  if (!slotKey) return;

  const next = resolveAdditionalSlot(state, slotKey, context);
  total.appendMessages.push(reasonText);
  addExtraActionResult(total, next);
}

export function getCpuShiningDerivedState(state) {
  ensureCpuShiningState(state);

  const derived = getShiningDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：回避消費で追加行動"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_shining_traits",
        timing: "auto",
        actionType: "auto",
        desc: "回避を消費して追加行動する。HP条件で明鏡止水スーパーモードを狙う。"
      }
    }
  };
}

export function executeCpuShiningSpecial(state, specialKey, context = {}) {
  return executeShiningSpecial(state, specialKey, context);
}

export function onCpuShiningBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuShiningState(state);
  state.cpuShiningExtraActionsThisSlot = 0;

  return onShiningBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuShiningEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuShiningState(state);
  return onShiningEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuShiningAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuShiningState(state);
  return onShiningAfterSlotResolved(state, slotNumber, context);
}

export function getCpuShiningExtraWeaponResult(state, context = {}) {
  ensureCpuShiningState(state);

  const total = {
    appendAttacks: [],
    appendMessages: [],
    redraw: true
  };

  while (state.cpuShiningExtraActionsThisSlot < 2) {
    let triggered = false;

    if (state.formId === "base" || state.formId === "meikyo") {
      if (getRuleEvade(state, context) >= 3 && Math.random() < 0.5) {
        if (Math.random() < 0.5) {
          consumeRuleEvade(state, 3, context);
          state.cpuShiningExtraActionsThisSlot += 1;
          tryForceSlot6(
            state,
            total,
            "シャイニング特性：回避3消費、スロット6を強制発動",
            context
          );
        } else {
          consumeRuleEvade(state, 1, context);
          state.cpuShiningExtraActionsThisSlot += 1;
          tryRandomAdditionalSlot(
            state,
            total,
            "シャイニング特性：回避1消費、追加スロット行動",
            context
          );
        }

        triggered = true;
      }
    }

    if (!triggered && state.formId === "super") {
      const enemyEvade = getEnemyRuleEvade(context);

      if (enemyEvade <= 0 && getRuleEvade(state, context) >= 3 && Math.random() < 0.5) {
        consumeRuleEvade(state, 3, context);
        state.cpuShiningExtraActionsThisSlot += 1;
        tryForceSlot6(
          state,
          total,
          "シャイニングS特性：相手回避0、回避3消費、スロット6を強制発動",
          context
        );
        triggered = true;
      }
    }

    if (!triggered && getRuleEvade(state, context) >= 1 && Math.random() < 0.5) {
      consumeRuleEvade(state, 1, context);
      state.cpuShiningExtraActionsThisSlot += 1;
      tryRandomAdditionalSlot(
        state,
        total,
        "シャイニング特性：回避1消費、追加スロット行動",
        context
      );
      triggered = true;
    }

    if (!triggered) break;
  }

  if (total.appendAttacks.length === 0 && total.appendMessages.length === 0) {
    return null;
  }

  return total;
}

export function onCpuShiningActionResolved(attacker, defender, context = {}) {
  ensureCpuShiningState(attacker);
  return onShiningActionResolved(attacker, defender, context);
}

export function onCpuShiningDamaged(defender, attacker, context = {}) {
  ensureCpuShiningState(defender);
  return onShiningDamaged(defender, attacker, context);
}

export function onCpuShiningTurnEnd(state, context = {}) {
  ensureCpuShiningState(state);
  state.cpuShiningExtraActionsThisSlot = 0;
  return onShiningTurnEnd(state, context);
}

export function modifyCpuShiningTakenDamage(defender, attacker, attack, damage) {
  ensureCpuShiningState(defender);
  return modifyShiningTakenDamage(defender, attacker, attack, damage);
}

export function modifyCpuShiningEvadeAttempt(defender, attacker, attack, context = {}) {
  return {
    handled: false
  };
}

export function onCpuShiningResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuShiningState(state);
  return onShiningResolveChoice(state, pendingChoice, selectedValue, context);
}
