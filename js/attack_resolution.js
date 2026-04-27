export function createAttackResolution(ctx) {

  function finishCurrentAttackResolution() {
    const currentAttackContexts = ctx.getCurrentAttackContexts();

    if (ctx.getBattleMode() === "2v2" && currentAttackContexts.length > 0) {
      const contexts = [...currentAttackContexts];

      ctx.setCurrentAttackContext(null);
      ctx.setCurrentAttackContexts([]);

      contexts.forEach((context) => {
        const attacker = context.attacker;
        const defender = ctx.getPlayerState(context.enemyPlayer);

        const actionResult = ctx.executeUnitActionResolved(attacker, defender, {
          ...context,
          allEvaded:
            context.totalCount > 0 &&
            context.hitCount === 0 &&
            context.evadeCount === context.totalCount
        });

        if (actionResult.message) {
          ctx.appendBattleNotice(actionResult.message);
        }

        if (actionResult.requestChoice) {
          ctx.handleChoiceRequest(actionResult.requestChoice);
        }
      });

      ctx.redrawBattleBoards();
      ctx.renderAttackLogText("攻撃解決済み");
      return;
    }

    const context = ctx.getCurrentAttackContext();
    if (!context) {
      ctx.redrawBattleBoards();
      ctx.renderAttackLogText("攻撃解決済み");
      return;
    }

    const attacker = ctx.getPlayerState(context.ownerPlayer);
    const defender = ctx.getPlayerState(context.enemyPlayer);

    ctx.setCurrentAttackContext(null);

    const actionResult = ctx.executeUnitActionResolved(attacker, defender, {
      ...context,
      allEvaded:
        context.totalCount > 0 &&
        context.hitCount === 0 &&
        context.evadeCount === context.totalCount
    });

    ctx.redrawBattleBoards();

    if (actionResult.message) {
      ctx.appendBattleNotice(actionResult.message);
    }

    if (actionResult.requestChoice) {
      ctx.handleChoiceRequest(actionResult.requestChoice);
      return;
    }

    ctx.renderAttackLogText("攻撃解決済み");
  }

  function takeHit(index) {
    const ctxAtk = ctx.getCurrentAttackContext();
    const attackerPlayer = ctxAtk?.ownerPlayer || ctx.getCurrentPlayer();
    const defenderPlayer = ctxAtk?.enemyPlayer || ctx.getOpponentPlayer(attackerPlayer);

    const attacker = ctx.getPlayerState(attackerPlayer);
    const defender = ctx.getCombatTargetState(defenderPlayer);

    const currentAttack = ctx.getCurrentAttack();
    const attack = currentAttack[index];
    const damagePreview = attack ? attack.damage : 0;

    const hitResult = ctx.resolveTakeHit({
      attacker,
      defender,
      currentAttack,
      attackIndex: index,
      modifyTakenDamage: (d, a, atk, dmg) =>
        ctx.executeUnitModifyTakenDamage(d, a, atk, dmg)
    });

    if (hitResult && hitResult.cancelled) {
      ctx.appendBattleNotice("攻撃無効");

      if (currentAttack.length === 0) {
        finishCurrentAttackResolution();
        return;
      }

      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    defender.lastDamageTaken =
      typeof hitResult?.finalDamage === "number"
        ? hitResult.finalDamage
        : damagePreview;

    if (hitResult?.damageMessage) {
      ctx.appendBattleNotice(hitResult.damageMessage);
    }

    if (ctxAtk) ctxAtk.hitCount++;

    const damagedResult = ctx.executeUnitOnDamaged(defender, attacker);

    if (currentAttack.length === 0) {
      if (damagedResult.message) {
        ctx.appendBattleNotice(damagedResult.message);
      }
      finishCurrentAttackResolution();
      return;
    }

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();

    if (damagedResult.message) {
      ctx.showPopup(damagedResult.message);
    }
  }

  function evadeAttack(index) {
    const ctxAtk = ctx.getCurrentAttackContext();
    const attackerPlayer = ctxAtk?.ownerPlayer || ctx.getCurrentPlayer();
    const defenderPlayer = ctxAtk?.enemyPlayer || ctx.getOpponentPlayer(attackerPlayer);

    const attacker = ctx.getPlayerState(attackerPlayer);
    const defender = ctx.getCombatTargetState(defenderPlayer);

    const currentAttack = ctx.getCurrentAttack();
    const attack = currentAttack[index];

    const customEvade = ctx.executeUnitModifyEvadeAttempt(
      defender,
      attacker,
      attack,
      {
        attacker,
        defender,
        currentAttack,
        attackIndex: index
      }
    );

    if (customEvade && customEvade.handled) {
      if (!customEvade.ok) {
        ctx.appendBattleNotice(customEvade.message || "回避不可");
        ctx.redrawBattleBoards();
        ctx.renderAttackChoices();
        return;
      }

      defender.evade -= customEvade.consumeEvade || 0;
      currentAttack.splice(index, 1);

      if (ctxAtk) ctxAtk.evadeCount++;

      if (currentAttack.length === 0) {
        finishCurrentAttackResolution();
        return;
      }

      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    const result = ctx.resolveEvadeAttack({
      defender,
      currentAttack,
      attackIndex: index
    });

    if (!result.ok) {
      ctx.appendBattleNotice("回避失敗");
      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    if (ctxAtk) ctxAtk.evadeCount++;

    if (currentAttack.length === 0) {
      finishCurrentAttackResolution();
      return;
    }

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
  }

  function supportDefenseAttack(index) {
    if (ctx.getBattleMode() !== "2v2") {
      ctx.appendBattleNotice("援護防御は2on2専用");
      return;
    }

    const currentAttack = ctx.getCurrentAttack();
    const attack = currentAttack[index];
    if (!attack) return;

    const ctxAtk = ctx.getCurrentAttackContext();
    const attackerPlayer = ctxAtk?.ownerPlayer || ctx.getCurrentPlayer();
    const defenderPlayer = ctxAtk?.enemyPlayer || ctx.getOpponentPlayer(attackerPlayer);

    const defenderTeam = ctx.getTeam(defenderPlayer);
    if (!defenderTeam || defenderTeam.mode !== "split") return;

    const focus = defenderTeam.focusUnitKey || "unit1";
    const support = focus === "unit1" ? "unit2" : "unit1";

    const supportUnit = defenderTeam[support];
    if (!supportUnit || supportUnit.evade <= 0) return;

    supportUnit.evade--;

    let damage = attack.ignoreReduction
      ? attack.damage
      : Math.floor(attack.damage / 2);

    supportUnit.hp -= damage;
    if (supportUnit.hp < 0) supportUnit.hp = 0;

    currentAttack.splice(index, 1);

    if (ctxAtk) ctxAtk.hitCount++;

    ctx.appendBattleNotice(`${supportUnit.name}が援護防御`);

    if (currentAttack.length === 0) {
      finishCurrentAttackResolution();
      return;
    }

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
  }

  return {
    takeHit,
    evadeAttack,
    supportDefenseAttack,
    finishCurrentAttackResolution
  };
}
