import { findStorySlotOption, findStoryEquipmentOption, findStorySkillOption } from "./story_create_lab_data.js";
import { collectStoryDropOptions } from "./story_drop_registry.js";
import { createAttack } from "../js/js_battle_system.js";
import { addEvade, reduceEvade } from "../js/js_unit_runtime.js";

import {
  getStoryGundamDropDerivedStatus,
  canUseStoryGundamDropSpecial,
  executeStoryGundamDropSpecial,
  onStoryGundamDropResolveChoice,
  onStoryGundamDropEnemyBeforeSlot,
  onStoryGundamDropTurnEnd
} from "../js/js_unit_rules_story_gundam.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function ensureStoryDropRuntimeState(state) {
  if (!state) return;
  if (!state.storyDropRuntime || typeof state.storyDropRuntime !== "object") {
    state.storyDropRuntime = {};
  }
  if (typeof state.storyDropRuntime.oneEyesTargetBarrier !== "number") {
    state.storyDropRuntime.oneEyesTargetBarrier = 120;
  }
}

function heal(state, amount) {
  const value = Math.max(0, Number(amount || 0));
  state.hp = Math.min(Number(state.maxHp || state.hp || 0), Number(state.hp || 0) + value);
  return value;
}

function damageSelf(state, amount) {
  const value = Math.max(0, Number(amount || 0));
  state.hp = Math.max(0, Number(state.hp || 0) - value);
  return value;
}

function isGundamNtSense(option) {
  const data = option?.data || {};
  const label = String(option?.label || "");
  return data.effectId === "story_gundam_nt_prediction" || label.includes("ニュータイプ感性");
}

function getEquippedDropOptions(state) {
  const result = [];

  SLOT_KEYS.forEach(slotKey => {
    const optionId = state?.storyLabSelectedSlots?.[slotKey] || state?.labSelectedSlots?.[slotKey];
    if (!optionId) return;
    const option = findStorySlotOption(slotKey, optionId);
    if (option?.data) result.push({ kind: "slot", key: slotKey, option });
  });

  ["equipment1", "equipment2"].forEach(equipmentKey => {
    const optionId =
      state?.storyLabEquipment?.[equipmentKey] ||
      state?.labEquipment?.[equipmentKey] ||
      state?.storyEquipmentIds?.[equipmentKey];

    if (!optionId) return;
    const option = findStoryEquipmentOption(optionId);
    if (option?.data) result.push({ kind: "equipment", key: equipmentKey, option });
  });

  const skillId = state?.storyLabSkill || state?.labSkill || state?.storySkillId;
  if (skillId) {
    const option = findStorySkillOption(skillId);
    if (option?.data) result.push({ kind: "skill", key: "skill", option });
  }

  const specials = Object.values(state?.specials || {});
  specials.forEach(special => {
    const name = String(special?.name || "");

    ["skill", "equipment"].forEach(kind => {
      collectStoryDropOptions(kind).forEach(option => {
        if (!option?.label) return;
        if (!name.includes(option.label)) return;
        if (result.some(item => item.option?.id === option.id)) return;
        result.push({ kind, key: special.effectType || kind, option });
      });
    });
  });

  return result;
}

export function getEquippedStoryDropEffects(state) {
  return getEquippedDropOptions(state);
}

function getUseCount(state, option, maxUses) {
  ensureStoryDropRuntimeState(state);
  const key = `${option.id}_uses`;
  if (typeof state.storyDropRuntime[key] !== "number") {
    state.storyDropRuntime[key] = Number(maxUses || 0);
  }
  return state.storyDropRuntime[key];
}

function spendUse(state, option) {
  const key = `${option.id}_uses`;
  state.storyDropRuntime[key] = Math.max(0, Number(state.storyDropRuntime[key] || 0) - 1);
}

function getCooldown(state, option) {
  ensureStoryDropRuntimeState(state);
  const key = `${option.id}_cooldown`;
  if (typeof state.storyDropRuntime[key] !== "number") state.storyDropRuntime[key] = 0;
  return state.storyDropRuntime[key];
}

function setCooldown(state, option, value) {
  ensureStoryDropRuntimeState(state);
  state.storyDropRuntime[`${option.id}_cooldown`] = Math.max(0, Number(value || 0));
}

export function getStoryDropDerivedStatus(state) {
  ensureStoryDropRuntimeState(state);
  const result = [];

  getEquippedStoryDropEffects(state).forEach(({ option }) => {
    const data = option?.data || {};

    if (data.kind === "equipment_damage_barrier") {
      const max = Number(data.barrierValue || 0);
      const remain = Number(state.storyDropRuntime.oneEyesTargetBarrier ?? max);
      result.push({ text: `${option.label}:${remain}`, color: remain > 0 ? "#66ccff" : "#777777", bold: remain > 0 });
    }

    if (data.kind === "equipment_attack" || data.kind === "action_gain_equipment") {
      const remain = getUseCount(state, option, data.uses || 0);
      result.push({ text: `${option.label}:${remain}`, color: remain > 0 ? "#ffcc66" : "#777777", bold: remain > 0 });
    }

    if (data.effectId === "death_army_arts") {
      const cooldown = getCooldown(state, option);
      result.push({ text: `${option.label}CT:${cooldown}`, color: cooldown > 0 ? "#ff9999" : "#66ffcc", bold: true });
    }

    if (isGundamNtSense(option)) {
      result.push(...getStoryGundamDropDerivedStatus(state, option));
    }
  });

  return result;
}

export function canUseStoryDropSpecial(state, special) {
  const name = String(special?.name || "");
  const matched = getEquippedStoryDropEffects(state).find(({ option }) => option?.label && name.includes(option.label));
  if (!matched) return null;

  const data = matched.option?.data || {};

  if (isGundamNtSense(matched.option)) {
    return canUseStoryGundamDropSpecial(state, matched.option, special);
  }

  if (data.kind === "equipment_damage_barrier" || data.kind === "turn_regen_or_damage_by_evade") {
    return { allowed: false, message: `${matched.option.label}は自動発動装備です` };
  }

  if (data.kind === "equipment_attack" || data.kind === "action_gain_equipment") {
    const remain = getUseCount(state, matched.option, data.uses || 0);
    return {
      allowed: remain > 0,
      message: remain > 0 ? null : `${matched.option.label}の使用回数がありません`
    };
  }

if (data.effectId === "death_army_arts") {
  const cooldown = getCooldown(state, matched.option);
  const evadeCost = Number(data.evadeCost ?? data.actionCost ?? 1);

  if (cooldown > 0) {
    return { allowed: false, message: `${matched.option.label}再使用まで${cooldown}ターン` };
  }

  if (Number(state.evade || 0) < evadeCost) {
    return { allowed: false, message: `${matched.option.label}：回避が足りません` };
  }

  return { allowed: true, message: null };
}

  return null;
}

function createDeathArmyArtsResult(state) {
  const table = [
    {
      label: "棍棒型ビームライフル",
      run: () => createAttack(70, 1, { type: "shoot", beam: true, source: "デスアーミーアーツ：棍棒型ビームライフル" })
    },
    {
      label: "電撃銛",
      run: () => createAttack(50, 1, { type: "melee", onHit: "reduce_evade_2", source: "デスアーミーアーツ：電撃銛" })
    },
    {
      label: "マシンガンデスライフル",
      run: () => createAttack(10, 6, { type: "shoot", source: "デスアーミーアーツ：マシンガンデスライフル" })
    },
    {
      label: "回避 2回",
      run: () => {
        addEvade(state, 2);
        return [];
      }
    },
    {
      label: "マスタークロス",
      run: () => createAttack(10, 1, { type: "melee", onHit: "next_attack_cannot_evade", source: "デスアーミーアーツ：マスタークロス" })
    },
    {
      label: "棍棒",
      run: () => createAttack(80, 1, { type: "melee", source: "デスアーミーアーツ：棍棒" })
    },
    {
      label: "銛突進",
      run: () => createAttack(100, 1, { type: "melee", source: "デスアーミーアーツ：銛突進" })
    },
    {
      label: "電撃銛連撃",
      run: () => createAttack(30, 3, { type: "melee", onHit: "reduce_evade_1_each", source: "デスアーミーアーツ：電撃銛連撃" })
    },
    {
      label: "格闘",
      run: () => createAttack(20, 3, { type: "melee", source: "デスアーミーアーツ：格闘" })
    },
    {
      label: "フェイクダークネスフィンガー",
      run: () => createAttack(150, 1, { type: "melee", ignoreReduction: true, source: "デスアーミーアーツ：フェイクダークネスフィンガー" })
    }
  ];

  const selected = table[Math.floor(Math.random() * table.length)];
  return {
    label: selected.label,
    attacks: selected.run()
  };
}

export function executeStoryDropSpecial(state, special, context = {}) {
  const name = String(special?.name || "");
  const matched = getEquippedStoryDropEffects(state).find(({ option }) => option?.label && name.includes(option.label));
  if (!matched) return null;

  const data = matched.option?.data || {};

  if (isGundamNtSense(matched.option)) {
    return executeStoryGundamDropSpecial(state, matched.option, special, context);
  }

  if (data.kind === "equipment_damage_barrier" || data.kind === "turn_regen_or_damage_by_evade") {
    return { handled: true, redraw: false, message: `${matched.option.label}は自動発動装備です` };
  }

  if (data.kind === "action_gain_equipment") {
    const remain = getUseCount(state, matched.option, data.uses || 0);
    if (remain <= 0) return { handled: true, redraw: false, message: `${matched.option.label}の使用回数がありません` };

    spendUse(state, matched.option);
    state.actionCount = Number(state.actionCount || 0) + Number(data.actionGain || 0);

    return {
      handled: true,
      redraw: true,
      message: `${matched.option.label}：行動権+${Number(data.actionGain || 0)}`
    };
  }

  if (data.kind === "equipment_attack") {
    const remain = getUseCount(state, matched.option, data.uses || 0);
    if (remain <= 0) return { handled: true, redraw: false, message: `${matched.option.label}の使用回数がありません` };

    spendUse(state, matched.option);

    return {
      handled: true,
      redraw: true,
      message: `${matched.option.label}使用`,
      appendAttackLabel: matched.option.label,
      appendAttacks: createAttack(Number(data.damage || 0), Number(data.count || 1), {
        type: data.attackType || "melee",
        beam: data.beam === true,
        ignoreReduction: data.ignoreReduction === true,
        cannotEvade: data.cannotEvade === true,
        source: matched.option.label
      })
    };
  }

if (data.effectId === "death_army_arts") {
  const cooldown = getCooldown(state, matched.option);
  const evadeCost = Number(data.evadeCost ?? data.actionCost ?? 1);

  if (cooldown > 0) {
    return { handled: true, redraw: false, message: `${matched.option.label}再使用まで${cooldown}ターン` };
  }

  if (Number(state.evade || 0) < evadeCost) {
    return { handled: true, redraw: false, message: `${matched.option.label}：回避が足りません` };
  }

  reduceEvade(state, evadeCost);
  setCooldown(state, matched.option, Number(data.cooldown || 3));

  const artsResult = createDeathArmyArtsResult(state);

  return {
    handled: true,
    redraw: true,
    consumeAction: false,
    message: `デスアーミーアーツ発動：${artsResult.label} / 回避-${evadeCost}`,
    appendAttackLabel: `デスアーミーアーツ：${artsResult.label}`,
    appendAttacks: artsResult.attacks
  };
}

  return null;
}

export function onStoryDropResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  const gundamResult = onStoryGundamDropResolveChoice(state, pendingChoice, selectedValue, context);
  if (gundamResult?.handled === true) return gundamResult;
  return { handled: false, redraw: false, message: null };
}

export function onStoryDropEnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  const hasNtSense = getEquippedStoryDropEffects(state).some(({ option }) => isGundamNtSense(option));
  if (hasNtSense) return onStoryGundamDropEnemyBeforeSlot(state, rolledSlotNumber, context);
  return { redraw: false, message: null };
}

export function onStoryDropTurnEnd(state, context = {}) {
  ensureStoryDropRuntimeState(state);

  const messages = [];
  let redraw = false;
  let requestChoice = null;

  getEquippedStoryDropEffects(state).forEach(({ option }) => {
    const data = option?.data || {};

    if (data.kind === "energy_regen_bonus") {
      const before = Number(state.storyEnergy || 0);
      state.storyEnergy = Math.min(Number(state.storyEnergyMax || before), before + Number(data.value || 0));
      if (state.storyEnergy !== before) {
        redraw = true;
        messages.push(`${option.label}:EN+${Number(data.value || 0)}`);
      }
    }

    if (data.kind === "turn_regen_or_damage_by_evade") {
      if (Number(state.evade || 0) > 0) {
        heal(state, Number(data.heal || 0));
        messages.push(`${option.label}:HP+${Number(data.heal || 0)}`);
      } else {
        damageSelf(state, Number(data.damage || 0));
        messages.push(`${option.label}:HP-${Number(data.damage || 0)}`);
      }
      redraw = true;
    }

    if (data.effectId === "death_army_arts") {
      const cooldown = getCooldown(state, option);
      if (cooldown > 0) {
        setCooldown(state, option, cooldown - 1);
        redraw = true;
      }
    }

    if (isGundamNtSense(option)) {
      const gundamTurn = onStoryGundamDropTurnEnd(state, option, context);
      if (gundamTurn?.redraw) redraw = true;
      if (gundamTurn?.message) messages.push(gundamTurn.message);
      if (gundamTurn?.requestChoice) requestChoice = gundamTurn.requestChoice;
    }
  });

  return {
    redraw,
    message: messages.join(" / ") || null,
    requestChoice
  };
}

export function modifyStoryDropTakenDamage(defender, attacker, attack, damage) {
  ensureStoryDropRuntimeState(defender);

  let nextDamage = Math.max(0, Number(damage || 0));
  const messages = [];

  getEquippedStoryDropEffects(defender).forEach(({ option }) => {
    const data = option?.data || {};

    if (data.kind === "equipment_damage_barrier") {
      const max = Number(data.barrierValue || 0);
      if (typeof defender.storyDropRuntime.oneEyesTargetBarrier !== "number") {
        defender.storyDropRuntime.oneEyesTargetBarrier = max;
      }
      if (defender.storyDropRuntime.oneEyesTargetBarrier <= 0 || nextDamage <= 0) return;

      const block = Math.min(defender.storyDropRuntime.oneEyesTargetBarrier, nextDamage);
      defender.storyDropRuntime.oneEyesTargetBarrier -= block;
      nextDamage -= block;
      messages.push(`${option.label}：${block}ダメージ無効化 残${defender.storyDropRuntime.oneEyesTargetBarrier}`);
    }

    if (data.kind === "beam_damage_half_with_energy" && attack?.beam === true && nextDamage > 0) {
      const cost = Number(data.energyCost || 0);
      if (Number(defender.storyEnergy || 0) >= cost) {
        defender.storyEnergy -= cost;
        nextDamage = Math.ceil(nextDamage / 2);
        messages.push(`${option.label}:EN${cost}消費 ビーム半減`);
      }
    }
  });

  return {
    damage: nextDamage,
    message: messages.join(" / ") || null
  };
}
