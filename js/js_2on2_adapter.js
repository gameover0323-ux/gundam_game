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

  return team.unified;
}

export function create2v2Adapter(ctx) {
  function isUnifiedOwner(ownerPlayer) {
    if (!ctx.isTeamBattleMode || !ctx.isTeamBattleMode()) return false;

    const team = ctx.getTeam(ownerPlayer);
    return !!team && team.mode === "unified";
  }

  function getOwnerTeam(ownerPlayer) {
    if (!ctx.getTeam) return null;
    return ctx.getTeam(ownerPlayer);
  }

  function getUnifiedHp(team) {
    const unified = getUnifiedData(team);
    if (!team || !unified) return 0;

    return Math.max(
      0,
      clampNumber(unified.baseHpA) +
        clampNumber(unified.baseHpB) +
        clampNumber(unified.healA) +
        clampNumber(unified.healB) -
        clampNumber(unified.totalDamage)
    );
  }

  function getUnifiedMaxHp(team) {
    if (!team) return 0;

    return (
      clampNumber(team.unit1?.maxHp) +
      clampNumber(team.unit2?.maxHp)
    );
  }

  function heal(ownerPlayer, actor, amount) {
    const healAmount = clampNumber(amount);
    if (healAmount <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      actor.hp = Math.min(actor.maxHp, actor.hp + healAmount);
      return healAmount;
    }

    const unified = getUnifiedData(team);
    const unitKey = getUnitKeyInTeam(team, actor);

    if (unitKey === "unit1") {
      unified.healA = clampNumber(unified.healA) + healAmount;
    } else if (unitKey === "unit2") {
      unified.healB = clampNumber(unified.healB) + healAmount;
    }

    return healAmount;
  }

  function consumeHp(ownerPlayer, actor, amount) {
    const cost = clampNumber(amount);
    if (cost <= 0 || !actor) return true;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (actor.hp < cost) return false;
      actor.hp -= cost;
      return true;
    }

    const unified = getUnifiedData(team);
    const currentHp = getUnifiedHp(team);

    if (currentHp < cost) return false;

    unified.totalDamage = clampNumber(unified.totalDamage) + cost;
    return true;
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
      if (!actor || actor.evade < cost) return false;
      actor.evade -= cost;
      return true;
    }

    if (!ctx.consumeUnifiedEvade) return false;
    return ctx.consumeUnifiedEvade(team, cost);
  }

  function getEvade(ownerPlayer, actor) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return clampNumber(actor?.evade);
    }

    if (!ctx.getUnifiedEvade) return 0;
    return ctx.getUnifiedEvade(team);
  }


  function addActionCount(ownerPlayer, actor, amount) {
    const add = clampNumber(amount);
    if (add <= 0 || !actor) return 0;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      actor.actionCount = clampNumber(actor.actionCount) + add;
      return add;
    }

    ensureUnifiedActionState(team);
    team.unifiedActionCount = clampNumber(team.unifiedActionCount) + add;

    return add;
  }
  function applyToUnifiedPartners(ownerPlayer, callback) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return false;
    }

    if (team.unit1) callback(team.unit1, "unit1");
    if (team.unit2) callback(team.unit2, "unit2");

    return true;
  }
function ensureUnifiedActionState(team) {
    if (!team) return;

    if (typeof team.unifiedBaseActionCount !== "number") {
      team.unifiedBaseActionCount = 1;
    }

    if (typeof team.unifiedActionCount !== "number") {
      team.unifiedActionCount = team.unifiedBaseActionCount;
    }
  }

  function resetUnifiedActionCount(team) {
    if (!team) return;
    ensureUnifiedActionState(team);
    team.unifiedActionCount = team.unifiedBaseActionCount;
  }

  function getActionCount(ownerPlayer, actor) {
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return clampNumber(actor?.actionCount);
    }

    ensureUnifiedActionState(team);
    return clampNumber(team.unifiedActionCount);
  }

  function canConsumeAction(ownerPlayer, actor, amount = 1) {
    const cost = clampNumber(amount);
    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      return !!actor && clampNumber(actor.actionCount) >= cost;
    }

    ensureUnifiedActionState(team);
    return clampNumber(team.unifiedActionCount) >= cost;
  }

  function consumeAction(ownerPlayer, actor, amount = 1) {
    const cost = clampNumber(amount);
    if (cost <= 0) return true;

    const team = getOwnerTeam(ownerPlayer);

    if (!team || team.mode !== "unified") {
      if (!actor || clampNumber(actor.actionCount) < cost) return false;
      actor.actionCount = clampNumber(actor.actionCount) - cost;
      return true;
    }

    ensureUnifiedActionState(team);

    if (clampNumber(team.unifiedActionCount) < cost) {
      return false;
    }

    team.unifiedActionCount = clampNumber(team.unifiedActionCount) - cost;
    return true;
  }
  return {
    ensureUnifiedActionState,
    resetUnifiedActionCount,
    getActionCount,
    canConsumeAction,
    consumeAction,
    isUnifiedOwner,
    getOwnerTeam,
    getUnifiedHp,
    getUnifiedMaxHp,
    heal,
    consumeHp,
    addTeamEvade,
    consumeEvade,
    getEvade,
    addActionCount,
    applyToUnifiedPartners
  };
}
