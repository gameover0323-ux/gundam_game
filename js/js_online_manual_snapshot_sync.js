export function createOnlineManualSnapshotSync(ctx) {
  const appliedActionKeys = new Set();

  function isTargetAction(action) {
    return action?.type === "manualSnapshot" || action?.type === "manualSnapshot2v2";
  }

  function getActionType() {
    return ctx.getBattleMode() === "online2v2"
      ? "manualSnapshot2v2"
      : "manualSnapshot";
  }

  function getActionKey(action) {
    if (!action) return "";
    return `${action.type || "unknown"}:${action.actor || "unknown"}:${action.actionId ?? "noid"}:${action.createdAt ?? 0}`;
  }

  function rememberApplied(action) {
    const key = getActionKey(action);
    if (!key) return false;
    if (appliedActionKeys.has(key)) return false;
    appliedActionKeys.add(key);
    return true;
  }

  async function publishOnlineManualSnapshot() {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (!ctx.getOnlineRoomId()) return false;

    const snapshot = ctx.buildOnlineBattleSnapshot?.();
    if (!snapshot) return false;

    const actionId = ctx.nextOnlineActionSeq();
    const createdAt = Date.now();

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ctx.getOnlineMyPlayer(),
        type: getActionType(),
        payload: {},
        createdAt
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

    if (!rememberApplied(action)) {
      return true;
    }

    if (!battleSnapshot) return true;

    if (typeof action.actionId === "number" && typeof ctx.setOnlineActionSeq === "function") {
      ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));
    }

    if (action.actor === ctx.getOnlineMyPlayer()) {
      return true;
    }

    ctx.setApplyingRemote(true);

    try {
      ctx.applyOnlineBattleSnapshot(battleSnapshot);

      if (Array.isArray(battleSnapshot.currentAttack) && battleSnapshot.currentAttack.length > 0) {
        ctx.renderAttackChoices();
      } else if (battleSnapshot.pendingChoice && typeof ctx.renderPendingChoice === "function") {
        ctx.renderPendingChoice();
      } else if (typeof ctx.renderAttackLogText === "function") {
        ctx.renderAttackLogText(battleSnapshot.battleNotice || "同期しました");
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
