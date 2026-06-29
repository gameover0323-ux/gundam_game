export const story_zaku_ii_gene = {
  id: "story_zaku_ii_gene",
  name: "ザクII(ジーン機)",
  defaultFormId: "normal",
  storyOnly: true,
  exp: 2,

  storyCompanion: {
    unlockCondition: "初回チャプター2をクリア",
    cost: 5
  },

  storyDrops: {
    initial: [
      {
        id: "story_zaku_ii_gene_slot6_think",
        slotKey: "slot6",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      }
    ],
    random: [
      {
        id: "story_zaku_ii_gene_slot1_think",
        slotKey: "slot1",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      },
      {
        id: "story_zaku_ii_gene_slot2_think",
        slotKey: "slot2",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      },
      {
        id: "story_zaku_ii_gene_slot3_think",
        slotKey: "slot3",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      },
      {
        id: "story_zaku_ii_gene_slot3_heal_40",
        slotKey: "slot3",
        label: "回復 40",
        cost: 7,
        detail: "HPを40回復する。",
        data: { kind: "heal", value: 40 }
      },
      {
        id: "story_zaku_ii_gene_slot4_think",
        slotKey: "slot4",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      },
      {
        id: "story_zaku_ii_gene_slot5_think",
        slotKey: "slot5",
        label: "思考",
        cost: 0,
        detail: "何も起きない。",
        data: { kind: "custom", effectId: "story_think" }
      }
    ],
    equipment: [
      {
        id: "zaku_machine_gun_gene",
        label: "ザクマシンガン(ジーン)",
        cost: 15,
        detail: "ゲーム中5回まで、10ダメージ×1～6回の射撃攻撃を行う。",
        data: {
          kind: "equipment_attack",
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
    normal: {
      name: "ザクII(ジーン機)",
      hp: 300,
      evadeMax: 2,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "ザクマシンガン 10ダメージ×4回",
          desc: "10ダメージ×4回。射撃。",
          effect: { type: "attack", damage: 10, count: 4, attackType: "shoot" }
        },
        slot2: {
          label: "ヒートホーク 50ダメージ",
          desc: "50ダメージ。格闘。",
          effect: { type: "attack", damage: 50, count: 1, attackType: "melee" }
        },
        slot3: {
          label: "回復 40",
          desc: "HP40回復。",
          effect: { type: "heal", amount: 40 }
        },
        slot4: {
          label: "回避 +1",
          desc: "回避ストック+1。",
          effect: { type: "evade", amount: 1 }
        },
        slot5: {
          label: "ザクバズーカ 60ダメージ",
          desc: "60ダメージ。射撃。",
          effect: { type: "attack", damage: 60, count: 1, attackType: "shoot" }
        },
        slot6: {
          label: "思考",
          desc: "何も起きない。",
          effect: { type: "custom", effectId: "story_think" }
        }
      },
      specials: []
    }
  }
};
