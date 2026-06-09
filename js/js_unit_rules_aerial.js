import { setForm, reduceEvade, doubleEvadeRedCap, normalizeEvadeCapState } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

function chance(rate) { return Math.random() < rate; }

function ensureAerialState(state) {
  if (!state) return;
  if (typeof state.aerialScoreSixTurns !== "number") state.aerialScoreSixTurns = 0;
  if (typeof state.aerialScoreSixJustActivated !== "boolean") state.aerialScoreSixJustActivated = false;
  if (typeof state.aerialCompositeShieldCount !== "number") state.aerialCompositeShieldCount = 3;
  if (typeof state.aerialCompositeShieldActive !== "boolean") state.aerialCompositeShieldActive = false;
  if (typeof state.aerialDamageBucket !== "number") state.aerialDamageBucket = 0;
  if (typeof state.aerialGundbitLinkCountThisTurn !== "number") state.aerialGundbitLinkCountThisTurn = 0;
  if (typeof state.aerialBitOnReduction !== "number") state.aerialBitOnReduction = 0;
  if (typeof state.aerialOrbitalNextTurn !== "boolean") state.aerialOrbitalNextTurn = false;
  if (typeof state.aerialOrbitalActiveThisTurn !== "boolean") state.aerialOrbitalActiveThisTurn = false;
  if (typeof state.aerialScoreSixTurnTicked !== "boolean") state.aerialScoreSixTurnTicked = false;
}

function enterScoreSix(state) {
  const wasScoreSix = state.formId === "score_six";
  setForm(state, "score_six", { preserveHp: true, preserveEvade: true });
  state.aerialScoreSixTurns = 6;
  state.aerialScoreSixJustActivated = true;
  state.aerialCompositeShieldCount = Math.min(3, Number(state.aerialCompositeShieldCount || 0) + 1);
  if (!wasScoreSix) state.aerialBitOnReduction = 0;
  normalizeEvadeCapState(state);
}

function exitScoreSix(state) {
  state.aerialScoreSixTurns = 0;
  state.aerialScoreSixJustActivated = false;
  state.aerialScoreSixTurnTicked = false;
  state.aerialBitOnReduction = 0;
  state.aerialOrbitalNextTurn = false;
  state.aerialOrbitalActiveThisTurn = false;
  setForm(state, "base", { preserveHp: true, preserveEvade: true });
  normalizeEvadeCapState(state);
}
function buildGundbitSlot() {
  return {
    key: "slot7",
    label: "ガンビット 20ダメージ",
    desc: "20ダメージ。射撃、ビーム",
    effect: { type: "attack", attackType: "shoot", damage: 20, count: 1, beam: true }
  };
}

export function getAerialDerivedState(state) {
  ensureAerialState(state);
  const status = [
    `コンポジット残り:${Math.max(0, Number(state.aerialCompositeShieldCount || 0))}/3`,
    `意思蓄積:${Math.max(0, Number(state.aerialDamageBucket || 0))}/100`,
    `ガンビット連携:${Math.max(0, Number(state.aerialGundbitLinkCountThisTurn || 0))}/3`
  ];
  const slots = {};

  if (state.formId === "score_six") {
    status.push({
  text: `スコアシックス:${Math.max(0, Number(state.aerialScoreSixTurns || 0))}ターン`,
  color: "#44aaff",
  bold: true
});
    status.push(`ビットオン軽減:${Math.max(0, Number(state.aerialBitOnReduction || 0))}`);

    if (state.aerialOrbitalActiveThisTurn) {
      slots.slot1 = {
        label: "1EX ビットオン・エアリアル",
        desc: "スコアシックス時、ダメージ軽減を5得る。重複可。スコアシックス終了時リセット。",
        ex: true,
        effect: { type: "custom", customType: "aerial_bit_on" }
      };
    }
  }

  return { status, slots, specials: {} };
}

export function canUseAerialSpecial(state, specialKey) {
  ensureAerialState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "aerial_composite_shield") {
    return {
      allowed: Number(state.aerialCompositeShieldCount || 0) > 0,
      message: Number(state.aerialCompositeShieldCount || 0) > 0 ? null : "使用回数がない"
    };
  }

  if (special.effectType === "aerial_gundbit_link") {
    if (Number(state.aerialGundbitLinkCountThisTurn || 0) >= 3) return { allowed: false, message: "1ターン3回まで" };
    return { allowed: Number(state.evade || 0) >= 1, message: Number(state.evade || 0) >= 1 ? null : "回避が足りない" };
  }

  if (special.effectType === "aerial_data_storm_support") {
    if (state.formId !== "score_six") return { allowed: false, message: "スコアシックス中のみ使用可能" };
    return { allowed: Number(state.evade || 0) >= 3, message: Number(state.evade || 0) >= 3 ? null : "回避が足りない" };
  }

  return { allowed: true, message: null };
}

export function executeAerialSpecial(state, specialKey) {
  ensureAerialState(state);
  const special = state.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "aerial_composite_shield") {
    if (Number(state.aerialCompositeShieldCount || 0) <= 0) return { handled: true, redraw: false, message: "使用回数が残っていない" };
    state.aerialCompositeShieldCount -= 1;
    state.aerialCompositeShieldActive = true;
    return { handled: true, redraw: true, message: "コンポジットガンビットシールド展開" };
  }

  if (special.effectType === "aerial_gundbit_link") {
    if (Number(state.aerialGundbitLinkCountThisTurn || 0) >= 3) return { handled: true, redraw: false, message: "1ターン3回まで" };
    if (Number(state.evade || 0) < 1) return { handled: true, redraw: false, message: "回避が足りない" };
    reduceEvade(state, 1);
    state.aerialGundbitLinkCountThisTurn += 1;
    return { handled: true, redraw: true, message: "ガンビット連携：回避1消費", startSlotAction: { slotKey: "slot7", slotData: buildGundbitSlot() } };
  }

  if (special.effectType === "aerial_data_storm_support") {
    if (state.formId !== "score_six") return { handled: true, redraw: false, message: "スコアシックス中のみ使用可能" };
    if (Number(state.evade || 0) < 3) return { handled: true, redraw: false, message: "回避が足りない" };
    reduceEvade(state, 3);
    state.aerialScoreSixTurns += 1;
    return { handled: true, redraw: true, message: "データストーム補助：強化ターン+1" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onAerialBeforeSlot(state) {
  ensureAerialState(state);
  state.aerialGundbitLinkCountThisTurn = 0;

  if (state.aerialOrbitalNextTurn) {
    state.aerialOrbitalNextTurn = false;
    state.aerialOrbitalActiveThisTurn = true;
    state.actionCount = Math.max(Number(state.actionCount || 0), 3);
  } else {
    state.aerialOrbitalActiveThisTurn = false;
  }

 if (state.formId === "score_six") {
    if (state.aerialScoreSixJustActivated) {
      state.aerialScoreSixJustActivated = false;
      state.aerialScoreSixTurnTicked = true;
      return { redraw: true, message: null };
    }

    if (!state.aerialScoreSixTurnTicked) {
      state.aerialScoreSixTurnTicked = true;
      state.aerialScoreSixTurns -= 1;

      if (state.aerialScoreSixTurns <= 0) {
        exitScoreSix(state);
        return { redraw: true, message: "スコアシックス終了" };
      }
    }
  }

  return { redraw: false, message: null };
}

export function onAerialTurnEnd(state) {
  ensureAerialState(state);
  state.aerialGundbitLinkCountThisTurn = 0;
  state.aerialCompositeShieldActive = false;
  state.aerialScoreSixTurnTicked = false;
  return { redraw: false, message: null };
}

export function onAerialAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureAerialState(state);
  const resolveResult = payload.resolveResult || payload;
  const customEffectId = resolveResult.customEffectId;

  if (customEffectId === "aerial_score_six") {
    enterScoreSix(state);
    return { redraw: true, message: "パーメットスコア・シックス発動" };
  }

  if (customEffectId === "aerial_orbital_maneuver") {
    state.aerialOrbitalNextTurn = true;
    return { redraw: true, message: "有機軌道：次の自分ターン3回行動" };
  }

  if (customEffectId === "aerial_bit_on") {
    state.aerialBitOnReduction += 5;
    return { redraw: true, message: `ビットオン・エアリアル：軽減+5（合計${state.aerialBitOnReduction}）` };
  }

  if (customEffectId === "aerial_score_six_saber") {
    const ev = Number(state.evade || 0);
    return { redraw: false, appendAttacks: createAttack(ev > 0 ? 20 : 60, ev > 0 ? ev : 1, { type: "melee", beam: true, source: "ビームサーベル" }) };
  }

  if (customEffectId === "aerial_score_six_escutcheon") {
    const ev = Number(state.evade || 0);
    return { redraw: false, appendAttacks: createAttack(ev > 0 ? 30 * ev : 120, 1, { type: "shoot", beam: true, ignoreReduction: true, source: "エスカッシャン" }) };
  }

  return { redraw: false, message: null };
}

export function onAerialDamaged(defender) {
  ensureAerialState(defender);
  const damage = Math.max(0, Number(defender.lastDamageTaken || 0));
  if (damage <= 0) return { redraw: false, message: null };

  defender.aerialDamageBucket += damage;
  let count = 0;
  while (defender.aerialDamageBucket >= 100) {
    defender.aerialDamageBucket -= 100;
    doubleEvadeRedCap(defender);
    count += 1;
  }

  return count > 0 ? { redraw: true, message: `意思：回避倍加×${count}` } : { redraw: false, message: null };
}

export function modifyAerialTakenDamage(defender, attacker, attack, damage) {
  ensureAerialState(defender);

  if (defender.aerialCompositeShieldActive) {
  return { damage: 0, cancelled: true, message: "コンポジットガンビットシールド：攻撃無効" };
  }

  if (Number(defender.evade || 0) <= 0 && chance(0.5)) {
    return { damage: 0, cancelled: true, message: "ガンビットシールド行動：攻撃無効" };
  }

  const reduction = Math.max(0, Number(defender.aerialBitOnReduction || 0));
  if (reduction > 0) {
    return { damage: Math.max(0, Number(damage || 0) - reduction), message: `ビットオン軽減：-${reduction}` };
  }

  return { damage, message: null };
}

export function onAerialActionResolved() { return { redraw: false, message: null }; }
export function onAerialEnemyBeforeSlot() { return { redraw: false, message: null }; }
export function modifyAerialEvadeAttempt() { return { handled: false }; }
export function onAerialResolveChoice() { return { handled: false, redraw: false, message: null }; }
