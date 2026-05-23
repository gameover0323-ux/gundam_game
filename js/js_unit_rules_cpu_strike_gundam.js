import { createAttack } from "./js_battle_system.js";
import { setForm, getStateEffect, setStateEffect, clearStateEffect } from "./js_unit_runtime.js";
import { resolveSlotEffect } from "./js_slot_effects.js";

import {
  getStrikeDerivedState,
  executeStrikeSpecial,
  onStrikeTurnEnd,
  onStrikeBeforeSlot,
  onStrikeEnemyBeforeSlot,
  onStrikeAfterSlotResolved,
  onStrikeActionResolved,
  onStrikeDamaged,
  modifyStrikeTakenDamage,
  modifyStrikeEvadeAttempt,
  onStrikeResolveChoice
} from "./js_unit_rules_strike_gundam.js";

const CPU_STRIKE_FORMS = ["base", "aile", "sword", "launcher"];
const SHORT_DECISIVE_BATTLE_LIMIT = 3;

function ensureCpuStrikeState(state) {
  if (typeof state.cpuStrikeTurnCount !== "number") state.cpuStrikeTurnCount = 0;
  if (typeof state.cpuStrikeInitialPackRolled !== "boolean") state.cpuStrikeInitialPackRolled = false;
  if (typeof state.cpuStrikePackCheckThisTurn !== "boolean") state.cpuStrikePackCheckThisTurn = false;

  if (typeof state.cpuStrikeSwordIssenUsed !== "boolean") state.cpuStrikeSwordIssenUsed = false;
  if (typeof state.cpuStrikeSwordAwakened !== "boolean") state.cpuStrikeSwordAwakened = false;
  if (typeof state.cpuStrikeShortBattleUsedThisSlot !== "number") state.cpuStrikeShortBattleUsedThisSlot = 0;

  if (typeof state.cpuStrikeLauncherRecoilTurns !== "number") state.cpuStrikeLauncherRecoilTurns = 0;
  if (typeof state.cpuStrikeLauncherDamageVulnerable !== "boolean") state.cpuStrikeLauncherDamageVulnerable = false;
  if (typeof state.cpuStrikeAgniOutputBonus !== "number") state.cpuStrikeAgniOutputBonus = 0;
  if (typeof state.cpuStrikeAgniFullChargeUsedThisTurn !== "boolean") state.cpuStrikeAgniFullChargeUsedThisTurn = false;
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

function getEnemyRuleEvade(context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);
  const enemyState = context.enemyState;

  if (adapter?.getEvade && enemyPlayer) {
    return adapter.getEvade(enemyPlayer, enemyState);
  }

  return Math.max(0, Number(enemyState?.evade || 0));
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

function consumeEnemyRuleEvade(defender, amount, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.consumeEvade && enemyPlayer) {
    return adapter.consumeEvade(enemyPlayer, defender, amount);
  }

  if (!defender) return false;
  defender.evade = Math.max(0, Number(defender.evade || 0) - amount);
  return true;
}

function zeroRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.zeroEvade && ownerPlayer) {
    return adapter.zeroEvade(ownerPlayer, state);
  }

  if (state) state.evade = 0;
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

function consumeRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeAction && ownerPlayer) {
    return adapter.consumeAction(ownerPlayer, state, amount);
  }

  if (!state || Number(state.actionCount || 0) < amount) return false;
  state.actionCount = Math.max(0, Number(state.actionCount || 0) - amount);
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

function consumeRuleHp(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeHp && ownerPlayer) {
    return adapter.consumeHp(ownerPlayer, state, amount);
  }

  if (!state || Number(state.hp || 0) <= amount) return false;
  state.hp = Math.max(1, Number(state.hp || 0) - amount);
  return true;
}

function getSeedEffect(state) {
  return getStateEffect(state, "strike_seed");
}

function randomPackChange(state, context, messages) {
  if (state.strikePackLocked) return;
  if (state.cpuStrikePackCheckThisTurn) return;

  state.cpuStrikePackCheckThisTurn = true;

  const nextForm = CPU_STRIKE_FORMS[Math.floor(Math.random() * CPU_STRIKE_FORMS.length)];
  if (nextForm === state.formId) return;

  const changed = setForm(state, nextForm, {
    preserveHp: true,
    preserveEvade: true
  });

  if (changed) {
    state.strikePackFreeSelect = false;
    state.strikePackCooldown = 3;
    state.strikePackCooldownArmed = false;
    messages.push(`ストライクCPU特性：${state.name}へ換装`);
  }
}

function getRandomSlotKey(state) {
  const keys = state.rollableSlotOrder || Object.keys(state.slots || {});
  if (!keys.length) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

function addResult(total, next) {
  if (!next) return;
  if (Array.isArray(next.appendAttacks)) total.appendAttacks.push(...next.appendAttacks);
  if (Array.isArray(next.appendMessages)) total.appendMessages.push(...next.appendMessages);
}

function resolveAdditionalSlot(state, slotKey, context = {}) {
  const slot = state.slots?.[slotKey];
  const appendAttacks = [];
  const appendMessages = [];

  if (!slot) return { appendAttacks, appendMessages };

  const slotNumber = Number(String(slotKey).replace(/^slot/, ""));
  const result = resolveSlotEffect({
    slot,
    actor: state,
    context
  });

  if (result.kind === "attack") {
    appendAttacks.push(...result.attacks);
    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
    return { appendAttacks, appendMessages };
  }

  if (result.kind === "heal" || result.kind === "evade") {
    if (result.message) appendMessages.push(result.message);
    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
    return { appendAttacks, appendMessages };
  }

  if (result.kind === "custom") {
    const hook = onStrikeAfterSlotResolved(state, slotNumber, {
      ...context,
      slot,
      slotKey,
      resolveResult: result
    });

    if (hook?.appendAttacks) appendAttacks.push(...hook.appendAttacks);
    if (hook?.message) appendMessages.push(hook.message);

    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
    return { appendAttacks, appendMessages };
  }

  appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
  return { appendAttacks, appendMessages };
}

export function getCpuStrikeDerivedState(state) {
  ensureCpuStrikeState(state);

  const derived = getStrikeDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：戦況に応じて換装"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_strike_traits",
        timing: "auto",
        actionType: "auto",
        desc: "戦況に応じてストライカーパックを換装する。エールは回避と回復、ソードは連続行動、ランチャーは高火力射撃を狙う。PS装甲で実弾や格闘に強い。"
      }
    }
  };
}

export function executeCpuStrikeSpecial(state, specialKey, context = {}) {
  return executeStrikeSpecial(state, specialKey, context);
}

export function onCpuStrikeBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuStrikeState(state);

  const messages = [];
  let redraw = false;

  state.cpuStrikeShortBattleUsedThisSlot = 0;

  const baseResult = onStrikeBeforeSlot(state, rolledSlotNumber, context) || {
    redraw: false,
    message: null
  };

  if (baseResult.message) messages.push(baseResult.message);
  redraw = baseResult.redraw || redraw;

  if (!state.cpuStrikeInitialPackRolled) {
    state.cpuStrikeInitialPackRolled = true;
    randomPackChange(state, context, messages);
    redraw = true;
  }

  if (state.formId === "aile" && !state.strikeOsCheckUsedThisTurn && getRuleEvade(state, context) > 0) {
    const rate = Math.min(1, getRuleEvade(state, context) / Math.max(1, Number(state.evadeMax || 1)));

    if (Math.random() < rate) {
      consumeRuleEvade(state, 1, context);
      healRuleHp(state, 20, context);
      state.strikeOsCheckUsedThisTurn = true;
      messages.push("エール特性：OSチェック 回避-1/20回復");
      redraw = true;
    }
  }

  if (state.formId === "sword" && !state.cpuStrikeSwordAwakened) {
    const seed = getSeedEffect(state);

    if (state.evadeMax >= 10 && seed && state.cpuStrikeTurnCount >= 15 && Math.random() < 0.7) {
      state.cpuStrikeSwordAwakened = true;
      state.strikeSwordAwakened = true;
      state.strikePackLocked = true;
      state.strikePackCooldown = 999;
      messages.push("ソード特性：覚醒。以後ソードストライクから換装しない");
      redraw = true;
    }
  }

  if (state.formId === "launcher" && state.cpuStrikeLauncherRecoilTurns > 0) {
    state.cpuStrikeLauncherRecoilTurns -= 1;

    return {
      redraw: true,
      message: "ランチャー特性：アグニ反動でこのターン行動不能",
      cancelSlot: true
    };
  }

  if (state.formId === "launcher" && rolledSlotNumber === 6) {
    const enemy = context.enemyState;

    if (enemy && enemy.hp <= Math.floor(Number(state.hp || 0) / 4) && Number(state.hp || 0) > 1) {
      const hpCost = Number(state.hp || 0) - 1;
      consumeRuleHp(state, hpCost, context);
      state.cpuStrikeAgniOutputBonus = Math.floor(hpCost / 2);
      messages.push(`ランチャー特性：アグニ出力解放 追撃${state.cpuStrikeAgniOutputBonus}ダメージ待機`);
      redraw = true;
    }
  }

  return {
    redraw,
    message: messages.join("\n") || null
  };
}

export function onCpuStrikeAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuStrikeState(state);
  return onStrikeAfterSlotResolved(state, slotNumber, context);
}

export function onCpuStrikeActionResolved(attacker, defender, context = {}) {
  ensureCpuStrikeState(attacker);

  const baseResult = onStrikeActionResolved(attacker, defender, context) || {
    redraw: false,
    message: null
  };

  const messages = [];
  let redraw = baseResult.redraw;

  if (baseResult.message) messages.push(baseResult.message);

  if (attacker.formId === "sword") {
    if (context.slotNumber === 4 && context.hitCount > 0) {
      addRuleAction(attacker, 1, context);
      setStateEffect(attacker, "cpu_strike_anchor_sure_hit", {
        turns: 1,
        pendingActivation: true
      });
      messages.push("アンカー捕縛：行動回数+1 / 次攻撃必中待機");
      redraw = true;
    }

    if (
      (context.slotNumber === 6 || context.slotNumber === 1) &&
      context.totalCount > 0 &&
      context.hitCount === context.totalCount &&
      getEnemyRuleEvade({ ...context, enemyState: defender }) > 0
    ) {
      consumeEnemyRuleEvade(defender, 1, context);
      messages.push("ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制効果：相手回避-1");
      redraw = true;
    }
  }

  return {
    redraw,
    message: messages.join("\n") || null
  };
}

export function getCpuStrikeExtraWeaponResult(state, context = {}) {
  ensureCpuStrikeState(state);

  const total = {
    appendAttacks: [],
    appendMessages: [],
    redraw: true
  };

  if (state.formId === "sword" && !state.cpuStrikeSwordIssenUsed) {
    const enemy = context.enemyState;

    if (enemy && enemy.hp <= 100 && getEnemyRuleEvade(context) <= 0 && Math.random() < 0.5) {
      state.cpuStrikeSwordIssenUsed = true;
      state.strikeSwordIssenUsed = true;
      state.strikeSwordNoEvade = true;

      total.appendAttacks.push(...createAttack(200, 1, {
        type: "melee",
        source: "cpu_strike_issen"
      }));

      total.appendMessages.push("ソード特性：一閃 200ダメージ");
    }
  }

  if (state.formId === "sword" && state.strikeSwordAwakened) {
    while (
      getRuleEvade(state, context) >= 1 &&
      state.cpuStrikeShortBattleUsedThisSlot < SHORT_DECISIVE_BATTLE_LIMIT
    ) {
      consumeRuleEvade(state, 1, context);
      state.cpuStrikeShortBattleUsedThisSlot += 1;
      state.strikeShortBattleUsedThisTurn = state.cpuStrikeShortBattleUsedThisSlot;

      const slotKey = getRandomSlotKey(state);
      addResult(total, resolveAdditionalSlot(state, slotKey, context));

      total.appendMessages.push(
        `短期決戦：回避-1 追加行動（${state.cpuStrikeShortBattleUsedThisSlot}/${SHORT_DECISIVE_BATTLE_LIMIT}）`
      );
    }
  }

  if (state.formId === "launcher") {
    const enemy = context.enemyState;

    if (enemy && getEnemyRuleEvade(context) <= 0 && getRuleEvade(state, context) >= 2 && Math.random() < 0.5) {
      consumeRuleEvade(state, 2, context);
      state.cpuStrikeLauncherRecoilTurns = 1;
      state.cpuStrikeLauncherDamageVulnerable = true;
      state.strikeLauncherRecoilTurns = Math.max(1, Number(state.strikeLauncherRecoilTurns || 0));

      total.appendAttacks.push(...createAttack(200, 1, {
        type: "shoot",
        source: "cpu_strike_agni_full_charge",
        ignoreReduction: true
      }));

      total.appendMessages.push("ランチャー特性：アグニ(フルチャージ) 200ダメージ");
    }

    if (state.cpuStrikeAgniOutputBonus > 0) {
      total.appendAttacks.push(...createAttack(state.cpuStrikeAgniOutputBonus, 1, {
        type: "shoot",
        source: "cpu_strike_agni_output_bonus"
      }));

      total.appendMessages.push(`ランチャー特性：アグニ出力解放 追撃${state.cpuStrikeAgniOutputBonus}ダメージ`);
      state.cpuStrikeAgniOutputBonus = 0;
    }
  }

  if (total.appendAttacks.length === 0 && total.appendMessages.length === 0) {
    return null;
  }

  return total;
}

export function onCpuStrikeTurnEnd(state, context = {}) {
  ensureCpuStrikeState(state);

  const messages = [];
  let redraw = false;

  state.cpuStrikeTurnCount += 1;
  state.cpuStrikePackCheckThisTurn = false;
  state.cpuStrikeAgniFullChargeUsedThisTurn = false;

  const baseResult = onStrikeTurnEnd(state, context) || {
    redraw: false,
    message: null
  };

  if (baseResult.message) messages.push(baseResult.message);
  redraw = baseResult.redraw || redraw;

  if (!state.strikePackLocked && state.cpuStrikeTurnCount > 0 && state.cpuStrikeTurnCount % 3 === 0) {
    randomPackChange(state, context, messages);
    redraw = true;
  }

  return {
    redraw: redraw || messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function modifyCpuStrikeTakenDamage(defender, attacker, attack, damage) {
  ensureCpuStrikeState(defender);
  return modifyStrikeTakenDamage(defender, attacker, attack, damage);
}

export function modifyCpuStrikeEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuStrikeState(defender);
  return modifyStrikeEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuStrikeEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return onStrikeEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuStrikeDamaged(defender, attacker, context = {}) {
  ensureCpuStrikeState(defender);
  return onStrikeDamaged(defender, attacker, context);
}

export function onCpuStrikeResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuStrikeState(state);
  return onStrikeResolveChoice(state, pendingChoice, selectedValue, context);
}
