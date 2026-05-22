import { setForm } from "./js_unit_runtime.js";

function ensureJeganState(state) {
  if (!state) return;
  if (typeof state.jeganForcedActionReady !== "boolean") state.jeganForcedActionReady = false;
  if (typeof state.jeganTurnCount !== "number") state.jeganTurnCount = 0;
  if (typeof state.jeganStarkTurns !== "number") state.jeganStarkTurns = 0;
  if (typeof state.jeganEscortTurns !== "number") state.jeganEscortTurns = 0;
  if (typeof state.jeganSlot6Mode !== "string") state.jeganSlot6Mode = "stark";
  if (typeof state.jeganStarkRightUsed !== "boolean") state.jeganStarkRightUsed = false;
  if (typeof state.jeganEscortRightUsed !== "boolean") state.jeganEscortRightUsed = false;
  if (typeof state.jeganStarkBarrierUsed !== "boolean") state.jeganStarkBarrierUsed = false;
  if (typeof state.jeganEscortBarrierUsed !== "boolean") state.jeganEscortBarrierUsed = false;
  if (typeof state.jeganEwacBroken !== "boolean") state.jeganEwacBroken = false;
  if (typeof state.jeganEwacEscapeUsed !== "boolean") state.jeganEwacEscapeUsed = false;
  if (typeof state.jeganLimiterTurns !== "number") state.jeganLimiterTurns = 0;
  if (typeof state.jeganLimiterRestTurns !== "number") state.jeganLimiterRestTurns = 0;
  if (typeof state.jeganStarkLimiterActive !== "boolean") state.jeganStarkLimiterActive = false;
  if (typeof state.jeganShieldHalfCount !== "number") state.jeganShieldHalfCount = 3;
  if (typeof state.jeganShieldActive !== "boolean") state.jeganShieldActive = false;
  if (typeof state.jeganBarrierTurns !== "number") state.jeganBarrierTurns = 0;
  if (typeof state.jeganAssaultGuessSlotKey !== "string") state.jeganAssaultGuessSlotKey = "";
  if (typeof state.jeganEwacGuessSlotKey !== "string") state.jeganEwacGuessSlotKey = "";
  if (typeof state.jeganEwacGrenadeBonus !== "number") state.jeganEwacGrenadeBonus = 0;
  if (typeof state.jeganEwacSupportFireCount !== "number") state.jeganEwacSupportFireCount = 0;
  if (typeof state.jeganEwacSupportFireUsedThisTurn !== "boolean") state.jeganEwacSupportFireUsedThisTurn = false;
}

function consumeAction(state, amount = 1) {
  if (!state) return false;
  if (typeof state.actionCount !== "number") state.actionCount = 1;
  if (state.actionCount < amount) return false;
  state.actionCount -= amount;
  return true;
}

function canPayHp(state, amount) {
  return state && Number(state.hp || 0) > amount;
}

function payHp(state, amount) {
  state.hp = Math.max(1, Number(state.hp || 0) - amount);
}

function getAdapter(context) {
  return context?.twoVtwoAdapter || null;
}

function getOwnerPlayer(context) {
  return context?.ownerPlayer || null;
}

function getEnemyPlayer(context) {
  return context?.enemyPlayer || null;
}

function getRuleEvade(state, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getEvade && ownerPlayer) {
    return adapter.getEvade(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.evade || 0));
}

function consumeRuleEvade(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, amount);
  }

  if (!state || Number(state.evade || 0) < amount) return false;
  state.evade -= amount;
  return true;
}

function addRuleEvade(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, amount);
  }

  state.evade = Math.max(0, Number(state.evade || 0)) + amount;
  return amount;
}

function getRuleActionCount(state, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getActionCount && ownerPlayer) {
    return adapter.getActionCount(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.actionCount || 0));
}

function consumeRuleAction(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeAction && ownerPlayer) {
    return adapter.consumeAction(ownerPlayer, state, amount);
  }

  return consumeAction(state, amount);
}

function addRuleAction(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, amount);
  }

  state.actionCount = Math.max(0, Number(state.actionCount || 0)) + amount;
  return amount;
}

function setRuleActionAtLeast(state, amount, context) {
  const current = getRuleActionCount(state, context);
  if (current >= amount) return 0;
  return addRuleAction(state, amount - current, context);
}

function canPayRuleHp(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getUnifiedHp && adapter?.isUnifiedOwner?.(ownerPlayer)) {
    const team = adapter.getOwnerTeam(ownerPlayer);
    return adapter.getUnifiedHp(team) > amount;
  }

  return canPayHp(state, amount);
}

function payRuleHp(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeHp && ownerPlayer) {
    return adapter.consumeHp(ownerPlayer, state, amount);
  }

  payHp(state, amount);
  return true;
}

function healRuleHp(state, amount, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, amount);
  }

  state.hp = Math.min(state.maxHp, Number(state.hp || 0) + amount);
  return amount;
}

function zeroOwnRuleEvade(state, context) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.zeroEvade && ownerPlayer) {
    return adapter.zeroEvade(ownerPlayer, state);
  }

  if (state) state.evade = 0;
  return true;
}

function zeroEnemyRuleEvade(defender, context) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.zeroEvade && enemyPlayer) {
    return adapter.zeroEvade(enemyPlayer, defender);
  }

  if (defender) defender.evade = 0;
  return true;
}

function changeForm(state, formId, options = {}) {
  setForm(state, formId, {
    preserveHp: options.preserveHp !== false,
    preserveEvade: options.preserveEvade !== false
  });
}

function hasSupportFirePending(state) {
  if (!state || !Array.isArray(state.pendingReservedActions)) return false;
  return state.pendingReservedActions.some(action =>
    action.id && String(action.id).startsWith("jegan_ewac_support_")
  );
}
export function getJeganDerivedState(state) {
  ensureJeganState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (!state.stateEffects) state.stateEffects = {};

  if (state.formId === "base") {
    if (state.jeganEwacBroken) {
      result.slots.slot1 = {
        label: "1EX ビームライフル 70ダメージ",
        desc: "70ダメージ。射撃、ビーム属性",
        ex: true,
        effect: {
          type: "attack",
          attackType: "shoot",
          damage: 70,
          count: 1,
          beam: true
        }
      };

      result.slots.slot4 = {
        label: "4EX 回避 +2",
        desc: "回避ストック+2",
        ex: true,
        effect: {
          type: "evade",
          amount: 2
        }
      };

      result.status.push("EWAC破棄：1EX/4EX解禁");
    }

    if (state.jeganSlot6Mode === "escort") {
      result.slots.slot6 = {
        label: "EX換装",
        desc: "5ターン間、エスコートタイプに換装する。",
        ex: true,
        effect: {
          type: "custom",
          customType: "jegan_change_escort"
        }
      };
    }

    if (state.jeganStarkRightUsed && state.jeganEscortRightUsed) {
      result.specials.special4 = {
        name: "兵装要請（放棄済み）",
        effectType: "jegan_request_arms_used",
        timing: "auto",
        desc: "6/6EXの使用権を放棄済み。6SP使用可能。",
        actionType: "auto"
      };

      result.slots.slot6 = {
        label: "6SP ミサイルポッド 20ダメージ×4回",
        desc: "20ダメージ×4回。射撃",
        ex: true,
        effect: {
          type: "attack",
          attackType: "shoot",
          damage: 20,
          count: 4
        }
      };

      result.status.push("6SP解禁");
    }
  }

  if (state.formId === "ewac") {
    const grenadeDamage = 10 + Number(state.jeganEwacGrenadeBonus || 0);

    result.slots.slot1 = {
      label: `支給急造ハンドグレネード ${grenadeDamage}ダメージ`,
      desc: `${grenadeDamage}ダメージ。射撃。使用する度に威力が5ずつ上昇する。`,
      effect: {
        type: "attack",
        attackType: "shoot",
        damage: grenadeDamage,
        count: 1,
        scalingOnUse: {
          key: "jeganEwacGrenadeBonus",
          add: 5,
          message: "支給急造ハンドグレネード：次回威力+5"
        }
      }
    };
  }

  if (state.formId === "ewac" && state.jeganSlot6Mode === "support") {
    result.slots.slot6 = {
      label: "6EX EWAC捕捉・艦艇援護射撃",
      desc: "相手の回避数が0の時のみ、150ダメージ。射撃",
      ex: true,
      effect: {
        type: "custom",
        customType: "jegan_ewac_capture_fire"
      }
    };
  }

  if (state.jeganLimiterTurns > 0) {
    result.status.push(`リミッター解除 残り${state.jeganLimiterTurns}ターン`);
  }

  if (state.jeganLimiterRestTurns > 0) {
    result.status.push("リミッター反動：休み");
  }

  if (state.jeganStarkTurns > 0) {
    result.status.push(`スターク換装 残り${state.jeganStarkTurns}ターン`);
  }

  if (state.jeganEscortTurns > 0) {
    result.status.push(`エスコート換装 残り${state.jeganEscortTurns}ターン`);
  }

  if (state.jeganBarrierTurns > 0) {
    result.status.push("全ダメージ無効バリア");
  }

  if (state.jeganShieldActive) {
    result.status.push("シールド半減");
  }

  if (state.jeganAssaultGuessSlotKey) {
    result.status.push("突貫予測中");
  }

  if (state.jeganEwacGuessSlotKey) {
    result.status.push("索敵予測中");
  }

  return result;
}

export function canUseJeganSpecial(state, specialKey, context = {}) {
  ensureJeganState(state);

  const special = state.specials[specialKey];

  if (!special) {
    return {
      allowed: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (
    state.formId === "ewac" &&
    hasSupportFirePending(state) &&
    (
      special.effectType === "jegan_ewac_release" ||
      special.effectType === "jegan_ewac_escape"
    )
  ) {
    return {
      allowed: false,
      message: "援護射撃発動まで解除/離脱解除は使用不可"
    };
  }

  return {
    allowed: true,
    message: null
  };
}

function isJeganRestLocked(state) {
  return state && state.jeganLimiterRestTurns > 0 && !state.jeganForcedActionReady;
}

export function executeJeganSpecial(state, specialKey, context = {}) {
  ensureJeganState(state);

  const special = state.specials[specialKey];

  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  switch (special.effectType) {
    case "jegan_equip_ewac": {
      if (state.jeganEwacBroken) {
        return {
          handled: true,
          redraw: true,
          message: "EWAC装備は破棄済み"
        };
      }

      if (!consumeRuleAction(state, 1, context)) {
        return {
          handled: true,
          redraw: true,
          message: "行動権が足りない"
        };
      }

      changeForm(state, "ewac");

      return {
        handled: true,
        redraw: true,
        message: "EWACを装備した"
      };
    }

    case "jegan_limiter_base": {
      if (!canPayRuleHp(state, 120, context)) {
        return {
          handled: true,
          redraw: true,
          message: "HPが足りない"
        };
      }

      payRuleHp(state, 120, context);

      if (state.jeganLimiterRestTurns > 0) {
        state.jeganForcedActionReady = true;
        setRuleActionAtLeast(state, 1, context);

        return {
          handled: true,
          redraw: true,
          message: "リミッター解除：反動中に強引に行動権+1"
        };
      }

      state.jeganLimiterTurns = 3;
      state.baseActionCount = 2;
      setRuleActionAtLeast(state, 2, context);

      return {
        handled: true,
        redraw: true,
        message: "リミッター解除：3ターンの間2回行動"
      };
    }

    case "jegan_shield": {
      if (state.jeganShieldHalfCount <= 0) {
        return {
          handled: true,
          redraw: true,
          message: "シールド残数がない"
        };
      }

      state.jeganShieldHalfCount -= 1;
      state.jeganShieldActive = true;

      return {
        handled: true,
        redraw: true,
        message: "シールド：このターンの被ダメージ半減"
      };
    }

    case "jegan_request_arms": {
      if (state.jeganStarkRightUsed && state.jeganEscortRightUsed) {
        return {
          handled: true,
          redraw: true,
          message: "両使用権放棄済み：6SP使用可能"
        };
      }

      const isQte = Array.isArray(context.currentAttack) && context.currentAttack.length > 0;

      if (isQte) {
        if (state.jeganSlot6Mode === "stark") {
          state.jeganStarkRightUsed = true;
          state.jeganSlot6Mode = "escort";
          state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);

          return {
            handled: true,
            redraw: true,
            message: "兵装要請：6使用権を放棄。1ターン全ダメージ無効。6EXへ強制切替"
          };
        }

        state.jeganEscortRightUsed = true;
        state.jeganSlot6Mode = "stark";
        state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);

        return {
          handled: true,
          redraw: true,
          message: "兵装要請：6EX使用権を放棄。1ターン全ダメージ無効。6へ強制切替"
        };
      }

      state.jeganSlot6Mode = state.jeganSlot6Mode === "stark" ? "escort" : "stark";

      return {
        handled: true,
        redraw: true,
        message: null
      };
    }

    case "jegan_assault_predict": {
      if (!consumeRuleAction(state, 1, context)) {
        return {
          handled: true,
          redraw: true,
          message: "行動権が足りない"
        };
      }

      return {
        handled: true,
        redraw: false,
        message: null,
        requestChoice: {
          choiceType: "slot_predict",
          source: "jegan_assault_predict",
          ownerPlayer: context.ownerPlayer,
          enemyPlayer: context.enemyPlayer,
          title: `PLAYER ${context.ownerPlayer} 突貫`,
          slotKeys: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"]
        }
      };
    }

    case "jegan_stark_release": {
      return {
        handled: true,
        redraw: false,
        message: null,
        requestChoice: {
          choiceType: "slot_select",
          source: "jegan_stark_release",
          ownerPlayer: context.ownerPlayer,
          title: `PLAYER ${context.ownerPlayer} スターク装備解除`,
          slotKeys: state.jeganEwacBroken ? ["slot1"] : ["slot1", "slot6"]
        }
      };
    }

    case "jegan_stark_accel": {
      if (getRuleEvade(state, context) < 4) {
        return {
          handled: true,
          redraw: true,
          message: "回避数が足りない"
        };
      }

      consumeRuleEvade(state, 4, context);
      addRuleAction(state, 1, context);

      return {
        handled: true,
        redraw: true,
        message: "加速：回避-4、行動権+1"
      };
    }

    case "jegan_limiter_stark": {
      if (!canPayRuleHp(state, 120, context)) {
        return {
          handled: true,
          redraw: true,
          message: "HPが足りない"
        };
      }

      payRuleHp(state, 120, context);

      const currentRedCap = state.overEvadeMode && typeof state.overEvadeCap === "number"
        ? state.overEvadeCap
        : Number(state.evadeMax || 0);

      const nextEvadeMax = Math.max(1, currentRedCap) * 2;
      const nextEvade = Math.max(0, getRuleEvade(state, context)) * 2;

      addRuleAction(state, 1, context);

      zeroOwnRuleEvade(state, context);
      addRuleEvade(state, nextEvade, context);

      state.overEvadeMode = true;
      state.overEvadeCap = nextEvadeMax;
      state.overEvadeBaseMax = state.evadeMax;
      state.overEvadeAbsoluteMax = null;
      state.jeganStarkLimiterActive = true;

      return {
        handled: true,
        redraw: true,
        message: `スタークリミッター解除：行動権+1、赤上限${nextEvadeMax}、所持回避${nextEvade}`
      };
    }

    case "jegan_stark_disturb": {
      if (!consumeRuleAction(state, 1, context)) {
        return {
          handled: true,
          redraw: true,
          message: "行動権が足りない"
        };
      }

      addRuleEvade(state, 3, context);

      return {
        handled: true,
        redraw: true,
        message: "撹乱：回避+3"
      };
    }

    case "jegan_ewac_release": {
      changeForm(state, "base");

      return {
        handled: true,
        redraw: true,
        message: "EWACを解除した"
      };
    }

    case "jegan_ewac_predict": {
      if (getRuleActionCount(state, context) < 1) {
        return {
          handled: true,
          redraw: true,
          message: "行動権が足りない"
        };
      }

      consumeRuleAction(state, getRuleActionCount(state, context), context);

      return {
        handled: true,
        redraw: false,
        message: null,
        requestChoice: {
          choiceType: "slot_predict",
          source: "jegan_ewac_predict",
          ownerPlayer: context.ownerPlayer,
          enemyPlayer: context.enemyPlayer,
          title: `PLAYER ${context.ownerPlayer} 索敵予測`,
          slotKeys: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"]
        }
      };
    }

    case "jegan_ewac_analysis": {
      state.jeganSlot6Mode = state.jeganSlot6Mode === "support" ? "search" : "support";

      return {
        handled: true,
        redraw: true,
        message: state.jeganSlot6Mode === "support"
          ? "EWAC分析：6EXに切替"
          : "EWAC分析：6に切替"
      };
    }

    case "jegan_ewac_escape": {
      if (state.jeganEwacEscapeUsed) {
        return {
          handled: true,
          redraw: true,
          message: "離脱解除は使用済み"
        };
      }

      state.jeganEwacEscapeUsed = true;
      state.jeganEwacBroken = true;
      state.jeganBarrierTurns = Math.max(state.jeganBarrierTurns, 1);

      changeForm(state, "base");

      return {
        handled: true,
        redraw: true,
        message: "離脱解除：このターン全ダメージ無効。EWACを永久解除"
      };
    }

    case "jegan_ewac_support_fire": {
      if (state.jeganEwacSupportFireCount >= 3) {
        return {
          handled: true,
          redraw: true,
          message: "捕捉・援護射撃は3回使用済み"
        };
      }

      if (state.jeganEwacSupportFireUsedThisTurn) {
        return {
          handled: true,
          redraw: true,
          message: "捕捉・援護射撃は1ターン1度まで"
        };
      }

      state.jeganEwacSupportFireCount += 1;
      state.jeganEwacSupportFireUsedThisTurn = true;

      return {
        handled: true,
        redraw: true,
        message: "捕捉・援護射撃を予約した。3ターン後に発動",
        reserveAction: {
          id: `jegan_ewac_support_${state.jeganEwacSupportFireCount}`,
          delay: 3,
          trigger: "turn_start",
          ownerPlayer: context.ownerPlayer,
          enemyPlayer: context.enemyPlayer,
          type: "attack",
          label: "EWAC捕捉・援護射撃 80ダメージ",
          attacks: [
            {
              damage: 80,
              type: "shoot",
              beam: false,
              cannotEvade: false,
              ignoreReduction: false,
              ignoreDefense: false,
              addedBeam: false,
              addedCannotEvade: false,
              addedIgnoreReduction: false,
              special: null,
              source: "EWAC捕捉・援護射撃",
              onHit: null,
              moonlightButterfly: false,
              minEvadeRequired: 0
            }
          ]
        }
      };
    }

    case "jegan_escort_release": {
      return {
        handled: true,
        redraw: false,
        message: null,
        requestChoice: {
          choiceType: "slot_select",
          source: "jegan_escort_release",
          ownerPlayer: context.ownerPlayer,
          title: `PLAYER ${context.ownerPlayer} エスコート装備解除`,
          slotKeys: state.jeganEwacBroken ? ["slot1"] : ["slot1", "slot6"]
        }
      };
    }

    case "jegan_escort_assault": {
      if (getRuleEvade(state, context) < 2) {
        return {
          handled: true,
          redraw: true,
          message: "回避数が足りない"
        };
      }

      consumeRuleEvade(state, 2, context);
      addRuleAction(state, 1, context);

      return {
        handled: true,
        redraw: true,
        message: "強襲：回避-2、行動権+1"
      };
    }

    default:
      return {
        handled: false,
        redraw: false,
        message: null
      };
  }
}

export function onJeganTurnEnd(state, context = {}) {
  ensureJeganState(state);

  const messages = [];

  state.jeganTurnCount += 1;
  state.jeganShieldActive = false;
  state.jeganBarrierTurns = Math.max(0, state.jeganBarrierTurns - 1);
  state.jeganEwacSupportFireUsedThisTurn = false;

  if (state.jeganLimiterRestTurns > 0) {
    state.jeganLimiterRestTurns -= 1;
    state.baseActionCount = 1;
    messages.push("リミッター反動終了");
  } else if (state.jeganLimiterTurns > 0) {
    state.jeganLimiterTurns -= 1;
    state.baseActionCount = 2;

    if (state.jeganLimiterTurns <= 0) {
      state.baseActionCount = 1;
      state.jeganLimiterRestTurns = 1;
      messages.push("リミッター解除終了：次の自機ターンは休み");
    }
  }

  if (state.jeganStarkTurns > 0) {
    state.jeganStarkTurns -= 1;

    if (state.jeganStarkTurns <= 0 && state.formId === "stark") {
      changeForm(state, "base");
      messages.push("スターク換装終了：ジェガンD型に戻った");

      delete state.stateEffects.jegan_stark_change;

      if (state.jeganStarkLimiterActive) {
        state.jeganStarkLimiterActive = false;
        state.jeganLimiterRestTurns = 1;
        messages.push("スタークリミッター反動：次の自機ターンは休み");
      }
    }
  }

  if (state.jeganEscortTurns > 0) {
    state.jeganEscortTurns -= 1;

    if (state.jeganEscortTurns <= 0 && state.formId === "escort") {
      changeForm(state, "base");
      delete state.stateEffects.jegan_escort_change;
      messages.push("エスコート換装終了：ジェガンD型に戻った");
    }
  }

  return {
    redraw: messages.length > 0,
    message: messages.join(" / ") || null
  };
}

export function onJeganBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureJeganState(state);

  if (isJeganRestLocked(state)) {
    return {
      redraw: true,
      message: "リミッター反動：このターン休み",
      cancelSlot: true
    };
  }

  const messages = [];

  if (state.formId === "stark" && state.jeganTurnCount % 2 === 0) {
    addRuleEvade(state, 1, context);
    messages.push("撹乱：偶数ターン回避+1");
  }

  if (state.formId === "escort" && state.jeganTurnCount % 2 === 1) {
    addRuleEvade(state, 1, context);
    messages.push("警戒：奇数ターン回避+1");
  }

  return {
    redraw: messages.length > 0,
    message: messages.join(" / ") || null
  };
}

export function onJeganEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureJeganState(state);

  const messages = [];

  if (
    state.jeganAssaultGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.jeganAssaultGuessSlotKey === context.enemyRolledSlotKey
  ) {
    zeroEnemyRuleEvade(context.enemyState, context);
    messages.push(`${state.name} 突貫予測成功！相手回避0`);
  }

  state.jeganAssaultGuessSlotKey = "";

  if (
    state.jeganEwacGuessSlotKey &&
    context.enemyRolledSlotKey &&
    state.jeganEwacGuessSlotKey === context.enemyRolledSlotKey
  ) {
    healRuleHp(state, 100, context);
    messages.push(`${state.name} 索敵予測成功！HP100回復`);
  }

  state.jeganEwacGuessSlotKey = "";

  return {
    redraw: messages.length > 0,
    message: messages.join(" / ") || null
  };
}

export function onJeganAfterSlotResolved(state, slotNumber, context = {}) {
  ensureJeganState(state);

  const wasForcedAction = state.jeganForcedActionReady;
  state.jeganForcedActionReady = false;

  const result = context.resolveResult || {};
  const effectId = result.customEffectId || null;

  if (result.scalingOnUse?.key) {
    const key = result.scalingOnUse.key;
    const add = Number(result.scalingOnUse.add || 0);

    state[key] = Number(state[key] || 0) + add;

    return {
      redraw: true,
      message: result.scalingOnUse.message || null
    };
  }

  if (effectId === "jegan_change_stark") {
    state.jeganStarkTurns = 5;
    state.stateEffects.jegan_stark_change = {
      id: "jegan_stark_change",
      turns: 5,
      boost: true,
      boostType: "form_change",
      boostName: "スタークジェガン換装"
    };

    changeForm(state, "stark");

    return {
      redraw: true,
      message: "スタークジェガンに換装した"
    };
  }

  if (effectId === "jegan_change_escort") {
    state.jeganEscortTurns = 5;
    state.stateEffects.jegan_escort_change = {
      id: "jegan_escort_change",
      turns: 5,
      boost: true,
      boostType: "form_change",
      boostName: "エスコートタイプ換装"
    };

    changeForm(state, "escort");

    return {
      redraw: true,
      message: "エスコートタイプに換装した"
    };
  }

  if (effectId === "jegan_stark_raid") {
    const evade = getRuleEvade(state, context);
    const damage = Math.max(0, evade) * 10;

    return {
      redraw: true,
      message: `急襲：所持回避数${evade}×10 = ${damage}ダメージ`,
      appendAttacks: [
        {
          damage,
          type: "shoot",
          beam: false,
          cannotEvade: false,
          ignoreReduction: false,
          ignoreDefense: false,
          addedBeam: false,
          addedCannotEvade: false,
          addedIgnoreReduction: false,
          special: null,
          source: "急襲",
          onHit: null,
          moonlightButterfly: false,
          minEvadeRequired: 0
        }
      ]
    };
  }

  if (effectId === "jegan_ewac_search" && context.enemyState) {
    zeroEnemyRuleEvade(context.enemyState, context);

    return {
      redraw: true,
      message: "EWAC索敵：相手回避0"
    };
  }

  if (effectId === "jegan_ewac_capture_fire") {
    if (!context.enemyState) {
      return {
        redraw: true,
        message: "EWAC捕捉：対象取得失敗"
      };
    }

    const enemyEvade = context.twoVtwoAdapter?.getEvade && context.enemyPlayer
      ? context.twoVtwoAdapter.getEvade(context.enemyPlayer, context.enemyState)
      : Number(context.enemyState.evade || 0);

    if (enemyEvade !== 0) {
      return {
        redraw: true,
        message: "EWAC捕捉・艦艇援護射撃：相手回避が0ではないため不発"
      };
    }

    return {
      redraw: true,
      message: "EWAC捕捉・艦艇援護射撃：攻撃開始",
      appendAttacks: [
        {
          damage: 150,
          type: "shoot",
          beam: false,
          cannotEvade: false,
          ignoreReduction: false,
          ignoreDefense: false,
          addedBeam: false,
          addedCannotEvade: false,
          addedIgnoreReduction: false,
          special: null,
          source: "EWAC捕捉・艦艇援護射撃",
          onHit: null,
          moonlightButterfly: false,
          minEvadeRequired: 0
        }
      ]
    };
  }

  if (wasForcedAction) {
    return {
      redraw: true,
      message: "反動中の強制行動を終了"
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onJeganActionResolved(attacker, defender, context = {}) {
  ensureJeganState(attacker);

  const slot = context.slot || attacker.slots?.[context.slotKey];
  const effect = slot?.effect || {};

  if (effect.onFullHitEffect === "jegan_enemy_evade_zero") {
    const totalCount = Number(context.totalCount || 0);
    const hitCount = Number(context.hitCount || 0);

    if (totalCount > 0 && hitCount >= totalCount) {
      zeroEnemyRuleEvade(defender, context);

      return {
        redraw: true,
        message: "ショートマシンガン フルヒット：相手回避0"
      };
    }

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

export function onJeganDamaged(defender, attacker) {
  ensureJeganState(defender);

  return {
    redraw: false,
    message: null
  };
}

export function modifyJeganTakenDamage(defender, attacker, attack, damage) {
  ensureJeganState(defender);

  if (defender.jeganBarrierTurns > 0) {
    return {
      damage: 0,
      cancelled: true,
      message: `${defender.name}：全ダメージ無効バリア`
    };
  }

  let nextDamage = damage;
  const messages = [];

  if (defender.formId === "escort" && !attack?.ignoreReduction) {
    nextDamage = Math.max(0, nextDamage - 5);
    messages.push("アーマー：ダメージ-5");
  }

  if (defender.jeganShieldActive) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("シールド：ダメージ半減");
  }

  return {
    damage: nextDamage,
    message: messages.join(" / ") || null
  };
}

export function modifyJeganEvadeAttempt(defender, attacker, attack, context = {}) {
  return {
    handled: false
  };
}

export function onJeganResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureJeganState(state);

  if (pendingChoice.source === "jegan_assault_predict") {
    state.jeganAssaultGuessSlotKey = selectedValue;

    return {
      handled: true,
      redraw: true,
      message: "突貫：予測を設定した"
    };
  }

  if (pendingChoice.source === "jegan_ewac_predict") {
    state.jeganEwacGuessSlotKey = selectedValue;

    return {
      handled: true,
      redraw: true,
      message: "索敵予測を設定した"
    };
  }

  if (pendingChoice.source === "jegan_stark_release") {
    if (selectedValue === "slot6" && !state.jeganEwacBroken) {
      changeForm(state, "ewac");

      return {
        handled: true,
        redraw: true,
        message: "スターク装備解除：EWACへ換装"
      };
    }

    changeForm(state, "base");
    delete state.stateEffects.jegan_stark_change;

    return {
      handled: true,
      redraw: true,
      message: "スターク装備解除：ジェガンD型へ換装"
    };
  }

  if (pendingChoice.source === "jegan_escort_release") {
    if (selectedValue === "slot6" && !state.jeganEwacBroken) {
      changeForm(state, "ewac");

      return {
        handled: true,
        redraw: true,
        message: "エスコート装備解除：EWACへ換装"
      };
    }

    changeForm(state, "base");
    delete state.stateEffects.jegan_escort_change;

    return {
      handled: true,
      redraw: true,
      message: "エスコート装備解除：ジェガンD型へ換装"
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
