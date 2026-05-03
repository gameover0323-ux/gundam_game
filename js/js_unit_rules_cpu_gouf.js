import { getRandomSlotKey, getSlotByKey } from "./js_unit_runtime.js";
import { resolveSlotEffect } from "./js_slot_effects.js";

function ensureCpuGoufState(state) {
  if (typeof state.cpuGoufEnemyTurnObserved !== "boolean") state.cpuGoufEnemyTurnObserved = false;
  if (typeof state.cpuGoufEnemyTurnHadAttack !== "boolean") state.cpuGoufEnemyTurnHadAttack = false;
  if (typeof state.cpuGoufExtraSlotCount !== "number") state.cpuGoufExtraSlotCount = 0;
  if (typeof state.cpuGoufSureHitNextAttack !== "boolean") state.cpuGoufSureHitNextAttack = false;
}

function resolveExtraSlot(state, slotKey) {
  const slot = getSlotByKey(state, slotKey);
  const appendAttacks = [];
  const appendMessages = [];

  if (!slot) return { appendAttacks, appendMessages };

  const result = resolveSlotEffect({ slot, actor: state });
  const slotNumber = Number(String(slotKey).replace(/^slot/, ""));

  appendMessages.push(`グフ特性：追加行動 ${slotNumber}.${slot.label}`);

  if (result.kind === "attack") {
    appendAttacks.push(...result.attacks);
  } else if (result.message) {
    appendMessages.push(result.message);
  }

  return { appendAttacks, appendMessages };
}

export function getCpuGoufDerivedState(state) {
  ensureCpuGoufState(state);

  const status = [
    "CPU専用：初心者向け",
    "特性：相手が非攻撃行動なら次ターン連続行動"
  ];

  if (state.cpuGoufSureHitNextAttack) {
    status.push("ヒートロッド捕縛：次攻撃必中");
  }

  return {
    status,
    slots: {},
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_gouf_traits",
        timing: "auto",
        actionType: "auto",
        desc: "相手が攻撃行動をしてこなかった時の次のターン、2回～3回連続でスロット行動をする。"
      }
    }
  };
}

export function onCpuGoufEnemyBeforeSlot(state, slotNumber, context = {}) {
  ensureCpuGoufState(state);

  const enemySlot = context.enemyRolledSlotKey
    ? context.enemyState?.slots?.[context.enemyRolledSlotKey]
    : null;

  state.cpuGoufEnemyTurnObserved = true;

  if (enemySlot?.effect?.type === "attack") {
    state.cpuGoufEnemyTurnHadAttack = true;
  }

  return { redraw: false, message: null };
}

export function onCpuGoufBeforeSlot(state, slotNumber, context = {}) {
  ensureCpuGoufState(state);

  const messages = [];

  if (state.cpuGoufEnemyTurnObserved && !state.cpuGoufEnemyTurnHadAttack) {
    state.cpuGoufExtraSlotCount = Math.floor(Math.random() * 2) + 1;
    messages.push(`グフ特性：相手が攻撃行動をしなかったため、追加スロット${state.cpuGoufExtraSlotCount}回`);
  }

  state.cpuGoufEnemyTurnObserved = false;
  state.cpuGoufEnemyTurnHadAttack = false;

  const slot = context.slot;
  if (state.cpuGoufSureHitNextAttack && slot?.effect?.type === "attack") {
    slot.effect.cannotEvade = true;
    slot.effect.addedCannotEvade = true;
    state.cpuGoufSureHitNextAttack = false;
    messages.push("ヒートロッド捕縛：この攻撃が必中化");
  }

  return {
    redraw: messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function onCpuGoufActionResolved(attacker, defender, context = {}) {
  ensureCpuGoufState(attacker);

  const messages = [];
  let redraw = false;

  if (context.slotNumber === 1 && context.hitCount > 0 && defender) {
    defender.evade = 0;
    messages.push("ヒートロッド：被弾により相手の所持回避消滅");
    redraw = true;
  }

  if (context.slotNumber === 6 && context.hitCount > 0) {
    attacker.cpuGoufSureHitNextAttack = true;
    messages.push("ヒートロッド捕縛：次の攻撃が必中になる");
    redraw = true;
  }

  return {
    redraw,
    message: messages.join("\n") || null
  };
}

export function getCpuGoufExtraWeaponResult(state, context = {}) {
  ensureCpuGoufState(state);

  if (state.cpuGoufExtraSlotCount <= 0) return null;

  const total = {
    appendAttacks: [],
    appendMessages: [],
    redraw: true
  };

  while (state.cpuGoufExtraSlotCount > 0) {
    state.cpuGoufExtraSlotCount -= 1;

    const slotKey = getRandomSlotKey(state);
    const extra = resolveExtraSlot(state, slotKey);

    total.appendAttacks.push(...extra.appendAttacks);
    total.appendMessages.push(...extra.appendMessages);
  }

  return total;
}
