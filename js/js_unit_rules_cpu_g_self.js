import {
  getGSelfDerivedState,
  canUseGSelfSpecial,
  executeGSelfSpecial,
  onGSelfBeforeSlot,
  onGSelfEnemyBeforeSlot,
  onGSelfAfterSlotResolved,
  onGSelfActionResolved,
  onGSelfDamaged,
  onGSelfTurnEnd,
  modifyGSelfTakenDamage,
  modifyGSelfEvadeAttempt,
  onGSelfResolveChoice
} from "./js_unit_rules_g_self.js";
import { setForm, normalizeEvadeCapState } from "./js_unit_runtime.js";

const PACK_LABEL = {
  space: "宇宙用",
  atmospheric: "大気圏",
  reflector: "リフレクター",
  tricky: "トリッキー",
  high_torque: "高トルク",
  assault: "アサルト",
  perfect: "パーフェクト"
};

const ROUTE_TOP = {
  space: ["assault", "reflector"],
  atmospheric: ["high_torque", "tricky"]
};

function chance(rate) {
  return Math.random() < rate;
}

function addLog(messages, text) {
  if (text) messages.push(text);
}

function ensureCpuGSelfState(state) {
  if (!state) return;

  if (!state.gselfUnlockedPacks || typeof state.gselfUnlockedPacks !== "object") {
    state.gselfUnlockedPacks = { space: true, atmospheric: true };
  }
  state.gselfUnlockedPacks.space = true;
  state.gselfUnlockedPacks.atmospheric = true;

  if (state.gselfUnlockedPacks.high_torque && state.gselfUnlockedPacks.assault) {
    state.gselfUnlockedPacks.perfect = true;
  }

  if (!state.gselfShieldCounts || typeof state.gselfShieldCounts !== "object") {
    state.gselfShieldCounts = {};
  }
  if (typeof state.gselfShieldCounts.space !== "number") state.gselfShieldCounts.space = 3;
  if (typeof state.gselfShieldCounts.atmospheric !== "number") state.gselfShieldCounts.atmospheric = 3;
  if (typeof state.gselfShieldCounts.reflector !== "number") state.gselfShieldCounts.reflector = 3;
  if (typeof state.gselfShieldCounts.perfect !== "number") state.gselfShieldCounts.perfect = 3;

  if (typeof state.cpuGSelfTurnStartHandled !== "boolean") state.cpuGSelfTurnStartHandled = false;
  if (typeof state.cpuGSelfAfterPerfectFall !== "boolean") state.cpuGSelfAfterPerfectFall = false;
  if (typeof state.cpuGSelfShieldActive !== "boolean") state.cpuGSelfShieldActive = false;
}

function getHp(state) {
  return Math.max(0, Number(state?.hp || 0));
}

function getCurrentPack(state) {
  return state?.formId || "space";
}

function getUnlockedPacks(state) {
  ensureCpuGSelfState(state);
  return Object.keys(PACK_LABEL).filter(pack => !!state.gselfUnlockedPacks?.[pack]);
}

function isUnlocked(state, packId) {
  ensureCpuGSelfState(state);
  return !!state.gselfUnlockedPacks?.[packId];
}

function changePack(state, packId, messages, reason = "換装") {
  ensureCpuGSelfState(state);
  if (!isUnlocked(state, packId)) return false;
  if (getCurrentPack(state) === packId) return false;

  const ok = setForm(state, packId, { preserveHp: true, preserveEvade: true });
  if (!ok) return false;

  normalizeEvadeCapState(state);
  addLog(messages, `CPU Gセルフ：${reason} ${PACK_LABEL[packId]}パック`);
  return true;
}

function getTopUnlockedInRoute(state, routeId) {
  const order = ROUTE_TOP[routeId] || [];
  return order.find(pack => isUnlocked(state, pack)) || routeId;
}

function getLowerUnlockedInRoutes(state) {
  const lowers = [];
  ["space", "reflector", "atmospheric", "tricky"].forEach(pack => {
    if (isUnlocked(state, pack) && getCurrentPack(state) !== pack) lowers.push(pack);
  });
  return lowers;
}

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function cpuTryPerfectReturn(state, messages) {
  if (!isUnlocked(state, "perfect")) return false;
  if (getCurrentPack(state) === "perfect") return false;
  if (getHp(state) < 200) return false;
  if (!state.cpuGSelfAfterPerfectFall) return false;
  if (!chance(0.3)) return false;

  state.cpuGSelfAfterPerfectFall = false;
  return changePack(state, "perfect", messages, "HP200以上により再換装");
}

function cpuTryPerfectPack(state, messages) {
  if (!isUnlocked(state, "perfect")) return false;
  if (getCurrentPack(state) === "perfect") return false;
  if (getHp(state) < 200) return false;
  if (!chance(0.3)) return false;

  return changePack(state, "perfect", messages, "パーフェクト抽選");
}

function cpuTryRandomAfterPerfectFall(state, messages) {
  if (!state.cpuGSelfAfterPerfectFall) return false;
  if (getCurrentPack(state) === "perfect") return false;
  if (!chance(0.3)) return false;

  const candidates = getUnlockedPacks(state).filter(pack => pack !== "perfect" && pack !== getCurrentPack(state));
  const next = pickRandom(candidates);
  if (!next) return false;
  return changePack(state, next, messages, "反動後ランダム換装");
}

function cpuTryRouteTopPack(state, messages) {
  const current = getCurrentPack(state);
  const candidates = [];

  const spaceTop = getTopUnlockedInRoute(state, "space");
  const atmosphericTop = getTopUnlockedInRoute(state, "atmospheric");

  if (spaceTop !== current) candidates.push(spaceTop);
  if (atmosphericTop !== current) candidates.push(atmosphericTop);

  const uniqueCandidates = [...new Set(candidates)].filter(pack => isUnlocked(state, pack));
  if (uniqueCandidates.length === 0) return false;
  if (!chance(0.3)) return false;

  const next = pickRandom(uniqueCandidates);
  return changePack(state, next, messages, "上位形態抽選");
}

function cpuTryLowerPack(state, messages) {
  const candidates = getLowerUnlockedInRoutes(state);
  if (candidates.length === 0) return false;
  if (!chance(0.03)) return false;

  const next = pickRandom(candidates);
  return changePack(state, next, messages, "下位形態低確率抽選");
}

function cpuTryPackChange(state, messages) {
  ensureCpuGSelfState(state);

  if (cpuTryPerfectReturn(state, messages)) return;
  if (cpuTryRandomAfterPerfectFall(state, messages)) return;
  if (cpuTryPerfectPack(state, messages)) return;
  if (cpuTryRouteTopPack(state, messages)) return;
  cpuTryLowerPack(state, messages);
}

function cpuTryHalfShield(state, messages) {
  ensureCpuGSelfState(state);
  if (state.cpuGSelfShieldActive) return;
  if (!chance(0.2)) return;

  const formId = getCurrentPack(state);
  if (formId === "space" && Number(state.gselfShieldCounts.space || 0) > 0) {
    state.gselfShieldCounts.space -= 1;
    state.gselfSpaceShieldActive = true;
    state.cpuGSelfShieldActive = true;
    addLog(messages, "CPU Gセルフ：シールド(宇宙用)展開");
    return;
  }

  if (formId === "atmospheric" && Number(state.gselfShieldCounts.atmospheric || 0) > 0) {
    state.gselfShieldCounts.atmospheric -= 1;
    state.gselfAtmosphericShieldActive = true;
    state.cpuGSelfShieldActive = true;
    addLog(messages, "CPU Gセルフ：シールド(トワサンガ)展開");
    return;
  }

  if (formId === "reflector" && Number(state.gselfShieldCounts.reflector || 0) > 0) {
    state.gselfShieldCounts.reflector -= 1;
    state.gselfReflectorShieldActive = true;
    state.cpuGSelfShieldActive = true;
    addLog(messages, "CPU Gセルフ：シールド(リフレクター)展開");
    return;
  }

  if (formId === "perfect" && Number(state.gselfShieldCounts.perfect || 0) > 0) {
    state.gselfShieldCounts.perfect -= 1;
    state.gselfPhotonArmorShieldActive = true;
    state.cpuGSelfShieldActive = true;
    addLog(messages, "CPU Gセルフ：フォトン装甲シールド展開");
  }
}

function markPerfectFallIfNeeded(state, beforePack, afterPack) {
  if (beforePack === "perfect" && afterPack === "atmospheric") {
    state.cpuGSelfAfterPerfectFall = true;
  }
}

export function getCpuGSelfDerivedState(state) {
  ensureCpuGSelfState(state);
  const derived = getGSelfDerivedState(state) || {};

  return {
    ...derived,
    status: [
      ...(derived.status || []),
      "CPU特性：20%シールド・30%上位換装・3%下位換装・条件一致リフレクター確定"
    ],
    specials: {
      ...(derived.specials || {}),
      special1: {
        name: "CPU特性",
        effectType: "cpu_gself_traits",
        timing: "auto",
        actionType: "auto",
        desc: "各20%で防御特殊を展開。解禁済み上位形態へ30%、下位形態へ3%で換装。リフレクター/リフレクターモードは条件一致時に確定で発動。"
      }
    }
  };
}

export function canUseCpuGSelfSpecial(state, specialKey, context = {}) {
  ensureCpuGSelfState(state);
  return canUseGSelfSpecial(state, specialKey, context);
}

export function executeCpuGSelfSpecial(state, specialKey, context = {}) {
  ensureCpuGSelfState(state);
  return executeGSelfSpecial(state, specialKey, context);
}

export function onCpuGSelfBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuGSelfState(state);

  const beforePack = getCurrentPack(state);
  const baseResult = onGSelfBeforeSlot(state, rolledSlotNumber, context) || {};
  const afterBasePack = getCurrentPack(state);
  markPerfectFallIfNeeded(state, beforePack, afterBasePack);

  const messages = [];
  addLog(messages, baseResult.message);

  if (!baseResult.cancelSlot && !state.cpuGSelfTurnStartHandled) {
    state.cpuGSelfTurnStartHandled = true;
    cpuTryPackChange(state, messages);
  }

  return {
    ...baseResult,
    redraw: baseResult.redraw || messages.length > 0,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function onCpuGSelfEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureCpuGSelfState(state);
  return onGSelfEnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function onCpuGSelfAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureCpuGSelfState(state);
  return onGSelfAfterSlotResolved(state, slotNumber, payload);
}

export function onCpuGSelfActionResolved(attacker, defender, context = {}) {
  ensureCpuGSelfState(attacker);
  return onGSelfActionResolved(attacker, {
    ...(context || {}),
    defender,
    context
  });
}

export function onCpuGSelfDamaged(defender, attacker, context = {}) {
  ensureCpuGSelfState(defender);
  return onGSelfDamaged(defender, attacker, context);
}

export function onCpuGSelfTurnEnd(state, context = {}) {
  ensureCpuGSelfState(state);
  state.cpuGSelfTurnStartHandled = false;
  state.cpuGSelfShieldActive = false;
  return onGSelfTurnEnd(state, context);
}

export function modifyCpuGSelfTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureCpuGSelfState(defender);

  const messages = [];
  cpuTryHalfShield(defender, messages);

  const baseResult = modifyGSelfTakenDamage(defender, attacker, attack, damage, context) || { damage, message: null };
  addLog(messages, baseResult.message);

  return {
    ...baseResult,
    message: messages.join(" / ") || baseResult.message || null
  };
}

export function modifyCpuGSelfEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureCpuGSelfState(defender);
  return modifyGSelfEvadeAttempt(defender, attacker, attack, context);
}

export function getCpuGSelfExtraWeaponResult(state, context = {}) {
  ensureCpuGSelfState(state);
  return null;
}

export function onCpuGSelfResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureCpuGSelfState(state);
  return onGSelfResolveChoice(state, pendingChoice, selectedValue, context);
}
