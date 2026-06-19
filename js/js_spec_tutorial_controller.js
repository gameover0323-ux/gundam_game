const TERM_DICTIONARY_ENABLED_KEY = "gbs_term_dictionary_enabled";

function isTermDictionaryEnabled() {
  return localStorage.getItem(TERM_DICTIONARY_ENABLED_KEY) !== "false";
}

export function createSpecTutorialController(ctx = {}) {
  const TITLE_BUTTON_ID = "specTutorialBtn";
  const BATTLE_BUTTON_ID = "battleTermDictionaryBtn";
  const PANEL_ID = "specTutorialPanel";

  const pages = [
    { title: "行動権", body: `<p>バトル画面中央にある「行動」、もしくは統合型なら「統行」の数字。
    この数があると、「スロット行動」が可能。
    基本的にはターン開始時に1所持している。</p>` },
    { title: "ターン", body: `<p>行動権、つまりは行動の上に表示されているのが経過ターン数。
    プレイヤーA、プレイヤーBが行動して1ターン。
    基本的に1ターン間というのは、
    プレイヤーA～プレイヤーAと戻ってくる間のこと。</p>` },
    { title: "スロット行動", body: `<p>各機体に1～6の数字で設定されている基本的な行動。
    各種武器名称をタップすると、その武装の詳細な仕様が見れる。
    その武装が持つ属性や、副次効果があるので、対戦時はチェックしたほうが良い。</p>` },
    { title: "シミュレーション", body: `<p>もしこのタイミングでスロット行動を押していたら？
    という出目を見られる機能。
    要するに願掛けである。
    乱数調整に使ってください。</p>` },
    { title: "HP", body: `<p>各機体に設定されている耐久値。
    上限以上は回復しない。
    しかし、2on2の場合、統合型になることでこのHPを合わせることが可能になる。
    0になった時点で撃墜処理され、敗北する。</p>` },
    { title: "回避", body: `<p>HPの下にある「〇/△」のように表示されているもの。
    〇の位置に入るのが現在の所持値。
    △の値に入るのがストック所持最大値。
    ここが赤色の場合「赤上限」と呼び、
    金色の場合「金上限」と呼称する。
    上限を超えた場合にはターン終了時に端数カットされる。
    ただし、変形やスキルで上限が一時的に増えた場合は赤上限となり、保持される。詳しくは→赤上限
QTEの場合、所持数を1消費して攻撃を無効化する。
ただし、必中属性の攻撃は回避できない。
    </p>` },
    { title: "赤上限", body: `<p>変形先が現在の回避所持数を下回る最大値の時に
    一時的に保持される状態。
この状態の時は最大値=所持値になり、
使用などで数値が減ると連動してストック最大値も
減っていく。
そのため、変形して所持数を沢山保持してから最大値が少ない形態に移行する戦法ができる。
    </p>` },
    { title: "金上限", body: `<p>回避ストックが赤上限を超え、
    25の値になると文字色が金になる。
    この状態は頭打ちであり、それ以上になると
    端数は強制的にカットされる。
    しかし、2on2統合型では金上限が合わさり、
    50が最大値となる。
    </p>` },
    { title: "会心", body: `<p>初期値は5%。
    被弾を押した直後に抽選され、会心発動時は
    ダメージが2倍になる。
    会心率は回避を1消費すると3ターンの間4%上昇させることができ、
    方法は会心率表示ボタンのタップ。
    カットされる最大値を超えた回避はここで使おう。
    </p>` },
    { title: "特殊行動", body: `<p>各機体固有のスロット行動とは別の手段。
    説明文を読み、それらの特殊行動を使いこなす
    ことで、単なる乱数だけでなく思考と戦略が産まれる。
    格上の機体に勝利するには、用意された特殊行動を
    適切に使用する必要がある。読み込み、理解しよう。
    </p>` },
    { title: "EXスロット", body: `<p>特殊行動や条件によって通常のスロットと入れ替わるスロット。
    条件を満たすとスロットの色が赤色になり、
    ガラリと性能が変わる。
    特殊行動なのか、条件式なのかは各機体で異なる。</p>` },
    { title: "QTE", body: `<p>攻撃行動が来た際にこなす、プレイヤーへのタスクボタン。
    「被弾」「回避」があり、特殊行動がこのタイミングで選べる場合もある。
    さらに、2on2分散型だと「援護防御」が選択可能。
    各項目で解説する。</p>` },
    { title: "被弾", body: `<p>HPにダメージ数値がいってしまう行動。
    回避の場合は無効化できるが、
    被弾ボタンを選ぶと特殊行動や特性がない限り
    ダメージを受けてしまう。
    シールドなど、事前にダメージを軽減するスキルが
    なければ、これを押すしかない。
    これだけは喰らいたくないと思う行動が
    ある場合は回避を残しておこう。</p>` },
    { title: "攻撃属性", body: `<p>被弾、回避に関連する攻撃ごとに設定された属性。
    QTEでは[〇]で表示される。
    スキルなどの効果であとから付与されたものは橙色で表示される。
    各項目で解説する。</p>` },
    { title: "[射]", body: `<p>射撃属性。
    射撃に対応するカウンターなどに反応する。</p>` },
    { title: "[格]", body: `<p>格闘属性。
    格闘に対応するカウンターなどに反応する。</p>` },
    { title: "[必]", body: `<p>必中属性。
    通常の回避では避けることが出来ない。</p>` },
    { title: "[不]", body: `<p>軽減不可属性。
    基本的にこの攻撃ダメージを軽減することは出来ない。</p>` },
    { title: "[ビ]", body: `<p>ビーム属性。
    ビームコーティングやiフィールドに反応してしまう。</p>` },
    { title: "2on2：分散型", body: `<p>2on2ルールの際の型の一つ。
    フォーカス機体、パートナー機体を使い分ける。
    フォーカス機体は文字色が赤くなり、QTEをひとりで全て受けることとなる。
    この際、[援護防御]が選択できるようになる。
    2on2:援護防御の項目で解説する。
    また、専用システム[挑発][決戦][打破]を使用出来る。
    各個撃破を狙うには必須の機能。各項目で解説する。</p>` },
    { title: "2on2：統合型", body: `<p>2on2ルールの型のひとつであり、
    HP、回避所持数、行動可能回数をひとつにして、
    2機を1機として扱う型。
    行動可能回数を増やす機体はパートナーも増え、
    回避はパートナーからも使用でき、
    HP消費もパートナーと折半できる。
    打たれ強く、火力も高い単純明快に強力。
    しかし、[挑発]「決戦」[打破]はこの型では
    対応できない。単純に強いからこそ、この
    [挑発]や、[決戦]で崩す必要がある。
    </p>` },
    { title: "2on2：フォーカス", body: `<p>フォーカスは、QTEを受ける機体のこと。
    統合型の場合も、メイン受けを指定できる。
    フォーカス設定された機体は文字色が赤くなり、
    パートナーは白になる。
    統合型はどちらも赤くなるが、フォーカスは
    設定しておくとその機体の受けるスキルで
    被弾、回避をすることが出来る。
    </p>` },
    { title: "2on2：援護防御", body: `<p>2on2分散型で使用可能な行動。
    パートナーの回避を1消費して、その攻撃ダメージのみを半減する。
    単発を、フォーカス機体ではなくパートナーが被弾する。挑発や決戦時にもそのダメージから半減する。
    </p>` },
    { title: "2on2：挑発", body: `<p>2on2分散型でのみ使用可能なシステム。
    相手にフォーカス機体を指定することができる。
    指定機体は文字色が青色になり、
    指定機体をフォーカス機体にして
    分散型にしないと、1.5倍のダメージを受ける。
    従わなくても戦闘は可能。5ターン間効果は続く。
    この時、決戦が使用可能になる。
    </p>` },
    { title: "2on2：決戦", body: `<p>2on2分散型でのみ使用可能なシステム。
    自分の決戦機体を決定し、現在の相手のフォーカス機体をロックする。
    自分も決戦機体がロックされ、5ターン間お互いのフォーカス機体へのダメージが2倍になる。
    決戦機体は文字色がピンク色になる。
    この時、[打破]が使用可能になる。
    </p>` },
    { title: "2on2：打破", body: `<p>2on2分散型でのみ使用可能なシステム。
    決戦機体をお互いに0～10の数字をベットし、
    その指定した数字のターン分シミュレーションする。
    総ダメージ量が多かった方の勝ちで、その間に獲得した強化や回避は引き継ぐ。
    回復は相手のダメージ量の減算に使われる。
    勝者はボーナス行動権が手に入り、ボーナス行動権はお互いのベット数が多いほど増える。
    打破後は決戦状態が解除。5ターン間のクールタイムが発生する。
  めちゃくちゃおもしろいからやってみて。
    </p>` },
    { title: "オンライン対戦", body: `<p>画面1番上にテキストボックスがある。
    これがチャットで、下部の戦闘ログの上に現れる。
    送信すると上書きされる。
    [和平]は、成立すると試合を無かったことにできる。
    [降伏]は、無条件で自信が敗北する。
    意図せず回線が切れた場合も降伏扱いになる。
    戦闘したプレイヤーは、プレイヤーカードに保存される。
    </p>` }
  ];

  let currentIndex = 0;

  function makeButton(id, text, className = "") {
    let btn = document.getElementById(id);
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = id;
    btn.type = "button";
    btn.textContent = text;
    if (className) btn.className = className;
    btn.addEventListener("click", () => openPanel());
    return btn;
  }

  function ensureTitleButton() {
    const btn = makeButton(TITLE_BUTTON_ID, "もっとくわしくコラム");

    const howToSummary = document.querySelector("summary.howToButton");
    if (howToSummary && btn.parentElement !== howToSummary.parentElement) {
      howToSummary.insertAdjacentElement("afterend", btn);
      return btn;
    }

    const playerStatsBtn = document.getElementById("playerStatsBtn");
    if (playerStatsBtn && !btn.parentElement) {
      playerStatsBtn.insertAdjacentElement("afterend", btn);
      return btn;
    }

    if (!btn.parentElement) document.body.appendChild(btn);
    return btn;
  }

  function ensureBattleButton() {
    const btn = makeButton(BATTLE_BUTTON_ID, "用語", "battle-term-dictionary-btn");

    btn.style.width = "35px";
    btn.style.minHeight = "30px";
    btn.style.padding = "2px";
    btn.style.fontSize = "12px";
    btn.style.lineHeight = "1.1";
    btn.style.border = "1px solid white";
    btn.style.borderRadius = "8px";

    const actionCounterBox = document.getElementById("actionCounterBox");
    if (actionCounterBox && btn.parentElement !== actionCounterBox.parentElement) {
      actionCounterBox.insertAdjacentElement("afterend", btn);
      return btn;
    }

    if (!btn.parentElement) document.body.appendChild(btn);
    return btn;
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.display = "none";
    panel.style.position = "fixed";
    panel.style.inset = "0";
    panel.style.zIndex = "9999";
    panel.style.background = "rgba(0,0,0,0.86)";
    panel.style.padding = "14px";
    panel.style.overflowY = "auto";
    panel.style.color = "white";

    panel.innerHTML = `
      <div style="max-width:720px;margin:0 auto;border:1px solid white;border-radius:10px;padding:12px;background:#050505;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <h2 id="specTutorialTitle" style="margin:0;">用語説明</h2>
          <button id="specTutorialCloseBtn" type="button">閉じる</button>
        </div>

        <div id="specTutorialStepList" style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0;"></div>

        <div id="specTutorialBody" style="border-top:1px solid #777;padding-top:10px;line-height:1.6;"></div>

        <div style="display:flex;justify-content:center;gap:10px;margin-top:14px;">
          <button id="specTutorialPrevBtn" type="button">前へ</button>
          <button id="specTutorialNextBtn" type="button">次へ</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector("#specTutorialCloseBtn").addEventListener("click", closePanel);
    panel.querySelector("#specTutorialPrevBtn").addEventListener("click", () => {
      currentIndex = Math.max(0, currentIndex - 1);
      renderPanel();
    });
    panel.querySelector("#specTutorialNextBtn").addEventListener("click", () => {
      currentIndex = Math.min(pages.length - 1, currentIndex + 1);
      renderPanel();
    });
    panel.addEventListener("click", event => {
      if (event.target === panel) closePanel();
    });

    return panel;
  }

  function renderPanel() {
    const panel = ensurePanel();
    const page = pages[currentIndex];

    panel.querySelector("#specTutorialTitle").textContent =
      `用語説明 ${currentIndex + 1}/${pages.length}`;

    const stepList = panel.querySelector("#specTutorialStepList");
    stepList.innerHTML = "";

    pages.forEach((p, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p.title;
      btn.disabled = index === currentIndex;
      btn.style.fontSize = "12px";
      btn.addEventListener("click", () => {
        currentIndex = index;
        renderPanel();
      });
      stepList.appendChild(btn);
    });

    panel.querySelector("#specTutorialBody").innerHTML = `
      <h3 style="margin-top:0;">${page.title}</h3>
      ${page.body}
    `;

    panel.querySelector("#specTutorialPrevBtn").disabled = currentIndex <= 0;
    panel.querySelector("#specTutorialNextBtn").disabled = currentIndex >= pages.length - 1;
  }

  function openPanel(index = null) {
    if (typeof index === "number" && pages[index]) currentIndex = index;
    ensurePanel().style.display = "";
    renderPanel();
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = "none";
  }

  function updateVisibility() {
  const titleBtn = ensureTitleButton();
  const battleBtn = ensureBattleButton();
  const enabled = isTermDictionaryEnabled();

  titleBtn.style.display = enabled ? "" : "none";
  battleBtn.style.display =
    enabled && document.getElementById("battle")
      ? ""
      : "none";
}

window.addEventListener("gbs:termDictionarySettingChanged", updateVisibility);

  ensureTitleButton();
  ensureBattleButton();

  return {
    ensureButton: ensureTitleButton,
    ensureBattleButton,
    updateVisibility,
    openPanel,
    closePanel
  };
}
