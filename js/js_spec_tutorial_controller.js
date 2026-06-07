export function createSpecTutorialController(ctx) {
  const BUTTON_ID = "specTutorialBtn";
  const PANEL_ID = "specTutorialPanel";

  const pages = [
    {
      title: "スロット行動の仕組み",
      body: `
        <p>スロット行動は、機体ごとに用意されたスロット1〜6からランダムに1つを実行する基本行動です。</p>
        <p>攻撃、回復、回避増加、強化、換装など、出目によって処理が変わります。</p>
        <p>スロットの説明文はプレイヤー向け表示であり、実際の挙動は内部データと機体ルールで決まります。</p>
      `
    },
    {
      title: "QTE処理",
      body: `
        <p>攻撃が発生すると、攻撃1発ごとに防御側が対応を選びます。</p>
        <p>基本は「被弾」または「回避」です。</p>
        <p>2on2分散型では、条件を満たすと援護防御も選べます。</p>
        <p>多段攻撃は1発ずつ処理されるため、どの攻撃を受け、どの攻撃を避けるかが重要です。</p>
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
      title: "回避上限",
      body: `
        <p>回避は、攻撃1発を無効化するためのストックです。</p>
        <p>通常は機体ごとの回避上限まで保持します。</p>
        <p>ターン終了や形態変化のタイミングで、現在の上限に合わせて整理される場合があります。</p>
        <p>回避をリソースとして消費する特殊行動もあるため、攻撃回避だけに使うとは限りません。</p>
      `
    },
    {
      title: "赤上限",
      body: `
        <p>赤上限は、通常上限を超えた回避を一時的に保持している状態です。</p>
        <p>例：回避上限3の機体が、効果によって回避6を持っている場合などに赤表示になります。</p>
        <p>赤上限中の回避は、消費されるまでは保持されます。</p>
        <p>ただし、金上限・赤上限・形態変化の扱いは共通ランタイム側のルールに従います。</p>
      `
    }
  ];

  let currentIndex = 0;

  function canUse() {
    return typeof ctx.canUseDebug === "function" && ctx.canUseDebug();
  }

  function ensureButton() {
    let btn = document.getElementById(BUTTON_ID);
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "仕様説明チュートリアル";
    btn.style.display = "none";
    btn.addEventListener("click", openPanel);

    const statsBtn = document.getElementById("playerStatsBtn");
    if (statsBtn) {
      statsBtn.insertAdjacentElement("afterend", btn);
    } else {
      document.body.appendChild(btn);
    }

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
          <h2 id="specTutorialTitle" style="margin:0;">仕様説明チュートリアル</h2>
          <button id="specTutorialCloseBtn">閉じる</button>
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
          <button id="specTutorialPrevBtn">前へ</button>
          <button id="specTutorialNextBtn">次へ</button>
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

    return panel;
  }

  function renderPanel() {
    const panel = ensurePanel();
    const page = pages[currentIndex];

    panel.querySelector("#specTutorialTitle").textContent =
      `仕様説明チュートリアル ${currentIndex + 1}/${pages.length}`;

    const stepList = panel.querySelector("#specTutorialStepList");
    stepList.innerHTML = "";

    pages.forEach((p, index) => {
      const btn = document.createElement("button");
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
    if (!canUse()) {
      if (typeof ctx.showPopup === "function") {
        ctx.showPopup("仕様説明チュートリアルはデバッグ権限専用です");
      }
      return;
    }

    ensurePanel().style.display = "";
    renderPanel();
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = "none";
  }

  function updateVisibility() {
    const btn = ensureButton();
    btn.style.display = canUse() ? "" : "none";
  }

  return {
    ensureButton,
    updateVisibility,
    openPanel,
    closePanel
  };
}
