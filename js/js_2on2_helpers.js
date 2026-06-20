export function create2v2Helpers({ getBattleMode, getTeam }) {
  function isTeamBattleMode() {
    const mode = getBattleMode();
    return (
      mode === "2v2" ||
      mode === "challenge2v2" ||
      mode === "vscpu2v2" ||
      mode === "online2v2"
    );
  }

  function floor(value) {
    return Math.max(0, Math.floor(Number(value || 0)));
  }

  function isUnifiedTeam(playerKey) {
    const team = getTeam(playerKey);
    return isTeamBattleMode() && team && team.mode === "unified";
  }

  function getUnifiedMaxHp(team) {
    return floor(team?.unit1?.maxHp) + floor(team?.unit2?.maxHp);
  }

  function ensureUnifiedState(team) {
    if (!team) return null;
    if (!team.unified) team.unified = {};

    const unified = team.unified;

    if (typeof unified.baseHpA !== "number") unified.baseHpA = 0;
    if (typeof unified.baseHpB !== "number") unified.baseHpB = 0;
    if (typeof unified.totalDamage !== "number") unified.totalDamage = 0;
    if (typeof unified.healA !== "number") unified.healA = 0;
    if (typeof unified.healB !== "number") unified.healB = 0;
    if (typeof unified.baseActionCount !== "number") unified.baseActionCount = 1;
    if (typeof unified.actionCount !== "number") unified.actionCount = unified.baseActionCount;

    return unified;
  }

  function clampUnifiedHpState(team) {
    const unified = ensureUnifiedState(team);
    if (!team || !unified) return;

    const maxHp = getUnifiedMaxHp(team);
    const baseTotal = floor(unified.baseHpA) + floor(unified.baseHpB);
    const healTotal = floor(unified.healA) + floor(unified.healB);
    const totalDamage = floor(unified.totalDamage);

    const currentHp = Math.max(0, baseTotal + healTotal - totalDamage);

    if (currentHp <= maxHp) return;

    const overflow = currentHp - maxHp;
    let remain = overflow;

    const reduceB = Math.min(floor(unified.healB), remain);
    unified.healB = floor(unified.healB) - reduceB;
    remain -= reduceB;

    const reduceA = Math.min(floor(unified.healA), remain);
    unified.healA = floor(unified.healA) - reduceA;
  }

  function syncUnifiedHealFromCurrentHp(team) {
    if (!team || team.mode !== "unified") return;

    const unified = ensureUnifiedState(team);
    if (!unified) return;

    const hpA = floor(team.unit1?.hp);
    const hpB = floor(team.unit2?.hp);

    unified.healA = Math.max(floor(unified.healA), hpA - floor(unified.baseHpA));
    unified.healB = Math.max(floor(unified.healB), hpB - floor(unified.baseHpB));

    clampUnifiedHpState(team);
  }

  function getUnifiedHp(team) {
    if (!team) return 0;

    syncUnifiedHealFromCurrentHp(team);

    const unified = ensureUnifiedState(team);
    if (!unified) return 0;

    const hp =
      floor(unified.baseHpA) +
      floor(unified.baseHpB) +
      floor(unified.healA) +
      floor(unified.healB) -
      floor(unified.totalDamage);

    return Math.min(getUnifiedMaxHp(team), Math.max(0, hp));
  }

  function isUnitDefeated(unit) {
    return !unit || floor(unit.hp) <= 0 || unit.isDefeated === true;
  }

  function enterUnified(team) {
    if (!team || team.mode === "unified") return false;
    if (!team.unit1 || !team.unit2) return false;
    if (isUnitDefeated(team.unit1) || isUnitDefeated(team.unit2)) return false;

    const unified = ensureUnifiedState(team);

    unified.baseHpA = floor(team.unit1.hp);
    unified.baseHpB = floor(team.unit2.hp);
    unified.totalDamage = 0;
    unified.healA = 0;
    unified.healB = 0;
    unified.baseActionCount = 1;
    unified.actionCount = 1;

    team.mode = "unified";

    const nextKey = !isUnitDefeated(team.unit1) ? "unit1" : "unit2";
    team.activeUnitKey = nextKey;
    team.focusUnitKey = nextKey;

    return true;
  }

  function exitUnified(team) {
    if (!team || team.mode !== "unified") return false;

    syncUnifiedHealFromCurrentHp(team);

    const unified = ensureUnifiedState(team);
    const unifiedHp = getUnifiedHp(team);

    if (unifiedHp <= 0) {
      if (team.unit1) {
        team.unit1.hp = 0;
        team.unit1.isDefeated = true;
      }
      if (team.unit2) {
        team.unit2.hp = 0;
        team.unit2.isDefeated = true;
      }

      unified.baseHpA = 0;
      unified.baseHpB = 0;
      unified.totalDamage = 0;
      unified.healA = 0;
      unified.healB = 0;
      unified.baseActionCount = 1;
      unified.actionCount = 1;

      team.mode = "split";
      team.activeUnitKey = "unit1";
      team.focusUnitKey = "unit1";
      return true;
    }

    const aPool = floor(unified.baseHpA) + floor(unified.healA);
    const bPool = floor(unified.baseHpB) + floor(unified.healB);
    const totalPool = Math.max(1, aPool + bPool);
    const totalDamage = Math.min(floor(unified.totalDamage), totalPool);

    let aDamage = Math.floor(totalDamage * (aPool / totalPool));
    let bDamage = totalDamage - aDamage;

    let aFinal = aPool - aDamage;
    let bFinal = bPool - bDamage;

    if (aFinal < 0) {
      bFinal += aFinal;
      aFinal = 0;
    }

    if (bFinal < 0) {
      aFinal += bFinal;
      bFinal = 0;
    }

    if (team.unit1) {
      team.unit1.hp = Math.max(0, Math.min(floor(team.unit1.maxHp), floor(aFinal)));
      team.unit1.isDefeated = team.unit1.hp <= 0;
    }

    if (team.unit2) {
      team.unit2.hp = Math.max(0, Math.min(floor(team.unit2.maxHp), floor(bFinal)));
      team.unit2.isDefeated = team.unit2.hp <= 0;
    }

    unified.baseHpA = 0;
    unified.baseHpB = 0;
    unified.totalDamage = 0;
    unified.healA = 0;
    unified.healB = 0;
    unified.baseActionCount = 1;
    unified.actionCount = 1;

    team.mode = "split";

    const nextKey = !isUnitDefeated(team.unit1) ? "unit1" : "unit2";
    team.activeUnitKey = nextKey;
    team.focusUnitKey = nextKey;

    return true;
  }

  function getUnifiedEvade(team) {
    if (!team) return 0;
    return floor(team.unit1?.evade) + floor(team.unit2?.evade);
  }

  function consumeUnifiedEvade(team, amount) {
    if (!team) return false;

    let remain = floor(amount);
    if (getUnifiedEvade(team) < remain) return false;

    while (remain > 0) {
      const ev1 = floor(team.unit1?.evade);
      const ev2 = floor(team.unit2?.evade);

      if (ev1 >= ev2 && ev1 > 0) {
        team.unit1.evade = ev1 - 1;
      } else if (ev2 > 0) {
        team.unit2.evade = ev2 - 1;
      } else {
        return false;
      }

      remain -= 1;
    }

    return true;
  }

  function consumeEvade(playerKey, state, amount = 1) {
    const team = getTeam(playerKey);

    if (team?.mode === "unified") {
      return consumeUnifiedEvade(team, amount);
    }

    if (!state) return false;
    if (floor(state.evade) < floor(amount || 1)) return false;

    state.evade = floor(state.evade) - floor(amount || 1);
    return true;
  }

  function zeroUnifiedEvade(team) {
    if (!team) return false;
    if (team.unit1) team.unit1.evade = 0;
    if (team.unit2) team.unit2.evade = 0;
    return true;
  }

  function withUnifiedEvadeForCheck(playerKey, actor, callback) {
    if (!isUnifiedTeam(playerKey) || !actor) return callback();

    const team = getTeam(playerKey);
    const backup = actor.evade;

    actor.evade = getUnifiedEvade(team);
    const result = callback();
    actor.evade = backup;

    return result;
  }

  function resetUnifiedActionCount(team) {
    const unified = ensureUnifiedState(team);
    if (!unified) return;
    unified.baseActionCount = 1;
    unified.actionCount = 1;
  }

  function getActionCount(playerKey) {
    const team = getTeam(playerKey);
    if (!team || team.mode !== "unified") return 0;

    const unified = ensureUnifiedState(team);
    return floor(unified.actionCount);
  }

  function canConsumeAction(playerKey, state, amount = 1) {
    const team = getTeam(playerKey);

    if (!team || team.mode !== "unified") {
      return floor(state?.actionCount) >= floor(amount || 1);
    }

    return getActionCount(playerKey) >= floor(amount || 1);
  }

  function consumeAction(playerKey, state, amount = 1) {
    const team = getTeam(playerKey);

    if (!team || team.mode !== "unified") {
      if (!state) return false;
      if (floor(state.actionCount) < floor(amount || 1)) return false;
      state.actionCount = floor(state.actionCount) - floor(amount || 1);
      return true;
    }

    const unified = ensureUnifiedState(team);
    if (floor(unified.actionCount) < floor(amount || 1)) return false;

    unified.actionCount = floor(unified.actionCount) - floor(amount || 1);
    return true;
  }

  function addAction(playerKey, state, amount = 1) {
    const team = getTeam(playerKey);

    if (team?.mode === "unified") {
      const unified = ensureUnifiedState(team);
      unified.actionCount = floor(unified.actionCount) + floor(amount || 1);
      return true;
    }

    if (!state) return false;
    state.actionCount = floor(state.actionCount) + floor(amount || 1);
    return true;
  }

  return {
    isUnifiedTeam,
    ensureUnifiedState,
    syncUnifiedHealFromCurrentHp,
    getUnifiedHp,
    getUnifiedMaxHp,
    enterUnified,
    exitUnified,
    getUnifiedEvade,
    consumeUnifiedEvade,
    consumeEvade,
    zeroUnifiedEvade,
    withUnifiedEvadeForCheck,
    resetUnifiedActionCount,
    getActionCount,
    canConsumeAction,
    consumeAction,
    addAction
  };
}
