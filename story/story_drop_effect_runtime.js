import {
  findStorySlotOption,
  findStoryEquipmentOption,
  findStorySkillOption
} from "./story_create_lab_data.js";

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

  return result;
}

function getEquippedDropOptionsFallbackByName(state) {
  const result = [];
  const specials = Object.values(state?.specials || {});

  specials.forEach(special => {
    const name = String(special?.name || "");

    if (name.includes("ワンアイズターゲット")) {
      result.push({
        kind: "equipment",
        key: special?.effectType || "equipment",
        option: {
          id: "one_eyes_target",
          label: "ワンアイズターゲット",
          data: {
            kind: "equipment_damage_barrier",
            barrierValue: 120
          }
        }
      });
    }
  });

  return result;
}

export function getEquippedStoryDropEffects(state) {
  const direct = getEquippedDropOptions(state);
  const fallback = getEquippedDropOptionsFallbackByName(state);

  const merged = [...direct];

  fallback.forEach(item => {
    if (!merged.some(existing => existing.option?.id === item.option?.id)) {
      merged.push(item);
    }
  });

  return merged;
}

export function getStoryDropDerivedStatus(state) {
  ensureStoryDropRuntimeState(state);

  const result = [];
  const effects = getEquippedStoryDropEffects(state);

  effects.forEach(({ option }) => {
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
  });

  return result;
}

export function canUseStoryDropSpecial(state, special) {
  const name = String(special?.name || "");
  const effects = getEquippedStoryDropEffects(state);

  const matched = effects.find(({ option }) => name.includes(option?.label || ""));
  if (!matched) return null;

  const data = matched.option?.data || {};

  if (data.kind === "equipment_damage_barrier") {
    return {
      allowed: false,
      message: `${matched.option.label}は自動発動装備です`
    };
  }

  if (data.mochiBonus === true) {
    return {
      allowed: false,
      message: `${matched.option.label}は戦闘中効果なしです`
    };
  }

  return null;
}

export function executeStoryDropSpecial(state, special) {
  const name = String(special?.name || "");
  const effects = getEquippedStoryDropEffects(state);

  const matched = effects.find(({ option }) => name.includes(option?.label || ""));
  if (!matched) return null;

  const data = matched.option?.data || {};

  if (data.kind === "equipment_damage_barrier") {
    return {
      handled: true,
      redraw: false,
      message: `${matched.option.label}は自動発動装備です`
    };
  }

  if (data.mochiBonus === true) {
    return {
      handled: true,
      redraw: false,
      message: `${matched.option.label}は戦闘中効果なしです`
    };
  }

  return null;
}

export function modifyStoryDropTakenDamage(defender, attacker, attack, damage) {
  ensureStoryDropRuntimeState(defender);

  let nextDamage = Math.max(0, Number(damage || 0));
  const messages = [];
  const effects = getEquippedStoryDropEffects(defender);

  effects.forEach(({ option }) => {
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
