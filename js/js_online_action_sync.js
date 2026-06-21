import { getCriticalRate } from "./js_unit_runtime.js";

export function createOnlineActionSync(ctx) {
  function getOnlineAttackOwnerState(index) {
    const context = typeof ctx.getCurrentAttackContext === "function"
      ? ctx.getCurrentAttackContext()
      : null;

    const ownerPlayer = context?.ownerPlayer || ctx.getCurrentPlayer();

    if (typeof ctx.getPlayerState === "function") {
      return ctx.getPlayerState(ownerPlayer);
    }

    return null;
  }

  function buildOnlineCriticalPayload(index) {
    const attacks = typeof ctx.getCurrentAttack === "function"
      ? ctx.getCurrentAttack()
      : [];

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

    const attacker = getOnlineAttackOwnerState(index);
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

  function applyOnlineCriticalPayload(payload) {
    if (!payload || payload.criticalFixed !== true) return;

    const attacks = typeof ctx.getCurrentAttack === "function"
      ? ctx.getCurrentAttack()
      : [];

    if (!Array.isArray(attacks)) return;

    const index = Number(payload.index);
    if (!Number.isInteger(index)) return;

    const attack = attacks[index];
    if (!attack) return;

    attack.criticalFixed = true;
    attack.criticalHit = payload.criticalHit === true;
    attack.criticalRate = Number(payload.criticalRate || 0);
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
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineSpecialAction(ownerPlayer, specialKey) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;
    if (ownerPlayer !== ctx.getOnlineMyPlayer()) return;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ownerPlayer,
        type: "special",
        payload: { specialKey },
        createdAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });
  }

  function publishOnlineQteAction(kind, index) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.isApplyingRemote()) return;

    const critical =
      kind === "hit" || kind === "supportDefense"
        ? buildOnlineCriticalPayload(index)
        : null;

    const actionId = ctx.nextOnlineActionSeq();
    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ctx.getOnlineMyPlayer(),
        type: "qte",
        payload: { kind, index, critical },
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
    ctx.updateRoom(ctx.getOnlineRoomId(), {
      action: {
        actionId,
        actor: ownerPlayer,
        type: "slot",
        payload: { slotKey },
        createdAt: Date.now()
      },
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

  function applyOnlineAction(action) {
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
          applyOnlineCriticalPayload(action.payload?.critical);
          ctx.takeHitRaw(index);
          ctx.checkBattleEnd();
        } else if (kind === "evade") {
          ctx.evadeAttackRaw(index);
        } else if (kind === "supportDefense") {
          applyOnlineCriticalPayload(action.payload?.critical);
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
