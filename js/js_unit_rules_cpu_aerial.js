import {
  getAerialDerivedState,
  onAerialBeforeSlot,
  onAerialEnemyBeforeSlot,
  onAerialAfterSlotResolved,
  onAerialActionResolved,
  onAerialDamaged,
  onAerialTurnEnd,
  modifyAerialTakenDamage,
  modifyAerialEvadeAttempt,
  onAerialResolveChoice
} from "./js_unit_rules_aerial.js";

import { reduceEvade } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

function chance(rate) { return Math.random() < rate; }

function ensureCpuAerialState(state) {
  if (!state) return;
  if (typeof state.aerialCompositeShieldCount !== "number") state.aerialCompositeShieldCount = 3;
  if (typeof state.aerialDamageBucket !== "number") state.aerialDamageBucket = 0;
  if (typeof state.aerialGundbitLinkCountThisTurn !== "number") state.aerialGundbitLinkCountThisTurn = 0;
  if (typeof state.aerialScoreSixTurns !== "number") state.aerialScoreSixTurns = 0;
}

function getEvadeRatio(state) {
  const ev = Math.max(0, Number(state.evade || 0));
  const max = Math.max(1, Number(state.evadeMax || 1));
  return Math.min(1, ev / max);
}

function getCurrentActionTotalDamage(context = {}) {
  if (typeof context.currentTotalDamage === "number") return context.currentTotalDamage;
  const currentAttack = Array.isArray(context.currentAttack) ? context.currentAttack : [];
  return currentAttack.reduce((sum, attack) => sum + Math.max(0, Number(attack?.damage || 0)), 0);
}

export function getCpuAerialDerivedState(state) {
  ensureCpuAerialState(state);
  const derived = getAerialDerivedState(state) || {};
  return {
    ...derived,
    status: [...(derived.status || []), "CPU特性：高回避・自動無効・ガンビット連携"],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_aerial_traits",
        timing: "auto",
        actionType: "auto",
        desc: "回避0で確率無効、回避1以上なら100以上の総合ダメージを最大3回無効化。100ダメージごとに回避倍加。回避割合に応じてガンビットを最大3回追加し、スコアシックス中は赤上限時に強化ターンを延長する。"
      }
    }
  };
}

export function onCpuAerialBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuAerialState(state);
  const result = onAerialBeforeSlot(state, rolledSlotNumber, context) || {};
  const messages = [];
  if (result.message) messages.push(result.message);

  if (state.formId === "score_six" && Number(state.evade || 0) > Number(state.evadeMax || 0) && Number(state.evade || 0) >= 3) {
    reduceEvade(state, 3);
    state.aerialScoreSixTurns += 1;
    messages.push("CPUエアリアル：データストーム補助 強化ターン+1");
  }

  return { ...result, redraw: result.redraw || messages.length > 0, message: messages.join(" / ") || result.message || null };
}

export function onCpuAerialEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuAerialState(state);
  return onAerialEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuAerialAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuAerialState(state);
  return onAerialAfterSlotResolved(state, slotNumber, context);
}

export function onCpuAerialActionResolved(attacker, defender, context = {}) {
  ensureCpuAerialState(attacker);
  const base = onAerialActionResolved(attacker, defender, context) || {};
  const messages = [];
  const appendAttacks = [];

  if (base.message) messages.push(base.message);
  if (Array.isArray(base.appendAttacks)) appendAttacks.push(...base.appendAttacks);

  const ratio = getEvadeRatio(attacker);
  while (Number(attacker.aerialGundbitLinkCountThisTurn || 0) < 3 && Number(attacker.evade || 0) >= 1 && chance(ratio)) {
    reduceEvade(attacker, 1);
    attacker.aerialGundbitLinkCountThisTurn += 1;
    appendAttacks.push(...createAttack(20, 1, { type: "shoot", beam: true, source: "ガンビット" }));
    messages.push("CPUエアリアル：ガンビット連携");
  }

  if (appendAttacks.length > 0) {
    return { ...base, redraw: true, message: messages.join(" / ") || null, appendAttacks, appendAttackLabel: "ガンビット連携" };
  }

  return { ...base, redraw: base.redraw || messages.length > 0, message: messages.join(" / ") || base.message || null };
}

export function onCpuAerialDamaged(defender, attacker, context = {}) {
  ensureCpuAerialState(defender);
  return onAerialDamaged(defender, attacker, context);
}

export function onCpuAerialTurnEnd(state, context = {}) {
  ensureCpuAerialState(state);
  state.aerialGundbitLinkCountThisTurn = 0;
  return onAerialTurnEnd(state, context);
}

export function modifyCpuAerialTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureCpuAerialState(defender);
  const totalDamage = getCurrentActionTotalDamage(context);

  if (Number(defender.evade || 0) >= 1 && Number(defender.aerialCompositeShieldCount || 0) > 0 && totalDamage >= 100) {
    defender.aerialCompositeShieldCount -= 1;
    return { damage: 0, cancelled: true, message: "CPUエアリアル：コンポジットガンビットシールド 総合ダメージ無効" };
  }

  return modifyAerialTakenDamage(defender, attacker, attack, damage, context);
}

export function modifyCpuAerialEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuAerialState(defender);
  return modifyAerialEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuAerialResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuAerialState(state);
  return onAerialResolveChoice(state, pendingChoice, selectedValue, context);
}
