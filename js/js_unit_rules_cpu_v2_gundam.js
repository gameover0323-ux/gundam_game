import {
  getV2DerivedState,
  onV2BeforeSlot,
  onV2EnemyBeforeSlot,
  onV2AfterSlotResolved,
  onV2ActionResolved,
  onV2Damaged,
  modifyV2TakenDamage,
  modifyV2EvadeAttempt
} from "./js_unit_rules_v2_gundam.js";
import { setForm, reduceEvade } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

function ensureCpuV2State(state) {
  if (!state) return;
  if (!state.v2Cooldowns) state.v2Cooldowns = {};
}

function canUsePart(state, part) {
  return Number(state.v2Cooldowns?.[part] || 0) <= 0;
}

function cpuChangeRandom(state) {
  ensureCpuV2State(state);
  const candidates = [];

  if (canUsePart(state, "assault")) candidates.push("assault");
  if (canUsePart(state, "buster")) candidates.push("buster");
  if (canUsePart(state, "cannon")) candidates.push("cannon");
  if (canUsePart(state, "assault") && canUsePart(state, "buster")) candidates.push("assault_buster");
  if (canUsePart(state, "assault") && canUsePart(state, "buster") && canUsePart(state, "cannon")) candidates.push("assault_buster_cannon");

  if (candidates.length === 0) {
    setForm(state, "v2", { preserveHp: true, preserveEvade: true });
    return "CPU V2：換装先CT中のため通常形態";
  }

  const next = candidates[Math.floor(Math.random() * candidates.length)];
  setForm(state, next, { preserveHp: true, preserveEvade: true });
  state.hp = Math.min(state.maxHp, state.hp + (next === "assault_buster" || next === "assault_buster_cannon" ? 100 : 50));
  return `CPU V2：${state.name}へ換装`;
}

export function getCpuV2DerivedState(state) {
  return getV2DerivedState(state);
}

export function onCpuV2BeforeSlot(state, rolledSlotNumber, context = {}) {
  const base = onV2BeforeSlot(state, rolledSlotNumber, context);
  if (Math.random() < 1 / 6) {
    const msg = cpuChangeRandom(state);
    return { redraw: true, message: [base?.message, msg].filter(Boolean).join(" / ") };
  }
  return base;
}

export function onCpuV2EnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return onV2EnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuV2AfterSlotResolved(state, slotNumber, payload = {}) {
  const base = onV2AfterSlotResolved(state, slotNumber, payload);
  if (Number(state.evade || 0) > 0 && Math.random() < Math.min(0.9, Number(state.evade || 0) / 10)) {
    reduceEvade(state, 1);
    const add = createAttack(60, 1, { type: "shoot", source: "CPU マルチプルランチャー" });
    return {
      redraw: true,
      message: [base?.message, "CPU V2：マルチプルアサルト追撃"].filter(Boolean).join(" / "),
      appendAttacks: [...(base?.appendAttacks || []), ...add]
    };
  }
  return base;
}

export function onCpuV2ActionResolved(attacker, defender, context = {}) {
  return onV2ActionResolved(attacker, defender, context);
}

export function onCpuV2Damaged(defender, attacker, context = {}) {
  return onV2Damaged(defender, attacker, context);
}

export function modifyCpuV2TakenDamage(defender, attacker, attack, damage, context = {}) {
  if (Number(damage || 0) >= 100 && defender.v2MegaBeamShieldCount > 0 && Math.random() < 0.75) {
    defender.v2MegaBeamShieldCount -= 1;
    return { damage: 0, cancelled: true, message: `CPU V2：メガビームシールド発動（残り${defender.v2MegaBeamShieldCount}）` };
  }

  if (Math.random() < 0.15 && !attack?.ignoreReduction && !attack?.ignoreDefense) {
    return { damage: Math.floor(Number(damage || 0) / 2), message: "CPU V2：シールドでダメージ半減" };
  }

  return modifyV2TakenDamage(defender, attacker, attack, damage, context);
}

export function modifyCpuV2EvadeAttempt(defender, attacker, attack, context = {}) {
  return modifyV2EvadeAttempt(defender, attacker, attack, context);
}

export function onCpuV2TurnEnd(state) {
  return { redraw: true, message: null };
}
