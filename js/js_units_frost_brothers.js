export const frost_brothers_vasago_cb = {
  id: "frost_brothers_vasago_cb",
  name: "ガンダムヴァサーゴ(チェストブレイク)",
  shortName: "ヴァサーゴCB",
  maxHp: 800,
  hp: 800,
  evade: 0,
  evadeMax: 0,
  isBoss: true,
  isTwoVsBossUnit: true,
  bossGroupId: "frost_brothers",
  trophyCode: "CB",
  formId: "base",
  forms: {
    base: {
      name: "ガンダムヴァサーゴ(チェストブレイク)",
      maxHp: 800,
      evadeMax: 0,
      slots: {
        slot1: { label: "ストライククロー", desc: "30ダメージ×2回。格闘", effect: { type: "attack", damage: 30, count: 2, attackType: "melee" } },
        slot2: { label: "高出力ビームサーベル", desc: "80ダメージ。格闘、ビーム", effect: { type: "attack", damage: 80, count: 1, attackType: "melee", beam: true } },
        slot3: { label: "クロービーム砲", desc: "70ダメージ。射撃、ビーム", effect: { type: "attack", damage: 70, count: 1, attackType: "shoot", beam: true } },
        slot4: { label: "回復", desc: "HP80回復", effect: { type: "heal", amount: 80 } },
        slot5: { label: "広範囲ビーム砲", desc: "20ダメージ×5回。射撃、ビーム", effect: { type: "attack", damage: 20, count: 5, attackType: "shoot", beam: true } },
        slot6: { label: "トリプルメガソニック砲", desc: "300ダメージ。射撃、ビーム、軽減不可。使用後6EXへ", effect: { type: "attack", damage: 300, count: 1, attackType: "shoot", beam: true, ignoreReduction: true, effectId: "frost_vasago_triple_mega_sonic" } }
      },
      specials: []
    }
  }
};

export const frost_brothers_ashtaron_hc = {
  id: "frost_brothers_ashtaron_hc",
  name: "ガンダムアシュタロン(ハーミットクラブ)",
  shortName: "アシュタロンHC",
  maxHp: 1000,
  hp: 1000,
  evade: 0,
  evadeMax: 0,
  isBoss: true,
  isTwoVsBossUnit: true,
  bossGroupId: "frost_brothers",
  trophyCode: "HC",
  formId: "base",
  forms: {
    base: {
      name: "ガンダムアシュタロン(ハーミットクラブ)",
      maxHp: 1000,
      evadeMax: 0,
      slots: {
        slot1: { label: "マシンキャノン", desc: "10ダメージ×4回。射撃", effect: { type: "attack", damage: 10, count: 4, attackType: "shoot" } },
        slot2: { label: "ビームサーベル", desc: "80ダメージ。格闘、ビーム", effect: { type: "attack", damage: 80, count: 1, attackType: "melee", beam: true } },
        slot3: { label: "シザース捕縛", desc: "10ダメージ。格闘。被弾時、ヴァサーゴの次の攻撃に必中付与", effect: { type: "attack", damage: 10, count: 1, attackType: "melee", effectId: "frost_ashtaron_bind" } },
        slot4: { label: "シザースビームキャノン", desc: "40ダメージ×2回。射撃、ビーム", effect: { type: "attack", damage: 40, count: 2, attackType: "shoot", beam: true } },
        slot5: { label: "回復", desc: "HP80回復", effect: { type: "heal", amount: 80 } },
        slot6: { label: "ギガンティックシザース連続格闘", desc: "50ダメージ×4回。格闘", effect: { type: "attack", damage: 50, count: 4, attackType: "melee" } }
      },
      specials: []
    }
  }
};

export const frost_brothers = {
  id: "frost_brothers",
  name: "フロスト兄弟",
  isTwoVsBossPair: true,
  units: [frost_brothers_vasago_cb, frost_brothers_ashtaron_hc]
};
