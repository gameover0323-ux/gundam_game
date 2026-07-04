export const metal_chikamochi = {
  id: "metal_chikamochi",
  name: "メタルちかもち",
  defaultFormId: "normal",
  storyOnly: true,
  exp: 0,
  forms: {
    normal: {
      name: "メタルちかもち",
      hp: 100,
      evadeMax: 25,
      criticalRate: 0,
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      ownedSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      slots: {
        slot1: {
          label: "回避 25回",
          desc: "回避ストック+25。",
          effect: { type: "evade", amount: 25 }
        },
        slot2: {
          label: "牙突もち式",
          desc: "1ダメージ。格闘属性。軽減不可。",
          effect: { type: "attack", damage: 1, count: 1, attackType: "melee", ignoreReduction: true }
        },
        slot3: {
          label: "みかんたべるのだ",
          desc: "HPを100回復。",
          effect: { type: "heal", amount: 100 }
        },
        slot4: {
          label: "にげるのだ",
          desc: "30%の確率で強制プレイヤー敗北。",
          effect: { type: "none" }
        },
        slot5: {
          label: "のびるのだ",
          desc: "HP最大値を倍化。",
          effect: { type: "none" }
        },
        slot6: {
          label: "みかんくれるのだ？",
          desc: "3回選択すると和解可能。",
          effect: { type: "none" }
        }
      },
      specials: [
        {
          name: "特性",
          effectType: "metal_chikamochi_trait",
          timing: "passive",
          actionType: "auto",
          desc: "相手から受ける全ダメージを1に変換する。"
        }
      ]
    }
  },
  storyDrops: {
    initial: [
      {
        id: "mochi_bonus_equipment_1",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "equipment", mochiBonus: true }
      },
      {
        id: "mochi_bonus_equipment_2",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "equipment", mochiBonus: true }
      },
      {
        id: "mochi_bonus_skill",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "create_skill", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot1",
        slotKey: "slot1",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot2",
        slotKey: "slot2",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot3",
        slotKey: "slot3",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot4",
        slotKey: "slot4",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot5",
        slotKey: "slot5",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      },
      {
        id: "mochi_bonus_slot6",
        slotKey: "slot6",
        label: "ちかもち増量",
        cost: 0,
        detail: "装備すると画面のちかもちが1つ増える。戦闘中効果なし。",
        data: { kind: "slot", mochiBonus: true }
      }
    ]
  }
};
