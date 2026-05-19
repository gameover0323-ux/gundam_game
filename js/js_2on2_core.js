export function create2v2Core(ctx) {
  function isTeamBattleMode() {
    const battleMode = ctx.getBattleMode();

    return battleMode === "2v2" ||
      battleMode === "challenge2v2" ||
      battleMode === "vscpu2v2";
  }

  function getTeam(playerKey) {
    return playerKey === "A" ? ctx.getTeamA() : ctx.getTeamB();
  }

  function getActiveUnitState(playerKey) {
    const team = getTeam(playerKey);
    if (!team) return null;

    return team[team.activeUnitKey] || null;
  }

  function getFocusUnitState(playerKey) {
    const team = getTeam(playerKey);
    if (!team) return null;

    return team[team.focusUnitKey] || null;
  }

  function setActiveUnit(playerKey, unitKey) {
    const team = getTeam(playerKey);
    if (!team) return;
    if (unitKey !== "unit1" && unitKey !== "unit2") return;
    if (!team[unitKey]) return;

    team.activeUnitKey = unitKey;
  }

  function getCombatTargetState(playerKey) {
    if (isTeamBattleMode()) {
      return getFocusUnitState(playerKey);
    }

    return ctx.getPlayerStateRaw(playerKey);
  }

  function canChangeFocus(playerKey) {
    if (!isTeamBattleMode()) return false;
    if (playerKey !== ctx.getCurrentPlayer()) return false;
    if (ctx.hasPendingChoice()) return false;
    if (ctx.hasCurrentAttack()) return false;

    return true;
  }

  function setFocusUnit(playerKey, unitKey) {
    const team = getTeam(playerKey);
    if (!team) return;
    if (unitKey !== "unit1" && unitKey !== "unit2") return;
    if (!team[unitKey]) return;

    team.focusUnitKey = unitKey;
  }
function floorHp(value) {
    return Math.max(0, Math.floor(Number(value || 0)));
  }

  function getUnifiedTotalHp(team) {
    if (!team) return 0;

    if (team.mode === "unified") {
      const unified = team.unified || {};
      return Math.max(
        0,
        floorHp(unified.baseHpA) +
          floorHp(unified.baseHpB) +
          floorHp(unified.healA) +
          floorHp(unified.healB) -
          floorHp(unified.totalDamage)
      );
    }

    return floorHp(team.unit1?.hp) + floorHp(team.unit2?.hp);
  }

  function enterUnifiedMode(team) {
    if (!team || !team.unit1 || !team.unit2) return;

    team.unified = {
      baseHpA: floorHp(team.unit1.hp),
      baseHpB: floorHp(team.unit2.hp),
      totalDamage: 0,
      healA: 0,
      healB: 0
    };

    team.mode = "unified";
    team.focusUnitKey = "unit1";
  }

  function exitUnifiedMode(team) {
    if (!team || !team.unit1 || !team.unit2) return;

    const unified = team.unified || {
      baseHpA: floorHp(team.unit1.hp),
      baseHpB: floorHp(team.unit2.hp),
      totalDamage: 0,
      healA: 0,
      healB: 0
    };

    const currentA = floorHp(unified.baseHpA) + floorHp(unified.healA);
    const currentB = floorHp(unified.baseHpB) + floorHp(unified.healB);
    const totalCurrent = currentA + currentB;
    const totalDamage = floorHp(unified.totalDamage);

    let damageA = 0;
    let damageB = 0;

    if (totalCurrent > 0) {
      damageA = Math.floor(totalDamage * (currentA / totalCurrent));
      damageB = totalDamage - damageA;
    }

    let finalA = currentA - damageA;
    let finalB = currentB - damageB;

    if (finalA < 0) {
      finalB += finalA;
      finalA = 0;
    }

    if (finalB < 0) {
      finalA += finalB;
      finalB = 0;
    }

    team.unit1.hp = floorHp(finalA);
    team.unit2.hp = floorHp(finalB);

    team.unified = {
      baseHpA: 0,
      baseHpB: 0,
      totalDamage: 0,
      healA: 0,
      healB: 0
    };

    team.mode = "split";
    team.focusUnitKey = "unit1";
  }
  function toggleTeamMode(playerKey) {
    const team = getTeam(playerKey);
    if (!team) return;

    ctx.showPopup("統合型は未実装です");
  }

  function createTeam(unit1, unit2) {
    return {
      unit1: ctx.createBattleState(unit1),
      unit2: ctx.createBattleState(unit2),

      mode: "split",

      activeUnitKey: "unit1",
      focusUnitKey: "unit1",

      unified: {
        baseHpA: 0,
        baseHpB: 0,
        totalDamage: 0,
        healA: 0,
        healB: 0
      }
    };
  }

  return {
    isTeamBattleMode,
    getTeam,
    getActiveUnitState,
    getFocusUnitState,
    setActiveUnit,
    getCombatTargetState,
    canChangeFocus,
    setFocusUnit,
    toggleTeamMode,
    createTeam
  };
}
