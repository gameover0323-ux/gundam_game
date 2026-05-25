import {
  getZudahDerivedState,
  onZudahTurnEnd,
  onZudahBeforeSlot,
  onZudahEnemyBeforeSlot,
  onZudahAfterSlotResolved,
  onZudahActionResolved,
  onZudahDamaged,
  modifyZudahTakenDamage,
  modifyZudahEvadeAttempt,
  onZudahResolveChoice
} from "./js_unit_rules_zudah.js";

function chance(rate) {
  return Math.random() < rate;
}

function ensureCpuZudahState(state) {
  if (!state) return;
  if (typeof state.cpuZudahTurnStartHandled !== "boolean") state.cpuZudahTurnStartHandled = false;
  if (typeof state.cpuZudahShieldActive !== "boolean") state.cpuZudahShieldActive = false;
}

function addLog(messages, text) {
  if (text) messages.push(text);
}

function getActionCount(state) {
  return Math.max(0, Number(state?.actionCount || 0));
}

function consumeAction(state, amount) {
  if (!state || getActionCount(state) < amount) return false;
  state.actionCount = Math.max(0, getActionCount(state) - amount);
  return true;
}

function addAction(state, amount) {
  if (!state) return;
  state.actionCount = getActionCount(state) + amount;
}

function getEvade(state) {
  return Math.max(0, Number(state?.evade || 0));
}

function consumeEvade(state, amount) {
  if (!state || getEvade(state) < amount) return false;
  state.evade = Math.max(0, getEvade(state) - amount);
  return true;
}

function addEvade(state, amount) {
  if (!state) return;
  state.evade = getEvade(state) + amount;
}

function heal(state, amount) {
  if (!state) return;
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + amount);
}

function cpuEngineCut(state, messages) {
  if (Number(state.zudahAccelStack || 0) < 2) return;
  if (!chance(0.7)) return;

  const stack = Number(state.zudahAccelStack || 0);
  const healAmount = stack * 10;

  state.zudahAccelStack = 0;
  state.baseActionCount = 1;
  state.actionCount = Math.min(getActionCount(state), 1);
  heal(state, healAmount);

  addLog(messages, `CPUヅダ：エンジンカット HP${healAmount}回復`);
}

function cpuAssaultSlotBoost(state, messages) {
  if (getEvade(state) < 10) return;
  if (!chance(0.6)) return;

  consumeEvade(state, 5);
  addAction(state, 2);

  addLog(messages, "CPUヅダ：突撃 回避-5 スロット行動+2");
}

function cpuFeintIfNeeded(state, messages) {
  if (getActionCount(state) < 2) return;
  if (getEvade(state) !== 0) return;

  consumeAction(state, 1);
  addEvade(state, 1);

  addLog(messages, "CPUヅダ：翻弄 行動権-1 回避+1");
}

export function getCpuZudahDerivedState(state) {
  ensureCpuZudahState(state);
  const derived = getZudahDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：加速管理・確率半減・追加スロット行動"
    ],
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_zudah_traits",
        timing: "auto",
        actionType: "auto",
        desc: "加速時はエンジンカットで暴走を抑える。確率で被ダメージを半減し、回避が多い時は回避を消費して追加スロット行動を行う。回避0かつ行動権2以上なら翻弄で回避を補充する。必中攻撃も回避2消費で回避可能。"
      }
    }
  };
}

export function onCpuZudahBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuZudahState(state);

  const baseResult = onZudahBeforeSlot(state, rolledSlotNumber, context) || {};
  const messages = [];
  addLog(messages, baseResult.message);

  if (!state.cpuZudahTurnStartHandled) {
    state.cpuZudahTurnStartHandled = true;
    cpuEngineCut(state, messages);
    cpuAssaultSlotBoost(state, messages);
    cpuFeintIfNeeded(state, messages);
  }

  if (baseResult.cancelSlot) {
    return {
      ...baseResult,
      redraw: baseResult.redraw || messages.length > 0,
      message: messages.join(" / ") || baseResult.message || null
    };
  }

  return {
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join(" / ") || null,
    cancelSlot: false
  };
}

export function onCpuZudahEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuZudahState(state);
  return onZudahEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuZudahAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuZudahState(state);
  return onZudahAfterSlotResolved(state, slotNumber, context);
}

export function onCpuZudahActionResolved(attacker, defender, context = {}) {
  ensureCpuZudahState(attacker);
  return onZudahActionResolved(attacker, defender, context);
}

export function onCpuZudahDamaged(defender, attacker, context = {}) {
  ensureCpuZudahState(defender);
  return onZudahDamaged(defender, attacker, context);
}

export function onCpuZudahTurnEnd(state, context = {}) {
  ensureCpuZudahState(state);
  state.cpuZudahTurnStartHandled = false;
  return onZudahTurnEnd(state, context);
}

export function modifyCpuZudahTakenDamage(defender, attacker, attack, damage) {
  ensureCpuZudahState(defender);

  const messages = [];

  if (chance(0.25)) {
    damage = Math.ceil(Number(damage || 0) / 2);
    addLog(messages, "CPUヅダ：攻撃ダメージ半減");
  }

  const baseResult = modifyZudahTakenDamage(defender, attacker, attack, damage) || { damage, message: null };
  addLog(messages, baseResult.message);

  return {
    ...baseResult,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function modifyCpuZudahEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuZudahState(defender);
  return modifyZudahEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuZudahResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuZudahState(state);
  return onZudahResolveChoice(state, pendingChoice, selectedValue, context);
}
