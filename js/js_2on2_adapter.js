import { addEvade } from "./js_unit_runtime.js";

function clampNumber(value) {
  return Math.max(0, Math.floor(Number(value || 0)));
}

function getUnitKeyInTeam(team, state) {
  if (!team || !state) return null;
  if (team.unit1 === state) return "unit1";
  if (team.unit2 === state) return "unit2";
  return null;
}

function ensureUnifiedActionState(team) {
  if (!team) return;

  if (typeof team.unifiedBaseActionCount !== "number") {
    team.unifiedBaseActionCount = 1;
  }

  if (typeof team.unifiedActionCount !== "number") {
    team.unifiedActionCount = team.unifiedBaseActionCount;
  }

  if (typeof team.actionModeLock !== "string") {
    team.actionModeLock = "";
  }
}

function lockActionMode(team, mode) {
  if (!team) return;
  if (mode !== "unified" && mode !== "split") return;

  ensureUnifiedActionState(team);
  team.actionModeLock = mode;

  if (mode === "unified") {
    team.mode = "unified";
    if (team.unit1) team.unit1.actionCount = 0;
    if (team.unit2) team.unit2.actionCount = 0;
  }
}

function canUseActionMode(team, mode) {
  if (!team) return false;
  ensureUnifiedActionState(team);

  if (!team.actionModeLock) return true;
  return team.actionModeLock === mode;
}

function getUnifiedMaxHpRaw(team) {
  if (!team) return 0;
  return clampNumber(team.unit1?.maxHp) + clampNumber(team.unit2?.maxHp);
}

function getUnifiedData(team) {
  if (!team) return null;

  if (!team.unified) {
    team.unified = {
      baseHpA: clampNumber(team.unit1?.hp),
      baseHpB: clampNumber(team.unit2?.hp),
      totalDamage: 0,
      healA: 0,
      healB: 0
    };
  }

  const unified = team.unified;

  if (typeof unified.baseHpA !== "number") unified.baseHpA = 0;
  if (typeof unified.baseHpB !== "number") unified.baseHpB = 0;
  if (typeof unified.totalDamage !== "number") unified.totalDamage = 0;
  if (typeof unified.healA !== "number") unified.healA = 0;
  if (typeof unified.healB !== "number") unified.healB = 0;

  return unified;
}

function clampUnifiedHpState(team) {
  const unified = getUnifiedData(team);
  if (!team || !unified) return;

  const maxHp = getUnifiedMaxHpRaw(team);
  const current =
    clampNumber(unified.baseHpA) +
    clampNumber(unified.baseHpB) +
    clampNumber(unified.healA) +
    clampNumber(unified.healB) -
    clampNumber(unified.totalDamage);

  if (current <= maxHp) return;

  let overflow = current - maxHp;

  const reduceB = Math.min(clampNumber(unified.healB), overflow);
  unified.healB = clampNumber(unified.healB) - reduceB;
  overflow -= reduceB;

  const reduceA = Math.min(clampNumber(unified.healA), overflow);
  unified.healA = clampNumber(unified.healA) - reduceA;
}

export function create2v2Adapter(ctx) {
  function getOwnerTeam(ownerPlayer) {
    if (!ctx.getTeam) return null;
    return ctx.getTeam(ownerPlayer);
  }

  function isUnifiedOwner(ownerPlayer) {
    if (!ctx.isTeamBattleMode || !ctx.isTeamBattleMode()) return false;

    const team = getOwnerTeam(ownerPlayer);
    return !!team && team.mode === "unified";
  }

  function getUnifiedHp(team) {
    const unified = getUnifiedData(team);
    if (!team || !unified) return 0;

    clampUnifiedHpState(team);

    return Math.min(
      getUnifiedMaxHpRaw(team),
      Math.max(
        0,
        clampNumber(unified.baseHpA) +
          clampNumber(unified.baseHpB) +
          clampNumber(unified.healA) +
          clampNumber(unified.healB) -
          clampNumber(unified.totalDamage)
      )
    );
  }

  function getUnifiedMaxHp(team) {
    return getUnifiedMaxHpRaw(team);
  }

  function heal(ownerPlayer, actor, amount) {
    const healAmount = clampNumber(amount);
    if (healAmount <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      actor.hp = Math.min(clampNumber(actor.maxHp), clampNumber(actor.hp) + healAmount);
      return healAmount;
    }

    const before = getUnifiedHp(team);
    const maxHp = getUnifiedMaxHp(team);
    const actualHeal = Math.min(healAmount, Math.max(0, maxHp - before));

    if (actualHeal <= 0) return 0;

    const unified = getUnifiedData(team);
    const unitKey = getUnitKeyInTeam(team, actor);

    if (unitKey === "unit1") {
      unified.healA = clampNumber(unified.healA) + actualHeal;
    } else if (unitKey === "unit2") {
      unified.healB = clampNumber(unified.healB) + actualHeal;
    } else {
      unified.healA = clampNumber(unified.healA) + actualHeal;
    }

    clampUnifiedHpState(team);
    return actualHeal;
  }

  function consumeHp(ownerPlayer, actor, amount) {
    const cost = clampNumber(amount);
    if (cost <= 0 || !actor) return true;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (clampNumber(actor.hp) < cost) return false;
      actor.hp = clampNumber(actor.hp) - cost;
      return true;
    }

    const unified = getUnifiedData(team);
    const currentHp = getUnifiedHp(team);

    if (currentHp < cost) return false;

    unified.totalDamage = clampNumber(unified.totalDamage) + cost;
    clampUnifiedHpState(team);
    return true;
  }

  function damageHp(ownerPlayer, actor, amount) {
    const damage = clampNumber(amount);
    if (damage <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      actor.hp = Math.max(0, clampNumber(actor.hp) - damage);
      return damage;
    }

    const unified = getUnifiedData(team);
    unified.totalDamage = clampNumber(unified.totalDamage) + damage;
    clampUnifiedHpState(team);
    return damage;
  }

  function addTeamEvade(ownerPlayer, actor, amount) {
    const add = clampNumber(amount);
    if (add <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      addEvade(actor, add);
      return add;
    }

    if (team.unit1) addEvade(team.unit1, add);
    if (team.unit2) addEvade(team.unit2, add);

    return add;
  }

  function consumeEvade(ownerPlayer, actor, amount) {
    const cost = clampNumber(amount);
    if (cost <= 0) return true;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (!actor || clampNumber(actor.evade) < cost) return false;
      actor.evade = clampNumber(actor.evade) - cost;
      return true;
    }

    if (!ctx.consumeUnifiedEvade) return false;
    return ctx.consumeUnifiedEvade(team, cost);
  }

  function zeroEvade(ownerPlayer, actor) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (actor) actor.evade = 0;
      return true;
    }

    if (!ctx.zeroUnifiedEvade) return false;
    return ctx.zeroUnifiedEvade(team);
  }

  function getEvade(ownerPlayer, actor) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return clampNumber(actor?.evade);
    }

    if (!ctx.getUnifiedEvade) return 0;
    return ctx.getUnifiedEvade(team);
  }

  function resetUnifiedActionCount(team) {
    if (!team) return;
    ensureUnifiedActionState(team);
    team.unifiedActionCount = team.unifiedBaseActionCount;
    team.actionModeLock = "";
  }

  function getActionCount(ownerPlayer, actor) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return clampNumber(actor?.actionCount);
    }

    ensureUnifiedActionState(team);
    return clampNumber(team.unifiedActionCount);
  }

  function addActionCount(ownerPlayer, actor, amount) {
    const add = clampNumber(amount);
    if (add <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (team && !canUseActionMode(team, "split")) return 0;
      if (team) lockActionMode(team, "split");

      actor.actionCount = clampNumber(actor.actionCount) + add;
      return add;
    }

    if (!canUseActionMode(team, "unified")) return 0;

    lockActionMode(team, "unified");
    team.unifiedActionCount = clampNumber(team.unifiedActionCount) + add;

    return add;
  }

  function canConsumeAction(ownerPlayer, actor, amount = 1) {
    const cost = clampNumber(amount);
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (team && !canUseActionMode(team, "split")) return false;
      return !!actor && clampNumber(actor.actionCount) >= cost;
    }

    if (!canUseActionMode(team, "unified")) return false;

    ensureUnifiedActionState(team);
    return clampNumber(team.unifiedActionCount) >= cost;
  }

  function consumeAction(ownerPlayer, actor, amount = 1) {
    const cost = clampNumber(amount);
    if (cost <= 0) return true;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (!actor || clampNumber(actor.actionCount) < cost) return false;
      if (team && !canUseActionMode(team, "split")) return false;

      if (team) lockActionMode(team, "split");

      actor.actionCount = clampNumber(actor.actionCount) - cost;
      return true;
    }

    if (!canUseActionMode(team, "unified")) return false;

    ensureUnifiedActionState(team);

    if (clampNumber(team.unifiedActionCount) < cost) return false;

    lockActionMode(team, "unified");
    team.unifiedActionCount = clampNumber(team.unifiedActionCount) - cost;

    return true;
  }

  function applyToUnifiedPartners(ownerPlayer, callback) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") return false;

    if (team.unit1) callback(team.unit1, "unit1");
    if (team.unit2) callback(team.unit2, "unit2");

    return true;
  }

  return {
    ensureUnifiedActionState,
    resetUnifiedActionCount,
    getActionCount,
    canConsumeAction,
    consumeAction,
    addActionCount,
    isUnifiedOwner,
    getOwnerTeam,
    getUnifiedHp,
    getUnifiedMaxHp,
    heal,
    consumeHp,
    damageHp,
    addTeamEvade,
    consumeEvade,
    zeroEvade,
    getEvade,
    applyToUnifiedPartners
  };
}
