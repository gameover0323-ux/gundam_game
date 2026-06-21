export function createOnlineActionSync(ctx) {
  function buildRoomUpdate(action) {
    return {
      action,
      battleSnapshot:
        typeof ctx.buildOnlineBattleSnapshot === "function"
          ? ctx.buildOnlineBattleSnapshot()
          : null,
      "meta/updatedAt": Date.now()
    };
  }

  function publishOnlineCriticalBoostAction(ownerPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: ownerPlayer,
      type: "criticalBoost",
      payload: {},
      createdAt: Date.now()
    }));
  }

  function publishOnlineChoiceAction(choice, selectedValue) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (!choice) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: choice.ownerPlayer,
      type: "choice",
      payload: {
        source: choice.source || null,
        choiceType: choice.choiceType || null,
        selectedValue
      },
      createdAt: Date.now()
    }));
  }

  function publishOnlineSpecialAction(ownerPlayer, specialKey) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: ownerPlayer,
      type: "special",
      payload: { specialKey },
      createdAt: Date.now()
    }));
  }

  function publishOnlineQteAction(kind, index) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: ctx.getOnlineMyPlayer(),
      type: "qteResolved",
      payload: { kind, index },
      createdAt: Date.now()
    }));
  }

  function publishOnlineEndTurnAction(actorPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (actorPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: actorPlayer,
      type: "endTurn",
      payload: {},
      createdAt: Date.now()
    }));
  }

  function publishOnlineSlotAction(ownerPlayer, slotKey) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: ownerPlayer,
      type: "slot",
      payload: { slotKey },
      createdAt: Date.now()
    }));
  }

  function publishOnlineBattleEnd(winnerPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor: winnerPlayer,
      type: "battleEnd",
      payload: { winner: winnerPlayer },
      createdAt: Date.now()
    }));
  }

  function applyOnlineAction(action, battleSnapshot = null) {
    if (!ctx.isOnlineEnabled() || !action) return;
    if (typeof action.actionId !== "number") return;
    if (action.actionId <= ctx.getLastAppliedActionId()) return;

    ctx.setLastAppliedActionId(action.actionId);
    ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));

    if (action.actor === ctx.getOnlineMyPlayer()) return;

    ctx.setApplyingRemote(true);

    try {
      if (battleSnapshot && typeof ctx.applyOnlineBattleSnapshot === "function") {
        ctx.applyOnlineBattleSnapshot(battleSnapshot);
        return;
      }

      if (action.type === "battleEnd") {
        const winner = action.payload?.winner;
        if (!winner) return;
        ctx.finishBattle(winner);
      }
    } finally {
      ctx.setApplyingRemote(false);
    }
  }

  return {
    publishOnlineCriticalBoostAction,
    publishOnlineChoiceAction,
    publishOnlineSpecialAction,
    publishOnlineQteAction,
    publishOnlineEndTurnAction,
    publishOnlineSlotAction,
    publishOnlineBattleEnd,
    applyOnlineAction
  };
}
