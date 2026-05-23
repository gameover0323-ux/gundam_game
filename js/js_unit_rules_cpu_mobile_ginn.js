import { createAttack } from "./js_battle_system.js";

function ensureCpuMobileGinnState(state) {
  if (typeof state.cpuMobileGinnTraitUsedThisSlot !== "boolean") {
    state.cpuMobileGinnTraitUsedThisSlot = false;
  }
}

export function getCpuMobileGinnDerivedState(state) {
  ensureCpuMobileGinnState(state);

  return {
    status: [
      "難易度☆☆☆",
      "特性：攻撃の手数が多いほど追撃が強くなる"
    ],
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_mobile_ginn_traits",
        timing: "auto",
        actionType: "auto",
        desc: "攻撃のヒット数に応じて、追加の無属性追撃を行う。多段攻撃ほど追撃ダメージが伸びる。"
      }
    },
    slots: {}
  };
}

export function onCpuMobileGinnBeforeSlot(state) {
  ensureCpuMobileGinnState(state);
  state.cpuMobileGinnTraitUsedThisSlot = false;

  return { redraw: false, message: null };
}

export function onCpuMobileGinnAfterSlotResolved(state) {
  ensureCpuMobileGinnState(state);

  return { redraw: false, message: null };
}

export function onCpuMobileGinnActionResolved(state) {
  ensureCpuMobileGinnState(state);
  state.cpuMobileGinnTraitUsedThisSlot = false;

  return { redraw: false, message: null };
}

export function getCpuMobileGinnExtraWeaponResult(state, context = {}) {
  ensureCpuMobileGinnState(state);

  if (state.cpuMobileGinnTraitUsedThisSlot) return null;

  const slot = context.slot;
  const effect = slot?.effect;

  if (!effect || effect.type !== "attack") return null;

  const hitCount = Number(effect.count || 1);
  const damage = hitCount * 5;

  if (damage <= 0) return null;

  state.cpuMobileGinnTraitUsedThisSlot = true;

  return {
    appendAttacks: createAttack(damage, 1, {
      source: "cpu_mobile_ginn_trait"
    }),
    message: `モビルジン特性：総合ヒット数${hitCount}×5。無属性追撃${damage}ダメージ`
  };
}
