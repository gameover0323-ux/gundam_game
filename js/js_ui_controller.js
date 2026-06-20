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
      maxValue: pendingChoice.maxValue,
      onChoose: (value) => ctx.resolvePendingChoice(value)
    });
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

    const actionLabelElement = actionCounterValue
      ? actionCounterValue.previousElementSibling
      : null;

    if (actionLabelElement) {
      actionLabelElement.textContent = isUnified ? "統行" : "行動";
    }

    if (singleTeamActionButtons) {
      singleTeamActionButtons.style.display =
        isTeam && !isUnified ? "block" : "none";
    }

    if (actionCounterValue) {
      if (
        isUnified &&
        ctx.twoVtwoAdapter &&
        ctx.twoVtwoAdapter.getActionCount
      ) {
        actionCounterValue.textContent = String(
          ctx.twoVtwoAdapter.getActionCount(currentPlayer, team.unit1 || actor)
        );
      } else {
        actionCounterValue.textContent = actor ? String(actor.actionCount) : "1";
      }
    }

    if (toggleTestModeBtn) {
      toggleTestModeBtn.textContent = `テストモード: ${ctx.getIsTestMode() ? "ON" : "OFF"}`;
    }
  }

  function getProfileOwnerPlayer() {
    if (ctx.isOnlineEnabled && ctx.isOnlineEnabled()) {
      const onlineMyPlayer =
        typeof ctx.getOnlineMyPlayer === "function"
          ? ctx.getOnlineMyPlayer()
          : null;

      if (onlineMyPlayer === "A" || onlineMyPlayer === "B") {
        return onlineMyPlayer;
      }
    }

    return "A";
  }

  function normalizeTrophyList(list) {
    if (!Array.isArray(list)) return [];
    return [...new Set(list.map(value => String(value || "").trim()).filter(Boolean))];
  }

  function getEquippedTrophySuffix(unitId, ownerPlayer) {
    const profile = ctx.getPlayerProfile ? ctx.getPlayerProfile() : null;
    if (!profile) return "";

    const profileOwnerPlayer = getProfileOwnerPlayer();
    if (ownerPlayer !== profileOwnerPlayer) return "";

    const trophies = normalizeTrophyList(profile?.trophies?.byUnit?.[unitId]);
    if (trophies.length === 0) return "";

    return trophies.join("");
  }

  function applyDisplaySuffixToState(state, ownerPlayer) {
    if (!state) return;

    const unitId = state.unitId || state?.unit?.id || state.id || "";
    state.displaySuffix = getEquippedTrophySuffix(unitId, ownerPlayer);
  }

  function redrawBattleBoards() {
    if (ctx.isTeamBattleMode()) {
      const teamA = ctx.getTeam("A");
      const teamB = ctx.getTeam("B");

      if (teamA?.unit1) {
        ctx.applyUnitDerivedState(teamA.unit1, {
          ownerPlayer: "A",
          ownerUnitKey: "unit1",
          team: teamA,
          twoVtwoAdapter: ctx.twoVtwoAdapter || null
        });
        applyDisplaySuffixToState(teamA.unit1, "A");
      }

      if (teamA?.unit2) {
        ctx.applyUnitDerivedState(teamA.unit2, {
          ownerPlayer: "A",
          ownerUnitKey: "unit2",
          team: teamA,
          twoVtwoAdapter: ctx.twoVtwoAdapter || null
        });
        applyDisplaySuffixToState(teamA.unit2, "A");
      }

      if (teamB?.unit1) {
        ctx.applyUnitDerivedState(teamB.unit1, {
          ownerPlayer: "B",
          ownerUnitKey: "unit1",
          team: teamB,
          twoVtwoAdapter: ctx.twoVtwoAdapter || null
        });
        applyDisplaySuffixToState(teamB.unit1, "B");
      }

      if (teamB?.unit2) {
        ctx.applyUnitDerivedState(teamB.unit2, {
          ownerPlayer: "B",
          ownerUnitKey: "unit2",
          team: teamB,
          twoVtwoAdapter: ctx.twoVtwoAdapter || null
        });
        applyDisplaySuffixToState(teamB.unit2, "B");
      }

      ctx.renderPlayerState2v2(teamA, ctx.playerABox, "PLAYER A", ctx.build2v2RenderHandlers("A"));
      ctx.renderPlayerState2v2(teamB, ctx.playerBBox, "PLAYER B", ctx.build2v2RenderHandlers("B"));
    } else {
      const playerAState = ctx.getPlayerStateRaw("A");
      const playerBState = ctx.getPlayerStateRaw("B");

      if (playerAState) {
        ctx.applyUnitDerivedState(playerAState);
        applyDisplaySuffixToState(playerAState, "A");
      }

      if (playerBState) {
        ctx.applyUnitDerivedState(playerBState);
        applyDisplaySuffixToState(playerBState, "B");
      }

      ctx.renderPlayerState(playerAState, ctx.playerABox, "PLAYER A", ctx.build1v1RenderHandlers("A"));
      ctx.renderPlayerState(playerBState, ctx.playerBBox, "PLAYER B", ctx.build1v1RenderHandlers("B"));
    }

    const currentPlayerLabel = `PLAYER ${ctx.getCurrentPlayer()}`;

    document.getElementById("turnText").textContent = `TURN ${ctx.getCurrentTurn()}`;
    document.getElementById("turnCounterValue").textContent = String(ctx.getCurrentTurn());
    document.getElementById("currentPlayer").textContent = currentPlayerLabel;

    const attackLog = document.getElementById("attackLog");
    if (
      attackLog &&
      (
        attackLog.textContent.trim() === "バトル開始待機中" ||
        attackLog.textContent.trim() === ""
      )
    ) {
      attackLog.textContent = `現在${currentPlayerLabel}操作待機中`;
    }

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
