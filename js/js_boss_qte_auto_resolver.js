export function createBossQteAutoResolver(ctx) {
  function shouldCpuUseEvade(defender) {
    if (!defender) return false;
    if (defender.evade <= 0) return false;

    const evadeMax = Math.max(1, defender.evadeMax || 1);
    const rate = defender.evade / evadeMax;

    return Math.random() < rate;
  }

  function getUnifiedData(team) {
    if (!team) return null;

    if (!team.unified) {
      team.unified = {
        baseHpA: Number(team.unit1?.hp || 0),
        baseHpB: Number(team.unit2?.hp || 0),
        totalDamage: 0,
        healA: 0,
        healB: 0
      };
    }

    return team.unified;
  }

  function autoResolveBossQteIfNeeded() {
    if (!ctx.isChallengeMode()) return false;

    const context = ctx.getCurrentAttackContext();
    if (!context) return false;

    if (context.ownerPlayer !== "A") return false;
    if (context.enemyPlayer !== "B") return false;

    const currentAttack = ctx.getCurrentAttack();
    if (!currentAttack || currentAttack.length === 0) return false;

    const attackerPlayer = "A";
    const defenderPlayer = "B";

    const attacker = ctx.getPlayerState(attackerPlayer);
    const defender = ctx.getCombatTargetState(defenderPlayer);
    if (!attacker || !defender) return false;

    const defenderTeam =
      typeof ctx.getTeam === "function"
        ? ctx.getTeam(defenderPlayer)
        : null;

    const isUnifiedDefender =
      !!defenderTeam && defenderTeam.mode === "unified";

    const damageBySource = new Map();
    let totalDamage = 0;
    let hitCount = 0;

    while (currentAttack.length > 0) {
      const attack = currentAttack[0];
      const sourceLabel =
        attack?.sourceLabel || `${attacker.name} ${context.slotNumber}.${context.slotLabel}`;
      const baseDamage = attack ? attack.damage : 0;

      const evadeContext = {
        attacker,
        defender,
        currentAttack,
        attackIndex: 0,
        attackerPlayer,
        defenderPlayer,
        ownerPlayer: defenderPlayer,
        enemyPlayer: attackerPlayer,
        currentAttackContext: context,
        isCpuAutoResolve: true,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      };

      const customEvade = ctx.executeUnitModifyEvadeAttempt(
        defender,
        attacker,
        attack,
        evadeContext
      );

      if (customEvade && customEvade.handled) {
        if (customEvade.ok) {
          const cost = Number(customEvade.consumeEvade || 0);

          if (cost > 0) {
            if (
              customEvade.consumeByAdapter &&
              ctx.twoVtwoAdapter &&
              typeof ctx.twoVtwoAdapter.consumeEvade === "function"
            ) {
              ctx.twoVtwoAdapter.consumeEvade(defenderPlayer, defender, cost);
            } else {
              defender.evade = Math.max(0, Number(defender.evade || 0) - cost);
            }
          }

          currentAttack.splice(0, 1);
          context.evadeCount++;

          if (customEvade.message) {
            ctx.appendBattleNotice(customEvade.message);
          }

          continue;
        }
      } else if (!attack?.cannotEvade && shouldCpuUseEvade(defender)) {
        const evadeResult = ctx.resolveEvadeAttack({
          defender,
          currentAttack,
          attackIndex: 0
        });

        if (evadeResult.ok) {
          context.evadeCount++;
          continue;
        }
      }

      const defenderHpBeforeHit = Number(defender.hp || 0);

      const hitResult = ctx.resolveTakeHit({
        attacker,
        defender,
        currentAttack,
        attackIndex: 0,
        modifyTakenDamage: (d, a, atk, dmg) =>
          ctx.executeUnitModifyTakenDamage(d, a, atk, dmg, {
            ownerPlayer: defenderPlayer,
            enemyPlayer: attackerPlayer,
            attackerPlayer,
            defenderPlayer,
            attacker,
            defender,
            currentAttack,
            attackIndex: 0,
            currentAttackContext: context,
            isCpuAutoResolve: true,
            twoVtwoAdapter: ctx.twoVtwoAdapter || null
          }),
        rollCritical: () => {
          return typeof ctx.rollCritical === "function"
            ? ctx.rollCritical(attacker)
            : false;
        }
      });

      if (!hitResult || hitResult.cancelled) {
        if (hitResult?.damageMessage) {
          ctx.appendBattleNotice(hitResult.damageMessage);
        }
        continue;
      }

      const finalDamage =
        typeof hitResult.finalDamage === "number"
          ? hitResult.finalDamage
          : baseDamage;

      if (isUnifiedDefender) {
        const unified = getUnifiedData(defenderTeam);
        unified.totalDamage =
          Math.max(0, Number(unified.totalDamage || 0)) +
          Math.max(0, finalDamage);

        defender.hp = defenderHpBeforeHit;
        defender.isDefeated = false;
      }

      totalDamage += finalDamage;
      hitCount++;

      damageBySource.set(
        sourceLabel,
        (damageBySource.get(sourceLabel) || 0) + finalDamage
      );

      if (hitResult.damageMessage) {
        ctx.appendBattleNotice(hitResult.damageMessage);
      }

      const damagedResult = ctx.executeUnitOnDamaged(defender, attacker, {
        ownerPlayer: defenderPlayer,
        enemyPlayer: attackerPlayer,
        defender,
        attacker,
        attack,
        currentAttack,
        attackIndex: 0,
        isCpuAutoResolve: true,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (damagedResult.message) {
        ctx.appendBattleNotice(damagedResult.message);
      }
    }

    context.hitCount += hitCount;

    ctx.finishCurrentAttackResolution();

    if (ctx.checkBattleEnd()) {
      return true;
    }

    const detailLines = [...damageBySource.entries()].map(
      ([label, damage]) => `${label}<br>→ ${damage}ダメージ`
    );

    ctx.renderAttackLogText(
      `${ctx.getCurrentActionHeader()}<br>` +
      `${detailLines.join("<br>")}<br>` +
      `合計${totalDamage}ダメージを与えた。`
    );

    return true;
  }

  return {
    shouldCpuUseEvade,
    autoResolveBossQteIfNeeded
  };
}
