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

  function publishAction(type, actor, payload = {}) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (actor && actor !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate({
      actionId,
      actor,
      type,
      payload,
      createdAt: Date.now()
    }));
  }

  function publishOnlineCriticalBoostAction(ownerPlayer) {
    publishAction("criticalBoost", ownerPlayer, {});
  }

  function publishOnlineChoiceAction(choice, selectedValue) {
    if (!choice) return;

    publishAction("choice", choice.ownerPlayer, {
      source: choice.source || null,
      choiceType: choice.choiceType || null,
      selectedValue
    });
  }

  function publishOnlineSpecialAction(ownerPlayer, specialKey) {
    publishAction("special", ownerPlayer, { specialKey });
  }

  function publishOnlineQteAction(kind, index) {
    publishAction("qteResolved", ctx.getOnlineMyPlayer(), { kind, index });
  }

  function publishOnlineEndTurnAction(actorPlayer) {
    publishAction("endTurn", actorPlayer, {});
  }

  function publishOnlineSlotAction(ownerPlayer, slotKey) {
    publishAction("slot", ownerPlayer, { slotKey });
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
        if (winner) ctx.finishBattle(winner);
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
