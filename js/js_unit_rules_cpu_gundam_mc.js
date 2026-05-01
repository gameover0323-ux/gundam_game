import { createAttack } from "./js_battle_system.js";

function ensureCpuGundamState(state) {
  if (typeof state.cpuGundamTurnCount !== "number") state.cpuGundamTurnCount = 0;
  if (typeof state.cpuGundamFullEvadePending !== "boolean") state.cpuGundamFullEvadePending = false;
  if (typeof state.cpuGundamFullEvadeActive !== "boolean") state.cpuGundamFullEvadeActive = false;
  if (typeof state.cpuGundamReducePending !== "boolean") state.cpuGundamReducePending = false;
  if (typeof state.cpuGundamReduceActive !== "boolean") state.cpuGundamReduceActive = false;
  if (typeof state.cpuGundamRandomEvadePending !== "boolean") state.cpuGundamRandomEvadePending = false;
  if (typeof state.cpuGundamRandomEvadeActive !== "boolean") state.cpuGundamRandomEvadeActive = false;
}

function lowHpSlot4() {
  return {
    label: "ビームサーベル 40ダメージ×2回 + 回復50",
    desc: "40ダメージ×2回。格闘、軽減不可。さらに50回復。",
    effect: {
      type: "attack",
      attackType: "melee",
      damage: 40,
      count: 2,
      ignoreReduction: true
    },
    ex: true
  };
}

function lastShootingSlot5() {
  return {
    label: "5EX ラスト・シューティング 150ダメージ",
    desc: "150ダメージ。射撃、ビーム",
    effect: {
      type: "attack",
      attackType: "shoot",
      damage: 150,
      count: 1,
      beam: true
    },
    ex: true
  };
}

function extraWeaponAttacks(state) {
  const useHammer = Math.random() < 0.5;
  if (useHammer) {
    return {
      label: "7.ガンダムハンマー",
      attacks: createAttack(80, 1, {
        type: "melee",
        source: "cpu_gundam_extra_hammer"
      })
    };
  }

  return {
    label: "8.ハイパーバズーカ",
    attacks: createAttack(80, 1, {
      type: "shoot",
      source: "cpu_gundam_extra_bazooka"
    })
  };
}

export function getCpuGundamMcDerivedState(state) {
  ensureCpuGundamState(state);

  const derived = {
    status: [
      "CPU専用：特殊行動選択なし",
      "3ターンに1回、追加武装を同時発動",
      "3ターンに1回、1/6で次ターン全回避"
    ],
    specials: {
      special1: {
        name: "CPU特性",
        effectType: "cpu_gundam_traits",
        timing: "auto",
        actionType: "auto",
        desc:
          "3ターンに1回、ガンダムハンマーかハイパーバズーカを通常スロット行動と同時に繰り出す。HP200未満で4が軽減不可ビームサーベル+回復50へ変化。HP50以下で5がラスト・シューティングへ変化。3ターンに1回、1/6で次ターンの必中を除く攻撃を全て回避する。"
      }
    },
    slots: {}
  };

  if (state.hp < 200) {
    derived.slots.slot4 = lowHpSlot4();
  }

  if (state.hp <= 50) {
    derived.slots.slot5 = lastShootingSlot5();
  }

  return derived;
}

export function onCpuGundamMcBeforeSlot(state) {
  ensureCpuGundamState(state);

  if (state.cpuGundamFullEvadeActive) {
    state.cpuGundamFullEvadeActive = false;
  }

  if (state.cpuGundamReduceActive) {
    state.cpuGundamReduceActive = false;
  }

  if (state.cpuGundamRandomEvadeActive) {
    state.cpuGundamRandomEvadeActive = false;
  }

  return { redraw: true, message: null };
}

export function onCpuGundamMcAfterSlotResolved(state, slotNumber) {
  ensureCpuGundamState(state);

  if (slotNumber === 2) {
  state.cpuGundamFullEvadePending = true;

  const beforeEvade = state.evade;
  state.evade = Math.min(state.evadeMax, state.evade + 2);

  return {
    redraw: true,
    message: `CPU特性：回避+${state.evade - beforeEvade}。次のターン、必中を除く攻撃を全て回避。`
  };
}

  if (slotNumber === 4 && state.hp >= 200) {
    state.cpuGundamReducePending = true;
    return {
      redraw: true,
      message: "CPU特性：次のターン、被ダメージ25%軽減"
    };
  }

  return { redraw: false, message: null };
}

export function onCpuGundamMcActionResolved(state, defender, context = {}) {
  ensureCpuGundamState(state);

  if (context.slotNumber === 4 && state.hp < 200) {
    state.hp = Math.min(state.maxHp, state.hp + 50);
    return {
      redraw: true,
      message: "CPU特性：ビームサーベル後にHP50回復"
    };
  }

  return { redraw: false, message: null };
}

export function onCpuGundamMcTurnEnd(state) {
  ensureCpuGundamState(state);

  state.cpuGundamTurnCount += 1;

  const messages = [];

  // 追加特性：毎ターン1/6で回避+3
  if (Math.floor(Math.random() * 6) === 0) {
    const beforeEvade = state.evade;
    state.evade = Math.min(state.evadeMax, state.evade + 3);
    const gained = state.evade - beforeEvade;

    if (gained > 0) {
      messages.push(`CPU特性：1/6判定成功。回避+${gained}`);
    } else {
      messages.push("CPU特性：1/6判定成功。ただし回避は上限");
    }
  }

  if (state.cpuGundamFullEvadePending) {
    state.cpuGundamFullEvadePending = false;
    state.cpuGundamFullEvadeActive = true;
    messages.push("CPUガンダム：全攻撃回避が次ターン有効化");
  }

  if (state.cpuGundamReducePending) {
    state.cpuGundamReducePending = false;
    state.cpuGundamReduceActive = true;
    messages.push("CPUガンダム：被ダメージ25%軽減が次ターン有効化");
  }

  if (state.cpuGundamTurnCount % 3 === 0) {
    state.cpuGundamRandomEvadeActive = Math.floor(Math.random() * 6) === 0;
    if (state.cpuGundamRandomEvadeActive) {
      messages.push("CPU特性：1/6判定成功。次ターン、必中を除く攻撃を全回避");
    } else {
      messages.push("CPU特性：1/6判定失敗");
    }
  }

  return {
    redraw: messages.length > 0,
    message: messages.join("\n") || null
  };
}

export function modifyCpuGundamMcTakenDamage(state, attacker, attack, damage) {
  ensureCpuGundamState(state);

  if (state.cpuGundamReduceActive && !attack.ignoreReduction) {
    return {
      damage: Math.floor(damage * 0.75),
      message: "CPUガンダム：被ダメージ25%軽減"
    };
  }

  return { damage, message: null };
}

export function modifyCpuGundamMcEvadeAttempt(state, attacker, attack) {
  ensureCpuGundamState(state);

  if (!attack || attack.cannotEvade) {
    return { handled: false };
  }

  if (state.cpuGundamFullEvadeActive || state.cpuGundamRandomEvadeActive) {
    return {
      handled: true,
      ok: true,
      consumeEvade: 0,
      message: "CPUガンダム：必中を除く攻撃を自動回避"
    };
  }

  return { handled: false };
}

export function getCpuGundamMcExtraWeaponResult(state) {
  ensureCpuGundamState(state);

  if (state.cpuGundamTurnCount <= 0) return null;
  if (state.cpuGundamTurnCount % 3 !== 0) return null;

  const extra = extraWeaponAttacks(state);

  return {
    appendAttacks: extra.attacks,
    message: `CPU特性：${extra.label}を同時発動`
  };
}
