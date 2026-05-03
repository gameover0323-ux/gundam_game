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

  if (!state.cpuZakuIiSoldierBoosted) return;

  const slotKey = state.cpuZakuIiSoldierBoostSlotKey;
  const slot = slotKey ? state.slots?.[slotKey] : null;

  if (slot?.effect?.type === "attack") {
    slot.effect.damage = state.cpuZakuIiSoldierOriginalDamage;
  }

  state.cpuZakuIiSoldierBoosted = false;
  state.cpuZakuIiSoldierOriginalDamage = 0;
  state.cpuZakuIiSoldierBoostSlotKey = "";
}

export function getCpuZakuIiSoldierDerivedState(state) {
  ensureCpuZakuIiSoldierState(state);

  return {
    status: [
      "CPU専用：初心者向け",
      "特性：10%の確率で与ダメージ2倍"
    ],
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_zaku_ii_soldier_traits",
        timing: "auto",
        actionType: "auto",
        desc: "10%の確率で与えるダメージが2倍になる。"
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
    message: "ザクⅡ特性：与ダメージ2倍"
  };
}

export function onCpuZakuIiSoldierActionResolved(state) {
  ensureCpuZakuIiSoldierState(state);

  if (!state.cpuZakuIiSoldierBoosted) {
    return { redraw: false, message: null };
  }

  restoreCpuZakuIiSoldierBoost(state);

  return { redraw: true, message: null };
}

export function onCpuZakuIiSoldierAfterSlotResolved(state) {
  ensureCpuZakuIiSoldierState(state);
  restoreCpuZakuIiSoldierBoost(state);

  return { redraw: true, message: null };
}
