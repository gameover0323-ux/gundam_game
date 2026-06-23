import {
  setForm,
  addEvade,
  reduceEvade,
  normalizeEvadeCapState
} from "./js_unit_runtime.js";

import { createAttack } from "./js_battle_system.js";

const V2_EQUIPMENT_INITIAL_STOCK = 3;
const V2_EQUIPMENT_MIN_STOCK = 3;
const V2_EQUIPMENT_MAX_STOCK = 10;
const ASSAULT_HIT_BREAK_COUNT = 20;

const V2_PART_LABEL = {
  assault: "A",
  buster: "B",
  cannon: "C"
};

function ensureV2State(state) {
  if (!state) return;

  if (!state.v2EquipmentStock || typeof state.v2EquipmentStock !== "object") {
    state.v2EquipmentStock = {
      assault: V2_EQUIPMENT_INITIAL_STOCK,
      buster: V2_EQUIPMENT_INITIAL_STOCK,
      cannon: V2_EQUIPMENT_INITIAL_STOCK
    };
  }

  ["assault", "buster", "cannon"].forEach(part => {
    const value = Number(state.v2EquipmentStock[part]);
    state.v2EquipmentStock[part] = Math.max(
      0,
      Math.min(
        V2_EQUIPMENT_MAX_STOCK,
        Number.isFinite(value) ? value : V2_EQUIPMENT_INITIAL_STOCK
      )
    );
  });

  if (typeof state.v2CannonCharge !== "number") state.v2CannonCharge = 0;
  if (typeof state.v2WingGuardActive !== "boolean") state.v2WingGuardActive = false;
  if (typeof state.v2WingGuardCountered !== "boolean") state.v2WingGuardCountered = false;
  if (typeof state.v2WingGuardOwnerTurnEnds !== "number") state.v2WingGuardOwnerTurnEnds = 0;
  if (typeof state.v2MegaBeamShieldCount !== "number") state.v2MegaBeamShieldCount = 3;
  if (typeof state.v2MegaBeamShieldActive !== "boolean") state.v2MegaBeamShieldActive = false;
  if (typeof state.v2BusterTurnCount !== "number") state.v2BusterTurnCount = 0;
  if (typeof state.v2Buster2ExUsed !== "number") state.v2Buster2ExUsed = 0;
  if (typeof state.v2CannonHitCount !== "number") state.v2CannonHitCount = 0;
  if (typeof state.v2LastSlot4Ready !== "boolean") state.v2LastSlot4Ready = false;
  if (typeof state.v2CannonIgnoreReductionReady !== "boolean") state.v2CannonIgnoreReductionReady = false;
  if (typeof state.v2CannonCannotEvadeReady !== "boolean") state.v2CannonCannotEvadeReady = false;
  if (typeof state.v2ShootGuardActive !== "boolean") state.v2ShootGuardActive = false;
  if (typeof state.v2DynamicEvadeMax !== "number") state.v2DynamicEvadeMax = -1;
  if (typeof state.v2AssaultHitTakenCount !== "number") state.v2AssaultHitTakenCount = 0;
  if (typeof state.shieldCount !== "number") state.shieldCount = 3;
  if (typeof state.shieldActive !== "boolean") state.shieldActive = false;
}

function formId(state) {
  return state?.formId || "v2";
}

function isAssaultBreakForm(state) {
  const f = formId(state);
  return f === "assault" || f === "assault_buster" || f === "assault_buster_cannon";
}

function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || context?.attackerPlayer || context?.defenderPlayer || null;
}

function getEnemyPlayer(context) {
  return context?.enemyPlayer || null;
}

function getRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getEvade && ownerPlayer) {
    return Math.max(0, Number(adapter.getEvade(ownerPlayer, state) || 0));
  }

  return Math.max(0, Number(state?.evade || 0));
}

function consumeRuleEvade(state, amount, context = {}) {
  const cost = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, cost);
  }

  if (!state || Number(state.evade || 0) < cost) return false;

  reduceEvade(state, cost);
  return true;
}

function consumeEnemyRuleEvade(defender, amount, context = {}) {
  const cost = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.consumeEvade && enemyPlayer) {
    return adapter.consumeEvade(enemyPlayer, defender, cost);
  }

  if (!defender || Number(defender.evade || 0) < cost) return false;

  reduceEvade(defender, cost);
  return true;
}

function addRuleEvade(state, amount, context = {}) {
  const value = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, value);
  }

  addEvade(state, value);
  return value;
}

function healRuleHp(state, amount, context = {}) {
  const value = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, value);
  }

  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + value);
  return value;
}

function damageRuleHp(state, amount, context = {}) {
  const value = Math.max(0, Number(amount || 0));
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeHp && ownerPlayer) {
    return adapter.consumeHp(ownerPlayer, state, value);
  }

  state.hp = Math.max(1, Number(state.hp || 0) - value);
  return true;
}

function usesV2DynamicEvadeCap(state) {
  const f = formId(state);
  return f === "assault" || f === "assault_buster" || f === "assault_buster_cannon";
}

function getV2BaseEvadeMax(state) {
  return Number(state.forms?.[formId(state)]?.evadeMax || state.evadeMax || state.maxEvade || 0);
}

function ensureV2DynamicEvadeCap(state) {
  ensureV2State(state);

  if (!usesV2DynamicEvadeCap(state)) return;

  if (state.v2DynamicEvadeMax < 0) {
    state.v2DynamicEvadeMax = getV2BaseEvadeMax(state);
  }

  state.evadeMax = state.v2DynamicEvadeMax;
  state.maxEvade = state.v2DynamicEvadeMax;

  normalizeEvadeCapState(state);
}

function getV2CurrentEvadeMax(state) {
  if (!usesV2DynamicEvadeCap(state)) {
    return Number(state.evadeMax || state.maxEvade || 0);
  }

  ensureV2DynamicEvadeCap(state);
  return Number(state.v2DynamicEvadeMax || 0);
}

function heal(state, amount, context = {}) {
  healRuleHp(state, amount, context);
}

function damageSelf(state, amount, context = {}) {
  damageRuleHp(state, amount, context);
}

function addCap(state, amount) {
  const add = Number(amount || 0);

  if (usesV2DynamicEvadeCap(state)) {
    ensureV2DynamicEvadeCap(state);
    state.v2DynamicEvadeMax = Math.max(0, Number(state.v2DynamicEvadeMax || 0) + add);
    state.evadeMax = state.v2DynamicEvadeMax;
    state.maxEvade = state.v2DynamicEvadeMax;
    normalizeEvadeCapState(state);
    return;
  }

  state.evadeMax = Math.max(0, Number(state.evadeMax || 0) + add);
  state.maxEvade = state.evadeMax;
  normalizeEvadeCapState(state);
}

function reduceCap(state, amount) {
  const sub = Number(amount || 0);

  if (usesV2DynamicEvadeCap(state)) {
    ensureV2DynamicEvadeCap(state);
    state.v2DynamicEvadeMax = Math.max(0, Number(state.v2DynamicEvadeMax || 0) - sub);
    state.evadeMax = state.v2DynamicEvadeMax;
    state.maxEvade = state.v2DynamicEvadeMax;
    normalizeEvadeCapState(state);
    return;
  }

  state.evadeMax = Math.max(0, Number(state.evadeMax || 0) - sub);
  state.maxEvade = state.evadeMax;
  normalizeEvadeCapState(state);
}

function addEvadeWithAssaultCapRule(state, amount, context = {}) {
  const beforeEvade = getRuleEvade(state, context);
  const beforeMax = getV2CurrentEvadeMax(state);

  addRuleEvade(state, amount, context);

  const afterEvade = getRuleEvade(state, context);

  if (afterEvade > beforeMax) {
    addCap(state, afterEvade - beforeMax);
  }

  if (!getAdapter(context)) {
    state.evade = Math.max(beforeEvade + Number(amount || 0), Number(state.evade || 0));
  }
}

function v2CannonDamage(state, base = 150) {
  return Number(base || 0) + Number(state.v2CannonCharge || 0);
}

function isAttackType(attack, type) {
  return (attack?.type || attack?.attackType || "") === type;
}

function isIgnoreReduction(attack) {
  return attack?.ignoreReduction === true || attack?.ignoreDefense === true;
}

function getV2FormParts(nextForm) {
  if (nextForm === "assault") return ["assault"];
  if (nextForm === "buster") return ["buster"];
  if (nextForm === "cannon") return ["cannon"];
  if (nextForm === "assault_buster") return ["assault", "buster"];
  if (nextForm === "assault_buster_cannon") return ["assault", "buster", "cannon"];
  return [];
}

function getV2FormConsumption(nextForm) {
  if (nextForm === "assault") return 1;
  if (nextForm === "buster") return 1;
  if (nextForm === "cannon") return 1;
  if (nextForm === "assault_buster") return 1;
  if (nextForm === "assault_buster_cannon") return 1;
  return 0;
}

function getV2Stock(state, part) {
  ensureV2State(state);
  return Math.max(0, Number(state.v2EquipmentStock?.[part] || 0));
}

function setV2Stock(state, part, value) {
  ensureV2State(state);
  state.v2EquipmentStock[part] = Math.max(0, Math.min(V2_EQUIPMENT_MAX_STOCK, Number(value || 0)));
}

function canUseV2Form(state, nextForm) {
  const parts = getV2FormParts(nextForm);
  if (parts.length === 0) return true;

  return parts.every(part => getV2Stock(state, part) >= V2_EQUIPMENT_MIN_STOCK);
}

function getV2FormStockLabel(state, nextForm) {
  const parts = getV2FormParts(nextForm);
  if (parts.length === 0) return "通常";

  return parts
    .map(part => `${V2_PART_LABEL[part]}:${getV2Stock(state, part)}`)
    .join(" / ");
}

function changeToV2(state, message = "V2ガンダムへ換装解除", context = {}) {
  setForm(state, "v2", { preserveHp: true, preserveEvade: true });

  state.v2DynamicEvadeMax = -1;
  state.v2AssaultHitTakenCount = 0;

  heal(state, 50, context);

  state.v2WingGuardActive = false;
  state.v2WingGuardCountered = false;
  state.v2WingGuardOwnerTurnEnds = 0;
  state.v2MegaBeamShieldActive = false;

  normalizeEvadeCapState(state);

  return message;
}

function changeForm(state, nextForm, context = {}) {
  const current = formId(state);

  if (nextForm === "v2") {
    if (current === "v2") return "すでにV2ガンダムです";
    return changeToV2(state, "V2ガンダムへ換装解除", context);
  }

  if (nextForm === current) {
    return changeToV2(state, "V2ガンダムへ換装解除", context);
  }

  if (!canUseV2Form(state, nextForm)) {
    return `${getV2FormStockLabel(state, nextForm)}：蓄積3未満の装備があるため換装不可`;
  }

  setForm(state, nextForm, { preserveHp: true, preserveEvade: true });

  state.v2DynamicEvadeMax = -1;
  state.v2AssaultHitTakenCount = isAssaultBreakForm(state) ? 0 : Number(state.v2AssaultHitTakenCount || 0);

  if (nextForm === "assault" || nextForm === "assault_buster" || nextForm === "assault_buster_cannon") {
    state.v2DynamicEvadeMax = getV2BaseEvadeMax(state);
    state.evadeMax = state.v2DynamicEvadeMax;
    state.maxEvade = state.v2DynamicEvadeMax;
  }

  heal(state, nextForm === "assault_buster" || nextForm === "assault_buster_cannon" ? 100 : 50, context);

  if (nextForm === "buster") state.v2BusterTurnCount = 0;
  if (nextForm === "cannon") state.v2CannonHitCount = 0;

  normalizeEvadeCapState(state);

  return `${state.name} に換装`;
}

function tickV2EquipmentStock(state, context = {}) {
  ensureV2State(state);

  const current = formId(state);
  const activeParts = getV2FormParts(current);
  const activeSet = new Set(activeParts);
  const consumption = getV2FormConsumption(current);

  ["assault", "buster", "cannon"].forEach(part => {
    if (activeSet.has(part)) {
      setV2Stock(state, part, getV2Stock(state, part) - consumption);
    } else {
      setV2Stock(state, part, getV2Stock(state, part) + 1);
    }
  });

  if (activeParts.length === 0) return null;

  const shouldCancel = activeParts.some(part => getV2Stock(state, part) <= 0);

  if (shouldCancel) {
    return changeToV2(state, "装備蓄積0：V2ガンダムへ強制換装解除", context);
  }

  return null;
}

function buildChangeChoices(state) {
  const current = formId(state);
  const choices = [];

  function push(label, value) {
    choices.push({ label, value });
  }

  if (current !== "v2") {
    push("V2ガンダム（通常）", "v2");
  }

  if (current !== "assault" && canUseV2Form(state, "assault")) {
    push(`V2アサルトガンダム（${getV2FormStockLabel(state, "assault")}）`, "assault");
  }

  if (current !== "buster" && canUseV2Form(state, "buster")) {
    push(`V2バスターガンダム（${getV2FormStockLabel(state, "buster")}）`, "buster");
  }

  if (current !== "cannon" && canUseV2Form(state, "cannon")) {
    push(`V2ガンダム(キャノン装備)（${getV2FormStockLabel(state, "cannon")}）`, "cannon");
  }

  if (current !== "assault_buster" && canUseV2Form(state, "assault_buster")) {
    push(`V2アサルトバスターガンダム（${getV2FormStockLabel(state, "assault_buster")}）`, "assault_buster");
  }

  if (current !== "assault_buster_cannon" && canUseV2Form(state, "assault_buster_cannon")) {
    push(`V2アサルトバスターガンダム(キャノン装備)（${getV2FormStockLabel(state, "assault_buster_cannon")}）`, "assault_buster_cannon");
  }

  return choices;
}

function multipleAssaultCost(state) {
  if (formId(state) === "buster") return 1;
  if (formId(state) === "assault_buster" || formId(state) === "assault_buster_cannon") return 1;
  return 2;
}

function multipleAssaultAttack() {
  return createAttack(60, 1, { type: "shoot", source: "マルチプルランチャー" });
}

function appendCannonOptions(state, attacks) {
  if (!Array.isArray(attacks) || attacks.length === 0) return attacks;

  if (state.v2CannonIgnoreReductionReady) {
    attacks.forEach(a => {
      a.ignoreReduction = true;
      a.ignoreDefense = true;
      a.addedIgnoreReduction = true;
    });

    state.v2CannonIgnoreReductionReady = false;
  }

  if (state.v2CannonCannotEvadeReady) {
    attacks.forEach(a => {
      a.cannotEvade = true;
      a.addedCannotEvade = true;
    });

    state.v2CannonCannotEvadeReady = false;
  }

  return attacks;
}

export function getV2DerivedState(state) {
  ensureV2State(state);

  const status = [];
  const slots = {};
  const specials = {};
  const derived = { status, slots, specials };

  if (usesV2DynamicEvadeCap(state)) {
    ensureV2DynamicEvadeCap(state);
    derived.evadeMax = state.v2DynamicEvadeMax;
  }

  const stock = state.v2EquipmentStock || {};
  status.push(
    `装備蓄積 A:${Number(stock.assault || 0)}/${V2_EQUIPMENT_MAX_STOCK} B:${Number(stock.buster || 0)}/${V2_EQUIPMENT_MAX_STOCK} C:${Number(stock.cannon || 0)}/${V2_EQUIPMENT_MAX_STOCK}`
  );

  if (usesV2DynamicEvadeCap(state)) {
    status.push(`回避ストック最大値現在 ${getV2CurrentEvadeMax(state)}`);
  }

  if (isAssaultBreakForm(state)) {
    status.push(`被弾解除カウント ${Number(state.v2AssaultHitTakenCount || 0)}/${ASSAULT_HIT_BREAK_COUNT}`);
  }

  if (state.v2CannonCharge > 0) status.push(`V2キャノン加算値 +${state.v2CannonCharge}`);
  if (state.v2WingGuardActive) status.push("光の翼：攻撃1ターン無効化待機");
  if (state.v2MegaBeamShieldActive) status.push(`メガビームシールド展開中 残り:${state.v2MegaBeamShieldCount}/3`);
  if (state.v2ShootGuardActive) status.push("射撃攻撃無効化待機");
  if (formId(state) === "cannon") status.push(`攻撃命中:${state.v2CannonHitCount}/3`);
  if (formId(state) === "buster") status.push(`2EX使用:${state.v2Buster2ExUsed}/3`);

  if (formId(state) === "buster") {
    if (Math.random() < 0.5) {
      slots.slot3 = {
        label: "3EX 回避 +2",
        desc: "回避2回",
        ex: true,
        effect: { type: "evade", amount: 2 }
      };
    }

    if (state.v2BusterTurnCount >= 2 && state.v2Buster2ExUsed < 3 && Math.random() < 0.2) {
      slots.slot2 = {
        label: "2EX マイクロミサイルポッド 10ダメージ×8回",
        desc: "10ダメージ×8回。射撃",
        ex: true,
        effect: { type: "attack", attackType: "shoot", damage: 10, count: 8, special: "v2_buster_2ex" }
      };
    }
  }

  if (formId(state) === "assault_buster") {
    if (Math.random() < 0.5) {
      slots.slot2 = {
        label: "2EX 回避 +4",
        desc: "回避4＋補填分の回避ストック最大値増加",
        ex: true,
        effect: { type: "custom", customType: "v2_ab_evade4" }
      };
    }
  }

  if (formId(state) === "assault_buster_cannon") {
    if (Math.random() < 0.5) {
      slots.slot2 = {
        label: "2EX 回避 +6",
        desc: "回避6＋補填分の回避ストック最大値増加",
        ex: true,
        effect: { type: "custom", customType: "v2_abc_evade6" }
      };
    }
  }

  return derived;
}

export function canUseV2Special(state, specialKey, context = {}) {
  ensureV2State(state);

  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "v2_mega_beam_shield") {
    return {
      allowed: state.v2MegaBeamShieldCount > 0 && !state.v2MegaBeamShieldActive,
      message: state.v2MegaBeamShieldCount > 0 ? null : "メガビームシールドは残り0"
    };
  }

  if (special.effectType === "v2_multiple_assault") {
    const cost = multipleAssaultCost(state);
    const ev = getRuleEvade(state, context);

    return {
      allowed: state.v2LastSlot4Ready && ev >= cost,
      message: state.v2LastSlot4Ready ? (ev >= cost ? null : "回避が足りない") : "直前に4の行動を選択していない"
    };
  }

  if (special.effectType === "v2_cannon_ignore_reduction") {
    const ev = getRuleEvade(state, context);
    return { allowed: ev >= 1, message: ev >= 1 ? null : "回避が足りない" };
  }

  if (special.effectType === "v2_cannon_cannot_evade") {
    const ev = getRuleEvade(state, context);
    return { allowed: ev >= 5, message: ev >= 5 ? null : "回避が足りない" };
  }

  return { allowed: true, message: null };
}

export function executeV2Special(state, specialKey, context = {}) {
  ensureV2State(state);

  const special = state.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "v2_change_form") {
    const choices = buildChangeChoices(state);

    if (choices.length === 0) return { handled: true, redraw: false, message: "選択可能な換装先がない" };

    return {
      handled: true,
      requestChoice: {
        choiceType: "select",
        source: "v2_change_form",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "V2 換装先選択",
        choices
      }
    };
  }

  if (special.effectType === "v2_mega_beam_shield") {
    if (state.v2MegaBeamShieldCount <= 0) return { handled: true, redraw: false, message: "メガビームシールドは残り0" };
    if (state.v2MegaBeamShieldActive) return { handled: true, redraw: false, message: "メガビームシールドは展開中" };

    state.v2MegaBeamShieldCount -= 1;
    state.v2MegaBeamShieldActive = true;

    return { handled: true, redraw: true, message: `メガビームシールド展開。残り${state.v2MegaBeamShieldCount}` };
  }

  if (special.effectType === "v2_multiple_assault") {
    const cost = multipleAssaultCost(state);

    if (!state.v2LastSlot4Ready) return { handled: true, redraw: false, message: "直前に4の行動を選択していない" };
    if (getRuleEvade(state, context) < cost) return { handled: true, redraw: false, message: "回避が足りない" };

    if (!consumeRuleEvade(state, cost, context)) {
      return { handled: true, redraw: false, message: "回避が足りない" };
    }

    return {
      handled: true,
      redraw: true,
      message: `マルチプルアサルト追撃：回避${cost}消費`,
      appendAttacks: multipleAssaultAttack()
    };
  }

  if (special.effectType === "v2_cannon_ignore_reduction") {
    if (getRuleEvade(state, context) < 1) return { handled: true, redraw: false, message: "回避が足りない" };

    if (!consumeRuleEvade(state, 1, context)) {
      return { handled: true, redraw: false, message: "回避が足りない" };
    }

    state.v2CannonIgnoreReductionReady = true;

    return { handled: true, redraw: true, message: "出力安定化：次の攻撃に軽減不可付与" };
  }

  if (special.effectType === "v2_cannon_cannot_evade") {
    if (getRuleEvade(state, context) < 5) return { handled: true, redraw: false, message: "回避が足りない" };

    if (!consumeRuleEvade(state, 5, context)) {
      return { handled: true, redraw: false, message: "回避が足りない" };
    }

    state.v2CannonCannotEvadeReady = true;

    return { handled: true, redraw: true, message: "命中補正最大：次の攻撃に必中付与" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onV2BeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureV2State(state);

  const messages = [];

  if (formId(state) === "assault") {
    ensureV2DynamicEvadeCap(state);
    damageSelf(state, 10, context);
    reduceCap(state, 1);
    messages.push("V2アサルト特性：HP-10、回避ストック最大値-1");
  }

  if (formId(state) === "buster") {
    state.v2BusterTurnCount += 1;
    damageSelf(state, 20, context);
    messages.push("V2バスター特性：HP-20");
  }

  if (formId(state) === "cannon") {
    damageSelf(state, 10, context);
    messages.push("V2キャノン特性：HP-10");
  }

  if (formId(state) === "assault_buster") {
    ensureV2DynamicEvadeCap(state);
    addRuleEvade(state, 1, context);
    reduceCap(state, 1);
    damageSelf(state, 30, context);
    messages.push("V2AB特性：回避+1、回避ストック最大値-1、HP-30");
  }

  if (formId(state) === "assault_buster_cannon") {
    ensureV2DynamicEvadeCap(state);
    addRuleEvade(state, 1, context);
    reduceCap(state, 1);
    damageSelf(state, 50, context);
    messages.push("V2ABC特性：回避+1、回避ストック最大値-1、HP-50");
  }

  if (usesV2DynamicEvadeCap(state) && getV2CurrentEvadeMax(state) <= 0) {
    messages.push(changeToV2(state, "回避ストック最大値0：V2ガンダムへ変形、HP50回復", context));
  }

  return { redraw: messages.length > 0, message: messages.join(" / ") || null };
}

export function onV2EnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureV2State(state);
  return { redraw: false, message: null };
}

export function onV2AfterSlotResolved(state, slotNumber, payload = {}) {
  ensureV2State(state);

  const resolveResult = payload.resolveResult || payload;
  const customEffectId = resolveResult.customEffectId;
  const context = payload.context || payload;
  const messages = [];
  let appendAttacks = [];

  const resolvedSlotKey = payload.slotKey || payload.currentAttackContext?.slotKey || payload.attackContext?.slotKey || "";
  const resolvedSlotNumber = Number(slotNumber || 0) || Number(payload.slotNumber || 0) || (resolvedSlotKey === "slot4" ? 4 : 0);

  state.v2LastSlot4Ready = resolvedSlotNumber === 4 || resolvedSlotKey === "slot4";

  if (customEffectId === "v2_wings_guard") {
    state.v2WingGuardActive = true;
    state.v2WingGuardCountered = false;
    state.v2WingGuardOwnerTurnEnds = 0;
    messages.push("光の翼：次の相手ターン中の全攻撃を無効化");
  }

  if (customEffectId === "v2_assault_slot1") {
    addRuleEvade(state, 1, context);
    addCap(state, 1);
    appendAttacks.push(...createAttack(20, 1, { type: "shoot", source: "牽制射撃" }));
    messages.push("牽制射撃：回避+1、回避ストック最大値+1");
  }

  if (customEffectId === "v2_assault_evade3") {
    addEvadeWithAssaultCapRule(state, 3, context);
    messages.push("回避+3、補填分の回避ストック最大値増加");
  }

  if (customEffectId === "v2_assault_slot3") {
    const ev = getRuleEvade(state, context);
    appendAttacks.push(...createAttack(ev > 0 ? 15 : 60, ev > 0 ? ev : 1, { type: "melee", source: "強襲格闘" }));
  }

  if (customEffectId === "v2_assault_slot5") {
    addRuleEvade(state, 2, context);
    addCap(state, 2);
    appendAttacks.push(...createAttack(50, 1, { type: "melee", beam: true, ignoreReduction: true, ignoreDefense: true, source: "光の翼" }));
    messages.push("光の翼：回避+2、回避ストック最大値+2");
  }

  if (customEffectId === "v2_assault_slot6") {
    const ev = getRuleEvade(state, context);
    if (ev > 0) appendAttacks.push(...createAttack(ev * 20, 1, { type: "shoot", beam: true, source: "ヴェスバー" }));
    else messages.push("ヴェスバー不発：所持回避0");
  }

  if (customEffectId === "v2_heal50_evade2") {
    heal(state, 50, context);
    addRuleEvade(state, 2, context);
    messages.push("HP50回復、回避+2");
  }

if (customEffectId === "v2_cannon_charge20") {
  state.v2CannonCharge += 20;
  messages.push(`チャージ：V2キャノン加算値+20（現在+${state.v2CannonCharge}）`);
}
  if (customEffectId === "v2_cannon_evade1_charge5") {
    addRuleEvade(state, 1, context);
    state.v2CannonCharge += 5;
    messages.push(`回避+1、V2キャノン加算値+5（現在+${state.v2CannonCharge}）`);
  }

  if (customEffectId === "v2_cannon_saber") {
    appendAttacks.push(...createAttack(v2CannonDamage(state, 150), 1, { type: "melee", beam: true, source: "大口径ビームサーベル" }));
  }

  if (customEffectId === "v2_cannon_beam_cannon") {
    appendAttacks.push(...createAttack(v2CannonDamage(state, 150), 1, { type: "shoot", beam: true, source: "大口径ビームキャノン" }));
  }

  if (customEffectId === "v2_ab_evade4") {
    addEvadeWithAssaultCapRule(state, 4, context);
    messages.push("回避+4、補填分の回避ストック最大値増加");
  }

  if (customEffectId === "v2_ab_slot3") {
    const ev = getRuleEvade(state, context);
    appendAttacks.push(...createAttack(ev > 0 ? 30 : 80, ev > 0 ? ev : 1, { type: "melee", beam: true, source: "ビームサーベル" }));
  }

  if (customEffectId === "v2_ab_slot5") {
    heal(state, 30, context);
    addRuleEvade(state, 1, context);
    addCap(state, 1);
    messages.push("HP30回復、回避+1、回避ストック最大値+1");
  }

  if (customEffectId === "v2_ab_slot6") {
    const ev = getRuleEvade(state, context);

    state.v2WingGuardActive = true;
    state.v2WingGuardCountered = false;
    state.v2WingGuardOwnerTurnEnds = 0;

    addCap(state, 1);

    if (ev > 0) appendAttacks.push(...createAttack(30, ev, { type: "melee", beam: true, source: "光の翼" }));

    messages.push("光の翼：次の相手ターン中の全攻撃を無効化、回避ストック最大値+1");
  }

  if (customEffectId === "v2_abc_slot1") {
    state.v2ShootGuardActive = true;
    appendAttacks.push(...createAttack(v2CannonDamage(state, 150), 1, { type: "shoot", beam: true, source: "大口径ビームキャノン" }));
    messages.push("次のターンの相手射撃攻撃無効化");
  }

  if (customEffectId === "v2_abc_slot3") {
    appendAttacks.push(...createAttack(v2CannonDamage(state, 150), 1, { type: "melee", beam: true, source: "大口径ビームサーベル" }));
  }

  if (customEffectId === "v2_abc_evade4") {
    addEvadeWithAssaultCapRule(state, 4, context);
    messages.push("回避+4、補填分の回避ストック最大値増加");
  }

  if (customEffectId === "v2_abc_evade6") {
    addEvadeWithAssaultCapRule(state, 6, context);
    messages.push("回避+6、補填分の回避ストック最大値増加");
  }

  if (customEffectId === "v2_abc_slot5") {
    const ev = getRuleEvade(state, context);
    appendAttacks.push(...createAttack(ev > 0 ? 20 : 60, ev > 0 ? ev : 1, { type: "melee", beam: true, source: "ビームサーベル" }));
  }

  if (customEffectId === "v2_abc_slot6") {
    const ev = getRuleEvade(state, context);

    if (ev > 0) {
      appendAttacks.push(...createAttack(ev * 10, 1, { type: "melee", beam: true, special: "v2_abc_wings_hit", source: "光の翼" }));
    } else {
      messages.push("光の翼不発：所持回避0");
    }
  }

  appendAttacks = appendCannonOptions(state, appendAttacks);

  return {
    redraw: messages.length > 0 || appendAttacks.length > 0,
    message: messages.join(" / ") || null,
    appendAttacks
  };
}

export function onV2ActionResolved(attacker, defender, context = {}) {
  ensureV2State(attacker);

  const messages = [];

  if (context.slotKey === "slot2" && formId(attacker) === "buster" && context.slotLabel?.includes("2EX")) {
    attacker.v2Buster2ExUsed += 1;
    messages.push(`2EX使用:${attacker.v2Buster2ExUsed}/3`);

    if (attacker.v2Buster2ExUsed >= 3) {
      messages.push(changeToV2(attacker, "2EXを3回使用：V2ガンダムへ変形、HP50回復", context));
    }
  }

  if (formId(attacker) === "cannon" && context.hitCount > 0 && (context.slotKey === "slot5" || context.slotKey === "slot6")) {
    attacker.v2CannonHitCount += 1;
    messages.push(`V2キャノン攻撃命中:${attacker.v2CannonHitCount}/3`);

    if (attacker.v2CannonHitCount >= 3) {
      messages.push(changeToV2(attacker, "攻撃行動3回命中：V2ガンダムへ変形、HP50回復", context));
    }
  }

  if (context.hitCount > 0 && context.currentAttack?.some?.(a => a?.special === "v2_buster_wings_hit_heal")) {
    heal(attacker, 50, context);
    messages.push("光の翼命中：HP50回復");
  }

  if (context.hitCount > 0 && context.currentAttack?.some?.(a => a?.special === "v2_abc_wings_hit") && defender) {
    consumeEnemyRuleEvade(defender, 3, context);
    addRuleEvade(attacker, 3, context);
    messages.push("光の翼命中：相手回避-3、自分回避+3");
  }

  return { redraw: messages.length > 0, message: messages.join(" / ") || null };
}

export function onV2Damaged(defender, attacker, context = {}) {
  ensureV2State(defender);

  if (!isAssaultBreakForm(defender)) {
    return { redraw: false, message: null };
  }

  defender.v2AssaultHitTakenCount += 1;

  if (defender.v2AssaultHitTakenCount >= ASSAULT_HIT_BREAK_COUNT) {
    const message = changeToV2(defender, "20回被弾：V2ガンダムへ換装解除、HP50回復", context);
    return { redraw: true, message };
  }

  return {
    redraw: true,
    message: `V2被弾解除カウント：${defender.v2AssaultHitTakenCount}/${ASSAULT_HIT_BREAK_COUNT}`
  };
}

export function modifyV2TakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureV2State(defender);

  if (defender.v2MegaBeamShieldActive && !isIgnoreReduction(attack)) {
    return { damage: 0, cancelled: true, message: "メガビームシールド：攻撃無効" };
  }

  if (defender.v2WingGuardActive && !isIgnoreReduction(attack)) {
    const counter = defender.v2WingGuardCountered ? [] : createAttack(80, 1, {
      type: "melee",
      beam: true,
      ignoreReduction: true,
      ignoreDefense: true,
      source: "光の翼カウンター"
    });

    defender.v2WingGuardCountered = true;

    return {
      damage: 0,
      cancelled: true,
      message: "光の翼：攻撃無効",
      appendAttacks: counter,
      appendAttackLabel: "光の翼カウンター",
      appendSlotLabel: "光の翼カウンター",
      appendSlotDesc: "80ダメージ。格闘。ビーム。軽減不可"
    };
  }

  if (defender.v2ShootGuardActive && isAttackType(attack, "shoot") && !isIgnoreReduction(attack)) {
    return { damage: 0, cancelled: true, message: "大口径ビームキャノン：射撃攻撃無効" };
  }

  return { damage, message: null };
}

export function modifyV2EvadeAttempt(defender, attacker, attack, context = {}) {
  ensureV2State(defender);
  return { handled: false };
}

export function onV2TurnEnd(state, context = {}) {
  ensureV2State(state);

  const stockMessage = tickV2EquipmentStock(state, context);

  state.v2MegaBeamShieldActive = false;

  if (state.v2WingGuardActive) {
    state.v2WingGuardOwnerTurnEnds = Number(state.v2WingGuardOwnerTurnEnds || 0) + 1;

    if (state.v2WingGuardOwnerTurnEnds >= 2) {
      state.v2WingGuardActive = false;
      state.v2WingGuardCountered = false;
      state.v2WingGuardOwnerTurnEnds = 0;
    }
  } else {
    state.v2WingGuardCountered = false;
    state.v2WingGuardOwnerTurnEnds = 0;
  }

  state.v2ShootGuardActive = false;
  state.v2LastSlot4Ready = false;

  if (state.shieldActive) state.shieldActive = false;

  return { redraw: true, message: stockMessage };
}

export function onV2ResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureV2State(state);

  if (pendingChoice.source === "v2_change_form") {
    const message = changeForm(state, selectedValue, context);
    return { handled: true, redraw: true, message };
  }

  return { handled: false, redraw: false, message: null };
}
