import { createAttack } from "./js_battle_system.js";
import {
  setForm,
  getStateEffect,
  setStateEffect,
  clearStateEffect,
  addEvade,
  reduceEvade,
  normalizeEvadeCapState,
  doubleEvadeRedCapWithContext
} from "./js_unit_runtime.js";

const PACK_FORM_IDS = ["base", "aile", "sword", "launcher"];
const SHORT_DECISIVE_BATTLE_LIMIT = 3;

function ensureStrikeState(state) {
  if (typeof state.strikePsArmor !== "number") state.strikePsArmor = 300;
  if (typeof state.strikePsArmorBroken !== "boolean") state.strikePsArmorBroken = false;
  if (typeof state.strikePackCooldown !== "number") state.strikePackCooldown = 0;
  if (typeof state.strikePackFreeSelect !== "boolean") state.strikePackFreeSelect = true;
  if (typeof state.strikeOsCheckUsedThisTurn !== "boolean") state.strikeOsCheckUsedThisTurn = false;
  if (typeof state.strikeShieldStock !== "number") state.strikeShieldStock = 3;
  if (typeof state.strikeShieldActive !== "boolean") state.strikeShieldActive = false;
  if (typeof state.strikeSwordIssenUsed !== "boolean") state.strikeSwordIssenUsed = false;
  if (typeof state.strikeSwordNoEvade !== "boolean") state.strikeSwordNoEvade = false;
  if (typeof state.strikeSwordAwakened !== "boolean") state.strikeSwordAwakened = false;
  if (typeof state.strikePackLocked !== "boolean") state.strikePackLocked = false;
  if (typeof state.strikeLauncherRecoilTurns !== "number") state.strikeLauncherRecoilTurns = 0;
  if (typeof state.strikeLauncherDamageVulnerable !== "boolean") state.strikeLauncherDamageVulnerable = false;
  if (typeof state.strikeAgniOutputUsedThisAction !== "boolean") state.strikeAgniOutputUsedThisAction = false;
  if (typeof state.strikePackCooldownArmed !== "boolean") state.strikePackCooldownArmed = true;
  if (typeof state.strikeAnchorSureHitNext !== "boolean") state.strikeAnchorSureHitNext = false;
  if (typeof state.strikeAnchorSureHitActiveThisAction !== "boolean") state.strikeAnchorSureHitActiveThisAction = false;
  if (typeof state.strikeShortBattleUsedThisTurn !== "number") state.strikeShortBattleUsedThisTurn = 0;
  if (typeof state.shieldCount !== "number") state.shieldCount = 3;
  if (typeof state.shieldActive !== "boolean") state.shieldActive = false;
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

function getRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getEvade && ownerPlayer) {
    return adapter.getEvade(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.evade || 0));
}

function getEnemyRuleEvade(defender, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);

  if (adapter?.getEvade && enemyPlayer) {
    return adapter.getEvade(enemyPlayer, defender);
  }

  return Math.max(0, Number(defender?.evade || 0));
}

function consumeRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.consumeEvade && ownerPlayer) {
    return adapter.consumeEvade(ownerPlayer, state, amount);
  }
  if (!state || Number(state.evade || 0) < amount) return false;
  reduceEvade(state, amount);
  return true;
}

function consumeEnemyRuleEvade(defender, amount, context = {}) {
  const adapter = getAdapter(context);
  const enemyPlayer = getEnemyPlayer(context);
  if (adapter?.consumeEvade && enemyPlayer) {
    return adapter.consumeEvade(enemyPlayer, defender, amount);
  }
  if (!defender || Number(defender.evade || 0) < amount) return false;
  reduceEvade(defender, amount);
  return true;
}

function zeroRuleEvade(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.zeroEvade && ownerPlayer) {
    return adapter.zeroEvade(ownerPlayer, state);
  }
  if (state) {
    state.evade = 0;
    normalizeEvadeCapState(state);
  }
  return true;
}

function addRuleEvade(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);
  if (adapter?.addTeamEvade && ownerPlayer) {
    return adapter.addTeamEvade(ownerPlayer, state, amount);
  }

  addEvade(state, amount);
  return amount;
}

function getRuleActionCount(state, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.getActionCount && ownerPlayer) {
    return adapter.getActionCount(ownerPlayer, state);
  }

  return Math.max(0, Number(state?.actionCount || 0));
}

function consumeRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.consumeAction && ownerPlayer) {
    return adapter.consumeAction(ownerPlayer, state, amount);
  }

  if (!state || Number(state.actionCount || 0) < amount) return false;
  state.actionCount = Math.max(0, Number(state.actionCount || 0) - amount);
  return true;
}

function addRuleAction(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.addActionCount && ownerPlayer) {
    return adapter.addActionCount(ownerPlayer, state, amount);
  }

  state.actionCount = Math.max(0, Number(state.actionCount || 0)) + amount;
  return amount;
}

function healRuleHp(state, amount, context = {}) {
  const adapter = getAdapter(context);
  const ownerPlayer = getOwnerPlayer(context);

  if (adapter?.heal && ownerPlayer) {
    return adapter.heal(ownerPlayer, state, amount);
  }

  state.hp = Math.min(state.maxHp, Number(state.hp || 0) + amount);
  return amount;
}

function doubleRuleEvadeWithOverCap(state, context = {}) {
  return doubleEvadeRedCapWithContext(state, context);
}

function getSeedEffect(state) {
  return getStateEffect(state, "strike_seed");
}

function markStrikeActivity(state, options = {}) {
  ensureStrikeState(state);
  if (options.excludePackChange) return;
  if (state.strikePackLocked) return;

  state.strikePackFreeSelect = false;

  if (state.strikePackCooldownArmed && state.strikePackCooldown <= 0) {
    state.strikePackCooldown = 3;
    state.strikePackCooldownArmed = false;
  }
}

function clampSwordNoEvade(state) {
  if (state.formId === "sword" && state.strikeSwordNoEvade) {
    state.evadeMax = 0;
    state.evade = 0;
    state.overEvadeMode = false;
    state.overEvadeCap = 0;
    state.overEvadeBaseMax = 0;
    state.overEvadeAbsoluteMax = 0;
  }
}

function applyStrikeOverEvadeState(state) {
  normalizeEvadeCapState(state);
}

function tickStrikeEffect(state, effectId) {
  const effect = getStateEffect(state, effectId);
  if (!effect) return false;

  if (effect.skipNextTick) {
    effect.skipNextTick = false;
    return true;
  }

  effect.turns -= 1;

  if (effect.turns <= 0) clearStateEffect(state, effectId);

  return true;
}

function isAttackSlot(slot) {
  return slot?.effect?.type === "attack";
}

function applySeedToSlot(slot) {
  if (!slot || !slot.effect || slot.effect.type !== "attack") return slot;

  return {
    ...slot,
    effect: {
      ...slot.effect,
      cannotEvade: true,
      addedCannotEvade: true
    }
  };
}

function makePackChoice(state, context) {
  return {
    choiceType: "generic",
    source: "strike_pack_change",
    ownerPlayer: context.ownerPlayer,
    enemyPlayer: context.enemyPlayer,
    title: `PLAYER ${context.ownerPlayer} ストライカーパック換装`,
    choices: [
      { label: "通常ストライク", value: "base" },
      { label: "エールストライク", value: "aile" },
      { label: "ソードストライク", value: "sword" },
      { label: "ランチャーストライク", value: "launcher" }
    ]
  };
}

export function getStrikeDerivedState(state) {
  ensureStrikeState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  if (state.strikePsArmorBroken) {
    result.status.push("PS装甲: フェイズシフトダウン");
  } else {
    result.status.push(`PS装甲: ${state.strikePsArmor}/300`);
  }

  if (state.strikePackLocked) {
    result.status.push("ストライカーパック換装: 永続封印");
  } else if (state.strikePackCooldown > 0) {
    result.status.push(`ストライカーパック換装CT: ${state.strikePackCooldown}`);
  }

  const seed = getSeedEffect(state);

  if (seed && typeof seed.turns === "number") {
    result.status.push(`S.E.E.D覚醒 残${seed.turns}ターン`);

    Object.keys(state.baseSlots || {}).forEach((slotKey) => {
      const baseSlot = state.baseSlots[slotKey];

      if (isAttackSlot(baseSlot)) {
        result.slots[slotKey] = applySeedToSlot(baseSlot);
      }
    });
  }

  if (state.formId === "sword") {
    if (state.strikeSwordNoEvade) {
      result.slots.slot1 = {
        label: "1EX ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制 5ダメージ×6回",
        desc: "5ダメージ×6回。相手が回避を所持している場合、必ず回避を1回以上消費させる。射撃",
        effect: {
          type: "attack",
          damage: 5,
          count: 6,
          attackType: "shoot"
        },
        ex: true
      };

      result.status.push("一閃後: ソード回避上限0");
    }

    if (state.strikeSwordAwakened) {
      result.slots.slot3 = {
        label: "3EX 対艦刀ｼｭﾍﾞﾙﾄ・ｹﾞﾍﾞｰﾙ連撃 30ダメージ×3回",
        desc: "30ダメージ×3回。格闘",
        effect: {
          type: "attack",
          damage: 30,
          count: 3,
          attackType: "melee"
        },
        ex: true
      };

      if (state.strikeAnchorSureHitNext) {
        result.status.push("アンカー捕縛: 次の攻撃必中");

        Object.keys(state.baseSlots || {}).forEach((slotKey) => {
          const baseSlot = result.slots[slotKey] || state.baseSlots[slotKey];

          if (isAttackSlot(baseSlot)) {
            result.slots[slotKey] = applySeedToSlot(baseSlot);
          }
        });
      }

      result.specials.special5 = {
        name: "短期決戦",
        effectType: "short_decisive_battle",
        timing: "self",
        desc: "所持回避数を1使用して行動回数を1回分追加する。1ターン3回まで。",
        actionType: "instant"
      };

      result.status.push("ソード覚醒: 短期決戦解禁/換装封印");
    }
  }

  clampSwordNoEvade(state);
  return result;
}

export function canUseStrikeSpecial(state, specialKey, context = {}) {
  ensureStrikeState(state);

  const special = state.specials[specialKey];

  if (!special) {
    return {
      allowed: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "trait_ps_armor") {
    return {
      allowed: false,
      message: "常時効果"
    };
  }

  if (special.effectType === "strike_pack_change") {
    const allowed =
      !state.strikePackLocked &&
      (state.strikePackFreeSelect || state.strikePackCooldown <= 0);

    return {
      allowed,
      message: allowed ? null : "換装できません"
    };
  }

  if (special.effectType === "os_check") {
    const allowed =
      state.formId === "aile" &&
      getRuleEvade(state, context) >= 1 &&
      !state.strikeOsCheckUsedThisTurn;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  if (special.effectType === "sword_issen") {
    const allowed = state.formId === "sword" && !state.strikeSwordIssenUsed;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  if (special.effectType === "sword_awaken") {
    const allowed = state.formId === "sword" && !state.strikeSwordAwakened;

    return {
      allowed,
      message: allowed ? null : "条件未達"
    };
  }

  if (special.effectType === "short_decisive_battle") {
    const allowed =
      state.formId === "sword" &&
      state.strikeSwordAwakened &&
      getRuleEvade(state, context) >= 1 &&
      state.strikeShortBattleUsedThisTurn < SHORT_DECISIVE_BATTLE_LIMIT;

    return {
      allowed,
      message: allowed ? null : "条件未達、またはこのターンの使用上限"
    };
  }

  if (special.effectType === "agni_full_charge") {
    const allowed =
      state.formId === "launcher" &&
      getRuleEvade(state, context) >= 2 &&
      getRuleActionCount(state, context) >= 1;

    return {
      allowed,
      message: allowed ? null : "行動権1以上・回避2以上が必要"
    };
  }

  if (special.effectType === "agni_output_unlock") {
    const currentAttackContext = context.currentAttackContext || {};
    const slotKey = currentAttackContext.slotKey || null;
    const slotNumber = currentAttackContext.slotNumber || null;

    const allowed =
      state.formId === "launcher" &&
      (slotKey === "slot6" || slotNumber === 6) &&
      Array.isArray(context.currentAttack) &&
      context.currentAttack.length > 0 &&
      !state.strikeAgniOutputUsedThisAction;

    return {
      allowed,
      message: allowed ? null : "ランチャーの6.アグニ(照射砲)選択中のみ実行可能"
    };
  }

  return {
    allowed: true,
    message: null
  };
}

export function executeStrikeSpecial(state, specialKey, context = {}) {
  ensureStrikeState(state);

  const special = state.specials[specialKey];

  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "strike_pack_change") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: makePackChoice(state, context)
    };
  }

  if (special.effectType === "os_check") {
    if (!consumeRuleEvade(state, 1, context)) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    healRuleHp(state, 20, context);
    state.strikeOsCheckUsedThisTurn = true;
    markStrikeActivity(state);

    return {
      handled: true,
      redraw: true,
      message: "OSチェック: 回避-1/20回復"
    };
  }

  if (special.effectType === "sword_issen") {
    state.strikeSwordIssenUsed = true;
    state.strikeSwordNoEvade = true;
    clampSwordNoEvade(state);
    markStrikeActivity(state);

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: "slot7",
        slotData: {
          label: "一閃 200ダメージ",
          desc: "200ダメージ。格闘",
          effect: {
            type: "attack",
            damage: 200,
            count: 1,
            attackType: "melee"
          }
        }
      }
    };
  }

  if (special.effectType === "sword_awaken") {
    state.strikeSwordAwakened = true;
    state.strikePackLocked = true;
    state.strikePackCooldown = 999;
    markStrikeActivity(state);

    return {
      handled: true,
      redraw: true,
      message: "ソード覚醒: 換装永続封印/短期決戦解禁"
    };
  }

  if (special.effectType === "short_decisive_battle") {
    if (!consumeRuleEvade(state, 1, context)) {
      return {
        handled: true,
        redraw: true,
        message: "回避が足りない"
      };
    }

    state.strikeShortBattleUsedThisTurn += 1;
    addRuleAction(state, 1, context);
    markStrikeActivity(state);

    return {
      handled: true,
      redraw: true,
      message: `短期決戦: 行動回数+1（${state.strikeShortBattleUsedThisTurn}/${SHORT_DECISIVE_BATTLE_LIMIT}）`
    };
  }

  if (special.effectType === "agni_full_charge") {
    zeroRuleEvade(state, context);

    if (!consumeRuleAction(state, 1, context)) {
      return {
        handled: true,
        redraw: true,
        message: "行動権が足りない"
      };
    }

    state.strikeLauncherRecoilTurns += 1;
    state.strikeLauncherDamageVulnerable = true;
    markStrikeActivity(state);

    return {
      handled: true,
      redraw: true,
      message: null,
      startSlotAction: {
        slotKey: "slot7",
        slotData: {
          label: "アグニ(フルチャージ) 200ダメージ",
          desc: "200ダメージ。射撃、軽減不可",
          effect: {
            type: "attack",
            damage: 200,
            count: 1,
            attackType: "shoot",
            ignoreReduction: true
          }
        }
      }
    };
  }

  if (special.effectType === "agni_output_unlock") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "numberInput",
        source: "strike_agni_output_unlock",
        effectType: "hp_cost_damage_bonus",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        title: "消費HPを入力",
        digits: 3,
        currentValue: "",
        params: {
          damageRate: 0.5,
          setFlag: "strikeAgniOutputUsedThisAction",
          messagePrefix: "アグニ出力解放"
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

export function onStrikeTurnEnd(state, context = {}) {
  ensureStrikeState(state);

  let redraw = false;

  state.strikeOsCheckUsedThisTurn = false;
  state.shieldActive = false;
  state.strikeAgniOutputUsedThisAction = false;
  state.strikeShortBattleUsedThisTurn = 0;

  if (!state.strikePsArmorBroken && state.strikePsArmor > 0) {
    state.strikePsArmor = Math.min(300, state.strikePsArmor + 5);
    redraw = true;
  }

  if (!state.strikePackFreeSelect && state.strikePackCooldown > 0 && !state.strikePackLocked) {
    state.strikePackCooldown = Math.max(0, state.strikePackCooldown - 1);
    redraw = true;
  }

  if (tickStrikeEffect(state, "strike_seed")) redraw = true;

  return {
    redraw,
    message: null
  };
}

export function onStrikeBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureStrikeState(state);

  state.strikeAgniOutputUsedThisAction = false;
  state.strikeAnchorSureHitActiveThisAction = state.strikeAnchorSureHitNext;

  const isAgniFullChargeSlot7 =
    context.isForcedSlotAction === true &&
    context.slotKey === "slot7" &&
    context.slot?.label?.includes("アグニ(フルチャージ)");

  if (state.strikeLauncherRecoilTurns > 0 && !isAgniFullChargeSlot7) {
    state.strikeLauncherRecoilTurns -= 1;
    consumeRuleAction(state, 1, context);

    return {
      redraw: true,
      message: "ランチャー反動: 行動権-1。この行動は実行できない。",
      cancelSlot: true
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onStrikeEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  return {
    redraw: false,
    message: null
  };
}

export function onStrikeAfterSlotResolved(state, slotNumber, context = {}) {
  ensureStrikeState(state);

  const resolveResult = context.resolveResult || null;

  if (!resolveResult || resolveResult.kind !== "custom") {
    return {
      redraw: false,
      message: null
    };
  }

  if (resolveResult.customEffectId === "strike_seed_awaken") {
    const current = getSeedEffect(state);
    const currentTurns = current && typeof current.turns === "number" ? current.turns : 0;

    setStateEffect(state, "strike_seed", {
      turns: currentTurns + 5,
      skipNextTick: true,
      boost: true,
      boostType: "seed",
      boostName: "S.E.E.D.覚醒"
    });

    doubleRuleEvadeWithOverCap(state, context);
    markStrikeActivity(state);

    return {
      redraw: true,
      message: "S.E.E.D覚醒発動"
    };
  }

  if (resolveResult.customEffectId === "launcher_evade_heal") {
    addRuleEvade(state, 1, context);
    healRuleHp(state, 30, context);
    markStrikeActivity(state);

    return {
      redraw: true,
      message: "回避+1/30回復"
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onStrikeActionResolved(attacker, defender, context = {}) {
  ensureStrikeState(attacker);

  const messages = [];
  let redraw = false;
  const hadAnchorSureHit = attacker.strikeAnchorSureHitActiveThisAction;

  if (context.totalCount > 0) {
    markStrikeActivity(attacker);
    redraw = true;
  }

  if (hadAnchorSureHit) {
    attacker.strikeAnchorSureHitActiveThisAction = false;
    attacker.strikeAnchorSureHitNext = false;
    messages.push("アンカー捕縛: 次攻撃必中を消費");
    redraw = true;
  }

  if (attacker.formId === "sword") {
    if (context.slotNumber === 4 && context.hitCount > 0) {
      addRuleAction(attacker, 1, context);
      attacker.strikeAnchorSureHitNext = true;
      messages.push("アンカー捕縛: 行動回数+1 / 次の攻撃必中");
      redraw = true;
    }

    if (
      (context.slotNumber === 6 || context.slotNumber === 1) &&
      context.totalCount > 0 &&
      context.hitCount === context.totalCount &&
      getEnemyRuleEvade(defender, context) > 0
    ) {
      consumeEnemyRuleEvade(defender, 1, context);
      messages.push("ｲｰｹﾞﾙｼｭﾃﾙﾝ牽制効果: 相手回避-1");
      redraw = true;
    }
  }

  return {
    redraw,
    message: messages.length > 0 ? messages.join("\n") : null
  };
}

export function onStrikeDamaged(defender, attacker) {
  return {
    redraw: false,
    message: null
  };
}

export function modifyStrikeTakenDamage(defender, attacker, attack, damage) {
  ensureStrikeState(defender);

  let finalDamage = damage;
  const messages = [];

  if (defender.strikeShieldActive) {
    finalDamage = Math.ceil(finalDamage / 2);
    messages.push("シールド: ダメージ半減");
  }

  if (defender.strikeLauncherDamageVulnerable) {
    finalDamage = Math.ceil(finalDamage * 1.5);
    messages.push("ランチャー反動: 被ダメージ1.5倍");
  }

  const psTarget = !attack?.beam && !attack?.ignoreReduction;

  if (!defender.strikePsArmorBroken && defender.strikePsArmor > 0 && psTarget) {
    const rawForArmor = finalDamage;

    if (rawForArmor <= 100) {
      finalDamage = Math.ceil(rawForArmor / 2);
    } else {
      finalDamage = 50;
    }

    defender.strikePsArmor = Math.max(0, defender.strikePsArmor - rawForArmor);
    messages.push(`PS装甲: ${rawForArmor}を耐久で受け止め`);

    if (defender.strikePsArmor <= 0) {
      defender.strikePsArmor = 0;
      defender.strikePsArmorBroken = true;
      messages.push("フェイズシフトダウン");
    }
  }

  return {
    damage: finalDamage,
    message: messages.length > 0 ? messages.join("\n") : null
  };
}

export function modifyStrikeEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureStrikeState(defender);

  if (!getSeedEffect(defender)) {
    return { handled: false };
  }

  const defenderEvade = getRuleEvade(defender, {
    ...context,
    ownerPlayer: context.enemyPlayer || context.defenderPlayer
  });

  if (attack?.cannotEvade) {
    if (defenderEvade <= 0) {
      return {
        handled: true,
        ok: false,
        reason: "noEvade",
        message: "回避が足りない"
      };
    }

    return {
      handled: true,
      ok: true,
      consumeEvade: 1,
      consumeByAdapter: true,
      message: null
    };
  }

  return {
    handled: false
  };
}

export function onStrikeResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureStrikeState(state);

  if (pendingChoice.source === "strike_pack_change") {
    if (!PACK_FORM_IDS.includes(selectedValue)) {
      return {
        handled: true,
        redraw: false,
        message: "換装先が不正です"
      };
    }

    if (state.strikePackLocked) {
      return {
        handled: true,
        redraw: false,
        message: "ストライカーパック換装は封印されています"
      };
    }

    const changed = setForm(state, selectedValue, {
      preserveHp: true,
      preserveEvade: true
    });

    clampSwordNoEvade(state);

    if (!(state.formId === "sword" && state.strikeSwordNoEvade)) {
      applyStrikeOverEvadeState(state);
    }

    state.strikeLauncherDamageVulnerable = false;
    state.strikePackCooldownArmed = true;
    state.strikePackCooldown = 0;

    return {
      handled: true,
      redraw: true,
      message: changed ? "ストライカーパック換装" : "換装失敗"
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
