import {
  CHAPTER1_AFTER_CUSTOMIZE_LINES,
  CHAPTER1_TUTORIAL_INTRO_LINES,
  CHAPTER1_SKIP_LINES,
  CHAPTER1_TUTORIAL_LINES
} from "./story_chapter1_tutorial_script.js";

import {
  STORY_TRAINING_MACHINE
} from "./story_training_machine_data.js";

export function createStoryChapter1Controller(ctx) {
  let currentLineIndex = 0;
  let currentLines = [];
  let currentHighlight = null;

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function clearHighlight() {
    if (!currentHighlight) return;
    document.querySelectorAll(currentHighlight).forEach(el => {
      el.style.color = "";
      el.style.borderColor = "";
      el.style.boxShadow = "";
    });
    currentHighlight = null;
  }

  function setHighlight(selector) {
    clearHighlight();
    if (!selector) return;
    currentHighlight = selector;
    document.querySelectorAll(selector).forEach(el => {
      el.style.color = "red";
      el.style.borderColor = "red";
      el.style.boxShadow = "0 0 10px red";
    });
  }

  function renderMovableTalkBox() {
    const existing = document.getElementById("storyTutorialTalkBox");
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.id = "storyTutorialTalkBox";
    box.style.position = "fixed";
    box.style.left = "12px";
    box.style.bottom = "80px";
    box.style.zIndex = "22000";
    box.style.width = "min(680px, 92vw)";
    box.style.border = "1px solid white";
    box.style.background = "black";
    box.style.color = "white";
    box.style.padding = "12px";
    box.style.boxSizing = "border-box";
    box.style.lineHeight = "1.7";
    box.style.touchAction = "none";

    box.innerHTML = `
      <div id="storyTutorialTalkText"></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
        <button id="storyTutorialNextTalkBtn">次へ</button>
      </div>
    `;

    document.body.appendChild(box);
    enableDrag(box);

    document.getElementById("storyTutorialNextTalkBtn").addEventListener("click", nextTutorialLine);
  }

  function enableDrag(target) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;

    target.addEventListener("pointerdown", event => {
      dragging = true;
      target.setPointerCapture(event.pointerId);
      startX = event.clientX;
      startY = event.clientY;
      baseX = target.offsetLeft;
      baseY = target.offsetTop;
    });

    target.addEventListener("pointermove", event => {
      if (!dragging) return;
      const nextX = baseX + event.clientX - startX;
      const nextY = baseY + event.clientY - startY;
      target.style.left = `${Math.max(0, nextX)}px`;
      target.style.top = `${Math.max(0, nextY)}px`;
      target.style.bottom = "auto";
    });

    target.addEventListener("pointerup", () => {
      dragging = false;
    });

    target.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  function startAfterCustomize() {
    renderSimpleDialogue(CHAPTER1_AFTER_CUSTOMIZE_LINES, renderTrainingIntro);
  }

  function renderSimpleDialogue(lines, onComplete) {
    const root = getRoot();
    currentLines = lines.map(text => ({ text }));
    currentLineIndex = 0;

    root.innerHTML = `
      <div style="
        width:min(720px,96vw);
        border:1px solid white;
        background:black;
        color:white;
        padding:16px;
        line-height:1.8;
      ">
        <div id="storySimpleDialogueText"></div>
        <button id="storySimpleDialogueNextBtn" style="margin-top:12px;">次へ</button>
      </div>
    `;

    function show() {
      document.getElementById("storySimpleDialogueText").textContent =
        currentLines[currentLineIndex]?.text || "";
    }

    document.getElementById("storySimpleDialogueNextBtn").addEventListener("click", () => {
      currentLineIndex += 1;
      if (currentLineIndex >= currentLines.length) {
        if (typeof onComplete === "function") onComplete();
        return;
      }
      show();
    });

    show();
  }

  function renderTrainingIntro() {
    const root = getRoot();
    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      <h2>演習戦闘</h2>
      ${renderMockBattleField()}
      <div style="text-align:center;margin-top:16px;">
        <div style="margin-bottom:12px;">${CHAPTER1_TUTORIAL_INTRO_LINES[0]}</div>
        <button id="storyTutorialYesBtn">はい</button>
        <button id="storyTutorialNoBtn">いいえ</button>
      </div>
    `;

    document.getElementById("storyTutorialYesBtn").addEventListener("click", startTutorialCourse);
    document.getElementById("storyTutorialNoBtn").addEventListener("click", startSkipCourse);
  }

  function renderMockBattleField() {
    return `
      <div id="storyMockBattle" style="width:min(760px,96vw);margin:0 auto;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div id="storyMockPlayerA" style="border:1px solid white;padding:10px;">
            <h3>PLAYER A</h3>
            <div>プロトクリエイトガンダム</div>
            <div class="story-hp">HP 200/200</div>
            <div class="story-evade">回避 1/1</div>
            <div class="story-energy">EN 100</div>
            <div class="story-slot-area">
              <b>スロット</b><br>
              1.汎用マシンガン<br>
              2.回復 30<br>
              3.回避 1<br>
              4.ビームガン<br>
              5.バズーカ<br>
              6.心中蹴り
            </div>
            <div class="story-special-area">
              <b>特殊行動</b><br>
              リロード<br>
              エネルギーチャージ<br>
              装備品1<br>
              装備品2<br>
              エネルギー調整
            </div>
          </div>

          <div id="storyMockPlayerB" style="border:1px solid white;padding:10px;">
            <h3>PLAYER B</h3>
            <div>${STORY_TRAINING_MACHINE.name}</div>
            <div class="story-hp">HP ${STORY_TRAINING_MACHINE.displayHp}</div>
            <div class="story-evade">回避 1/1</div>
            <div class="story-slot-area">
              <b>スロット</b><br>
              1.演習攻撃<br>
              2.演習射撃<br>
              3.演習属性攻撃[不]<br>
              4.演習属性攻撃[必]<br>
              5.確定会心攻撃<br>
              6.回避
            </div>
          </div>
        </div>

        <div style="text-align:center;margin-top:12px;">
          <button id="storyMockSlotBtn">スロット行動</button>
          <button id="storyMockSimBtn">シミュレーション</button>
          <button id="storyMockEndBtn">ターン終了</button>
        </div>
      </div>
    `;
  }

  function startSkipCourse() {
    renderSimpleDialogue(CHAPTER1_SKIP_LINES, renderFreeTrainingButtons);
  }

  function startTutorialCourse() {
    renderTrainingIntro();
    renderMovableTalkBox();

    const skipBtn = document.createElement("button");
    skipBtn.id = "storyTutorialSkipBtn";
    skipBtn.textContent = "スキップ";
    skipBtn.style.position = "fixed";
    skipBtn.style.left = "12px";
    skipBtn.style.bottom = "20px";
    skipBtn.style.zIndex = "22001";
    document.body.appendChild(skipBtn);

    skipBtn.addEventListener("click", () => {
      clearHighlight();
      document.getElementById("storyTutorialTalkBox")?.remove();
      document.getElementById("storyTutorialSkipBtn")?.remove();
      startSkipCourse();
    });

    currentLines = CHAPTER1_TUTORIAL_LINES;
    currentLineIndex = 0;
    showTutorialLine();
  }

  function showTutorialLine() {
    const line = currentLines[currentLineIndex];
    if (!line) return;

    setHighlight(line.highlight);

    const talkText = document.getElementById("storyTutorialTalkText");
    if (talkText) talkText.textContent = line.text || "";

    if (line.finish) {
      const nextBtn = document.getElementById("storyTutorialNextTalkBtn");
      if (nextBtn) {
        nextBtn.textContent = "終了";
      }
    }
  }

  function nextTutorialLine() {
    const line = currentLines[currentLineIndex];

    if (line?.finish) {
      clearHighlight();
      document.getElementById("storyTutorialTalkBox")?.remove();
      document.getElementById("storyTutorialSkipBtn")?.remove();
      renderFreeTrainingButtons();
      return;
    }

    currentLineIndex += 1;
    showTutorialLine();
  }

  function renderFreeTrainingButtons() {
    const root = getRoot();
    root.innerHTML = `
      <h2>チャプター1 演習</h2>
      ${renderMockBattleField()}
      <div style="text-align:center;margin-top:16px;">
        <button id="storyFree1v1Btn">1on1</button>
        <button id="storyFree2v2Btn">2on2</button>
        <button id="storyChapter1EndBtn">終了</button>
      </div>
    `;

    document.getElementById("storyFree1v1Btn").addEventListener("click", renderTrainingIntro);
    document.getElementById("storyFree2v2Btn").addEventListener("click", () => {
      ctx.showPopup?.("2on2チュートリアル接続は次段階で実装します");
    });
    document.getElementById("storyChapter1EndBtn").addEventListener("click", clearChapter1);
  }

  function clearChapter1() {
    const root = getRoot();
    root.innerHTML = `
      <h2>チャプター1 クリア</h2>
      <p>クリエイトガンダムラボ機能が開設されました。</p>
      <p>ストーリーメニューとチャプターセレクトは次段階で実装します。</p>
      <button id="storyCloseBtn">閉じる</button>
    `;

    document.getElementById("storyCloseBtn").addEventListener("click", () => {
      document.getElementById("storyModeRoot")?.remove();
    });
  }

  return {
    startAfterCustomize
  };
}
