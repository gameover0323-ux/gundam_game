export function createAttack(damage, count, options = {}) {
  const attacks = [];

  for (let i = 0; i < count; i++) {
    attacks.push({
      damage: damage,
      type: options.type || "shoot",

      beam: options.beam || false,
      cannotEvade: options.cannotEvade || false,
      ignoreReduction: options.ignoreReduction || false,
      ignoreDefense: options.ignoreDefense || false,

      addedBeam: options.addedBeam || false,
      addedCannotEvade: options.addedCannotEvade || false,
      addedIgnoreReduction: options.addedIgnoreReduction || false,

      special: options.special || null,
      source: options.source || null,
      onHit: options.onHit || null
    });
  }

  return attacks;
}

export function calculateDamage(attack, defender) {
  let dmg = attack.damage;

  if (!attack.ignoreReduction) {
    if (defender.shieldActive) {
      dmg = Math.floor(dmg / 2);
    }
  }

  return dmg;
}

function applyAttackOnHitSpecial({ attacker, defender, attack }) {
  if (!attacker || !defender || !attack) {
    return null;
  }

  if (attack.special === "devil_head_each_hit") {
    defender.evade = Math.max(0, defender.evade - 1);
    return `${defender.name} の回避-1`;
  }

  if (attack.special === "devil_fang_absorb") {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + 50);
    return `${attacker.name} がHP50吸収`;
  }

  if (attack.special === "devil_finger_zero_evade") {
    defender.evade = 0;
    defender.overEvadeMode = false;
    defender.overEvadeCap = defender.evadeMax;
    defender.overEvadeBaseMax = defender.evadeMax;
    return `${defender.name} の回避が消滅`;
  }

  return null;
}

export function takeHit({
  attacker,
  defender,
  currentAttack,
  attackIndex,
  modifyTakenDamage
}) {
  const attack = currentAttack[attackIndex];

  if (!attacker || !defender || !attack) {
    return null;
  }

  if (attacker.isConfusedTurn) {
    if (attacker.confuseHits > 0) {
      attacker.confuseHits--;
      currentAttack.splice(attackIndex, 1);

      if (attacker.confuseHits === 0) {
        attacker.isConfusedTurn = false;
      }

      return {
        defender,
        currentAttack,
        cancelled: true,
        attack: null,
        finalDamage: 0,
        damageMessage: null
      };
    }

    attacker.isConfusedTurn = false;
  }

  let finalDamage = calculateDamage(attack, defender);
  let damageMessage = null;

  if (typeof modifyTakenDamage === "function") {
    const modified = modifyTakenDamage(defender, attacker, attack, finalDamage) || {};
    finalDamage = typeof modified.damage === "number" ? modified.damage : finalDamage;
    damageMessage = modified.message || null;
  }

  defender.hp -= finalDamage;
if (defender.hp < 0) defender.hp = 0;

const onHitMessage = applyAttackOnHitSpecial({ attacker, defender, attack });
if (onHitMessage) {
  damageMessage = damageMessage
    ? `${damageMessage}<br>${onHitMessage}`
    : onHitMessage;
}

currentAttack.splice(attackIndex, 1);
return { defender, attacker, currentAttack, attack, finalDamage, damageMessage };
  return {
    defender,
    attacker,
    currentAttack,
    attack,
    finalDamage,
    damageMessage
  };
}

export function evadeAttack({
  defender,
  currentAttack,
  attackIndex
}) {
  const attack = currentAttack[attackIndex];

  if (!defender || !attack) {
    return {
      ok: false,
      reason: "noTarget"
    };
  }

  if (attack.cannotEvade) {
    return {
      ok: false,
      reason: "cannotEvade"
    };
  }

  if (defender.evade <= 0) {
    return {
      ok: false,
      reason: "noEvade"
    };
  }

  defender.evade--;
  currentAttack.splice(attackIndex, 1);

  if (defender.overEvadeMode) {
    if (defender.evade <= defender.evadeMax) {
      defender.overEvadeMode = false;
      defender.overEvadeCap = defender.evadeMax;
      defender.overEvadeBaseMax = defender.evadeMax;
    } else {
      defender.overEvadeCap = Math.min(
        typeof defender.overEvadeCap === "number" ? defender.overEvadeCap : defender.evade,
        defender.evade
      );
    }
  }

  return {
    ok: true,
    defender,
    currentAttack
  };
}
