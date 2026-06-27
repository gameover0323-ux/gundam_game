import { reduceEvade, addEvade } from "./js_unit_runtime.js";
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

  if (!state.storyAmmo || typeof state.storyAmmo !== "object") {
    state.storyAmmo = {};
  }

  if (!state.storyReloadCounters || typeof state.storyReloadCounters !== "object") {
    state.storyReloadCounters = {};
  }

  if (typeof state.storyEnergyAdjustStacks !== "number") {
    state.storyEnergyAdjustStacks = 0;
  }

  if (typeof state.storyShieldUses !== "number") {
    state.storyShieldUses = 3;
  }

  if (typeof state.storyShieldActive !== "boolean") {
    state.storyShieldActive = false;
  }

  if (typeof state.storyRoundForceCooldown !== "number") {
    state.storyRoundForceCooldown = 0;
  }

  if (typeof state.storyRoundForceUses !== "number") {
    state.storyRoundForceUses = 0;
  }

  if (!state.storyReloadFollowUpUsed || typeof state.storyReloadFollowUpUsed !== "object") {
    state.storyReloadFollowUpUsed = {};
  }

  SLOT_KEYS.forEach(slotKey => {
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
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

function getEnergyAdjustedEffect(effect, stacks) {
  if (!effect?.storyEnergy || stacks <= 0) return effect;

  const baseDamage = Number(effect.damage || 0);
  const baseEnergyCost = Number(effect.storyEnergyCost || 0);

  return {
    ...effect,
    damage: Math.floor(baseDamage * (1 + 0.5 * stacks)),
    storyEnergyCost: baseEnergyCost * (1 + stacks)
  };
}

function getReloadAmount(effect) {
  return Math.max(
    1,
    Number(
      effect?.storyManualReloadAmount ??
      effect?.storyReloadPerTurn ??
      effect?.storyReloadPerInterval ??
      1
    )
  );
}

function getReloadSlotChoices(state) {
  ensureProtoCreateState(state);

  return SLOT_KEYS
    .map(slotKey => {
      const slot = state.slots?.[slotKey];
      const effect = slot?.effect;
      if (!slot || !effect?.storyReload) return null;

      const maxAmmo = Number(effect.storyAmmoMax || 0);
      const ammo = Math.max(0, Number(state.storyAmmo?.[slotKey] ?? maxAmmo));

      return {
        label: `${slot.label} ${ammo}/${maxAmmo}`,
        value: slotKey
      };
    })
    .filter(Boolean);
}

function spendReloadWeaponCost(state, slotKey) {
  ensureProtoCreateState(state);

  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect?.storyReload) {
    return { ok: true, message: null };
  }

  const ammoCost = Number(effect.storyAmmoCostPerUse || 0);
  const currentAmmo = Number(state.storyAmmo?.[slotKey] || 0);

  if (currentAmmo < ammoCost) {
    return {
      ok: false,
      message: `${slot.label} 弾切れ`
    };
  }

  state.storyAmmo[slotKey] = currentAmmo - ammoCost;
  return { ok: true, message: null };
}

function spendEnergyWeaponCost(state, slotKey) {
  ensureProtoCreateState(state);

  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect?.storyEnergy) {
    return { ok: true, message: null };
  }

  const energyCost = Number(effect.storyEnergyCost || 0);

  if (state.storyEnergy < energyCost) {
    return {
      ok: false,
      message: `${slot.label} EN不足`
    };
  }

  state.storyEnergy -= energyCost;
  return { ok: true, message: null };
}

function buildNoFireSlot(slot, reason) {
  return {
    ...slot,
    label: `${slot.label} [不発]`,
    desc: `${slot.desc || ""}\n${reason}`,
    effect: {
      type: "custom",
      customType: "proto_create_no_fire",
      customEffectId: "proto_create_no_fire"
    }
  };
}

function canFollowUpReloadWeapon(state, slotKey) {
  ensureProtoCreateState(state);

  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;
  if (!slot || !effect?.storyReload) return false;

  const ammoCost = Number(effect.storyAmmoCostPerUse || 0);
  const currentAmmo = Number(state.storyAmmo?.[slotKey] || 0);

  if (currentAmmo < ammoCost) return false;
  if (Number(state.evade || 0) > 0) return true;

  return state.storyReloadFollowUpUsed?.[slotKey] !== true;
}

function buildAttackFromSlot(state, slotKey) {
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;
  if (!slot || effect?.type !== "attack") return null;

  return createAttack({
    damage: Number(effect.damage || 0),
    count: Math.max(1, Number(effect.count || 1)),
    type: effect.attackType || "shoot",
    beam: effect.beam === true,
    ignoreReduction: effect.ignoreReduction === true,
    cannotEvade: effect.cannotEvade === true,
    sourceLabel: slot.label
  });
}

function requestReloadChoice(state, context = {}) {
  const choices = getReloadSlotChoices(state);

  if (!choices.length) {
    return {
      handled: true,
      redraw: false,
      message: "リロード武器がありません"
    };
  }

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
      title: "リロードする武器を選択",
      choices
    }
  };
}

function requestReloadFollowUpChoice(state, slotKey, context = {}) {
  const slot = state.slots?.[slotKey];
  if (!slot) return null;

  return {
    choiceType: "buttons",
    effectType: "proto_create_reload_followup",
    ownerPlayer: context.ownerPlayer,
    enemyPlayer: context.enemyPlayer,
    ownerUnitKey: context.ownerUnitKey || null,
    title: `${slot.label}で追撃しますか？`,
    choices: [
      { label: "追撃する", value: slotKey },
      { label: "追撃しない", value: "cancel" }
    ],
    params: {
      slotKey
    }
  };
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

  if (state.storyEnergyAdjustStacks > 0) {
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

    const nextEffect = getEnergyAdjustedEffect(effect, state.storyEnergyAdjustStacks);
    const extraTexts = [];

    if (effect.storyReload) {
      const ammo = state.storyAmmo?.[slotKey] ?? effect.storyAmmoMax;
      extraTexts.push(`[R:${ammo}/${effect.storyAmmoMax}]`);
    }

    if (nextEffect.storyEnergy) {
      extraTexts.push(`[EN${nextEffect.storyEnergyCost}]`);
    }

    if (extraTexts.length > 0 || nextEffect !== effect) {
      result.slots[slotKey] = {
        ...slot,
        label: `${slot.label}${extraTexts.length ? " " + extraTexts.join("") : ""}`,
        effect: nextEffect
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
    return {
      allowed: getReloadSlotChoices(state).length > 0,
      message: getReloadSlotChoices(state).length > 0 ? null : "リロード武器がありません"
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

  if (special.effectType === "story_create_skill") {
    if (!String(special.name || "").includes("ラウンドフォース")) {
      return { allowed: false, message: "クリエイトスキルがありません" };
    }

    if (state.storyRoundForceCooldown > 0) {
      return {
        allowed: false,
        message: `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン`
      };
    }

    return { allowed: true, message: null };
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
    return requestReloadChoice(state, context);
  }

  if (special.effectType === "story_energy_charge") {
    const before = Number(state.storyEnergy || 0);
    state.storyEnergy = Math.min(state.storyEnergyMax, before + 30);

    return {
      handled: true,
      redraw: true,
      message: `エネルギーチャージ：EN${before}→${state.storyEnergy}`
    };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
    if (!String(special.name || "").includes("シールド")) {
      return { handled: true, redraw: false, message: "装備品がありません" };
    }

    if (state.storyShieldUses <= 0) {
      return { handled: true, redraw: false, message: "シールド残数がありません" };
    }

    state.storyShieldUses -= 1;
    state.storyShieldActive = true;

    return {
      handled: true,
      redraw: true,
      message: `シールド発動 残り${state.storyShieldUses}回`
    };
  }

  if (special.effectType === "story_energy_adjust") {
    state.storyEnergyAdjustStacks += 1;

    return {
      handled: true,
      redraw: true,
      message: `エネルギー調整：EN武器強化 +${state.storyEnergyAdjustStacks}`
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

    const attack = createAttack({
      damage: 100,
      count: 1,
      type: "melee",
      sourceLabel: "ラウンドフォース"
    });

    state.storyRoundForceCooldown = 5;
    state.storyRoundForceUses += 1;

    return {
      handled: true,
      redraw: true,
      message: "ラウンドフォース発動",
      attack
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

    const maxAmmo = Number(effect.storyAmmoMax || 0);
    const before = Number(state.storyAmmo?.[slotKey] || 0);
    const amount = getReloadAmount(effect);

    state.storyAmmo[slotKey] = Math.min(maxAmmo, before + amount);

    return {
      handled: true,
      redraw: true,
      message: `${slot.label} リロード：${before}→${state.storyAmmo[slotKey]}`
    };
  }

  if (pendingChoice?.effectType === "proto_create_reload_followup") {
    const slotKey = String(selectedValue || "");

    if (slotKey === "cancel") {
      return {
        handled: true,
        redraw: true,
        message: "追撃しませんでした"
      };
    }

    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;

    if (!slot || !effect?.storyReload) {
      return { handled: true, redraw: false, message: "追撃対象が不正です" };
    }

    const costResult = spendReloadWeaponCost(state, slotKey);
    if (!costResult.ok) {
      return { handled: true, redraw: true, message: costResult.message };
    }

    if (Number(state.evade || 0) > 0) {
      reduceEvade(state, 1);
    } else {
      state.storyReloadFollowUpUsed[slotKey] = true;
    }

    const attack = buildAttackFromSlot(state, slotKey);

    return {
      handled: true,
      redraw: true,
      message: `${slot.label} 追撃`,
      attack
    };
  }

  return { handled: false, redraw: false, message: null };
}

export function onProtoCreateTurnEnd(state) {
  ensureProtoCreateState(state);

  let redraw = false;

  const beforeEnergy = state.storyEnergy;
  state.storyEnergy = Math.min(state.storyEnergyMax, state.storyEnergy + 5);
  if (state.storyEnergy !== beforeEnergy) redraw = true;

  SLOT_KEYS.forEach(slotKey => {
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
    if (!effect?.storyReload) return;

    const maxAmmo = Number(effect.storyAmmoMax || 0);
    const currentAmmo = Number(state.storyAmmo[slotKey] || 0);
    if (currentAmmo >= maxAmmo) return;

    if (effect.storyReloadPerTurn) {
      state.storyAmmo[slotKey] = Math.min(maxAmmo, currentAmmo + Number(effect.storyReloadPerTurn));
      redraw = true;
      return;
    }

    if (effect.storyReloadTurnInterval && effect.storyReloadPerInterval) {
      state.storyReloadCounters[slotKey] += 1;

      if (state.storyReloadCounters[slotKey] >= Number(effect.storyReloadTurnInterval)) {
        state.storyReloadCounters[slotKey] = 0;
        state.storyAmmo[slotKey] = Math.min(maxAmmo, currentAmmo + Number(effect.storyReloadPerInterval));
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

export function onProtoCreateBeforeSlot(state, rolledSlotNumber) {
  ensureProtoCreateState(state);

  const slotKey = `slot${rolledSlotNumber}`;
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect) return { redraw: false, message: null };

  const reloadCost = spendReloadWeaponCost(state, slotKey);
  if (!reloadCost.ok) {
    state.slots[slotKey] = buildNoFireSlot(slot, reloadCost.message);
    return { redraw: true, message: reloadCost.message };
  }

  const energyCost = spendEnergyWeaponCost(state, slotKey);
  if (!energyCost.ok) {
    state.slots[slotKey] = buildNoFireSlot(slot, energyCost.message);
    return { redraw: true, message: energyCost.message };
  }

  return { redraw: true, message: null };
}

export function onProtoCreateAfterSlotResolved(state, slotNumber, resolveResult, context = {}) {
  ensureProtoCreateState(state);

  const slotKey = `slot${slotNumber}`;
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect?.storyReload) {
    return { redraw: false, message: null };
  }

  if (!canFollowUpReloadWeapon(state, slotKey)) {
    return { redraw: false, message: null };
  }

  return {
    redraw: true,
    message: `${slot.label} は弾数が残っています`,
    requestChoice: requestReloadFollowUpChoice(state, slotKey, context)
  };
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

export function onProtoCreateActionResolved() {
  return { redraw: false, message: null };
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
