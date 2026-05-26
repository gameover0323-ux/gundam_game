export function createAttackResolution(ctx) {
  function isTeamBattleMode() {
    return ctx.getBattleMode() === "2v2" || ctx.getBattleMode() === "challenge2v2";
  }

  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function markDefeatedIfNeeded(unit) {
    if (!unit) return false;
    if (Number(unit.hp || 0) <= 0) {
      unit.hp = 0;
      unit.isDefeated = true;
      return true;
    }
    return false;
  }

  function finishCurrentAttackResolution() {
    const currentAttackContexts = ctx.getCurrentAttackContexts();

    if (isTeamBattleMode() && currentAttackContexts.length > 0) {
      const contexts = [...currentAttackContexts];
      ctx.setCurrentAttackContext(null);
      ctx.setCurrentAttackContexts([]);

      for (const context of contexts) {
        const attacker = context.attacker;
        const defender = ctx.getCombatTargetState(context.enemyPlayer);

        const resolvedAttackSnapshot = ctx.getCurrentAttack ? [...ctx.getCurrentAttack()] : [];

        const actionResult = ctx.executeUnitActionResolved(attacker, defender, {
          ...context,
          resolvedAttacks: resolvedAttackSnapshot,
          allEvaded:
            context.totalCount > 0 &&
            context.hitCount === 0 &&
            context.evadeCount === context.totalCount
        });
        if (actionResult.message) {
          ctx.appendBattleNotice(actionResult.message);
        }

        if (Array.isArray(actionResult.appendAttacks) && actionResult.appendAttacks.length > 0) {
          ctx.setCurrentAttack(actionResult.appendAttacks);
          ctx.setCurrentAttackContext({
            ownerPlayer: context.ownerPlayer,
            enemyPlayer: context.enemyPlayer,
            slotKey: context.slotKey,
            slotNumber: context.slotNumber,
            slotLabel: actionResult.appendSlotLabel || actionResult.appendAttackLabel || "追加攻撃",
            slotDesc: actionResult.appendSlotDesc || "",
            totalCount: actionResult.appendAttacks.length,
            hitCount: 0,
            evadeCount: 0,
            appendedFrom: context.slotLabel || null
          });
          ctx.redrawBattleBoards();
          ctx.renderAttackChoices();
          return;
        }

        if (actionResult.requestChoice) {
          ctx.handleChoiceRequest(actionResult.requestChoice);
          return;
        }
      }

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
    const defender = ctx.getCombatTargetState(context.enemyPlayer);

    ctx.setCurrentAttackContext(null);

    const resolvedAttackSnapshot = ctx.getCurrentAttack ? [...ctx.getCurrentAttack()] : [];

    const actionResult = ctx.executeUnitActionResolved(attacker, defender, {
      ...context,
      resolvedAttacks: resolvedAttackSnapshot,
      allEvaded:
        context.totalCount > 0 &&
        context.hitCount === 0 &&
        context.evadeCount === context.totalCount
    });

    ctx.redrawBattleBoards();

    if (actionResult.message) {
      ctx.appendBattleNotice(actionResult.message);
    }

    if (Array.isArray(actionResult.appendAttacks) && actionResult.appendAttacks.length > 0) {
      ctx.setCurrentAttack(actionResult.appendAttacks);
      ctx.setCurrentAttackContext({
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        slotKey: context.slotKey,
        slotNumber: context.slotNumber,
        slotLabel: actionResult.appendSlotLabel || actionResult.appendAttackLabel || "追加攻撃",
        slotDesc: actionResult.appendSlotDesc || "",
        totalCount: actionResult.appendAttacks.length,
        hitCount: 0,
        evadeCount: 0,
        appendedFrom: context.slotLabel || null
      });
      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
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
    if (ctxAtk && typeof ctxAtk.enemyEvadeBefore !== "number") {
  ctxAtk.enemyEvadeBefore = Number(defender?.evade || 0);
}
   const currentAttack = ctx.getCurrentAttack();
const attack = currentAttack[index];
const damagePreview = attack ? attack.damage : 0;

const currentTotalDamage = currentAttack.reduce((sum, atk) => {
  return sum + Math.max(0, Number(atk?.damage || 0));
}, 0);

const hitResult = ctx.resolveTakeHit({
  attacker,
  defender,
  currentAttack,
  attackIndex: index,
  modifyTakenDamage: (d, a, atk, dmg) => ctx.executeUnitModifyTakenDamage(d, a, atk, dmg, {
    attackerPlayer,
    defenderPlayer,
    attacker,
    defender,
    currentAttack,
    attackIndex: index,
    currentAttackContext: ctxAtk,
    currentTotalDamage
  })
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

    const defenderTeam = ctx.getTeam(defenderPlayer);

    if (defenderTeam && defenderTeam.mode === "unified" && hitResult && !hitResult.cancelled) {
      const actualDamage =
        typeof hitResult.finalDamage === "number" ? hitResult.finalDamage : damagePreview;

      const unified =
        defenderTeam.unified || {
          baseHpA: defenderTeam.unit1?.hp || 0,
          baseHpB: defenderTeam.unit2?.hp || 0,
          totalDamage: 0,
          healA: 0,
          healB: 0
        };

      unified.totalDamage =
        Math.max(0, Number(unified.totalDamage || 0)) + Math.max(0, actualDamage);

      defenderTeam.unified = unified;
      defender.hp += Math.max(0, actualDamage);
    }

    defender.lastDamageTaken =
      typeof hitResult?.finalDamage === "number" ? hitResult.finalDamage : damagePreview;

    markDefeatedIfNeeded(defender);

    if (hitResult?.damageMessage) {
      ctx.appendBattleNotice(hitResult.damageMessage);
    }

    if (isUnitDefeated(defender)) {
      ctx.appendBattleNotice(`${defender.name}は撃墜された`);
    }

    if (ctxAtk) {
  ctxAtk.hitCount++;
  ctxAtk.damageDealt = Number(ctxAtk.damageDealt || 0) + Number(hitResult?.finalDamage || 0);
  ctxAtk.enemyEvadeBefore = typeof ctxAtk.enemyEvadeBefore === "number"
    ? ctxAtk.enemyEvadeBefore
    : Number(defender?.evade || 0);
  if (attacker) {
    attacker.exiaTurnDamageDealt =
      Number(attacker.exiaTurnDamageDealt || 0) + Number(hitResult?.finalDamage || 0);
  }
}

    const damagedResult = ctx.executeUnitOnDamaged(defender, attacker, {
      ownerPlayer: defenderPlayer,
      enemyPlayer: attackerPlayer,
      defender,
      attacker,
      attack,
      currentAttack,
      attackIndex: index
    });

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

    const customEvade = ctx.executeUnitModifyEvadeAttempt(defender, attacker, attack, {
      attacker,
      defender,
      currentAttack,
      attackIndex: index
    });

    if (customEvade && customEvade.handled) {
      if (!customEvade.ok) {
        ctx.appendBattleNotice(customEvade.message || "回避不可");
        ctx.redrawBattleBoards();
        ctx.renderAttackChoices();
        return;
      }

      if (customEvade.consumeEvade) {
        const cost = customEvade.consumeEvade || 0;

        if (customEvade.consumeByAdapter && ctx.twoVtwoAdapter && defenderPlayer) {
          ctx.twoVtwoAdapter.consumeEvade(defenderPlayer, defender, cost);
        } else {
          defender.evade -= cost;
        }
      }

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
    if (!isTeamBattleMode()) {
      ctx.appendBattleNotice("援護防御は2on2専用");
      return;
    }

    const currentAttack = ctx.getCurrentAttack();
    const attack = currentAttack[index];

    if (!attack) return;

    const ctxAtk = ctx.getCurrentAttackContext();
    const attackerPlayer = ctxAtk?.ownerPlayer || ctx.getCurrentPlayer();
    const defenderPlayer = ctxAtk?.enemyPlayer || ctx.getOpponentPlayer(attackerPlayer);
    const attacker = ctx.getPlayerState(attackerPlayer);
    const defenderTeam = ctx.getTeam(defenderPlayer);

    if (!defenderTeam || defenderTeam.mode !== "split") {
      ctx.appendBattleNotice("援護防御は分散型のみ使用可能");
      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    const focusKey = defenderTeam.focusUnitKey || "unit1";
    const supportKey = focusKey === "unit1" ? "unit2" : "unit1";
    const supportUnit = defenderTeam[supportKey];

    if (isUnitDefeated(supportUnit)) {
      if (supportUnit) {
        supportUnit.hp = 0;
        supportUnit.isDefeated = true;
      }
      ctx.appendBattleNotice("援護防御失敗：相方は撃墜されている");
      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    if (Number(supportUnit.evade || 0) <= 0) {
      ctx.appendBattleNotice("援護防御失敗：相方の回避が足りない");
      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    supportUnit.evade -= 1;

    const baseDamage = Math.floor((attack.damage || 0) / 2);

    const modifiedDamage = ctx.executeUnitModifyTakenDamage(
      supportUnit,
      attacker,
      attack,
      baseDamage
    );

    const finalDamage =
      typeof modifiedDamage === "number"
        ? modifiedDamage
        : typeof modifiedDamage?.damage === "number"
          ? modifiedDamage.damage
          : baseDamage;

    supportUnit.hp -= Math.max(0, finalDamage);
    supportUnit.lastDamageTaken = Math.max(0, finalDamage);

    const defeated = markDefeatedIfNeeded(supportUnit);

    currentAttack.splice(index, 1);

    if (ctxAtk) ctxAtk.hitCount++;

    ctx.appendBattleNotice(
      `${supportUnit.name}が援護防御：回避1消費、${Math.max(0, finalDamage)}ダメージ`
    );

    if (defeated) {
      ctx.appendBattleNotice(`${supportUnit.name}は撃墜された`);
    }

    const damagedResult = ctx.executeUnitOnDamaged(supportUnit, attacker, {
      ownerPlayer: defenderPlayer,
      enemyPlayer: attackerPlayer,
      defender: supportUnit,
      attacker,
      attack,
      currentAttack,
      attackIndex: index,
      supportDefense: true
    });

    if (damagedResult.message) {
      ctx.appendBattleNotice(damagedResult.message);
    }

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
