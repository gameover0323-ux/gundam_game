import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect
} from "./js_unit_runtime.js";

function clearOverEvadeState(state) {
  state.overEvadeMode = false;
  state.overEvadeCap = state.evadeMax;
  state.overEvadeBaseMax = state.evadeMax;
  state.overEvadeAbsoluteMax = 12;
}

function refreshOverEvadeStateForCurrentForm(state, options = {}) {
  state.overEvadeAbsoluteMax = 12;

  const preserveWrOrigin =
    options.preserveWrOrigin === true ||
    (
      state.overEvadeMode === true &&
      typeof state.overEvadeBaseMax === "number" &&
      state.overEvadeBaseMax >= 12
    );

  if (state.formId === "wr") {
    if (state.evade > state.evadeMax) {
      state.overEvadeMode = true;
      state.overEvadeCap = Math.min(state.evade, 12);
      state.overEvadeBaseMax = 12;
      return;
    }

    clearOverEvadeState(state);
    state.overEvadeBaseMax = 12;
    return;
  }

  if (state.evade > state.evadeMax) {
    state.overEvadeMode = true;
    state.overEvadeCap = Math.min(state.evade, 12);
    state.overEvadeBaseMax = preserveWrOrigin ? 12 : state.evadeMax;
    return;
  }

  clearOverEvadeState(state);
}


function activateBiosensor(state) {
  const prevEvade = state.evade;
  const prevEvadeMax = state.evadeMax;
  const prevOverEvadeMode = state.overEvadeMode === true;
  const prevOverEvadeCap =
    typeof state.overEvadeCap === "number" ? state.overEvadeCap : prevEvadeMax;
  const prevOverEvadeBaseMax =
    typeof state.overEvadeBaseMax === "number" ? state.overEvadeBaseMax : prevEvadeMax;

  let carryCap;
  let carryBaseMax;

  if (prevOverEvadeMode) {
    carryCap = prevOverEvadeCap;
    carryBaseMax = prevOverEvadeBaseMax;
  } else {
    carryCap = Math.min(prevEvade, prevEvadeMax);
    carryBaseMax = prevEvadeMax;
  }

  const changed = setForm(state, "bio", {
    preserveHp: true,
    preserveEvade: true
  });

  if (!changed) {
    return false;
  }

  setStateEffect(state, "z_biosensor", {
    turns: 3,
    skipNextTick: true
  });

  state.z_bioSlot3Ex = false;
  state.z_usedBio3ExThisAction = false;

  if (carryCap > state.evadeMax) {
    state.evade = Math.min(prevEvade, carryCap);
    state.overEvadeMode = true;
    state.overEvadeCap = carryCap;
    state.overEvadeBaseMax = carryBaseMax;
  } else {
    state.evade = Math.min(prevEvade, state.evadeMax);
    clearOverEvadeState(state);
  }

  return true;
}

function endBiosensor(state) {
  clearStateEffect(state, "z_biosensor");

  const changed = setForm(state, "ms", {
    preserveHp: true,
    preserveEvade: true
  });

  if (!changed) {
    return false;
  }

  state.z_bioSlot3Ex = false;
  state.z_usedBio3ExThisAction = false;

  refreshOverEvadeStateForCurrentForm(state);
  return true;
}

export function getZGundamDerivedState(state) {
  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

if (state.formId === "ms") {
    const nextSureHit = getStateEffect(state, "z_bio_next_sure_hit");

    if (state.z_exRifle) {
      result.slots.slot1 = {
        label: "ビームコンフューズ 30ダメージ×3回",
        desc: "30ダメージ×3回。射撃、ビーム属性。相手の次のターンの攻撃を命中回数分無効化する。",
        effect: {
          type: "attack",
          damage: 30,
          count: 3,
          attackType: "shoot",
          beam: true
        },
        ex: true
      };
    }

    if (state.z_hyperMega) {
      result.slots.slot6 = {
        label: "ハイメガキャノン 110ダメージ",
        desc: "110ダメージ。射撃属性。1度使用すると6に切り替わる。",
        effect: {
          type: "attack",
          damage: 110,
          count: 1,
          attackType: "shoot",
          beam: false
        },
        ex: true
      };
    }

    if (nextSureHit) {
      if (nextSureHit.pendingActivation) {
        result.status.push("次ターン攻撃: 必中待機");
      } else {
        result.status.push("このターンの攻撃: 必中");
      }
    }

    if (nextSureHit && !nextSureHit.pendingActivation) {
      ["slot1", "slot2", "slot3", "slot6"].forEach((slotKey) => {
        const current = result.slots[slotKey] || {};
        const baseSlot = state.baseSlots[slotKey];

        result.slots[slotKey] = {
          ...current,
          effect: {
            ...(baseSlot?.effect || {}),
            ...(current.effect || {}),
            cannotEvade: true,
            addedCannotEvade: true
          }
        };
      });
    }

    return result;
  }

  if (state.formId === "bio") {
    const bioEffect = getStateEffect(state, "z_biosensor");
    const nextSureHit = getStateEffect(state, "z_bio_next_sure_hit");

    result.name = "Zガンダム(バイオセンサー)";

    if (bioEffect && typeof bioEffect.turns === "number") {
      result.status.push(`バイオセンサー残り行動ターン:${bioEffect.turns}`);
    }

    if (nextSureHit) {
      if (nextSureHit.pendingActivation) {
        result.status.push("次ターン攻撃: 必中待機");
      } else {
        result.status.push("このターンの攻撃: 必中");
      }
    }

    if (state.z_bioSlot3Ex) {
      result.slots.slot3 = {
        label: "3EX ハイパービームサーベル両断 150ダメージ",
        desc: "150ダメージ。格闘、ビーム属性。当たった時、バイオセンサー状態を3ターン延長する。",
          effect: {
          type: "attack",
          damage: 150,
          count: 1,
          attackType: "melee",
          beam: true,
          cannotEvade: !!(nextSureHit && !nextSureHit.pendingActivation),
          addedCannotEvade: !!(nextSureHit && !nextSureHit.pendingActivation)
        },
        ex: true
      };
    }

    if (nextSureHit && !nextSureHit.pendingActivation) {
      ["slot3", "slot4", "slot5", "slot6"].forEach((slotKey) => {
        const current = result.slots[slotKey] || {};
        const baseSlot = state.baseSlots[slotKey];

        result.slots[slotKey] = {
          ...current,
          effect: {
            ...(baseSlot?.effect || {}),
            ...(current.effect || {}),
            cannotEvade: true,
            addedCannotEvade: true
          }
        };
      });
    }

    result.specials.special1 = {
      name: "特性",
      effectType: "trait",
      timing: "passive",
      actionType: "auto",
      desc:
        "【特性】相手からのダメージを30軽減する。<br>" +
        "【特性】ビーム属性ダメージを半減する。<br>" +
        "【特性】そのターンにZガンダム(バイオセンサー)が発動した攻撃を完全回避された時、相手の回避を0にする。"
    };

    result.specials.special2 = {
      name: "シールド",
      effectType: "shield",
      timing: "reaction",
      actionType: "instant",
      desc: "相手の攻撃時、3回だけ1ターンに受けるダメージを半減する。"
    };

    return result;
  }

  return result;
}

export function executeZGundamSpecial(state, specialKey, context = {}) {
  const special = state.specials[specialKey];

  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "transform_wr") {
    const changed = setForm(state, "wr", {
      preserveHp: true,
      preserveEvade: true
    });

    if (!changed) {
      return {
        handled: true,
        redraw: false,
        message: "ウェイブライダー変形に失敗"
      };
    }

    refreshOverEvadeStateForCurrentForm(state, {
      preserveWrOrigin: true
    });

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "transform_ms") {
    const preserveWrOrigin =
      state.formId === "wr" &&
      typeof state.evade === "number" &&
      state.evade > 5;

    const changed = setForm(state, "ms", {
      preserveHp: true,
      preserveEvade: true
    });

    if (!changed) {
      return {
        handled: true,
        redraw: false,
        message: "Zガンダムへの変形に失敗"
      };
    }

    refreshOverEvadeStateForCurrentForm(state, {
      preserveWrOrigin
    });

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}

export function onZGundamTurnEnd(state, context = {}) {
  const sureHit = getStateEffect(state, "z_bio_next_sure_hit");
  if (sureHit && sureHit.activeForTurn) {
    clearStateEffect(state, "z_bio_next_sure_hit");
  }

  const bioEffect = getStateEffect(state, "z_biosensor");

  if (!bioEffect) {
    return {
      redraw: !!sureHit,
      message: null
    };
  }

  if (bioEffect.skipNextTick) {
    bioEffect.skipNextTick = false;
    return {
      redraw: true,
      message: null
    };
  }

  bioEffect.turns--;

  if (bioEffect.turns > 0) {
    return {
      redraw: true,
      message: null
    };
  }

  endBiosensor(state);

  return {
    redraw: true,
    message: null
  };
}

export function onZGundamBeforeSlot(state, rolledSlotNumber, context = {}) {
  let redraw = false;

  state.z_usedExRifleThisAction = false;
  state.z_usedHyperMegaThisAction = false;
  state.z_usedBio3ExThisAction = false;

  const sureHit = getStateEffect(state, "z_bio_next_sure_hit");
  if (sureHit && sureHit.pendingActivation) {
    sureHit.pendingActivation = false;
    sureHit.activeForTurn = true;
    redraw = true;
  }

  if (state.formId === "ms") {
    if (rolledSlotNumber === 1 && state.z_exRifle) {
      state.z_exRifle = false;
      state.z_usedExRifleThisAction = true;
      redraw = true;
    }

    if (rolledSlotNumber === 6 && state.z_hyperMega) {
      state.z_hyperMega = false;
      state.z_usedHyperMegaThisAction = true;
      redraw = true;
    }

    return {
      redraw,
      message: null
    };
  }
  if (state.formId === "bio") {
    if (rolledSlotNumber === 3 && state.z_bioSlot3Ex) {
      state.z_bioSlot3Ex = false;
      state.z_usedBio3ExThisAction = true;
      redraw = true;
    }

    return {
      redraw,
      message: null
    };
  }

  return {
    redraw,
    message: null
  };
}

export function onZGundamEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onZGundamAfterSlotResolved(state, slotNumber, context = {}) {
  const resolveResult = context.resolveResult || null;

  if (state.formId === "ms") {
    if (
      slotNumber === 5 &&
      resolveResult &&
      resolveResult.kind === "custom" &&
      resolveResult.customEffectId === "biosensor_activate"
    ) {
      const changed = activateBiosensor(state);

      return {
        redraw: changed,
        message: changed ? "バイオセンサー起動" : "バイオセンサー起動失敗"
      };
    }

    if (slotNumber === 6 && resolveResult && resolveResult.kind === "heal") {
      state.z_hyperMega = true;

      return {
        redraw: true,
        message: `${state.name} 6が6EXに変化`
      };
    }

    return {
      redraw: false,
      message: null
    };
  }

  if (state.formId === "bio") {
    return {
      redraw: false,
      message: null
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onZGundamActionResolved(attacker, defender, context = {}) {
  if (attacker.formId === "ms") {
    if (context.slotNumber === 3 && context.allEvaded) {
      attacker.z_exRifle = true;

      return {
        redraw: true,
        message: `${attacker.name} 1が1EXに変化`
      };
    }

    const isExConfuseAttack =
      context.slotKey === "slot1" && attacker.z_usedExRifleThisAction;

    if (isExConfuseAttack && context.hitCount > 0) {
      defender.confuseStock = (defender.confuseStock || 0) + context.hitCount;

      return {
        redraw: true,
        message: `攻撃無効${context.hitCount}回付与`
      };
    }

    return {
      redraw: false,
      message: null
    };
  }

  if (attacker.formId === "bio") {
    const messages = [];
    let redraw = false;

    if (context.slotNumber === 3 && context.hitCount > 0 && !attacker.z_usedBio3ExThisAction) {
      attacker.z_bioSlot3Ex = true;
      redraw = true;
      messages.push("Zガンダム(バイオセンサー) 3が3EXに変化");
    }

    if (attacker.z_usedBio3ExThisAction && context.hitCount > 0) {
      const bioEffect = getStateEffect(attacker, "z_biosensor");
      if (bioEffect) {
        bioEffect.turns += 3;
        redraw = true;
        messages.push("バイオセンサー状態を3ターン延長");
      }
    }

    if (context.slotNumber === 4 && context.hitCount > 0) {
      setStateEffect(attacker, "z_bio_next_sure_hit", {
        turns: 1,
        pendingActivation: true,
        activeForTurn: false
      });
      redraw = true;
      messages.push("次ターン中の攻撃が必中");
    }

    if (context.slotNumber === 5 && context.hitCount > 0) {
      defender.confuseStock = (defender.confuseStock || 0) + context.hitCount;
      redraw = true;
      messages.push(`攻撃無効${context.hitCount}回付与`);
    }

    if (context.slotNumber === 6 && context.hitCount > 0) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 50);
      redraw = true;
      messages.push("50回復");
    }

    const wasAttackAction =
      context.totalCount > 0 &&
      ["slot3", "slot4", "slot5", "slot6"].includes(context.slotKey);

    if (wasAttackAction && context.allEvaded) {
      defender.evade = 0;
      redraw = true;
      messages.push("完全回避されたため相手の回避を0にした");
    }

    return {
      redraw,
      message: messages.length > 0 ? messages.join("<br>") : null
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onZGundamDamaged(defender, attacker) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyZGundamTakenDamage(defender, attacker, attack, damage) {
  if (defender.formId !== "bio") {
    return {
      damage,
      message: null
    };
  }

  if (attack && attack.ignoreReduction) {
    return {
      damage,
      message: null
    };
  }

  let finalDamage = damage;

  finalDamage = Math.max(0, finalDamage - 30);

  if (attack && attack.beam) {
    finalDamage = Math.floor(finalDamage / 2);
  }

  return {
    damage: finalDamage,
    message: null
  };
}
