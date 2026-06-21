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

  function takeHit(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    if (ctx.isOnlineEnabled()) {
      ctx.publishOnlineQteAction("hit", i);
    }

    const result = ctx.attackTakeHit(i);
    ctx.checkBattleEnd();

    return result;
  }

  function evadeAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    if (ctx.isOnlineEnabled()) {
      ctx.publishOnlineQteAction("evade", i);
    }

    const result = ctx.attackEvadeAttack(i);

    return result;
  }

  function supportDefenseAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    if (ctx.isOnlineEnabled()) {
      ctx.publishOnlineQteAction("supportDefense", i);
    }

    const result = ctx.attackSupportDefenseAttack(i);
    ctx.checkBattleEnd();

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
