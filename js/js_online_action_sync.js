export function createOnlineActionSync(ctx) {
  function stampCurrentAttackCritical(ownerPlayer) {
    const currentAttack = ctx.getCurrentAttack?.();
    if (!Array.isArray(currentAttack) || currentAttack.length === 0) return;

    const attacker = ctx.getPlayerState?.(ownerPlayer);
    if (!attacker) return;

    currentAttack.forEach(attack => {
      if (!attack || attack.criticalFixed === true) return;

      attack.criticalFixed = true;
      attack.criticalHit =
        typeof ctx.rollCritical === "function"
          ? ctx.rollCritical(attacker) === true
          : false;
    });
  }

  function buildStampedSnapshot(ownerPlayer) {
    stampCurrentAttackCritical(ownerPlayer);
    return typeof ctx.buildOnlineBattleSnapshot === "function"
      ? ctx.buildOnlineBattleSnapshot()
      : null;
  }

  function publishOnlineCriticalBoostAction(ownerPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ownerPlayer,
        type: "criticalBoost",
        payload: {},
        createdAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineChoiceAction(choice, selectedValue) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (!choice) return;

    const actionId = ctx.nextOnlineActionSeq();
    const snapshot = buildStampedSnapshot(choice.ownerPlayer);

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: choice.ownerPlayer,
        type: "choice",
        payload: {
          source: choice.source || null,
          choiceType: choice.choiceType || null,
          selectedValue
        },
        createdAt: Date.now()
      },
      battleSnapshot: snapshot,
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineSpecialAction(ownerPlayer, specialKey) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    const snapshot = buildStampedSnapshot(ownerPlayer);

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ownerPlayer,
        type: "special",
        payload: { specialKey },
        createdAt: Date.now()
      },
      battleSnapshot: snapshot,
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineQteAction(kind, index) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ctx.getOnlineMyPlayer(),
        type: "qte",
        payload: { kind, index },
        createdAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineEndTurnAction(actorPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (actorPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: actorPlayer,
        type: "endTurn",
        payload: {},
        createdAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineSlotAction(ownerPlayer, slotKey) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    const snapshot = buildStampedSnapshot(ownerPlayer);

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ownerPlayer,
        type: "slot",
        payload: { slotKey },
        createdAt: Date.now()
      },
      battleSnapshot: snapshot,
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineBattleEnd(winnerPlayer) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;

    const actionId = ctx.nextOnlineActionSeq();

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: winnerPlayer,
        type: "battleEnd",
        payload: { winner: winnerPlayer },
        createdAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });
  }

  function applySnapshotIfAvailable(battleSnapshot) {
    if (!battleSnapshot) return false;
    if (typeof ctx.applyOnlineBattleSnapshot !== "function") return false;

    ctx.applyOnlineBattleSnapshot(battleSnapshot);
    return true;
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
      if (action.type === "criticalBoost") {
        const actor = ctx.getPlayerState(action.actor);
        if (!actor) return;

        ctx.spendEvadeForCritical(actor);
        ctx.redrawBattleBoards();
        return;
      }

      if (
        action.type === "slot" ||
        action.type === "special" ||
        action.type === "choice"
      ) {
        if (applySnapshotIfAvailable(battleSnapshot)) return;
      }

      if (action.type === "slot") {
        const slotKey = action.payload?.slotKey;
        if (!slotKey) return;

        const actor = ctx.getPlayerState(action.actor);
        if (!actor) return;

        ctx.ensureActionState(actor);
        const started = ctx.startSlotAction(action.actor, slotKey);

        if (started) {
          ctx.consumeActionCount(actor, 1);
          ctx.redrawBattleBoards();
        }

        return;
      }

      if (action.type === "special") {
        const specialKey = action.payload?.specialKey;
        if (!specialKey) return;

        ctx.executeSpecialRaw(action.actor, specialKey);
        return;
      }

      if (action.type === "choice") {
        ctx.resolvePendingChoiceRaw(action.payload?.selectedValue);
        return;
      }

      if (action.type === "qte") {
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

      if (action.type === "battleEnd") {
        const winner = action.payload?.winner;
        if (!winner) return;

        ctx.finishBattle(winner);
        return;
      }

      if (action.type === "endTurn") {
        ctx.endTurnRaw();
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
