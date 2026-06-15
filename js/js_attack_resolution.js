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

  function getAttackTypeFromAttack(attack) {
    return attack?.type || attack?.attackType || null;
  }

  function recordResolvedAttack(context, attack) {
    if (!context || !attack) return;

    if (!Array.isArray(context.resolvedAttacks)) {
      context.resolvedAttacks = [];
    }

    context.resolvedAttacks.push({ ...attack });
  }

  function rememberLastEnemyAttackType(defender, context) {
    if (!defender || !context) return;

    const attacks = Array.isArray(context.resolvedAttacks)
      ? context.resolvedAttacks
      : [];

    const firstAttackType = attacks
      .map(getAttackTypeFromAttack)
      .find(type => type === "shoot" || type === "melee");

    if (!firstAttackType) return;

    defender.barbatosLastEnemyAttackType = firstAttackType;
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

        rememberLastEnemyAttackType(defender, context);

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

    rememberLastEnemyAttackType(defender, context);

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

  function startCounterAttackFromHitResult(hitResult, defenderPlayer, attackerPlayer, ctxAtk) {
    if (!hitResult || !Array.isArray(hitResult.appendAttacks) || hitResult.appendAttacks.length === 0) {
      return false;
    }

    ctx.setCurrentAttack(hitResult.appendAttacks);
    ctx.setCurrentAttackContext({
      ownerPlayer: defenderPlayer,
      enemyPlayer: attackerPlayer,
      slotKey: "counter",
      slotNumber: null,
      slotLabel: hitResult.appendSlotLabel || hitResult.appendAttackLabel || "カウンター攻撃",
      slotDesc: hitResult.appendSlotDesc || "",
      totalCount: hitResult.appendAttacks.length,
      hitCount: 0,
      evadeCount: 0,
      appendedFrom: ctxAtk?.slotLabel || null,
      counterAttack: true
    });

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
    return true;
  }

function applyTauntDamageModifier({
    attackerPlayer,
    defenderPlayer,
    defender,
    ctxAtk,
    attack,
    damage
  }) {
    let nextDamage = damage;

    if (
      ctx.twoVtwoTauntSystem &&
      isTeamBattleMode() &&
      typeof ctx.twoVtwoTauntSystem.modifyDamage === "function"
    ) {
      const defenderTeam = ctx.getTeam(defenderPlayer);
      let defenderUnitKey = null;

      if (defenderTeam?.unit1 === defender) defenderUnitKey = "unit1";
      if (defenderTeam?.unit2 === defender) defenderUnitKey = "unit2";

      nextDamage = ctx.twoVtwoTauntSystem.modifyDamage({
        attackerPlayer,
        attackerUnitKey: ctxAtk?.ownerUnitKey || attack?.ownerUnitKey || null,
        defenderPlayer,
        defenderUnitKey,
        damage: nextDamage
      });
    }

    return nextDamage;
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

    recordResolvedAttack(ctxAtk, attack);

    const currentTotalDamage = currentAttack.reduce((sum, atk) => {
      return sum + Math.max(0, Number(atk?.damage || 0));
    }, 0);

    const defenderHpBeforeHit = Number(defender?.hp || 0);

    const hitResult = ctx.resolveTakeHit({
      attacker,
      defender,
      currentAttack,
      attackIndex: index,
      modifyTakenDamage: (d, a, atk, dmg) => {
        const nextDamage = applyTauntDamageModifier({
          attackerPlayer,
          defenderPlayer,
          defender,
          ctxAtk,
          attack: atk,
          damage: dmg
        });

        return ctx.executeUnitModifyTakenDamage(d, a, atk, nextDamage, {
          attackerPlayer,
          defenderPlayer,
          attacker,
          defender,
          currentAttack,
          attackIndex: index,
          currentAttackContext: ctxAtk,
          currentTotalDamage
        });
      },
      rollCritical: () => {
        return typeof ctx.rollCritical === "function" ? ctx.rollCritical(attacker) : false;
      }
    });

    if (hitResult && hitResult.cancelled) {
      ctx.appendBattleNotice(hitResult.damageMessage || "攻撃無効");

      if (currentAttack.length === 0) {
        if (startCounterAttackFromHitResult(hitResult, defenderPlayer, attackerPlayer, ctxAtk)) {
          return;
        }

        finishCurrentAttackResolution();
        return;
      }

      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    const defenderTeam = ctx.getTeam(defenderPlayer);

    if (defenderTeam && defenderTeam.mode === "unified" && hitResult && !hitResult.cancelled) {
      const actualDamage = typeof hitResult.finalDamage === "number" ? hitResult.finalDamage : damagePreview;
      const unified = defenderTeam.unified || {
        baseHpA: defenderTeam.unit1?.hp || 0,
        baseHpB: defenderTeam.unit2?.hp || 0,
        totalDamage: 0,
        healA: 0,
        healB: 0
      };

      unified.totalDamage = Math.max(0, Number(unified.totalDamage || 0)) + Math.max(0, actualDamage);
      defenderTeam.unified = unified;

      defender.hp = defenderHpBeforeHit;
    } else {
      markDefeatedIfNeeded(defender);
    }

    defender.lastDamageTaken = typeof hitResult?.finalDamage === "number" ? hitResult.finalDamage : damagePreview;

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

    if (startCounterAttackFromHitResult(hitResult, defenderPlayer, attackerPlayer, ctxAtk)) {
      return;
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
  }

  function evadeAttack(index) {
    const ctxAtk = ctx.getCurrentAttackContext();
    const attackerPlayer = ctxAtk?.ownerPlayer || ctx.getCurrentPlayer();
    const defenderPlayer = ctxAtk?.enemyPlayer || ctx.getOpponentPlayer(attackerPlayer);

    const attacker = ctx.getPlayerState(attackerPlayer);
    const defender = ctx.getCombatTargetState(defenderPlayer);
    const currentAttack = ctx.getCurrentAttack();
    const attack = currentAttack[index];

    recordResolvedAttack(ctxAtk, attack);

    const evadeContext = {
      attacker,
      defender,
      currentAttack,
      attackIndex: index,
      attackerPlayer,
      defenderPlayer,
      ownerPlayer: defenderPlayer,
      enemyPlayer: attackerPlayer,
      currentAttackContext: ctxAtk,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    };

    const customEvade = ctx.executeUnitModifyEvadeAttempt(
      defender,
      attacker,
      attack,
      evadeContext
    );

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

    if (ctx.twoVtwoAdapter && defenderPlayer) {
      if (attack?.cannotEvade) {
        ctx.appendBattleNotice("回避不可");
        ctx.redrawBattleBoards();
        ctx.renderAttackChoices();
        return;
      }

      if (!ctx.twoVtwoAdapter.consumeEvade(defenderPlayer, defender, 1)) {
        ctx.appendBattleNotice("回避失敗");
        ctx.redrawBattleBoards();
        ctx.renderAttackChoices();
        return;
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

    const result = ctx.resolveEvadeAttack({ defender, currentAttack, attackIndex: index });

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

    let damageBeforeSupport = Math.max(0, Number(attack.damage || 0));

    if (
      ctx.twoVtwoTauntSystem &&
      typeof ctx.twoVtwoTauntSystem.modifyDamage === "function"
    ) {
     damageBeforeSupport = ctx.twoVtwoTauntSystem.modifyDamage({
        attackerPlayer,
        attackerUnitKey: ctxAtk?.ownerUnitKey || attack?.ownerUnitKey || null,
        defenderPlayer,
        defenderUnitKey: focusKey,
        damage: damageBeforeSupport
      });
    }

    const baseDamage = Math.floor(damageBeforeSupport / 2);

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
