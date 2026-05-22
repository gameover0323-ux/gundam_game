function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function getEnemyPlayer(context) {
  return context?.enemyPlayer || null;
}

function getRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getEvade && ownerPlayer) {
    return adapter.getEvade(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.evade || 0));
}

function consumeRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, amount);
  }

  if (!state || Number(state.evade || 0) < amount) return false;
  state.evade = Math.max(0, Number(state.evade || 0) - amount);
  return true;
}

function addRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, amount);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + amount;
  return amount;
}

function damageEnemyRuleHp(attacker, amount, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.damageHp && enemyPlayer) {
    return adapter.damageHp(enemyPlayer, attacker, amount);
  }

  if (attacker) {
    attacker.hp = Math.max(0, Number(attacker.hp || 0) - amount);
  }

  return amount;
}

export function getGundamMcDerivedState(state) {
  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.dualMode) {
    result.slots.slot4 = {
      label: "4EX ビームサーベル 40ダメージ×2回",
      desc: "40ダメージ×2回 軽減不可。格闘",
      ex: true,
      effect: {
        type: "attack",
        attackType: "melee",
        damage: 40,
        count: 2,
        ignoreReduction: true
      }
    };

    result.status.push("二刀流");
  }

  if (state.hp <= 50) {
    result.slots.slot5 = {
      label: "EX ラストシューティング",
      desc: "150ダメージ。射撃、ビーム属性",
      ex: true,
      effect: {
        type: "attack",
        attackType: "shoot",
        damage: 150,
        count: 1,
        beam: true
      }
    };
  }

  if (state.ntGuessSlotKey) {
    result.status.push("ニュータイプ予測中");
  }

  return result;
}

export function executeGundamMcSpecial(state, specialKey, context = {}) {
  const special = state.specials[specialKey];

  if (!special) {
    return {
      handled: true,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "toggle_dual_mode") {
    if (state.shieldCount > 0) {
      return {
        handled: true,
        redraw: true,
        message: null
      };
    }

    state.dualMode = !state.dualMode;

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "choice_extra_weapon") {
    if (getRuleEvade(state, context) < 2) {
      return {
        handled: true,
        redraw: false,
        message: null
      };
    }

    return {
      handled: true,
      redraw: false,
      message: null,
      requestChoice: {
        choiceType: "slot_select",
        source: "extra_weapon",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: `PLAYER ${context.ownerPlayer} 追加武装選択`,
        slotKeys: ["slot7", "slot8"]
      }
    };
  }

  return {
    handled: false,
    message: null
  };
}

export function onGundamMcTurnEnd(state, context = {}) {
  state.ntTimer++;

  if (state.ntTimer >= 3) {
    state.ntTimer = 0;

    return {
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "slot_predict",
        source: "nt_prediction",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: `PLAYER ${context.ownerPlayer} ニュータイプ感性`,
        slotKeys: context.enemyPredictableSlotKeys || []
      }
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onGundamMcBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onGundamMcEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  if (
    state.ntGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.ntGuessSlotKey === context.enemyRolledSlotKey
  ) {
    addRuleEvade(state, 3, context);
    state.ntGuessSlotKey = null;

    return {
      redraw: true,
      message: `${state.name} ニュータイプ予測成功！回避+3`
    };
  }

  state.ntGuessSlotKey = null;

  return {
    redraw: false,
    message: null
  };
}

export function onGundamMcDamaged(defender, attacker, context = {}) {
  if (defender.hp <= 20 && defender.lastDamageTaken >= 30) {
    damageEnemyRuleHp(attacker, 150, context);

    return {
      redraw: true,
      message: attacker.hp <= 0
        ? `${defender.name} ラストシューティング勝利！`
        : "ラストシューティング発動！"
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onGundamMcAfterSlotResolved(state, slotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onGundamMcActionResolved(attacker, defender, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyGundamMcTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function onGundamMcResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  if (pendingChoice.source === "extra_weapon") {
    if (!consumeRuleEvade(state, 2, context)) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: selectedValue
      }
    };
  }

  if (pendingChoice.source === "nt_prediction") {
    state.ntGuessSlotKey = selectedValue;

    return {
      handled: true,
      redraw: true,
      message: "予測を設定した"
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
