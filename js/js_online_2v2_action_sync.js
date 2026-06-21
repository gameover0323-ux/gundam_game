import { getCriticalRate } from "./js_unit_runtime.js";

export function createOnline2v2ActionSync(ctx) {
  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function getOnline2v2AttackOwnerState(index) {
    const contexts = typeof ctx.getCurrentAttackContexts === "function"
      ? ctx.getCurrentAttackContexts()
      : [];

    const context = Array.isArray(contexts) && contexts[index]
      ? contexts[index]
      : typeof ctx.getCurrentAttackContext === "function"
        ? ctx.getCurrentAttackContext()
        : null;

    const ownerPlayer = context?.ownerPlayer || ctx.getCurrentPlayer();

    if (context?.ownerUnitKey && typeof ctx.getTeam === "function") {
      const team = ctx.getTeam(ownerPlayer);
      if (team && team[context.ownerUnitKey]) {
        return team[context.ownerUnitKey];
      }
    }

    if (typeof ctx.getPlayerState === "function") {
      return ctx.getPlayerState(ownerPlayer);
    }

    return null;
  }

  function buildOnline2v2CriticalPayload(index) {
    const attacks = ctx.getCurrentAttack();
    const attack = Array.isArray(attacks) ? attacks[index] : null;

    if (!attack) return null;

    if (attack.criticalFixed === true) {
      return {
        index,
        criticalFixed: true,
        criticalHit: attack.criticalHit === true,
        criticalRate: Number(attack.criticalRate || 0)
      };
    }

    const attacker = getOnline2v2AttackOwnerState(index);
    const rate = getCriticalRate(attacker);
    const hit = Math.random() * 100 < rate;

    attack.criticalFixed = true;
    attack.criticalHit = hit;
    attack.criticalRate = rate;

    return {
      index,
      criticalFixed: true,
      criticalHit: hit,
      criticalRate: rate
    };
  }

  function applyOnline2v2CriticalPayload(payload) {
    if (!payload || payload.criticalFixed !== true) return;

    const attacks = ctx.getCurrentAttack();
    if (!Array.isArray(attacks)) return;

    const index = Number(payload.index);
    if (!Number.isInteger(index)) return;

    const attack = attacks[index];
    if (!attack) return;

    attack.criticalFixed = true;
    attack.criticalHit = payload.criticalHit === true;
    attack.criticalRate = Number(payload.criticalRate || 0);
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

  function buildRoomUpdateWithSnapshot(action) {
    return {
      action,
      battleSnapshot: buildOnline2v2BattleSnapshot(),
      "meta/updatedAt": Date.now()
    };
  }

  function buildRoomUpdateWithoutSnapshot(action) {
    return {
      action,
      "meta/updatedAt": Date.now()
    };
  }

  function canPublish(actor) {
    if (!ctx.isOnlineEnabled()) return false;
    if (ctx.isApplyingRemote()) return false;
    if (ctx.getBattleMode() !== "online2v2") return false;
    if (!ctx.getOnlineRoomId()) return false;
    if (actor && actor !== ctx.getOnlineMyPlayer()) return false;
    return true;
  }

  function publishAction(type, actor, payload = {}, options = {}) {
    if (!canPublish(actor)) return;

    const actionId = ctx.nextOnlineActionSeq();

    const action = {
      actionId,
      actor,
      type,
      payload,
      createdAt: Date.now()
    };

    const update = options.withoutSnapshot === true
      ? buildRoomUpdateWithoutSnapshot(action)
      : buildRoomUpdateWithSnapshot(action);

    ctx.updateRoom(ctx.getOnlineRoomId(), update);
  }

  function publishOnline2v2SnapshotAction(type, actor, payload = {}) {
    publishAction(type, actor, payload);
  }

  if (ctx && typeof ctx === "object") {
    ctx.publishOnline2v2SnapshotAction = publishOnline2v2SnapshotAction;
  }

  function publishOnline2v2SlotAction(ownerPlayer, slotMode = "team", unitKey = null) {
    publishAction("slot2v2", ownerPlayer, { slotMode, unitKey });
  }

  function publishOnline2v2SpecialAction(ownerPlayer, specialKey) {
    publishAction("special2v2", ownerPlayer, { specialKey });
  }

  function publishOnline2v2ChoiceAction(choice, selectedValue) {
    const actor = choice?.ownerPlayer || ctx.getOnlineMyPlayer();

    queueMicrotask(() => {
      publishAction("choice2v2", actor, {
        source: choice?.source || null,
        choiceType: choice?.choiceType || null,
        selectedValue
      });
    });
  }

  function publishOnline2v2QteAction(kind, index) {
    const critical = kind === "hit"
      ? buildOnline2v2CriticalPayload(index)
      : null;

    publishAction(
      "qte2v2",
      ctx.getOnlineMyPlayer(),
      { kind, index, critical },
      { withoutSnapshot: true }
    );
  }

  function publishOnline2v2CriticalBoostAction(ownerPlayer) {
    publishAction("criticalBoost2v2", ownerPlayer, {});
  }

  function publishOnline2v2EndTurnAction(actorPlayer) {
    publishAction("endTurn2v2", actorPlayer, {});
  }

  function publishOnline2v2BattleEnd(winnerPlayer) {
    publishAction("battleEnd2v2", winnerPlayer, { winner: winnerPlayer });
  }

  function applyOnline2v2BattleSnapshot(snapshot) {
    if (!snapshot || snapshot.mode !== "online2v2") return;

    if (snapshot.teamA) ctx.setTeamA(cloneValue(snapshot.teamA));
    if (snapshot.teamB) ctx.setTeamB(cloneValue(snapshot.teamB));

    const nextTeamA = ctx.getTeam("A");
    const nextTeamB = ctx.getTeam("B");

    if (nextTeamA) {
      ctx.setPlayerAState(nextTeamA[nextTeamA.activeUnitKey || "unit1"] || nextTeamA.unit1 || null);
    }

    if (nextTeamB) {
      ctx.setPlayerBState(nextTeamB[nextTeamB.activeUnitKey || "unit1"] || nextTeamB.unit1 || null);
    }

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

  function applyOnline2v2Action(action, battleSnapshot = null) {
    if (!ctx.isOnlineEnabled() || !action) return;
    if (ctx.getBattleMode() !== "online2v2") return;
    if (typeof action.actionId !== "number") return;
    if (action.actionId <= ctx.getLastAppliedActionId()) return;

    ctx.setLastAppliedActionId(action.actionId);
    ctx.setOnlineActionSeq(Math.max(ctx.getOnlineActionSeq(), action.actionId));

    if (action.actor === ctx.getOnlineMyPlayer()) return;

    ctx.setApplyingRemote(true);

    try {
      if (battleSnapshot) {
        applyOnline2v2BattleSnapshot(battleSnapshot);
        return;
      }

      if (action.type === "qte2v2") {
        const kind = action.payload?.kind;
        const index = action.payload?.index;

        if (kind === "hit") {
          applyOnline2v2CriticalPayload(action.payload?.critical);
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
