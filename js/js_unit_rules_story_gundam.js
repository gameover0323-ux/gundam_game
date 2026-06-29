function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
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

export function getStoryGundamDerivedState(state) {
  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.ntGuessSlotKey) {
    result.status.push("ニュータイプ予測中");
  }

  return result;
}

export function canUseStoryGundamSpecial(state, specialKey, context = {}) {
  return true;
}

export function executeStoryGundamSpecial(state, specialKey, context = {}) {
  return {
    handled: false,
    message: null
  };
}

export function onStoryGundamTurnEnd(state, context = {}) {
  if (typeof state.ntTimer !== "number") state.ntTimer = 0;

  state.ntTimer++;

  if (state.ntTimer >= 5) {
    state.ntTimer = 0;

    return {
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "slot_predict",
        source: "story_gundam_nt_prediction",
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

export function onStoryGundamBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryGundamEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  if (
    state.ntGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.ntGuessSlotKey === context.enemyRolledSlotKey
  ) {
    addRuleEvade(state, 3, context);
    state.ntGuessSlotKey = null;
    state.storyGundamNtSuccessCount = Number(state.storyGundamNtSuccessCount || 0) + 1;

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

export function onStoryGundamAfterSlotResolved(state, slotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryGundamActionResolved(attacker, defender, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStoryGundamDamaged(defender, attacker, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyStoryGundamTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function modifyStoryGundamEvadeAttempt(defender, attacker, attack, context = {}) {
  return null;
}

export function onStoryGundamResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  if (pendingChoice.source === "story_gundam_nt_prediction") {
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
