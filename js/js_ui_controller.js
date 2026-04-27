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
        <div style="color:#ff6666;font-weight:bold;margin-bottom:4px;">
          ${ctx.getBattleNotice()}
        </div>
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
        <div style="margin-bottom:4px;">${ctx.getCurrentActionLabel()}</div>
      `;
    }

    attackLog.innerHTML += `<div>${message}</div>`;
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
      onChoose: (value) => ctx.resolvePendingChoice(value)
    });
  }

  function updateBattleCenterUi() {
    const actionCounterValue = document.getElementById("actionCounterValue");
    const toggleTestModeBtn = document.getElementById("toggleTestModeBtn");
    const singleTeamActionButtons = document.getElementById("singleTeamActionButtons");

    if (singleTeamActionButtons) {
      singleTeamActionButtons.style.display = ctx.getBattleMode() === "2v2" ? "block" : "none";
    }

    const actor = ctx.getPlayerState(ctx.getCurrentPlayer());
    ctx.ensureActionState(actor);

    if (actionCounterValue) {
      actionCounterValue.textContent = actor ? String(actor.actionCount) : "1";
    }

    if (toggleTestModeBtn) {
      toggleTestModeBtn.textContent = `テストモード: ${ctx.getIsTestMode() ? "ON" : "OFF"}`;
    }
  }

  function redrawBattleBoards() {
    if (ctx.getBattleMode() === "2v2") {
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
