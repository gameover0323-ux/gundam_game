import {
  getStateEffect,
  setStateEffect,
  clearStateEffect,
  setForm,
  doubleEvadeRedCap,
  normalizeEvadeCapState,
  executeUnitDispelBoostState,
  hasBoostStateEffect
} from "./js_unit_runtime.js";

import { createAttack } from "./js_battle_system.js";

import {
  getUnicornDerivedState,
  executeUnicornSpecial,
  onUnicornAfterSlotResolved,
  onUnicornDamaged,
  modifyUnicornTakenDamage,
  onUnicornDispelBoostState
} from "./js_unit_rules_unicorn_gundam.js";

function ensureCpuUnicornState(state) {
  if (!state) return;
  if (typeof state.cpuUnicornTurnTickedActionCount !== "number") state.cpuUnicornTurnTickedActionCount = -1;
  if (typeof state.unicornResonanceStock !== "number") state.unicornResonanceStock = 0;
  if (typeof state.cpuUnicornBoostSeen !== "boolean") state.cpuUnicornBoostSeen = false;
}

function isDestroy(state) {
  return state?.formId === "destroy";
}

function isAwaken(state) {
  return state?.formId === "awaken";
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
  normalizeEvadeCapState(state);
  return true;
}

function consumeEnemyRuleEvade(defender, amount, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.consumeEvade && enemyPlayer) {
    return adapter.consumeEvade(enemyPlayer, defender, amount);
  }

  if (!defender) return false;
  defender.evade = Math.max(0, Number(defender.evade || 0) - amount);
  normalizeEvadeCapState(defender);
  return true;
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

function addRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, amount);
  }

  state.actionCount = Math.max(0, Number(state.actionCount || 0)) + amount;
  return amount;
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

function enterDestroy(state, turns = 5) {
  ensureCpuUnicornState(state);

  setForm(state, "destroy", {
    preserveHp: true,
    preserveEvade: true
  });

  setStateEffect(state, "unicorn_ntd", {
    turns,
    boost: true,
    skipNextTick: true
  });

  clearStateEffect(state, "unicorn_awaken");
  state.unicornWeaponExMode = false;
}

function enterAwaken(state) {
  ensureCpuUnicornState(state);

  const turns = Math.max(1, Number(state.unicornResonanceStock || 0));

  setForm(state, "awaken", {
    preserveHp: true,
    preserveEvade: true
  });

  setStateEffect(state, "unicorn_awaken", {
    turns,
    skipNextTick: true,
    boost: false
  });
}

function returnToDestroy(state) {
  setForm(state, "destroy", {
    preserveHp: true,
    preserveEvade: true
  });

  clearStateEffect(state, "unicorn_awaken");
  state.unicornWeaponExMode = false;
}

function returnToUnicorn(state) {
  setForm(state, "unicorn", {
    preserveHp: true,
    preserveEvade: true
  });

  clearStateEffect(state, "unicorn_ntd");
  clearStateEffect(state, "unicorn_awaken");
  state.unicornWeaponExMode = false;
  normalizeEvadeCapState(state);
}

function consumeEvadeForStockByRate(state, cost, context = {}) {
  ensureCpuUnicornState(state);

  const evade = getRuleEvade(state, context);
  const evadeMax = Math.max(1, Number(state.evadeMax || 1));
  const rate = Math.min(1, evade / evadeMax);

  if (evade < cost) return null;
  if (Math.random() >= rate) return null;

  consumeRuleEvade(state, cost, context);
  state.unicornResonanceStock += 1;

  return `覚醒保持+1（現在${state.unicornResonanceStock}）`;
}

function isPsychommuAttack(attack) {
  if (!attack) return false;

  return attack.psychommu === true ||
    attack.funnel === true ||
    attack.dragoon === true ||
    attack.incom === true ||
    attack.specialAttribute === "psychommu" ||
    attack.type === "psychommu";
}

export function getCpuUnicornDerivedState(state) {
  ensureCpuUnicornState(state);

  const derived = getUnicornDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：相手の強化に反応してNT-Dを狙う",
      "CPU特性：回避を消費して覚醒保持を増やす"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_unicorn_traits",
        timing: "auto",
        actionType: "auto",
        desc: "相手の強化に反応してNT-Dや覚醒を狙う。回避を消費して覚醒保持を増やし、デストロイモードや覚醒状態で攻撃性能と防御性能が上がる。"
      }
    }
  };
}

export function executeCpuUnicornSpecial(state, specialKey, context = {}) {
  return executeUnicornSpecial(state, specialKey, context);
}

export function onCpuUnicornBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuUnicornState(state);

  const enemyState = context.enemyState;
  const messages = [];

  const actionCountMarker = Number(state.actionCount || 0);

  if (state.cpuUnicornTurnTickedActionCount !== actionCountMarker) {
    state.cpuUnicornTurnTickedActionCount = actionCountMarker;

    if (isAwaken(state)) {
      healRuleHp(state, 20, context);
      messages.push("CPUユニコーン：覚醒回復20");

      const awaken = getStateEffect(state, "unicorn_awaken");

      if (awaken && typeof awaken.turns === "number") {
        if (awaken.skipNextTick) {
          awaken.skipNextTick = false;
        } else {
          awaken.turns -= 1;
          state.unicornResonanceStock = Math.max(0, state.unicornResonanceStock - 1);
        }

        if (awaken.turns <= 0) {
          state.unicornResonanceStock = 0;
          returnToDestroy(state);
          messages.push("覚醒終了。デストロイモードへ移行");
        }
      }
    } else {
      const ntd = getStateEffect(state, "unicorn_ntd");

      if (isDestroy(state) && ntd && typeof ntd.turns === "number") {
        if (ntd.skipNextTick) {
          ntd.skipNextTick = false;
        } else {
          ntd.turns -= 1;
        }

        if (ntd.turns <= 0) {
          returnToUnicorn(state);
          messages.push("NT-D終了。ユニコーンモードへ戻った。");
        }
      }
    }
  }

  if (enemyState && hasBoostStateEffect(enemyState) && !state.cpuUnicornBoostSeen) {
    state.cpuUnicornBoostSeen = true;
    state.unicornResonanceStock += 1;

    if (!isDestroy(state) && !isAwaken(state)) {
      if (Math.random() < 0.5) {
        enterDestroy(state, 5);
        messages.push("CPUユニコーン：強化反応。NT-D発動");
      } else {
        messages.push("CPUユニコーン：強化反応不発。覚醒保持+1");
      }
    } else if (isDestroy(state)) {
      if (Math.random() < 0.5) {
        enterAwaken(state);
        messages.push("CPUユニコーン：強化反応。覚醒");
      } else {
        const ntd = getStateEffect(state, "unicorn_ntd");
        if (ntd && typeof ntd.turns === "number") {
          ntd.turns += 1;
        }
        messages.push("CPUユニコーン：NT-D残ターン+1。覚醒保持+1");
      }
    }
  }

  if (enemyState && !hasBoostStateEffect(enemyState)) {
    state.cpuUnicornBoostSeen = false;
  }

  if (isDestroy(state) && !isAwaken(state) && state.unicornResonanceStock > 0) {
    if (Math.random() < 0.05) {
      enterAwaken(state);
      messages.push("CPUユニコーン：覚醒保持値に反応。覚醒");
    }
  }

  const cost = isDestroy(state) && !isAwaken(state) ? 2 : 1;
  const stockMessage = consumeEvadeForStockByRate(state, cost, context);

  if (stockMessage) {
    messages.push(`CPUユニコーン：${stockMessage}`);
  }

  return {
    redraw: messages.length > 0,
    message: messages.length > 0 ? messages.join("\n") : null
  };
}

export function onCpuUnicornAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureCpuUnicornState(state);

  const result = payload.resolveResult;

  if (result?.customEffectId === "unicorn_ntd_activate") {
    enterDestroy(state, 5);

    return {
      redraw: true,
      message: "NT-D発動。5ターン間デストロイモード"
    };
  }

  if (result?.customEffectId === "unicorn_rush") {
    const count = Math.max(0, getRuleEvade(state, payload));

    return {
      redraw: false,
      appendAttacks: createAttack(40, count, {
        type: "melee",
        source: "乱撃"
      }),
      message: `乱撃：40ダメージ×${count}回`
    };
  }

  if (result?.customEffectId === "unicorn_double_evade") {
    doubleRuleEvadeRedCap(state, payload);

    return {
      redraw: true,
      message: "回避所持数倍加"
    };
  }

  return onUnicornAfterSlotResolved(state, slotNumber, payload);
}

export function onCpuUnicornActionResolved(attacker, defender, context = {}) {
  ensureCpuUnicornState(attacker);

  const hitCount = Number(context.hitCount || 0);

  if (hitCount <= 0) {
    return {
      redraw: false,
      message: null
    };
  }

  const slotNumber = Number(context.slotNumber || 0);
  const slotLabel = context.slotLabel || "";

  if (slotLabel.includes("ビームマグナム")) {
    consumeEnemyRuleEvade(defender, 1, context);

    return {
      redraw: true,
      message: `${defender.name}の回避-1`
    };
  }

  if (isDestroy(attacker) && slotNumber === 4) {
    const dispel = executeUnitDispelBoostState(defender, attacker, {
      source: "波動"
    });

    addRuleAction(attacker, 1, context);

    return {
      redraw: true,
      message: dispel?.message
        ? `波動：${dispel.message}\n${attacker.name}の行動権+1`
        : `波動：${attacker.name}の行動権+1`
    };
  }

  if (isAwaken(attacker) && slotNumber === 5 && hitCount >= 5) {
    return {
      redraw: false,
      appendAttacks: createAttack(100, 1, {
        type: "melee",
        source: "ソフトチェストタッチ追撃"
      }),
      appendSlotLabel: "ソフトチェストタッチ追撃",
      message: "フルヒット追撃：100ダメージ"
    };
  }

  if (isAwaken(attacker) && slotNumber === 6) {
    if (defender) {
      zeroEnemyRuleEvade(defender, context);

      setStateEffect(defender, "unicorn_light_damage_half", {
        turns: 5,
        skipNextTick: true
      });
    }

    const dispel = executeUnitDispelBoostState(defender, attacker, {
      source: "光"
    });

    addRuleAction(attacker, 2, context);

    return {
      redraw: true,
      message: dispel?.message
        ? `光：${defender.name}の回避を0にした。\n${dispel.message}\n${attacker.name}の行動権+2`
        : `光：${defender.name}の回避を0にした。\n${attacker.name}の行動権+2`
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onCpuUnicornTurnEnd(state, context = {}) {
  ensureCpuUnicornState(state);
  state.cpuUnicornTurnTickedActionCount = -1;

  return {
    redraw: false,
    message: null
  };
}

export function modifyCpuUnicornTakenDamage(defender, attacker, attack, damage) {
  ensureCpuUnicornState(defender);

  if ((isDestroy(defender) || isAwaken(defender)) && isPsychommuAttack(attack)) {
    return {
      damage: 0,
      message: `${defender.name}はサイコミュ系攻撃を無効化した`
    };
  }

  let finalDamage = damage;

  if (getStateEffect(defender, "unicorn_light_damage_half")) {
    finalDamage = Math.floor(finalDamage / 2);
  }

  if (!isDestroy(defender) && !isAwaken(defender) && Math.random() < 0.1) {
    finalDamage = Math.floor(finalDamage / 2);

    return {
      damage: finalDamage,
      message: "ユニコーン特性：ダメージ半減"
    };
  }

  if (isDestroy(defender) && Math.random() < 0.3) {
    finalDamage = Math.floor(finalDamage / 2);

    return {
      damage: finalDamage,
      message: "デストロイモード特性：ダメージ半減"
    };
  }

  if (isAwaken(defender) && Math.random() < 0.75 && !attack.ignoreReduction) {
    finalDamage = Math.floor(finalDamage / 2);

    return {
      damage: finalDamage,
      message: "シールドファンネル：ダメージ半減"
    };
  }

  return modifyUnicornTakenDamage(defender, attacker, attack, finalDamage);
}

export function modifyCpuUnicornEvadeAttempt(defender, attacker, attack, context = {}) {
  return {
    handled: false
  };
}

export function onCpuUnicornDamaged(defender, attacker, context = {}) {
  ensureCpuUnicornState(defender);
  return onUnicornDamaged(defender, attacker, context);
}

export function onCpuUnicornDispelBoostState(state, source, context = {}) {
  return onUnicornDispelBoostState(state, source, context);
}
