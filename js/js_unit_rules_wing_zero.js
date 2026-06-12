import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect,
  doubleEvadeRedCap,
  reduceEvade,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

function ensureWingZeroState(state) {
  if (!state.wingMode) state.wingMode = "evade";
  if (!state.zeroSystemActivated) state.zeroSystemActivated = false;
  if (!state.zeroBerserkUsed) state.zeroBerserkUsed = false;
  if (!state.wingBusterUnlockUsedThisAction) state.wingBusterUnlockUsedThisAction = false;
  if (!state.wingZeroHitAppliedThisTurn) state.wingZeroHitAppliedThisTurn = false;
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
  reduceEvade(state, amount);
  return true;
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
  normalizeEvadeCapState(state);
  return add;
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

function zeroEnemyRuleEvade(defender, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.zeroEvade && enemyPlayer) {
    return adapter.zeroEvade(enemyPlayer, defender);
  }

  if (defender) {
    defender.evade = 0;
    normalizeEvadeCapState(defender);
  }

  return true;
}

function doubleRuleEvadeRedCap(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.applyToUnifiedPartners && ownerPlayer && adapter.isUnifiedOwner?.(ownerPlayer)) {
    adapter.applyToUnifiedPartners(ownerPlayer, unit => {
      doubleEvadeRedCap(unit);
    });
    return true;
  }

  doubleEvadeRedCap(state);
  return true;
}

function activateWingZeroSystem(state) {
  ensureWingZeroState(state);

  if (state.wingMode === "hit") {
    const current = getStateEffect(state, "wing_zero_hit");
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

    setStateEffect(state, "wing_zero_hit", {
      turns: currentTurns + 3,
      skipNextTick: true,
      boost: true,
      boostType: "zero_system_hit",
      boostName: "ゼロシステム(命中)"
    });
  } else {
    const current = getStateEffect(state, "wing_zero_evade");
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

    setStateEffect(state, "wing_zero_evade", {
      turns: currentTurns + 3,
      skipNextTick: true,
      boost: true,
      boostType: "zero_system_evade",
      boostName: "ゼロシステム(回避)"
    });
  }

  state.zeroSystemActivated = true;
}

function tickWingZeroEffect(state, effectId) {
  const effect = getStateEffect(state, effectId);
  if (!effect) return false;

  if (effect.skipNextTick) {
    effect.skipNextTick = false;
    return true;
  }

  effect.turns--;

  if (effect.turns <= 0) {
    clearStateEffect(state, effectId);
  }

  return true;
}

function hasWingZeroHit(state) {
  return !!getStateEffect(state, "wing_zero_hit");
}

function hasWingZeroEvade(state) {
  return !!getStateEffect(state, "wing_zero_evade");
}

function isWingAttackSlot(slotKey, formId) {
  if (formId === "ms") return ["slot1", "slot2", "slot4", "slot5"].includes(slotKey);
  if (formId === "neo") return ["slot1", "slot4", "slot5", "slot6"].includes(slotKey);
  return false;
}

function contextHasSlotKey(context = {}, expectedSlotKey) {
  if (!expectedSlotKey) return false;

  const currentAttackContext = context.currentAttackContext || {};
  if (currentAttackContext.slotKey === expectedSlotKey) return true;

  const attacks = Array.isArray(context.currentAttack) ? context.currentAttack : [];
  return attacks.some(attack =>
    attack?.slotKey === expectedSlotKey ||
    attack?.sourceSlotKey === expectedSlotKey ||
    attack?.meta?.slotKey === expectedSlotKey
  );
}

export function getWingZeroDerivedState(state) {
  ensureWingZeroState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  const hitEffect = getStateEffect(state, "wing_zero_hit");
  const evadeEffect = getStateEffect(state, "wing_zero_evade");

  if (evadeEffect && typeof evadeEffect.turns === "number") {
    result.status.push({
      text: `ゼロシステム(回避)残り行動ターン:${evadeEffect.turns}`,
      color: "#44aaff",
      bold: true
    });
  }

  if (hitEffect && typeof hitEffect.turns === "number") {
    result.status.push({
      text: `ゼロシステム(命中)残り行動ターン:${hitEffect.turns}`,
      color: "#ff4444",
      bold: true
    });
  }

  if (state.formId === "ms") {
    if (state.wingMode === "hit") {
      result.slots.slot6 = {
        label: "6EX ゼロシステム発動(命中補正)",
        desc: "3ターンの間、発動効果中の自分のフェイズ初めに相手の所持回避数を0にする。効果中自身の攻撃が必中状態になる。さらに、現在の所持回避数を3消費してこのターン使用した同じスロット行動をもう一度繰り出すことが可能。ただし、自分の被ダメージが1.5倍になる。両解放で被ダメージが2倍になる。",
        effect: {
          type: "custom",
          effectId: "wing_zero_system_activate"
        },
        ex: true
      };
    }

    if (hasWingZeroHit(state)) {
      ["slot1", "slot2", "slot4", "slot5"].forEach((slotKey) => {
        const current = result.slots[slotKey] || {};
        const baseSlot = state.baseSlots[slotKey];

        result.slots[slotKey] = {
          ...current,
          effect: {
            ...(baseSlot?.effect || {}),
            ...(current.effect || {}),
            cannotEvade: true,
            addedCannotEvade: true
          }
        };
      });
    }

    return result;
  }

  if (state.formId === "neo") {
    result.name = "ウイングガンダムゼロ(ネオバード)";

    if (state.wingMode === "hit") {
      result.slots.slot6 = {
        label: "6EX 変形ビームソード 40ダメージ",
        desc: "40ダメージ、ビーム、格闘+ヒット時のみ、MS形態へと移行。現在の所持回避数を、MS形態の回避ストック上限数を超えて倍にした状態で引き継ぎ、再度MS形態の上限値以下に消費されるまでその値を保持する。",
        effect: {
          type: "attack",
          damage: 40,
          count: 1,
          attackType: "melee",
          beam: true,
          cannotEvade: !!hitEffect,
          addedCannotEvade: !!hitEffect
        },
        ex: true
      };
    }

    if (hasWingZeroHit(state)) {
      ["slot1", "slot4", "slot5", "slot6"].forEach((slotKey) => {
        const current = result.slots[slotKey] || {};
        const baseSlot = state.baseSlots[slotKey];

        result.slots[slotKey] = {
          ...current,
          effect: {
            ...(baseSlot?.effect || {}),
            ...(current.effect || {}),
            cannotEvade: true,
            addedCannotEvade: true
          }
        };
      });
    }

    return result;
  }

  return result;
}

export function canUseWingZeroSpecial(state, specialKey, context = {}) {
  ensureWingZeroState(state);

  const special = state.specials[specialKey];
  if (!special) {
    return {
      allowed: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "buster_unlock") {
    const allowed =
      contextHasSlotKey(context, "slot5") &&
      Array.isArray(context.currentAttack) &&
      context.currentAttack.length > 0 &&
      getRuleEvade(state, context) >= 3 &&
      !state.wingBusterUnlockUsedThisAction;

    return { allowed, message: allowed ? null : "条件未達" };
  }

  if (special.effectType === "zero_berserk") {
    const allowed =
      state.formId === "ms" &&
      state.hp <= 100 &&
      !state.zeroSystemActivated &&
      !state.zeroBerserkUsed;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  return {
    allowed: true,
    message: null
  };
}

export function executeWingZeroSpecial(state, specialKey, context = {}) {
  ensureWingZeroState(state);

  const special = state.specials[specialKey];
  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "toggle_zero_mode") {
    state.wingMode = state.wingMode === "evade" ? "hit" : "evade";

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "transform_neo") {
    const changed = setForm(state, "neo", {
      preserveHp: true,
      preserveEvade: true
    });

    if (!changed) {
      return {
        handled: true,
        redraw: false,
        message: "ネオバード形態への変形に失敗"
      };
    }

    normalizeEvadeCapState(state);

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "transform_ms") {
    const changed = setForm(state, "ms", {
      preserveHp: true,
      preserveEvade: true
    });

    if (!changed) {
      return {
        handled: true,
        redraw: false,
        message: "MS形態への変形に失敗"
      };
    }

    normalizeEvadeCapState(state);

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "zero_berserk") {
    const currentEvade = getStateEffect(state, "wing_zero_evade");
    const currentHit = getStateEffect(state, "wing_zero_hit");

    const currentEvadeTurns =
      currentEvade && typeof currentEvade.turns === "number" ? currentEvade.turns : 0;

    const currentHitTurns =
      currentHit && typeof currentHit.turns === "number" ? currentHit.turns : 0;

    setStateEffect(state, "wing_zero_evade", {
      turns: currentEvadeTurns + 3,
      skipNextTick: true,
      boost: true,
      boostType: "zero_system_evade",
      boostName: "ゼロシステム(回避)"
    });

    setStateEffect(state, "wing_zero_hit", {
      turns: currentHitTurns + 3,
      skipNextTick: true,
      boost: true,
      boostType: "zero_system_hit",
      boostName: "ゼロシステム(命中)"
    });

    addRuleEvadeAtLeast(state, 3, context);

    state.zeroBerserkUsed = true;
    state.zeroSystemActivated = true;

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

if (special.effectType === "buster_unlock") {
    const maxHpCost = Math.max(0, Math.floor(Number(state.hp || 0)) - 1);

    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "numberInput",
        source: "wing_buster_unlock",
        effectType: "hp_cost_append_attack",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "消費HPを入力",
        digits: Math.max(1, String(maxHpCost).length),
        maxValue: maxHpCost,
        currentValue: "",
        params: {
          damageRate: 0.5,
          zeroEvade: true,
          setFlag: "wingBusterUnlockUsedThisAction",
          count: 1,
          attackType: "shoot",
          beam: true,
          sourceLabel: "バスターライフル・出力解放"
        }
      }
    };
}

  return {
    handled: false,
    redraw: false,
    message: null
  };
}

export function onWingZeroTurnEnd(state, context = {}) {
  ensureWingZeroState(state);

  state.wingZeroHitAppliedThisTurn = false;

  const changedEvade = tickWingZeroEffect(state, "wing_zero_evade");
  const changedHit = tickWingZeroEffect(state, "wing_zero_hit");

  normalizeEvadeCapState(state);

  return {
    redraw: changedEvade || changedHit,
    message: null
  };
}

export function onWingZeroBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureWingZeroState(state);

  state.wingBusterUnlockUsedThisAction = false;

  if (hasWingZeroHit(state) && !state.wingZeroHitAppliedThisTurn && context.enemyState) {
    zeroEnemyRuleEvade(context.enemyState, context);

    state.wingZeroHitAppliedThisTurn = true;

    return {
      redraw: true,
      message: `${state.name} ゼロシステムの効果が相手回避を0にした`
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onWingZeroEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onWingZeroAfterSlotResolved(state, slotNumber, context = {}) {
  const resolveResult = context.resolveResult || null;

  if (
    slotNumber === 6 &&
    resolveResult &&
    resolveResult.kind === "custom" &&
    resolveResult.customEffectId === "wing_zero_system_activate"
  ) {
    activateWingZeroSystem(state);

    return {
      redraw: true,
      message: null
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onWingZeroActionResolved(attacker, defender, context = {}) {
  ensureWingZeroState(attacker);

  const messages = [];
  let redraw = false;

  const actionFormId = attacker.formId;
  const actionSlotKey = context.slotKey;

  const canChaseThisAction =
    hasWingZeroHit(attacker) &&
    context.totalCount > 0 &&
    isWingAttackSlot(actionSlotKey, actionFormId);

  if (actionFormId === "neo" && context.slotNumber === 6 && attacker.wingMode === "evade") {
    healRuleHp(attacker, 80, context);
    redraw = true;
    messages.push("80回復");
  }

  if (
    actionFormId === "neo" &&
    context.slotNumber === 6 &&
    attacker.wingMode === "hit" &&
    context.hitCount > 0
  ) {
    const changed = setForm(attacker, "ms", {
      preserveHp: true,
      preserveEvade: true
    });

    if (changed) {
      doubleRuleEvadeRedCap(attacker, context);
      redraw = true;
      messages.push("MS形態へ復帰");
    }
  }

  if (canChaseThisAction && getRuleEvade(attacker, context) >= 3) {
    return {
      redraw: true,
      message: messages.length > 0 ? messages.join("<br>") : null,
      requestChoice: {
        choiceType: "generic",
        source: "wing_zero_chase",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: `PLAYER ${context.ownerPlayer} ゼロシステム追撃`,
        slotKey: context.slotKey,
        choices: [
          { label: "追撃する", value: "run" },
          { label: "追撃しない", value: "cancel" }
        ]
      }
    };
  }

  return {
    redraw,
    message: messages.length > 0 ? messages.join("<br>") : null
  };
}

export function onWingZeroDamaged(defender, attacker) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyWingZeroTakenDamage(defender, attacker, attack, damage) {
  const hasEvade = hasWingZeroEvade(defender);
  const hasHit = hasWingZeroHit(defender);

  if (!hasEvade && !hasHit) {
    return {
      damage,
      message: null
    };
  }

  let finalDamage = damage;

  if (hasEvade && hasHit) {
    finalDamage = Math.ceil(finalDamage * 2);
  } else {
    finalDamage = Math.ceil(finalDamage * 1.5);
  }

  return {
    damage: finalDamage,
    message: null
  };
}

export function modifyWingZeroEvadeAttempt(defender, attacker, attack, context = {}) {
  if (!hasWingZeroEvade(defender)) {
    return { handled: false };
  }

  const defenderPlayer = context.defenderPlayer || context.ownerPlayer || context.enemyPlayer;
  const defenderEvade = getRuleEvade(defender, {
    ...context,
    ownerPlayer: defenderPlayer
  });

  if (defenderEvade <= 0) {
    return {
      handled: true,
      ok: true,
      consumeEvade: 0,
      consumeByAdapter: true,
      message: null
    };
  }

  return {
    handled: true,
    ok: true,
    consumeEvade: 1,
    consumeByAdapter: true,
    message: null
  };
}

export function onWingZeroResolveChoice(
  state,
  pendingChoice,
  selectedValue,
  context = {}
) {
  ensureWingZeroState(state);

  if (pendingChoice.source === "wing_zero_chase") {
    if (selectedValue !== "run") {
      return {
        handled: true,
        redraw: true,
        message: "追撃を終了"
      };
    }

    if (getRuleEvade(state, context) < 3) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    consumeRuleEvade(state, 3, context);

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: pendingChoice.slotKey,
        ownerUnitKey: pendingChoice.ownerUnitKey || context.ownerUnitKey || null
      }
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
