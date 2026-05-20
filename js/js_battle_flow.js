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

  if (
    ctx.twoVtwoAdapter &&
    ctx.isTeamBattleMode &&
    ctx.isTeamBattleMode()
  ) {
    const ownerPlayer = ctx.getCurrentPlayer();
    return ctx.twoVtwoAdapter.canConsumeAction(ownerPlayer, state, amount);
  }

  return state.actionCount >= amount;
  }

  function consumeActionCount(state, amount = 1) {
  if (!state) return;
  ensureActionState(state);

  if (ctx.getIsTestMode()) {
    return;
  }

  if (
    ctx.twoVtwoAdapter &&
    ctx.isTeamBattleMode &&
    ctx.isTeamBattleMode()
  ) {
    const ownerPlayer = ctx.getCurrentPlayer();
    ctx.twoVtwoAdapter.consumeAction(ownerPlayer, state, amount);
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
  const reservedStarted =
      ctx.processReservedActionsForTrigger &&
      ctx.processReservedActionsForTrigger(ctx.getCurrentPlayer(), "turn_start");

    if (reservedStarted) {
      return;
    }
    if (attacker.pendingReservedAttacks && attacker.pendingReservedAttacks.length > 0) {
  attacker.pendingReservedAttacks.forEach((reserved) => {
    reserved.delay = Number(reserved.delay || 0) - 1;
  });

  const readyIndex = attacker.pendingReservedAttacks.findIndex((reserved) => Number(reserved.delay || 0) <= 0);

  if (readyIndex >= 0) {
    const reserved = attacker.pendingReservedAttacks.splice(readyIndex, 1)[0];
    ctx.setCurrentAction(`${attacker.name} の予約攻撃`, reserved.label || "予約攻撃");
    ctx.setCurrentAttack(reserved.attacks || []);
    ctx.setCurrentAttackContext({
      ownerPlayer: ctx.getCurrentPlayer(),
      enemyPlayer: ctx.getOpponentPlayer(ctx.getCurrentPlayer()),
      slotKey: null,
      slotNumber: null,
      slotLabel: reserved.label || "予約攻撃",
      slotDesc: reserved.desc || "",
      totalCount: (reserved.attacks || []).length,
      hitCount: 0,
      evadeCount: 0,
      reservedAttack: true
    });
    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
    return;
  }
    }
  if (!attacker) return;

  ensureActionState(attacker);
if (Number(attacker.pendingActionPenalty || 0) > 0) {
  const penalty = Math.min(attacker.actionCount, Number(attacker.pendingActionPenalty || 0));
  attacker.pendingActionPenalty = Math.max(0, Number(attacker.pendingActionPenalty || 0) - penalty);
  attacker.actionCount = Math.max(0, attacker.actionCount - penalty);

  ctx.redrawBattleBoards();
  ctx.renderAttackLogText(`${attacker.name} は行動不能：行動権-${penalty}`);

  if (!canConsumeAction(attacker, 1)) {
    return;
  }
}
  if (!canConsumeAction(attacker, 1)) {
    ctx.showPopup("残り行動数が足りない");
    return;
  }

  const rollableSlotKeys = ctx.getRollableSlotKeys(attacker);
  if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) {
    ctx.showPopup("使用可能なスロットがない");
    return;
  }

  const ownerPlayer = ctx.getCurrentPlayer();
    const isAutoEnemyTurn =
      typeof ctx.isChallengeMode === "function" &&
      ctx.isChallengeMode() &&
      ownerPlayer === "B";

    if (
      isAutoEnemyTurn &&
      typeof ctx.executeCpuAutoSlotBatch === "function" &&
      Number(attacker.actionCount || 0) > 1
    ) {
      const handled = ctx.executeCpuAutoSlotBatch(ownerPlayer);
      if (handled) {
        return;
      }
    }

    const slotKey = rollableSlotKeys[
      Math.floor(Math.random() * rollableSlotKeys.length)
    ];

    const started = ctx.startSlotAction(ownerPlayer, slotKey);
    if (!started) return;

    consumeActionCount(attacker, 1);

    if (ctx.onSlotActionResolved) {
      ctx.onSlotActionResolved(ownerPlayer, slotKey);
    }

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

    if (ctx.getCurrentAttack && ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
      ctx.showPopup("QTEを解決してからターン終了してください");
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

    if (ctx.isTeamBattleMode()) {
      const nextTeam = ctx.getTeam(ctx.getCurrentPlayer());
      if (nextTeam) {
        nextTeam.activeUnitKey = nextTeam.focusUnitKey || "unit1";
        resetActionCount(nextTeam.unit1);
if (nextTeam.unit2) resetActionCount(nextTeam.unit2);

if (
  nextTeam.mode === "unified" &&
  ctx.twoVtwoAdapter &&
  typeof ctx.twoVtwoAdapter.resetUnifiedActionCount === "function"
) {
  ctx.twoVtwoAdapter.resetUnifiedActionCount(nextTeam);
}

if (
  nextTeam.mode === "unified" &&
  ctx.twoVtwoAdapter &&
  typeof ctx.twoVtwoAdapter.resetUnifiedActionCount === "function"
) {
  ctx.twoVtwoAdapter.resetUnifiedActionCount(nextTeam);
}
        if (ctx.getBattleMode && ctx.getBattleMode() === "vscpu2v2" && ctx.getCurrentPlayer() === "B") {
  const cpuTeam = ctx.getTeam("B");
  if (cpuTeam) {
    cpuTeam.focusUnitKey = Math.random() < 0.5 ? "unit1" : "unit2";
    cpuTeam.activeUnitKey = cpuTeam.focusUnitKey;
  }
}
      }
    } else {
      const nextActor = ctx.getPlayerState(ctx.getCurrentPlayer());
      resetActionCount(nextActor);
    }

    const attackLog = document.getElementById("attackLog");
    if (attackLog) {
      attackLog.textContent = turnEndResult.message || "バトル開始待機中";
    }

    ctx.redrawBattleBoards();

    if (turnEndResult.requestChoice) {
      ctx.handleChoiceRequest(turnEndResult.requestChoice);
      return;
    }

    if (ctx.isChallengeMode && ctx.isChallengeMode() && ctx.getCurrentPlayer() === "B") {
  if (ctx.isTeamBattleMode && ctx.isTeamBattleMode() && ctx.executeTeamSlot) {
    ctx.executeTeamSlot();
    return;
  }

  executeSlot();
  return;
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
