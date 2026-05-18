export function createResetController(ctx) {
  function cleanupOnlineBattleUi() {
    document.getElementById("onlineTopPlayerHud")?.remove();
    document.getElementById("onlineBattleExtraArea")?.remove();
    document.getElementById("onlinePeaceSurrenderBox")?.remove();
  }

  function resetOnlineStateForLocalBattle() {
    ctx.setOnlineState({
      enabled: false,
      roomId: null,
      myPlayer: null,
      isHost: false,
      lastAppliedActionId: 0,
      isApplyingRemote: false
    });

    ctx.setOnlineBattleStarted(false);
    ctx.setOnlineBattleFinished(false);
    ctx.setOnlineSelectEntered(false);
    ctx.setOnlineActionSeq(0);

    cleanupOnlineBattleUi();

    ctx.setOnlineEncounterSaved(false);
    ctx.setCurrentOnlineOpponentPlayerId("");
  }

  function resetLocalSelectionAndBattleState() {
    ctx.setSelectingPlayer("A");
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);
    ctx.setPendingSelectedUnit(null);

    ctx.setTeamA(null);
    ctx.setTeamB(null);
    ctx.setPlayerAState(null);
    ctx.setPlayerBState(null);

    ctx.resetBattleRuntime();

    const unitButtons = ctx.getUnitButtons();
    const selectedUnitsPreview = ctx.getSelectedUnitsPreview();

    if (unitButtons) unitButtons.innerHTML = "";
    if (selectedUnitsPreview) selectedUnitsPreview.innerHTML = "";
  }

  function showTitle() {
    ctx.resetRandomMatchState();

    if (
      ctx.isOnlineEnabled() &&
      ctx.getOnlineRoomId() &&
      ctx.getOnlineMyPlayer() &&
      ctx.getOnlineBattleStarted() &&
      !ctx.getOnlineBattleFinished()
    ) {
      ctx.markOnlinePlayerLeft();
    }

    cleanupOnlineBattleUi();
    resetOnlineStateForLocalBattle();
    resetLocalSelectionAndBattleState();

    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.display = "none";
      popup.innerHTML = "";
    }

    ctx.showScreen("title");
  }

  function abortCurrentBattleWithoutRecordForRandomMatch() {
    ctx.resetBattleRuntime();

    ctx.setTeamA(null);
    ctx.setTeamB(null);
    ctx.setPlayerAState(null);
    ctx.setPlayerBState(null);
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);
    ctx.setSelectingPlayer("A");

    ctx.setCurrentTurn(1);
    ctx.setCurrentPlayer("A");

    ctx.setOnlineBattleStarted(false);
    ctx.setOnlineBattleFinished(false);
    ctx.setOnlineSelectEntered(false);
    ctx.setOnlineActionSeq(0);
  }

  return {
    cleanupOnlineBattleUi,
    resetOnlineStateForLocalBattle,
    resetLocalSelectionAndBattleState,
    showTitle,
    abortCurrentBattleWithoutRecordForRandomMatch
  };
}
