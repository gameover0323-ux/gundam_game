import { reduceEvade } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function ensureProtoCreateState(state) {
  if (!state) return;

  if (typeof state.storyEnergyMax !== "number") {
    state.storyEnergyMax = Number(state.storyEnergyMax || 100);
  }

  if (typeof state.storyEnergy !== "number") {
    state.storyEnergy = state.storyEnergyMax;
  }

  if (!state.storyAmmo || typeof state.storyAmmo !== "object") state.storyAmmo = {};
  if (!state.storyReloadCounters || typeof state.storyReloadCounters !== "object") state.storyReloadCounters = {};
  if (!state.storyReloadFollowUpUsed || typeof state.storyReloadFollowUpUsed !== "object") state.storyReloadFollowUpUsed = {};

  if (typeof state.storyEnergyAdjustStacks !== "number") state.storyEnergyAdjustStacks = 0;
  if (typeof state.storyShieldUses !== "number") state.storyShieldUses = 3;
  if (typeof state.storyShieldActive !== "boolean") state.storyShieldActive = false;
  if (typeof state.storyRoundForceCooldown !== "number") state.storyRoundForceCooldown = 0;

  SLOT_KEYS.forEach(slotKey => {
    const effect = state.slots?.[slotKey]?.effect;
    if (!effect?.storyReload) return;

    if (typeof state.storyAmmo[slotKey] !== "number") {
      state.storyAmmo[slotKey] = Number(effect.storyAmmoMax || 0);
    }

    if (typeof state.storyReloadCounters[slotKey] !== "number") {
      state.storyReloadCounters[slotKey] = 0;
    }

    if (typeof state.storyReloadFollowUpUsed[slotKey] !== "boolean") {
      state.storyReloadFollowUpUsed[slotKey] = false;
    }
  });
}

function cloneSlotWithEffect(slot, effectPatch) {
  return {
    ...slot,
    effect: {
      ...(slot.effect || {}),
      ...effectPatch
    }
  };
}

function makeNoFireSlot(slot, reason) {
  return {
    ...slot,
    label: `${slot.label} [不発]`,
    desc: reason,
    effect: {
      type: "custom",
      customType: "proto_create_no_fire",
      effectId: "proto_create_no_fire"
    }
  };
}

function getEnergyAdjustedEffect(effect, stacks) {
  if (!effect?.storyEnergy || stacks === 0) return effect;

  const baseDamage = Number(effect.damage || 0);
  const baseCost = Number(effect.storyEnergyCost || 0);
  const rate = Math.max(0, 1 + 0.5 * stacks);

  return {
    ...effect,
    damage: Math.floor(baseDamage * rate),
    storyEnergyCost: Math.max(0, Math.floor(baseCost * rate))
  };
}

function getReloadChoices(state) {
  ensureProtoCreateState(state);

  return SLOT_KEYS
    .map(slotKey => {
      const slot = state.slots?.[slotKey];
      const effect = slot?.effect;
      if (!effect?.storyReload) return null;

      const max = Number(effect.storyAmmoMax || 0);
      const now = Number(state.storyAmmo?.[slotKey] ?? max);

      return {
        label: `${slot.label} ${now}/${max}`,
        value: slotKey
      };
    })
    .filter(Boolean);
}

function canReloadFollowUp(state, slotKey) {
  ensureProtoCreateState(state);

  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;
  if (!effect?.storyReload) return false;

  const ammo = Number(state.storyAmmo?.[slotKey] || 0);
  if (ammo <= 0) return false;

  if (state.storyReloadFollowUpUsed?.[slotKey] === true) return false;

  return Number(state.evade || 0) > 0;
}

function makeAttackFromEffect(slot, effect, sourceLabel = slot.label) {
  return createAttack({
    damage: Number(effect.damage || 0),
    count: Math.max(1, Number(effect.count || 1)),
    type: effect.attackType || "shoot",
    beam: effect.beam === true,
    ignoreReduction: effect.ignoreReduction === true,
    cannotEvade: effect.cannotEvade === true,
    sourceLabel
  });
}

export function getProtoCreateDerivedState(state) {
  ensureProtoCreateState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  result.status.push({
    text: `EN:${state.storyEnergy}/${state.storyEnergyMax}`,
    color: "#66ccff",
    bold: true
  });

  result.status.push({
    text: `シールド:${state.storyShieldUses}`,
    color: state.storyShieldActive ? "#66ffcc" : "#cccccc",
    bold: state.storyShieldActive === true
  });

  if (state.storyRoundForceCooldown > 0) {
    result.status.push({
      text: `ラウンドフォースCT:${state.storyRoundForceCooldown}`,
      color: "#ff9999",
      bold: true
    });
  }

  if (state.storyEnergyAdjustStacks !== 0) {
    result.status.push({
      text: `EN調整:${state.storyEnergyAdjustStacks}`,
      color: "#ffcc66",
      bold: true
    });
  }

  SLOT_KEYS.forEach(slotKey => {
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
    if (!slot || !effect) return;

    const adjustedEffect = getEnergyAdjustedEffect(effect, state.storyEnergyAdjustStacks);
    const tags = [];

    if (effect.storyReload) {
      const max = Number(effect.storyAmmoMax || 0);
      const now = Number(state.storyAmmo?.[slotKey] ?? max);
      tags.push(`[R:${now}/${max}]`);
    }

    if (adjustedEffect.storyEnergy) {
      tags.push(`[EN${adjustedEffect.storyEnergyCost}]`);
    }

    if (tags.length || adjustedEffect !== effect) {
      result.slots[slotKey] = {
        ...slot,
        label: `${slot.label}${tags.length ? " " + tags.join("") : ""}`,
        effect: adjustedEffect
      };
    }
  });

  return result;
}

export function canUseProtoCreateSpecial(state, specialKey) {
  ensureProtoCreateState(state);

  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つかりません" };

  if (special.effectType === "story_reload") {
    const choices = getReloadChoices(state);
    return {
      allowed: choices.length > 0,
      message: choices.length > 0 ? null : "リロード武器がありません"
    };
  }

  if (special.effectType === "story_energy_charge") {
    return {
      allowed: state.storyEnergy < state.storyEnergyMax,
      message: state.storyEnergy < state.storyEnergyMax ? null : "ENは最大です"
    };
  }

  if (special.effectType === "story_energy_adjust") {
    return { allowed: true, message: null };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
    if (!String(special.name || "").includes("シールド")) {
      return { allowed: false, message: "装備品がありません" };
    }

    return {
      allowed: state.storyShieldUses > 0,
      message: state.storyShieldUses > 0 ? null : "シールド残数がありません"
    };
  }

  if (special.effectType === "story_create_skill") {
    if (!String(special.name || "").includes("ラウンドフォース")) {
      return { allowed: false, message: "クリエイトスキルがありません" };
    }

    return {
      allowed: state.storyRoundForceCooldown <= 0,
      message: state.storyRoundForceCooldown <= 0
        ? null
        : `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン`
    };
  }

  return { allowed: true, message: null };
}

export function executeProtoCreateSpecial(state, specialKey, context = {}) {
  ensureProtoCreateState(state);

  const special = state.specials?.[specialKey];
  if (!special) {
    return { handled: true, redraw: false, message: "特殊行動データが見つかりません" };
  }

  if (special.effectType === "story_reload") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "buttons",
        effectType: "proto_create_reload_choice",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "全弾リロードする武器を選択",
        choices: getReloadChoices(state)
      }
    };
  }

  if (special.effectType === "story_energy_charge") {
    const before = state.storyEnergy;
    state.storyEnergy = Math.min(state.storyEnergyMax, state.storyEnergy + 30);

    return {
      handled: true,
      redraw: true,
      message: `エネルギーチャージ：EN${before}→${state.storyEnergy}`
    };
  }

  if (special.effectType === "story_energy_adjust") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "buttons",
        effectType: "proto_create_energy_adjust_choice",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "エネルギー調整",
        choices: [
          { label: "増加", value: "plus" },
          { label: "減少", value: "minus" },
          { label: "リセット", value: "reset" }
        ]
      }
    };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
    if (!String(special.name || "").includes("シールド")) {
      return { handled: true, redraw: false, message: "装備品がありません" };
    }

    if (state.storyShieldUses <= 0) {
      return { handled: true, redraw: false, message: "シールド残数がありません" };
    }

  if (state.storyShieldActive) {
  return {
    handled: true,
    redraw: false,
    message: "シールドは既に展開中"
  };
}

state.storyShieldUses -= 1;
state.storyShieldActive = true;

return {
  handled: true,
  redraw: true,
  message: `${state.name} シールド展開。このターンの被ダメージ半減`
};
  }

  if (special.effectType === "story_create_skill") {
    if (!String(special.name || "").includes("ラウンドフォース")) {
      return { handled: true, redraw: false, message: "クリエイトスキルがありません" };
    }

    if (state.storyRoundForceCooldown > 0) {
      return {
        handled: true,
        redraw: false,
        message: `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン`
      };
    }

    state.storyRoundForceCooldown = 5;

    return {
  handled: true,
  redraw: true,
  message: "ラウンドフォース発動",
  appendAttackLabel: "ラウンドフォース",
  appendAttacks: createAttack(100, 1, {
  type: "melee",
  source: "ラウンドフォース"
})
};
  }

  return { handled: false, redraw: false, message: null };
}

export function onProtoCreateResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureProtoCreateState(state);

  if (pendingChoice?.effectType === "proto_create_reload_choice") {
    const slotKey = String(selectedValue || "");
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;

    if (!slot || !effect?.storyReload) {
      return { handled: true, redraw: false, message: "リロード対象が不正です" };
    }

    const max = Number(effect.storyAmmoMax || 0);
    const before = Number(state.storyAmmo?.[slotKey] || 0);
    state.storyAmmo[slotKey] = max;
    state.storyReloadCounters[slotKey] = 0;

    return {
      handled: true,
      redraw: true,
      message: `${slot.label} 全弾リロード：${before}→${max}`
    };
  }

  if (pendingChoice?.effectType === "proto_create_energy_adjust_choice") {
    const value = String(selectedValue || "");

    if (value === "plus") state.storyEnergyAdjustStacks += 1;
    if (value === "minus") state.storyEnergyAdjustStacks -= 1;
    if (value === "reset") state.storyEnergyAdjustStacks = 0;

    return {
      handled: true,
      redraw: true,
      message: `エネルギー調整：${state.storyEnergyAdjustStacks}`
    };
  }

  if (pendingChoice?.effectType === "proto_create_reload_followup") {
    const slotKey = String(selectedValue || "");

    if (slotKey === "cancel") {
      return { handled: true, redraw: true, message: "追撃しませんでした" };
    }

    if (!canReloadFollowUp(state, slotKey)) {
      return { handled: true, redraw: true, message: "追撃できません" };
    }

    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
    const ammo = Number(state.storyAmmo?.[slotKey] || 0);
    const baseCount = Math.max(1, Number(effect.count || 1));
    const useCount = Math.min(baseCount, ammo);

    if (useCount <= 0) {
      return { handled: true, redraw: true, message: `${slot.label} 弾切れ` };
    }

    reduceEvade(state, 1);
    state.storyReloadFollowUpUsed[slotKey] = true;
    state.storyAmmo[slotKey] = ammo - useCount;

  const appendAttacks = createAttack(
  Number(effect.damage || 0),
  useCount,
  {
    type: effect.attackType || "shoot",
    beam: effect.beam === true,
    ignoreReduction: effect.ignoreReduction === true,
    cannotEvade: effect.cannotEvade === true,
    source: `${slot.label} 追撃`
  }
);

return {
  handled: true,
  redraw: true,
  message: `${slot.label} 追撃：弾数${ammo}→${state.storyAmmo[slotKey]}`,
  appendAttacks
};
  }

  return { handled: false, redraw: false, message: null };
}

export function onProtoCreateBeforeSlot(state, rolledSlotNumber) {
  ensureProtoCreateState(state);

  const slotKey = `slot${rolledSlotNumber}`;
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect) return { redraw: false, message: null };

  let nextSlot = slot;
  const messages = [];

  if (effect.storyReload) {
    const ammo = Number(state.storyAmmo?.[slotKey] || 0);
    const baseCount = Math.max(1, Number(effect.count || 1));

    if (ammo <= 0) {
      const noFireSlot = makeNoFireSlot(slot, `${slot.label} 弾切れ`);
      return {
        redraw: true,
        message: `${slot.label} 弾切れ`,
        replaceSlotAction: {
          slotKey,
          slotData: noFireSlot
        }
      };
    }

    const useCount = Math.min(baseCount, ammo);
    state.storyAmmo[slotKey] = ammo - useCount;
    state.storyReloadFollowUpUsed[slotKey] = false;

    nextSlot = cloneSlotWithEffect(nextSlot, { count: useCount });
    messages.push(`${slot.label} 弾数${ammo}→${state.storyAmmo[slotKey]}`);
  }

  if (effect.storyEnergy) {
    const adjusted = getEnergyAdjustedEffect(nextSlot.effect, state.storyEnergyAdjustStacks);
    const need = Number(adjusted.storyEnergyCost || 0);
    const have = Number(state.storyEnergy || 0);

    if (have <= 0) {
      const noFireSlot = makeNoFireSlot(slot, `${slot.label} EN切れ`);
      return {
        redraw: true,
        message: `${slot.label} EN切れ`,
        replaceSlotAction: {
          slotKey,
          slotData: noFireSlot
        }
      };
    }

    if (need > 0 && have < need) {
      const rate = have / need;
      nextSlot = cloneSlotWithEffect(nextSlot, {
        ...adjusted,
        damage: Math.max(1, Math.floor(Number(adjusted.damage || 0) * rate)),
        storyEnergyCost: have
      });
      state.storyEnergy = 0;
      messages.push(`${slot.label} EN不足：出力低下`);
    } else {
      nextSlot = cloneSlotWithEffect(nextSlot, adjusted);
      state.storyEnergy = Math.max(0, have - need);
      messages.push(`${slot.label} EN${have}→${state.storyEnergy}`);
    }
  }

  return {
    redraw: true,
    message: messages.join("\n") || null,
    replaceSlotAction: {
      slotKey,
      slotData: nextSlot
    }
  };
}

export function onProtoCreateAfterSlotResolved(state, slotNumber, resolveResult, context = {}) {
  return { redraw: false, message: null };
}
export function onProtoCreateTurnEnd(state) {
  ensureProtoCreateState(state);

  let redraw = false;

  const beforeEnergy = state.storyEnergy;
  state.storyEnergy = Math.min(state.storyEnergyMax, state.storyEnergy + 5);
  if (state.storyEnergy !== beforeEnergy) redraw = true;

  SLOT_KEYS.forEach(slotKey => {
    const effect = state.slots?.[slotKey]?.effect;
    if (!effect?.storyReload) return;

    const max = Number(effect.storyAmmoMax || 0);
    const now = Number(state.storyAmmo?.[slotKey] || 0);
    if (now >= max) return;

    if (effect.storyReloadPerTurn) {
      state.storyAmmo[slotKey] = Math.min(max, now + Number(effect.storyReloadPerTurn));
      redraw = true;
      return;
    }

    if (effect.storyReloadTurnInterval && effect.storyReloadPerInterval) {
      state.storyReloadCounters[slotKey] += 1;

      if (state.storyReloadCounters[slotKey] >= Number(effect.storyReloadTurnInterval)) {
        state.storyReloadCounters[slotKey] = 0;
        state.storyAmmo[slotKey] = Math.min(max, now + Number(effect.storyReloadPerInterval));
        redraw = true;
      }
    }
  });

  if (state.storyRoundForceCooldown > 0) {
    state.storyRoundForceCooldown -= 1;
    redraw = true;
  }

  state.storyShieldActive = false;
  state.storyReloadFollowUpUsed = {};

  return { redraw, message: null };
}

export function modifyProtoCreateTakenDamage(defender, attacker, attack, damage) {
  ensureProtoCreateState(defender);

  if (defender.storyShieldActive) {
    return {
      damage: Math.floor(Number(damage || 0) / 2),
      message: "シールドによりダメージ半減"
    };
  }

  return { damage, message: null };
}

export function onProtoCreateActionResolved(attacker, defender, context = {}) {
  ensureProtoCreateState(attacker);

  const slotNumber = context.slotNumber;
  const slotKey = slotNumber ? `slot${slotNumber}` : null;
  const slot = slotKey ? attacker.slots?.[slotKey] : null;

  if (!slot?.effect?.storyReload) {
    return { redraw: false, message: null };
  }

  if (!canReloadFollowUp(attacker, slotKey)) {
    return { redraw: false, message: null };
  }

  return {
    redraw: true,
    message: `${slot.label} は弾数が残っています`,
    requestChoice: {
      choiceType: "buttons",
      effectType: "proto_create_reload_followup",
      ownerPlayer: context.ownerPlayer,
      enemyPlayer: context.enemyPlayer,
      ownerUnitKey: context.ownerUnitKey || null,
      title: `${slot.label}で追撃しますか？`,
      choices: [
        { label: "回避1消費で追撃", value: slotKey },
        { label: "追撃しない", value: "cancel" }
      ]
    }
  };
}
export function onProtoCreateDamaged() {
  return { redraw: false, message: null };
}

export function onProtoCreateEnemyBeforeSlot() {
  return { redraw: false, message: null };
}

export function modifyProtoCreateEvadeAttempt() {
  return { handled: false };
}
