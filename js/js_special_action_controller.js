export function createSpecialActionController(ctx) {
  function canExecuteSpecialForPlayer(playerKey, special) {
    if (!special || special.actionType === "auto") {
      return false;
    }

    if (ctx.hasPendingChoice()) {
      return false;
    }

    const timing = special.timing || "self";

    if (
      special.effectType === "jegan_request_arms" &&
      ctx.getCurrentAttack().length > 0 &&
      playerKey !== ctx.getCurrentPlayer()
    ) {
      const actor = ctx.getPlayerState(playerKey);
      if (!actor) return false;

      const availability = ctx.executeUnitCanUseSpecial(actor, special.key, {
  ownerPlayer: playerKey,
  enemyPlayer: ctx.getOpponentPlayer(playerKey),
  currentAttackContext: ctx.getCurrentAttackContext(),
  currentAttack: ctx.getCurrentAttack(),
  twoVtwoAdapter: ctx.twoVtwoAdapter || null
});

      return availability.allowed !== false;
    }

    let timingAllowed = false;

    if (timing === "self") {
      timingAllowed =
        playerKey === ctx.getCurrentPlayer() &&
        ctx.getCurrentAttack().length === 0;
    } else if (timing === "reaction") {
      timingAllowed =
        playerKey !== ctx.getCurrentPlayer() &&
        ctx.getCurrentAttack().length > 0;
    } else if (timing === "attack") {
      timingAllowed =
        playerKey === ctx.getCurrentPlayer() &&
        ctx.getCurrentAttack().length > 0;
    }

    if (!timingAllowed) {
      return false;
    }

    const actor = ctx.getPlayerState(playerKey);
    if (!actor) return false;

    const availability = ctx.withUnifiedEvadeForCheck(playerKey, actor, () =>
  ctx.executeUnitCanUseSpecial(actor, special.key, {
    ownerPlayer: playerKey,
    enemyPlayer: ctx.getOpponentPlayer(playerKey),
    currentAttackContext: ctx.getCurrentAttackContext(),
    currentAttack: ctx.getCurrentAttack(),
    twoVtwoAdapter: ctx.twoVtwoAdapter || null
  })
);

    return availability.allowed !== false;
  }

  function handleChoiceRequest(requestChoice) {
    if (!requestChoice) return;

    ctx.setPendingChoice({
      ...requestChoice
    });

    ctx.redrawBattleBoards();
    ctx.renderPendingChoice();
  }

  function executeSpecial(ownerPlayer, specialKey) {
    if (ctx.isOnlineEnabled() && ownerPlayer !== ctx.getOnlineMyPlayer()) {
      ctx.showPopup("相手側の特殊行動は操作できません");
      return;
    }

    const result = ctx.executeSpecialRaw(ownerPlayer, specialKey);

    ctx.publishOnlineSpecialAction(ownerPlayer, specialKey);

    return result;
  }

  function resolvePendingChoice(selectedValue) {
    const choice = ctx.getPendingChoice();

    if (ctx.isOnlineEnabled() && choice) {
      const ownerPlayer = choice.ownerPlayer;

      if (ownerPlayer !== ctx.getOnlineMyPlayer()) {
        ctx.showPopup("選択権のあるプレイヤーのみ操作できます");
        return;
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
