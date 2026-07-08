import { findStorySlotOption, findStoryEquipmentOption, findStorySkillOption } from "./story_create_lab_data.js";
import { collectStoryDropOptions } from "./story_drop_registry.js";
import { createAttack } from "../js/js_battle_system.js";

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

function isGundamNtSense(option) {
  const data = option?.data || {};
  const label = String(option?.label || "");
  return (
    data.effectId === "story_gundam_nt_prediction" ||
    label.includes("ニュータイプ感性")
  );
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

    collectStoryDropOptions("skill").forEach(option => {
      if (!option?.label) return;
      if (!name.includes(option.label)) return;
      if (result.some(item => item.option?.id === option.id)) return;
      result.push({ kind: "skill", key: special.effectType || "skill", option });
    });

    collectStoryDropOptions("equipment").forEach(option => {
      if (!option?.label) return;
      if (!name.includes(option.label)) return;
      if (result.some(item => item.option?.id === option.id)) return;
      result.push({ kind: "equipment", key: special.effectType || "equipment", option });
    });

    if (name.includes("ワンアイズターゲット")) {
      result.push({
        kind: "equipment",
        key: special?.effectType || "equipment",
        option: {
          id: "one_eyes_target",
          label: "ワンアイズターゲット",
          data: { kind: "equipment_damage_barrier", barrierValue: 120 }
        }
      });
    }
  });

  return result;
}

export function getEquippedStoryDropEffects(state) {
  return getEquippedDropOptions(state);
}

export function getStoryDropDerivedStatus(state) {
  ensureStoryDropRuntimeState(state);

  const result = [];

  getEquippedStoryDropEffects(state).forEach(({ option }) => {
    const data = option?.data || {};

    if (data.kind === "equipment_damage_barrier") {
      const max = Number(data.barrierValue || 0);
      const remain = Number(state.storyDropRuntime.oneEyesTargetBarrier ?? max);
      result.push({
        text: `${option.label}:${remain}`,
        color: remain > 0 ? "#66ccff" : "#777777",
        bold: remain > 0
      });
    }

    if (data.kind === "equipment_attack") {
      const useKey = `${option.id}_uses`;
      const maxUses = Number(data.uses || 0);
      const remain = Number(state.storyDropRuntime[useKey] ?? maxUses);
      result.push({
        text: `${option.label}:${remain}`,
        color: remain > 0 ? "#ffcc66" : "#777777",
        bold: remain > 0
      });
    }

    if (isGundamNtSense(option)) {
      result.push(...getStoryGundamDropDerivedStatus(state, option));
    }
  });

  return result;
}

export function canUseStoryDropSpecial(state, special) {
  const name = String(special?.name || "");
  const matched = getEquippedStoryDropEffects(state).find(({ option }) => {
    return option?.label && name.includes(option.label);
  });

  if (!matched) return null;

  const data = matched.option?.data || {};

  if (isGundamNtSense(matched.option)) {
    return canUseStoryGundamDropSpecial(state, matched.option, special);
  }

  if (data.kind === "equipment_damage_barrier") {
    return { allowed: false, message: `${matched.option.label}は自動発動装備です` };
  }

  if (data.kind === "equipment_attack") {
    ensureStoryDropRuntimeState(state);
    const useKey = `${matched.option.id}_uses`;
    const maxUses = Number(data.uses || 0);

    if (typeof state.storyDropRuntime[useKey] !== "number") {
      state.storyDropRuntime[useKey] = maxUses;
    }

    return {
      allowed: state.storyDropRuntime[useKey] > 0,
      message: state.storyDropRuntime[useKey] > 0 ? null : `${matched.option.label}の使用回数がありません`
    };
  }

  if (data.mochiBonus === true) {
    return { allowed: false, message: `${matched.option.label}は戦闘中効果なしです` };
  }

  return null;
}

export function executeStoryDropSpecial(state, special, context = {}) {
  const name = String(special?.name || "");
  const matched = getEquippedStoryDropEffects(state).find(({ option }) => {
    return option?.label && name.includes(option.label);
  });

  if (!matched) return null;

  const data = matched.option?.data || {};

  if (isGundamNtSense(matched.option)) {
    return executeStoryGundamDropSpecial(state, matched.option, special, context);
  }

  if (data.kind === "equipment_damage_barrier") {
    return { handled: true, redraw: false, message: `${matched.option.label}は自動発動装備です` };
  }

  if (data.kind === "equipment_attack") {
    ensureStoryDropRuntimeState(state);

    const useKey = `${matched.option.id}_uses`;
    const maxUses = Number(data.uses || 0);

    if (typeof state.storyDropRuntime[useKey] !== "number") {
      state.storyDropRuntime[useKey] = maxUses;
    }

    if (state.storyDropRuntime[useKey] <= 0) {
      return { handled: true, redraw: false, message: `${matched.option.label}の使用回数がありません` };
    }

    state.storyDropRuntime[useKey] -= 1;

    return {
      handled: true,
      redraw: true,
      message: `${matched.option.label}使用`,
      appendAttackLabel: matched.option.label,
      appendAttacks: createAttack(
        Number(data.damage || 0),
        Number(data.count || 1),
        {
          type: data.attackType || "melee",
          beam: data.beam === true,
          ignoreReduction: data.ignoreReduction === true,
          cannotEvade: data.cannotEvade === true,
          source: matched.option.label
        }
      )
    };
  }

  if (data.mochiBonus === true) {
    return { handled: true, redraw: false, message: `${matched.option.label}は戦闘中効果なしです` };
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
  const matched = getEquippedStoryDropEffects(state).find(({ option }) => isGundamNtSense(option));
  if (matched) return onStoryGundamDropTurnEnd(state, matched.option, context);

  return { redraw: false, message: null };
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
  });

  return {
    damage: nextDamage,
    message: messages.join(" / ") || null
  };
}
