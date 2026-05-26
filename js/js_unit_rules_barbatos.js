import {
  setForm,
  addEvade,
  reduceEvade,
  setStateEffect,
  getStateEffect,
  clearStateEffect,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

import { createAttack } from "./js_battle_system.js";
import { resolveSlotEffect } from "./js_slot_effects.js";

function ensureBarbatosState(state) {
  if (!state) return;
  if (typeof state.barbatosSkipNextTurn !== "boolean") state.barbatosSkipNextTurn = false;
  if (typeof state.barbatosAlayaCostResolving !== "boolean") state.barbatosAlayaCostResolving = false;
  if (typeof state.barbatosMaceExReady !== "boolean") state.barbatosMaceExReady = false;
  if (typeof state.barbatosIaidoStock !== "number") state.barbatosIaidoStock = 0;
  if (typeof state.barbatosIaidoPendingNegate !== "boolean") state.barbatosIaidoPendingNegate = false;
  if (typeof state.barbatosIaidoNegateContextId !== "string") state.barbatosIaidoNegateContextId = "";
  if (typeof state.barbatosExtraArmorCount !== "number") state.barbatosExtraArmorCount = 3;
  if (typeof state.barbatosExtraArmorActive !== "boolean") state.barbatosExtraArmorActive = false;
  if (typeof state.barbatosLastEnemyAttackType !== "string") state.barbatosLastEnemyAttackType = "";
  if (!state.barbatosLastComboAttack) state.barbatosLastComboAttack = null;
  if (typeof state.barbatosComboCountThisTurn !== "number") state.barbatosComboCountThisTurn = 0;
}

function getAttackType(attack) {
  return attack?.type || attack?.attackType || "";
}

function isBeam(attack) {
  return attack?.beam === true;
}

function isIgnoreReduction(attack) {
  return attack?.ignoreReduction === true || attack?.ignoreDefense === true;
}

function makeContextId(context = {}) {
  const ctxAtk = context.currentAttackContext;
  if (ctxAtk?.reservedActionId) return `reserved:${ctxAtk.reservedActionId}`;
  return [
    ctxAtk?.ownerPlayer || context.attackerPlayer || "",
    ctxAtk?.enemyPlayer || context.defenderPlayer || "",
    ctxAtk?.slotKey || "",
    ctxAtk?.slotLabel || "",
    context.attackIndex ?? ""
  ].join("|");
}

function pushReservedAction(state, action) {
  if (!state) return;
  if (!Array.isArray(state.pendingReservedActions)) state.pendingReservedActions = [];
  state.pendingReservedActions.push({
    id: action.id || `barbatos_reserved_${Date.now()}_${Math.random()}`,
    delay: Number(action.delay || 0),
    trigger: action.trigger || "turn_start",
    ownerPlayer: action.ownerPlayer,
    enemyPlayer: action.enemyPlayer,
    type: action.type || "attack",
    label: action.label || "予約アクション",
    attacks: Array.isArray(action.attacks) ? action.attacks : [],
    specialKey: action.specialKey || null,
    payload: action.payload || null
  });
}

function hpHalfCost(state) {
  return Math.floor(Number(state.hp || 0) / 2);
}

function consumeAction(state, amount = 1) {
  if (Number(state.actionCount || 0) < amount) return false;
  state.actionCount = Math.max(0, Number(state.actionCount || 0) - amount);
  return true;
}

function heal(state, amount) {
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + amount);
}

function addRedEvade(state, amount) {
  addEvade(state, amount);
  state.overEvadeMode = true;
  state.overEvadeCap = Math.max(Number(state.overEvadeCap || 0), Number(state.evade || 0));
  normalizeEvadeCapState(state);
}

function getSlotAttackTemplate(slotKey, slot, result) {
  const attacks = Array.isArray(result?.attacks) ? result.attacks : [];
  if (attacks.length > 0) {
    const first = attacks[0];
    return {
      damage: Number(first.damage || 0),
      type: getAttackType(first) || slot?.effect?.attackType || "melee",
      beam: !!first.beam,
      ignoreReduction: !!first.ignoreReduction,
      source: slot?.label || first.source || "追撃"
    };
  }

  return null;
}

function buildComboAttackFromTemplate(template) {
  if (!template) return null;
  return {
    damage: Number(template.damage || 0),
    type: template.type || "melee",
    beam: !!template.beam,
    ignoreReduction: !!template.ignoreReduction,
    source: `${template.source || "攻撃"}・連撃`
  };
}

function getOpponentState(context = {}) {
  return context.enemyState || context.defender || null;
}

export function getBarbatosDerivedState(state) {
  ensureBarbatosState(state);

  const status = [];
  const slots = {};

  if (state.barbatosSkipNextTurn) status.push("次の自分ターン行動不能");
  if (state.barbatosMaceExReady) status.push("6EX準備完了");
  if (state.barbatosIaidoStock > 0) status.push(`居合待ち:${state.barbatosIaidoStock}`);
  if (state.formId === "form6") status.push(`追加装甲:${Math.max(0, state.barbatosExtraArmorCount)}/3`);

  if (state.formId === "form4" && state.barbatosMaceExReady) {
    slots.slot6 = {
      label: "6EX メイスギミック打突 150ダメージ",
      desc: "回避不可150ダメージ。格闘。使用すると通常6へ戻る。",
      ex: true,
      effect: {
        type: "attack",
        attackType: "melee",
        damage: 150,
        count: 1,
        cannotEvade: true,
        special: "barbatos_mace_ex"
      }
    };
  }

  return { status, slots, specials: {} };
}

export function canUseBarbatosSpecial(state, specialKey, context = {}) {
  ensureBarbatosState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "barbatos_alaya_orbit") {
    return {
      allowed: Number(state.hp || 0) > 5,
      message: Number(state.hp || 0) > 5 ? null : "HP5以下では使用できない"
    };
  }

  if (special.effectType === "barbatos_alaya_cost") {
    return {
      allowed: Number(state.hp || 0) > 50,
      message: Number(state.hp || 0) > 50 ? null : "HPが足りない"
    };
  }

  if (special.effectType === "barbatos_form6") {
    return {
      allowed: Number(state.actionCount || 0) >= 1,
      message: Number(state.actionCount || 0) >= 1 ? null : "行動権が足りない"
    };
  }

  if (special.effectType === "barbatos_combo") {
    if (Number(state.barbatosComboCountThisTurn || 0) >= 4) {
      return { allowed: false, message: "阿頼耶識軌道・連撃は1ターン4回まで" };
    }
    if (Number(state.evade || 0) < 1) return { allowed: false, message: "回避が足りない" };
    const currentAttack = context.currentAttack || [];
    if (Array.isArray(currentAttack) && currentAttack.length > 0) return { allowed: true, message: null };
    return {
      allowed: !!state.barbatosLastComboAttack,
      message: state.barbatosLastComboAttack ? null : "追撃対象の攻撃がない"
    };
  }

  if (special.effectType === "barbatos_decisive") {
    return {
      allowed: state.formId === "form6" && Number(state.hp || 0) <= Math.floor(Number(state.maxHp || 0) / 2),
      message: "HP半分以下で使用可能"
    };
  }

  if (special.effectType === "barbatos_full_open") {
    return {
      allowed: Number(state.evade || 0) >= 3,
      message: Number(state.evade || 0) >= 3 ? null : "回避が足りない"
    };
  }

  return { allowed: true, message: null };
}

export function executeBarbatosSpecial(state, specialKey, context = {}) {
  ensureBarbatosState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "barbatos_alaya_orbit") {
    if (Number(state.hp || 0) <= 5) return { handled: true, redraw: false, message: "HP5以下では使用できない" };
    const cost = hpHalfCost(state);
    state.hp -= cost;
    addRedEvade(state, 2);
    return { handled: true, redraw: true, message: `阿頼耶識軌道：HP${cost}消費、回避+2` };
  }

  if (special.effectType === "barbatos_alaya_cost") {
    if (Number(state.hp || 0) <= 50) return { handled: true, redraw: false, message: "HPが足りない" };
    return {
      handled: true,
      requestChoice: {
        choiceType: "select",
        source: "barbatos_alaya_cost",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: "阿頼耶識軌道・代償：スロット選択",
        choices: [1, 2, 3, 4, 5, 6].map(n => ({ label: String(n), value: `slot${n}` }))
      }
    };
  }

  if (special.effectType === "barbatos_form6") {
    if (!consumeAction(state, 1)) return { handled: true, redraw: false, message: "行動権が足りない" };
    setForm(state, "form6", { preserveHp: true, preserveEvade: true });
    state.barbatosExtraArmorCount = 3;
    return { handled: true, redraw: true, message: "第6形態へ換装" };
  }

  if (special.effectType === "barbatos_combo") {
    if (Number(state.evade || 0) < 1) return { handled: true, redraw: false, message: "回避が足りない" };

    const currentAttack = context.currentAttack || [];
    let template = null;

    if (Array.isArray(currentAttack) && currentAttack.length > 0) {
      const base = currentAttack[0];
      template = {
        damage: base?.source === "メイスギミック打突" || context.currentAttackContext?.slotKey === "slot6" && state.barbatosMaceExReady
          ? 40
          : Number(base?.damage || 0),
        type: getAttackType(base) || "melee",
        beam: !!base?.beam,
        ignoreReduction: !!base?.ignoreReduction,
        source: base?.source || context.currentAttackContext?.slotLabel || "連撃"
      };
    } else {
      template = state.barbatosLastComboAttack;
    }

    const attack = buildComboAttackFromTemplate(template);
    if (!attack) return { handled: true, redraw: false, message: "追撃対象の攻撃がない" };

    reduceEvade(state, 1);
    state.barbatosComboCountThisTurn += 1;
    return {
      handled: true,
      redraw: true,
      message: "阿頼耶識軌道・連撃：回避1消費",
      appendAttacks: [attack]
    };
  }

  if (special.effectType === "barbatos_decisive") {
    if (state.formId !== "form6") return { handled: true, redraw: false, message: "第6形態のみ使用可能" };
    if (Number(state.hp || 0) > Math.floor(Number(state.maxHp || 0) / 2)) {
      return { handled: true, redraw: false, message: "HP半分以下で使用可能" };
    }
    state.barbatosExtraArmorCount = 0;
    setForm(state, "decisive", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "決戦形態へ移行" };
  }

  if (special.effectType === "barbatos_full_open") {
    if (state.formId !== "decisive") return { handled: true, redraw: false, message: "決戦形態のみ使用可能" };
    const enemy = getOpponentState(context);
    if (Number(state.evade || 0) >= 6 && enemy) {
      state.evade = 0;
      enemy.evade = 0;
      return { handled: true, redraw: true, message: "阿頼耶識軌道・全開：全回避消費、相手回避0" };
    }
    if (Number(state.evade || 0) >= 3) {
      reduceEvade(state, 3);
      state.actionCount = Number(state.actionCount || 0) + 1;
      return { handled: true, redraw: true, message: "阿頼耶識軌道・全開：回避3消費、行動権+1" };
    }
    return { handled: true, redraw: false, message: "回避が足りない" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onBarbatosBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureBarbatosState(state);

  if (state.barbatosSkipNextTurn) {
    if (state.barbatosAlayaCostResolving && context.isForcedSlotAction) {
      return { redraw: false, message: null };
    }

    state.barbatosSkipNextTurn = false;
    return { redraw: true, cancelSlot: true, message: `${state.name} は行動不能` };
  }

  return { redraw: false, message: null };
}

export function onBarbatosEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureBarbatosState(state);

  const enemy = context.enemyState;
  const enemySlot = enemy?.slots?.[context.enemyRolledSlotKey];
  const kind = enemySlot ? resolveSlotEffect({ slot: enemySlot, actor: enemy, ownerPlayer: context.enemyPlayer }).kind : null;

  if (state.barbatosIaidoStock > 0) {
    if (kind === "attack") {
      state.barbatosIaidoPendingNegate = true;
      return { redraw: true, message: `居合待機：相手攻撃を捕捉（${state.barbatosIaidoStock}）` };
    }

    state.barbatosIaidoStock = 0;
    state.barbatosIaidoPendingNegate = false;
    return { redraw: true, message: "居合不発：相手スロット行動が攻撃ではなかった" };
  }

  const shootingDisabled = getStateEffect(state, "barbatos_shoot_disabled");
  const meleeDisabled = getStateEffect(state, "barbatos_melee_disabled");

  if (kind === "attack" && enemySlot?.effect && !enemySlot.effect.ignoreReduction) {
    const type = enemySlot.effect.attackType;
    if (type === "shoot" && shootingDisabled) {
      return { redraw: false, message: "射撃武器損傷：射撃攻撃無効" };
    }
    if (type === "melee" && meleeDisabled) {
      return { redraw: false, message: "格闘武器損傷：格闘攻撃無効" };
    }
  }

  return { redraw: false, message: null };
}

export function onBarbatosAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureBarbatosState(state);

  if (state.barbatosAlayaCostResolving) {
    state.barbatosAlayaCostResolving = false;
  }

  const resolveResult = payload.resolveResult || payload;
  const slot = payload.slot || state.slots?.[`slot${slotNumber}`];
  const customEffectId = resolveResult.customEffectId;

  if (customEffectId === "barbatos_iai") {
    state.barbatosIaidoStock += 1;
    return { redraw: true, message: `居合待ち状態：${state.barbatosIaidoStock}` };
  }

  if (customEffectId === "barbatos_parts_capture") {
    const enemy = payload.enemyState;
    const type = state.barbatosLastEnemyAttackType;

    if (!type) {
      return { redraw: false, message: "パーツ鹵獲失敗：直前の相手攻撃がない" };
    }

    if (type === "shoot" && enemy) {
      setStateEffect(enemy, "barbatos_shoot_disabled", {
        turns: 2,
        source: "パーツ鹵獲",
        disabledAttackType: "shoot"
      });
      return { redraw: true, message: "パーツ鹵獲：相手の射撃武器を2ターン無効化" };
    }

    if (type === "melee" && enemy) {
      heal(state, 50);
      return {
        redraw: true,
        message: "パーツ鹵獲：HP50回復、格闘反撃",
        appendAttacks: createAttack(50, 1, { type: "melee", source: "パーツ鹵獲" })
      };
    }
  }

  if (customEffectId === "barbatos_pierce") {
    const enemy = payload.enemyState;
    if (Number(enemy?.evade || 0) <= 0) {
      return {
        redraw: false,
        appendAttacks: createAttack(240, 1, { type: "melee", ignoreReduction: true, source: "太刀〈刺突〉" })
      };
    }
    return {
      redraw: false,
      appendAttacks: createAttack(120, 1, { type: "melee", source: "太刀〈刺突〉" })
    };
  }

  if (resolveResult.kind === "attack") {
    const template = getSlotAttackTemplate(`slot${slotNumber}`, slot, resolveResult);
    if (template) {
      if (state.barbatosMaceExReady && slotNumber === 6) {
        template.damage = 40;
        template.source = "メイスギミック打突";
      }
      state.barbatosLastComboAttack = template;
    }
  }

  return { redraw: false, message: null };
}

export function onBarbatosActionResolved(attacker, defender, context = {}) {
  ensureBarbatosState(attacker);

  const messages = [];

  if (context.slotKey === "slot3" && context.hitCount > 0 && attacker.formId === "form4") {
    attacker.barbatosMaceExReady = true;
    messages.push("メイス投擲命中：6EX解放");
  }

  if (context.slotKey === "slot6" && attacker.barbatosMaceExReady && attacker.formId === "form4") {
    attacker.barbatosMaceExReady = false;
    messages.push("6EX使用：通常6へ戻る");
  }

  if (context.slotKey === "slot1" && attacker.formId === "decisive" && context.hitCount > 0 && defender) {
    defender.evade = 0;
    messages.push("太刀〈いなし〉命中：相手回避0");
  }

  if (context.slotKey === "slot4" && attacker.formId === "decisive" && context.hitCount > 0 && defender) {
    defender.barbatosArmCutPending = true;
    messages.push("太刀〈腕落とし〉命中：次の相手格闘攻撃で格闘武器損傷");
  }

  return { redraw: messages.length > 0, message: messages.join(" / ") || null };
}

export function onBarbatosDamaged(defender, attacker, context = {}) {
  ensureBarbatosState(defender);
  return { redraw: false, message: null };
}

export function modifyBarbatosTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureBarbatosState(defender);

  let finalDamage = Number(damage || 0);
  const messages = [];

  if (defender.barbatosIaidoPendingNegate) {
    const contextId = makeContextId(context);

    if (!defender.barbatosIaidoNegateContextId) {
      defender.barbatosIaidoNegateContextId = contextId;
      const count = Math.max(1, Number(defender.barbatosIaidoStock || 0));
      defender.barbatosIaidoStock = 0;
      defender.barbatosIaidoPendingNegate = false;

      pushReservedAction(defender, {
        trigger: "turn_start",
        delay: 1,
        ownerPlayer: context.defenderPlayer,
        enemyPlayer: context.attackerPlayer,
        type: "attack",
        label: `居合反撃 ${count}回`,
        attacks: createAttack(70, count, { type: "melee", source: "居合" })
      });
    }

    if (defender.barbatosIaidoNegateContextId === contextId) {
      return { damage: 0, cancelled: true, message: "居合：攻撃無効" };
    }
  }

  if (defender.formId === "form6" && defender.barbatosExtraArmorCount > 0 && !isIgnoreReduction(attack)) {
    defender.barbatosExtraArmorCount -= 1;
    defender.barbatosExtraArmorActive = true;
    return { damage: 0, cancelled: true, message: `ナノラミネート追加装甲：攻撃ターン無効（残り${defender.barbatosExtraArmorCount}）` };
  }

  if (defender.formId === "decisive") {
    finalDamage *= 2;
    messages.push("装甲解除：被ダメージ2倍");
  }

  if (isBeam(attack) && !isIgnoreReduction(attack)) {
    finalDamage = Math.ceil(finalDamage / 2);
    messages.push("ナノラミネート装甲：ビーム半減");
  }

  return { damage: finalDamage, message: messages.join(" / ") || null };
}

export function modifyBarbatosEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureBarbatosState(defender);
  return { handled: false };
}

export function onBarbatosTurnEnd(state) {
  ensureBarbatosState(state);
  state.barbatosIaidoNegateContextId = "";
  state.barbatosExtraArmorActive = false;
  state.barbatosComboCountThisTurn = 0;
  return { redraw: false, message: null };
}

export function onBarbatosResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureBarbatosState(state);

  if (pendingChoice.source === "barbatos_alaya_cost") {
    const slotKey = selectedValue;
    if (!state.slots?.[slotKey]) return { handled: true, redraw: false, message: "スロットが見つからない" };
    if (Number(state.hp || 0) <= 50) return { handled: true, redraw: false, message: "HPが足りない" };

    state.hp -= 50;
    state.barbatosSkipNextTurn = true;
    state.barbatosAlayaCostResolving = true;

    return {
      handled: true,
      redraw: true,
      message: "阿頼耶識軌道・代償：HP50消費、次ターン行動不能",
      startSlotAction: {
        slotKey,
        slotData: state.slots[slotKey]
      }
    };
  }

  return { handled: false, redraw: false, message: null };
}
