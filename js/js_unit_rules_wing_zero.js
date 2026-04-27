import { createAttack } from "./js_battle_system.js";
import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect
} from "./js_unit_runtime.js";

function ensureWingZeroState(state) {
  if (!state.wingMode) state.wingMode = "evade";
  if (!state.zeroSystemActivated) state.zeroSystemActivated = false;
  if (!state.zeroBerserkUsed) state.zeroBerserkUsed = false;
  if (!state.wingBusterUnlockUsedThisAction) state.wingBusterUnlockUsedThisAction = false;
  if (!state.wingZeroHitAppliedThisTurn) state.wingZeroHitAppliedThisTurn = false;
}

function clearWingOverEvadeState(state) {
  state.overEvadeMode = false;
  state.overEvadeCap = state.evadeMax;
  state.overEvadeBaseMax = state.evadeMax;
  state.overEvadeAbsoluteMax = null;
}

function refreshWingOverEvadeStateForCurrentForm(state, options = {}) {
  state.overEvadeAbsoluteMax = null;

  const preserveNeoOrigin =
    options.preserveNeoOrigin === true ||
    (
      state.overEvadeMode === true &&
      typeof state.overEvadeBaseMax === "number" &&
      state.overEvadeBaseMax >= 6
    );

  if (state.formId === "neo") {
    if (state.evade > state.evadeMax) {
      state.overEvadeMode = true;
      state.overEvadeCap = state.evade;
      state.overEvadeBaseMax = 6;
      return;
    }

    clearWingOverEvadeState(state);
    state.overEvadeBaseMax = 6;
    return;
  }

  if (state.evade > state.evadeMax) {
    state.overEvadeMode = true;
    state.overEvadeCap = state.evade;
    state.overEvadeBaseMax = preserveNeoOrigin ? 6 : state.evadeMax;
    return;
  }

  clearWingOverEvadeState(state);
}

function activateWingZeroSystem(state) {
  ensureWingZeroState(state);

  if (state.wingMode === "hit") {
    const current = getStateEffect(state, "wing_zero_hit");
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

    setStateEffect(state, "wing_zero_hit", {
      turns: currentTurns + 3,
      skipNextTick: true
    });
  } else {
    const current = getStateEffect(state, "wing_zero_evade");
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

    setStateEffect(state, "wing_zero_evade", {
      turns: currentTurns + 3,
      skipNextTick: true
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
  if (formId === "ms") {
    return ["slot1", "slot2", "slot4", "slot5"].includes(slotKey);
  }

  if (formId === "neo") {
    return ["slot1", "slot4", "slot5", "slot6"].includes(slotKey);
  }

  return false;
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
    result.status.push(`ゼロシステム(回避)残り行動ターン:${evadeEffect.turns}`);
  }

  if (hitEffect && typeof hitEffect.turns === "number") {
    result.status.push(`ゼロシステム(命中)残り行動ターン:${hitEffect.turns}`);
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
    const slotKey = context.currentAttackContext?.slotKey || null;
    const allowed =
      slotKey === "slot5" &&
      context.currentAttack.length > 0 &&
      state.evade >= 3 &&
      !state.wingBusterUnlockUsedThisAction;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
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

    refreshWingOverEvadeStateForCurrentForm(state, {
      preserveNeoOrigin: true
    });

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "transform_ms") {
    const preserveNeoOrigin =
      state.formId === "neo" &&
      typeof state.evade === "number" &&
      state.evade > 3;

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

    refreshWingOverEvadeStateForCurrentForm(state, {
      preserveNeoOrigin
    });

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "zero_berserk") {
    setStateEffect(state, "wing_zero_evade", {
      turns: 3,
      skipNextTick: true
    });

    setStateEffect(state, "wing_zero_hit", {
      turns: 3,
      skipNextTick: true
    });

    state.evade = 3;
    state.zeroBerserkUsed = true;

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "buster_unlock") {
    const hpInput = prompt("消費するHPを入力");
    const hpCost = parseInt(hpInput, 10);

    if (!hpCost || hpCost <= 0) {
      return {
        handled: true,
        redraw: false,
        message: null
      };
    }

    if (hpCost >= state.hp) {
      return {
        handled: true,
        redraw: false,
        message: "HPが足りません"
      };
    }

    state.evade = 0;
    state.hp -= hpCost;
    state.wingBusterUnlockUsedThisAction = true;

    const bonus = Math.floor(hpCost / 2);
    const appendAttacks = createAttack(bonus, 1, {
      type: "shoot",
      beam: true,
      cannotEvade: false,
      ignoreReduction: false,
      ignoreDefense: false,
      special: null,
      source: "バスターライフル・出力解放"
    });

    return {
      handled: true,
      redraw: true,
      message: null,
      appendAttacks
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

  return {
    redraw: changedEvade || changedHit,
    message: null
  };
}

export function onWingZeroBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureWingZeroState(state);

  state.wingBusterUnlockUsedThisAction = false;

  if (hasWingZeroHit(state) && !state.wingZeroHitAppliedThisTurn && context.enemyState) {
    context.enemyState.evade = 0;
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
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + 80);
    redraw = true;
    messages.push("80回復");
  }

  if (
    actionFormId === "neo" &&
    context.slotNumber === 6 &&
    attacker.wingMode === "hit" &&
    context.hitCount > 0
  ) {
    const doubledEvade = attacker.evade * 2;

    const changed = setForm(attacker, "ms", {
      preserveHp: true,
      preserveEvade: true
    });

    if (changed) {
      attacker.evade = doubledEvade;
      attacker.overEvadeMode = doubledEvade > attacker.evadeMax;
      attacker.overEvadeCap = doubledEvade;
      attacker.overEvadeBaseMax = 6;
      attacker.overEvadeAbsoluteMax = null;
      redraw = true;
      messages.push("MS形態へ復帰");
    }
  }

  if (canChaseThisAction && attacker.evade >= 3) {
    return {
      redraw: true,
      message: messages.length > 0 ? messages.join("<br>") : null,
      requestChoice: {
        choiceType: "generic",
        source: "wing_zero_chase",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
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
    return {
      handled: false
    };
  }

  if (attack.cannotEvade) {
    if (defender.evade <= 0) {
      return {
        handled: true,
        ok: false,
        reason: "noEvade",
        message: "回避が足りない"
      };
    }

    return {
      handled: true,
      ok: true,
      consumeEvade: 1,
      message: null
    };
  }

  return {
    handled: true,
    ok: true,
    consumeEvade: 0,
    message: null
  };
}

export function onWingZeroResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureWingZeroState(state);

  if (pendingChoice.source === "wing_zero_chase") {
    if (selectedValue !== "run") {
      return {
        handled: true,
        redraw: true,
        message: "追撃を終了"
      };
    }

    if (state.evade < 3) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    state.evade -= 3;

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: pendingChoice.slotKey
      }
    };
  }

  if (pendingChoice.source === "extra_weapon") {
    const slotKey = selectedValue;

    if (state.evade < 2) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    state.evade -= 2;

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey
      }
    };
  }

  if (pendingChoice.source === "nt_prediction") {
    state.ntGuessSlotKey = selectedValue;

    return {
      handled: true,
      redraw: true,
      message: "予測を設定した"
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
