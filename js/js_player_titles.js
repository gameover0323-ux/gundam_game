function makeTitleId(prefix, count) {
  return `${prefix}_${String(count).padStart(3, "0")}`;
}

function makeDefeatTitleRules({ category, targetId, prefix, entries }) {
  return entries.map(([count, label]) => ({
    id: makeTitleId(prefix, count),
    label,
    category,
    targetId,
    count
  }));
}

export const INITIAL_TITLE_IDS = [
  "initial_civilian",
  "particle_no",
  "particle_ha",
  "particle_mo",
  "particle_ga",
  "particle_de",
  "particle_ni",
  "particle_dot",
  "particle_comma",
  "particle_period"
];

export const BETA_TITLE_IDS = [
  "beta_test",
  "beta_symbol",
  "beta_senpai"
];

export const BASE_TITLES = [
  { id: "initial_civilian", label: "民間人" },
  { id: "particle_no", label: "の" },
  { id: "particle_ha", label: "は" },
  { id: "particle_mo", label: "も" },
  { id: "particle_ga", label: "が" },
  { id: "particle_de", label: "で" },
  { id: "particle_ni", label: "に" },
  { id: "particle_dot", label: "・" },
  { id: "particle_comma", label: "、" },
  { id: "particle_period", label: "。" },

  { id: "beta_test", label: "ベータテスト" },
  { id: "beta_symbol", label: "β" },
  { id: "beta_senpai", label: "先輩" }
];

export const DEFEAT_TITLE_RULES = [
  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "gundam_mc",
    prefix: "gundam_mc",
    entries: [
      [1, "連邦"],
      [5, "白き"],
      [10, "流星"],
      [15, "白い悪魔"],
      [20, "恐ろしい"],
      [25, "読み"],
      [30, "ニュータイプ"],
      [35, "初代"],
      [40, "無印"],
      [45, "哀"],
      [50, "ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_gundam_mc",
    prefix: "cpu_gundam_mc",
    entries: [
      [1, "白い"],
      [5, "悪魔"],
      [10, "鬼畜"],
      [15, "天パ"],
      [20, "アムロ"],
      [25, "型落ち"],
      [30, "戦士"],
      [35, "機動戦士"],
      [40, "ガンダム"],
      [45, "燃え上がれ"],
      [50, "永遠に"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "z_gundam",
    prefix: "z_gundam",
    entries: [
      [1, "突撃"],
      [5, "水の星"],
      [10, "愛"],
      [15, "こめて"],
      [20, "コンフューズ"],
      [25, "バイオ"],
      [30, "センサー"],
      [35, "精神崩壊"],
      [40, "バーって"],
      [45, "光るもんな"],
      [50, "Z"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_z_gundam",
    prefix: "cpu_z_gundam",
    entries: [
      [1, "ハイパー"],
      [5, "もっと"],
      [10, "そこのMP"],
      [15, "させてやる"],
      [20, "ウェイブライダー"],
      [25, "カミーユ"],
      [30, "出てこなければ"],
      [35, "撃たれなかった"],
      [40, "ゼータ"],
      [45, "スイカバー"],
      [50, "何が悪いんだ"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "shining_gundam",
    prefix: "shining_gundam",
    entries: [
      [1, "好き"],
      [5, "浪漫"],
      [10, "怒り"],
      [15, "スーパーモード"],
      [20, "俺"],
      [25, "この手"],
      [30, "真っ赤"],
      [35, "燃える"],
      [40, "お前"],
      [45, "倒せと"],
      [50, "輝き叫ぶ"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_shining_gundam",
    prefix: "cpu_shining_gundam",
    entries: [
      [1, "推し"],
      [5, "フィンガー"],
      [10, "水の一雫"],
      [15, "明鏡止水"],
      [20, "ドモン"],
      [25, "ファイト"],
      [30, "第一条"],
      [35, "シャイニング"],
      [40, "頭部"],
      [45, "破壊された者"],
      [50, "失格となる！"]
    ]
  }),
...makeDefeatTitleRules({
    category: "playable",
    targetId: "unicorn_gundam",
    prefix: "unicorn_gundam",
    entries: [
      [1, "流石だな"],
      [5, "機体が"],
      [10, "一角獣"],
      [15, "幻獣"],
      [20, "UC"],
      [25, "ユニコーン"],
      [30, "デストロイ"],
      [35, "ビームマグナム"],
      [40, "覚醒"],
      [45, "NT-D"],
      [50, "やったんですよ"]
    ]
  }),
  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_unicorn_gundam",
    prefix: "cpu_unicorn_gundam",
    entries: [
      [1, "トンファー"],
      [5, "必死に"],
      [10, "その結果"],
      [15, "これなんです"],
      [20, "バナージ"],
      [25, "答えてくれ"],
      [30, "やります"],
      [35, "でていけぇ！"],
      [40, "ラプラスの箱"],
      [45, "心の光"],
      [50, "ユニコォォォォン"]
    ]
  }),
  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "wing_gundam_zero",
    prefix: "wing_gundam_zero",
    entries: [
      [1, "羽"],
      [5, "ネオバード"],
      [10, "システム"],
      [15, "ローリング"],
      [20, "暴走"],
      [25, "バスターライフル"],
      [30, "ウイング"],
      [35, "答えてくれ"],
      [40, "導け"],
      [45, "ゼロ"],
      [50, "思春期"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_wing_gundam_zero",
    prefix: "cpu_wing_gundam_zero",
    entries: [
      [1, "少年の翼"],
      [5, "(デデン)"],
      [10, "(ビリィ)"],
      [15, "つづく"],
      [20, "ヒイロ"],
      [25, "ターゲット"],
      [30, "W"],
      [35, "ツイン"],
      [40, "殺した"],
      [45, "殺す"],
      [50, "新機動戦記"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "strike_gundam",
    prefix: "strike_gundam",
    entries: [
      [1, "PS装甲"],
      [5, "エール"],
      [10, "ソード"],
      [15, "ランチャー"],
      [20, "S.E.E.D."],
      [25, "コーディネイター"],
      [30, "OS"],
      [35, "非戦"],
      [40, "卑怯だ！"],
      [45, "無茶苦茶だ"],
      [50, "ストライク"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_strike_gundam",
    prefix: "cpu_strike_gundam",
    entries: [
      [1, "ナイフ"],
      [5, "キック"],
      [10, "キラ"],
      [15, "アグニ"],
      [20, "ニコル斬り"],
      [25, "フェイズシフト"],
      [30, "ダウン"],
      [35, "キラカガ"],
      [40, "僕"],
      [45, "ストライカー"],
      [50, "やめてよね"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "playable",
    targetId: "jegan_d_type",
    prefix: "jegan_d_type",
    entries: [
      [1, "量産機"],
      [5, "ジェガン"],
      [10, "スターク"],
      [15, "EWAC"],
      [20, "エスコート"],
      [25, "エース"],
      [30, "やられ役"],
      [35, "やれば出来る"],
      [40, "努力家"],
      [45, "D型"],
      [50, "装備"]
    ]
  }),
...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_jegan_d_type",
    prefix: "cpu_jegan_d_type",
    entries: [
      [1, "複雑"],
      [5, "援護射撃"],
      [10, "索敵"],
      [15, "名も無き"],
      [20, "敬意"],
      [25, "表する"],
      [30, "専用機"],
      [35, "モブ"],
      [40, "有能"],
      [45, "実力者"],
      [50, "ゲーセン"]
    ]
  }),
  ...makeDefeatTitleRules({
  category: "playable",
  targetId: "zudah",
  prefix: "zudah",
  entries: [
    [1, "試作機"],
    [5, "自爆"],
    [10, "速いぞ"],
    [15, "オーバーヒート"],
    [20, "エンジンカット"],
    [25, "ツィマッド社"],
    [30, "先陣"],
    [35, "ヅダ"],
    [40, "暴発"],
    [45, "助けてください"],
    [50, "二階級特進"]
  ]
}),
...makeDefeatTitleRules({
  category: "cpu",
  targetId: "cpu_zudah",
  prefix: "cpu_zudah",
  entries: [
    [1, "欠陥品"],
    [5, "セーフティ"],
    [10, "試験機"],
    [15, "ジャン"],
    [20, "リュック"],
    [25, "デュバル"],
    [30, "加速"],
    [35, "ゴーストファイター"],
    [40, "空中分解"],
    [45, "土星エンジン"],
    [50, "MSIGLOO"]
  ]
}),
  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_zaku_ii_soldier",
    prefix: "cpu_zaku_ii_soldier",
    entries: [
      [1, "初心者"],
      [5, "研究者"],
      [10, "練習"],
      [15, "ボコボコ"],
      [20, "許して"],
      [25, "弱い"],
      [30, "ワンパン"],
      [35, "サンドバッグ"],
      [40, "一般兵"],
      [45, "デバッガー"],
      [50, "ザクⅡ"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_gouf",
    prefix: "cpu_gouf",
    entries: [
      [1, "中級者"],
      [5, "慣れてきた"],
      [10, "練度"],
      [15, "歯ごたえ"],
      [20, "やり込み"],
      [25, "やりがい"],
      [30, "変則的"],
      [35, "グフ"],
      [40, "二等兵"],
      [45, "ヒートロッド"],
      [50, "ムチ"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "cpu",
    targetId: "cpu_mobile_ginn",
    prefix: "cpu_mobile_ginn",
    entries: [
      [1, "上等兵"],
      [5, "上級者"],
      [10, "練度"],
      [15, "連撃"],
      [20, "ジン"],
      [25, "研鑽"],
      [30, "チャレンジャー"],
      [35, "ザフト兵"],
      [40, "緑服"],
      [45, "捕虜なんて"],
      [50, "要らねぇんだよ！"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "boss",
    targetId: "devil_gundam",
    prefix: "devil_gundam",
    entries: [
      [1, "デビル"],
      [5, "アルティメット"],
      [10, "再生"],
      [15, "ランタオ島"],
      [20, "ギアナ高地"],
      [25, "第1形態"],
      [30, "最終形態"],
      [35, "キョウジ"],
      [40, "ヘッド"],
      [45, "DG"],
      [50, "細胞"]
    ]
  }),

  ...makeDefeatTitleRules({
    category: "boss",
    targetId: "extreme_gundam",
    prefix: "extreme_gundam",
    entries: [
      [1, "エクストリーム"],
      [5, "カルネージ"],
      [10, "タキオン"],
      [15, "イグニス"],
      [20, "ミスティック"],
      [25, "バーサス"],
      [30, "絶望蝶"],
      [35, "ふんす"],
      [40, "エクバ"],
      [45, "VS"],
      [50, "EX"]
    ]
  })
];

export const BOSS_TROPHY_RULES = [
  {
    bossId: "devil_gundam",
    trophyId: "D",
    label: "D",
    unlockAt: 1,
    playableUnlockAt: 50,
    unlockFlag: "playable_devil_gundam"
  },
  {
    bossId: "extreme_gundam",
    trophyId: "EX",
    label: "EX",
    unlockAt: 1,
    playableUnlockAt: 50,
    unlockFlag: "playable_extreme_gundam"
  }
];

export const UNLOCK_RULES = [
  {
    category: "cpu",
    targetId: "cpu_zaku_ii_soldier",
    count: 50,
    unlockFlag: "playable_zaku_ii_soldier"
  },
  {
    category: "cpu",
    targetId: "cpu_gouf",
    count: 50,
    unlockFlag: "playable_gouf"
  },
  {
    category: "cpu",
    targetId: "cpu_mobile_ginn",
    count: 50,
    unlockFlag: "playable_mobile_ginn"
  },
  {
    category: "boss",
    targetId: "devil_gundam",
    count: 50,
    unlockFlag: "playable_devil_gundam"
  },
  {
    category: "boss",
    targetId: "extreme_gundam",
    count: 50,
    unlockFlag: "playable_extreme_gundam"
  }
];

export const TITLE_DEFS = [
  ...BASE_TITLES,
  ...DEFEAT_TITLE_RULES.map(rule => ({
    id: rule.id,
    label: rule.label
  }))
];

const TITLE_LABEL_MAP = Object.fromEntries(
  TITLE_DEFS.map(title => [title.id, title.label])
);

export function getTitleLabel(titleId) {
  return TITLE_LABEL_MAP[titleId] || titleId;
}

export function getAllTitleDefs() {
  return TITLE_DEFS;
}
export const TITLE_DEFINITIONS = TITLE_DEFS;

export const TITLE_NAME_MAP = Object.fromEntries(
  TITLE_DEFS.map(title => [title.id, title.label])
);

export const UNLOCKABLE_UNIT_MAP = {
  playable_zaku_ii_soldier: "cpu_zaku_ii_soldier",
  playable_gouf: "cpu_gouf",
  playable_mobile_ginn: "cpu_mobile_ginn",
  playable_devil_gundam: "devil_gundam",
  playable_extreme_gundam: "extreme_gundam"
};
export function getTitleConditionText(titleId) {
  const rule = DEFEAT_TITLE_RULES.find(rule => rule.id === titleId);
  if (!rule) return "最初から所持、または期間限定称号";

  const nameMap = {
    gundam_mc: "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)",
    cpu_gundam_mc: "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)のCPU",
    z_gundam: "Zガンダム",
    cpu_z_gundam: "ZガンダムのCPU",
    shining_gundam: "シャイニングガンダム",
    cpu_shining_gundam: "シャイニングガンダムのCPU",
    wing_gundam_zero: "ウイングガンダムゼロ",
    cpu_wing_gundam_zero: "ウイングガンダムゼロのCPU",
    strike_gundam: "ストライクガンダム",
    cpu_strike_gundam: "ストライクガンダムのCPU",
    unicorn_gundam: "ユニコーンガンダム",
    cpu_unicorn_gundam: "ユニコーンガンダムのCPU",
    jegan_d_type: "ジェガンD型",
    cpu_jegan_d_type: "ジェガンD型のCPU",
    zudah: "ヅダ",
cpu_zudah: "ヅダのCPU",
    cpu_zaku_ii_soldier: "ザクⅡ(一般兵)",
    cpu_gouf: "グフ",
    cpu_mobile_ginn: "モビルジン",
    devil_gundam: "デビルガンダム",
    extreme_gundam: "エクストリームガンダム"
  };

  const targetName = nameMap[rule.targetId] || rule.targetId;

  if (rule.category === "playable") {
    return `${targetName}を${rule.count}回使用`;
  }

  if (rule.category === "cpu") {
    return `${targetName}を${rule.count}機撃破`;
  }

  if (rule.category === "boss") {
    return `${targetName}を${rule.count}回撃破`;
  }

  return `${targetName}を${rule.count}回達成`;
}

export const TITLE_GROUPS = [
  {
    groupId: "initial",
    label: "最初から所持",
    titleIds: INITIAL_TITLE_IDS
  },
  {
    groupId: "beta",
    label: "ベータテストに参加",
    titleIds: BETA_TITLE_IDS
  },
  ...[
    ["gundam_mc", "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)使用"],
    ["cpu_gundam_mc", "CPUガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)撃破"],
    ["z_gundam", "Zガンダム使用"],
    ["cpu_z_gundam", "CPU Zガンダム撃破"],
    ["shining_gundam", "シャイニングガンダム使用"],
    ["cpu_shining_gundam", "CPUシャイニングガンダム撃破"],
    ["wing_gundam_zero", "ウイングガンダムゼロ使用"],
    ["cpu_wing_gundam_zero", "CPUウイングガンダムゼロ撃破"],
    ["strike_gundam", "ストライクガンダム使用"],
    ["cpu_strike_gundam", "CPUストライクガンダム撃破"],
    ["unicorn_gundam", "ユニコーンガンダム使用"],
    ["cpu_unicorn_gundam", "CPUユニコーンガンダム撃破"],
    ["jegan_d_type", "ジェガンD型使用"],
    ["cpu_jegan_d_type", "CPUジェガンD型撃破"],
    ["zudah", "ヅダ使用"],
["cpu_zudah", "CPUヅダ撃破"],
    ["cpu_zaku_ii_soldier", "ザクⅡ(一般兵)撃破"],
    ["cpu_gouf", "グフ撃破"],
    ["cpu_mobile_ginn", "モビルジン撃破"],
    ["devil_gundam", "デビルガンダム撃破"],
    ["extreme_gundam", "エクストリームガンダム撃破"]
  ].map(([prefix, label]) => ({
    groupId: prefix,
    label,
    titleIds: DEFEAT_TITLE_RULES
      .filter(rule => rule.id.startsWith(`${prefix}_`))
      .map(rule => rule.id)
  }))
];
