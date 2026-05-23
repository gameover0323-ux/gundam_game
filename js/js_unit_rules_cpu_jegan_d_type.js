import { setForm } from "./js_unit_runtime.js";

import {
  getJeganDerivedState,
  onJeganTurnEnd,
  onJeganBeforeSlot,
  onJeganEnemyBeforeSlot,
  onJeganAfterSlotResolved,
  onJeganActionResolved,
  onJeganDamaged,
  modifyJeganTakenDamage,
  modifyJeganEvadeAttempt,
  onJeganResolveChoice
} from "./js_unit_rules_jegan_d_type.js";

function chance(rate) {
  return Math.random() < rate;
}

function ensureCpuJeganState(state) {
  if (!state) return;

  if (typeof state.jeganCpuLog !== "string") state.jeganCpuLog = "";
  if (typeof state.jeganForcedActionReady !== "boolean") state.jeganForcedActionReady = false;
  if (typeof state.jeganTurnCount !== "number") state.jeganTurnCount = 0;
  if (typeof state.jeganStarkTurns !== "number") state.jeganStarkTurns = 0;
  if (typeof state.jeganEscortTurns !== "number") state.jeganEscortTurns = 0;
  if (typeof state.jeganSlot6Mode !== "string") state.jeganSlot6Mode = "stark";
  if (typeof state.jeganStarkRightUsed !== "boolean") state.jeganStarkRightUsed = false;
  if (typeof state.jeganEscortRightUsed !== "boolean") state.jeganEscortRightUsed = false;
  if (typeof state.jeganEwacBroken !== "boolean") state.jeganEwacBroken = false;
  if (typeof state.jeganEwacEscapeUsed !== "boolean") state.jeganEwacEscapeUsed = false;
  if (typeof state.jeganLimiterTurns !== "number") state.jeganLimiterTurns = 0;
  if (typeof state.jeganLimiterRestTurns !== "number") state.jeganLimiterRestTurns = 0;
  if (typeof state.jeganStarkLimiterActive !== "boolean") state.jeganStarkLimiterActive = false;
  if (typeof state.jeganShieldHalfCount !== "number") state.jeganShieldHalfCount = 3;
  if (typeof state.jeganShieldActive !== "boolean") state.jeganShieldActive = false;
  if (typeof state.jeganBarrierTurns !== "number") state.jeganBarrierTurns = 0;
  if (typeof state.jeganEwacSupportFireCount !== "number") state.jeganEwacSupportFireCount = 0;
  if (typeof state.jeganEwacSupportFireUsedThisTurn !== "boolean") state.jeganEwacSupportFireUsedThisTurn = false;
  if (typeof state.jeganEwacGrenadeBonus !== "number") state.jeganEwacGrenadeBonus = 0;

  if (!state.stateEffects) state.stateEffects = {};
  if (!Array.isArray(state.pendingReservedActions)) state.pendingReservedActions = [];
}

function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function addLog(messages, text) {
  if (text) messages.push(text);
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

function addRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, amount);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + amount;
  return amount;
}

function setRuleEvadeExact(state, amount, context = {}) {
  const value = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.zeroEvade && adapter?.getOwnerTeam && ownerPlayer && adapter.isUnifiedOwner?.(ownerPlayer)) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    adapter.zeroEvade(ownerPlayer, state);

    if (team?.unit1 === state) {
      team.unit1.evade = value;
    } else if (team?.unit2 === state) {
      team.unit2.evade = value;
    } else if (team?.unit1) {
      team.unit1.evade = value;
    }

    return true;
  }

  if (state) state.evade = value;
  return true;
}

function getRuleActionCount(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getActionCount && ownerPlayer) {
    return adapter.getActionCount(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.actionCount || 0));
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

function addRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, amount);
  }

  state.actionCount = Math.max(0, Number(state.actionCount || 0)) + amount;
  return amount;
}

function setRuleActionAtLeast(state, amount, context = {}) {
  const current = getRuleActionCount(state, context);
  if (current >= amount) return 0;
  return addRuleAction(state, amount - current, context);
}

function consumeRuleHpKeepAlive(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeHp && adapter?.getUnifiedHp && adapter?.getOwnerTeam && ownerPlayer && adapter.isUnifiedOwner?.(ownerPlayer)) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    if (adapter.getUnifiedHp(team) <= amount) return false;
    return adapter.consumeHp(ownerPlayer, state, amount);
  }

  if (!state || Number(state.hp || 0) <= amount) return false;
  state.hp = Math.max(1, Number(state.hp || 0) - amount);
  return true;
}

function healRuleHp(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, amount);
  }

  state.hp = Math.min(Number(state.maxHp || 0), Number(state.hp || 0) + amount);
  return amount;
}

function hasPendingEwacSupportFire(state) {
  return Array.isArray(state.pendingReservedActions) &&
    state.pendingReservedActions.some(action => String(action?.id || "").startsWith("cpu_jegan_ewac_support_"));
}

function reserveEwacSupportFire(state, context, messages) {
  if (state.jeganEwacSupportFireCount >= 3) return;
  if (state.jeganEwacSupportFireUsedThisTurn) return;
  if (hasPendingEwacSupportFire(state)) return;

  state.jeganEwacSupportFireCount += 1;
  state.jeganEwacSupportFireUsedThisTurn = true;

  state.pendingReservedActions.push({
    id: `cpu_jegan_ewac_support_${state.jeganEwacSupportFireCount}`,
    delay: 3,
    trigger: "turn_start",
    ownerPlayer: context.ownerPlayer,
    enemyPlayer: context.enemyPlayer,
    type: "attack",
    label: "EWAC捕捉・援護射撃 80ダメージ",
    attacks: [
      {
        damage: 80,
        type: "shoot",
        beam: false,
        cannotEvade: false,
        ignoreReduction: false,
        ignoreDefense: false,
        addedBeam: false,
        addedCannotEvade: false,
        addedIgnoreReduction: false,
        special: null,
        source: "EWAC捕捉・援護射撃",
        onHit: null,
        moonlightButterfly: false,
        minEvadeRequired: 0
      }
    ]
  });

  addLog(messages, "CPUジェガンD型：捕捉・援護射撃を予約");
}

function cpuEquipEwac(state, messages, context) {
  if (state.jeganEwacBroken) return;
  if (!consumeRuleAction(state, 1, context)) return;

  setForm(state, "ewac", { preserveHp: true, preserveEvade: true });
  addLog(messages, "CPUジェガンD型：EWACを装備");
}

function cpuBaseLimiter(state, messages, context) {
  if (state.jeganLimiterTurns > 0) return;
  if (state.jeganLimiterRestTurns > 0) return;
  if (!consumeRuleHpKeepAlive(state, 120, context)) return;

  state.jeganLimiterTurns = 3;
  state.baseActionCount = 2;
  setRuleActionAtLeast(state, 2, context);

  addLog(messages, "CPUジェガンD型：リミッター解除");
}

function cpuSwitchSlot6(state, messages) {
  state.jeganSlot6Mode = state.jeganSlot6Mode === "stark" ? "escort" : "stark";
  addLog(
    messages,
    state.jeganSlot6Mode === "stark"
      ? "CPUジェガンD型：6をスターク換装へ切替"
      : "CPUジェガンD型：6EXをエスコート換装へ切替"
  );
}

function cpuStarkAccel(state, messages, context) {
  while (getRuleEvade(state, context) >= 4 && chance(0.5)) {
    consumeRuleEvade(state, 4, context);
    addRuleAction(state, 1, context);
    addLog(messages, "CPUスタークジェガン：加速 回避-4 行動権+1");
  }
}

function cpuStarkLimiter(state, messages, context) {
  if (state.jeganStarkLimiterActive) return;

  const maxHp = Math.max(1, Number(state.maxHp || 450));
  const hpRate = Math.max(0, Math.min(1, Number(state.hp || 0) / maxHp));

  if (!chance(hpRate)) return;
  if (!consumeRuleHpKeepAlive(state, 120, context)) return;

  const currentRedCap = state.overEvadeMode && typeof state.overEvadeCap === "number"
    ? state.overEvadeCap
    : Number(state.evadeMax || 0);

  const nextEvadeMax = Math.max(1, currentRedCap) * 2;
  const nextEvade = getRuleEvade(state, context) * 2;

  addRuleAction(state, 1, context);
  setRuleEvadeExact(state, nextEvade, context);

  state.overEvadeMode = true;
  state.overEvadeCap = nextEvadeMax;
  state.overEvadeBaseMax = state.evadeMax;
  state.overEvadeAbsoluteMax = null;
  state.jeganStarkLimiterActive = true;

  addLog(messages, `CPUスタークジェガン：リミッター解除 赤上限${nextEvadeMax} 所持回避${nextEvade}`);
}

function cpuStarkDisturb(state, messages, context) {
  if (getRuleEvade(state, context) > 1) return;
  if (!consumeRuleAction(state, 1, context)) return;

  addRuleEvade(state, 3, context);
  addLog(messages, "CPUスタークジェガン：撹乱 回避+3");
}

function cpuEscortAssault(state, messages, context) {
  if (getRuleEvade(state, context) < 2) return;
  if (!chance(0.5)) return;

  consumeRuleEvade(state, 2, context);
  addRuleAction(state, 1, context);

  addLog(messages, "CPUエスコートジェガン：強襲 回避-2 行動権+1");
}

function cpuEwacHeal(state, messages, context) {
  if (!chance(0.05)) return;

  healRuleHp(state, 100, context);
  addLog(messages, "CPU EWAC：索敵予測相当 HP100回復");
}

function activateCpuShield(state, rate, messages, label) {
  if (state.jeganShieldHalfCount <= 0) return;
  if (state.jeganShieldActive) return;
  if (!chance(rate)) return;

  state.jeganShieldHalfCount -= 1;
  state.jeganShieldActive = true;

  addLog(messages, `${label}：シールド半減を起動`);
}

function abandonArmRightForBarrier(state, messages) {
  if (state.formId !== "base") return false;

  if (!state.jeganStarkRightUsed && state.jeganSlot6Mode === "stark") {
    state.jeganStarkRightUsed = true;
    state.jeganSlot6Mode = "escort";
    state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);
    addLog(messages, "CPUジェガンD型：6使用権を放棄して全ダメージ無効");
    return true;
  }

  if (!state.jeganEscortRightUsed && state.jeganSlot6Mode === "escort") {
    state.jeganEscortRightUsed = true;
    state.jeganSlot6Mode = "stark";
    state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);
    addLog(messages, "CPUジェガンD型：6EX使用権を放棄して全ダメージ無効");
    return true;
  }

  if (!state.jeganStarkRightUsed) {
    state.jeganStarkRightUsed = true;
    state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);
    addLog(messages, "CPUジェガンD型：6使用権を放棄して全ダメージ無効");
    return true;
  }

  if (!state.jeganEscortRightUsed) {
    state.jeganEscortRightUsed = true;
    state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);
    addLog(messages, "CPUジェガンD型：6EX使用権を放棄して全ダメージ無効");
    return true;
  }

  return false;
}

function cpuEwacEscapeIfNeeded(state, incomingDamage, messages) {
  if (state.formId !== "ewac") return false;
  if (state.jeganEwacEscapeUsed) return false;

  const lethalOrCritical = Number(state.hp || 0) - Number(incomingDamage || 0) <= 50;
  if (!lethalOrCritical && !chance(0.05)) return false;

  state.jeganEwacEscapeUsed = true;
  state.jeganEwacBroken = true;
  state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);
  setForm(state, "base", { preserveHp: true, preserveEvade: true });

  addLog(messages, "CPU EWAC：離脱解除 全ダメージ無効・EWAC破棄");
  return true;
}

export function getCpuJeganDerivedState(state) {
  ensureCpuJeganState(state);

  const derived = getJeganDerivedState(state);

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：装備を使い分ける"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_jegan_traits",
        timing: "auto",
        actionType: "auto",
        desc: "状況に応じてEWAC・スターク・エスコート装備を使い分ける。リミッター解除や援護射撃、シールド、防御バリアで粘り強く戦う。"
      }
    }
  };
}

export function onCpuJeganBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuJeganState(state);

  const baseResult = onJeganBeforeSlot(state, rolledSlotNumber, context) || {};
  const messages = [];

  addLog(messages, baseResult.message);

  if (baseResult.cancelSlot) {
    return {
      ...baseResult,
      message: messages.join(" / ") || baseResult.message || null
    };
  }

  if (state.formId === "base") {
    if (!state.jeganEwacBroken && chance(0.2)) cpuEquipEwac(state, messages, context);
    if (state.formId === "base" && chance(0.5)) cpuBaseLimiter(state, messages, context);
    if (state.formId === "base" && chance(0.5)) cpuSwitchSlot6(state, messages);
  }

  if (state.formId === "stark") {
    cpuStarkAccel(state, messages, context);
    cpuStarkLimiter(state, messages, context);
    cpuStarkDisturb(state, messages, context);
  }

  if (state.formId === "ewac") {
    if (chance(0.5)) reserveEwacSupportFire(state, context, messages);
    cpuEwacHeal(state, messages, context);
  }

  if (state.formId === "escort") {
    cpuEscortAssault(state, messages, context);
  }

  return {
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join(" / ") || null,
    cancelSlot: baseResult.cancelSlot === true
  };
}

export function onCpuJeganEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuJeganState(state);
  return onJeganEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuJeganAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuJeganState(state);
  return onJeganAfterSlotResolved(state, slotNumber, context);
}

export function onCpuJeganActionResolved(attacker, defender, context = {}) {
  ensureCpuJeganState(attacker);
  return onJeganActionResolved(attacker, defender, context);
}

export function onCpuJeganDamaged(defender, attacker, context = {}) {
  ensureCpuJeganState(defender);
  return onJeganDamaged(defender, attacker, context);
}

export function onCpuJeganTurnEnd(state, context = {}) {
  ensureCpuJeganState(state);
  return onJeganTurnEnd(state, context);
}

export function modifyCpuJeganTakenDamage(defender, attacker, attack, damage) {
  ensureCpuJeganState(defender);

  const messages = [];

  if (cpuEwacEscapeIfNeeded(defender, damage, messages)) {
    return {
      damage: 0,
      cancelled: true,
      message: messages.join(" / ")
    };
  }

  if (defender.formId === "base" && Number(defender.hp || 0) - Number(damage || 0) <= 0) {
    if (abandonArmRightForBarrier(defender, messages)) {
      return {
        damage: 0,
        cancelled: true,
        message: messages.join(" / ")
      };
    }
  }

  if (defender.formId === "base") {
    activateCpuShield(defender, 0.2, messages, "CPUジェガンD型");
  } else if (defender.formId === "stark") {
    activateCpuShield(defender, 0.25, messages, "CPUスタークジェガン");
  } else if (defender.formId === "escort") {
    activateCpuShield(defender, 0.15, messages, "CPUエスコートジェガン");
  }

  const baseResult = modifyJeganTakenDamage(defender, attacker, attack, damage) || {
    damage,
    message: null
  };

  addLog(messages, baseResult.message);

  return {
    ...baseResult,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function modifyCpuJeganEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuJeganState(defender);
  return modifyJeganEvadeAttempt(defender, attacker, attack, context);
}

export function onCpuJeganResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuJeganState(state);
  return onJeganResolveChoice(state, pendingChoice, selectedValue, context);
}
