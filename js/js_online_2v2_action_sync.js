export function createOnline2v2ActionSync(ctx) {
  const appliedActionKeys = new Set();

  function getActionKey(action) {
    if (!action) return "";
    if (action.actionKey) return String(action.actionKey);
    return `${action.actor || "unknown"}:${action.actionId ?? "noid"}:${action.createdAt ?? 0}`;
  }

  function canPublish(actor) {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (ctx.getBattleMode() !== "online2v2") return false;
    if (!ctx.getOnlineRoomId()) return false;
    if (actor && actor !== ctx.getOnlineMyPlayer()) return false;
    return true;
  }

  function publishAction(type, actor, payload = {}) {
    if (!canPublish(actor)) return;

    const nextSeq = Number(ctx.getOnlineActionSeq?.() || 0) + 1;
    if (typeof ctx.setOnlineActionSeq === "function") {
      ctx.setOnlineActionSeq(nextSeq);
    }

    const now = Date.now();
    const action = {
      actionId: nextSeq,
      actionSeq: nextSeq,
      actionKey: `${actor}:${nextSeq}:${now}:${Math.random()}`,
      actor,
      type,
      payload,
      createdAt: now
    };

    appliedActionKeys.add(action.actionKey);

    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action,
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnline2v2SnapshotAction(type, actor, payload = {}) {
    publishAction(type, actor, payload);
  }

  function publishOnline2v2SlotAction(ownerPlayer, slotMode = "team", unitKey = null, slotKeys = null) {
    publishAction("slot2v2", ownerPlayer, {
      slotMode,
      unitKey,
      slotKeys: slotKeys || null
    });
  }

  function publishOnline2v2SpecialAction(ownerPlayer, specialKey) {
    publishAction("special2v2", ownerPlayer, { specialKey });
  }

  function publishOnline2v2ChoiceAction(choice, selectedValue) {
    const actor = choice?.ownerPlayer || ctx.getOnlineMyPlayer();

    publishAction("choice2v2", actor, {
      source: choice?.source || null,
      choiceType: choice?.choiceType || null,
      selectedValue
    });
  }

  function publishOnline2v2QteAction(kind, index) {
    publishAction("qte2v2", ctx.getOnlineMyPlayer(), { kind, index });
  }

  function publishOnline2v2CriticalBoostAction(ownerPlayer, unitKey = null) {
    publishAction("criticalBoost2v2", ownerPlayer, { unitKey });
  }

  function publishOnline2v2EndTurnAction(actorPlayer) {
    publishAction("endTurn2v2", actorPlayer, {});
  }

  function publishOnline2v2BattleEnd(winnerPlayer) {
    publishAction("battleEnd2v2", winnerPlayer, { winner: winnerPlayer });
  }

  function getCriticalTarget(action) {
    const team = ctx.getTeam(action.actor);
    const unitKey = action.payload?.unitKey;

    if (team && unitKey && team[unitKey]) {
      return team[unitKey];
    }

    return ctx.getPlayerState(action.actor);
  }

  function applyOnline2v2Action(action) {
    if (!ctx.isOnlineEnabled() || !action) return;
    if (ctx.getBattleMode() !== "online2v2") return;

    const actionKey = getActionKey(action);
    if (!actionKey || appliedActionKeys.has(actionKey)) return;

    appliedActionKeys.add(actionKey);

    if (action.actor === ctx.getOnlineMyPlayer()) return;

    ctx.setApplyingRemote(true);

    try {
      if (action.type === "criticalBoost2v2") {
        const actor = getCriticalTarget(action);
        if (!actor) return;

        ctx.spendEvadeForCritical(actor);
        ctx.redrawBattleBoards();
        return;
      }

      if (action.type === "slot2v2") {
        const slotMode = action.payload?.slotMode || "team";
        const unitKey = action.payload?.unitKey || null;
        const slotKeys = action.payload?.slotKeys || {};

        if (slotMode === "team") {
          ctx.executeTeamSlotRaw(slotKeys, { suppressOnlinePublish: true });
          return;
        }

        ctx.executeSingleTeamSlotRaw(unitKey || slotMode, slotKeys, {
          suppressOnlinePublish: true
        });
        return;
      }

      if (action.type === "special2v2") {
        const specialKey = action.payload?.specialKey;
        if (!specialKey) return;

        ctx.executeSpecialRaw(action.actor, specialKey);
        return;
      }

      if (action.type === "choice2v2") {
        ctx.resolvePendingChoiceRaw(action.payload?.selectedValue);
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
        if (winner) ctx.finishBattle(winner);
      }
    } finally {
      ctx.setApplyingRemote(false);
    }
  }

  return {
    publishOnline2v2SnapshotAction,
    publishOnline2v2SlotAction,
    publishOnline2v2SpecialAction,
    publishOnline2v2ChoiceAction,
    publishOnline2v2QteAction,
    publishOnline2v2CriticalBoostAction,
    publishOnline2v2EndTurnAction,
    publishOnline2v2BattleEnd,
    applyOnline2v2Action
  };
}
