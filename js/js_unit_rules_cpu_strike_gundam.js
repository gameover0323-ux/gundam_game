import { createAttack } from "./js_battle_system.js";
import { setForm, getStateEffect, setStateEffect, clearStateEffect } from "./js_unit_runtime.js";
import { resolveSlotEffect } from "./js_slot_effects.js";

const CPU_STRIKE_FORMS = ["base", "aile", "sword", "launcher"];

function ensureCpuStrikeState(state) {
  if (typeof state.cpuStrikeTurnCount !== "number") state.cpuStrikeTurnCount = 0;
  if (typeof state.cpuStrikeInitialPackRolled !== "boolean") state.cpuStrikeInitialPackRolled = false;

  if (typeof state.cpuStrikePsArmor !== "number") state.cpuStrikePsArmor = 300;
  if (typeof state.cpuStrikePsArmorBroken !== "boolean") state.cpuStrikePsArmorBroken = false;

  if (typeof state.cpuStrikeFullEvadeTurns !== "number") state.cpuStrikeFullEvadeTurns = 0;
  if (typeof state.cpuStrikeFullEvadePendingTurns !== "number") state.cpuStrikeFullEvadePendingTurns = 0;

  if (typeof state.cpuStrikeOsCheckUsedThisTurn !== "boolean") state.cpuStrikeOsCheckUsedThisTurn = false;
  if (typeof state.cpuStrikeShieldStock !== "number") state.cpuStrikeShieldStock = 3;
  if (typeof state.cpuStrikeShieldActive !== "boolean") state.cpuStrikeShieldActive = false;

  if (typeof state.cpuStrikeSwordIssenUsed !== "boolean") state.cpuStrikeSwordIssenUsed = false;
  if (typeof state.cpuStrikeSwordNoEvade !== "boolean") state.cpuStrikeSwordNoEvade = false;
  if (typeof state.cpuStrikeSwordAwakened !== "boolean") state.cpuStrikeSwordAwakened = false;
  if (typeof state.cpuStrikePackLocked !== "boolean") state.cpuStrikePackLocked = false;
  if (typeof state.cpuStrikeShortBattleUsedThisSlot !== "number") state.cpuStrikeShortBattleUsedThisSlot = 0;

  if (typeof state.cpuStrikeLauncherRecoilTurns !== "number") state.cpuStrikeLauncherRecoilTurns = 0;
  if (typeof state.cpuStrikeLauncherDamageVulnerable !== "boolean") state.cpuStrikeLauncherDamageVulnerable = false;
  if (typeof state.cpuStrikeAgniOutputBonus !== "number") state.cpuStrikeAgniOutputBonus = 0;
}

function getSeedEffect(state) {
  return getStateEffect(state, "cpu_strike_seed");
}

function cpuStrikeSetForm(state, formId) {
  if (state.cpuStrikePackLocked) return false;
  return setForm(state, formId, { preserveHp: true, preserveEvade: true });
}

function randomPackChange(state, messages) {
  if (state.cpuStrikePackLocked) return;
  const nextForm = CPU_STRIKE_FORMS[Math.floor(Math.random() * CPU_STRIKE_FORMS.length)];
  if (cpuStrikeSetForm(state, nextForm)) {
    messages.push(`ストライクCPU特性：${state.name}へ換装`);
  }
}

function applySeedToSlot(slot) {
  if (!slot || !slot.effect || slot.effect.type !== "attack") return slot;
  return {
    ...slot,
    effect: {
      ...slot.effect,
      cannotEvade: true,
      addedCannotEvade: true
    }
  };
}

function clampSwordNoEvade(state) {
  if (state.formId === "sword" && state.cpuStrikeSwordNoEvade) {
    state.evadeMax = 0;
    state.evade = 0;
    state.overEvadeMode = false;
    state.overEvadeCap = 0;
    state.overEvadeBaseMax = 0;
    state.overEvadeAbsoluteMax = 0;
  }
}

function addFullEvadePending(state, turns, evadeAmount) {
  state.cpuStrikeFullEvadePendingTurns = Math.max(state.cpuStrikeFullEvadePendingTurns, turns);
  state.evade = Math.min(state.evadeMax, state.evade + evadeAmount);
}

function resolveAdditionalSlot(state, slotKey) {
  const slot = state.slots?.[slotKey];
  const appendAttacks = [];
  const appendMessages = [];
  if (!slot) return { appendAttacks, appendMessages };

  const result = resolveSlotEffect({ slot, actor: state });
  const slotNumber = Number(String(slotKey).replace(/^slot/, ""));

  if (result.kind === "attack") {
    appendAttacks.push(...result.attacks);
    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
  } else if (result.kind === "heal" || result.kind === "evade") {
    if (result.message) appendMessages.push(result.message);
    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
  } else if (result.kind === "custom") {
    appendMessages.push(`ストライク追加行動：${slotNumber}.${slot.label}`);
  }

  return { appendAttacks, appendMessages };
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

export function getCpuStrikeDerivedState(state) {
  ensureCpuStrikeState(state);
  const result = { name: null, slots: {}, specials: {}, status: [] };

  if (state.cpuStrikePsArmorBroken) {
    result.status.push("PS装甲: フェイズシフトダウン");
  } else {
    result.status.push(`PS装甲: ${state.cpuStrikePsArmor}/300`);
  }

  if (state.cpuStrikeFullEvadeTurns > 0) result.status.push(`全攻撃回避:${state.cpuStrikeFullEvadeTurns}ターン`);
  if (state.cpuStrikeFullEvadePendingTurns > 0) result.status.push(`全攻撃回避待機:${state.cpuStrikeFullEvadePendingTurns}ターン`);

  const seed = getSeedEffect(state);
  if (seed && typeof seed.turns === "number") {
    result.status.push(`S.E.E.D覚醒 残${seed.turns}ターン`);
    Object.keys(state.baseSlots || {}).forEach((slotKey) => {
      const baseSlot = state.baseSlots[slotKey];
      if (baseSlot?.effect?.type === "attack") {
        result.slots[slotKey] = applySeedToSlot(baseSlot);
      }
    });
  }

  if (state.formId === "sword") {
    if (state.cpuStrikeSwordNoEvade) {
      result.slots.slot1 = {
        label: "1EX ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制 5ダメージ×6回",
        desc: "5ダメージ×6回。相手が回避を所持している場合、必ず回避を1回以上消費させる。射撃",
        effect: { type: "attack", damage: 5, count: 6, attackType: "shoot" },
        ex: true
      };
      result.status.push("一閃後: ソード回避上限0");
    }

    if (state.cpuStrikeSwordAwakened) {
      result.slots.slot3 = {
        label: "3EX 対艦刀ｼｭﾍﾞﾙﾄ・ｹﾞﾍﾞｰﾙ連撃 30ダメージ×3回",
        desc: "30ダメージ×3回。格闘",
        effect: { type: "attack", damage: 30, count: 3, attackType: "melee" },
        ex: true
      };
      result.status.push("ソード3EX解禁/換装封印");
    }
  }

  clampSwordNoEvade(state);
  return result;
}

export function onCpuStrikeBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuStrikeState(state);
  const messages = [];
  let redraw = false;

  state.cpuStrikeShortBattleUsedThisSlot = 0;

  if (!state.cpuStrikeInitialPackRolled) {
    state.cpuStrikeInitialPackRolled = true;
    randomPackChange(state, messages);
    redraw = true;
  }

  if (state.formId === "aile" && !state.cpuStrikeOsCheckUsedThisTurn && state.evade > 0) {
    const rate = Math.min(1, state.evade / Math.max(1, state.evadeMax));
    if (Math.random() < rate) {
      state.evade = Math.max(0, state.evade - 1);
      state.hp = Math.min(state.maxHp, state.hp + 20);
      state.cpuStrikeOsCheckUsedThisTurn = true;
      messages.push("エール特性：OSチェック 回避-1/20回復");
      redraw = true;
    }
  }

  if (state.formId === "sword" && !state.cpuStrikeSwordAwakened) {
    const seed = getSeedEffect(state);
    if (state.evadeMax >= 10 && seed && state.cpuStrikeTurnCount >= 15 && Math.random() < 0.7) {
      state.cpuStrikeSwordAwakened = true;
      state.cpuStrikePackLocked = true;
      messages.push("ソード特性：3EX解禁。以後ソードストライクから換装しない");
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
    if (enemy && enemy.hp <= Math.floor(state.hp / 4) && state.hp > 1) {
      const hpCost = state.hp - 1;
      state.hp = 1;
      state.cpuStrikeAgniOutputBonus = Math.floor(hpCost / 2);
      messages.push(`ランチャー特性：アグニ出力解放 追撃${state.cpuStrikeAgniOutputBonus}ダメージ待機`);
      redraw = true;
    }
  }

  return { redraw, message: messages.join("\n") || null };
}

export function onCpuStrikeAfterSlotResolved(state, slotNumber, context = {}) {
  ensureCpuStrikeState(state);
  const result = context.resolveResult || null;

  if (!result || result.kind !== "custom") return { redraw: false, message: null };

  if (result.customEffectId === "cpu_strike_next_turn_full_evade_1") {
    addFullEvadePending(state, 1, 1);
    return { redraw: true, message: "ストライク：回避+1。次ターン全攻撃回避を待機" };
  }

  if (result.customEffectId === "cpu_strike_next_turn_full_evade_2") {
    addFullEvadePending(state, 1, 2);
    return { redraw: true, message: "ソード：回避+2。次ターン全攻撃回避を待機" };
  }

  if (result.customEffectId === "cpu_strike_next_turn_full_evade_3") {
    addFullEvadePending(state, 1, 3);
    return { redraw: true, message: "エール：回避+3。次ターン全攻撃回避を待機" };
  }

  if (result.customEffectId === "cpu_strike_seed_awaken") {
    const current = getSeedEffect(state);
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;
    setStateEffect(state, "cpu_strike_seed", { turns: currentTurns + 5, skipNextTick: true });
    state.evade *= 2;
    if (state.evade > state.evadeMax) {
      state.overEvadeMode = true;
      state.overEvadeCap = state.evade;
      state.overEvadeBaseMax = state.evadeMax;
      state.overEvadeAbsoluteMax = state.evade;
    }
    return { redraw: true, message: "S.E.E.D覚醒発動" };
  }

  if (result.customEffectId === "cpu_strike_launcher_evade_heal") {
    state.evade = Math.min(state.evadeMax, state.evade + 1);
    state.hp = Math.min(state.maxHp, state.hp + 30);
    return { redraw: true, message: "ランチャー：回避+1/30回復" };
  }

  return { redraw: false, message: null };
}

export function onCpuStrikeActionResolved(attacker, defender, context = {}) {
  ensureCpuStrikeState(attacker);
  const messages = [];
  let redraw = false;

  if (attacker.formId === "sword") {
    if (context.slotNumber === 4 && context.hitCount > 0) {
      if (typeof attacker.actionCount !== "number") attacker.actionCount = 0;
      attacker.actionCount += 1;
      setStateEffect(attacker, "cpu_strike_anchor_sure_hit", { turns: 1, pendingActivation: true });
      messages.push("アンカー捕縛：行動回数+1 / 次攻撃必中待機");
      redraw = true;
    }

    if (
      (context.slotNumber === 6 || context.slotNumber === 1) &&
      context.totalCount > 0 &&
      context.hitCount === context.totalCount &&
      defender?.evade > 0
    ) {
      defender.evade = Math.max(0, defender.evade - 1);
      messages.push("ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制効果：相手回避-1");
      redraw = true;
    }
  }

  return { redraw, message: messages.join("\n") || null };
}

export function getCpuStrikeExtraWeaponResult(state, context = {}) {
  ensureCpuStrikeState(state);
  const total = { appendAttacks: [], appendMessages: [], redraw: true };

  if (state.formId === "sword" && !state.cpuStrikeSwordIssenUsed) {
    const enemy = context.enemyState;
    if (enemy && enemy.hp <= 100 && enemy.evade <= 0 && Math.random() < 0.5) {
      state.cpuStrikeSwordIssenUsed = true;
      state.cpuStrikeSwordNoEvade = true;
      clampSwordNoEvade(state);
      total.appendAttacks.push(...createAttack(200, 1, { type: "melee", source: "cpu_strike_issen" }));
      total.appendMessages.push("ソード特性：一閃 200ダメージ");
    }
  }

  if (state.formId === "sword" && state.cpuStrikeSwordAwakened) {
    while (state.evade >= 1 && state.cpuStrikeShortBattleUsedThisSlot < 5) {
      state.evade -= 1;
      state.cpuStrikeShortBattleUsedThisSlot += 1;
      const slotKey = getRandomSlotKey(state);
      addResult(total, resolveAdditionalSlot(state, slotKey));
      total.appendMessages.push(`短期決戦：回避-1 追加行動（${state.cpuStrikeShortBattleUsedThisSlot}/5）`);
    }
  }

  if (state.formId === "launcher") {
    const enemy = context.enemyState;
    if (enemy && enemy.evade <= 0 && state.evade >= 2 && Math.random() < 0.5) {
      state.evade = Math.max(0, state.evade - 2);
      state.cpuStrikeLauncherRecoilTurns = 1;
      state.cpuStrikeLauncherDamageVulnerable = true;
      total.appendAttacks.push(...createAttack(200, 1, { type: "shoot", source: "cpu_strike_agni_full_charge", ignoreReduction: true }));
      total.appendMessages.push("ランチャー特性：アグニ(フルチャージ) 200ダメージ");
    }

    if (state.cpuStrikeAgniOutputBonus > 0) {
      total.appendAttacks.push(...createAttack(state.cpuStrikeAgniOutputBonus, 1, { type: "shoot", source: "cpu_strike_agni_output_bonus" }));
      total.appendMessages.push(`ランチャー特性：アグニ出力解放 追撃${state.cpuStrikeAgniOutputBonus}ダメージ`);
      state.cpuStrikeAgniOutputBonus = 0;
    }
  }

  if (total.appendAttacks.length === 0 && total.appendMessages.length === 0) return null;
  return total;
}

export function onCpuStrikeTurnEnd(state, context = {}) {
  ensureCpuStrikeState(state);
  const messages = [];
  let redraw = false;

  state.cpuStrikeTurnCount += 1;
  state.cpuStrikeOsCheckUsedThisTurn = false;
  state.cpuStrikeShieldActive = false;

  if (!state.cpuStrikePsArmorBroken && state.cpuStrikePsArmor > 0) {
    state.cpuStrikePsArmor = Math.min(300, state.cpuStrikePsArmor + 5);
    redraw = true;
  }

  if (state.cpuStrikeFullEvadePendingTurns > 0) {
    state.cpuStrikeFullEvadeTurns = Math.max(state.cpuStrikeFullEvadeTurns, state.cpuStrikeFullEvadePendingTurns);
    messages.push(`ストライク：全攻撃回避 ${state.cpuStrikeFullEvadePendingTurns}ターン有効化`);
    state.cpuStrikeFullEvadePendingTurns = 0;
    redraw = true;
  } else if (state.cpuStrikeFullEvadeTurns > 0) {
    state.cpuStrikeFullEvadeTurns -= 1;
    redraw = true;
  }

  const seed = getSeedEffect(state);
  if (seed) {
    if (seed.skipNextTick) {
      seed.skipNextTick = false;
    } else {
      seed.turns -= 1;
      if (seed.turns <= 0) clearStateEffect(state, "cpu_strike_seed");
    }
    redraw = true;
  }

  if (!state.cpuStrikePackLocked && state.cpuStrikeTurnCount > 0 && state.cpuStrikeTurnCount % 3 === 0) {
    randomPackChange(state, messages);
    redraw = true;
  }

  return { redraw: redraw || messages.length > 0, message: messages.join("\n") || null };
}

export function modifyCpuStrikeTakenDamage(defender, attacker, attack, damage) {
  ensureCpuStrikeState(defender);
  let finalDamage = damage;
  const messages = [];

  if (defender.formId === "aile" && finalDamage >= 150 && defender.cpuStrikeShieldStock > 0 && !defender.cpuStrikeShieldActive) {
    defender.cpuStrikeShieldStock -= 1;
    defender.cpuStrikeShieldActive = true;
    messages.push(`エール特性：シールド発動 残${defender.cpuStrikeShieldStock}`);
  }

  if (defender.cpuStrikeShieldActive) {
    finalDamage = Math.ceil(finalDamage / 2);
    messages.push("シールド：ダメージ半減");
  }

  if (defender.cpuStrikeLauncherDamageVulnerable) {
    finalDamage = Math.ceil(finalDamage * 1.5);
    messages.push("ランチャー反動：被ダメージ1.5倍");
  }

  const psTarget = !attack?.beam && !attack?.ignoreReduction;
  if (!defender.cpuStrikePsArmorBroken && defender.cpuStrikePsArmor > 0 && psTarget) {
    const rawForArmor = finalDamage;
    if (rawForArmor <= 100) {
      finalDamage = Math.ceil(rawForArmor / 2);
    } else {
      finalDamage = 50;
    }

    defender.cpuStrikePsArmor = Math.max(0, defender.cpuStrikePsArmor - rawForArmor);
    messages.push(`PS装甲：${rawForArmor}を耐久で受け止め`);

    if (defender.cpuStrikePsArmor <= 0) {
      defender.cpuStrikePsArmor = 0;
      defender.cpuStrikePsArmorBroken = true;
      messages.push("フェイズシフトダウン");
    }
  }

  return { damage: finalDamage, message: messages.join("\n") || null };
}

export function modifyCpuStrikeEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuStrikeState(defender);

  if (defender.cpuStrikeFullEvadeTurns > 0 && !attack?.cannotEvade) {
    return { handled: true, ok: true, consumeEvade: 0, message: "ストライク：全攻撃回避" };
  }

  if (getSeedEffect(defender) && attack?.cannotEvade) {
    if (defender.evade <= 0) {
      return { handled: true, ok: false, reason: "noEvade", message: "回避が足りない" };
    }
    return { handled: true, ok: true, consumeEvade: 1, message: "S.E.E.D覚醒：必中攻撃を回避" };
  }

  return { handled: false };
}
