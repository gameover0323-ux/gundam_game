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

  function collectCriticalResults() {
    const attacks = typeof ctx.getCurrentAttack === "function"
      ? ctx.getCurrentAttack()
      : [];

    if (!Array.isArray(attacks)) return [];

    return attacks.map((attack) => ({
      criticalHit: attack?.criticalHit === true,
      criticalFixed: attack?.criticalFixed === true,
      criticalRate: Number(attack?.criticalRate || 0)
    }));
  }

  function applyCriticalResults(criticalResults) {
    if (!Array.isArray(criticalResults) || criticalResults.length === 0) return;

    const attacks = typeof ctx.getCurrentAttack === "function"
      ? ctx.getCurrentAttack()
      : [];

    if (!Array.isArray(attacks) || attacks.length === 0) return;

    attacks.forEach((attack, index) => {
      const result = criticalResults[index];
      if (!attack || !result) return;

      attack.criticalHit = result.criticalHit === true;
      attack.criticalFixed = result.criticalFixed === true;
      attack.criticalRate = Number(result.criticalRate || 0);
    });

    if (typeof ctx.setCurrentAttack === "function") {
      ctx.setCurrentAttack(attacks);
    }

    ctx.redrawBattleBoards();
    if (typeof ctx.renderAttackChoices === "function") {
      ctx.renderAttackChoices();
    }
  }

  function publishAction(type, actor, payload = {}) {
    if (!canPublish(actor)) return;

    const nextSeq = Number(ctx.getOnlineActionSeq?.() || 0) + 1;
    if (typeof ctx.setOnlineActionSeq === "function") ctx.setOnlineActionSeq(nextSeq);

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
      slotKeys: slotKeys || null,
      criticalResults: collectCriticalResults()
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

  function publishOnline2v2TeamModeAction(ownerPlayer) {
    publishAction("teamMode2v2", ownerPlayer, {});
  }

  function publishOnline2v2ActiveUnitAction(ownerPlayer, unitKey) {
    publishAction("activeUnit2v2", ownerPlayer, { unitKey });
  }

  function publishOnline2v2FocusUnitAction(ownerPlayer, unitKey) {
    publishAction("focusUnit2v2", ownerPlayer, { unitKey });
  }

  function publishOnline2v2TauntAction(ownerPlayer, targetUnitKey) {
    publishAction("taunt2v2", ownerPlayer, { targetUnitKey });
  }

  function publishOnline2v2DuelAction(ownerPlayer, ownUnitKey) {
    publishAction("duel2v2", ownerPlayer, { ownUnitKey });
  }

  function publishOnline2v2BreakthroughStartAction(initiatorPlayer) {
    publishAction("breakthroughStart2v2", initiatorPlayer, { initiatorPlayer });
  }

  function publishOnline2v2BreakthroughBetAction(player, value) {
    publishAction("breakthroughBet2v2", player, { player, value });
  }

  function publishOnline2v2BreakthroughResultAction(result) {
    publishAction("breakthroughResult2v2", ctx.getOnlineMyPlayer(), { result });
  }

  function getCriticalTarget(action) {
    const team = ctx.getTeam(action.actor);
    const unitKey = action.payload?.unitKey;
    if (team && unitKey && team[unitKey]) return team[unitKey];
    return ctx.getPlayerState(action.actor);
  }

  function renderRemoteResult(result) {
    const message = result?.message || "";
    if (message && ctx.renderAttackLogText) ctx.renderAttackLogText(message);
    if (message && ctx.showPopup) ctx.showPopup(message);
    ctx.redrawBattleBoards();
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
        const criticalResults = action.payload?.criticalResults || [];

        if (slotMode === "team") {
          ctx.executeTeamSlotRaw(slotKeys, { suppressOnlinePublish: true });
          applyCriticalResults(criticalResults);
          return;
        }

        ctx.executeSingleTeamSlotRaw(unitKey || slotMode, slotKeys, {
          suppressOnlinePublish: true
        });
        applyCriticalResults(criticalResults);
        return;
      }

      if (action.type === "teamMode2v2") {
        ctx.toggleTeamModeRaw(action.actor);
        return;
      }

      if (action.type === "activeUnit2v2") {
        ctx.setActiveUnitRaw(action.actor, action.payload?.unitKey);
        return;
      }

      if (action.type === "focusUnit2v2") {
        ctx.setFocusUnitRaw(action.actor, action.payload?.unitKey);
        return;
      }

      if (action.type === "taunt2v2") {
        const result = ctx.startTauntRaw(action.actor, action.payload?.targetUnitKey);
        renderRemoteResult(result);
        return;
      }

      if (action.type === "duel2v2") {
        const result = ctx.startDuelRaw(action.actor, action.payload?.ownUnitKey);
        renderRemoteResult(result);
        return;
      }

      if (action.type === "breakthroughStart2v2") {
        ctx.renderBreakthroughBetChoiceRaw({
          initiatorPlayer: action.payload?.initiatorPlayer,
          suppressOnlinePublish: true
        });
        return;
      }

      if (action.type === "breakthroughBet2v2") {
        ctx.applyBreakthroughBetRaw(action.payload?.player, action.payload?.value);
        return;
      }

      if (action.type === "breakthroughResult2v2") {
        ctx.renderBreakthroughResultRaw(action.payload?.result);
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
    publishOnline2v2TeamModeAction,
    publishOnline2v2ActiveUnitAction,
    publishOnline2v2FocusUnitAction,
    publishOnline2v2TauntAction,
    publishOnline2v2DuelAction,
    publishOnline2v2BreakthroughStartAction,
    publishOnline2v2BreakthroughBetAction,
    publishOnline2v2BreakthroughResultAction,
    applyOnline2v2Action
  };
}
