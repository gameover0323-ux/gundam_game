function getBossPhase(state) {
  if (state.hp <= 300) return "final";
  if (state.hp <= 600) return "lantao";
  return "phase1";
}

function phase1Slots() {
  return {
    slot1: {
      label: "デビルファング",
      desc: "30ダメージ×2回 格闘",
      effect: { type: "attack", damage: 30, count: 2, attackType: "melee" }
    },
    slot2: {
      label: "ガンダムヘッド",
      desc: "10ダメージ×4回 射撃。フルヒット時、相手回避-1",
      effect: { type: "attack", damage: 10, count: 4, attackType: "shoot", special: "devil_head_full_hit" }
    },
    slot3: {
      label: "回復",
      desc: "50回復",
      effect: { type: "heal", amount: 50 }
    },
    slot4: {
      label: "拡散粒子砲",
      desc: "20ダメージ×3回 格闘 ビーム",
      effect: { type: "attack", damage: 20, count: 3, attackType: "melee", beam: true }
    },
    slot5: {
      label: "メガビームキャノン",
      desc: "80ダメージ 軽減不可 射撃 ビーム",
      effect: { type: "attack", damage: 80, count: 1, attackType: "shoot", beam: true, ignoreReduction: true }
    },
    slot6: {
      label: "デスアーミー攻撃",
      desc: "20ダメージ×1〜6回 格闘",
      effect: { type: "attack", damage: 20, count: 1, randomCountMin: 1, randomCountMax: 6, attackType: "melee" }
    }
  };
}

function lantaoSlots() {
  return {
    slot1: {
      label: "デビルファング",
      desc: "50ダメージ×2回 格闘",
      effect: { type: "attack", damage: 50, count: 2, attackType: "melee" }
    },
    slot2: {
      label: "ガンダムヘッド",
      desc: "10ダメージ×4回 射撃。1命中ごとに相手回避-1",
      effect: { type: "attack", damage: 10, count: 4, attackType: "shoot", special: "devil_head_each_hit" }
    },
    slot3: {
      label: "回復",
      desc: "70回復",
      effect: { type: "heal", amount: 70 }
    },
    slot4: {
      label: "拡散粒子砲",
      desc: "30ダメージ×3回 格闘 ビーム",
      effect: { type: "attack", damage: 30, count: 3, attackType: "melee", beam: true }
    },
    slot5: {
      label: "メガデビルフラッシュ",
      desc: "100ダメージ 軽減不可 射撃 ビーム",
      effect: { type: "attack", damage: 100, count: 1, attackType: "shoot", beam: true, ignoreReduction: true }
    },
    slot6: {
      label: "デスアーミー攻撃",
      desc: "30ダメージ×1〜6回 格闘",
      effect: { type: "attack", damage: 30, count: 1, randomCountMin: 1, randomCountMax: 6, attackType: "melee" }
    }
  };
}

function finalSlots() {
  return {
    slot1: {
      label: "100回復",
      desc: "100回復",
      effect: { type: "heal", amount: 100 }
    },
    slot2: {
      label: "デビルファング",
      desc: "120ダメージ 格闘。命中時HP50吸収",
      effect: { type: "attack", damage: 120, count: 1, attackType: "melee", special: "devil_fang_absorb" }
    },
    slot3: {
      label: "メガアルティメットフラッシュ",
      desc: "150ダメージ 軽減不可 射撃 ビーム",
      effect: { type: "attack", damage: 150, count: 1, attackType: "shoot", beam: true, ignoreReduction: true }
    },
    slot4: {
      label: "拡散メガ粒子砲",
      desc: "30ダメージ×4回 格闘 ビーム",
      effect: { type: "attack", damage: 30, count: 4, attackType: "melee", beam: true }
    },
    slot5: {
      label: "デビルフィンガー攻撃",
      desc: "40ダメージ×2回 格闘。命中時回避消滅",
      effect: { type: "attack", damage: 40, count: 2, attackType: "melee", special: "devil_finger_zero_evade" }
    },
    slot6: {
      label: "バルカン",
      desc: "10ダメージ×10回 射撃",
      effect: { type: "attack", damage: 10, count: 10, attackType: "shoot" }
    }
  };
}

export const devilGundamRules = {
  getDerivedState(state) {
    const phase = getBossPhase(state);

    if (phase === "final") {
      return {
        name: "デビルガンダム最終形態",
        status: [
          "常時被ダメージ半減",
          state.devilEndureUsed ? "HP1残存 使用済み" : "HP1残存 未使用"
        ],
        slots: finalSlots()
      };
    }

    if (phase === "lantao") {
      return {
        name: "デビルガンダム(ランタオ島)",
        status: ["毎ターンHP15回復"],
        slots: lantaoSlots()
      };
    }

    return {
      name: "デビルガンダム(第1形態)",
      status: ["毎ターンHP15回復"],
      slots: phase1Slots()
    };
  },

  modifyTakenDamage(state, attacker, attack, damage) {
    if (getBossPhase(state) === "final" && !attack.ignoreReduction) {
      return {
        damage: Math.floor(damage / 2),
        message: "デビルガンダム最終形態：被ダメージ半減"
      };
    }

    return { damage, message: null };
  },

  onDamaged(state) {
    if (getBossPhase(state) === "final" && state.hp <= 0 && !state.devilEndureUsed) {
      state.hp = 1;
      state.devilEndureUsed = true;
      return {
        redraw: true,
        message: "デビルガンダム最終形態はHP1で踏みとどまった！"
      };
    }

    return { redraw: false, message: null };
  },

  onTurnEnd(state) {
    const phase = getBossPhase(state);

    if (phase === "phase1" || phase === "lantao") {
      state.hp = Math.min(state.maxHp, state.hp + 15);
      return {
        redraw: true,
        message: "デビルガンダムの特性：HP15回復"
      };
    }

    return { redraw: false, message: null };
  },

  onActionResolved(attacker, defender, context) {
    if (!attacker || !defender) {
      return { redraw: false, message: null };
    }

    if (
      context.slotNumber === 2 &&
      context.slotLabel === "ガンダムヘッド" &&
      context.totalCount > 0 &&
      context.hitCount === context.totalCount
    ) {
      defender.evade = Math.max(0, defender.evade - 1);
      return {
        redraw: true,
        message: `${defender.name} の回避-1`
      };
    }

    return { redraw: false, message: null };
  }
};
