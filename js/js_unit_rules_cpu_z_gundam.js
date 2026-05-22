import { setForm } from "./js_unit_runtime.js";

import {
  getZGundamDerivedState,
  executeZGundamSpecial,
  onZGundamTurnEnd,
  onZGundamBeforeSlot,
  onZGundamEnemyBeforeSlot,
  onZGundamAfterSlotResolved,
  onZGundamActionResolved,
  onZGundamDamaged,
  modifyZGundamTakenDamage
} from "./js_unit_rules_z_gundam.js";

function ensureCpuZState(state) {
  if (typeof state.cpuZTransformCheckThisTurn !== "boolean") {
    state.cpuZTransformCheckThisTurn = false;
  }
}

function cpuZRandomTransform(state) {
  ensureCpuZState(state);

  if (state.formId === "bio") {
    return null;
  }

  if (state.cpuZTransformCheckThisTurn) {
    return null;
  }

  state.cpuZTransformCheckThisTurn = true;

  if (Math.floor(Math.random() * 10) !== 0) {
    return null;
  }

  if (state.formId === "ms") {
    const changed = setForm(state, "wr", {
      preserveHp: true,
      preserveEvade: true
    });

    return changed ? "CPU Z特性：ウェイブライダーへ変形" : null;
  }

  if (state.formId === "wr") {
    const changed = setForm(state, "ms", {
      preserveHp: true,
      preserveEvade: true
    });

    return changed ? "CPU Z特性：Zガンダムへ変形" : null;
  }

  return null;
}

export function getCpuZGundamDerivedState(state) {
  ensureCpuZState(state);

  const derived = getZGundamDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：10分の1で変形"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_z_traits",
        timing: "auto",
        actionType: "auto",
        desc: "10分の1で変形する。バイオセンサー中は被ダメージを軽減し、攻撃を完全回避された時に相手の回避を0にする。"
      }
    }
  };
}

export function executeCpuZGundamSpecial(state, specialKey, context = {}) {
  return executeZGundamSpecial(state, specialKey, context);
}

export function onCpuZGundamBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuZState(state);
  return onZGundamBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuZGundamEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuZState(state);
  return onZGundamEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuZGundamAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuZState(state);
  return onZGundamAfterSlotResolved(state, slotNumber, context);
}

export function onCpuZGundamActionResolved(attacker, defender, context = {}) {
  ensureCpuZState(attacker);
  return onZGundamActionResolved(attacker, defender, context);
}

export function onCpuZGundamDamaged(defender, attacker, context = {}) {
  ensureCpuZState(defender);
  return onZGundamDamaged(defender, attacker, context);
}

export function onCpuZGundamTurnEnd(state, context = {}) {
  ensureCpuZState(state);

  state.cpuZTransformCheckThisTurn = false;

  const baseResult = onZGundamTurnEnd(state, context) || {
    redraw: false,
    message: null
  };

  const messages = [];

  if (baseResult.message) {
    messages.push(baseResult.message);
  }

  const transformMessage = cpuZRandomTransform(state);

  if (transformMessage) {
    messages.push(transformMessage);
  }

  return {
    ...baseResult,
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function modifyCpuZGundamTakenDamage(defender, attacker, attack, damage) {
  ensureCpuZState(defender);
  return modifyZGundamTakenDamage(defender, attacker, attack, damage);
}

export function modifyCpuZGundamEvadeAttempt(state, attacker, attack, context = {}) {
  return {
    handled: false
  };
}
