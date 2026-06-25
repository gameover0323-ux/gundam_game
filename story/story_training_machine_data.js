export const STORY_TRAINING_MACHINE = {
  id: "story_training_machine",
  name: "トレーニングマシン",
  displayHp: "？？？",
  hp: 114514810,
  maxHp: 114514810,
  evade: 1,
  evadeMax: 1,
  criticalRate: 0,
  exp: 0,

  slots: {
    slot1: { label: "演習攻撃", damage: 5, count: 1, attackType: "melee" },
    slot2: { label: "演習射撃", damage: 5, count: 1, attackType: "shoot" },
    slot3: { label: "演習属性攻撃", damage: 5, count: 1, attackType: "shoot", ignoreReduction: true },
    slot4: { label: "演習属性攻撃", damage: 5, count: 1, attackType: "melee", cannotEvade: true },
    slot5: { label: "確定会心攻撃", damage: 5, count: 1, attackType: "melee", criticalHit: true },
    slot6: { label: "回避", type: "evade", value: 1 }
  }
};

export const TRAINING_MACHINE_HIDDEN_DROP = {
  type: "createSkill",
  id: "destroyer",
  label: "破壊者",
  cost: 50,
  detail: "ゲーム中3回、任意のスロット行動を選択して行動権無消費の追加行動ができる。"
};
