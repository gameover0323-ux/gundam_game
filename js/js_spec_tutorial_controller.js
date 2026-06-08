export function createSpecTutorialController(ctx = {}) {
  const BUTTON_ID = "specTutorialBtn";
  const PANEL_ID = "specTutorialPanel";

  const pages = [
    {
      title: "各モードの仕様1",
      body: `
        <p>1on1、2on2モードは端末1画面で2人対戦できるモードです。</p>
        <p>一人で二機操作して、戦闘シミュレーションをしたりも出来ます。</p>
        <p>使用回数も増えて称号も貰えるので、知りたい機体を知り尽くすのにも利用できます。活用してみましょう。</p>

        <p>vsボスモードは、専用の行動を行う非プレイアブルのボスと戦うチャレンジモードです。</p>
        <p>勝利すると、撃破証明となるボストロフィーが機体の名称の横にセットできます。オンライン対戦やお気に入り機体にも表示されます。</p>
        <p>専用の称号もあるので、腕試しにトライしましょう！</p>

        <p>vsCPUモードでは、プレイアブル機体の自動操作機体と戦闘することができます。多少仕様が違いますが、勝利すると回数によって称号が手に入ります。</p>
        <p>初心者向けCPUはその名の通り、初心者でも勝ちやすいように作成したやられ役の機体です。抵抗はもちろんそこそこ激しいですが、システムが分かれば大したことはありません。初めて触る機体の試し斬りにもいいかも。</p>

        <p>オンライン対戦は、離れた友人やランダムマッチで抽選したオンラインプレイヤーと戦えるモードです。</p>
        <p>ルームIDを共有すれば専用の部屋を作れます。</p>
        <p>ランダムマッチは同じようにランダムマッチを押したプレイヤーと戦えます。プレイヤーカードから通知をオンにしている人はどこからでも通知を受け取って駆けつけられます。</p>
        <p>チャットも出来、戦闘がなかったことになる和平交渉や、降伏も可能。</p>
        <p>観戦モードもあり、戦闘中の部屋に入室して様子を見ることもできます。</p>
        <p>戦ったプレイヤーはプレイヤーカードに登録され、相手のプレイヤーカードと遭遇回数を保存して閲覧することができるようになります。</p>
      `
    },
    {
      title: "各モードの仕様2",
      body: `    <p>vsCPUモードでは、プレイアブル機体の自動操作機体と戦闘することができます。多少仕様が違いますが、勝利すると回数によって称号が手に入ります。</p>
        <p>初心者向けCPUはその名の通り、初心者でも勝ちやすいように作成したやられ役の機体です。抵抗はもちろんそこそこ激しいですが、システムが分かれば大したことはありません。初めて触る機体の試し斬りにもいいかも。</p>

        <p>オンライン対戦は、離れた友人やランダムマッチで抽選したオンラインプレイヤーと戦えるモードです。</p>
        <p>ルームIDを共有すれば専用の部屋を作れます。</p>
        <p>ランダムマッチは同じようにランダムマッチを押したプレイヤーと戦えます。プレイヤーカードから通知をオンにしている人はどこからでも通知を受け取って駆けつけられます。</p>
        <p>チャットも出来、戦闘がなかったことになる和平交渉や、降伏も可能。</p>
        <p>観戦モードもあり、戦闘中の部屋に入室して様子を見ることもできます。</p>
        <p>戦ったプレイヤーはプレイヤーカードに登録され、相手のプレイヤーカードと遭遇回数を保存して閲覧することができるようになります。</p>
`
    },
    {
      title: "HPの仕様",
      body: `
        <p>あらかじめ決められた各種機体の最大値からスタートします。</p>
        <p>回復で上限値まで行くと端数は無効になります。</p>
        <p>0になると撃墜扱いになり、戦闘不能になります。</p>
      `
    },
    {
      title: "回避所持数の仕様",
      body: `
        <p>HPの下に〇/〇と書いてある値です。</p>
        <p>基本的にあらかじめ決められた最大値以上を保有している場合は次のターンでカットされます。</p>
        <p>ただし、変形機など回避ストック最大値が多い形態から変化した場合は、ターン終了しても保持されます。その場合、使用して即座に最大値が減っていきます。この状態の所持数限界は50です。</p>
        <p>回避可能な攻撃を1回につき1消費して回避し、無効化できます。</p>
        <p>また、会心率が表示されたボタンを押すと、1消費につき4%の会心率を上昇させることができます。持続は3ターンです。</p>
      `
    },
    {
      title: "攻撃属性",
      body: `
        <p><b>[射]</b> 射撃属性。射撃対策や射撃参照効果の対象になります。</p>
        <p><b>[格]</b> 格闘属性。格闘カウンターなどの対象になります。</p>
        <p><b>[必]</b> 必中。通常の回避では避けられません。</p>
        <p><b>[不]</b> 軽減不可。通常のダメージ軽減では減らせません。</p>
        <p><b>[ビ]</b> ビーム。ビーム軽減・ビーム対策効果の対象になります。</p>
        <p>特殊行動や強化で後から付与された属性は、黄色表示で区別します。</p>
        <p>主な属性は上記ですが、他にも月光蝶属性やサイコミュ属性など、固有の属性が存在します。</p>
      `
    },
    {
      title: "シールド等の軽減方法",
      body: `
        <p>シールドや防御系特殊行動は、攻撃を受ける時にダメージを軽減・無効化する処理です。</p>
        <p>ただし、軽減不可属性を持つ攻撃は、原則として通常軽減できません。</p>
        <p>機体ごとの専用防御、ビーム軽減、固定軽減、無効化などは、各機体ルール側で処理されます。</p>
        <p>必中は「回避できない」属性であり、軽減不可とは別物です。</p>
      `
    },
    {
      title: "会心の仕様",
      body: `
        <p>全機体、開始時は5%の確率で会心が出ます。</p>
        <p>会心が出た攻撃はダメージ数値が倍になります。</p>
        <p>被弾を押した時に会心の抽選が発生します。</p>
        <p>回避所持数の下にある会心率表示ボタンを押して回避所持数を消費すると、3ターン持続する会心率＋4%効果が発動します。重複可能です。</p>
      `
    },
    {
      title: "スロット行動について",
      body: `
        <p>各機体に6つ割り当てられているランダム行動です。基本的にこの中の行動で戦うことになります。</p>
        <p>スロット行動の効果はざっくり表示されており、タップすると詳しい効果が見れます。特殊な効果が付与されている場合が多く、相手のものもよく確認していないと甚大な被害を受けます。</p>
        <p>スロット行動はスロット行動ボタンを押すと自動で発動し、それぞれの効果が画面下部のログで反映されます。</p>
        <p>その後に出る攻撃に対し、「被弾」「回避」で受けるのが基本です。</p>
        <p>あえてスロット行動をせずにターンを回すこともできますが、しっかりと画面中央上の行動欄を確認して、行動回数が残っているかを確認しましょう。行動数がある限りスロット行動が可能です。</p>
      `
    }
  ];

  let currentIndex = 0;

  function ensureButton() {
    let btn = document.getElementById(BUTTON_ID);
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.textContent = "もっとくわしくコラム";
    btn.style.display = "";
    btn.addEventListener("click", openPanel);

    const howToSummary = document.querySelector("summary.howToButton");

    if (howToSummary) {
      howToSummary.insertAdjacentElement("afterend", btn);
      return btn;
    }

    const playerStatsBtn = document.getElementById("playerStatsBtn");
    if (playerStatsBtn) {
      playerStatsBtn.insertAdjacentElement("afterend", btn);
      return btn;
    }

    document.body.appendChild(btn);
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
    panel.style.background = "rgba(0,0,0,0.82)";
    panel.style.padding = "18px";
    panel.style.overflowY = "auto";

    panel.innerHTML = `
      <div style="
        max-width:720px;
        margin:20px auto;
        background:#111;
        color:#fff;
        border:2px solid #888;
        border-radius:14px;
        padding:16px;
        line-height:1.6;
      ">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
          <h2 id="specTutorialTitle" style="margin:0;">仕様説明コラム</h2>
          <button id="specTutorialCloseBtn" type="button">閉じる</button>
        </div>

        <div id="specTutorialStepList" style="
          display:flex;
          flex-wrap:wrap;
          gap:6px;
          margin:14px 0;
        "></div>

        <div id="specTutorialBody" style="
          border:1px solid #555;
          border-radius:10px;
          padding:12px;
          background:#181818;
          text-align:left;
        "></div>

        <div style="display:flex; justify-content:space-between; margin-top:12px;">
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
      `仕様説明コラム ${currentIndex + 1}/${pages.length}`;

    const stepList = panel.querySelector("#specTutorialStepList");
    stepList.innerHTML = "";

    pages.forEach((p, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = `${index + 1}. ${p.title}`;
      btn.disabled = index === currentIndex;
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

  function openPanel() {
    ensurePanel().style.display = "";
    renderPanel();
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = "none";
  }

  function updateVisibility() {
    const btn = ensureButton();
    btn.style.display = "";
  }

  return {
    ensureButton,
    updateVisibility,
    openPanel,
    closePanel
  };
}
