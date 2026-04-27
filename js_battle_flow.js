export function createBattleFlow(ctx) {
  function ensureActionState(state) {
    if (!state) return;

    if (typeof state.baseActionCount !== "number") {
      state.baseActionCount = 1;
    }

    if (typeof state.actionCount !== "number") {
      state.actionCount = state.baseActionCount;
    }
  }

  function resetActionCount(state) {
    if (!state) return;
    ensureActionState(state);
    state.actionCount = state.baseActionCount;
  }

  function canConsumeAction(state, amount = 1) {
    if (!state) return false;
    ensureActionState(state);
    return state.actionCount >= amount;
  }

  function consumeActionCount(state, amount = 1) {
    if (!state) return;
    ensureActionState(state);

    if (ctx.getIsTestMode()) {
      return;
    }

    state.actionCount = Math.max(0, state.actionCount - amount);
  }

  function clampEvadeToMax(state) {
    if (!state || typeof state.evadeMax !== "number") return;

    let clampMax = state.evadeMax;

    if (state.overEvadeMode) {
      const redCap =
        typeof state.overEvadeCap === "number"
          ? state.overEvadeCap
          : state.evadeMax;

      clampMax = Math.max(state.evadeMax, redCap);
    }

    if (state.evade > clampMax) {
      state.evade = clampMax;
    }

    if (state.evade < 0) {
      state.evade = 0;
    }

    if (state.overEvadeMode) {
      const currentRedCap =
        typeof state.overEvadeCap === "number"
          ? state.overEvadeCap
          : state.evadeMax;

      const absoluteMax =
        typeof state.overEvadeAbsoluteMax === "number"
          ? state.overEvadeAbsoluteMax
          : null;

      if (state.evade <= state.evadeMax) {
        state.overEvadeMode = false;
        state.overEvadeCap = state.evadeMax;
        state.overEvadeBaseMax = state.evadeMax;
        return;
      }

      state.overEvadeCap =
        absoluteMax !== null
          ? Math.min(currentRedCap, state.evade, absoluteMax)
          : Math.min(currentRedCap, state.evade);
    }
  }

  function executeSlot() {
    if (ctx.hasPendingChoice()) {
      ctx.renderPendingChoice();
      return;
    }

    const attacker = ctx.getPlayerState(ctx.getCurrentPlayer());
    if (!attacker) return;

    ensureActionState(attacker);

    if (!canConsumeAction(attacker, 1)) {
      ctx.showPopup("残り行動数が足りない");
      return;
    }

    const rollableSlotKeys = ctx.getRollableSlotKeys(attacker);
    if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) {
      ctx.showPopup("使用可能なスロットがない");
      return;
    }

    const slotKey = rollableSlotKeys[
      Math.floor(Math.random() * rollableSlotKeys.length)
    ];

    const started = ctx.startSlotAction(ctx.getCurrentPlayer(), slotKey);
    if (!started) return;

    consumeActionCount(attacker, 1);
    ctx.redrawBattleBoards();
  }

  function simulateSlot() {
    const attacker = ctx.getPlayerState(ctx.getCurrentPlayer());
    if (!attacker) return;

    const slotKey = ctx.getRandomSlotKey(attacker);
    const slot = ctx.getSlotByKey(attacker, slotKey);
    if (!slot) return;

    attacker.lastSlotKey = slotKey;

    ctx.showPopup(`出目: ${slot.label}`);
  }

  function endTurn() {
    if (ctx.hasPendingChoice()) {
      ctx.renderPendingChoice();
      return;
    }

    const actorPlayer = ctx.getCurrentPlayer();
    const enemyPlayer = ctx.getOpponentPlayer(actorPlayer);
    const actor = ctx.getPlayerState(actorPlayer);
    const enemyState = ctx.getPlayerState(enemyPlayer);

    if (!actor || !enemyState) return;

    actor.shieldActive = false;
    enemyState.shieldActive = false;

    clampEvadeToMax(actor);
    actor.lastSlotKey = null;

    const turnEndResult = ctx.executeUnitTurnEnd(actor, {
      ownerPlayer: actorPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyPredictableSlotKeys: ctx.getPredictableSlotKeys(enemyState)
    });

    actor.isConfusedTurn = false;
    actor.confuseHits = 0;

    ctx.clearBattleNotice();
    ctx.clearCurrentAction();
    ctx.clearPendingChoice();

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);

    ctx.setCurrentPlayer(enemyPlayer);

    if (ctx.getCurrentPlayer() === "A") {
      ctx.setCurrentTurn(ctx.getCurrentTurn() + 1);
    }

    if (ctx.getBattleMode() === "2v2") {
      const nextTeam = ctx.getTeam(ctx.getCurrentPlayer());

      if (nextTeam) {
        nextTeam.activeUnitKey = nextTeam.focusUnitKey || "unit1";

        resetActionCount(nextTeam.unit1);
        resetActionCount(nextTeam.unit2);
      }
    } else {
      const nextActor = ctx.getPlayerState(ctx.getCurrentPlayer());
      resetActionCount(nextActor);
    }

    const attackLog = document.getElementById("attackLog");
    if (attackLog) {
      attackLog.textContent = "バトル開始待機中";
    }

    ctx.redrawBattleBoards();

    if (turnEndResult.requestChoice) {
      ctx.handleChoiceRequest(turnEndResult.requestChoice);
      return;
    }

    if (turnEndResult.message) {
  ctx.showPopup(turnEndResult.message);
    }
  }

  return {
    ensureActionState,
    resetActionCount,
    canConsumeAction,
    consumeActionCount,
    clampEvadeToMax,
    executeSlot,
    simulateSlot,
    endTurn
  };
}
