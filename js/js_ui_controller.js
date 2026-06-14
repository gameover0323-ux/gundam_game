export function createUiController(ctx) {
  function showScreen(screenId) {
    Object.values(ctx.screens).forEach(screen => {
      screen.classList.remove("active");
    });
    ctx.screens[screenId].classList.add("active");
  }

function getTurnStatusText() {
  const player = ctx.getCurrentPlayer ? ctx.getCurrentPlayer() : "A";

  if (!(ctx.isTeamBattleMode && ctx.isTeamBattleMode())) {
    const actor = ctx.getPlayerState ? ctx.getPlayerState(player) : null;
    const actionCount = actor ? Number(actor.actionCount || 0) : 0;
    return `PLAYER ${player}のターンです<br>行動権:${actionCount}`;
  }

  const team = ctx.getTeam ? ctx.getTeam(player) : null;
  if (!team) {
    return `PLAYER ${player}のターンです`;
  }

  if (team.mode === "unified") {
    const unifiedAction =
      ctx.twoVtwoAdapter && typeof ctx.twoVtwoAdapter.getActionCount === "function"
        ? ctx.twoVtwoAdapter.getActionCount(player, team.unit1)
        : Number(team.unified?.actionCount || 0);

    return `PLAYER ${player}のターンです<br>統合型 行動権:${unifiedAction}`;
  }

  const unit1Action = Number(team.unit1?.actionCount || 0);
  const unit2Action = Number(team.unit2?.actionCount || 0);
  return `PLAYER ${player}のターンです<br>分散型 行動権:1機目 ${unit1Action} / 2機目 ${unit2Action}`;
}
function renderAttackLogText(message, options = {}) {
  const attackLog = document.getElementById("attackLog");
  attackLog.innerHTML = "";

  const hasMessage = message !== null && message !== undefined && String(message) !== "";
  const showCurrentAction = options.showCurrentAction !== false && hasMessage;

  if (ctx.getBattleNotice()) {
    attackLog.innerHTML += `
${ctx.getBattleNotice()}
`;
    ctx.clearBattleNotice();
  }

  if (showCurrentAction && ctx.getCurrentActionHeader()) {
    attackLog.innerHTML += `
${ctx.getCurrentActionHeader()}
`;
  }

  if (showCurrentAction && ctx.getCurrentActionLabel()) {
    attackLog.innerHTML += `
${ctx.getCurrentActionLabel()}
`;
  }

  attackLog.innerHTML += `
${hasMessage ? message : getTurnStatusText()}
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
  const isTeam = ctx.isTeamBattleMode && ctx.isTeamBattleMode();
  const team = isTeam && ctx.getTeam ? ctx.getTeam(currentPlayer) : null;
  const isUnified = !!team && team.mode === "unified";
  const actor = ctx.getPlayerState(currentPlayer);

  if (actor) {
    ctx.ensureActionState(actor);
  }
  if (team?.unit1) {
    ctx.ensureActionState(team.unit1);
  }
  if (team?.unit2) {
    ctx.ensureActionState(team.unit2);
  }

  const actionLabelElement = actionCounterValue ? actionCounterValue.previousElementSibling : null;

  if (actionLabelElement) {
    if (isUnified) {
      actionLabelElement.textContent = "統行";
    } else if (isTeam) {
      actionLabelElement.textContent = "分行";
    } else {
      actionLabelElement.textContent = "行動";
    }
  }

  if (singleTeamActionButtons) {
    singleTeamActionButtons.style.display = isTeam && !isUnified ? "block" : "none";
  }

  if (actionCounterValue) {
    if (isUnified) {
      const unifiedAction =
        ctx.twoVtwoAdapter && ctx.twoVtwoAdapter.getActionCount
          ? ctx.twoVtwoAdapter.getActionCount(currentPlayer, team.unit1 || actor)
          : Number(team.unified?.actionCount || 0);

      actionCounterValue.textContent = String(unifiedAction);
    } else if (isTeam) {
      const unit1Action = Number(team?.unit1?.actionCount || 0);
      const unit2Action = Number(team?.unit2?.actionCount || 0);
      actionCounterValue.textContent = `${unit1Action}/${unit2Action}`;
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
