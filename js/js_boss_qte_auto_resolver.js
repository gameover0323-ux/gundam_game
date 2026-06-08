export function createBossQteAutoResolver(ctx) {
  function shouldCpuUseEvade(defender) {
    if (!defender) return false;
    if (defender.evade <= 0) return false;

    const evadeMax = Math.max(1, defender.evadeMax || 1);
    const rate = defender.evade / evadeMax;

    return Math.random() < rate;
  }

  function autoResolveBossQteIfNeeded() {
    if (!ctx.isChallengeMode()) return false;

    const context = ctx.getCurrentAttackContext();
    if (!context) return false;

    if (context.ownerPlayer !== "A") return false;
    if (context.enemyPlayer !== "B") return false;

    const currentAttack = ctx.getCurrentAttack();
    if (!currentAttack || currentAttack.length === 0) return false;

    const attacker = ctx.getPlayerState("A");
    const defender = ctx.getCombatTargetState("B");
    if (!attacker || !defender) return false;

    const damageBySource = new Map();
    let totalDamage = 0;
    let hitCount = 0;

    while (currentAttack.length > 0) {
      const attack = currentAttack[0];
      const sourceLabel =
        attack?.sourceLabel || `${attacker.name} ${context.slotNumber}.${context.slotLabel}`;
      const baseDamage = attack ? attack.damage : 0;

      const customEvade = ctx.executeUnitModifyEvadeAttempt(
        defender,
        attacker,
        attack,
        {
          attacker,
          defender,
          currentAttack,
          attackIndex: 0,
          currentAttackContext: context,
          isCpuAutoResolve: true
        }
      );

      if (customEvade && customEvade.handled) {
        if (customEvade.ok) {
          defender.evade -= customEvade.consumeEvade || 0;
          currentAttack.splice(0, 1);
          context.evadeCount++;

          if (customEvade.message) {
            ctx.appendBattleNotice(customEvade.message);
          }

          continue;
        }
      } else {
        if (shouldCpuUseEvade(defender)) {
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
      }

      const hitResult = ctx.resolveTakeHit({
  attacker,
  defender,
  currentAttack,
  attackIndex: 0,
  modifyTakenDamage: (d, a, atk, dmg) =>
    ctx.executeUnitModifyTakenDamage(d, a, atk, dmg),
  rollCritical: (defenderState) => {
    return typeof ctx.rollCritical === "function"
      ? ctx.rollCritical(defenderState)
      : false;
  }
});

      if (!hitResult || !hitResult.cancelled) {
        const finalDamage =
          typeof hitResult?.finalDamage === "number"
            ? hitResult.finalDamage
            : baseDamage;

        totalDamage += finalDamage;
        hitCount++;

        damageBySource.set(
          sourceLabel,
          (damageBySource.get(sourceLabel) || 0) + finalDamage
        );

        if (hitResult?.damageMessage) {
          ctx.appendBattleNotice(hitResult.damageMessage);
        }

        const damagedResult = ctx.executeUnitOnDamaged(defender, attacker);
        if (damagedResult.message) {
          ctx.appendBattleNotice(damagedResult.message);
        }
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
