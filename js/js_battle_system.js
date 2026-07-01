import { addEvade, reduceEvade, normalizeEvadeCapState } from "./js_unit_runtime.js";

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
      sourceLabel: options.sourceLabel || null,
      onHit: options.onHit || null,

      psychommu: options.psychommu || false,
      funnel: options.funnel || false,
      dragoon: options.dragoon || false,
      incom: options.incom || false,
      specialAttribute: options.specialAttribute || null,

      moonlightButterfly: options.moonlightButterfly || false,
      minEvadeRequired: options.minEvadeRequired || 0,

      criticalFixed: options.criticalFixed || false,
      criticalHit: options.criticalHit || false,
      criticalRate: options.criticalRate || 0
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

    const storyReduction = Math.max(0, Number(defender.storyDamageReductionRate || 0));
    if (storyReduction > 0) {
      dmg = Math.floor(dmg * Math.max(0, 100 - storyReduction) / 100);
    }
  }

  return dmg;
}

function applyAttackOnHitSpecial({ attacker, defender, attack }) {
  if (!attacker || !defender || !attack) {
    return null;
  }

  if (attack.special === "jegan_ewac_grenade_power_up") {
    attacker.jeganEwacGrenadeBonus =
      typeof attacker.jeganEwacGrenadeBonus === "number"
        ? attacker.jeganEwacGrenadeBonus + 5
        : 5;

    return `${attacker.name} 支給急造ハンドグレネード：次回威力+5`;
  }

  if (attack.special === "devil_head_each_hit") {
    reduceEvade(defender, 1);
    return `${defender.name} の回避-1`;
  }

  if (attack.special === "devil_fang_absorb") {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + 50);
    return `${attacker.name} がHP50吸収`;
  }

  if (attack.special === "devil_finger_zero_evade") {
    defender.evade = 0;
    normalizeEvadeCapState(defender);
    return `${defender.name} の回避が消滅`;
  }

  if (attack.special === "jegan_evade_plus_1") {
    addEvade(attacker, 1);
    return `${attacker.name} ハンドグレネード命中：回避+1`;
  }

  return null;
}

export function takeHit({
  attacker,
  defender,
  currentAttack,
  attackIndex,
  modifyTakenDamage,
  rollCritical
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
        attacker,
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

  if (attack.special === "extreme_half_current_hp") {
    finalDamage = Math.floor(defender.hp / 2);
  }

  let damageMessage = null;
  let appendAttacks = null;
  let appendAttackLabel = null;
  let appendSlotLabel = null;
  let appendSlotDesc = null;

  if (typeof modifyTakenDamage === "function") {
    const modified = modifyTakenDamage(defender, attacker, attack, finalDamage) || {};

    if (Array.isArray(modified.appendAttacks) && modified.appendAttacks.length > 0) {
      appendAttacks = modified.appendAttacks;
      appendAttackLabel = modified.appendAttackLabel || null;
      appendSlotLabel = modified.appendSlotLabel || null;
      appendSlotDesc = modified.appendSlotDesc || null;
    }

    if (modified.cancelled) {
      defender.lastDamageTaken = 0;
      currentAttack.splice(attackIndex, 1);

      return {
        defender,
        attacker,
        currentAttack,
        attack,
        finalDamage: 0,
        damageMessage: modified.message || "攻撃を無効化した",
        cancelled: true,
        appendAttacks,
        appendAttackLabel,
        appendSlotLabel,
        appendSlotDesc
      };
    }

    finalDamage = typeof modified.damage === "number" ? modified.damage : finalDamage;
    damageMessage = modified.message || null;
  }

const criticalHit = attack.criticalHit === true;

  if (criticalHit) {
    finalDamage *= 2;

    damageMessage = damageMessage
      ? `${damageMessage}\n会心！ダメージ2倍`
      : "会心！ダメージ2倍";
  }

  defender.hp -= finalDamage;

  if (defender.hp < 0) defender.hp = 0;

  const onHitMessage = applyAttackOnHitSpecial({ attacker, defender, attack });

  if (onHitMessage) {
    damageMessage = damageMessage ? `${damageMessage}\n${onHitMessage}` : onHitMessage;
  }

  currentAttack.splice(attackIndex, 1);

  return {
    defender,
    attacker,
    currentAttack,
    attack,
    finalDamage,
    damageMessage,
    appendAttacks,
    appendAttackLabel,
    appendSlotLabel,
    appendSlotDesc
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

  if (attack.minEvadeRequired && defender.evade < attack.minEvadeRequired) {
    return {
      ok: false,
      reason: "minEvadeRequired"
    };
  }

  if (defender.evade <= 0) {
    return {
      ok: false,
      reason: "noEvade"
    };
  }

  reduceEvade(defender, 1);
  currentAttack.splice(attackIndex, 1);
  normalizeEvadeCapState(defender);

  return {
    ok: true,
    defender,
    currentAttack
  };
}
