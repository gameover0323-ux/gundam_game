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

  function publishOnline2v2SlotAction(ownerPlayer, slotMode = "team", unitKey = null) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdateWithSnapshot({
      actionId,
      actor: ownerPlayer,
      type: "slot2v2",
      payload: {
        slotMode,
        unitKey
      },
      createdAt: Date.now()
    }));
  }

  function publishOnline2v2QteAction(kind, index) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ctx.getBattleMode() !== "online2v2") return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdateWithSnapshot({
      actionId,
      actor: ctx.getOnlineMyPlayer(),
      type: "qte2v2",
      payload: {
        kind,
        index
      },
      createdAt: Date.now()
    }));
  }

  function publishOnline2v2EndTurnAction(actorPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (actorPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdateWithSnapshot({
      actionId,
      actor: actorPlayer,
      type: "endTurn2v2",
      payload: {},
      createdAt: Date.now()
    }));
  }

  function publishOnline2v2BattleEnd(winnerPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ctx.getBattleMode() !== "online2v2") return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdateWithSnapshot({
      actionId,
      actor: winnerPlayer,
      type: "battleEnd2v2",
      payload: {
        winner: winnerPlayer
      },
      createdAt: Date.now()
    }));
  }

  function applyOnline2v2BattleSnapshot(snapshot) {
    if (!snapshot || snapshot.mode !== "online2v2") return;

    if (snapshot.teamA) ctx.setTeamA(cloneValue(snapshot.teamA));
    if (snapshot.teamB) ctx.setTeamB(cloneValue(snapshot.teamB));

    const nextTeamA = ctx.getTeam("A");
    const nextTeamB = ctx.getTeam("B");

    if (nextTeamA) {
      ctx.setPlayerAState(nextTeamA[nextTeamA.activeUnitKey || "unit1"] || nextTeamA.unit1);
    }

    if (nextTeamB) {
      ctx.setPlayerBState(nextTeamB[nextTeamB.activeUnitKey || "unit1"] || nextTeamB.unit1);
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
    ctx.renderAttackChoices();
  }

  function applyOnline2v2Action(action) {
    if (!ctx.isOnlineEnabled() || !action) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (typeof action.actionId !== "number") return;
    if (action.actionId <= ctx.getLastAppliedActionId()) return;

    ctx.setLastAppliedActionId(action.actionId);
    ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));

    if (action.actor === ctx.getOnlineMyPlayer()) return;

    ctx.setApplyingRemote(true);

    try {
      if (action.type === "slot2v2") {
        const slotMode = action.payload?.slotMode || "team";
        const unitKey = action.payload?.unitKey || null;

        if (slotMode === "unit1" || unitKey === "unit1") {
          ctx.executeSingleTeamSlotRaw("unit1");
          return;
        }

        if (slotMode === "unit2" || unitKey === "unit2") {
          ctx.executeSingleTeamSlotRaw("unit2");
          return;
        }

        ctx.executeTeamSlotRaw();
        return;
      }

      if (action.type === "qte2v2") {
        const kind = action.payload?.kind;
        const index = action.payload?.index;

        if (kind === "hit") {
          ctx.takeHitRaw(index);
          ctx.checkBattleEnd();
        } else if (kind === "evade") {
          ctx.evadeAttackRaw(index);
        } else if (kind === "supportDefense") {
          ctx.supportDefenseAttackRaw(index);
          ctx.checkBattleEnd();
        }

        return;
      }

      if (action.type === "endTurn2v2") {
        ctx.endTurnRaw();
        return;
      }

      if (action.type === "battleEnd2v2") {
        const winner = action.payload?.winner;
        if (!winner) return;
        ctx.finishBattle(winner);
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
