export function createTurnActionController(ctx) {
  function canOperateOnlinePlayer() {
    if (!ctx.isOnlineEnabled()) return true;

    if (ctx.isOnlineSpectator && ctx.isOnlineSpectator()) {
      return false;
    }

    return ctx.getCurrentPlayer() === ctx.getOnlineMyPlayer();
  }

  function executeSlot() {
    if (!canOperateOnlinePlayer()) {
      ctx.showPopup("相手のターンです");
      return;
    }

    return ctx.executeSlotRaw();
  }

  function simulateSlot() {
    return ctx.simulateSlotRaw();
  }

  function endTurn() {
    if (!canOperateOnlinePlayer()) {
      ctx.showPopup("相手のターンです");
      return;
    }

    const beforePlayer = ctx.getCurrentPlayer();

    const result = ctx.endTurnRaw();

    if (ctx.isOnlineEnabled() && beforePlayer !== ctx.getCurrentPlayer()) {
      ctx.publishOnlineEndTurnAction(beforePlayer);
    }

    return result;
  }

  return {
    canOperateOnlinePlayer,
    executeSlot,
    simulateSlot,
    endTurn
  };
}
