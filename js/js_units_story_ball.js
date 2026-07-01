export const story_ball = {
  id: "story_ball",
  name: "ボール",
  defaultFormId: "base",
  exp: 1,

  storyCompanion: {
    unlockCondition: "同行学習モードのボールを撃破する。",
    cost: 20
  },

  storyDrops: {
    random: [
      {
        id: "story_ball_slot5_low_recoil_cannon",
        slotKey: "slot5",
        label: "低反動キャノン 100ダメージ",
        cost: 8,
        detail: "100ダメージ / 射撃 / リロード / 弾数1 / 3ターン1リロード",
        data: {
          kind: "attack",
          damage: 100,
          count: 1,
          attackType: "shoot",
          reload: true,
          ammoMax: 1,
          ammoCostPerUse: 1,
          reloadTurnInterval: 3,
          reloadPerInterval: 1
        }
      }
    ],
    equipment: [
      {
        id: "one_eyes_target",
        label: "ワンアイズターゲット",
        cost: 5,
        detail: "ゲーム中、自動で120ダメージ分の被ダメージを無効化する。",
        data: {
          kind: "equipment_damage_barrier",
          barrierValue: 120
        }
      }
    ]
  },

  forms: {
    base: {
      name: "ボール",
      hp: 120,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "マジックハンド 20ダメージ",
          desc: "20ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 20, count: 1 }
        },
        slot2: {
          label: "回避+1",
          desc: "回避+1",
          effect: { type: "evade", amount: 1 }
        },
        slot3: {
          label: "低反動キャノン 120ダメージ",
          desc: "120ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 120, count: 1 }
        },
        slot4: {
          label: "回避+1",
          desc: "回避+1",
          effect: { type: "evade", amount: 1 }
        },
        slot5: {
          label: "低反動キャノン 120ダメージ",
          desc: "120ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 120, count: 1 }
        },
        slot6: {
          label: "回復 50",
          desc: "50回復",
          effect: { type: "heal", amount: 50 }
        }
      },
      specials: []
    }
  }
};
