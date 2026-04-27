import { unitRulesMap } from "./js_unit_rules_index.js";

function sortSlotKeys(slotKeys) {
  return [...slotKeys].sort((a, b) => {
    const aNum = Number(String(a).replace(/^slot/, ""));
    const bNum = Number(String(b).replace(/^slot/, ""));
    return aNum - bNum;
  });
}

function normalizeSlots(slotSource) {
  const slots = {};

  if (Array.isArray(slotSource)) {
    slotSource.forEach((slot, index) => {
      const key = `slot${index + 1}`;
      slots[key] = {
        ...slot,
        key,
        ex: false
      };
    });
  } else {
    Object.entries(slotSource || {}).forEach(([key, slot]) => {
      slots[key] = {
        ...slot,
        key,
        ex: false
      };
    });
  }

  return slots;
}

function normalizeSlotOrder(slotKeys, explicitOrder = null) {
  if (Array.isArray(explicitOrder) && explicitOrder.length > 0) {
    return explicitOrder.filter((slotKey) => slotKeys.includes(slotKey));
  }

  return sortSlotKeys(slotKeys);
}

function normalizeSpecials(specialArray) {
  const specials = {};
  const specialOrder = [];

  specialArray.forEach((special, index) => {
    const key = `special${index + 1}`;
    specialOrder.push(key);
    specials[key] = {
      ...special,
      key
    };
  });

  return { specials, specialOrder };
}

function cloneSlots(slots) {
  const cloned = {};

  Object.keys(slots).forEach((slotKey) => {
    cloned[slotKey] = { ...slots[slotKey] };
  });

  return cloned;
}

function cloneSpecials(specials, specialOrder) {
  const cloned = {};

  specialOrder.forEach((specialKey) => {
    cloned[specialKey] = { ...specials[specialKey] };
  });

  return cloned;
}

function buildFallbackForms(unit) {
  return {
    base: {
      name: unit.name,
      hp: unit.hp,
      evadeMax: unit.evadeMax,
      rollableSlotOrder: null,
      ownedSlotOrder: null,
      slots: unit.slots || [],
      specials: unit.specials || []
    }
  };
}
function normalizeForms(unit) {
  const rawForms =
    unit.forms && Object.keys(unit.forms).length > 0
      ? unit.forms
      : buildFallbackForms(unit);

  const forms = {};
  const formOrder = [];

  Object.entries(rawForms).forEach(([formId, formData]) => {
    const slots = normalizeSlots(formData.slots || []);
    const slotKeys = Object.keys(slots);

    const ownedSlotOrder = normalizeSlotOrder(
      slotKeys,
      formData.ownedSlotOrder || null
    );

    const rollableSlotOrder = normalizeSlotOrder(
      slotKeys,
      formData.rollableSlotOrder || null
    );

    const { specials, specialOrder } = normalizeSpecials(formData.specials || []);

    forms[formId] = {
      formId,
      name: formData.name ?? unit.name,
      hp: typeof formData.hp === "number" ? formData.hp : unit.hp,
      evadeMax:
        typeof formData.evadeMax === "number" ? formData.evadeMax : unit.evadeMax,
      slots,
      ownedSlotOrder,
      rollableSlotOrder,
      specials,
      specialOrder
    };

    formOrder.push(formId);
  });

  return { forms, formOrder };
}

export function getCurrentFormData(state) {
  return state.forms[state.formId] || null;
}

function setBaseFromCurrentForm(state) {
  const form = getCurrentFormData(state);
  if (!form) return;

  state.baseName = form.name;
  state.name = form.name;

  state.ownedSlotOrder = [...form.ownedSlotOrder];
  state.rollableSlotOrder = [...form.rollableSlotOrder];
  state.specialOrder = [...form.specialOrder];

  state.baseSlots = cloneSlots(form.slots);
  state.baseSpecials = cloneSpecials(form.specials, form.specialOrder);

  state.slots = cloneSlots(state.baseSlots);
  state.specials = cloneSpecials(state.baseSpecials, state.specialOrder);
}

function setFormCore(state, nextFormId, options = {}) {
  const nextForm = state.forms[nextFormId];
  if (!nextForm) return false;

  const preserveHp = options.preserveHp !== false;
  const preserveEvade = options.preserveEvade !== false;

  const prevHp = state.hp;
  const prevEvade = state.evade;

  state.formId = nextFormId;

  setBaseFromCurrentForm(state);

  state.maxHp = nextForm.hp;
  state.evadeMax = nextForm.evadeMax;

  if (preserveHp) {
    state.hp = Math.min(prevHp, state.maxHp);
  } else {
    state.hp = state.maxHp;
  }

  if (preserveEvade) {
    state.evade = Math.max(0, prevEvade);
  } else {
    state.evade = state.evadeMax;
  }

  return true;
}

function resetSlotToBase(state, slotKey) {
  const base = state.baseSlots[slotKey];
  if (!base) return;

  state.slots[slotKey] = { ...base };
}

function resetAllSlotsToBase(state) {
  Object.keys(state.baseSlots).forEach((slotKey) => {
    resetSlotToBase(state, slotKey);
  });
}

function resetSpecialToBase(state, specialKey) {
  const base = state.baseSpecials[specialKey];
  if (!base) return;

  state.specials[specialKey] = { ...base };
}

function resetAllSpecialsToBase(state) {
  state.specialOrder.forEach((specialKey) => {
    resetSpecialToBase(state, specialKey);
  });
}
function applyDerivedStateResult(state, derived) {
  state.name = state.baseName;
  state.statusList = [];

  resetAllSlotsToBase(state);
  resetAllSpecialsToBase(state);

  const currentForm = getCurrentFormData(state);
  if (currentForm) {
    state.evadeMax = currentForm.evadeMax;
    state.ownedSlotOrder = [...currentForm.ownedSlotOrder];
    state.rollableSlotOrder = [...currentForm.rollableSlotOrder];
  }

  if (!derived) return;

  if (derived.name) {
    state.name = derived.name;
  }

  if (Array.isArray(derived.status)) {
    state.statusList = [...derived.status];
  }

  if (typeof derived.evadeMax === "number") {
    state.evadeMax = derived.evadeMax;
    if (state.evade > state.evadeMax) {
      state.evade = state.evadeMax;
    }
  }

  if (Array.isArray(derived.ownedSlotOrder)) {
    state.ownedSlotOrder = [...derived.ownedSlotOrder];
  }

  if (Array.isArray(derived.rollableSlotOrder)) {
    state.rollableSlotOrder = [...derived.rollableSlotOrder];
  }

  if (derived.slots) {
    Object.entries(derived.slots).forEach(([slotKey, slotData]) => {
      const current = state.slots[slotKey];
      if (!current) return;

      state.slots[slotKey] = {
        ...current,
        ...slotData
      };
    });
  }

 if (derived.specials) {
    Object.entries(derived.specials).forEach(([specialKey, specialData]) => {
      const current = state.specials[specialKey];

      if (current) {
        state.specials[specialKey] = {
          ...current,
          ...specialData,
          key: specialKey
        };
        return;
      }

      state.specials[specialKey] = {
        ...specialData,
        key: specialKey
      };

      if (!state.specialOrder.includes(specialKey)) {
        state.specialOrder.push(specialKey);
      }
    });
  }
}

function getSlotKeysByBaseOrder(baseOrder, slots) {
  return baseOrder.filter((slotKey) => !!slots[slotKey]);
}

export function getSlotByKey(state, slotKey) {
  return state.slots[slotKey];
}

export function getSlotNumberFromKey(slotKey) {
  return Number(String(slotKey).replace(/^slot/, ""));
}

export function getOwnedSlotKeys(state) {
  return getSlotKeysByBaseOrder(state.ownedSlotOrder || [], state.slots);
}

export function getRollableSlotKeys(state) {
  return getSlotKeysByBaseOrder(state.rollableSlotOrder || [], state.slots);
}

export function getPredictableSlotKeys(state) {
  return getOwnedSlotKeys(state);
}

export function getCurrentlyVisibleSlotKeys(state) {
  return getRollableSlotKeys(state);
}

export function getRandomSlotKey(state) {
  const rollableSlotKeys = getRollableSlotKeys(state);
  const slotIndex = Math.floor(Math.random() * rollableSlotKeys.length);
  return rollableSlotKeys[slotIndex];
}

export function setForm(state, nextFormId, options = {}) {
  return setFormCore(state, nextFormId, options);
}

export function getStateEffect(state, effectId) {
  return state.stateEffects[effectId] || null;
}

export function setStateEffect(state, effectId, effectData = {}) {
  state.stateEffects[effectId] = {
    id: effectId,
    ...(state.stateEffects[effectId] || {}),
    ...effectData
  };

  return state.stateEffects[effectId];
}

export function clearStateEffect(state, effectId) {
  delete state.stateEffects[effectId];
}

export function decrementStateEffectTurns(state) {
  Object.keys(state.stateEffects).forEach((effectId) => {
    const effect = state.stateEffects[effectId];
    if (!effect) return;
    if (typeof effect.turns !== "number") return;

    effect.turns--;

    if (effect.turns <= 0) {
      delete state.stateEffects[effectId];
    }
  });
}

export function tickStateEffectTurns(state) {
  Object.keys(state.stateEffects).forEach((effectId) => {
    const effect = state.stateEffects[effectId];
    if (!effect) return;
    if (typeof effect.turns !== "number") return;

    if (effect.skipNextTick) {
      effect.skipNextTick = false;
      return;
    }

    effect.turns--;

    if (effect.turns <= 0) {
      delete state.stateEffects[effectId];
    }
  });
}

export function hasStateEffect(state, effectId) {
  return !!state.stateEffects[effectId];
}

export function createBattleState(unit) {
  const { forms, formOrder } = normalizeForms(unit);

  const defaultFormId =
    unit.defaultFormId && forms[unit.defaultFormId]
      ? unit.defaultFormId
      : formOrder[0];

  const defaultForm = forms[defaultFormId];

  const initialSlots = cloneSlots(defaultForm.slots);
  const initialSpecials = cloneSpecials(defaultForm.specials, defaultForm.specialOrder);

  return {
    unitId: unit.id,

    forms,
    formOrder,
    formId: defaultFormId,

    baseName: defaultForm.name,
    name: defaultForm.name,

    hp: defaultForm.hp,
    maxHp: defaultForm.hp,
    evade: defaultForm.evadeMax,
    evadeMax: defaultForm.evadeMax,
    
    actionCount: 1,
    baseActionCount: 1,
    
    shieldCount: 3,
    shieldActive: false,

    slots: initialSlots,
    ownedSlotOrder: [...defaultForm.ownedSlotOrder],
    rollableSlotOrder: [...defaultForm.rollableSlotOrder],
    baseSlots: cloneSlots(defaultForm.slots),

    specials: initialSpecials,
    specialOrder: [...defaultForm.specialOrder],
    baseSpecials: cloneSpecials(defaultForm.specials, defaultForm.specialOrder),

    lastSlotKey: null,

    dualMode: false,

    ntTimer: 0,
    ntGuessSlotKey: null,

    lastDamageTaken: 0,

    confuseHits: 0,
    confuseStock: 0,
    isConfusedTurn: false,

    z_exRifle: false,
    z_hyperMega: false,
    z_usedExRifleThisAction: false,
    z_usedHyperMegaThisAction: false,

    z_bioSlot3Ex: false,
    z_usedBio3ExThisAction: false,

    overEvadeMode: false,
    overEvadeCap: defaultForm.evadeMax,
    overEvadeBaseMax: defaultForm.evadeMax,
    overEvadeAbsoluteMax: null,

    stateEffects: {},
    statusList: []
  };
}
export function applyUnitDerivedState(state) {
  setBaseFromCurrentForm(state);

  const rules = unitRulesMap[state.unitId];

  let derived = null;

  if (rules && rules.getDerivedState) {
    derived = rules.getDerivedState(state);
  }

  applyDerivedStateResult(state, derived);
}

export function executeUnitSpecial(state, specialKey, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.executeSpecial) {
    return rules.executeSpecial(state, specialKey, context);
  }

  return {
    handled: false,
    message: null
  };
}

export function executeUnitCanUseSpecial(state, specialKey, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.canUseSpecial) {
    return rules.canUseSpecial(state, specialKey, context);
  }

  return {
    allowed: true,
    message: null
  };
}

export function executeUnitResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.onResolveChoice) {
    return rules.onResolveChoice(state, pendingChoice, selectedValue, context);
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}

export function executeUnitModifyEvadeAttempt(defender, attacker, attack, context = {}) {
  const rules = unitRulesMap[defender.unitId];

  if (rules && rules.modifyEvadeAttempt) {
    return rules.modifyEvadeAttempt(defender, attacker, attack, context);
  }

  return {
    handled: false
  };
}

export function executeUnitTurnEnd(state, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.onTurnEnd) {
    return rules.onTurnEnd(state, context);
  }

  return {
    redraw: false,
    message: null
  };
}

export function executeUnitBeforeSlot(state, rolledSlotNumber, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.onBeforeSlot) {
    return rules.onBeforeSlot(state, rolledSlotNumber, context);
  }

  return {
    redraw: false,
    message: null
  };
}

export function executeUnitEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.onEnemyBeforeSlot) {
    return rules.onEnemyBeforeSlot(state, rolledSlotNumber, context);
  }

  return {
    redraw: false,
    message: null
  };
}


export function executeUnitAfterSlotResolved(state, slotNumber, context = {}) {
  const rules = unitRulesMap[state.unitId];

  if (rules && rules.onAfterSlotResolved) {
    return rules.onAfterSlotResolved(state, slotNumber, context);
  }

  return {
    redraw: false,
    message: null
  };
}

export function executeUnitActionResolved(attacker, defender, context = {}) {
  const rules = unitRulesMap[attacker.unitId];

  if (rules && rules.onActionResolved) {
    return rules.onActionResolved(attacker, defender, context);
  }

  return {
    redraw: false,
    message: null
  };
}

export function executeUnitOnDamaged(defender, attacker) {
  const rules = unitRulesMap[defender.unitId];

  if (rules && rules.onDamaged) {
    return rules.onDamaged(defender, attacker);
  }

  return {
    redraw: false,
    message: null
  };
}

export function executeUnitModifyTakenDamage(defender, attacker, attack, damage) {
  const rules = unitRulesMap[defender.unitId];

  if (rules && rules.modifyTakenDamage) {
    return rules.modifyTakenDamage(defender, attacker, attack, damage);
  }

  return {
    damage,
    message: null
  };
}
