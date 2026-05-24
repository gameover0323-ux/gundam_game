export function createUiController(ctx) {
  function showScreen(screenId) {
    Object.values(ctx.screens).forEach(screen => {
      screen.classList.remove("active");
    });
    ctx.screens[screenId].classList.add("active");
  }

  function renderAttackLogText(message) {
    const attackLog = document.getElementById("attackLog");
    attackLog.innerHTML = "";

    if (ctx.getBattleNotice()) {
      attackLog.innerHTML += `
        <div style="color:#ff6666;font-weight:bold;">${ctx.getBattleNotice()}</div>
      `;
      ctx.clearBattleNotice();
    }

    if (ctx.getCurrentActionHeader()) {
      attackLog.innerHTML += `
        <div style="font-weight:bold;">${ctx.getCurrentActionHeader()}</div>
      `;
    }

    if (ctx.getCurrentActionLabel()) {
      attackLog.innerHTML += `
        <div>${ctx.getCurrentActionLabel()}</div>
      `;
    }

    attackLog.innerHTML += `
      <div>${message}</div>
    `;
  }

  function renderPendingChoice() {
    const pendingChoice = ctx.getPendingChoice();
    if (!pendingChoice) return;

    const choices =
      Array.isArray(pendingChoice.choices) && pendingChoice.choices.length > 0
        ? pendingChoice.choices
        : (pendingChoice.slotKeys || []).map((slotKey) => ({
            label: String(ctx.getSlotNumberFromKey(slotKey)),
            value: slotKey
          }));

    ctx.renderPendingChoiceUI({
      title: pendingChoice.title,
      choices,
      choiceType: pendingChoice.choiceType,
      currentValue: pendingChoice.currentValue,
      digits: pendingChoice.digits,
      onChoose: (value) => ctx.resolvePendingChoice(value)
    });
  }

  function getCurrentTeamMode() {
    if (!ctx.isTeamBattleMode || !ctx.isTeamBattleMode()) return null;

    const team = ctx.getTeam ? ctx.getTeam(ctx.getCurrentPlayer()) : null;
    return team?.mode || null;
  }

  function updateBattleCenterUi() {
    const actionCounterValue = document.getElementById("actionCounterValue");
    const toggleTestModeBtn = document.getElementById("toggleTestModeBtn");
    const singleTeamActionButtons = document.getElementById("singleTeamActionButtons");

    const currentPlayer = ctx.getCurrentPlayer();
    const actor = ctx.getPlayerState(currentPlayer);

    if (actor) {
      ctx.ensureActionState(actor);
    }

    const isTeam = ctx.isTeamBattleMode && ctx.isTeamBattleMode();
    const currentTeamMode = getCurrentTeamMode();

    if (singleTeamActionButtons) {
      singleTeamActionButtons.style.display =
        isTeam && currentTeamMode !== "unified" ? "block" : "none";
    }

    if (actionCounterValue) {
      if (
        isTeam &&
        currentTeamMode === "unified" &&
        ctx.twoVtwoAdapter &&
        ctx.twoVtwoAdapter.getActionCount
      ) {
        actionCounterValue.textContent = actor
          ? String(ctx.twoVtwoAdapter.getActionCount(currentPlayer, actor))
          : "1";
      } else {
        actionCounterValue.textContent = actor ? String(actor.actionCount) : "1";
      }
    }

    if (toggleTestModeBtn) {
      toggleTestModeBtn.textContent = `テストモード: ${ctx.getIsTestMode() ? "ON" : "OFF"}`;
    }
  }

  function redrawBattleBoards() {
    if (ctx.isTeamBattleMode()) {
      const teamA = ctx.getTeam("A");
      const teamB = ctx.getTeam("B");

      if (teamA?.unit1) ctx.applyUnitDerivedState(teamA.unit1);
      if (teamA?.unit2) ctx.applyUnitDerivedState(teamA.unit2);
      if (teamB?.unit1) ctx.applyUnitDerivedState(teamB.unit1);
      if (teamB?.unit2) ctx.applyUnitDerivedState(teamB.unit2);

      ctx.renderPlayerState2v2(teamA, ctx.playerABox, "PLAYER A", ctx.build2v2RenderHandlers("A"));
      ctx.renderPlayerState2v2(teamB, ctx.playerBBox, "PLAYER B", ctx.build2v2RenderHandlers("B"));
    } else {
      const playerAState = ctx.getPlayerStateRaw("A");
      const playerBState = ctx.getPlayerStateRaw("B");

      if (playerAState) ctx.applyUnitDerivedState(playerAState);
      if (playerBState) ctx.applyUnitDerivedState(playerBState);

      ctx.renderPlayerState(playerAState, ctx.playerABox, "PLAYER A", ctx.build1v1RenderHandlers("A"));
      ctx.renderPlayerState(playerBState, ctx.playerBBox, "PLAYER B", ctx.build1v1RenderHandlers("B"));
    }

    document.getElementById("turnText").textContent = `TURN ${ctx.getCurrentTurn()}`;
    document.getElementById("turnCounterValue").textContent = String(ctx.getCurrentTurn());
    document.getElementById("currentPlayer").textContent = `PLAYER ${ctx.getCurrentPlayer()}`;

    updateBattleCenterUi();
  }

  return {
    showScreen,
    renderAttackLogText,
    renderPendingChoice,
    updateBattleCenterUi,
    redrawBattleBoards
  };
}
