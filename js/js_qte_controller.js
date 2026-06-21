export function createQteController(ctx) {
  function canOperateQteDefender() {
    if (!ctx.isOnlineEnabled()) return true;

    if (ctx.isOnlineSpectator && ctx.isOnlineSpectator()) {
      return false;
    }

    const context = ctx.getCurrentAttackContext();
    if (!context) return false;

    return context.enemyPlayer === ctx.getOnlineMyPlayer();
  }

  function renderAttackChoices() {
    if (ctx.autoResolveBossQteIfNeeded()) {
      ctx.clearBattleNotice();
      return;
    }

    ctx.renderAttackChoicesUI({
      currentAttack: ctx.getCurrentAttack(),
      battleNotice: ctx.getBattleNotice(),
      currentActionHeader: ctx.getCurrentActionHeader(),
      currentActionLabel: ctx.getCurrentActionLabel(),
      onHit: (index) => takeHit(index),
      onEvade: (index) => evadeAttack(index),
      onSupportDefense: (index) => supportDefenseAttack(index),
      canSupportDefense: ctx.isTeamBattleMode()
    });

    ctx.clearBattleNotice();
  }

  function publishOnlineResolvedQte(kind, index) {
    if (!ctx.isOnlineEnabled()) return;
    ctx.publishOnlineQteAction(kind, index);
  }

  function takeHit(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackTakeHit(i);
    ctx.checkBattleEnd();

    publishOnlineResolvedQte("hit", i);

    return result;
  }

  function evadeAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackEvadeAttack(i);

    publishOnlineResolvedQte("evade", i);

    return result;
  }

  function supportDefenseAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackSupportDefenseAttack(i);
    ctx.checkBattleEnd();

    publishOnlineResolvedQte("supportDefense", i);

    return result;
  }

  function finishCurrentAttackResolution() {
    return ctx.finishCurrentAttackResolutionRaw();
  }

  return {
    canOperateQteDefender,
    renderAttackChoices,
    takeHit,
    evadeAttack,
    supportDefenseAttack,
    finishCurrentAttackResolution
  };
}
