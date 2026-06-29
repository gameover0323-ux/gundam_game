export const story_zaku_ii_denim = {
  id: "story_zaku_ii_denim",
  name: "ザクII(デニム機)",
  defaultFormId: "base",

  exp: 3,

  storyCompanion: {
    unlockCondition: "チャプター2終了後、チャプター1on1モードでプロトクリエイトガンダムのみで倒す。",
    cost: 5
  },

  storyDrops: {
    initial: [
      {
        id: "story_zaku_ii_denim_slot2_heat_hawk",
        slotKey: "slot2",
        label: "ヒートホーク 50ダメージ",
        cost: 6,
        detail: "50ダメージ / 格闘",
        data: {
          kind: "attack",
          damage: 50,
          count: 1,
          attackType: "melee"
        }
      }
    ],
    random: [
      {
        id: "story_zaku_ii_denim_slot1_zaku_machine_gun",
        slotKey: "slot1",
        label: "ザクマシンガン 10ダメージ×4回",
        cost: 5,
        detail: "10ダメージ×4回 / 射撃 / リロード / 弾数16 / 1ターン1リロード",
        data: {
          kind: "attack",
          damage: 10,
          count: 4,
          attackType: "shoot",
          reload: true,
          ammoMax: 16,
          ammoCostPerUse: 4,
          reloadPerTurn: 1
        }
      },
      {
        id: "story_zaku_ii_denim_slot5_zaku_bazooka",
        slotKey: "slot5",
        label: "ザクバズーカ 60ダメージ",
        cost: 8,
        detail: "60ダメージ / 射撃 / リロード / 弾数3 / 5ターン1リロード",
        data: {
          kind: "attack",
          damage: 60,
          count: 1,
          attackType: "shoot",
          reload: true,
          ammoMax: 3,
          ammoCostPerUse: 1,
          reloadTurnInterval: 5,
          reloadPerInterval: 1
        }
      }
    ],
    equipment: [
      {
        id: "heat_hawk_denim",
        label: "ヒートホーク(デニム)",
        cost: 15,
        detail: "ゲーム中3回まで、行動権を1消費して50ダメージの格闘攻撃を行う。",
        data: {
          kind: "equipment_attack",
          damage: 50,
          count: 1,
          attackType: "melee",
          uses: 3,
          actionCost: 1
        }
      }
    ],
    conditional: [
      {
        id: "rage_denim",
        label: "激昂",
        cost: 20,
        detail: "5ターンに1回、行動権を1回増やせる。",
        data: {
          kind: "create_skill",
          effectId: "rage_action_plus",
          cooldown: 5,
          actionGain: 1
        }
      }
    ]
  },

  forms: {
    base: {
      name: "ザクII(デニム機)",
      hp: 300,
      evadeMax: 2,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ザクマシンガン 10ダメージ×4回",
          desc: "10ダメージ×4回。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 10, count: 4 }
        },
        slot2: {
          label: "ヒートホーク 50ダメージ",
          desc: "50ダメージ。格闘",
          effect: { type: "attack", attackType: "melee", damage: 50, count: 1 }
        },
        slot3: {
          label: "回復 40",
          desc: "40回復",
          effect: { type: "heal", amount: 40 }
        },
        slot4: {
          label: "回避+1",
          desc: "回避+1",
          effect: { type: "evade", amount: 1 }
        },
        slot5: {
          label: "ザクバズーカ 60ダメージ",
          desc: "60ダメージ。射撃",
          effect: { type: "attack", attackType: "shoot", damage: 60, count: 1 }
        },
        slot6: {
  label: "激昂",
  desc: "次のターンのみスロット効果2倍",
  effect: { type: "custom", effectId: "denim_rage" }
        }
      },
      specials: []
    }
  }
};
