export function create2v2Helpers({ getBattleMode, getTeam }) {
  function isTeamBattleMode() {
    return getBattleMode() === "2v2" || getBattleMode() === "challenge2v2";
  }

  function isUnifiedTeam(playerKey) {
    const team = getTeam(playerKey);
    return isTeamBattleMode() && team && team.mode === "unified";
  }

  function ensureUnifiedState(team) {
    if (!team) return null;
    if (!team.unified) {
      team.unified = {};
    }

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

  function syncUnifiedHealFromCurrentHp(team) {
    if (!team || team.mode !== "unified") return;
    const unified = ensureUnifiedState(team);
    if (!unified) return;

    const hpA = Math.max(0, Number(team.unit1?.hp || 0));
    const hpB = Math.max(0, Number(team.unit2?.hp || 0));

    unified.healA = Math.max(Number(unified.healA || 0), hpA - Number(unified.baseHpA || 0));
    unified.healB = Math.max(Number(unified.healB || 0), hpB - Number(unified.baseHpB || 0));
  }

  function getUnifiedMaxHp(team) {
    return Math.max(0, Number(team?.unit1?.maxHp || 0)) +
      Math.max(0, Number(team?.unit2?.maxHp || 0));
  }

  function getUnifiedHp(team) {
    if (!team) return 0;
    syncUnifiedHealFromCurrentHp(team);
    const unified = ensureUnifiedState(team);
    if (!unified) return 0;

    return Math.max(
      0,
      Math.floor(Number(unified.baseHpA || 0)) +
      Math.floor(Number(unified.baseHpB || 0)) +
      Math.floor(Number(unified.healA || 0)) +
      Math.floor(Number(unified.healB || 0)) -
      Math.floor(Number(unified.totalDamage || 0))
    );
  }

  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function enterUnified(team) {
    if (!team || team.mode === "unified") return false;

    const unified = ensureUnifiedState(team);

    unified.baseHpA = Math.max(0, Number(team.unit1?.hp || 0));
    unified.baseHpB = Math.max(0, Number(team.unit2?.hp || 0));
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

    const aPool = Math.max(0, Number(unified.baseHpA || 0)) + Math.max(0, Number(unified.healA || 0));
    const bPool = Math.max(0, Number(unified.baseHpB || 0)) + Math.max(0, Number(unified.healB || 0));
    const totalPool = Math.max(1, aPool + bPool);
    const totalDamage = Math.max(0, Number(unified.totalDamage || 0));

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
      team.unit1.hp = Math.max(0, Math.min(Number(team.unit1.maxHp || 0), Math.floor(aFinal)));
      team.unit1.isDefeated = team.unit1.hp <= 0;
    }

    if (team.unit2) {
      team.unit2.hp = Math.max(0, Math.min(Number(team.unit2.maxHp || 0), Math.floor(bFinal)));
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

    const ev1 = Math.max(0, Number(team.unit1?.evade || 0));
    const ev2 = Math.max(0, Number(team.unit2?.evade || 0));

    return Math.floor((ev1 + ev2) / 2);
  }

  function consumeUnifiedEvade(team, amount) {
    if (!team) return false;

    let remain = Math.max(0, Number(amount || 0));
    if (getUnifiedEvade(team) < remain) return false;

    while (remain > 0) {
      const ev1 = Math.max(0, Number(team.unit1?.evade || 0));
      const ev2 = Math.max(0, Number(team.unit2?.evade || 0));

      if (ev1 > 0 && ev2 > 0) {
        team.unit1.evade -= 1;
        team.unit2.evade -= 1;
      } else if (ev1 >= 2) {
        team.unit1.evade -= 2;
      } else if (ev2 >= 2) {
        team.unit2.evade -= 2;
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
    if (Number(state.evade || 0) < Number(amount || 1)) return false;

    state.evade -= Number(amount || 1);
    return true;
  }

  function zeroUnifiedEvade(team) {
    if (!team) return false;
    if (team.unit1) team.unit1.evade = 0;
    if (team.unit2) team.unit2.evade = 0;
    return true;
  }

  function withUnifiedEvadeForCheck(playerKey, actor, callback) {
    if (!isUnifiedTeam(playerKey) || !actor) {
      return callback();
    }

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
    return Math.max(0, Number(unified.actionCount || 0));
  }

  function canConsumeAction(playerKey, _state, amount = 1) {
    const team = getTeam(playerKey);

    if (!team || team.mode !== "unified") {
      return Number(_state?.actionCount || 0) >= Number(amount || 1);
    }

    return getActionCount(playerKey) >= Number(amount || 1);
  }

  function consumeAction(playerKey, _state, amount = 1) {
    const team = getTeam(playerKey);

    if (!team || team.mode !== "unified") {
      if (!_state) return false;
      if (Number(_state.actionCount || 0) < Number(amount || 1)) return false;
      _state.actionCount = Math.max(0, Number(_state.actionCount || 0) - Number(amount || 1));
      return true;
    }

    const unified = ensureUnifiedState(team);
    if (Number(unified.actionCount || 0) < Number(amount || 1)) return false;

    unified.actionCount = Math.max(0, Number(unified.actionCount || 0) - Number(amount || 1));
    return true;
  }

  function addAction(playerKey, state, amount = 1) {
    const team = getTeam(playerKey);

    if (team?.mode === "unified") {
      const unified = ensureUnifiedState(team);
      unified.actionCount += Number(amount || 1);
      return true;
    }

    if (!state) return false;
    state.actionCount = Number(state.actionCount || 0) + Number(amount || 1);
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
