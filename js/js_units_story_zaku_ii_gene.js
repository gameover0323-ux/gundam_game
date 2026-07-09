export const story_zaku_ii_gene = {
  id: "story_zaku_ii_gene",
  name: "ザクII(ジーン機)",
  defaultFormId: "base",
  exp: 4,

  storyCompanion: {
    unlockCondition: "初回チャプター2をクリア",
    cost: 30
  },

  storyDrops: {
    random: [
      {
        id: "story_gene_zaku_slot1_think",
        type: "slot",
        slotKey: "slot1",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      },
      {
        id: "story_gene_zaku_slot2_think",
        type: "slot",
        slotKey: "slot2",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      },
      {
        id: "story_gene_zaku_slot3_think",
        type: "slot",
        slotKey: "slot3",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      },
      {
        id: "story_gene_zaku_slot3_heal_40",
        type: "slot",
        slotKey: "slot3",
        label: "回復40",
        cost: 5,
        detail: "HPを40回復する。",
        data: { kind: "heal", value: 40 }
      },
      {
        id: "story_gene_zaku_slot4_think",
        type: "slot",
        slotKey: "slot4",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      },
      {
        id: "story_gene_zaku_slot5_think",
        type: "slot",
        slotKey: "slot5",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      },
      {
        id: "story_gene_zaku_slot6_think",
        type: "slot",
        slotKey: "slot6",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "proto_create_no_fire" }
      }
    ],

    equipment: [
      {
        id: "story_gene_zaku_machinegun_equipment",
        type: "equipment",
        label: "ザクマシンガン(ジーン)",
        cost: 15,
        detail: "ゲーム中5回まで、10ダメージ×1～6回の射撃攻撃を行う。",
        data: {
          kind: "equipment_random_attack",
          damage: 10,
          minCount: 1,
          maxCount: 6,
          attackType: "shoot",
          uses: 5
        }
      }
    ]
  },

  forms: {
    base: {
      name: "ザクII(ジーン機)",
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
          label: "思考",
          desc: "何も起きない",
          effect: { type: "none" }
        }
      },
      specials: []
    }
  }
};
