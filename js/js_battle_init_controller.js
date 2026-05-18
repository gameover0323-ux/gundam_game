export function createBattleInitController(ctx) {
  function resetCommonBattleRuntime({ logText }) {
    ctx.setCurrentTurn(1);
    ctx.setCurrentPlayer("A");
    ctx.clearCurrentAttackState();
    ctx.setBattleNotice("");
    ctx.setCurrentAction("", "");
    ctx.clearPendingChoice();

    ctx.setTestMode(false);
    ctx.setSelectingPlayer("A");
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);

    ctx.applyBattleDisplayNames();
    ctx.redrawBattleBoards();

    const attackLog = document.getElementById("attackLog");
    if (attackLog) {
      attackLog.textContent = logText;
    }

    ctx.updateDebugButtonVisibility();
    ctx.showScreen("battle");
  }

  function init1v1(unitA, unitB) {
    ctx.setPlayerAState(ctx.createBattleState(unitA));
    ctx.setPlayerBState(ctx.createBattleState(unitB));

    ctx.resetActionCount(ctx.getPlayerAState());
    ctx.resetActionCount(ctx.getPlayerBState());

    resetCommonBattleRuntime({
      logText: "バトル開始待機中"
    });
  }

  function init2v2(unitsA, unitsB) {
    const teamA = ctx.createTeam(unitsA[0], unitsA[1]);
    const teamB = ctx.createTeam(unitsB[0], unitsB[1]);

    teamA.activeUnitKey = "unit1";
    teamA.focusUnitKey = "unit1";
    teamB.activeUnitKey = "unit1";
    teamB.focusUnitKey = "unit1";

    ctx.setTeamA(teamA);
    ctx.setTeamB(teamB);

    ctx.setPlayerAState(teamA.unit1);
    ctx.setPlayerBState(teamB.unit1);

    ctx.resetActionCount(teamA.unit1);
    ctx.resetActionCount(teamA.unit2);
    ctx.resetActionCount(teamB.unit1);
    ctx.resetActionCount(teamB.unit2);

    resetCommonBattleRuntime({
      logText: "バトル開始待機中"
    });
  }

  function initChallenge1v1(unitA, bossUnit) {
    ctx.setPlayerAState(ctx.createBattleState(unitA));
    ctx.setPlayerBState(ctx.createBattleState(bossUnit));

    ctx.resetActionCount(ctx.getPlayerAState());
    ctx.resetActionCount(ctx.getPlayerBState());

    resetCommonBattleRuntime({
      logText: "チャレンジバトル開始"
    });
  }

  function initChallenge2v2(unitsA, bossUnits) {
    const teamA = ctx.createTeam(unitsA[0], unitsA[1]);

    const teamB = {
      unit1: ctx.createBattleState(bossUnits[0]),
      unit2: bossUnits[1] ? ctx.createBattleState(bossUnits[1]) : null,

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

    ctx.setTeamA(teamA);
    ctx.setTeamB(teamB);

    ctx.setPlayerAState(teamA.unit1);
    ctx.setPlayerBState(teamB.unit1);

    ctx.resetActionCount(teamA.unit1);
    ctx.resetActionCount(teamA.unit2);
    ctx.resetActionCount(teamB.unit1);
    if (teamB.unit2) ctx.resetActionCount(teamB.unit2);

    resetCommonBattleRuntime({
      logText: "2機チャレンジバトル開始"
    });
  }

  return {
    init1v1,
    init2v2,
    initChallenge1v1,
    initChallenge2v2
  };
}
