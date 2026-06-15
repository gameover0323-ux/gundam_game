export function createTurnActionController(ctx) {
  function canOperateOnlinePlayer() {
    if (!ctx.isOnlineEnabled()) return true;

    if (ctx.isOnlineSpectator && ctx.isOnlineSpectator()) {
      return false;
    }

    return ctx.getCurrentPlayer() === ctx.getOnlineMyPlayer();
  }

  function isCpuTurn() {
    return (
      (ctx.getBattleMode && (ctx.getBattleMode() === "vscpu1v1" || ctx.getBattleMode() === "vscpu2v2")) &&
      ctx.getCurrentPlayer &&
      ctx.getCurrentPlayer() === "B"
    );
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

    if (
      isCpuTurn() &&
      ctx.hasCpuRemainingAction &&
      ctx.hasCpuRemainingAction("B")
    ) {
      ctx.showPopup("CPUの行動権が残っています。CPU行動を実行してください。");
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
