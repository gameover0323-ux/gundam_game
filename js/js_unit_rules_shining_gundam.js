import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect
} from "./js_unit_runtime.js";

function ensureShiningState(state) {
  if (typeof state.shiningMeditationCount !== "number") state.shiningMeditationCount = 0;
  if (typeof state.shiningMeditationExReady !== "boolean") state.shiningMeditationExReady = false;
  if (typeof state.shiningMeikyoUnlocked !== "boolean") state.shiningMeikyoUnlocked = false;
  if (typeof state.shiningMikiUsedThisTurn !== "number") state.shiningMikiUsedThisTurn = 0;
  if (typeof state.shiningWaterDropPending !== "boolean") state.shiningWaterDropPending = false;
  if (typeof state.shiningResolvingFollowup !== "boolean") state.shiningResolvingFollowup = false;
}

function getSuperEffect(state) {
  return getStateEffect(state, "shining_super");
}

function getMeikyoEffect(state) {
  return getStateEffect(state, "shining_meikyo");
}

function getActiveModeEffect(state) {
  return getMeikyoEffect(state) || getSuperEffect(state) || null;
}

function getActiveModeEffectId(state) {
  if (getMeikyoEffect(state)) return "shining_meikyo";
  if (getSuperEffect(state)) return "shining_super";
  return null;
}

function getCurrentModeEvadeCap(state) {
  if (state.formId === "meikyo") return 8;
  if (state.formId === "super") return 6;
  return 3;
}

function clearShiningOverEvadeState(state) {
  state.overEvadeMode = false;
  state.overEvadeCap = state.evadeMax;
  state.overEvadeBaseMax = state.evadeMax;
  state.overEvadeAbsoluteMax = 8;
}

function clampShiningEvade(state) {
  if (typeof state.evade === "number" && typeof state.evadeMax === "number" && state.evade > state.evadeMax && !state.overEvadeMode) {
    state.evade = state.evadeMax;
  }

  if (state.evade < 0) {
    state.evade = 0;
  }
}

function setBaseForm(state, previousCap = 3) {
  const prevEvade =
    typeof state.evade === "number" ? state.evade : 0;

  const changed = setForm(state, "base", {
    preserveHp: true,
    preserveEvade: true
  });

  if (!changed) {
    return false;
  }

  if (prevEvade > state.evadeMax) {
    state.evade = Math.min(prevEvade, previousCap);
    state.overEvadeMode = true;
    state.overEvadeCap = Math.min(prevEvade, previousCap);
    state.overEvadeBaseMax = previousCap;
    state.overEvadeAbsoluteMax = previousCap;
  } else {
    clearShiningOverEvadeState(state);
    clampShiningEvade(state);
  }

  return true;
}

function enterMode(state, formId, effectId, turns) {
  clearStateEffect(state, "shining_super");
  clearStateEffect(state, "shining_meikyo");

  const changed = setForm(state, formId, {
    preserveHp: true,
    preserveEvade: true
  });

  if (!changed) {
    return false;
  }

  clearShiningOverEvadeState(state);
  clampShiningEvade(state);

  setStateEffect(state, effectId, {
    turns,
    skipNextTick: true
  });

  return true;
}

function extendActiveMode(state, amount) {
  const effect = getActiveModeEffect(state);
  if (!effect) return false;

  effect.turns += amount;
  return true;
}

function consumeActiveModeTurns(state, amount) {
  const effectId = getActiveModeEffectId(state);
  if (!effectId) return false;

  const effect = getStateEffect(state, effectId);
  if (!effect) return false;

  const previousCap = getCurrentModeEvadeCap(state);

  effect.turns -= amount;

  if (effect.turns <= 0) {
    clearStateEffect(state, effectId);
    setBaseForm(state, previousCap);
  }

  return true;
}

function tickModeEffect(state, effectId, previousCap) {
  const effect = getStateEffect(state, effectId);
  if (!effect) return false;

  if (effect.skipNextTick) {
    effect.skipNextTick = false;
    return true;
  }

  effect.turns--;

  if (effect.turns <= 0) {
    clearStateEffect(state, effectId);
    setBaseForm(state, previousCap);
  }

  return true;
}

function buildModeStatus(text, color) {
  return `<span style="color:${color};font-weight:bold;">${text}</span>`;
}

export function getShiningDerivedState(state) {
  ensureShiningState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.formId === "base") {
    if (state.shiningMeikyoUnlocked) {
      result.slots.slot6 = {
        label: "明鏡止水の心 5ターン強化",
        desc: "5ターン間明鏡止水スーパーモードに強化される。強化",
        effect: {
          type: "custom",
          effectId: "shining_meikyo_activate"
        },
        gold: true
      };
    }

    return result;
  }

  if (state.formId === "super") {
    result.name = "シャイニングガンダムS";

    const superEffect = getSuperEffect(state);
    if (superEffect && typeof superEffect.turns === "number") {
      result.status.push(buildModeStatus(`スーパーモード 残${superEffect.turns}ターン`, "#ff4d4d"));
    }

    if (state.shiningMeditationExReady) {
      result.slots.slot3 = {
        label: "3EX 明鏡止水の心 80回復",
        desc: "80回復。5ターン間明鏡止水スーパーモードに強化される。強化",
        effect: {
          type: "custom",
          effectId: "shining_meikyo_heart"
        },
        ex: true
      };
    }

    return result;
  }

  if (state.formId === "meikyo") {
    result.name = "シャイニングガンダム明鏡止水S";

    const meikyoEffect = getMeikyoEffect(state);
    if (meikyoEffect && typeof meikyoEffect.turns === "number") {
      result.status.push(buildModeStatus(`明鏡止水Sモード 残${meikyoEffect.turns}ターン`, "gold"));
    }

    if (state.shiningWaterDropPending) {
      result.status.push(buildModeStatus("水の一雫: 次の攻撃が必中", "gold"));

      ["slot1", "slot4", "slot5", "slot6"].forEach((slotKey) => {
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

  return result;
}

export function canUseShiningSpecial(state, specialKey, context = {}) {
  ensureShiningState(state);

  const special = state.specials[specialKey];
  if (!special) {
    return {
      allowed: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "miki_action") {
    const allowed =
      state.evade >= 1 &&
      state.shiningMikiUsedThisTurn < 2;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  if (special.effectType === "spirit_focus") {
    const allowed =
      state.evade >= 3 &&
      typeof state.actionCount === "number" &&
      state.actionCount >= 1;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  if (special.effectType === "water_drop") {
    const allowed =
      state.evade >= 5 &&
      !state.shiningWaterDropPending;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  return {
    allowed: true,
    message: null
  };
}

export function executeShiningSpecial(state, specialKey, context = {}) {
  ensureShiningState(state);

  const special = state.specials[specialKey];
  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "miki_action") {
    state.evade -= 1;
    state.shiningMikiUsedThisTurn += 1;

    if (typeof state.actionCount !== "number") {
      state.actionCount = 0;
    }
    state.actionCount += 1;

    consumeActiveModeTurns(state, 1);
    clampShiningEvade(state);

    return {
      handled: true,
      redraw: true,
      message: null
    };
  }

  if (special.effectType === "spirit_focus") {
    state.evade -= 3;

    if (typeof state.actionCount !== "number") {
      state.actionCount = 0;
    }

    state.actionCount = Math.max(0, state.actionCount - 1);
    clampShiningEvade(state);

    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "slot_select",
        source: "shining_focus",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: `PLAYER ${context.ownerPlayer} 精神統一`,
        slotKeys: state.rollableSlotOrder || []
      }
    };
  }

  if (special.effectType === "water_drop") {
    state.evade -= 5;
    state.hp = Math.ceil(state.hp / 2);
    state.shiningWaterDropPending = true;
    clampShiningEvade(state);

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

export function onShiningTurnEnd(state, context = {}) {
  ensureShiningState(state);

  state.shiningMikiUsedThisTurn = 0;

  if (getMeikyoEffect(state)) {
    return {
      redraw: tickModeEffect(state, "shining_meikyo", 8),
      message: null
    };
  }

  if (getSuperEffect(state)) {
    return {
      redraw: tickModeEffect(state, "shining_super", 6),
      message: null
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onShiningBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onShiningEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onShiningAfterSlotResolved(state, slotNumber, context = {}) {
  ensureShiningState(state);

  const resolveResult = context.resolveResult || null;
  if (!resolveResult || resolveResult.kind !== "custom") {
    return {
      redraw: false,
      message: null
    };
  }

  if (state.formId === "base") {
    if (resolveResult.customEffectId === "shining_activate_mode") {
      if (state.hp <= 150) {
        state.shiningMeikyoUnlocked = true;
        const changed = enterMode(state, "meikyo", "shining_meikyo", 5);

        return {
          redraw: changed,
          message: changed ? "死中に活発動" : "明鏡止水移行失敗"
        };
      }

      const changed = enterMode(state, "super", "shining_super", 5);
      return {
        redraw: changed,
        message: null
      };
    }

    if (resolveResult.customEffectId === "shining_meikyo_activate") {
      state.shiningMeikyoUnlocked = true;
      const changed = enterMode(state, "meikyo", "shining_meikyo", 5);

      return {
        redraw: changed,
        message: changed ? "明鏡止水発動" : "明鏡止水移行失敗"
      };
    }
  }

  if (state.formId === "super") {
    if (resolveResult.customEffectId === "shining_meditation") {
      state.hp = Math.min(state.maxHp, state.hp + 60);
      extendActiveMode(state, 2);

      state.shiningMeditationCount += 1;

      const messages = ["60回復", "スーパーモード+2ターン"];

      if (state.shiningMeditationCount >= 4 && !state.shiningMeditationExReady) {
        state.shiningMeditationExReady = true;
        messages.push("シャイニングガンダムS 3が3EXに変化");
      }

      return {
        redraw: true,
        message: messages.join("<br>")
      };
    }

    if (resolveResult.customEffectId === "shining_meikyo_heart") {
      state.hp = Math.min(state.maxHp, state.hp + 80);
      state.shiningMeikyoUnlocked = true;
      state.shiningMeditationExReady = false;

      const changed = enterMode(state, "meikyo", "shining_meikyo", 5);

      return {
        redraw: true,
        message: changed ? "80回復<br>明鏡止水発動" : "明鏡止水移行失敗"
      };
    }
  }

  if (state.formId === "meikyo") {
    if (resolveResult.customEffectId === "shining_meikyo_heal") {
      state.hp = Math.min(state.maxHp, state.hp + 80);
      extendActiveMode(state, 1);

      return {
        redraw: true,
        message: "80回復<br>明鏡止水Sモード+1ターン"
      };
    }
  }

  return {
    redraw: false,
    message: null
  };
}

export function onShiningActionResolved(attacker, defender, context = {}) {
  ensureShiningState(attacker);

  if (attacker.shiningResolvingFollowup) {
    attacker.shiningResolvingFollowup = false;

    return {
      redraw: true,
      message: null
    };
  }

  let redraw = false;
  const messages = [];

  if (attacker.formId === "super") {
    if (context.slotNumber === 6 && context.hitCount > 0) {
      extendActiveMode(attacker, 3);
      redraw = true;
      messages.push("スーパーモード+3ターン");
    }

    return {
      redraw,
      message: messages.length > 0 ? messages.join("<br>") : null
    };
  }

  if (attacker.formId === "meikyo") {
    if (attacker.shiningWaterDropPending && context.totalCount > 0) {
      attacker.shiningWaterDropPending = false;
      redraw = true;
    }

    if (context.slotNumber === 5 && context.hitCount > 0) {
      extendActiveMode(attacker, 2);
      redraw = true;
      messages.push("明鏡止水Sモード+2ターン");
    }

    if (
      context.slotNumber === 4 &&
      context.hitCount > 0 &&
      attacker.evade > 0
    ) {
      const choices = [
        { label: "追撃しない", value: "cancel" }
      ];

      for (let i = 1; i <= attacker.evade; i++) {
        choices.push({
          label: `${i}消費`,
          value: String(i)
        });
      }

      return {
        redraw: true,
        message: messages.length > 0 ? messages.join("<br>") : null,
        requestChoice: {
          choiceType: "generic",
          source: "shining_meikyo_followup",
          ownerPlayer: context.ownerPlayer,
          enemyPlayer: context.enemyPlayer,
          title: `PLAYER ${context.ownerPlayer} シャイニングフィンガー追撃`,
          choices
        }
      };
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
export function onShiningDamaged(defender, attacker) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyShiningTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function onShiningResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureShiningState(state);

  if (pendingChoice.source === "shining_focus") {
    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: selectedValue
      }
    };
  }

  if (pendingChoice.source === "shining_meikyo_followup") {
    if (selectedValue === "cancel") {
      return {
        handled: true,
        redraw: true,
        message: "追撃しない"
      };
    }

    const spend = Number(selectedValue || 0);
    if (!Number.isFinite(spend) || spend <= 0) {
      return {
        handled: true,
        redraw: true,
        message: "追撃しない"
      };
    }

    if (state.evade < spend) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    state.evade -= spend;
    state.shiningResolvingFollowup = true;

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: "slot4",
        slotData: {
          label: `シャイニングフィンガー追撃 30ダメージ×${spend}回`,
          desc: `30ダメージ×${spend}回。格闘`,
          effect: {
            type: "attack",
            damage: 30,
            count: spend,
            attackType: "melee"
          }
        }
      }
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
