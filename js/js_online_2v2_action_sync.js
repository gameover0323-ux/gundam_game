export function createOnline2v2ActionSync(ctx) {
  const appliedActionKeys = new Set();

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function getActionKey(action) {
    if (!action) return "";
    if (action.actionKey) return String(action.actionKey);
    return `${action.actor || "unknown"}:${action.actionId ?? "noid"}:${action.createdAt ?? 0}`;
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
      pendingChoice: typeof ctx.getPendingChoice === "function" ? cloneValue(ctx.getPendingChoice()) : null,
      updatedAt: Date.now()
    };
  }

  function buildRoomUpdate(action, withSnapshot = false) {
    const update = {
      action,
      "meta/updatedAt": Date.now()
    };

    if (withSnapshot) {
      update.battleSnapshot = buildOnline2v2BattleSnapshot();
    }

    return update;
  }

  function canPublish(actor) {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (ctx.getBattleMode() !== "online2v2") return false;
    if (!ctx.getOnlineRoomId()) return false;
    if (actor && actor !== ctx.getOnlineMyPlayer()) return false;
    return true;
  }

  function publishAction(type, actor, payload = {}, withSnapshot = false) {
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
    ctx.updateRoom(ctx.getOnlineRoomId(), buildRoomUpdate(action, withSnapshot));
  }

  function publishOnline2v2SnapshotAction(type, actor, payload = {}) {
    publishAction(type, actor, payload, true);
  }

  function publishOnline2v2SlotAction(ownerPlayer, slotMode = "team", unitKey = null) {
    publishAction("slot2v2", ownerPlayer, { slotMode, unitKey }, true);
  }

  function publishOnline2v2SpecialAction(ownerPlayer, specialKey) {
    publishAction("special2v2", ownerPlayer, { specialKey }, false);
  }

  function publishOnline2v2ChoiceAction(choice, selectedValue) {
    const actor = choice?.ownerPlayer || ctx.getOnlineMyPlayer();
    publishAction("choice2v2", actor, {
      source: choice?.source || null,
      choiceType: choice?.choiceType || null,
      selectedValue
    }, false);
  }

  function publishOnline2v2QteAction(kind, index) {
    publishAction("qte2v2", ctx.getOnlineMyPlayer(), { kind, index }, false);
  }

  function publishOnline2v2CriticalBoostAction(ownerPlayer, unitKey = null) {
    publishAction("criticalBoost2v2", ownerPlayer, { unitKey }, false);
  }

  function publishOnline2v2EndTurnAction(actorPlayer) {
    publishAction("endTurn2v2", actorPlayer, {}, false);
  }

  function publishOnline2v2BattleEnd(winnerPlayer) {
    publishAction("battleEnd2v2", winnerPlayer, { winner: winnerPlayer }, false);
  }

  function applyOnline2v2BattleSnapshot(snapshot) {
    if (!snapshot || snapshot.mode !== "online2v2") return;

    if (snapshot.teamA) ctx.setTeamA(cloneValue(snapshot.teamA));
    if (snapshot.teamB) ctx.setTeamB(cloneValue(snapshot.teamB));

    const nextTeamA = ctx.getTeam("A");
    const nextTeamB = ctx.getTeam("B");

    if (nextTeamA) ctx.setPlayerAState(nextTeamA[nextTeamA.activeUnitKey || "unit1"] || nextTeamA.unit1 || null);
    if (nextTeamB) ctx.setPlayerBState(nextTeamB[nextTeamB.activeUnitKey || "unit1"] || nextTeamB.unit1 || null);

    ctx.setCurrentTurn(Number(snapshot.currentTurn || 1));
    ctx.setCurrentPlayer(snapshot.currentPlayer === "B" ? "B" : "A");
    ctx.setCurrentAttack(Array.isArray(snapshot.currentAttack) ? cloneValue(snapshot.currentAttack) : []);
    ctx.setCurrentAttackContext(cloneValue(snapshot.currentAttackContext));
    ctx.setCurrentAttackContexts(Array.isArray(snapshot.currentAttackContexts) ? cloneValue(snapshot.currentAttackContexts) : []);
    ctx.setBattleNotice(snapshot.battleNotice || "");
    ctx.setCurrentActionHeader(snapshot.currentActionHeader || "");
    ctx.setCurrentActionLabel(snapshot.currentActionLabel || "");

    if (typeof ctx.setPendingChoice === "function") {
      ctx.setPendingChoice(cloneValue(snapshot.pendingChoice));
    }

    ctx.redrawBattleBoards();

    if (Array.isArray(snapshot.currentAttack) && snapshot.currentAttack.length > 0) {
      ctx.renderAttackChoices();
      return;
    }

    if (snapshot.pendingChoice && typeof ctx.renderPendingChoice === "function") {
      ctx.renderPendingChoice();
    }
  }

  function getCriticalTarget(action) {
    const team = ctx.getTeam(action.actor);
    const unitKey = action.payload?.unitKey;
    if (team && unitKey && team[unitKey]) return team[unitKey];
    return ctx.getPlayerState(action.actor);
  }

  function applyOnline2v2Action(action, battleSnapshot = null) {
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
        if (battleSnapshot) {
          applyOnline2v2BattleSnapshot(battleSnapshot);
        }
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
    buildOnline2v2BattleSnapshot,
    applyOnline2v2BattleSnapshot,
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
