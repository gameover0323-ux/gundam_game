export function createOnlineManualSnapshotSync(ctx) {
  function isTargetAction(action) {
    return action?.type === "manualSnapshot" || action?.type === "manualSnapshot2v2";
  }

  function getActionType() {
    return ctx.getBattleMode() === "online2v2"
      ? "manualSnapshot2v2"
      : "manualSnapshot";
  }

  async function publishOnlineManualSnapshot() {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (!ctx.getOnlineRoomId()) return false;

    const snapshot = ctx.buildOnlineBattleSnapshot?.();
    if (!snapshot) return false;

    const actionId = ctx.nextOnlineActionSeq();

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ctx.getOnlineMyPlayer(),
        type: getActionType(),
        payload: {},
        createdAt: Date.now()
      },
      battleSnapshot: {
        ...snapshot,
        manualSync: true,
        updatedAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });

    return true;
  }

  function applyOnlineManualSnapshotAction(action, battleSnapshot = null) {
  if (!ctx.isOnlineEnabled() || !action) return false;
  if (!isTargetAction(action)) return false;
  if (!battleSnapshot) return true;

  if (action.actor === ctx.getOnlineMyPlayer()) {
    return true;
  }


    ctx.setApplyingRemote(true);

    try {
      ctx.applyOnlineBattleSnapshot(battleSnapshot);

      if (Array.isArray(battleSnapshot?.currentAttack) && battleSnapshot.currentAttack.length > 0) {
        ctx.renderAttackChoices();
      } else if (battleSnapshot?.pendingChoice && typeof ctx.renderPendingChoice === "function") {
        ctx.renderPendingChoice();
      } else if (typeof ctx.renderAttackLogText === "function") {
        ctx.renderAttackLogText(battleSnapshot?.battleNotice || "同期しました");
      }

      ctx.redrawBattleBoards();
    } finally {
      ctx.setApplyingRemote(false);
    }

    return true;
  }

  return {
    publishOnlineManualSnapshot,
    applyOnlineManualSnapshotAction
  };
}
