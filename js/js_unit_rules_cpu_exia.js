import {
  getExiaDerivedState,
  onExiaBeforeSlot,
  onExiaAfterSlotResolved,
  onExiaActionResolved,
  onExiaDamaged,
  onExiaTurnEnd,
  modifyExiaTakenDamage,
  modifyExiaEvadeAttempt,
  onExiaResolveChoice
} from "./js_unit_rules_exia.js";

import {
  setForm,
  reduceEvade,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

function chance(rate) {
  return Math.random() < rate;
}

function ensureCpuExiaState(state) {
  if (!state) return;

  if (typeof state.cpuExiaShieldHalfCount !== "number") state.cpuExiaShieldHalfCount = 3;
  if (typeof state.cpuExiaRepairShieldHalfCount !== "number") state.cpuExiaRepairShieldHalfCount = 3;
  if (typeof state.cpuExiaShieldActive !== "boolean") state.cpuExiaShieldActive = false;
  if (typeof state.cpuExiaUsedIamGundamThisTurn !== "boolean") state.cpuExiaUsedIamGundamThisTurn = false;

  if (typeof state.exiaSkipNextTurn !== "boolean") state.exiaSkipNextTurn = false;
  if (typeof state.exiaAvalancheLost !== "boolean") state.exiaAvalancheLost = false;
  if (typeof state.exiaAvalancheEscapeUsed !== "boolean") state.exiaAvalancheEscapeUsed = false;
  if (typeof state.exiaRepairGutsUsed !== "boolean") state.exiaRepairGutsUsed = false;
  if (typeof state.exiaTransAmCostPaidThisTurn !== "boolean") state.exiaTransAmCostPaidThisTurn = false;
  if (typeof state.exiaTransAmExtraActionsThisTurn !== "number") state.exiaTransAmExtraActionsThisTurn = 0;
  if (typeof state.exiaTurnDamageDealt !== "number") state.exiaTurnDamageDealt = 0;
}

function addLog(messages, text) {
  if (text) messages.push(text);
}

function getActionCount(state) {
  return Math.max(0, Number(state?.actionCount || 0));
}

function consumeAction(state, amount = 1) {
  if (!state || getActionCount(state) < amount) return false;
  state.actionCount = Math.max(0, getActionCount(state) - amount);
  return true;
}

function getEvade(state) {
  return Math.max(0, Number(state?.evade || 0));
}

function heal(state, amount) {
  if (!state || amount <= 0) return;
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + amount);
}

function changeForm(state, formId, options = {}) {
  const ok = setForm(state, formId, { preserveHp: true, preserveEvade: true, ...options });
  if (ok) normalizeEvadeCapState(state);
  return ok;
}

function repairTransform(state) {
  changeForm(state, "repair", { preserveHp: false, preserveEvade: true });
  state.hp = 100;
  state.maxHp = 100;
  state.evadeMax = 3;
  state.cpuExiaRepairShieldHalfCount = 3;
  state.cpuExiaShieldActive = false;
  state.exiaRepairGutsUsed = false;
  normalizeEvadeCapState(state);
}

function buildSevenSwordSlot(count) {
  return {
    key: "slot7",
    label: `セブンソードコンビネーション 30ダメージ×${count}回`,
    desc: `30ダメージ×${count}回。格闘`,
    effect: {
      type: "attack",
      attackType: "melee",
      damage: 30,
      count
    }
  };
}

function cpuBaseSevenSword(state, messages) {
  if (state.formId !== "base") return null;
  if (getEvade(state) < 7) return null;
  if (!chance(0.5)) return null;

  const count = Math.floor(Math.random() * 7) + 1;
  reduceEvade(state, count);
  state.exiaSkipNextTurn = true;

  addLog(messages, `CPUエクシア：セブンソードコンビネーション 回避${count}消費`);

  return {
    slotKey: "slot7",
    slotData: buildSevenSwordSlot(count)
  };
}

function cpuBaseTransform(state, messages) {
  if (state.formId !== "base") return;

  if (chance(0.1)) {
    changeForm(state, "trans_am", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUエクシア：TRANS-AM発動");
    return;
  }

  if (!state.exiaAvalancheLost && getActionCount(state) >= 1 && chance(0.3)) {
    consumeAction(state, 1);
    changeForm(state, "avalanche", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUエクシア：アヴァランチエクシアへ換装");
  }
}

function cpuTransAmExtraActions(state, messages) {
  if (state.formId !== "trans_am") return;

  while (
    state.exiaTransAmExtraActionsThisTurn < 3 &&
    Number(state.hp || 0) > 25 &&
    chance(0.3)
  ) {
    state.hp -= 25;
    state.exiaTransAmExtraActionsThisTurn += 1;
    state.actionCount = getActionCount(state) + 1;
    addLog(messages, "CPU TRANS-AM：HP25消費 行動権+1");
  }
}

function cpuTransAmIamGundam(state, messages) {
  if (state.formId !== "trans_am") return;
  if (state.cpuExiaUsedIamGundamThisTurn) return;
  if (Number(state.hp || 0) <= 100) return;
  if (!chance(0.1)) return;

  state.cpuExiaUsedIamGundamThisTurn = true;
  state.hp -= 100;

  const healAmount = Math.floor(Number(state.exiaTurnDamageDealt || 0) / 2);
  heal(state, healAmount);

  addLog(messages, `CPUエクシア：俺がガンダムだ！ HP${healAmount}回復`);
}

function cpuTransAmReleaseIfLowHp(state, messages) {
  if (state.formId !== "trans_am") return;
  if (Number(state.hp || 0) >= 100) return;
  if (!chance(0.5)) return;

  changeForm(state, "base", { preserveHp: true, preserveEvade: true });
  state.exiaSkipNextTurn = true;
  addLog(messages, "CPUエクシア：TRANS-AM解除。次ターン行動不能");
}

function cpuAvalancheRelease(state, messages) {
  if (state.formId !== "avalanche") return;

  if (getActionCount(state) >= 1 && chance(0.2)) {
    consumeAction(state, 1);
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUアヴァランチエクシア：解除");
    return;
  }

  if (chance(0.1)) {
    changeForm(state, "avalanche_trans_am", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUアヴァランチエクシア：TRANS-AM発動");
  }
}

function cpuAvalancheTransAmExtraActions(state, messages) {
  if (state.formId !== "avalanche_trans_am") return;

  while (
    state.exiaTransAmExtraActionsThisTurn < 3 &&
    getEvade(state) >= 3 &&
    chance(0.3)
  ) {
    reduceEvade(state, 3);
    state.exiaTransAmExtraActionsThisTurn += 1;
    state.actionCount = getActionCount(state) + 1;
    addLog(messages, "CPUアヴァランチTRANS-AM：回避3消費 行動権+1");
  }
}

function activateCpuShield(state, messages) {
  if (state.cpuExiaShieldActive) return;
  if (!chance(0.2)) return;

  if (state.formId === "repair") {
    if (state.cpuExiaRepairShieldHalfCount <= 0) return;
    state.cpuExiaRepairShieldHalfCount -= 1;
    state.cpuExiaShieldActive = true;
    addLog(messages, "CPUエクシアリペア：ダメージ半減");
    return;
  }

  if (state.cpuExiaShieldHalfCount <= 0) return;
  state.cpuExiaShieldHalfCount -= 1;
  state.cpuExiaShieldActive = true;
  addLog(messages, "CPUエクシア：ダメージ半減");
}

function payTransAmTurnCost(state, messages) {
  if (state.exiaTransAmCostPaidThisTurn) return false;
  if (state.formId !== "trans_am" && state.formId !== "avalanche_trans_am") return false;

  state.exiaTransAmCostPaidThisTurn = true;
  state.hp = Number(state.hp || 0) - 50;

  if (state.hp > 0) {
    addLog(messages, "CPUエクシア：TRANS-AM自壊 HP-50");
    return false;
  }

  state.hp = 1;

  if (state.formId === "trans_am") {
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUエクシア：自壊寸前で通常エクシアへ戻る。次ターン行動不能");
  } else {
    changeForm(state, "avalanche", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUアヴァランチTRANS-AM：自壊寸前でアヴァランチへ戻る。次ターン行動不能");
  }

  state.exiaSkipNextTurn = true;
  return true;
}

export function getCpuExiaDerivedState(state) {
  ensureCpuExiaState(state);
  const derived = getExiaDerivedState(state) || {};

  const cpuStatus = [];
  if (state.formId === "base") {
    cpuStatus.push("CPU特性：セブンソード・TRANS-AM・アヴァランチ換装");
  } else if (state.formId === "trans_am") {
    cpuStatus.push("CPU特性：TRANS-AM連続行動・低HP時解除");
  } else if (state.formId === "avalanche") {
    cpuStatus.push("CPU特性：離脱解除・TRANS-AM移行・超加速回避");
  } else if (state.formId === "avalanche_trans_am") {
    cpuStatus.push("CPU特性：回避消費連続行動・必中通常回避");
  } else if (state.formId === "repair") {
    cpuStatus.push("CPU特性：HP1耐久・リペア専用シールド");
  }

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      ...cpuStatus
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_exia_traits",
        timing: "auto",
        actionType: "auto",
        desc: cpuStatus.join(" / ") || "CPU特性"
      }
    }
  };
}

export function onCpuExiaBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuExiaState(state);

  const messages = [];

  if (state.exiaSkipNextTurn) {
    state.exiaSkipNextTurn = false;
    return {
      redraw: true,
      cancelSlot: true,
      message: "CPUエクシアは行動不能"
    };
  }

  state.exiaTurnDamageDealt = 0;
  state.cpuExiaUsedIamGundamThisTurn = false;

  const selfDestroyed = payTransAmTurnCost(state, messages);
  if (selfDestroyed) {
    return {
      redraw: true,
      cancelSlot: true,
      message: messages.join(" / ")
    };
  }

  let replaceSlotAction = null;

  if (state.formId === "base") {
    replaceSlotAction = cpuBaseSevenSword(state, messages);
    if (!replaceSlotAction) {
      cpuBaseTransform(state, messages);
    }
  }

  if (state.formId === "trans_am") {
    cpuTransAmExtraActions(state, messages);
    cpuTransAmReleaseIfLowHp(state, messages);
  }

  if (state.formId === "avalanche") {
    cpuAvalancheRelease(state, messages);
  }

  if (state.formId === "avalanche_trans_am") {
    cpuAvalancheTransAmExtraActions(state, messages);
  }

  return {
    redraw: messages.length > 0,
    message: messages.join(" / ") || null,
    replaceSlotAction,
    cancelSlot: false
  };
}

export function onCpuExiaEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuExiaState(state);
  return { redraw: false, message: null };
}

export function onCpuExiaAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuExiaState(state);
  return onExiaAfterSlotResolved(state, slotNumber, context);
}

export function onCpuExiaActionResolved(attacker, defender, context = {}) {
  ensureCpuExiaState(attacker);

  const baseResult = onExiaActionResolved(attacker, defender, context) || {};
  const messages = [];
  addLog(messages, baseResult.message);

  if (attacker.formId === "trans_am") {
    cpuTransAmIamGundam(attacker, messages);
  }

  return {
    ...baseResult,
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function onCpuExiaDamaged(defender, attacker, context = {}) {
  ensureCpuExiaState(defender);

  if (defender.formId === "base" && Number(defender.hp || 0) <= 0) {
    repairTransform(defender);
    return { redraw: true, message: "CPUエクシア：エクシアリペアへ換装" };
  }

  if (defender.formId === "repair" && Number(defender.hp || 0) <= 0 && !defender.exiaRepairGutsUsed) {
    defender.exiaRepairGutsUsed = true;
    defender.hp = 1;
    return { redraw: true, message: "CPUエクシアリペア：HP1で耐えた" };
  }

  return onExiaDamaged(defender, attacker, context);
}

export function onCpuExiaTurnEnd(state, context = {}) {
  ensureCpuExiaState(state);

  state.exiaTransAmCostPaidThisTurn = false;
  state.exiaTransAmExtraActionsThisTurn = 0;
  state.exiaTurnDamageDealt = 0;
  state.cpuExiaUsedIamGundamThisTurn = false;

  return onExiaTurnEnd(state, context);
}

export function modifyCpuExiaTakenDamage(defender, attacker, attack, damage) {
  ensureCpuExiaState(defender);

  const messages = [];

  if (
    defender.formId === "avalanche" &&
    !defender.exiaAvalancheEscapeUsed &&
    Number(defender.hp || 0) - Number(damage || 0) <= 0
  ) {
    defender.exiaAvalancheEscapeUsed = true;
    defender.exiaAvalancheLost = true;
    changeForm(defender, "base", { preserveHp: true, preserveEvade: true });
    addLog(messages, "CPUアヴァランチエクシア：離脱解除 ダメージ無効・アヴァランチ使用権放棄");
    return {
      damage: 0,
      cancelled: true,
      message: messages.join(" / ")
    };
  }

  activateCpuShield(defender, messages);

  if (defender.cpuExiaShieldActive) {
    defender.cpuExiaShieldActive = false;
    damage = Math.ceil(Number(damage || 0) / 2);
  }

  const baseResult = modifyExiaTakenDamage(defender, attacker, attack, damage) || { damage, message: null };
  addLog(messages, baseResult.message);

  return {
    ...baseResult,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function modifyCpuExiaEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuExiaState(defender);

  if (!attack?.cannotEvade) {
    return modifyExiaEvadeAttempt(defender, attacker, attack, context);
  }

  if (defender.formId === "avalanche" && Number(defender.evade || 0) > Number(defender.evadeMax || 0)) {
    return { handled: false };
  }

  if (defender.formId === "avalanche_trans_am" && Number(defender.evade || 0) > 0) {
    return { handled: false };
  }

  return modifyExiaEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuExiaResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuExiaState(state);
  return onExiaResolveChoice(state, pendingChoice, selectedValue, context);
}
