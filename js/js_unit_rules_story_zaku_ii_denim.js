function getRolledSlotKey(rolledSlotNumber, context = {}) {
  if (context.rolledSlotKey) return context.rolledSlotKey;
  if (context.ownerRolledSlotKey) return context.ownerRolledSlotKey;
  if (typeof rolledSlotNumber === "string" && rolledSlotNumber.startsWith("slot")) {
    return rolledSlotNumber;
  }

  const n = Number(rolledSlotNumber);
  if (Number.isFinite(n) && n >= 1) return `slot${n}`;

  return null;
}

function cloneSlot(slot) {
  return {
    ...slot,
    effect: slot?.effect ? { ...slot.effect } : slot?.effect
  };
}

function doubleSlot(slot) {
  if (!slot?.effect) return slot;

  const next = cloneSlot(slot);
  const effect = next.effect;

  if (effect.type === "attack") {
    effect.count = Math.max(1, Number(effect.count || 1) * 2);
    next.label = `${slot.label}×2`;
    next.desc = `${slot.desc || slot.label} / 激昂で2回行動`;
    return next;
  }

  if (effect.type === "heal") {
    effect.amount = Number(effect.amount || 0) * 2;
    next.label = `${slot.label}×2`;
    next.desc = `${slot.desc || slot.label} / 激昂で2回行動`;
    return next;
  }

  if (effect.type === "evade") {
    effect.amount = Number(effect.amount || 0) * 2;
    next.label = `${slot.label}×2`;
    next.desc = `${slot.desc || slot.label} / 激昂で2回行動`;
    return next;
  }

  return next;
}

export function getStoryZakuIiDenimDerivedState(state) {
  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.denimRageActive) {
    result.status.push("激昂");

    const slots = state.slots || {};
    ["slot1", "slot2", "slot3", "slot4", "slot5"].forEach(slotKey => {
      if (slots[slotKey]) {
        result.slots[slotKey] = doubleSlot(slots[slotKey]);
      }
    });
  }

  return result;
}

export function canUseStoryZakuIiDenimSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryZakuIiDenimSpecial(state, specialKey, context = {}) {
  return {
    handled: false,
    message: null
  };
}

export function onStoryZakuIiDenimTurnEnd(state, context = {}) {
  if (state.denimRageActive) {
    state.denimRageActive = false;

    if (state.denimRageNextTurn) {
      state.denimRageNextTurn = false;
      state.denimRageActive = true;
      return {
        redraw: true,
        message: `${state.name} は激昂状態を継続！`
      };
    }

    return {
      redraw: true,
      message: `${state.name} の激昂が終了した`
    };
  }

  if (state.denimRageNextTurn) {
    state.denimRageNextTurn = false;
    state.denimRageActive = true;

    return {
      redraw: true,
      message: `${state.name} は激昂した！ 次のターンのみスロット効果2倍`
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiDenimBeforeSlot(state, rolledSlotNumber, context = {}) {
  const slotKey = getRolledSlotKey(rolledSlotNumber, context);

  if (slotKey === "slot6") {
    state.denimRageNextTurn = true;

    return {
      redraw: true,
      message: `${state.name} は激昂した！ 次のターンのみスロット効果2倍`
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiDenimEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiDenimAfterSlotResolved(state, slotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiDenimActionResolved(attacker, defender, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryZakuIiDenimDamaged(defender, attacker, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyStoryZakuIiDenimTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function modifyStoryZakuIiDenimEvadeAttempt(defender, attacker, attack, context = {}) {
  return null;
}

export function onStoryZakuIiDenimResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  return {
    handled: false,
    redraw: false,
    message: null
  };
}
