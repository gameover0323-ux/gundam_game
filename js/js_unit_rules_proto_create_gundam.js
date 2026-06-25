const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function ensureProtoCreateState(state) {
  if (!state) return;

  if (typeof state.storyEnergyMax !== "number") {
    state.storyEnergyMax = Number(state.baseForm?.storyEnergyMax || state.storyEnergyMax || 100);
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

  if (typeof state.storyRoundForceCooldown !== "number") {
    state.storyRoundForceCooldown = 0;
  }

  if (typeof state.storyRoundForceUses !== "number") {
    state.storyRoundForceUses = 0;
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
      message: "リロード対象選択UIは次段階で接続します"
    };
  }

  if (special.effectType === "story_energy_charge") {
    return {
      handled: true,
      redraw: true,
      message: "エネルギーチャージ量が未確定のため、処理は次段階で接続します"
    };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
    if (!String(special.name || "").includes("シールド")) {
      return {
        handled: true,
        redraw: false,
        message: "装備品がありません"
      };
    }

    if (state.storyShieldUses <= 0) {
      return {
        handled: true,
        redraw: false,
        message: "シールド残数がありません"
      };
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
      message: `エネルギー調整 +${state.storyEnergyAdjustStacks}`
    };
  }

  if (special.effectType === "story_create_skill") {
    if (!String(special.name || "").includes("ラウンドフォース")) {
      return {
        handled: true,
        redraw: false,
        message: "クリエイトスキルがありません"
      };
    }

    if (state.storyRoundForceCooldown > 0) {
      return {
        handled: true,
        redraw: false,
        message: `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン`
      };
    }

    return {
      handled: true,
      redraw: true,
      message: "ラウンドフォース攻撃処理は次段階で接続します"
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

  return {
    redraw,
    message: null
  };
}

export function onProtoCreateBeforeSlot(state, rolledSlotNumber) {
  ensureProtoCreateState(state);

  const slotKey = `slot${rolledSlotNumber}`;
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!effect) return { redraw: false, message: null };

  const messages = [];
  let redraw = false;

  if (effect.storyReload) {
    const ammoCost = Number(effect.storyAmmoCostPerUse || 0);
    const currentAmmo = Number(state.storyAmmo[slotKey] || 0);

    if (currentAmmo < ammoCost) {
      messages.push(`${slot.label} 弾切れ`);
    } else {
      state.storyAmmo[slotKey] = currentAmmo - ammoCost;
      redraw = true;
    }
  }

  if (effect.storyEnergy) {
    const energyCost = Number(effect.storyEnergyCost || 0);

    if (state.storyEnergy < energyCost) {
      messages.push(`${slot.label} EN不足`);
    } else {
      state.storyEnergy -= energyCost;
      redraw = true;
    }
  }

  return {
    redraw,
    message: messages.length ? messages.join("\n") : null
  };
}

export function modifyProtoCreateTakenDamage(defender, attacker, attack, damage) {
  ensureProtoCreateState(defender);

  if (defender.storyShieldActive) {
    return {
      damage: Math.floor(Number(damage || 0) / 2),
      message: null
    };
  }

  return {
    damage,
    message: null
  };
}

export function onProtoCreateAfterSlotResolved() {
  return { redraw: false, message: null };
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

export function modifyProtoCreateEvadeAttempt(state, attack, canEvade) {
  return {
    canEvade,
    message: null
  };
}
