export function create2v2Core(ctx) {
  function isTeamBattleMode() {
    const battleMode = ctx.getBattleMode();
    return (
      battleMode === "2v2" ||
      battleMode === "challenge2v2" ||
      battleMode === "vscpu2v2" ||
      battleMode === "online2v2"
    );
  }

  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function markDefeatedIfNeeded(unit) {
    if (!unit) return;
    if (Number(unit.hp || 0) <= 0) {
      unit.hp = 0;
      unit.isDefeated = true;
    }
  }

  function copySourceMetaToBattleState(state, sourceUnit) {
    if (!state || !sourceUnit) return state;

    if (!state.unitId && sourceUnit.id) state.unitId = sourceUnit.id;
    if (!state.id && sourceUnit.id) state.id = sourceUnit.id;

    if (sourceUnit.bossGroupId) state.bossGroupId = sourceUnit.bossGroupId;
    if (sourceUnit.trophyCode) state.trophyCode = sourceUnit.trophyCode;
    if (sourceUnit.isTwoVsBossUnit) state.isTwoVsBossUnit = true;
    if (sourceUnit.isBoss) state.isBoss = true;

    state.unit = sourceUnit;
    return state;
  }

  function ensureTeamActionMode(team) {
    if (!team) return;

    if (typeof team.actionModeLock !== "string") {
      team.actionModeLock = "";
    }

    if (typeof team.unifiedBaseActionCount !== "number") {
      team.unifiedBaseActionCount = 1;
    }

    if (typeof team.unifiedActionCount !== "number") {
      team.unifiedActionCount = team.unifiedBaseActionCount;
    }
  }

  function getAliveUnitKey(team, preferKey = "unit1") {
    if (!team) return null;

    if (team.mode !== "unified") {
      markDefeatedIfNeeded(team.unit1);
      markDefeatedIfNeeded(team.unit2);
    }

    if (preferKey === "unit2" && !isUnitDefeated(team.unit2)) return "unit2";
    if (preferKey === "unit1" && !isUnitDefeated(team.unit1)) return "unit1";

    if (!isUnitDefeated(team.unit1)) return "unit1";
    if (!isUnitDefeated(team.unit2)) return "unit2";

    return null;
  }

  function normalizeTeamFocus(team) {
    if (!team) return;

    ensureTeamActionMode(team);

    const aliveActiveKey = getAliveUnitKey(team, team.activeUnitKey);
    if (aliveActiveKey) {
      team.activeUnitKey = aliveActiveKey;
    }

    const aliveFocusKey = getAliveUnitKey(team, team.focusUnitKey);
    if (aliveFocusKey) {
      team.focusUnitKey = aliveFocusKey;
    }
  }

  function getTeam(playerKey) {
    const team = playerKey === "A" ? ctx.getTeamA() : ctx.getTeamB();
    normalizeTeamFocus(team);
    return team;
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
    if (isUnitDefeated(team[unitKey])) return;

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

    if (isUnitDefeated(team[unitKey])) {
      ctx.appendBattleNotice("撃墜された機体にはフォーカスできません");
      ctx.redrawBattleBoards();
      return;
    }

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
    if (!team || !team.unit1 || !team.unit2) return false;

    normalizeTeamFocus(team);

    if (isUnitDefeated(team.unit1) || isUnitDefeated(team.unit2)) {
      ctx.showPopup("撃墜済みの機体がいるため統合型へ移行できません");
      return false;
    }

    ensureTeamActionMode(team);

    team.unified = {
      baseHpA: floorHp(team.unit1.hp),
      baseHpB: floorHp(team.unit2.hp),
      totalDamage: 0,
      healA: 0,
      healB: 0
    };

    team.mode = "unified";
    team.focusUnitKey = getAliveUnitKey(team, "unit1") || "unit1";
    team.activeUnitKey = getAliveUnitKey(team, team.activeUnitKey) || "unit1";

    return true;
  }

  function exitUnifiedMode(team) {
    if (!team || !team.unit1 || !team.unit2) return false;

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

    markDefeatedIfNeeded(team.unit1);
    markDefeatedIfNeeded(team.unit2);

    team.unified = {
      baseHpA: 0,
      baseHpB: 0,
      totalDamage: 0,
      healA: 0,
      healB: 0
    };

    team.mode = "split";
    normalizeTeamFocus(team);

    return true;
  }

  function toggleTeamMode(playerKey) {
    const team = getTeam(playerKey);
    if (!team) return false;

    ensureTeamActionMode(team);

    if (!isTeamBattleMode()) {
      ctx.showPopup("2on2専用操作です");
      return false;
    }

    if (ctx.hasPendingChoice() || ctx.hasCurrentAttack()) {
      ctx.showPopup("QTE中は型を変更できません");
      return false;
    }

    if (ctx.getCurrentPlayer && ctx.getCurrentPlayer() !== playerKey) {
      ctx.showPopup("型変更は自分ターン中のみ可能");
      return false;
    }

    if (team.mode === "unified") {
      if (team.actionModeLock === "unified") {
        ctx.showPopup("このターンは統合行動権を使用しているため分散型へ変更できません");
        ctx.redrawBattleBoards();
        return false;
      }

      const changed = exitUnifiedMode(team);

      if (changed) {
        ctx.appendBattleNotice(`${playerKey}チーム：分散型へ移行`);
      }
    } else {
      if (team.actionModeLock === "split") {
        ctx.showPopup("このターンは個別行動権を使用しているため統合型へ変更できません");
        ctx.redrawBattleBoards();
        return false;
      }

      const changed = enterUnifiedMode(team);

      if (changed) {
        ctx.appendBattleNotice(`${playerKey}チーム：統合型へ移行`);
      }
    }

    normalizeTeamFocus(team);

    ctx.redrawBattleBoards();

    if (ctx.updateBattleCenterUi) {
      ctx.updateBattleCenterUi();
    }

    if (ctx.renderAttackLogText) {
      ctx.renderAttackLogText("型変更完了");
    }

    return true;
  }

  function createTeam(unit1, unit2) {
    const state1 = copySourceMetaToBattleState(ctx.createBattleState(unit1), unit1);
    const state2 = copySourceMetaToBattleState(ctx.createBattleState(unit2), unit2);

    return {
      unit1: state1,
      unit2: state2,
      mode: "split",
      activeUnitKey: "unit1",
      focusUnitKey: "unit1",
      actionModeLock: "",
      unifiedBaseActionCount: 1,
      unifiedActionCount: 1,
      modeChangeLockedThisTurn: false,
      tauntState: {
        tauntTargetPlayer: null,
        tauntTargetUnitKey: null,
        tauntOwnerPlayer: null,
        tauntTurns: 0,
        duelActive: false,
        duelAUnitKey: null,
        duelBUnitKey: null,
        duelTurns: 0,
        cooldown: 0,
        disabledThisTurn: false
      },
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
    getUnifiedTotalHp,
    createTeam
  };
}
