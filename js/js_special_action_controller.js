export function createSpecialActionController(ctx) {
  function getActorUnitKey(playerKey, actor) {
    const team = ctx.getTeam?.(playerKey);
    if (!team || !actor) return null;
    if (team.unit1 === actor) return "unit1";
    if (team.unit2 === actor) return "unit2";
    return null;
  }

  function getSpecialAttackScope(playerKey, actor) {
    const ownerUnitKey = getActorUnitKey(playerKey, actor);

    if (!ownerUnitKey) {
      return {
        ownerUnitKey: null,
        currentAttackContext: ctx.getCurrentAttackContext(),
        currentAttack: ctx.getCurrentAttack()
      };
    }

    const contexts = typeof ctx.getCurrentAttackContexts === "function"
      ? ctx.getCurrentAttackContexts()
      : [];

    const matchedContext = Array.isArray(contexts)
      ? contexts.find(context =>
          context &&
          context.ownerPlayer === playerKey &&
          context.ownerUnitKey === ownerUnitKey
        )
      : null;

    if (!matchedContext?.groupId) {
      return {
        ownerUnitKey,
        currentAttackContext: ctx.getCurrentAttackContext(),
        currentAttack: ctx.getCurrentAttack()
      };
    }

    const allAttacks = Array.isArray(ctx.getCurrentAttack?.())
      ? ctx.getCurrentAttack()
      : [];

    const scopedAttacks = allAttacks.filter(attack => attack.groupId === matchedContext.groupId);

    return {
      ownerUnitKey,
      currentAttackContext: matchedContext,
      currentAttack: scopedAttacks.length > 0 ? scopedAttacks : allAttacks
    };
  }

  function normalizeCanExecuteArgs(special, thirdArg = null, fourthArg = null) {
    const thirdIsSpecialKey = typeof thirdArg === "string";
    return {
      specialKey: thirdIsSpecialKey ? thirdArg : special?.key || null,
      stateOverride: thirdIsSpecialKey ? fourthArg : thirdArg
    };
  }

  function canExecuteSpecialForPlayer(playerKey, special, thirdArg = null, fourthArg = null) {
    if (!special || special.actionType === "auto") {
      return false;
    }

    if (ctx.hasPendingChoice()) {
      return false;
    }

    const args = normalizeCanExecuteArgs(special, thirdArg, fourthArg);
    const actor = args.stateOverride || ctx.getPlayerState(playerKey);
    if (!actor) return false;

    const resolvedSpecialKey = args.specialKey || special.key || null;
    if (!resolvedSpecialKey) return false;

    const scope = getSpecialAttackScope(playerKey, actor);
    const scopedAttack = scope.currentAttack || [];
    const scopedContext = scope.currentAttackContext || null;

    const timing = special.timing || "self";

    if (
      special.effectType === "jegan_request_arms" &&
      ctx.getCurrentAttack().length > 0 &&
      playerKey !== ctx.getCurrentPlayer()
    ) {
      const availability = ctx.executeUnitCanUseSpecial(actor, resolvedSpecialKey, {
        ownerPlayer: playerKey,
        enemyPlayer: ctx.getOpponentPlayer(playerKey),
        ownerUnitKey: scope.ownerUnitKey,
        currentAttackContext: scopedContext,
        currentAttack: scopedAttack,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      return availability.allowed !== false;
    }

    let timingAllowed = false;

    if (timing === "self") {
      timingAllowed = playerKey === ctx.getCurrentPlayer() && ctx.getCurrentAttack().length === 0;
    } else if (timing === "reaction") {
      timingAllowed = playerKey !== ctx.getCurrentPlayer() && ctx.getCurrentAttack().length > 0;
    } else if (timing === "attack") {
      timingAllowed = playerKey === ctx.getCurrentPlayer() && ctx.getCurrentAttack().length > 0;
    }

    if (!timingAllowed) {
      return false;
    }

    const availability = ctx.withUnifiedEvadeForCheck(
      playerKey,
      actor,
      () => ctx.executeUnitCanUseSpecial(actor, resolvedSpecialKey, {
        ownerPlayer: playerKey,
        enemyPlayer: ctx.getOpponentPlayer(playerKey),
        ownerUnitKey: scope.ownerUnitKey,
        currentAttackContext: scopedContext,
        currentAttack: scopedAttack,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      })
    );

    return availability.allowed !== false;
  }

  function handleChoiceRequest(requestChoice) {
    if (!requestChoice) return;
    ctx.setPendingChoice({ ...requestChoice });
    ctx.redrawBattleBoards();
    ctx.renderPendingChoice();
  }

  function executeSpecial(ownerPlayer, specialKey) {
    if (ctx.isOnlineEnabled()) {
      if (ctx.isOnlineSpectator && ctx.isOnlineSpectator()) {
        ctx.showPopup("観戦中は特殊行動を実行できません");
        return;
      }

      if (ownerPlayer !== ctx.getOnlineMyPlayer()) {
        ctx.showPopup("相手側の特殊行動は操作できません");
        return;
      }
    }

    const result = ctx.executeSpecialRaw(ownerPlayer, specialKey);
    ctx.publishOnlineSpecialAction(ownerPlayer, specialKey);
    return result;
  }

  function resolvePendingChoice(selectedValue) {
    const choice = ctx.getPendingChoice();

    if (ctx.isOnlineEnabled()) {
      if (ctx.isOnlineSpectator && ctx.isOnlineSpectator()) {
        ctx.showPopup("観戦者は選択操作できません");
        return;
      }

      if (choice) {
        const ownerPlayer = choice.ownerPlayer;
        if (ownerPlayer !== ctx.getOnlineMyPlayer()) {
          ctx.showPopup("選択権のあるプレイヤーのみ操作できます");
          return;
        }
      }
    }

    ctx.publishOnlineChoiceAction(choice, selectedValue);
    return ctx.resolvePendingChoiceRaw(selectedValue);
  }

  return {
    canExecuteSpecialForPlayer,
    handleChoiceRequest,
    executeSpecial,
    resolvePendingChoice
  };
}
