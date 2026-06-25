import {
  CHAPTER1_AFTER_CUSTOMIZE_LINES,
  CHAPTER1_TUTORIAL_INTRO_LINES,
  CHAPTER1_SKIP_LINES,
  CHAPTER1_TUTORIAL_LINES
} from "./story_chapter1_tutorial_script.js";

import { createStoryBattleEngine } from "./story_battle_engine.js";

export function createStoryChapter1Controller(ctx) {
  const battleEngine = createStoryBattleEngine(ctx);

  let currentLineIndex = 0;
  let currentLines = [];
  let currentHighlight = null;

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function clearHighlight() {
    if (currentHighlight) {
      document.querySelectorAll(currentHighlight).forEach(el => {
        el.style.color = "";
        el.style.borderColor = "";
        el.style.boxShadow = "";
      });
    }

    battleEngine.clearHighlight?.();
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

  function removeTutorialFloatingUi() {
    document.getElementById("storyTutorialTalkBox")?.remove();
    document.getElementById("storyTutorialSkipBtn")?.remove();
    clearHighlight();
  }

  function startAfterCustomize() {
    renderSimpleDialogue(CHAPTER1_AFTER_CUSTOMIZE_LINES, renderTrainingIntro);
  }

  function renderSimpleDialogue(lines, onComplete) {
    const root = getRoot();
    if (!root) return;

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
    if (!root) return;

    battleEngine.renderOneOnOneTraining({
      root,
      free: false
    });

    battleEngine.setExtraPanel(`
      <div style="text-align:center;margin-top:16px;">
        <div style="margin-bottom:12px;">${CHAPTER1_TUTORIAL_INTRO_LINES[0]}</div>
        <button id="storyTutorialYesBtn">はい</button>
        <button id="storyTutorialNoBtn">いいえ</button>
      </div>
    `);

    document.getElementById("storyTutorialYesBtn").addEventListener("click", startTutorialCourse);
    document.getElementById("storyTutorialNoBtn").addEventListener("click", startSkipCourse);
  }

  function startSkipCourse() {
    removeTutorialFloatingUi();
    renderSimpleDialogue(CHAPTER1_SKIP_LINES, renderFreeTrainingButtons);
  }

  function startTutorialCourse() {
    battleEngine.renderOneOnOneTraining({
      root: getRoot(),
      free: false
    });

    renderMovableTalkBox();

    const skipBtn = document.createElement("button");
    skipBtn.id = "storyTutorialSkipBtn";
    skipBtn.textContent = "スキップ";
    skipBtn.style.position = "fixed";
    skipBtn.style.left = "12px";
    skipBtn.style.bottom = "20px";
    skipBtn.style.zIndex = "22001";
    document.body.appendChild(skipBtn);

    skipBtn.addEventListener("click", startSkipCourse);

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
      if (nextBtn) nextBtn.textContent = "終了";
    }
  }

  function nextTutorialLine() {
    const line = currentLines[currentLineIndex];

    if (line?.finish) {
      removeTutorialFloatingUi();
      renderFreeTrainingButtons();
      return;
    }

    currentLineIndex += 1;
    showTutorialLine();
  }

  function renderFreeTrainingButtons() {
    const root = getRoot();
    if (!root) return;

    battleEngine.renderOneOnOneTraining({
      root,
      free: true
    });

    battleEngine.setLog("フリー演習です。1on1、2on2、終了を選べます。");

    battleEngine.renderModeButtons({
      on1v1: () => {
        battleEngine.renderOneOnOneTraining({
          root: getRoot(),
          free: true
        });

        battleEngine.setLog("1on1演習をリセットしました。");

        battleEngine.renderModeButtons({
          on1v1: renderFreeTrainingButtons,
          on2v2: renderFreeTwoOnTwo,
          onEnd: clearChapter1
        });
      },

      on2v2: renderFreeTwoOnTwo,

      onEnd: clearChapter1
    });
  }

  function renderFreeTwoOnTwo() {
    const root = getRoot();
    if (!root) return;

    battleEngine.renderTwoOnTwoTraining({
      root,
      free: true
    });

    battleEngine.setLog("2on2演習を開始しました。");

    battleEngine.renderModeButtons({
      on1v1: renderFreeTrainingButtons,
      on2v2: renderFreeTwoOnTwo,
      onEnd: clearChapter1
    });
  }

  function clearChapter1() {
    removeTutorialFloatingUi();

    const root = getRoot();
    if (!root) return;

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
