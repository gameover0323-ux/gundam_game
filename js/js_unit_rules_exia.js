import {
  setForm,
  addEvade,
  reduceEvade,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

import { createAttack } from "./js_battle_system.js";

function ensureExiaState(state) {
  if (!state) return;
  if (typeof state.exiaSkipNextTurn !== "boolean") state.exiaSkipNextTurn = false;
  if (typeof state.exiaAvalancheLost !== "boolean") state.exiaAvalancheLost = false;
  if (typeof state.exiaAvalancheEscapeUsed !== "boolean") state.exiaAvalancheEscapeUsed = false;
  if (typeof state.exiaRepairGutsUsed !== "boolean") state.exiaRepairGutsUsed = false;
  if (typeof state.exiaRepairTransAmPending !== "boolean") state.exiaRepairTransAmPending = false;
  if (typeof state.exiaRepairTransAmActive !== "boolean") state.exiaRepairTransAmActive = false;
  if (typeof state.exiaRepairRestAfterBoost !== "boolean") state.exiaRepairRestAfterBoost = false;
  if (typeof state.exiaTransAmCostPaidThisTurn !== "boolean") state.exiaTransAmCostPaidThisTurn = false;
  if (typeof state.exiaTransAmExtraActionsThisTurn !== "number") state.exiaTransAmExtraActionsThisTurn = 0;
  if (typeof state.exiaTurnDamageDealt !== "number") state.exiaTurnDamageDealt = 0;
}

function isTransAmForm(state) {
  return state?.formId === "trans_am" || state?.formId === "avalanche_trans_am";
}

function isAvalancheForm(state) {
  return state?.formId === "avalanche" || state?.formId === "avalanche_trans_am";
}

function setActionCountAtLeast(state, value) {
  state.actionCount = Math.max(Number(state.actionCount || 0), value);
}

function consumeAction(state, amount = 1) {
  if (Number(state.actionCount || 0) < amount) return false;
  state.actionCount = Math.max(0, Number(state.actionCount || 0) - amount);
  return true;
}

function heal(state, amount) {
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + amount);
}

function changeForm(state, formId, options = {}) {
  const ok = setForm(state, formId, { preserveHp: true, preserveEvade: true, ...options });
  if (ok) normalizeEvadeCapState(state);
  return ok;
}

function repairTransform(state) {
  changeForm(state, "repair", { preserveHp: false, preserveEvade: true });
  state.hp = 100;
  state.maxHp = 100;
  state.evadeMax = 3;
  state.shieldCount = 3;
  state.shieldActive = false;
  state.exiaRepairGutsUsed = false;
  normalizeEvadeCapState(state);
}

function payTransAmTurnCost(state) {
  if (!isTransAmForm(state)) return null;
  if (state.exiaTransAmCostPaidThisTurn) return null;
  state.exiaTransAmCostPaidThisTurn = true;

  state.hp -= 50;
  if (state.hp > 0) {
    return `${state.name} TRANS-AM自壊 HP-50`;
  }

  state.hp = 1;
  if (state.formId === "trans_am") {
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
  } else {
    changeForm(state, "avalanche", { preserveHp: true, preserveEvade: true });
  }
  state.exiaSkipNextTurn = true;
  return `${state.name} は自壊寸前でTRANS-AM解除。HP1で次ターン行動不能`;
}

function buildSevenSwordSlot(count) {
  return {
    key: "slot7",
    label: `セブンソードコンビネーション 30ダメージ×${count}回`,
    desc: `30ダメージ×${count}回。格闘`,
    effect: {
      type: "attack",
      attackType: "melee",
      damage: 30,
      count
    }
  };
}

export function getExiaDerivedState(state) {
  ensureExiaState(state);

  const status = [];
  const slots = {};
  const specials = {};

  if (state.exiaSkipNextTurn) status.push("次の自分ターン行動不能");
  if (state.exiaAvalancheLost) status.push("アヴァランチ使用権放棄");
  if (state.exiaRepairTransAmPending) status.push("リペアTRANS-AM待機");
  if (state.exiaRepairTransAmActive) status.push("リペアTRANS-AM中");

  if (state.formId === "base" && state.exiaAvalancheLost) {
    specials.special4 = {
      name: "アヴァランチユニット",
      effectType: "exia_avalanche",
      timing: "self",
      desc: "離脱解除により使用権を放棄済み。",
      actionType: "auto"
    };
  }

  if (state.formId === "repair" && state.exiaRepairTransAmActive) {
    slots.slot1 = { label: "回避 +3", desc: "回避ストック+3", ex: true, effect: { type: "evade", amount: 3 } };
    slots.slot2 = { label: "回復 60", desc: "HP60回復", ex: true, effect: { type: "heal", amount: 60 } };
    slots.slot3 = { label: "GNソード 90ダメージ", desc: "90ダメージ。格闘", ex: true, effect: { type: "attack", attackType: "melee", damage: 90, count: 1 } };
    slots.slot4 = { label: "GNビームライフル 60ダメージ×2回", desc: "60ダメージ×2回。射撃、ビーム", ex: true, effect: { type: "attack", attackType: "shoot", damage: 60, count: 2, beam: true } };
    slots.slot5 = { label: "5EX TRANS-AM連撃 15ダメージ×10回", desc: "15ダメージ×10回。格闘", ex: true, effect: { type: "attack", attackType: "melee", damage: 15, count: 10 } };
    slots.slot6 = { label: "突貫 150ダメージ", desc: "150ダメージ。格闘、軽減不可", ex: true, effect: { type: "attack", attackType: "melee", damage: 150, count: 1, ignoreReduction: true } };
  }

  return { status, slots, specials };
}

export function canUseExiaSpecial(state, specialKey) {
  ensureExiaState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "exia_seven_sword") {
    return {
      allowed: Number(state.evade || 0) >= 1,
      message: Number(state.evade || 0) >= 1 ? null : "回避が足りない"
    };
  }

  if (special.effectType === "exia_avalanche") {
    if (state.exiaAvalancheLost) return { allowed: false, message: "アヴァランチ使用権を放棄済み" };
    return {
      allowed: Number(state.actionCount || 0) >= 1,
      message: Number(state.actionCount || 0) >= 1 ? null : "行動権が足りない"
    };
  }

  if (special.effectType === "exia_avalanche_release") {
    return {
      allowed: Number(state.actionCount || 0) >= 1,
      message: Number(state.actionCount || 0) >= 1 ? null : "行動権が足りない"
    };
  }

  if (special.effectType === "exia_trans_am_overdrive") {
    return {
      allowed: state.hp > 25 && state.exiaTransAmExtraActionsThisTurn < 3,
      message: state.hp > 25 ? "このターンは追加上限" : "HPが足りない"
    };
  }

  if (special.effectType === "exia_avalanche_trans_am_particle_overdrive") {
    return {
      allowed: Number(state.evade || 0) >= 3 && state.exiaTransAmExtraActionsThisTurn < 3,
      message: Number(state.evade || 0) >= 3 ? "このターンは追加上限" : "回避が足りない"
    };
  }

  if (special.effectType === "exia_i_am_gundam") {
    return {
      allowed: state.hp > 100,
      message: state.hp > 100 ? null : "HPが足りない"
    };
  }

  if (special.effectType === "exia_avalanche_escape") {
    return {
      allowed: !state.exiaAvalancheEscapeUsed,
      message: !state.exiaAvalancheEscapeUsed ? null : "離脱解除は使用済み"
    };
  }

  return { allowed: true, message: null };
}

export function executeExiaSpecial(state, specialKey, context = {}) {
  ensureExiaState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "exia_seven_sword") {
    const max = Math.min(7, Number(state.evade || 0));
    const choices = [{ label: "キャンセル", value: "cancel" }];
    for (let i = 1; i <= max; i++) choices.push({ label: String(i), value: String(i) });
    return {
      handled: true,
      requestChoice: {
        choiceType: "select",
        source: "exia_seven_sword",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: `PLAYER ${context.ownerPlayer} セブンソードコンビネーション`,
        choices
      }
    };
  }

  if (special.effectType === "exia_trans_am") {
    changeForm(state, "trans_am", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "TRANS-AM発動" };
  }

  if (special.effectType === "exia_avalanche") {
    if (state.exiaAvalancheLost) return { handled: true, redraw: false, message: "アヴァランチ使用権を放棄済み" };
    if (!consumeAction(state, 1)) return { handled: true, redraw: false, message: "行動権が足りない" };
    changeForm(state, "avalanche", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "アヴァランチエクシアに換装" };
  }

  if (special.effectType === "exia_avalanche_release") {
    if (!consumeAction(state, 1)) return { handled: true, redraw: false, message: "行動権が足りない" };
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "アヴァランチ解除" };
  }

  if (special.effectType === "exia_avalanche_trans_am") {
    changeForm(state, "avalanche_trans_am", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "アヴァランチTRANS-AM発動" };
  }

  if (special.effectType === "exia_avalanche_escape") {
    if (state.exiaAvalancheEscapeUsed) return { handled: true, redraw: false, message: "離脱解除は使用済み" };
    state.exiaAvalancheEscapeUsed = true;
    state.exiaAvalancheLost = true;
    state.shieldActive = true;
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
    return { handled: true, redraw: true, message: "離脱解除：このターンの被ダメージを半減し、アヴァランチ使用権を放棄" };
  }

  if (special.effectType === "exia_trans_am_overdrive") {
    if (state.exiaTransAmExtraActionsThisTurn >= 3) return { handled: true, redraw: false, message: "このターンは追加上限" };
    if (state.hp <= 25) return { handled: true, redraw: false, message: "HPが足りない" };
    state.hp -= 25;
    state.exiaTransAmExtraActionsThisTurn++;
    state.actionCount = Number(state.actionCount || 0) + 1;
    return { handled: true, redraw: true, message: null };
  }

  if (special.effectType === "exia_avalanche_trans_am_particle_overdrive") {
    if (state.exiaTransAmExtraActionsThisTurn >= 3) return { handled: true, redraw: false, message: "このターンは追加上限" };
    if (Number(state.evade || 0) < 3) return { handled: true, redraw: false, message: "回避が足りない" };
    reduceEvade(state, 3);
    state.exiaTransAmExtraActionsThisTurn++;
    state.actionCount = Number(state.actionCount || 0) + 1;
    return { handled: true, redraw: true, message: null };
  }

  if (special.effectType === "exia_i_am_gundam") {
    if (state.hp <= 100) return { handled: true, redraw: false, message: "HPが足りない" };
    state.hp -= 100;
    const healAmount = Math.floor(Number(state.exiaTurnDamageDealt || 0) / 2);
    heal(state, healAmount);
    return { handled: true, redraw: true, message: `俺がガンダムだ！ HP${healAmount}回復` };
  }

  if (special.effectType === "exia_trans_am_release") {
    changeForm(state, "base", { preserveHp: true, preserveEvade: true });
    state.exiaSkipNextTurn = true;
    return { handled: true, redraw: true, message: "TRANS-AM解除。次の自分ターン行動不能" };
  }

  if (special.effectType === "exia_avalanche_trans_am_release") {
    changeForm(state, "avalanche", { preserveHp: true, preserveEvade: true });
    state.exiaSkipNextTurn = true;
    return { handled: true, redraw: true, message: "TRANS-AM解除。次の自分ターン行動不能" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onExiaBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureExiaState(state);

  if (state.exiaSkipNextTurn) {
    state.exiaSkipNextTurn = false;
    return { redraw: true, cancelSlot: true, message: `${state.name} は行動不能` };
  }

  state.exiaTurnDamageDealt = 0;

  if (state.exiaRepairTransAmPending) {
    state.exiaRepairTransAmPending = false;
    state.exiaRepairTransAmActive = true;
    state.exiaRepairRestAfterBoost = true;
    return { redraw: true, message: "エクシアリペア TRANS-AM発動" };
  }

  const transAmMessage = payTransAmTurnCost(state);
  if (transAmMessage) return { redraw: true, message: transAmMessage };

  return { redraw: false, message: null };
}

export function onExiaTurnEnd(state) {
  ensureExiaState(state);
  state.exiaTransAmCostPaidThisTurn = false;
  state.exiaTransAmExtraActionsThisTurn = 0;
  state.exiaTurnDamageDealt = 0;

  if (state.exiaRepairTransAmActive && state.exiaRepairRestAfterBoost) {
    state.exiaRepairTransAmActive = false;
    state.exiaRepairRestAfterBoost = false;
    state.exiaSkipNextTurn = true;
    return { redraw: true, message: "リペアTRANS-AM終了。次の自分ターン行動不能" };
  }

  return { redraw: false, message: null };
}

export function onExiaAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureExiaState(state);
  const resolveResult = payload.resolveResult || payload;
  const customEffectId = resolveResult.customEffectId;

  if (customEffectId === "exia_repair_trans_am") {
    state.exiaRepairTransAmPending = true;
    return { redraw: true, message: "次の自分ターン、リペアTRANS-AM発動" };
  }

  if (customEffectId === "exia_particle_release") {
    if (Number(state.evade || 0) > 0) {
      state.evade *= 2;
      normalizeEvadeCapState(state);
      return { redraw: true, message: "粒子放出：回避倍加" };
    }
    state.actionCount = Number(state.actionCount || 0) + 1;
    return { redraw: true, message: "粒子放出：回避0のため行動権+1" };
  }

  if (customEffectId === "exia_long_short_blade") {
    const ev = Number(state.evade || 0);
    if (ev > 0) {
      return {
        redraw: false,
        appendAttacks: createAttack(10, ev, { type: "melee", source: "GNロング＆ショートブレイド" })
      };
    }
    addEvade(state, 1);
    return {
      redraw: true,
      appendAttacks: createAttack(20, 1, { type: "melee", source: "GNロング＆ショートブレイド" }),
      message: "回避+1"
    };
  }

  if (customEffectId === "exia_trans_am_long_short_blade") {
    const ev = Number(state.evade || 0);
    if (ev > 0) {
      return {
        redraw: false,
        appendAttacks: createAttack(10, ev, { type: "melee", source: "GNロング＆ショートブレイド" })
      };
    }
    addEvade(state, 1);
    return {
      redraw: true,
      appendAttacks: createAttack(60, 1, { type: "melee", source: "GNロング＆ショートブレイド" }),
      message: "回避+1"
    };
  }

  if (customEffectId === "exia_trans_am_slash") {
    const ev = Number(state.evade || 0);
    if (ev > 0) {
      return {
        redraw: false,
        appendAttacks: createAttack(20, ev, { type: "melee", source: "連続斬撃" })
      };
    }
    return {
      redraw: false,
      appendAttacks: createAttack(90, 1, { type: "melee", source: "連続斬撃" })
    };
  }

  return { redraw: false, message: null };
}

export function onExiaActionResolved(attacker, defender, context = {}) {
  ensureExiaState(attacker);

  if (context.slotKey === "slot6" && attacker.formId === "base") {
    if (context.hitCount > 0 && Number(context.enemyEvadeBefore || 0) > 0) {
      attacker.actionCount = Number(attacker.actionCount || 0) + 1;
      return { redraw: true, message: "GNダガー命中：行動回数+1" };
    }
  }

  if (
    context.slotKey === "slot1" &&
    isAvalancheForm(attacker) &&
    context.hitCount === context.totalCount &&
    Number(context.enemyEvadeBefore || 0) > 0
  ) {
    attacker.actionCount = Number(attacker.actionCount || 0) + 1;
    return { redraw: true, message: "GNビームダガーフルヒット：行動回数+1" };
  }

  return { redraw: false, message: null };
}

export function onExiaDamaged(defender, attacker) {
  ensureExiaState(defender);

  if (defender.formId === "base" && defender.hp <= 0) {
    repairTransform(defender);
    return { redraw: true, message: "エクシアリペアへ換装" };
  }

  if (defender.formId === "repair" && defender.hp <= 0 && !defender.exiaRepairGutsUsed) {
    defender.exiaRepairGutsUsed = true;
    defender.hp = 1;
    return { redraw: true, message: "エクシアリペアはHP1で耐えた" };
  }

  return { redraw: false, message: null };
}

export function modifyExiaTakenDamage(defender, attacker, attack, damage) {
  ensureExiaState(defender);
  return { damage, message: null };
}

export function modifyExiaEvadeAttempt(defender, attacker, attack) {
  ensureExiaState(defender);

  if (!attack?.cannotEvade) return { handled: false };

  if (defender.formId === "avalanche" && Number(defender.evade || 0) > Number(defender.evadeMax || 0)) {
    return { handled: false };
  }

  if (defender.formId === "avalanche_trans_am" && Number(defender.evade || 0) > 0) {
    return { handled: false };
  }

  return { handled: false };
}

export function onExiaResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureExiaState(state);

  if (pendingChoice.source === "exia_seven_sword") {
    if (selectedValue === "cancel") {
      return { handled: true, redraw: false, message: "キャンセル" };
    }

    const count = Number(selectedValue);
    if (!count || count < 1 || count > 7) {
      return { handled: true, redraw: false, message: "選択値が不正" };
    }

    if (Number(state.evade || 0) < count) {
      return { handled: true, redraw: true, message: "回避が足りない" };
    }

    reduceEvade(state, count);
    state.exiaSkipNextTurn = true;

    return {
      handled: true,
      redraw: true,
      message: `セブンソードコンビネーション：回避${count}消費`,
      startSlotAction: {
        slotKey: "slot7",
        slotData: buildSevenSwordSlot(count)
      }
    };
  }

  return { handled: false, redraw: false, message: null };
}
