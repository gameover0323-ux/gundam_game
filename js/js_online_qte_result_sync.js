export function createOnlineQteResultSync(ctx) {
  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function isTargetMode() {
    const mode = ctx.getBattleMode();
    return mode === "online1v1" || mode === "online2v2";
  }

  function getActionType() {
    return ctx.getBattleMode() === "online2v2"
      ? "qteResult2v2"
      : "qteResult";
  }

  function isQteResultAction(action) {
    return action?.type === "qteResult" || action?.type === "qteResult2v2";
  }

  function buildSnapshot() {
    return {
      mode: ctx.getBattleMode(),
      currentTurn: ctx.getCurrentTurn(),
      currentPlayer: ctx.getCurrentPlayer(),

      playerAState: cloneValue(ctx.getPlayerAState()),
      playerBState: cloneValue(ctx.getPlayerBState()),

      teamA: cloneValue(ctx.getTeam("A")),
      teamB: cloneValue(ctx.getTeam("B")),

      currentAttack: cloneValue(ctx.getCurrentAttack()),
      currentAttackContext: cloneValue(ctx.getCurrentAttackContext()),
      currentAttackContexts: cloneValue(ctx.getCurrentAttackContexts()),

      battleNotice: ctx.getBattleNotice(),
      currentActionHeader: ctx.getCurrentActionHeader(),
      currentActionLabel: ctx.getCurrentActionLabel(),

      pendingChoice:
        typeof ctx.getPendingChoice === "function"
          ? cloneValue(ctx.getPendingChoice())
          : null,

      updatedAt: Date.now()
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;

    if (snapshot.mode === "online2v2") {
      if (snapshot.teamA) ctx.setTeamA(cloneValue(snapshot.teamA));
      if (snapshot.teamB) ctx.setTeamB(cloneValue(snapshot.teamB));

      const nextTeamA = ctx.getTeam("A");
      const nextTeamB = ctx.getTeam("B");

      if (nextTeamA) {
        ctx.setPlayerAState(
          nextTeamA[nextTeamA.activeUnitKey || "unit1"] ||
          nextTeamA.unit1 ||
          null
        );
      }

      if (nextTeamB) {
        ctx.setPlayerBState(
          nextTeamB[nextTeamB.activeUnitKey || "unit1"] ||
          nextTeamB.unit1 ||
          null
        );
      }
    } else {
      ctx.setPlayerAState(cloneValue(snapshot.playerAState));
      ctx.setPlayerBState(cloneValue(snapshot.playerBState));
    }

    ctx.setCurrentTurn(Number(snapshot.currentTurn || 1));
    ctx.setCurrentPlayer(snapshot.currentPlayer === "B" ? "B" : "A");

    ctx.setCurrentAttack(
      Array.isArray(snapshot.currentAttack)
        ? cloneValue(snapshot.currentAttack)
        : []
    );

    ctx.setCurrentAttackContext(cloneValue(snapshot.currentAttackContext));

    ctx.setCurrentAttackContexts(
      Array.isArray(snapshot.currentAttackContexts)
        ? cloneValue(snapshot.currentAttackContexts)
        : []
    );

    ctx.setBattleNotice(snapshot.battleNotice || "");
    ctx.setCurrentActionHeader(snapshot.currentActionHeader || "");
    ctx.setCurrentActionLabel(snapshot.currentActionLabel || "");

    if (typeof ctx.setPendingChoice === "function") {
      ctx.setPendingChoice(cloneValue(snapshot.pendingChoice));
    }

  ctx.redrawBattleBoards();

if (Array.isArray(snapshot.currentAttack) && snapshot.currentAttack.length > 0) {
  ctx.renderAttackChoices();
  return;
}

if (snapshot.pendingChoice && typeof ctx.renderPendingChoice === "function") {
  ctx.renderPendingChoice();
  return;
}

if (typeof ctx.renderAttackLogText === "function") {
  ctx.renderAttackLogText(snapshot.battleNotice || "攻撃解決済み");
}
  }

  function publishOnlineQteResultAction(kind, index) {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (!isTargetMode()) return false;
    if (!ctx.getOnlineRoomId()) return false;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ctx.getOnlineMyPlayer(),
        type: getActionType(),
        payload: { kind, index },
        createdAt: Date.now()
      },
      battleSnapshot: buildSnapshot(),
      "meta/updatedAt": Date.now()
    });

    return true;
  }

  function applyOnlineQteResultAction(action, battleSnapshot = null) {
    if (!ctx.isOnlineEnabled() || !action) return false;
    if (!isQteResultAction(action)) return false;
    if (typeof action.actionId !== "number") return true;

    if (action.actionId <= ctx.getLastAppliedActionId()) {
      return true;
    }

    ctx.setLastAppliedActionId(action.actionId);
    ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));

    if (action.actor === ctx.getOnlineMyPlayer()) {
      return true;
    }

    ctx.setApplyingRemote(true);

    try {
      applySnapshot(battleSnapshot);
    } finally {
      ctx.setApplyingRemote(false);
    }

    return true;
  }

  return {
    publishOnlineQteResultAction,
    applyOnlineQteResultAction
  };
}
