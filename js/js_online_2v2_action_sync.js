export function createOnline2v2ActionSync(ctx) {
  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function buildOnline2v2BattleSnapshot() {
    return {
      mode: ctx.getBattleMode(),
      currentTurn: ctx.getCurrentTurn(),
      currentPlayer: ctx.getCurrentPlayer(),
      teamA: cloneValue(ctx.getTeam("A")),
      teamB: cloneValue(ctx.getTeam("B")),
      currentAttack: cloneValue(ctx.getCurrentAttack()),
      currentAttackContext: cloneValue(ctx.getCurrentAttackContext()),
      currentAttackContexts: cloneValue(ctx.getCurrentAttackContexts()),
      battleNotice: ctx.getBattleNotice(),
      currentActionHeader: ctx.getCurrentActionHeader(),
      currentActionLabel: ctx.getCurrentActionLabel(),
      updatedAt: Date.now()
    };
  }

  function buildRoomUpdateWithSnapshot(action) {
    return {
      action,
      battleSnapshot: buildOnline2v2BattleSnapshot(),
      "meta/updatedAt": Date.now()
    };
  }

  function publishAction(type, actor, payload = {}) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (!ctx.getOnlineRoomId()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdateWithSnapshot({
      actionId,
      actor,
      type,
      payload,
      createdAt: Date.now()
    }));
  }

  function publishOnline2v2SlotAction(ownerPlayer, slotMode = "team", unitKey = null) {
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;
    publishAction("slot2v2", ownerPlayer, { slotMode, unitKey });
  }

  function publishOnline2v2QteAction(kind, index) {
    publishAction("qte2v2", ctx.getOnlineMyPlayer(), { kind, index });
  }

  function publishOnline2v2EndTurnAction(actorPlayer) {
    if (actorPlayer !== ctx.getOnlineMyPlayer()) return;
    publishAction("endTurn2v2", actorPlayer, {});
  }

  function publishOnline2v2BattleEnd(winnerPlayer) {
    publishAction("battleEnd2v2", winnerPlayer, { winner: winnerPlayer });
  }

  function applyOnline2v2BattleSnapshot(snapshot) {
    if (!snapshot || snapshot.mode !== "online2v2") return;

    if (snapshot.teamA) ctx.setTeamA(cloneValue(snapshot.teamA));
    if (snapshot.teamB) ctx.setTeamB(cloneValue(snapshot.teamB));

    const nextTeamA = ctx.getTeam("A");
    const nextTeamB = ctx.getTeam("B");

    if (nextTeamA) {
      ctx.setPlayerAState(nextTeamA[nextTeamA.activeUnitKey || "unit1"] || nextTeamA.unit1 || null);
    }

    if (nextTeamB) {
      ctx.setPlayerBState(nextTeamB[nextTeamB.activeUnitKey || "unit1"] || nextTeamB.unit1 || null);
    }

    ctx.setCurrentTurn(Number(snapshot.currentTurn || 1));
    ctx.setCurrentPlayer(snapshot.currentPlayer === "B" ? "B" : "A");
    ctx.setCurrentAttack(Array.isArray(snapshot.currentAttack) ? cloneValue(snapshot.currentAttack) : []);
    ctx.setCurrentAttackContext(cloneValue(snapshot.currentAttackContext));
    ctx.setCurrentAttackContexts(Array.isArray(snapshot.currentAttackContexts) ? cloneValue(snapshot.currentAttackContexts) : []);
    ctx.setBattleNotice(snapshot.battleNotice || "");
    ctx.setCurrentActionHeader(snapshot.currentActionHeader || "");
    ctx.setCurrentActionLabel(snapshot.currentActionLabel || "");

    ctx.redrawBattleBoards();

    if (Array.isArray(snapshot.currentAttack) && snapshot.currentAttack.length > 0) {
      ctx.renderAttackChoices();
    }
  }

  function applyOnline2v2Action(action, battleSnapshot = null) {
    if (!ctx.isOnlineEnabled() || !action) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (typeof action.actionId !== "number") return;
    if (action.actionId <= ctx.getLastAppliedActionId()) return;

    ctx.setLastAppliedActionId(action.actionId);
    ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));

    if (action.actor === ctx.getOnlineMyPlayer()) return;

    ctx.setApplyingRemote(true);

    try {
      if (battleSnapshot) {
        applyOnline2v2BattleSnapshot(battleSnapshot);
        return;
      }

      if (action.type === "battleEnd2v2") {
        const winner = action.payload?.winner;
        if (winner) ctx.finishBattle(winner);
      }
    } finally {
      ctx.setApplyingRemote(false);
    }
  }

  return {
    buildOnline2v2BattleSnapshot,
    applyOnline2v2BattleSnapshot,
    publishOnline2v2SlotAction,
    publishOnline2v2QteAction,
    publishOnline2v2EndTurnAction,
    publishOnline2v2BattleEnd,
    applyOnline2v2Action
  };
}
