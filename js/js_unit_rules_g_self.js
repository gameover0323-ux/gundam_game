import { setForm, addEvade, reduceEvade, normalizeEvadeCapState } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

const BASE_EVADE_MAX = {
  space: 6,
  atmospheric: 6,
  reflector: 6,
  tricky: 6,
  high_torque: 2,
  assault: 3,
  perfect: 12
};

const PACK_LABEL = {
  space: "宇宙用",
  atmospheric: "大気圏",
  reflector: "リフレクター",
  tricky: "トリッキー",
  high_torque: "高トルク",
  assault: "アサルト",
  perfect: "パーフェクト"
};

const INITIAL_UNLOCKED = ["space", "atmospheric"];

function ensureGSelfState(state) {
  if (!state) return;
  if (!state.gselfUnlockedPacks || typeof state.gselfUnlockedPacks !== "object") {
    state.gselfUnlockedPacks = { space: true, atmospheric: true };
  }
  INITIAL_UNLOCKED.forEach(pack => { state.gselfUnlockedPacks[pack] = true; });
  if (!state.gselfEvadeMaxBonusByPack || typeof state.gselfEvadeMaxBonusByPack !== "object") {
    state.gselfEvadeMaxBonusByPack = {};
  }
  Object.keys(BASE_EVADE_MAX).forEach(pack => {
    if (typeof state.gselfEvadeMaxBonusByPack[pack] !== "number") state.gselfEvadeMaxBonusByPack[pack] = 0;
  });
  if (!state.gselfShieldCounts || typeof state.gselfShieldCounts !== "object") {
    state.gselfShieldCounts = {};
  }
  if (typeof state.gselfShieldCounts.space !== "number") state.gselfShieldCounts.space = 3;
  if (typeof state.gselfShieldCounts.atmospheric !== "number") state.gselfShieldCounts.atmospheric = 3;
  if (typeof state.gselfShieldCounts.reflector !== "number") state.gselfShieldCounts.reflector = 3;
  if (typeof state.gselfShieldCounts.perfect !== "number") state.gselfShieldCounts.perfect = 3;
  if (typeof state.gselfSpaceShieldActive !== "boolean") state.gselfSpaceShieldActive = false;
  if (typeof state.gselfAtmosphericShieldActive !== "boolean") state.gselfAtmosphericShieldActive = false;
  if (typeof state.gselfReflectorShieldActive !== "boolean") state.gselfReflectorShieldActive = false;
  if (typeof state.gselfPhotonArmorShieldActive !== "boolean") state.gselfPhotonArmorShieldActive = false;
  if (typeof state.gselfPhotonShieldBarrier !== "number") state.gselfPhotonShieldBarrier = 0;
  if (typeof state.gselfEmergencyEscapeActive !== "boolean") state.gselfEmergencyEscapeActive = false;
  if (typeof state.gselfReflectorStockDamage !== "number") state.gselfReflectorStockDamage = 0;
  if (typeof state.gselfReflectorStockCount !== "number") state.gselfReflectorStockCount = 0;
  if (typeof state.gselfRocketBoostCount !== "number") state.gselfRocketBoostCount = 0;
  if (typeof state.gselfPhotonSearcherReady !== "boolean") state.gselfPhotonSearcherReady = false;
  if (typeof state.gselfOmniLaserActive !== "boolean") state.gselfOmniLaserActive = false;
  if (typeof state.gselfPerfectRestTurn !== "number") state.gselfPerfectRestTurn = 0;
  applyPackEvadeMax(state);
}

function getAdapter(context = {}) { return context?.twoVtwoAdapter || null; }
function getOwnerPlayer(context = {}) { return context?.ownerPlayer || context?.defenderPlayer || context?.targetPlayer || context?.player || null; }

function getRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.getEvade && ownerPlayer) return adapter.getEvade(ownerPlayer, state);
  return Math.max(0, Number(state?.evade || 0));
}

function consumeRuleEvade(state, amount, context = {}) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  if (cost <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.consumeEvade && ownerPlayer) return adapter.consumeEvade(ownerPlayer, state, cost);
  if (!state || Number(state.evade || 0) < cost) return false;
  reduceEvade(state, cost);
  normalizeEvadeCapState(state);
  return true;
}

function consumeRuleAction(state, amount, context = {}) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  if (cost <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.consumeAction && ownerPlayer) return adapter.consumeAction(ownerPlayer, state, cost);
  if (Number(state?.actionCount || 0) < cost) return false;
  state.actionCount = Math.max(0, Number(state.actionCount || 0) - cost);
  return true;
}

function addRuleAction(state, amount, context = {}) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  if (value <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.addAction && ownerPlayer) return adapter.addAction(ownerPlayer, state, value);
  if (adapter?.addActionCount && ownerPlayer) return adapter.addActionCount(ownerPlayer, state, value);
  state.actionCount = Math.max(0, Number(state.actionCount || 0) + value);
  return true;
}

function addRuleEvade(state, amount, context = {}) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  if (value <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.addEvade && ownerPlayer) return adapter.addEvade(ownerPlayer, state, value);
  addEvade(state, value);
  return true;
}

function consumeRuleHp(state, amount, context = {}) {
  const cost = Math.max(0, Math.floor(Number(amount || 0)));
  if (cost <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.consumeHp && ownerPlayer) return adapter.consumeHp(ownerPlayer, state, cost);
  if (!state || Number(state.hp || 0) <= cost) return false;
  state.hp = Math.max(0, Number(state.hp || 0) - cost);
  return true;
}

function healRuleHp(state, amount, context = {}) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  if (value <= 0) return true;
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.healHp && ownerPlayer) return adapter.healHp(ownerPlayer, state, value);
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + value);
  return true;
}

function setEnemyEvadeZero(enemyState) {
  if (!enemyState) return;
  enemyState.evade = 0;
  normalizeEvadeCapState(enemyState);
}

function reduceEnemyEvade(enemyState, amount) {
  if (!enemyState) return;
  reduceEvade(enemyState, amount);
  normalizeEvadeCapState(enemyState);
}

function reduceEnemyEvadeRule(enemyState, amount, context = {}) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  if (!enemyState || value <= 0) return true;
  const adapter = getAdapter(context);
  const enemyPlayer = context?.enemyPlayer || null;
  if (adapter?.consumeEvade && enemyPlayer) {
    return adapter.consumeEvade(enemyPlayer, enemyState, value);
  }
  reduceEnemyEvade(enemyState, value);
  return true;
}

function applyPackEvadeMax(state) {
  if (!state) return;
  const formId = state.formId || "space";
  const base = Number(BASE_EVADE_MAX[formId] || state.evadeMax || 0);
  const bonus = Math.max(0, Number(state.gselfEvadeMaxBonusByPack?.[formId] || 0));
  const nextMax = base + bonus;
  state.evadeMax = nextMax;
  state.evadeRedCap = Math.max(nextMax, Math.min(Number(state.evadeRedCap || nextMax), Number(state.evadeGoldCap || 50)));
  normalizeEvadeCapState(state);
}

function changePack(state, packId) {
  ensureGSelfState(state);
  if (!state.gselfUnlockedPacks[packId]) return false;
  const beforeFormId = state.formId || "space";
  if (beforeFormId !== packId) {
    clearReflectorStock(state);
  }
  setForm(state, packId, { preserveHp: true, preserveEvade: true });
  applyPackEvadeMax(state);
  return true;
}

function unlockPack(state, packId) {
  ensureGSelfState(state);
  state.gselfUnlockedPacks[packId] = true;
  if ((state.gselfUnlockedPacks.high_torque && state.gselfUnlockedPacks.assault) || state.gselfUnlockedPacks.perfect) {
    state.gselfUnlockedPacks.perfect = true;
  }
}

function addPackEvadeMax(state, packId) {
  ensureGSelfState(state);
  state.gselfEvadeMaxBonusByPack[packId] = Math.max(0, Number(state.gselfEvadeMaxBonusByPack[packId] || 0)) + 1;
  applyPackEvadeMax(state);
}

function getSelectablePackIds(state, options = {}) {
  ensureGSelfState(state);
  const includeCurrent = options.includeCurrent === true;
  return Object.keys(PACK_LABEL).filter(packId => {
    if (!state.gselfUnlockedPacks[packId]) return false;
    if (!includeCurrent && packId === state.formId) return false;
    return true;
  });
}

function makePackChoice(state, context = {}) {
  ensureGSelfState(state);
  return {
    choiceType: "generic",
    source: "gself_pack_change",
    ownerPlayer: context.ownerPlayer,
    enemyPlayer: context.enemyPlayer,
    title: `PLAYER ${context.ownerPlayer || ""} Gセルフ換装`,
    choices: getSelectablePackIds(state, { includeCurrent: false }).map(packId => ({
      label: `${PACK_LABEL[packId]}パック`,
      value: packId
    }))
  };
}

function buildChangeSpecials(state) {
  ensureGSelfState(state);
  return {};
}

function poweredSlot(slot, bonus) {
  if (!slot?.effect || slot.effect.type !== "attack") return slot;
  return {
    ...slot,
    label: `${slot.label} +${bonus}`,
    desc: `${slot.desc}。ロケットブースター/リフレクター蓄積により威力加算。`,
    effect: {
      ...slot.effect,
      damage: Math.max(0, Number(slot.effect.damage || 0) + bonus)
    }
  };
}

function shouldReflectAttack(attack) {
  return !!attack && attack.beam === true && attack.type === "shoot";
}

function getAttackBaseDamage(attack) {
  return Math.max(0, Number(attack?.damage || 0));
}

function clearReflectorStock(state) {
  if (!state) return;
  state.gselfReflectorStockDamage = 0;
  state.gselfReflectorStockCount = 0;
}

function makeOmniLaserSlot() {
  return {
    label: "6EX 全方位レーザー",
    desc: "相手の回避を0にする＋再行動。射撃、ビーム",
    ex: true,
    effect: { type: "custom", customType: "gself_omni_laser" }
  };
}

export function getGSelfDerivedState(state) {
  ensureGSelfState(state);
  const formId = state.formId || "space";
  const status = [
    `解放:${Object.keys(PACK_LABEL).filter(pack => state.gselfUnlockedPacks[pack]).map(pack => PACK_LABEL[pack]).join("/")}`,
    `回避上限補正:${PACK_LABEL[formId] || formId}+${Math.max(0, Number(state.gselfEvadeMaxBonusByPack[formId] || 0))}`
  ];
  if (formId === "space") status.push(`宇宙用シールド:${Math.max(0, Number(state.gselfShieldCounts.space || 0))}/3`);
  if (formId === "atmospheric") status.push(`トワサンガシールド:${Math.max(0, Number(state.gselfShieldCounts.atmospheric || 0))}/3`);
  if (formId === "reflector") status.push(`リフレクター盾:${Math.max(0, Number(state.gselfShieldCounts.reflector || 0))}/3`);
  if (formId === "reflector" || formId === "perfect") status.push(`リフレクター蓄積:${Math.max(0, Number(state.gselfReflectorStockDamage || 0))} / ${Math.max(0, Number(state.gselfReflectorStockCount || 0))}/8`);
  if (formId === "perfect") {
    status.push(`フォトン装甲盾:${Math.max(0, Number(state.gselfShieldCounts.perfect || 0))}/3`);
    if (state.gselfPhotonSearcherReady) status.push({ text: "フォトン･サーチャー待機", color: "#ffd84a", bold: true });
    if (state.gselfOmniLaserActive) status.push({ text: "slot6:全方位レーザー", color: "#ffd84a", bold: true });
  }
  if (state.gselfRocketBoostCount > 0) status.push(`ロケットブースター:${state.gselfRocketBoostCount}回`);
  if (state.gselfPhotonShieldBarrier > 0) status.push("フォトン･シールド無効:1回");

  const slots = {};
  const reflectorBonus = (formId === "reflector" || formId === "perfect") ? Number(state.gselfReflectorStockDamage || 0) : 0;
  const bonus = Math.max(0, Number(state.gselfRocketBoostCount || 0) * 50 + reflectorBonus);
  const currentSlots = state.slots || {};
  Object.entries(currentSlots).forEach(([slotKey, slot]) => {
    if (slot?.effect?.type !== "attack") return;
    if (bonus <= 0) return;
    if (state.gselfReflectorStockDamage > 0 && slot.effect.attackType !== "shoot") return;
    slots[slotKey] = poweredSlot(slot, bonus);
  });

  if (formId === "space" && Number(state.gselfShieldCounts.space || 0) <= 0) {
    slots.slot2 = { label: "2EX ビームサーベル最大パワー 100ダメージ", desc: "100ダメージ。格闘、ビーム", ex: true, effect: { type: "attack", attackType: "melee", damage: 100, count: 1, beam: true } };
  }
  if (formId === "space" && state.gselfUnlockedPacks.reflector) {
    slots.slot5 = { label: "5EX 機動性上昇", desc: "宇宙用パックの回避ストック最大値を1増加させる。", ex: true, effect: { type: "custom", customType: "gself_evade_max_up_space" } };
  }
  if (formId === "atmospheric" && state.gselfUnlockedPacks.tricky) {
    slots.slot5 = { label: "5EX 機動性上昇", desc: "大気圏パックの回避ストック最大値を1増加させる。", ex: true, effect: { type: "custom", customType: "gself_evade_max_up_atmospheric" } };
  }
  if (formId === "reflector" && state.gselfUnlockedPacks.assault) {
    slots.slot5 = { label: "5EX ビームライフル出力解放 100ダメージ", desc: "100ダメージ。射撃、ビーム、軽減不可", ex: true, effect: { type: "attack", attackType: "shoot", damage: 100, count: 1, beam: true, ignoreReduction: true } };
  }
  if (formId === "tricky" && state.gselfUnlockedPacks.high_torque) {
    slots.slot5 = { label: "5EX ジャマー", desc: "相手の回避所持数を0にする。", ex: true, effect: { type: "custom", customType: "gself_jammer" } };
  }
  if (formId === "perfect" && state.gselfOmniLaserActive) {
    slots.slot6 = makeOmniLaserSlot();
  }
  if (state.gselfPhotonSearcherReady) {
    Object.entries(currentSlots).forEach(([slotKey, slot]) => {
      const effectiveSlot = slots[slotKey] || slot;
      if (effectiveSlot?.effect?.type !== "attack") return;
      slots[slotKey] = {
        ...effectiveSlot,
        desc: `${effectiveSlot.desc}。フォトン･サーチャーにより必中付与。`,
        effect: { ...effectiveSlot.effect, cannotEvade: true, addedCannotEvade: true }
      };
    });
  }

  return { status, slots, specials: buildChangeSpecials(state) };
}

export function canUseGSelfSpecial(state, specialKey, context = {}) {
  ensureGSelfState(state);
  const special = state.specials?.[specialKey];
  const effectType = special?.effectType || specialKey;
  if (effectType === "gself_space_shield") return { allowed: Number(state.gselfShieldCounts.space || 0) > 0, message: "使用回数がない" };
  if (effectType === "gself_atmospheric_shield") return { allowed: Number(state.gselfShieldCounts.atmospheric || 0) > 0, message: "使用回数がない" };
  if (effectType === "gself_reflector_shield") return { allowed: Number(state.gselfShieldCounts.reflector || 0) > 0, message: "使用回数がない" };
  if (effectType === "gself_photon_armor_shield") return { allowed: Number(state.gselfShieldCounts.perfect || 0) > 0, message: "使用回数がない" };
  if (effectType === "gself_illusion_funnel") {
    const adapter = getAdapter(context);
    const ownerPlayer = getOwnerPlayer(context);
    const actions = adapter?.getActionCount && ownerPlayer ? adapter.getActionCount(ownerPlayer, state) : Number(state.actionCount || 0);
    return { allowed: actions >= 1, message: actions >= 1 ? null : "行動権が足りない" };
  }
  if (effectType === "gself_photon_searcher") {
    const ev = getRuleEvade(state, context);
    return { allowed: ev >= 3, message: ev >= 3 ? null : "回避が足りない" };
  }
  if (effectType === "gself_high_torque_charge") {
    return { allowed: Number(state.hp || 0) > 200, message: Number(state.hp || 0) > 200 ? null : "HPが足りない" };
  }
  if (effectType === "gself_change_pack") {
    if (state.formId === "perfect") return { allowed: false, message: "パーフェクトパック中は手動換装できない" };
    const choices = getSelectablePackIds(state, { includeCurrent: false });
    return { allowed: choices.length > 0, message: choices.length > 0 ? null : "換装先がない" };
  }
  if (effectType.startsWith("gself_change_")) {
    const packId = effectType.replace("gself_change_", "");
    if (state.formId === "perfect") return { allowed: false, message: "パーフェクトパック中は手動換装できない" };
    return { allowed: !!state.gselfUnlockedPacks[packId], message: state.gselfUnlockedPacks[packId] ? null : "未解放" };
  }
  return { allowed: true, message: null };
}

export function executeGSelfSpecial(state, specialKey, context = {}) {
  ensureGSelfState(state);
  const special = state.specials?.[specialKey];
  const effectType = special?.effectType || specialKey;
  if (effectType === "gself_space_shield") {
    if (Number(state.gselfShieldCounts.space || 0) <= 0) return { handled: true, redraw: false, message: "使用回数が残っていない" };
    state.gselfShieldCounts.space -= 1;
    state.gselfSpaceShieldActive = true;
    return { handled: true, redraw: true, message: "シールド(宇宙用)展開" };
  }
  if (effectType === "gself_atmospheric_shield") {
    if (Number(state.gselfShieldCounts.atmospheric || 0) <= 0) return { handled: true, redraw: false, message: "使用回数が残っていない" };
    state.gselfShieldCounts.atmospheric -= 1;
    state.gselfAtmosphericShieldActive = true;
    return { handled: true, redraw: true, message: "シールド(トワサンガ)展開" };
  }
  if (effectType === "gself_reflector_shield") {
    if (Number(state.gselfShieldCounts.reflector || 0) <= 0) return { handled: true, redraw: false, message: "使用回数が残っていない" };
    state.gselfShieldCounts.reflector -= 1;
    state.gselfReflectorShieldActive = true;
    return { handled: true, redraw: true, message: "シールド(リフレクター)展開" };
  }
  if (effectType === "gself_photon_armor_shield") {
    if (Number(state.gselfShieldCounts.perfect || 0) <= 0) return { handled: true, redraw: false, message: "使用回数が残っていない" };
    state.gselfShieldCounts.perfect -= 1;
    state.gselfPhotonArmorShieldActive = true;
    return { handled: true, redraw: true, message: "フォトン装甲シールド展開" };
  }
  if (effectType === "gself_illusion_funnel") {
    if (!consumeRuleAction(state, 1, context)) return { handled: true, redraw: false, message: "行動権が足りない" };
    addRuleEvade(state, 2, context);
    return { handled: true, redraw: true, message: "イリュージョンファンネル：回避+2" };
  }
  if (effectType === "gself_high_torque_charge") {
    if (!consumeRuleHp(state, 200, context)) return { handled: true, redraw: false, message: "HPが足りない" };
    state.gselfUnlockedPacks.high_torque = false;
    changePack(state, "atmospheric");
    return { handled: true, redraw: true, message: "高トルクパック突撃", startSlotAction: { slotKey: "slot7" } };
  }
  if (effectType === "gself_emergency_escape") {
    state.gselfUnlockedPacks.assault = false;
    state.gselfSpaceShieldActive = false;
    state.gselfAtmosphericShieldActive = false;
    state.gselfReflectorShieldActive = false;
    state.gselfPhotonArmorShieldActive = false;
    state.gselfEmergencyEscapeActive = true;
    changePack(state, "space");
    return { handled: true, redraw: true, message: "緊急離脱：攻撃無効化" };
  }
  if (effectType === "gself_photon_searcher") {
    if (!consumeRuleEvade(state, 3, context)) return { handled: true, redraw: false, message: "回避が足りない" };
    state.gselfPhotonSearcherReady = true;
    return { handled: true, redraw: true, message: "フォトン･サーチャー待機" };
  }
  if (effectType === "gself_omni_laser_toggle") {
    state.gselfOmniLaserActive = !state.gselfOmniLaserActive;
    return { handled: true, redraw: true, message: null };
  }
  if (effectType === "gself_change_pack") {
    if (state.formId === "perfect") {
      return { handled: true, redraw: false, message: "パーフェクトパック中は手動換装できない" };
    }
    return { handled: true, redraw: true, message: null, requestChoice: makePackChoice(state, context) };
  }
  if (effectType.startsWith("gself_change_")) {
    if (state.formId === "perfect") {
      return { handled: true, redraw: false, message: "パーフェクトパック中は手動換装できない" };
    }
    const packId = effectType.replace("gself_change_", "");
    const ok = changePack(state, packId);
    return { handled: true, redraw: true, message: ok ? `${PACK_LABEL[packId]}パックへ換装` : "未解放" };
  }
  return { handled: false, redraw: false, message: null };
}

export function onGSelfBeforeSlot(state) {
  ensureGSelfState(state);
  if (state.gselfPerfectRestTurn > 0) {
    state.gselfPerfectRestTurn -= 1;
    return { redraw: true, cancelSlot: true, message: "パーフェクトパック反動：このターンは行動不能" };
  }
  if (state.formId === "high_torque") {
    state.hp = Math.max(1, Number(state.hp || 0) - 10);
    return { redraw: true, message: "高トルクパック特性：HP-10" };
  }
  if (state.formId === "perfect") {
    state.hp = Math.max(0, Number(state.hp || 0) - 50);
    if (state.hp <= 0) return { redraw: true, message: "パーフェクトパック特性：HP-50" };
    if (state.hp <= 50) {
      state.gselfPerfectRestTurn = 1;
      changePack(state, "atmospheric");
      return { redraw: true, message: "パーフェクトパック反動：大気圏パックへ強制換装" };
    }
    return { redraw: true, message: "パーフェクトパック特性：HP-50" };
  }
  return { redraw: false, message: null };
}

export function onGSelfAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureGSelfState(state);
  const result = payload.resolveResult || payload;
  const customEffectId = result.customEffectId;
  const context = payload.context || payload;
  const enemyState = context.enemyState || payload.enemyState || null;
  if (customEffectId === "gself_unlock_reflector") { unlockPack(state, "reflector"); return { redraw: true, message: "リフレクターパック解放" }; }
  if (customEffectId === "gself_unlock_tricky") { unlockPack(state, "tricky"); return { redraw: true, message: "トリッキーパック解放" }; }
  if (customEffectId === "gself_unlock_assault") { unlockPack(state, "assault"); return { redraw: true, message: "アサルトパック解放" }; }
  if (customEffectId === "gself_unlock_high_torque") { unlockPack(state, "high_torque"); return { redraw: true, message: "高トルクパック解放" }; }
  if (customEffectId === "gself_evade_max_up_space") { addPackEvadeMax(state, "space"); return { redraw: true, message: "宇宙用パック回避上限+1" }; }
  if (customEffectId === "gself_evade_max_up_atmospheric") { addPackEvadeMax(state, "atmospheric"); return { redraw: true, message: "大気圏パック回避上限+1" }; }
  if (customEffectId === "gself_rocket_booster") { state.gselfRocketBoostCount += 1; return { redraw: true, message: "ロケットブースター：次の攻撃アクション威力+50" }; }
  if (customEffectId === "gself_jammer") { setEnemyEvadeZero(enemyState); return { redraw: true, message: "ジャマー：相手回避0" }; }
  if (customEffectId === "gself_traffic_fin") { addRuleEvade(state, 2, context); return { redraw: true, appendAttacks: createAttack(10, 5, { type: "shoot", source: "トラフィック・フィン" }) }; }
  if (customEffectId === "gself_omni_laser") { setEnemyEvadeZero(enemyState); addRuleAction(state, 1, context); return { redraw: true, message: "全方位レーザー：相手回避0＋再行動" }; }
  return { redraw: false, message: null };
}

export function onGSelfActionResolved(state, payload = {}) {
  ensureGSelfState(state);
  const usedAttack = Array.isArray(payload?.resolvedAttacks) && payload.resolvedAttacks.length > 0;
  const messages = [];
  let redraw = false;

  const isPhotonTorpedo =
    state.formId === "perfect" &&
    (payload?.slotKey === "slot6" || Number(payload?.slotNumber || 0) === 6) &&
    Array.isArray(payload?.resolvedAttacks) &&
    payload.resolvedAttacks.some(attack => attack?.special === "gself_photon_torpedo");

  if (isPhotonTorpedo) {
    const hitCount = Math.max(0, Math.floor(Number(payload?.hitCount || 0)));
    if (hitCount > 0) {
      healRuleHp(state, hitCount * 50, payload);
      reduceEnemyEvadeRule(payload?.defender || payload?.enemyState || null, hitCount * 2, payload);
      messages.push(`フォトン･トルピード：${hitCount}ヒット、HP${hitCount * 50}回復、相手回避-${hitCount * 2}`);
      redraw = true;
    }
  }

  if (state.gselfRocketBoostCount > 0 || state.gselfReflectorStockDamage > 0 || state.gselfPhotonSearcherReady) {
    state.gselfRocketBoostCount = 0;
    state.gselfReflectorStockDamage = 0;
    state.gselfReflectorStockCount = 0;
    state.gselfPhotonSearcherReady = false;
    if (usedAttack) messages.push("Gセルフ攻撃補助を消費");
    redraw = true;
  }

  return { redraw, message: messages.length > 0 ? messages.join("\n") : null };
}

export function onGSelfTurnEnd(state) {
  ensureGSelfState(state);
  state.gselfSpaceShieldActive = false;
  state.gselfAtmosphericShieldActive = false;
  state.gselfReflectorShieldActive = false;
  state.gselfPhotonArmorShieldActive = false;
  state.gselfEmergencyEscapeActive = false;
  state.gselfPhotonShieldBarrier = 0;
  return { redraw: false, message: null };
}

export function modifyGSelfTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureGSelfState(defender);
  if (defender.gselfPhotonShieldBarrier > 0) {
    defender.gselfPhotonShieldBarrier -= 1;
    return { damage: 0, cancelled: true, message: "フォトン･シールド：攻撃無効" };
  }
  if (defender.gselfEmergencyEscapeActive) {
    return { damage: 0, cancelled: true, message: "緊急離脱：攻撃無効" };
  }
  if ((defender.formId === "reflector" || defender.formId === "perfect") && shouldReflectAttack(attack) && Number(defender.gselfReflectorStockCount || 0) < 8) {
    defender.gselfReflectorStockCount += 1;
    defender.gselfReflectorStockDamage += getAttackBaseDamage(attack);
    return { damage: 0, cancelled: true, message: "リフレクター：射撃ビーム無効化" };
  }
  if (defender.formId === "perfect" && defender.gselfPhotonArmorShieldActive) {
    if (attack?.beam) {
      healRuleHp(defender, Math.floor(getAttackBaseDamage(attack) / 2), context);
      return { damage: 0, cancelled: true, message: "フォトン装甲シールド：ビーム無効＋回復" };
    }
    return { damage: Math.floor(Number(damage || 0) / 2), message: "フォトン装甲シールド：ダメージ半減" };
  }
  if (defender.gselfAtmosphericShieldActive) return { damage: 0, cancelled: true, message: "シールド(トワサンガ)：攻撃無効" };
  let nextDamage = Number(damage || 0);
  const messages = [];
  if (defender.gselfSpaceShieldActive || defender.gselfReflectorShieldActive) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("シールド：ダメージ半減");
  }
  if ((defender.formId === "reflector" || defender.formId === "tricky") && attack?.beam && !attack?.ignoreReduction) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("Iフィールド：ビーム半減");
  }
  if (defender.formId === "high_torque" && !attack?.ignoreReduction) {
    nextDamage = Math.max(0, nextDamage - 10);
    messages.push("高トルクパック特性：-10");
  }
  return { damage: nextDamage, message: messages.length > 0 ? messages.join("\n") : null };
}

export function onGSelfDamaged() { return { redraw: false, message: null }; }
export function onGSelfEnemyBeforeSlot() { return { redraw: false, message: null }; }
export function modifyGSelfEvadeAttempt() { return { handled: false }; }

export function onGSelfResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureGSelfState(state);
  if (pendingChoice?.source === "gself_pack_change") {
    if (state.formId === "perfect") {
      return { handled: true, redraw: false, message: "パーフェクトパック中は手動換装できない" };
    }
    if (!Object.prototype.hasOwnProperty.call(PACK_LABEL, selectedValue)) {
      return { handled: true, redraw: false, message: "換装先が不正です" };
    }
    if (!state.gselfUnlockedPacks[selectedValue]) {
      return { handled: true, redraw: false, message: "未解放" };
    }
    if (selectedValue === state.formId) {
      return { handled: true, redraw: false, message: "現在のパックです" };
    }
    const ok = changePack(state, selectedValue);
    return { handled: true, redraw: true, message: ok ? `${PACK_LABEL[selectedValue]}パックへ換装` : "換装失敗" };
  }
  return { handled: false, redraw: false, message: null };
}
