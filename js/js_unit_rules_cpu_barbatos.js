import {
  getBarbatosDerivedState,
  onBarbatosBeforeSlot,
  onBarbatosEnemyBeforeSlot,
  onBarbatosAfterSlotResolved,
  onBarbatosActionResolved,
  onBarbatosDamaged,
  onBarbatosTurnEnd,
  modifyBarbatosTakenDamage,
  modifyBarbatosEvadeAttempt,
  onBarbatosResolveChoice
} from "./js_unit_rules_barbatos.js";

import {
  setForm,
  addEvade,
  reduceEvade,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

function chance(rate) {
  return Math.random() < rate;
}

function ensureCpuBarbatosState(state) {
  if (!state) return;
  if (typeof state.cpuBarbatosExtraActionChecked !== "boolean") state.cpuBarbatosExtraActionChecked = false;
  if (typeof state.barbatosExtraArmorCount !== "number") state.barbatosExtraArmorCount = 3;
}

function addRedEvade(state, amount) {
  addEvade(state, amount);
  state.overEvadeMode = true;
  state.overEvadeCap = Math.max(Number(state.overEvadeCap || 0), Number(state.evade || 0));
  normalizeEvadeCapState(state);
}

function totalIncomingDamage(context = {}, fallbackDamage = 0) {
  if (typeof context.currentTotalDamage === "number") return context.currentTotalDamage;
  const list = Array.isArray(context.currentAttack) ? context.currentAttack : [];
  if (list.length === 0) return fallbackDamage;
  return list.reduce((sum, atk) => sum + Math.max(0, Number(atk?.damage || 0)), 0);
}

function tryAlayaEmergencyEvade(defender, damage, context = {}) {
  const total = totalIncomingDamage(context, damage);

  if (Number(defender.hp || 0) <= 5) return null;

  const isFatal = Number(defender.hp || 0) - total <= 0;
  const overHalf = total > Math.floor(Number(defender.hp || 0) / 2);

  if (Number(defender.evade || 0) === 0 && (isFatal || overHalf)) {
    const cost = Math.floor(Number(defender.hp || 0) / 2);
    defender.hp -= cost;
    addRedEvade(defender, 2);
    reduceEvade(defender, 1);
    return { damage: 0, cancelled: true, message: `CPU阿頼耶識軌道：HP${cost}消費して回避` };
  }

  if (isFatal) {
    while (Number(defender.hp || 0) > 5 && Number(defender.evade || 0) <= 0) {
      const cost = Math.floor(Number(defender.hp || 0) / 2);
      defender.hp -= cost;
      addRedEvade(defender, 2);
    }

    if (Number(defender.evade || 0) > 0) {
      reduceEvade(defender, 1);
      return { damage: 0, cancelled: true, message: "CPU阿頼耶識軌道：致命ダメージを強制回避" };
    }
  }

  return null;
}

function tryCpuExtraActions(state, messages) {
  while (Number(state.hp || 0) >= 250 && chance(0.5)) {
    state.hp -= 50;
    state.actionCount = Number(state.actionCount || 0) + 1;
    messages.push("CPUバルバトス：HP50消費 スロット行動+1");
  }

  if (state.formId === "decisive") {
    while (Number(state.evade || 0) >= Number(state.evadeMax || 0) && Number(state.evade || 0) >= 3 && chance(0.5)) {
      reduceEvade(state, 3);
      state.actionCount = Number(state.actionCount || 0) + 1;
      messages.push("CPU決戦バルバトス：回避3消費 スロット行動+1");
    }
  }
}

export function getCpuBarbatosDerivedState(state) {
  ensureCpuBarbatosState(state);
  const derived = getBarbatosDerivedState(state) || {};
  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：阿頼耶識回避・HP消費連続行動・ナノラミネート"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_barbatos_traits",
        timing: "auto",
        actionType: "auto",
        desc: "大ダメージや致命ダメージ時に阿頼耶識で回避。HP250以上でHP50消費の追加行動。第4形態は確率で第6形態、第6形態は条件付きで決戦形態へ移行する。"
      }
    }
  };
}

export function onCpuBarbatosBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuBarbatosState(state);
  const base = onBarbatosBeforeSlot(state, rolledSlotNumber, context) || {};
  if (base.cancelSlot) return base;

  const messages = [];
  if (base.message) messages.push(base.message);

  if (state.formId === "form4" && chance(0.05)) {
    setForm(state, "form6", { preserveHp: true, preserveEvade: true });
    state.barbatosExtraArmorCount = 3;
    messages.push("CPUバルバトス：第6形態へ換装");
  }

  if (state.formId === "form6" && Number(state.hp || 0) <= 250 && chance(0.05)) {
    state.barbatosExtraArmorCount = 0;
    setForm(state, "decisive", { preserveHp: true, preserveEvade: true });
    messages.push("CPUバルバトス：決戦形態へ移行");
  }

  tryCpuExtraActions(state, messages);

  return {
    ...base,
    redraw: base.redraw || messages.length > 0,
    message: messages.join(" / ") || base.message || null
  };
}

export function onCpuBarbatosEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuBarbatosState(state);
  return onBarbatosEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuBarbatosAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuBarbatosState(state);
  return onBarbatosAfterSlotResolved(state, slotNumber, context);
}

export function onCpuBarbatosActionResolved(attacker, defender, context = {}) {
  ensureCpuBarbatosState(attacker);
  return onBarbatosActionResolved(attacker, defender, context);
}

export function onCpuBarbatosDamaged(defender, attacker, context = {}) {
  ensureCpuBarbatosState(defender);
  return onBarbatosDamaged(defender, attacker, context);
}

export function onCpuBarbatosTurnEnd(state, context = {}) {
  ensureCpuBarbatosState(state);
  return onBarbatosTurnEnd(state, context);
}

export function modifyCpuBarbatosTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureCpuBarbatosState(defender);

  const emergency = tryAlayaEmergencyEvade(defender, damage, context);
  if (emergency) return emergency;

  return modifyBarbatosTakenDamage(defender, attacker, attack, damage, context);
}

export function modifyCpuBarbatosEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuBarbatosState(defender);
  return modifyBarbatosEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuBarbatosResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuBarbatosState(state);
  return onBarbatosResolveChoice(state, pendingChoice, selectedValue, context);
}
