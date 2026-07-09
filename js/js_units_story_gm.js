export const story_gm = {
  id: "story_gm",
  name: "GM",
  defaultFormId: "base",
  exp: 6,

  storyCompanion: {
    unlockCondition: "同行学習モードのGMを撃破する。",
    cost: 40
  },

  storyDrops: {
    random: [
      {
        id: "story_gm_slot4_beam_spray_gun",
        slotKey: "slot4",
        label: "ビームスプレーガン 60ダメージ",
        cost: 10,
        detail: "60ダメージ / 射撃 / ビーム / エネルギー / EN消費10 / 増加値10",
        data: {
          kind: "attack",
          damage: 60,
          count: 1,
          attackType: "shoot",
          beam: true,
          energy: true,
          energyCost: 10,
          energyIncrease: 10
        }
      },
      {
        id: "story_gm_slot6_hyper_bazooka",
        slotKey: "slot6",
        label: "ハイパーバズーカ(GM) 100ダメージ",
        cost: 15,
        detail: "100ダメージ / 射撃 / リロード / 弾数2 / 2ターン1リロード",
        data: {
          kind: "attack",
          damage: 100,
          count: 1,
          attackType: "shoot",
          reload: true,
          ammoMax: 2,
          ammoCostPerUse: 1,
          reloadTurnInterval: 2,
          reloadPerInterval: 1
        }
      }
    ]
  },

  forms: {
    base: {
      name: "GM",
      hp: 300,
      evadeMax: 3,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "バルカン砲 10ダメージ×3回",
          desc: "10ダメージ×3回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 3 }
        },
        slot2: {
          label: "ビームサーベル 50ダメージ",
          desc: "50ダメージ。格闘、ビーム",
          effect: { type: "attack", attackType: "melee", damage: 50, count: 1, beam: true }
        },
        slot3: {
          label: "回避+1",
          desc: "回避+1",
          effect: { type: "evade", amount: 1 }
        },
        slot4: {
          label: "ビームスプレーガン 60ダメージ",
          desc: "60ダメージ。射撃、ビーム",
          effect: { type: "attack", attackType: "shoot", damage: 60, count: 1, beam: true }
        },
        slot5: {
          label: "回復 60",
          desc: "60回復",
          effect: { type: "heal", amount: 60 }
        },
        slot6: {
          label: "ハイパーバズーカ(GM) 100ダメージ",
          desc: "100ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 100, count: 1 }
        }
      },
      specials: [
        {
          name: "特性：シールド",
          desc: "10％の確率で被ダメージを半減する。",
          effectType: "story_gm_shield",
          actionType: "auto"
        }
      ]
    }
  }
};
