//ここには初期装備のもの以外のスロット、装備品、スキルの定義は増やさないこと。追加スキルやスロットの特殊効果はドロップ元機体のファイルで定義して引用できる形にすること。//


import { reduceEvade } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

import {
  getStoryDropDerivedStatus,
  canUseStoryDropSpecial,
  executeStoryDropSpecial,
  modifyStoryDropTakenDamage,
  onStoryDropResolveChoice,
  onStoryDropEnemyBeforeSlot,
  onStoryDropTurnEnd
} from "../story/story_drop_effect_runtime.js";

import {
  getStoryChapter3DerivedState,
  canUseStoryChapter3Special,
  executeStoryChapter3Special,
  onStoryChapter3TurnEnd,
  onStoryChapter3BeforeSlot,
  onStoryChapter3EnemyBeforeSlot,
  onStoryChapter3AfterSlotResolved,
  onStoryChapter3ActionResolved,
  onStoryChapter3Damaged,
  modifyStoryChapter3TakenDamage,
  modifyStoryChapter3EvadeAttempt,
  onStoryChapter3ResolveChoice
} from "./js_unit_rules_story_chapter3.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function ensureProtoCreateState(state) {
  if (!state) return;

  if (typeof state.storyDestroyerUses !== "number") state.storyDestroyerUses = 3;

  if (typeof state.storyEnergyMax !== "number") {
    state.storyEnergyMax = Number(state.storyEnergyMax || 100);
  }

  if (typeof state.storyEnergy !== "number") {
    state.storyEnergy = state.storyEnergyMax;
  }

  if (!state.storyAmmo || typeof state.storyAmmo !== "object") state.storyAmmo = {};
  if (!state.storyReloadCounters || typeof state.storyReloadCounters !== "object") state.storyReloadCounters = {};
  if (!state.storyReloadFollowUpUsed || typeof state.storyReloadFollowUpUsed !== "object") state.storyReloadFollowUpUsed = {};

  if (typeof state.storyEnergyAdjustStacks !== "number") state.storyEnergyAdjustStacks = 0;
  if (typeof state.storyShieldUses !== "number") state.storyShieldUses = 3;
  if (typeof state.storyShieldActive !== "boolean") state.storyShieldActive = false;
  if (typeof state.storyRoundForceCooldown !== "number") state.storyRoundForceCooldown = 0;

  SLOT_KEYS.forEach(slotKey => {
    const effect = state.slots?.[slotKey]?.effect;
    if (!effect?.storyReload) return;

    if (typeof state.storyAmmo[slotKey] !== "number") {
      state.storyAmmo[slotKey] = Number(effect.storyAmmoMax || 0);
    }

    if (typeof state.storyReloadCounters[slotKey] !== "number") {
      state.storyReloadCounters[slotKey] = 0;
    }

    if (typeof state.storyReloadFollowUpUsed[slotKey] !== "boolean") {
      state.storyReloadFollowUpUsed[slotKey] = false;
    }
  });
}

function cloneSlotWithEffect(slot, effectPatch) {
  return {
    ...slot,
    effect: {
      ...(slot.effect || {}),
      ...effectPatch
    }
  };
}

function makeNoFireSlot(slot, reason) {
  return {
    ...slot,
    label: `${slot.label} [不発]`,
    desc: reason,
    effect: {
      type: "custom",
      customType: "proto_create_no_fire",
      effectId: "proto_create_no_fire"
    }
  };
}

function getEnergyAdjustedEffect(effect, stacks) {
  if (!effect?.storyEnergy || stacks === 0) return effect;

  const baseDamage = Number(effect.damage || 0);
  const baseCost = Number(effect.storyEnergyCost || 0);
  const rate = Math.max(0, 1 + 0.5 * stacks);

  return {
    ...effect,
    damage: Math.floor(baseDamage * rate),
    storyEnergyCost: Math.max(0, Math.floor(baseCost * rate))
  };
}

function getReloadChoices(state) {
  ensureProtoCreateState(state);

  return SLOT_KEYS
    .map(slotKey => {
      const slot = state.slots?.[slotKey];
      const effect = slot?.effect;
      if (!effect?.storyReload) return null;

      const max = Number(effect.storyAmmoMax || 0);
      const now = Number(state.storyAmmo?.[slotKey] ?? max);

      return {
        label: `${slot.label} ${now}/${max}`,
        value: slotKey
      };
    })
    .filter(Boolean);
}

function canReloadFollowUp(state, slotKey) {
  ensureProtoCreateState(state);

  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;
  if (!effect?.storyReload) return false;

  const ammo = Number(state.storyAmmo?.[slotKey] || 0);
  if (ammo <= 0) return false;

  if (state.storyReloadFollowUpUsed?.[slotKey] === true) return false;

  return Number(state.evade || 0) > 0;
}

function makeAttackFromEffect(slot, effect, sourceLabel = slot.label) {
  return createAttack({
    damage: Number(effect.damage || 0),
    count: Math.max(1, Number(effect.count || 1)),
    type: effect.attackType || "shoot",
    beam: effect.beam === true,
    ignoreReduction: effect.ignoreReduction === true,
    cannotEvade: effect.cannotEvade === true,
    onHit: effect.onHit || null,
    sourceLabel
  });
}

export function getProtoCreateDerivedState(state) {
  ensureProtoCreateState(state);

  const result = {
    name: null,
    slots: {},
    specials: {},
    status: []
  };

  result.status.push({
    text: `EN:${state.storyEnergy}/${state.storyEnergyMax}`,
    color: "#66ccff",
    bold: true
  });

  result.status.push({
    text: `シールド:${state.storyShieldUses}`,
    color: state.storyShieldActive ? "#66ffcc" : "#cccccc",
    bold: state.storyShieldActive === true
  });

  if (state.storyRoundForceCooldown > 0) {
    result.status.push({
      text: `ラウンドフォースCT:${state.storyRoundForceCooldown}`,
      color: "#ff9999",
      bold: true
    });
  }

  if (String(Object.values(state.specials || {}).map(s => s?.name || "").join(" ")).includes("破壊者")) {
    result.status.push({
      text: `破壊者:${state.storyDestroyerUses}`,
      color: state.storyDestroyerUses > 0 ? "#ff6666" : "#777777",
      bold: true
    });
  }

  if (state.storyEnergyAdjustStacks !== 0) {
    result.status.push({
      text: `EN調整:${state.storyEnergyAdjustStacks}`,
      color: "#ffcc66",
      bold: true
    });
  }

  result.status.push(...getStoryDropDerivedStatus(state));

  const chapter3Derived = getStoryChapter3DerivedState(state);
  if (Array.isArray(chapter3Derived?.status)) {
    result.status.push(...chapter3Derived.status);
  }

  SLOT_KEYS.forEach(slotKey => {
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
    if (!slot || !effect) return;

    const adjustedEffect = getEnergyAdjustedEffect(effect, state.storyEnergyAdjustStacks);
    const tags = [];

    if (effect.storyReload) {
      const max = Number(effect.storyAmmoMax || 0);
      const now = Number(state.storyAmmo?.[slotKey] ?? max);
      tags.push(`[R:${now}/${max}]`);
    }

    if (adjustedEffect.storyEnergy) {
      tags.push(`[EN${adjustedEffect.storyEnergyCost}]`);
    }

    if (tags.length || adjustedEffect !== effect) {
      result.slots[slotKey] = {
        ...slot,
        label: `${slot.label}${tags.length ? " " + tags.join("") : ""}`,
        effect: adjustedEffect
      };
    }
  });

  return result;
}

export function canUseProtoCreateSpecial(state, specialKey, context = {}) {
  ensureProtoCreateState(state);

  const special = state.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つかりません" };

  const chapter3CanUse = canUseStoryChapter3Special(state, specialKey, context);
  if (chapter3CanUse?.allowed === false) return chapter3CanUse;

  if (special.effectType === "story_reload") {
    const choices = getReloadChoices(state);
    return {
      allowed: choices.length > 0,
      message: choices.length > 0 ? null : "リロード武器がありません"
    };
  }

  if (special.effectType === "story_energy_charge") {
    return {
      allowed: state.storyEnergy < state.storyEnergyMax,
      message: state.storyEnergy < state.storyEnergyMax ? null : "ENは最大です"
    };
  }

  if (special.effectType === "story_energy_adjust") {
    return { allowed: true, message: null };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
    const dropSpecialResult = canUseStoryDropSpecial(state, special);
    if (dropSpecialResult) return dropSpecialResult;

    if (!String(special.name || "").includes("シールド")) {
      return { allowed: false, message: "装備品がありません" };
    }

    return {
      allowed: state.storyShieldUses > 0,
      message: state.storyShieldUses > 0 ? null : "シールド残数がありません"
    };
  }

if (special.effectType === "story_create_skill") {
  const dropSpecialResult = canUseStoryDropSpecial(state, special);
  if (dropSpecialResult) return dropSpecialResult;

  const name = String(special.name || "");

  if (name.includes("ラウンドフォース")) {
      return {
        allowed: state.storyRoundForceCooldown <= 0,
        message: state.storyRoundForceCooldown <= 0 ? null : `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン`
      };
    }

    if (name.includes("破壊者")) {
      return {
        allowed: state.storyDestroyerUses > 0,
        message: state.storyDestroyerUses > 0 ? null : "破壊者の使用回数がありません"
      };
    }

    return { allowed: false, message: "クリエイトスキルがありません" };
  }

  return { allowed: true, message: null };
}

export function executeProtoCreateSpecial(state, specialKey, context = {}) {
  ensureProtoCreateState(state);

  const special = state.specials?.[specialKey];
  if (!special) {
    return { handled: true, redraw: false, message: "特殊行動データが見つかりません" };
  }

  const chapter3Special = executeStoryChapter3Special(state, specialKey, context);
  if (chapter3Special?.handled === true) return chapter3Special;

  if (special.effectType === "story_reload") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "buttons",
        effectType: "proto_create_reload_choice",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "全弾リロードする武器を選択",
        choices: getReloadChoices(state)
      }
    };
  }

  if (special.effectType === "story_energy_charge") {
    const before = state.storyEnergy;
    state.storyEnergy = state.storyEnergyMax;

    return {
      handled: true,
      redraw: true,
      consumeAction: true,
      message: `エネルギーチャージ：EN${before}→${state.storyEnergy}`
    };
  }

  if (special.effectType === "story_energy_adjust") {
    return {
      handled: true,
      redraw: true,
      message: null,
      requestChoice: {
        choiceType: "buttons",
        effectType: "proto_create_energy_adjust_choice",
        ownerPlayer: context.ownerPlayer,
        enemyPlayer: context.enemyPlayer,
        ownerUnitKey: context.ownerUnitKey || null,
        title: "エネルギー調整",
        choices: [
          { label: "増加", value: "plus" },
          { label: "減少", value: "minus" },
          { label: "リセット", value: "reset" }
        ]
      }
    };
  }

  if (special.effectType === "story_equipment_1" || special.effectType === "story_equipment_2") {
const dropSpecialResult = executeStoryDropSpecial(state, special, context);
    if (dropSpecialResult) return dropSpecialResult;

    if (!String(special.name || "").includes("シールド")) {
      return { handled: true, redraw: false, message: "装備品がありません" };
    }

    if (state.storyShieldUses <= 0) {
      return { handled: true, redraw: false, message: "シールド残数がありません" };
    }

    if (state.storyShieldActive) {
      return { handled: true, redraw: false, message: "シールドは既に展開中" };
    }

    state.storyShieldUses -= 1;
    state.storyShieldActive = true;
    return { handled: true, redraw: true, message: `${state.name} シールド展開。このターンの被ダメージ半減` };
  }

 if (special.effectType === "story_create_skill") {
  const dropSpecialResult = executeStoryDropSpecial(state, special, context);
  if (dropSpecialResult) return dropSpecialResult;

  const name = String(special.name || "");

    if (name.includes("ラウンドフォース")) {
      if (state.storyRoundForceCooldown > 0) {
        return { handled: true, redraw: false, message: `ラウンドフォース再使用まで${state.storyRoundForceCooldown}ターン` };
      }

      state.storyRoundForceCooldown = 5;
      return {
        handled: true,
        redraw: true,
        message: "ラウンドフォース発動",
        appendAttackLabel: "ラウンドフォース",
        appendAttacks: createAttack(100, 1, { type: "melee", source: "ラウンドフォース" })
      };
    }

    if (name.includes("破壊者")) {
      if (state.storyDestroyerUses <= 0) {
        return { handled: true, redraw: false, message: "破壊者の使用回数がありません" };
      }

      return {
        handled: true,
        redraw: true,
        message: null,
        requestChoice: {
          choiceType: "buttons",
          effectType: "proto_create_destroyer_choice",
          ownerPlayer: context.ownerPlayer,
          enemyPlayer: context.enemyPlayer,
          ownerUnitKey: context.ownerUnitKey || null,
          title: "破壊者：追加行動するスロットを選択",
          choices: SLOT_KEYS.map(slotKey => ({
            label: `${slotKey.replace("slot", "")}.${state.slots?.[slotKey]?.label || slotKey}`,
            value: slotKey
          }))
        }
      };
    }

    return { handled: true, redraw: false, message: "クリエイトスキルがありません" };
  }

  return { handled: false, redraw: false, message: null };
}

export function onProtoCreateResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureProtoCreateState(state);
  const dropChoiceResult = onStoryDropResolveChoice(state, pendingChoice, selectedValue, context);
if (dropChoiceResult?.handled === true) return dropChoiceResult;

  const chapter3Choice = onStoryChapter3ResolveChoice(state, pendingChoice, selectedValue, context);
  if (chapter3Choice?.handled === true) return chapter3Choice;

  if (pendingChoice?.effectType === "proto_create_reload_choice") {
    const slotKey = String(selectedValue || "");
    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;

    if (!slot || !effect?.storyReload) {
      return { handled: true, redraw: false, message: "リロード対象が不正です" };
    }

    const max = Number(effect.storyAmmoMax || 0);
    const before = Number(state.storyAmmo?.[slotKey] || 0);
    state.storyAmmo[slotKey] = max;
    state.storyReloadCounters[slotKey] = 0;

    return {
      handled: true,
      redraw: true,
      consumeAction: true,
      message: `${slot.label} 全弾リロード：${before}→${max}`
    };
  }

  if (pendingChoice?.effectType === "proto_create_energy_adjust_choice") {
    const value = String(selectedValue || "");

    if (value === "plus") state.storyEnergyAdjustStacks += 1;
    if (value === "minus") state.storyEnergyAdjustStacks -= 1;
    if (value === "reset") state.storyEnergyAdjustStacks = 0;

    return {
      handled: true,
      redraw: true,
      message: `エネルギー調整：${state.storyEnergyAdjustStacks}`
    };
  }

  if (pendingChoice?.effectType === "proto_create_destroyer_choice") {
    const slotKey = String(selectedValue || "");

    if (!SLOT_KEYS.includes(slotKey) || !state.slots?.[slotKey]) {
      return { handled: true, redraw: false, message: "破壊者の対象スロットが不正です" };
    }

    if (state.storyDestroyerUses <= 0) {
      return { handled: true, redraw: false, message: "破壊者の使用回数がありません" };
    }

    state.storyDestroyerUses -= 1;

    return {
      handled: true,
      redraw: true,
      message: `破壊者：${state.slots[slotKey].label}を追加行動`,
      startSlotAction: {
        slotKey
      }
    };
  }

  if (pendingChoice?.effectType === "proto_create_reload_followup") {
    const slotKey = String(selectedValue || "");

    if (slotKey === "cancel") {
      return { handled: true, redraw: true, message: "追撃しませんでした" };
    }

    if (!canReloadFollowUp(state, slotKey)) {
      return { handled: true, redraw: true, message: "追撃できません" };
    }

    const slot = state.slots?.[slotKey];
    const effect = slot?.effect;
    const ammo = Number(state.storyAmmo?.[slotKey] || 0);
    const baseCount = Math.max(1, Number(effect.count || 1));
    const useCount = Math.min(baseCount, ammo);

    if (useCount <= 0) {
      return { handled: true, redraw: true, message: `${slot.label} 弾切れ` };
    }

    reduceEvade(state, 1);
    state.storyReloadFollowUpUsed[slotKey] = true;
    state.storyAmmo[slotKey] = ammo - useCount;

    const appendAttacks = createAttack(
      Number(effect.damage || 0),
      useCount,
      {
        type: effect.attackType || "shoot",
        beam: effect.beam === true,
        ignoreReduction: effect.ignoreReduction === true,
        cannotEvade: effect.cannotEvade === true,
        onHit: effect.onHit || null,
        source: `${slot.label} 追撃`
      }
    );

    return {
      handled: true,
      redraw: true,
      message: `${slot.label} 追撃：弾数${ammo}→${state.storyAmmo[slotKey]}`,
      appendAttacks
    };
  }

  return { handled: false, redraw: false, message: null };
}

export function onProtoCreateBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureProtoCreateState(state);

  const slotKey = `slot${rolledSlotNumber}`;
  const slot = state.slots?.[slotKey];
  const effect = slot?.effect;

  if (!slot || !effect) return { redraw: false, message: null };

  let nextSlot = slot;
  const messages = [];

  const chapter3Before = onStoryChapter3BeforeSlot(state, rolledSlotNumber, {
    ...context,
    slot: nextSlot
  });

  if (chapter3Before?.replaceSlotAction?.slotData) {
    nextSlot = chapter3Before.replaceSlotAction.slotData;
  }

  if (chapter3Before?.message) {
    messages.push(chapter3Before.message);
  }

  if (effect.storyReload) {
    const ammo = Number(state.storyAmmo?.[slotKey] || 0);
    const baseCount = Math.max(1, Number(effect.count || 1));

    if (ammo <= 0) {
      const noFireSlot = makeNoFireSlot(slot, `${slot.label} 弾切れ`);
      return {
        redraw: true,
        message: `${slot.label} 弾切れ`,
        replaceSlotAction: {
          slotKey,
          slotData: noFireSlot
        }
      };
    }

    const useCount = Math.min(baseCount, ammo);
    state.storyAmmo[slotKey] = ammo - useCount;
    state.storyReloadFollowUpUsed[slotKey] = false;

    nextSlot = cloneSlotWithEffect(nextSlot, { count: useCount });
    messages.push(`${slot.label} 弾数${ammo}→${state.storyAmmo[slotKey]}`);
  }

  if (nextSlot.effect?.storyEnergy) {
    const adjusted = getEnergyAdjustedEffect(nextSlot.effect, state.storyEnergyAdjustStacks);
    const need = Number(adjusted.storyEnergyCost || 0);
    const have = Number(state.storyEnergy || 0);

    if (have <= 0) {
      const noFireSlot = makeNoFireSlot(slot, `${slot.label} EN切れ`);
      return {
        redraw: true,
        message: `${slot.label} EN切れ`,
        replaceSlotAction: {
          slotKey,
          slotData: noFireSlot
        }
      };
    }

    if (need > 0 && have < need) {
      const rate = have / need;
      nextSlot = cloneSlotWithEffect(nextSlot, {
        ...adjusted,
        damage: Math.max(1, Math.floor(Number(adjusted.damage || 0) * rate)),
        storyEnergyCost: have
      });
      state.storyEnergy = 0;
      messages.push(`${slot.label} EN不足：出力低下`);
    } else {
      nextSlot = cloneSlotWithEffect(nextSlot, adjusted);
      state.storyEnergy = Math.max(0, have - need);
      messages.push(`${slot.label} EN${have}→${state.storyEnergy}`);
    }
  }

  return {
    redraw: messages.length > 0,
    message: messages.join("\n") || null,
    replaceSlotAction: {
      slotKey,
      slotData: nextSlot
    }
  };
}

export function onProtoCreateAfterSlotResolved(state, slotNumber, resolveResult, context = {}) {
  ensureProtoCreateState(state);

  const chapter3Result = onStoryChapter3AfterSlotResolved(state, slotNumber, resolveResult, context);
  if (
    chapter3Result?.redraw === true ||
    chapter3Result?.message ||
    Array.isArray(chapter3Result?.appendAttacks)
  ) {
    return chapter3Result;
  }

  return { redraw: false, message: null };
}

export function onProtoCreateTurnEnd(state, context = {}) {
  ensureProtoCreateState(state);

  let redraw = false;
  const messages = [];

  const beforeEnergy = state.storyEnergy;
  state.storyEnergy = Math.min(state.storyEnergyMax, state.storyEnergy + 5);
  if (state.storyEnergy !== beforeEnergy) redraw = true;

  SLOT_KEYS.forEach(slotKey => {
    const effect = state.slots?.[slotKey]?.effect;
    if (!effect?.storyReload) return;

    const max = Number(effect.storyAmmoMax || 0);
    const now = Number(state.storyAmmo?.[slotKey] || 0);
    if (now >= max) return;

    if (effect.storyReloadPerTurn) {
      state.storyAmmo[slotKey] = Math.min(max, now + Number(effect.storyReloadPerTurn));
      redraw = true;
      return;
    }

    if (effect.storyReloadTurnInterval && effect.storyReloadPerInterval) {
      state.storyReloadCounters[slotKey] += 1;

      if (state.storyReloadCounters[slotKey] >= Number(effect.storyReloadTurnInterval)) {
        state.storyReloadCounters[slotKey] = 0;
        state.storyAmmo[slotKey] = Math.min(max, now + Number(effect.storyReloadPerInterval));
        redraw = true;
      }
    }
  });

  if (state.storyRoundForceCooldown > 0) {
    state.storyRoundForceCooldown -= 1;
    redraw = true;
  }

  state.storyShieldActive = false;
  state.storyReloadFollowUpUsed = {};
const dropTurnEnd = onStoryDropTurnEnd(state, context);
if (dropTurnEnd?.redraw) redraw = true;
  
  const chapter3TurnEnd = onStoryChapter3TurnEnd(state, context);
  if (chapter3TurnEnd?.redraw) redraw = true;
  if (chapter3TurnEnd?.message) messages.push(chapter3TurnEnd.message);

  return {
    redraw,
    message: messages.join("\n") || null
  };
}

export function modifyProtoCreateTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureProtoCreateState(defender);

  let nextDamage = Math.max(0, Number(damage || 0));
  const messages = [];

  if (defender.storyShieldActive) {
    nextDamage = Math.floor(nextDamage / 2);
    messages.push("シールドによりダメージ半減");
  }

  const dropResult = modifyStoryDropTakenDamage(defender, attacker, attack, nextDamage);
  nextDamage = Math.max(0, Number(dropResult?.damage ?? nextDamage));
  if (dropResult?.message) messages.push(dropResult.message);

  const chapter3Damage = modifyStoryChapter3TakenDamage(defender, attacker, attack, nextDamage, context);
  nextDamage = Math.max(0, Number(chapter3Damage?.damage ?? nextDamage));
  if (chapter3Damage?.message) messages.push(chapter3Damage.message);

  return {
    damage: nextDamage,
    message: messages.join(" / ") || null
  };
}

export function onProtoCreateActionResolved(attacker, defender, context = {}) {
  ensureProtoCreateState(attacker);

  const chapter3Action = onStoryChapter3ActionResolved(attacker, defender, context);
  if (
    chapter3Action?.redraw === true ||
    chapter3Action?.message ||
    Array.isArray(chapter3Action?.appendAttacks) ||
    chapter3Action?.requestChoice
  ) {
    return chapter3Action;
  }

  const slotNumber = context.slotNumber;
  const slotKey = slotNumber ? `slot${slotNumber}` : null;
  const slot = slotKey ? attacker.slots?.[slotKey] : null;

  if (!slot?.effect?.storyReload) {
    return { redraw: false, message: null };
  }

  if (!canReloadFollowUp(attacker, slotKey)) {
    return { redraw: false, message: null };
  }

  return {
    redraw: true,
    message: `${slot.label} は弾数が残っています。追撃は続けてスロット行動`,
    requestChoice: {
      choiceType: "buttons",
      effectType: "proto_create_reload_followup",
      ownerPlayer: context.ownerPlayer,
      enemyPlayer: context.enemyPlayer,
      ownerUnitKey: context.ownerUnitKey || null,
      title: `${slot.label}で追撃しますか？`,
      choices: [
        { label: "回避1消費で追撃", value: slotKey },
        { label: "追撃しない", value: "cancel" }
      ]
    }
  };
}

export function onProtoCreateDamaged(defender, attacker, context = {}) {
  return onStoryChapter3Damaged(defender, attacker, context);
}

export function onProtoCreateEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  const dropResult = onStoryDropEnemyBeforeSlot(state, rolledSlotNumber, context);
  if (dropResult?.redraw === true || dropResult?.message) return dropResult;

  return onStoryChapter3EnemyBeforeSlot(state, rolledSlotNumber, context);
}

export function modifyProtoCreateEvadeAttempt(defender, attacker, attack, context = {}) {
  return modifyStoryChapter3EvadeAttempt(defender, attacker, attack, context);
}
