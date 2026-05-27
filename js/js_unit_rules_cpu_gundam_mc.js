import { createAttack } from "./js_battle_system.js";

import {
  getGundamMcDerivedState,
  executeGundamMcSpecial,
  onGundamMcBeforeSlot,
  onGundamMcEnemyBeforeSlot,
  onGundamMcDamaged,
  onGundamMcAfterSlotResolved,
  onGundamMcActionResolved,
  modifyGundamMcTakenDamage,
  onGundamMcResolveChoice
} from "./js_unit_rules_gundam_mc.js";

function ensureCpuGundamState(state) {
  if (typeof state.cpuGundamTurnCount !== "number") state.cpuGundamTurnCount = 0;
  if (typeof state.ntTimer !== "number") state.ntTimer = 0;
}
function pickRandomPredictSlotKey(slotKeys) {
  const keys = Array.isArray(slotKeys)
    ? slotKeys.filter(key => typeof key === "string" && /^slot\d+$/.test(key))
    : [];

  if (keys.length <= 0) return null;

  return keys[Math.floor(Math.random() * keys.length)];
}
function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function healRuleHp(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, amount);
  }

  state.hp = Math.min(state.maxHp, Number(state.hp || 0) + amount);
  return amount;
}

function extraWeaponAttacks() {
  if (Math.random() < 0.5) {
    return {
      label: "ガンダムハンマー",
      attacks: createAttack(80, 1, {
        type: "melee",
        source: "CPUガンダムハンマー"
      })
    };
  }

  return {
    label: "ハイパーバズーカ",
    attacks: createAttack(80, 1, {
      type: "shoot",
      source: "CPUハイパーバズーカ"
    })
  };
}

export function getCpuGundamMcDerivedState(state) {
  ensureCpuGundamState(state);

  const derived = getGundamMcDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：3ターンに1回、追加武装を同時発動",
      "CPU特性：HP200未満で4命中時に50回復"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_gundam_traits",
        timing: "auto",
        actionType: "auto",
        desc: "3ターンに1回、追加武装を同時発動する。HP200未満で4命中時に50回復する。HP50以下でラストシューティング補正。"
      }
    }
  };
}

export function executeCpuGundamMcSpecial(state, specialKey, context = {}) {
  return executeGundamMcSpecial(state, specialKey, context);
}

export function onCpuGundamMcBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuGundamState(state);
  return onGundamMcBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuGundamMcEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuGundamState(state);
  return onGundamMcEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuGundamMcAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuGundamState(state);
  return onGundamMcAfterSlotResolved(state, slotNumber, context);
}

export function onCpuGundamMcActionResolved(state, defender, context = {}) {
  ensureCpuGundamState(state);

  const baseResult = onGundamMcActionResolved(state, defender, context) || {
    redraw: false,
    message: null
  };

  const messages = [];

  if (baseResult.message) {
    messages.push(baseResult.message);
  }

  if (
    context.slotNumber === 4 &&
    context.hitCount > 0 &&
    Number(state.hp || 0) < 200
  ) {
    healRuleHp(state, 50, context);
    messages.push("CPU特性：HP50回復");
  }

  return {
    ...baseResult,
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function onCpuGundamMcDamaged(defender, attacker, context = {}) {
  ensureCpuGundamState(defender);
  return onGundamMcDamaged(defender, attacker, context);
}

export function onCpuGundamMcTurnEnd(state, context = {}) {
  ensureCpuGundamState(state);

  state.cpuGundamTurnCount += 1;
  state.ntTimer += 1;

  const messages = [];

  if (state.ntTimer >= 3) {
    state.ntTimer = 0;

    const predictSlotKey = pickRandomPredictSlotKey(context.enemyPredictableSlotKeys);

    if (predictSlotKey) {
      state.ntGuessSlotKey = predictSlotKey;
      messages.push("CPUガンダムMC：ニュータイプ予測を自動設定");
    } else {
      state.ntGuessSlotKey = null;
    }
  }

  return {
    redraw: true,
    message: messages.join("\n") || null
  };
}
export function modifyCpuGundamMcTakenDamage(state, attacker, attack, damage) {
  ensureCpuGundamState(state);
  return modifyGundamMcTakenDamage(state, attacker, attack, damage);
}

export function modifyCpuGundamMcEvadeAttempt(state, attacker, attack, context = {}) {
  return {
    handled: false
  };
}

export function onCpuGundamMcResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuGundamState(state);

  if (pendingChoice?.source === "nt_prediction") {
    return {
      handled: true,
      redraw: false,
      message: null
    };
  }

  return onGundamMcResolveChoice(state, pendingChoice, selectedValue, context);
}

export function getCpuGundamMcExtraWeaponResult(state) {
  ensureCpuGundamState(state);

  if (state.cpuGundamTurnCount <= 0) return null;
  if (state.cpuGundamTurnCount % 3 !== 0) return null;

  const extra = extraWeaponAttacks();

  return {
    appendAttacks: extra.attacks,
    message: `CPU特性：${extra.label}を同時発動`
  };
}
