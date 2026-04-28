export const devil_gundam = {
  id: "devil_gundam",
  name: "デビルガンダム(第1形態)",
  hp: 1000,
  evadeMax: 0,
  isBoss: true,

  forms: {
    base: {
      name: "デビルガンダム(第1形態)",
      hp: 1000,
      evadeMax: 0,
      slots: {
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
          effect: { type: "attack", damage: 20, count: 1, attackType: "melee", special: "death_army_random" }
        }
      },
      specials: []
    }
  }
};
