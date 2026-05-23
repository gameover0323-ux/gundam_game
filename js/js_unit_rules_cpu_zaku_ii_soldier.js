function ensureCpuZakuIiSoldierState(state) {
  if (typeof state.cpuZakuIiSoldierBoosted !== "boolean") {
    state.cpuZakuIiSoldierBoosted = false;
  }

  if (typeof state.cpuZakuIiSoldierOriginalDamage !== "number") {
    state.cpuZakuIiSoldierOriginalDamage = 0;
  }

  if (typeof state.cpuZakuIiSoldierBoostSlotKey !== "string") {
    state.cpuZakuIiSoldierBoostSlotKey = "";
  }
}

function restoreCpuZakuIiSoldierBoost(state) {
  ensureCpuZakuIiSoldierState(state);

  if (!state.cpuZakuIiSoldierBoosted) return false;

  const slotKey = state.cpuZakuIiSoldierBoostSlotKey;
  const slot = slotKey ? state.slots?.[slotKey] : null;

  if (slot?.effect?.type === "attack") {
    slot.effect.damage = state.cpuZakuIiSoldierOriginalDamage;
  }

  state.cpuZakuIiSoldierBoosted = false;
  state.cpuZakuIiSoldierOriginalDamage = 0;
  state.cpuZakuIiSoldierBoostSlotKey = "";

  return true;
}

export function getCpuZakuIiSoldierDerivedState(state) {
  ensureCpuZakuIiSoldierState(state);

  return {
    status: [
      "難易度☆",
      "特性：攻撃時、まれに与ダメージが大きく上がる"
    ],
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_zaku_ii_soldier_traits",
        timing: "auto",
        actionType: "auto",
        desc: "攻撃時、まれに与えるダメージが大きく上がる。"
      }
    },
    slots: {}
  };
}

export function onCpuZakuIiSoldierBeforeSlot(state, slotNumber, context = {}) {
  ensureCpuZakuIiSoldierState(state);
  restoreCpuZakuIiSoldierBoost(state);

  const slot = context.slot;
  if (!slot || slot.effect?.type !== "attack") {
    return { redraw: false, message: null };
  }

  if (Math.random() >= 0.1) {
    return { redraw: false, message: null };
  }

  state.cpuZakuIiSoldierBoosted = true;
  state.cpuZakuIiSoldierOriginalDamage = Number(slot.effect.damage || 0);
  state.cpuZakuIiSoldierBoostSlotKey = context.slotKey || state.lastSlotKey || "";

  slot.effect.damage = state.cpuZakuIiSoldierOriginalDamage * 2;

  return {
    redraw: true,
    message: "ザクⅡ特性：与ダメージ上昇"
  };
}

export function onCpuZakuIiSoldierActionResolved(state) {
  ensureCpuZakuIiSoldierState(state);

  const restored = restoreCpuZakuIiSoldierBoost(state);

  return {
    redraw: restored,
    message: null
  };
}

export function onCpuZakuIiSoldierAfterSlotResolved(state) {
  ensureCpuZakuIiSoldierState(state);

  const restored = restoreCpuZakuIiSoldierBoost(state);

  return {
    redraw: restored,
    message: null
  };
}
