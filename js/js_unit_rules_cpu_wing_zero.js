import {
  getStateEffect,
  setStateEffect,
  clearStateEffect,
  setForm,
  doubleEvadeRedCap
} from "./js_unit_runtime.js";

import {
  getWingZeroDerivedState,
  executeWingZeroSpecial,
  onWingZeroBeforeSlot,
  onWingZeroEnemyBeforeSlot,
  onWingZeroAfterSlotResolved,
  onWingZeroActionResolved,
  onWingZeroDamaged,
  onWingZeroTurnEnd,
  modifyWingZeroTakenDamage,
  modifyWingZeroEvadeAttempt,
  onWingZeroResolveChoice
} from "./js_unit_rules_wing_zero.js";

function ensureCpuWingZeroState(state) {
  if (typeof state.cpuWingZeroSlot6Ex !== "boolean") state.cpuWingZeroSlot6Ex = Math.random() < 0.5;
  if (typeof state.cpuWingZeroBerserkUsed !== "boolean") state.cpuWingZeroBerserkUsed = false;
  if (typeof state.cpuWingZeroSystemActivatedOnce !== "boolean") state.cpuWingZeroSystemActivatedOnce = false;
  if (typeof state.cpuWingZeroHitClearPending !== "boolean") state.cpuWingZeroHitClearPending = false;
  if (typeof state.cpuWingZeroExtraUsedThisSlot !== "boolean") state.cpuWingZeroExtraUsedThisSlot = false;
}

function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function getEnemyPlayer(context) {
  return context?.enemyPlayer || null;
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

function zeroEnemyRuleEvade(defender, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.zeroEvade && enemyPlayer) {
    return adapter.zeroEvade(enemyPlayer, defender);
  }

  if (defender) defender.evade = 0;
  return true;
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

function zeroOwnRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.zeroEvade && ownerPlayer) {
    return adapter.zeroEvade(ownerPlayer, state);
  }

  if (state) state.evade = 0;
  return true;
}

function getEvadeSystem(state) {
  return getStateEffect(state, "wing_zero_evade");
}

function getHitSystem(state) {
  return getStateEffect(state, "wing_zero_hit");
}

function hasBothSystems(state) {
  return !!getEvadeSystem(state) && !!getHitSystem(state);
}

function activateEvadeSystem(state) {
  state.cpuWingZeroSystemActivatedOnce = true;

  const current = getStateEffect(state, "wing_zero_evade");
  const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

  setStateEffect(state, "wing_zero_evade", {
    turns: currentTurns + 3,
    skipNextTick: true,
    boost: true,
    boostType: "zero_system_evade",
    boostName: "ゼロシステム(回避)"
  });

  return "ウイングゼロ：ゼロシステム発動(回避補正)";
}

function activateHitSystem(state) {
  state.cpuWingZeroSystemActivatedOnce = true;
  state.cpuWingZeroHitClearPending = true;

  const current = getStateEffect(state, "wing_zero_hit");
  const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

  setStateEffect(state, "wing_zero_hit", {
    turns: currentTurns + 3,
    skipNextTick: true,
    boost: true,
    boostType: "zero_system_hit",
    boostName: "ゼロシステム(命中)"
  });

  return "ウイングゼロ：ゼロシステム発動(命中補正)";
}

function addRuleEvadeAtLeast(state, amount, context = {}) {
  const current = getRuleEvade(state, context);
  if (current >= amount) return 0;

  const add = amount - current;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, add);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + add;
  return add;
}

function activateBerserk(state, context = {}) {
  state.cpuWingZeroBerserkUsed = true;
  state.cpuWingZeroSystemActivatedOnce = true;

  addRuleEvadeAtLeast(state, 3, context);

  setStateEffect(state, "wing_zero_evade", {
    turns: 3,
    skipNextTick: true,
    boost: true,
    boostType: "zero_system_evade",
    boostName: "ゼロシステム(回避)"
  });

  setStateEffect(state, "wing_zero_hit", {
    turns: 3,
    skipNextTick: true,
    boost: true,
    boostType: "zero_system_hit",
    boostName: "ゼロシステム(命中)"
  });

  return "ウイングゼロ特性：HP100以下、ゼロシステム暴走。6/6EX同時発動、回避3";
}

function transformToNeoBird(state) {
  if (state.formId === "neo") return false;

  return setForm(state, "neo", {
    preserveHp: true,
    preserveEvade: true
  });
}

function returnToMsWithDoubleEvade(state, context = {}) {
  const changed = setForm(state, "ms", {
    preserveHp: true,
    preserveEvade: true
  });

  if (changed) {
    const adapter = getAdapter(context);
    const ownerPlayer = getOwnerPlayer(context);

    if (adapter?.applyToUnifiedPartners && ownerPlayer && adapter.isUnifiedOwner?.(ownerPlayer)) {
      adapter.applyToUnifiedPartners(ownerPlayer, unit => {
        doubleEvadeRedCap(unit);
      });
    } else {
      doubleEvadeRedCap(state);
    }
  }

  return changed;
}

function buildAttack(damage, count, extra = {}) {
  return Array.from({ length: count }, () => ({
    damage,
    ...extra
  }));
}

export function getCpuWingZeroDerivedState(state) {
  ensureCpuWingZeroState(state);

  const derived = getWingZeroDerivedState(state);

  const result = {
    ...derived,
    status: [
      ...(derived.status || [])
    ],
    slots: {
      ...(derived.slots || {})
    },
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_wing_zero_traits",
        timing: "auto",
        actionType: "auto",
        desc: "ゼロシステム切替、ツインバスター追撃、10%軽減、10%変形、HP100以下暴走。"
      }
    }
  };

  const evadeSystem = getEvadeSystem(state);
  const hitSystem = getHitSystem(state);

  if (evadeSystem) result.status.push(`ゼロシステム回避 残${evadeSystem.turns}ターン`);
  if (hitSystem) result.status.push(`ゼロシステム命中 残${hitSystem.turns}ターン`);
  if (hasBothSystems(state)) result.status.push("両解放：被ダメージ2倍");

  if (hitSystem) {
    Object.keys(state.slots || {}).forEach((slotKey) => {
      const baseSlot = state.baseSlots?.[slotKey];
      if (!baseSlot?.effect || baseSlot.effect.type !== "attack") return;

      result.slots[slotKey] = {
        ...(result.slots[slotKey] || {}),
        effect: {
          ...(baseSlot.effect || {}),
          ...(result.slots[slotKey]?.effect || {}),
          cannotEvade: true,
          addedCannotEvade: true
        }
      };
    });
  }

  if (state.formId === "ms" && state.cpuWingZeroSlot6Ex) {
    result.slots.slot6 = {
      label: "6EX ゼロシステム発動(命中補正)",
      desc: "3ターンの間強化。1ターン目の自分フェイズ初めに相手回避0。効果中自身の攻撃が必中。回避3消費で同じスロット行動をもう一度繰り出す。",
      effect: {
        type: "custom",
        effectId: "cpu_wing_zero_hit_system"
      },
      ex: true
    };
  }

  if (state.formId === "neo" && state.cpuWingZeroSlot6Ex) {
    result.slots.slot6 = {
      label: "6EX 変形ビームソード 40ダメージ",
      desc: "40ダメージ。ヒット時のみMS形態へ移行。現在の所持回避数をMS形態の回避上限を超えて倍にして引き継ぐ。",
      effect: {
        type: "attack",
        damage: 40,
        count: 1,
        attackType: "melee",
        beam: true,
        cannotEvade: !!hitSystem,
        addedCannotEvade: !!hitSystem
      },
      ex: true
    };
  }

  return result;
}

export function executeCpuWingZeroSpecial(state, specialKey, context = {}) {
  return executeWingZeroSpecial(state, specialKey, context);
}

export function onCpuWingZeroBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuWingZeroState(state);
  state.cpuWingZeroExtraUsedThisSlot = false;

  const baseResult = onWingZeroBeforeSlot(state, rolledSlotNumber, context) || {
    redraw: false,
    message: null
  };

  const messages = [];
  if (baseResult.message) messages.push(baseResult.message);

  if (getHitSystem(state) && state.cpuWingZeroHitClearPending && context.enemyState) {
    zeroEnemyRuleEvade(context.enemyState, context);
    state.cpuWingZeroHitClearPending = false;
    messages.push("ウイングゼロ：ゼロシステム命中補正。相手回避0");
  }

  return {
    ...baseResult,
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function onCpuWingZeroEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuWingZeroState(state);
  return onWingZeroEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function getCpuWingZeroExtraWeaponResult(state, context = {}) {
  ensureCpuWingZeroState(state);

  const total = {
    appendAttacks: [],
    appendMessages: [],
    redraw: true
  };

  const selfEvade = getRuleEvade(state, context);
  const enemyEvade = context.twoVtwoAdapter?.getEvade && context.enemyPlayer
    ? context.twoVtwoAdapter.getEvade(context.enemyPlayer, context.enemyState)
    : Number(context.enemyState?.evade || 0);

  if (
    state.formId === "ms" &&
    context.slotNumber === 5 &&
    selfEvade > 0 &&
    enemyEvade <= 0 &&
    context.enemyState &&
    Number(context.enemyState.hp || 0) < Number(state.hp || 0) / 4 &&
    Math.random() < 0.5
  ) {
    const spent = selfEvade;
    zeroOwnRuleEvade(state, context);

    const bonusDamage = Math.floor(spent / 2);

    if (bonusDamage > 0) {
      total.appendAttacks.push(...buildAttack(bonusDamage, 1, {
        attackType: "shoot",
        beam: true,
        ignoreReduction: true
      }));

      total.appendMessages.push(`ウイングゼロ特性：回避${spent}消費、HP1残し追撃 ${bonusDamage}ダメージ`);
    }
  }

  const currentEvade = getRuleEvade(state, context);

  if (
    getHitSystem(state) &&
    !state.cpuWingZeroExtraUsedThisSlot &&
    currentEvade >= 3 &&
    state.evadeMax > 0 &&
    Math.random() < currentEvade / state.evadeMax &&
    context.slot
  ) {
    consumeRuleEvade(state, 3, context);
    state.cpuWingZeroExtraUsedThisSlot = true;

    const effect = context.slot.effect || {};

    if (effect.type === "attack") {
      total.appendAttacks.push(...buildAttack(effect.damage, effect.count || 1, {
        attackType: effect.attackType,
        beam: effect.beam,
        ignoreReduction: effect.ignoreReduction,
        cannotEvade: true,
        addedCannotEvade: true
      }));

      total.appendMessages.push("ウイングゼロ：回避3消費、同じスロット行動を再攻撃");
    }
  }

  if (total.appendAttacks.length === 0 && total.appendMessages.length === 0) return null;
  return total;
}

export function onCpuWingZeroAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuWingZeroState(state);

  const result = context.resolveResult;
  const effectId = result?.customEffectId;

  if (effectId === "wing_zero_system_activate") {
    return {
      redraw: true,
      message: activateEvadeSystem(state)
    };
  }

  if (effectId === "cpu_wing_zero_hit_system") {
    return {
      redraw: true,
      message: activateHitSystem(state)
    };
  }

  if (state.formId === "neo" && slotNumber === 6 && result?.kind === "attack" && !state.cpuWingZeroSlot6Ex) {
    healRuleHp(state, 80, context);

    return {
      redraw: true,
      message: "ウイングゼロ：突撃 80回復"
    };
  }

  return onWingZeroAfterSlotResolved(state, slotNumber, context);
}

export function onCpuWingZeroActionResolved(attacker, defender, context = {}) {
  ensureCpuWingZeroState(attacker);

  if (
    attacker.formId === "neo" &&
    context.slotNumber === 6 &&
    attacker.cpuWingZeroSlot6Ex &&
    context.hitCount > 0
  ) {
    returnToMsWithDoubleEvade(attacker, context);

    return {
      redraw: true,
      message: "ウイングゼロ：変形ビームソード命中。MS形態へ移行、回避倍化"
    };
  }

  return onWingZeroActionResolved(attacker, defender, context);
}

export function onCpuWingZeroTurnEnd(state, context = {}) {
  ensureCpuWingZeroState(state);

  const messages = [];
  let redraw = false;

  state.cpuWingZeroSlot6Ex = Math.random() < 0.5;
  redraw = true;

  const baseResult = onWingZeroTurnEnd(state, context) || {
    redraw: false,
    message: null
  };

  if (baseResult.message) messages.push(baseResult.message);
  redraw = baseResult.redraw || redraw;

  if (state.formId === "ms" && Math.random() < 0.1) {
    if (transformToNeoBird(state)) {
      redraw = true;
      messages.push("ウイングゼロ特性：ネオバード形態へ変形");
    }
  }

  if (
    state.formId === "ms" &&
    !state.cpuWingZeroBerserkUsed &&
    !state.cpuWingZeroSystemActivatedOnce &&
    Number(state.hp || 0) <= 100
  ) {
    messages.push(activateBerserk(state, context));
    redraw = true;
  }

  return {
    redraw,
    message: messages.length > 0 ? messages.join("\n") : null
  };
}

export function modifyCpuWingZeroEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuWingZeroState(defender);

  const baseResult = modifyWingZeroEvadeAttempt(defender, attacker, attack, context);

  if (baseResult?.handled) {
    return baseResult;
  }

  return {
    handled: false
  };
}

export function modifyCpuWingZeroTakenDamage(defender, attacker, attack, damage) {
  ensureCpuWingZeroState(defender);

  const baseResult = modifyWingZeroTakenDamage(defender, attacker, attack, damage) || {
    damage,
    message: null
  };

  let nextDamage = baseResult.damage;
  const messages = [];

  if (baseResult.message) messages.push(baseResult.message);

  if (Math.random() < 0.1) {
    nextDamage = Math.floor(nextDamage * 0.8);
    messages.push("ウイングゼロ特性：10%判定成功、被ダメージ20%軽減");
  }

  if (hasBothSystems(defender)) {
    nextDamage = Math.floor(nextDamage * 2);
    messages.push("ウイングゼロ：両解放により被ダメージ2倍");
  } else if (getEvadeSystem(defender) || getHitSystem(defender)) {
    nextDamage = Math.floor(nextDamage * 1.5);
    messages.push("ウイングゼロ：ゼロシステム中、被ダメージ1.5倍");
  }

  return {
    damage: nextDamage,
    message: messages.length > 0 ? messages.join("\n") : null
  };
}

export function onCpuWingZeroDamaged(defender, attacker, context = {}) {
  ensureCpuWingZeroState(defender);

  const baseResult = onWingZeroDamaged(defender, attacker, context) || {
    redraw: false,
    message: null
  };

  if (
    defender.formId === "ms" &&
    !defender.cpuWingZeroBerserkUsed &&
    !defender.cpuWingZeroSystemActivatedOnce &&
    Number(defender.hp || 0) <= 100
  ) {
    return {
      redraw: true,
      message: [baseResult.message, activateBerserk(defender, context)].filter(Boolean).join("\n")
    };
  }

  return baseResult;
}

export function onCpuWingZeroResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuWingZeroState(state);
  return onWingZeroResolveChoice(state, pendingChoice, selectedValue, context);
}
