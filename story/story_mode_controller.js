import { createStoryChapter1Controller } from "./story_chapter1_controller.js";
import {
  PROTO_CREATE_BASE,
  STORY_SLOT_OPTIONS,
  STORY_EQUIPMENT_OPTIONS,
   STORY_SKILL_OPTIONS,
  STORY_COMPANION_OPTIONS,
  getStoryDropSlotOptions,
  getStoryDropEquipmentOptions,
  getStoryDropSkillOptions,
  findStorySlotOption,
  findStoryEquipmentOption,
  findStoryCompanionOption,
  findStorySkillOption,
  calculateProtoCreateLabCost,
  createInitialProtoCreateLabState
} from "./story_create_lab_data.js";

import {
  loadStorySave,
  getProtoCreateLevelInfo,
  getProtoCreateMaxCost,
  updateProtoCreateLabState,
  setStoryFlag,
  setActiveStoryCreateUnit,
  setLiberalGaUnit,
  setLiberalCustomName,
  setLiberalCustomLabel
} from "./story_save.js";

import {
  setStoryCreateUnitLabOverride,
  clearStoryCreateUnitLabOverride
} from "./story_units.js";

import { createStoryChapter2Controller } from "./story_chapter2_controller.js";
import { createStoryLearningBattleController } from "./story_learning_battle_controller.js";
import { createStoryChapterBossController } from "./story_chapter_boss_controller.js";
export function createStoryModeController(ctx) {
  const DEBUG_ROLES = new Set(["debug", "Ciel_debugger"]);
  const PROTO_UNIT_ID = "proto_create_gundam";

  let activeScene = null;
  let lineIndex = 0;
  let locked = false;

  let storySave = loadStorySave();
  let labMode = "normal";
  let customizeState = storySave.createUnits.proto_create_gundam.lab;

  const chapter1Controller = createStoryChapter1Controller({
    ...ctx,
    onChapter1Clear: () => {
      clearStoryCreateUnitLabOverride(PROTO_UNIT_ID);
      setStoryFlag("chapter1Cleared", true);
      setStoryFlag("labUnlocked", true);
      setStoryFlag("storyMenuUnlocked", true);
      refreshStorySave();
    },
    closeStoryModeToTitle
  });

const chapter2Controller = createStoryChapter2Controller({
  ...ctx,
  renderStoryMainMenu,
  showTitle: closeStoryModeToTitle
});

  const storyLearningBattleController = createStoryLearningBattleController({
    ...ctx,
    renderStoryMainMenu
  });

  const storyChapterBossController = createStoryChapterBossController({
    ...ctx,
    renderStoryMainMenu
  });
  
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getChapter1InitialLabState() {
    return createInitialProtoCreateLabState();
  }

  function applyChapter1Override() {
    if (labMode !== "chapter1") return;
    setStoryCreateUnitLabOverride(PROTO_UNIT_ID, customizeState);
  }

  function refreshStorySave() {
    storySave = loadStorySave();

    if (labMode === "chapter1") {
      customizeState = getChapter1InitialLabState();
      applyChapter1Override();
      return;
    }

    clearStoryCreateUnitLabOverride(PROTO_UNIT_ID);
    customizeState = storySave.createUnits.proto_create_gundam.lab;
  }

  function persistCustomizeState() {
    if (labMode === "chapter1") {
      applyChapter1Override();
      return;
    }

    updateProtoCreateLabState(() => clone(customizeState));
    refreshStorySave();
  }

  function getMaxCost() {
    return getProtoCreateMaxCost(storySave);
  }

  function getRemainCost() {
    return getMaxCost() - calculateProtoCreateLabCost(customizeState);
  }

  function isCostOver() {
    return getRemainCost() < 0;
  }

  function canUseStoryMode() {
    const role = ctx.getPlayerProfile?.()?.role;
    if (DEBUG_ROLES.has(role)) return true;

    const summaryText = document.getElementById("playerCardSummary")?.textContent || "";
    return summaryText.includes("権限：debug") || summaryText.includes("権限：Ciel_debugger");
  }

  function updateStartButtonVisibility() {
    const btn = document.getElementById("startStoryModeBtn");
    if (!btn) return;
    btn.style.display = canUseStoryMode() ? "" : "none";
  }

  function clearStoryScreen() {
    document.getElementById("storyModeRoot")?.remove();
  }

  function createRoot() {
    clearStoryScreen();

    const root = document.createElement("div");
    root.id = "storyModeRoot";
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "20000";
    root.style.background = "black";
    root.style.color = "white";
    root.style.opacity = "0";
    root.style.transition = "opacity 3s";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "center";
    root.style.justifyContent = "center";
    root.style.padding = "16px";
    root.style.boxSizing = "border-box";

    document.body.appendChild(root);
    requestAnimationFrame(() => {
      root.style.opacity = "1";
    });

    return root;
  }

  function renderDialogue(lines, onComplete) {
    const root = document.getElementById("storyModeRoot") || createRoot();
    activeScene = { lines, onComplete };
    lineIndex = 0;

    root.innerHTML = `
      <div id="storyDialogueBox" style="
        width: min(720px, 96vw);
        border: 1px solid white;
        padding: 18px;
        background: rgba(0,0,0,0.9);
        font-size: 16px;
        line-height: 1.8;
      ">
        <div id="storyDialogueText"></div>
        <button id="storyDialogueNextBtn" style="margin-top:16px;">次へ</button>
      </div>
    `;

    document.getElementById("storyDialogueNextBtn").addEventListener("click", nextDialogue);
    showCurrentLine();
  }

  function showCurrentLine() {
    const text = document.getElementById("storyDialogueText");
    if (!text || !activeScene) return;
    text.textContent = activeScene.lines[lineIndex] || "";
  }

  function nextDialogue() {
    if (!activeScene || locked) return;

    lineIndex += 1;
    if (lineIndex < activeScene.lines.length) {
      showCurrentLine();
      return;
    }

    const done = activeScene.onComplete;
    activeScene = null;
    if (typeof done === "function") done();
  }

  function start() {
    if (!canUseStoryMode()) {
      ctx.showPopup?.("ストーリーモードは現在デバッグ権限者のみ使用できます");
      return;
    }

    labMode = "normal";
    refreshStorySave();
    createRoot();

    setTimeout(() => {
      refreshStorySave();

      if (storySave.flags?.storyMenuUnlocked) {
        renderStoryMainMenu();
        return;
      }

      if (ctx.getPlayerProfile?.()) {
        startNormalRoute();
      } else {
        startGuestRoute();
      }
    }, 3100);
  }

    function closeStoryModeToTitle() {
    activeScene = null;
    lineIndex = 0;
    locked = false;

    clearStoryCreateUnitLabOverride(PROTO_UNIT_ID);
    clearStoryScreen();

    if (typeof ctx.showTitle === "function") {
      ctx.showTitle();
    }

    document.getElementById("battle")?.style.setProperty("display", "none");
    document.getElementById("select")?.style.setProperty("display", "none");
    document.getElementById("onlineRoom")?.style.setProperty("display", "none");
    document.getElementById("title")?.style.setProperty("display", "block");
    }
function renderStoryMainMenu() {
  labMode = "normal";
  refreshStorySave();

  const root = document.getElementById("storyModeRoot") || createRoot();
      const chapter2Cleared = storySave.flags?.chapter2Cleared === true;
    const learningBattleUnlocked = storySave.flags?.learningBattleUnlocked === true || chapter2Cleared;
    const chapterBossUnlocked = storySave.flags?.chapterBossUnlocked === true;

    root.innerHTML = `
      <h2>ストーリーモード</h2>
      <button id="storyChapterSelectBtn">チャプターセレクト</button>
      <button id="storyLabMenuBtn">クリエイトガンダムラボ</button>
      ${learningBattleUnlocked ? `<button id="storyLearningBattleBtn">学習戦闘</button>` : ""}
      ${chapterBossUnlocked ? `<button id="storyChapterBossBtn">チャプターボス</button>` : ""}
      <button id="storyMenuCloseBtn">閉じる</button>
    `;

    document.getElementById("storyChapterSelectBtn")?.addEventListener("click", renderChapterSelect);
    document.getElementById("storyLabMenuBtn")?.addEventListener("click", renderNormalLab);
    document.getElementById("storyMenuCloseBtn")?.addEventListener("click", closeStoryModeToTitle);

    document.getElementById("storyLearningBattleBtn")?.addEventListener("click", () => {
      storyLearningBattleController.renderLearningMenu();
    });

    document.getElementById("storyChapterBossBtn")?.addEventListener("click", () => {
      storyChapterBossController.startGundamBoss();
    });
}

function renderChapterSelect() {
  const root = document.getElementById("storyModeRoot") || createRoot();

  root.innerHTML = `
    <h2>チャプターセレクト</h2>
    <button id="storyChapter1Btn">チャプター1</button>
    <button id="storyChapter2Btn">チャプター2</button>
    <button id="storyChapterSelectBackBtn">戻る</button>
  `;

  document.getElementById("storyChapter1Btn")?.addEventListener("click", startChapter1FromSelect);
  document.getElementById("storyChapter2Btn")?.addEventListener("click", () => chapter2Controller.start());
  document.getElementById("storyChapterSelectBackBtn")?.addEventListener("click", renderStoryMainMenu);
}

  function startChapter1FromSelect() {
    labMode = "chapter1";
    customizeState = getChapter1InitialLabState();
    applyChapter1Override();
    startNormalRoute();
  }

  function renderNormalLab() {
    labMode = "normal";
    refreshStorySave();
    renderCustomizeTutorial();
  }

  function startGuestRoute() {
    renderDialogue([
      "AI「…あっ！？新しいプレイヤーさん！？」",
      "AI「このモードは、プレイヤー登録をしないとまともに遊べませんよ！遊んだ内容が記録されて楽しいですよ！プレイヤー登録しますか？」"
    ], renderGuestChoice);
  }

  function renderGuestChoice() {
    const root = document.getElementById("storyModeRoot");
    root.innerHTML = `
      <div style="text-align:center;">
        <p>プレイヤー登録しますか？</p>
        <button id="storyRegisterYesBtn">はい</button>
        <button id="storyRegisterNoBtn">いいえ</button>
      </div>
    `;

    document.getElementById("storyRegisterYesBtn").addEventListener("click", async () => {
      await ctx.playerAccountUi?.handleRegister?.();
      renderDialogue([
        "AI「ふむふむ。いい名前ですね！これからよろしくお願いしますね！それじゃ改めて…」"
      ], startNormalRoute);
    });

    document.getElementById("storyRegisterNoBtn").addEventListener("click", () => {
      renderDialogue([
        "AI「なんと…！まさかこのモードをノーセーブで不眠不休でクリアまで持っていく気ですか！」",
        "AI「それもまたよし！見届けますよ！私も！それじゃ改めて…」"
      ], startNormalRoute);
    });
  }

  function startNormalRoute() {
    labMode = "chapter1";
    customizeState = getChapter1InitialLabState();
    applyChapter1Override();

    renderDialogue([
      "AI「ストーリーモードを選択してくださり、ありがとうございまーす！」",
      "AI「申し遅れました！私はひとり寂しくこのゲームに設置されたナビゲーターAIです！」",
      "AI「このモードは、私と一緒に色々なデータを集め、貴方が最強のガンダムを作り上げるモードです！」",
      "AI「そのベースこそ、この機体です！」",
      "AI「その名も、プロトクリエイトガンダム！」",
      "AI「この機体はまだなんのデータもないよわよわロボットです！あなたはこの機体で駆け回り、最強になるためにデータを集めるのです！」",
      "AI「プロトクリエイトガンダムはあなたのカスタマイズで千変万化の能力を持つ機体です！早速カスタマイズ画面に行きましょう！」"
    ], renderLabTutorial);
  }

  function renderLabTutorial() {
    const root = document.getElementById("storyModeRoot");
    root.innerHTML = `
      <h2>クリエイトガンダムラボ</h2>
      <button id="storyCustomizeBtn" disabled>カスタマイズ</button>
      <button id="storyLabExitBtn" disabled>退室</button>
      <div id="storyLabTalk" style="margin-top:20px; max-width:720px; line-height:1.8;"></div>
    `;

    document.getElementById("storyLabTalk").textContent =
      "AI「クリエイトガンダムラボへ来ました！この画面でプロトクリエイトガンダムをカスタムすることができますよ！まずはカスタマイズを押してみましょう！」";

    setTimeout(() => {
      document.getElementById("storyCustomizeBtn").disabled = false;
    }, 800);

    document.getElementById("storyCustomizeBtn").addEventListener("click", renderCustomizeTutorial);
  }

  function setHighlight(selector, enabled) {
    document.querySelectorAll(selector).forEach(el => {
      el.style.color = enabled ? "red" : "";
      el.style.borderColor = enabled ? "red" : "";
      el.style.boxShadow = enabled ? "0 0 8px red" : "";
    });
  }

  function adjustHp(delta) {
    const step = Number(PROTO_CREATE_BASE.hpStep || 20);
    const costStep = Number(PROTO_CREATE_BASE.hpCostStep || 10);
    const maxHp = Number(PROTO_CREATE_BASE.hpMax || 1000);
    const nextHp = Number(customizeState.hp || 0) + (delta > 0 ? step : -step);

    if (delta > 0 && getRemainCost() < costStep) return;
    if (delta < 0 && Number(customizeState.hpCost || 0) <= 0) return;
    if (nextHp > maxHp) return;
    if (nextHp < PROTO_CREATE_BASE.baseHp) return;

    customizeState.hp = nextHp;
    customizeState.hpCost = Number(customizeState.hpCost || 0) + (delta > 0 ? costStep : -costStep);
    persistCustomizeState();
    renderCustomizeValues();
  }

  function adjustEvade(delta) {
    const step = Number(PROTO_CREATE_BASE.evadeStep || 1);
    const costStep = Number(PROTO_CREATE_BASE.evadeCostStep || 20);
    const maxEvade = Number(PROTO_CREATE_BASE.evadeMax || 25);
    const nextEvade = Number(customizeState.evade || 0) + (delta > 0 ? step : -step);

    if (delta > 0 && getRemainCost() < costStep) return;
    if (delta < 0 && Number(customizeState.evadeCost || 0) <= 0) return;
    if (nextEvade > maxEvade) return;
    if (nextEvade < PROTO_CREATE_BASE.baseEvade) return;

    customizeState.evade = nextEvade;
    customizeState.evadeCost = Number(customizeState.evadeCost || 0) + (delta > 0 ? costStep : -costStep);
    persistCustomizeState();
    renderCustomizeValues();
  }

  function adjustEnergy(delta) {
    const step = Number(PROTO_CREATE_BASE.energyStep || 1);
    const costStep = Number(PROTO_CREATE_BASE.energyCostStep || 1);
    const nextEnergy = Number(customizeState.energy || 0) + (delta > 0 ? step : -step);

    if (delta > 0 && getRemainCost() < costStep) return;
    if (delta < 0 && Number(customizeState.energyCost || 0) <= 0) return;
    if (nextEnergy < PROTO_CREATE_BASE.baseEnergy) return;

    customizeState.energy = nextEnergy;
    customizeState.energyCost = Number(customizeState.energyCost || 0) + (delta > 0 ? costStep : -costStep);
    persistCustomizeState();
    renderCustomizeValues();
  }

  function bindHoldButton(btn, action) {
    if (!btn) return;

    let holdTimer = null;
    let repeatTimer = null;

    function clearHold() {
      if (holdTimer) clearTimeout(holdTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      holdTimer = null;
      repeatTimer = null;
    }

    btn.addEventListener("click", action);

    btn.addEventListener("pointerdown", event => {
      event.preventDefault();
      clearHold();
      holdTimer = setTimeout(() => {
        repeatTimer = setInterval(action, 60);
      }, 1000);
    });

    btn.addEventListener("pointerup", clearHold);
    btn.addEventListener("pointerleave", clearHold);
    btn.addEventListener("pointercancel", clearHold);
  }

  function updateReadyButton() {
    const readyBtn = document.getElementById("storyReadyBtn");
    if (!readyBtn) return;

    const mode = readyBtn.dataset.readyMode || "locked";

    if (mode === "locked") {
      readyBtn.disabled = true;
      return;
    }

    readyBtn.disabled = isCostOver();
  }

  function renderCustomizeValues() {
    const levelInfo = getProtoCreateLevelInfo(storySave);
    const maxCost = getMaxCost();
    const remainCost = getRemainCost();

    const levelText = document.getElementById("storyLevelText");
    if (levelText) {
      levelText.innerHTML = [
        `Lv${levelInfo.level}`,
        `${levelInfo.currentExp} / ${levelInfo.nextExp} Exp`,
        `次Lvまで${levelInfo.remainingExp}`
      ].join("<br>");
    }

    const costText = document.getElementById("storyCostText");
    if (costText) {
      costText.textContent = `コスト ${maxCost}[残${remainCost}]`;
      costText.style.color = remainCost < 0 ? "#ff6666" : "";
    }

    const hpText = document.getElementById("storyHpText");
    const hpCost = document.getElementById("storyHpCost");
    if (hpText) hpText.textContent = `HP ${customizeState.hp}`;
    if (hpCost) hpCost.textContent = `[コスト${customizeState.hpCost}]`;

    const evadeText = document.getElementById("storyEvadeText");
    const evadeCost = document.getElementById("storyEvadeCost");
    if (evadeText) evadeText.textContent = `回避ストック ${customizeState.evade}`;
    if (evadeCost) evadeCost.textContent = `[コスト${customizeState.evadeCost}]`;

    const energyText = document.getElementById("storyEnergyText");
    const energyCost = document.getElementById("storyEnergyCost");
    if (energyText) energyText.textContent = `エネルギー ${customizeState.energy}`;
    if (energyCost) energyCost.textContent = `[コスト${customizeState.energyCost}]`;

    updateReadyButton();
  }

  function renderCustomizeTutorial() {
    if (labMode === "normal") {
      refreshStorySave();
    }

    const root = document.getElementById("storyModeRoot");
    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      <h2 style="text-align:center;">${getLabUnitTitle()}
        ${isLiberalLab() ? `<button id="storyUnitNameBtn">名前</button>` : ""}
      </h2>
      ${renderCreateUnitSwitchButtons()}
      ${isLiberalLab() ? renderLiberalGaSelector() : ""}

      <div id="storyCustomizePanel">
        <div id="storyLevelText" class="story-level"></div>
        <div id="storyCostText" class="story-cost"></div>

        <div class="story-row">
          <span id="storyHpText" class="story-label">HP ${customizeState.hp}</span>
          <span id="storyHpCost" class="story-cost-text">[コスト${customizeState.hpCost}]</span>
          <span class="story-buttons"><button id="storyHpInject" class="story-inject">注入</button><button id="storyHpRelease" class="story-release">解除</button></span>
        </div>

        <div class="story-row">
          <span id="storyEvadeText" class="story-label">回避ストック ${customizeState.evade}</span>
          <span id="storyEvadeCost" class="story-cost-text">[コスト${customizeState.evadeCost}]</span>
          <span class="story-buttons"><button id="storyEvadeInject" class="story-inject">注入</button><button id="storyEvadeRelease" class="story-release">解除</button></span>
        </div>

        <div class="story-row">
          <span id="storyEnergyText" class="story-label">エネルギー ${customizeState.energy}</span>
          <span id="storyEnergyCost" class="story-cost-text">[コスト${customizeState.energyCost}]</span>
          <span class="story-buttons"><button id="storyEnergyInject" class="story-inject">注入</button><button id="storyEnergyRelease" class="story-release">解除</button></span>
        </div>

        <hr>
        <div id="storySlotRows"></div>
        <hr>
        <div id="storyOptionalRows"></div>

        <div style="text-align:center;margin-top:16px;">
          <button id="storyReadyBtn" data-ready-mode="locked" disabled>準備完了</button>
        </div>
      </div>

      <style>
        #storyCustomizePanel {
          width: min(720px, 96vw);
          margin: 0 auto;
          line-height: 1.6;
          font-size: 17px;
        }

        #storyCustomizePanel .story-level,
        #storyCustomizePanel .story-cost {
          text-align: center;
          margin-bottom: 8px;
        }

        #storyCustomizePanel .story-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin: 8px 0;
        }

        #storyCustomizePanel .story-label {
          text-align: left;
          white-space: nowrap;
        }

        #storyCustomizePanel .story-cost-text {
          text-align: left;
          white-space: nowrap;
        }

        #storyCustomizePanel .story-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          white-space: nowrap;
        }

        #storyCustomizePanel button {
          min-width: 54px;
        }

        .story-modal {
          position: fixed;
          inset: 0;
          z-index: 21000;
          background: rgba(0,0,0,0.88);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          box-sizing: border-box;
        }

        .story-modal-inner {
          width: min(720px, 96vw);
          max-height: 86vh;
          overflow-y: auto;
          border: 1px solid white;
          border-radius: 10px;
          background: #050505;
          padding: 14px;
          box-sizing: border-box;
        }

        .story-option-row {
          border: 1px solid #777;
          border-radius: 8px;
          padding: 10px;
          margin: 8px 0;
          text-align: left;
        }

        .story-option-row button {
          margin-top: 8px;
        }

        @media (max-width: 520px) {
          #storyCustomizePanel {
            font-size: 16px;
          }

          #storyCustomizePanel .story-row {
            grid-template-columns: 1fr auto auto;
            gap: 4px;
          }

          #storyCustomizePanel button {
            min-width: 44px;
            padding-left: 6px;
            padding-right: 6px;
          }
        }
      </style>

      <div id="storyTutorialTalk" style="
        width:min(780px,96vw);
        margin-top:16px;
        border:1px solid white;
        padding:12px;
        background:rgba(0,0,0,0.9);
      "></div>
      <button id="storyTutorialNextBtn">次へ</button>
    `;

    bindCustomizeButtons();
    renderLabRows();
    renderCustomizeValues();

    if (labMode === "normal") {
      document.getElementById("storyTutorialTalk").textContent =
        "AI「ここが通常のクリエイトガンダムラボです！今後ここから本格的なカスタマイズを行えるようになります！」";

      const nextBtn = document.getElementById("storyTutorialNextBtn");
      if (nextBtn) nextBtn.style.display = "none";

      const readyBtn = document.getElementById("storyReadyBtn");
      if (readyBtn) {
        readyBtn.dataset.readyMode = "normalBack";
        readyBtn.textContent = "戻る";
        readyBtn.onclick = () => {
          if (isCostOver()) return;
          renderStoryMainMenu();
        };
      }

      renderCustomizeValues();
      return;
    }

    startCustomizeGuide();
  }

  function bindCustomizeButtons() {
    bindHoldButton(document.getElementById("storyHpInject"), () => adjustHp(1));
    bindHoldButton(document.getElementById("storyHpRelease"), () => adjustHp(-1));

    bindHoldButton(document.getElementById("storyEvadeInject"), () => adjustEvade(1));
    bindHoldButton(document.getElementById("storyEvadeRelease"), () => adjustEvade(-1));

    bindHoldButton(document.getElementById("storyEnergyInject"), () => adjustEnergy(1));
    bindHoldButton(document.getElementById("storyEnergyRelease"), () => adjustEnergy(-1));
  }

  function renderLabRows() {
    const slotRoot = document.getElementById("storySlotRows");
    const optionalRoot = document.getElementById("storyOptionalRows");

    if (slotRoot) slotRoot.innerHTML = renderSlotRows();
    if (optionalRoot) optionalRoot.innerHTML = renderOptionalRows();

        bindSwapButtons();
    bindDetailButtons();
    bindNameButtons();
    bindLiberalButtons();
    renderCustomizeValues();
  }

    function renderSlotRows() {
    return ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"].map(slotKey => {
      const option = findStorySlotOption(slotKey, customizeState.selectedSlots[slotKey]);
      const label = getCustomDisplayLabel("slot", slotKey, option?.shortLabel || "未設定");

      return `
        <div class="story-slot">
          ${slotKey} ${label} [コスト${option?.cost || 0}]
          <button class="story-detail-btn" data-kind="slot" data-key="${slotKey}">詳細</button>
          <button class="story-swap-btn" data-kind="slot" data-key="${slotKey}">入替</button>
          ${isLiberalLab() ? `<button class="story-name-btn" data-kind="slot" data-key="${slotKey}">名前</button>` : ""}
        </div>
      `;
    }).join("");
    }

    function renderOptionalRows() {
    const equipment1 = findStoryEquipmentOption(customizeState.equipment.equipment1);
    const equipment2 = findStoryEquipmentOption(customizeState.equipment.equipment2);
    const skill = findStorySkillOption(customizeState.skill);
    const companion = findStoryCompanionOption(customizeState.companion || "none");

    return `
      ${renderOptionalRow("equipment", "equipment1", "装備品1", equipment1, "story-equipment")}
      ${renderOptionalRow("equipment", "equipment2", "装備品2", equipment2, "story-equipment")}
      ${renderOptionalRow("skill", "skill", "スキル", skill, "story-skill")}
            ${!isLiberalLab() && storySave.flags?.companionSystemUnlocked === true ? renderOptionalRow("companion", "companion", "同行機体", companion, "story-companion") : ""}
    `;
    }

    function renderOptionalRow(kind, key, prefix, option, cls) {
    const hasDetail = option && option.id !== "none";
    const costText = option?.cost ? `[コスト${option.cost}]` : "";
    const label = getCustomDisplayLabel(kind, key, option?.label || "なし");

    return `
      <div class="${cls}">
        ${prefix} ${label} ${costText}
        ${hasDetail ? `<button class="story-detail-btn" data-kind="${kind}" data-key="${key}">詳細</button>` : ""}
        <button class="story-swap-btn" data-kind="${kind}" data-key="${key}">入替</button>
        ${isLiberalLab() && kind !== "companion" ? `<button class="story-name-btn" data-kind="${kind}" data-key="${key}">名前</button>` : ""}
      </div>
    `;
    }
  
  function bindSwapButtons() {
    document.querySelectorAll(".story-swap-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        openSwapModal(btn.dataset.kind, btn.dataset.key);
      });
    });
  }

  function bindDetailButtons() {
    document.querySelectorAll(".story-detail-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        openDetailModal(btn.dataset.kind, btn.dataset.key);
      });
    });
  }

  function isLiberalLab() {
    return storySave.activeCreateUnitId === "create_gundam_liberal";
  }

  function getLabUnitTitle() {
    if (isLiberalLab()) {
      return storySave.liberal?.customName || "クリエイトガンダムリベラル";
    }

    return PROTO_CREATE_BASE.unitName;
  }

  function getCustomDisplayLabel(kind, key, fallback) {
    if (!isLiberalLab()) return fallback;
    return storySave.liberal?.customLabels?.[kind]?.[key] || fallback;
  }

  function renderCreateUnitSwitchButtons() {
    if (storySave.liberal?.unlocked !== true) return "";

    return `
      <div style="margin-bottom:12px;">
        <button id="storyUseProtoBtn" ${isLiberalLab() ? "" : "disabled"}>プロトクリエイトガンダム</button>
        <button id="storyUseLiberalBtn" ${isLiberalLab() ? "disabled" : ""}>クリエイトガンダムリベラル</button>
      </div>
    `;
  }

  function renderLiberalGaSelector() {
    const gaUnits = storySave.liberal?.gaUnits || {};
    const buttons = [
      `<button class="story-ga-select-btn" data-ga-unit-id="none" ${storySave.liberal?.activeGaUnitId === "none" ? "disabled" : ""}>リベラル基本形態</button>`,
      ...Object.values(gaUnits).map(info => `
        <button class="story-ga-select-btn" data-ga-unit-id="${info.sourceUnitId}" ${storySave.liberal?.activeGaUnitId === info.sourceUnitId ? "disabled" : ""}>
          ${info.displayName}
        </button>
      `)
    ];

    return `
      <div style="margin-bottom:12px;">
        <div>GAデータ</div>
        ${buttons.join("")}
      </div>
    `;
  }

  function bindLiberalButtons() {
    document.getElementById("storyUseProtoBtn")?.addEventListener("click", () => {
      setActiveStoryCreateUnit("proto_create_gundam");
      refreshStorySave();
      renderCustomizeTutorial();
    });

    document.getElementById("storyUseLiberalBtn")?.addEventListener("click", () => {
      setActiveStoryCreateUnit("create_gundam_liberal");
      refreshStorySave();
      renderCustomizeTutorial();
    });

    document.getElementById("storyUnitNameBtn")?.addEventListener("click", () => {
      openNameModal("unit", "unitName", getLabUnitTitle());
    });

    document.querySelectorAll(".story-ga-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        setLiberalGaUnit(btn.dataset.gaUnitId || "none");
        refreshStorySave();
        renderCustomizeTutorial();
      });
    });
  }

  function bindNameButtons() {
    document.querySelectorAll(".story-name-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.kind;
        const key = btn.dataset.key;
        const option = getCurrentOption(kind, key);
        openNameModal(kind, key, getCustomDisplayLabel(kind, key, option?.label || option?.shortLabel || ""));
      });
    });
  }

  function openNameModal(kind, key, currentLabel) {
    if (!isLiberalLab()) return;

    const modal = document.createElement("div");
    modal.className = "story-modal";
    modal.innerHTML = `
      <h3>名前変更</h3>
      <input id="storyNameInput" value="${String(currentLabel || "").replace(/"/g, "&quot;")}" maxlength="30">
      <button id="storyNameSaveBtn">保存</button>
      <button id="storyNameResetBtn">初期名に戻す</button>
      <button id="storyNameCloseBtn">閉じる</button>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#storyNameSaveBtn")?.addEventListener("click", () => {
      const value = modal.querySelector("#storyNameInput")?.value || "";

      if (kind === "unit") {
        setLiberalCustomName(value);
      } else {
        setLiberalCustomLabel(kind, key, value);
      }

      modal.remove();
      refreshStorySave();
      renderCustomizeTutorial();
    });

    modal.querySelector("#storyNameResetBtn")?.addEventListener("click", () => {
      if (kind === "unit") {
        setLiberalCustomName("クリエイトガンダムリベラル");
      } else {
        setLiberalCustomLabel(kind, key, "");
      }

      modal.remove();
      refreshStorySave();
      renderCustomizeTutorial();
    });

    modal.querySelector("#storyNameCloseBtn")?.addEventListener("click", () => {
      modal.remove();
    });
  }
  
    function getCurrentOption(kind, key) {
    if (kind === "slot") return findStorySlotOption(key, customizeState.selectedSlots[key]);
    if (kind === "equipment") return findStoryEquipmentOption(customizeState.equipment[key]);
    if (kind === "skill") return findStorySkillOption(customizeState.skill);
    if (kind === "companion") return findStoryCompanionOption(customizeState.companion || "none");
    return null;
    }
  
  function getOptionsFor(kind, key) {
    if (labMode === "chapter1") {
      if (kind === "slot") return (STORY_SLOT_OPTIONS[key] || []).slice(0, 2);
      if (kind === "equipment") return STORY_EQUIPMENT_OPTIONS.slice(0, 2);
      if (kind === "skill") return STORY_SKILL_OPTIONS.slice(0, 2);
    }

    const ownedSlots = storySave.inventory?.slots || [];
const ownedEquipments = storySave.inventory?.equipments || [];
const ownedSkills = storySave.inventory?.skills || [];

if (kind === "slot") {
  return [
    ...(STORY_SLOT_OPTIONS[key] || []),
    ...getStoryDropSlotOptions(key).filter(option => ownedSlots.includes(option.id))
  ];
}

if (kind === "equipment") {
  return [
    ...STORY_EQUIPMENT_OPTIONS,
    ...getStoryDropEquipmentOptions().filter(option => ownedEquipments.includes(option.id))
  ];
}

if (kind === "skill") {
  return [
    ...STORY_SKILL_OPTIONS,
    ...getStoryDropSkillOptions().filter(option => ownedSkills.includes(option.id))
  ];
}

    if (kind === "companion") {
      return STORY_COMPANION_OPTIONS.filter(option => {
        if (option.id === "none") return true;
        return storySave.companionUnits?.[option.id]?.unlocked === true;
      });
    }

    return [];
  }

  function setOption(kind, key, optionId) {
    const allowed = getOptionsFor(kind, key).some(option => option.id === optionId);
    if (!allowed) return;

     if (kind === "slot") customizeState.selectedSlots[key] = optionId;
    if (kind === "equipment") customizeState.equipment[key] = optionId;
    if (kind === "skill") customizeState.skill = optionId;
    if (kind === "companion") customizeState.companion = optionId;

    persistCustomizeState();
    renderLabRows();
  }

  function openSwapModal(kind, key) {
    const options = getOptionsFor(kind, key);
    const current = getCurrentOption(kind, key);

    const modal = document.createElement("div");
    modal.className = "story-modal";

    modal.innerHTML = `
      <div class="story-modal-inner">
        <h3>入替</h3>
        ${options.map(option => `
          <div class="story-option-row">
            <div><b>${option.label}</b> [コスト${option.cost || 0}]</div>
            ${option.detail ? `<div style="font-size:14px;margin-top:4px;">${option.detail}</div>` : ""}
            <button class="story-select-option-btn" data-option-id="${option.id}" ${current?.id === option.id ? "disabled" : ""}>
              ${current?.id === option.id ? "装備中" : "これにする"}
            </button>
          </div>
        `).join("")}
        <div style="text-align:center;margin-top:12px;">
          <button id="storySwapCloseBtn">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll(".story-select-option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        setOption(kind, key, btn.dataset.optionId);
        modal.remove();
      });
    });

    modal.querySelector("#storySwapCloseBtn").addEventListener("click", () => {
      modal.remove();
    });
  }

  function openDetailModal(kind, key) {
    const option = getCurrentOption(kind, key);
    if (!option) return;

    const modal = document.createElement("div");
    modal.className = "story-modal";

    modal.innerHTML = `
      <div class="story-modal-inner">
        <h3>${option.label}</h3>
        <p>${option.detail || "詳細なし"}</p>
        <div>コスト：${option.cost || 0}</div>
        <div style="text-align:center;margin-top:12px;">
          <button id="storyDetailCloseBtn">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#storyDetailCloseBtn").addEventListener("click", () => {
      modal.remove();
    });
  }

  function startCustomizeGuide() {
    const steps = [
      { text: "AI「カスタマイズ画面です！すいませんこんな弱くて…！」" },
      { text: "AI「でも大丈夫です！そのためのカスタマイズですから！説明していきますね。」" },
      { selector: ".story-level", text: "AI「ここがレベルです！今は0ですが、経験を積むとレベルが上がります！レベルが上がると、コストや様々な能力が上がります！プレイあるのみです！」" },
      { selector: ".story-cost", text: "AI「ここがコストです！今は100までしかありませんが、レベルが上がれば増えますよ！どうやらまだ40ポイント余っているようですね！この後振り分けしてみましょうか！」" },
      { selector: ".story-inject", text: "AI「このボタンでコストを注入出来ます！項目しだいで1注入コストは変わりますが、詳しくはかったるいので説明しません！色々触ってみてくださいね！」" },
      { selector: ".story-release", text: "AI「このボタンでコストを抜き取れます！一気には抜けないです！大変なんですよ抜くの！ボタンを押すと私がコスト無料で抜いてあげるんですからそれで勘弁してください！」" },
      { selector: ".story-swap", text: "AI「このボタンでその項目の装備を入れ替えられます！対応した入れ替え先のものを所持していれば入れ替えられます！」" },
      { selector: ".story-slot", text: "AI「スロットで選ばれるアクションです！戦闘の基本となるので、ここの噛み合わせが悪かったりすると弱くなりがちです！」" },
      { selector: ".story-equipment", text: "AI「この機体に後付けする装備品です！今はシールドしか持ってませんが、ここに装備したものはスロット行動に関係なく特殊行動で効果を発揮できます！とりあえずあとでシールドをつけてみましょう！」" },
      { selector: ".story-skill", text: "AI「あなたが持っている特殊技能です！おお！？どうやら何か持っているようですね…？これもコストがかかりますが、セットしたればセットしてください！」" },
      { text: "AI「さぁ早速カスタマイズしてみましょう！色々いじってみてください！」", finish: true }
    ];

    let stepIndex = 0;
    let lastSelector = null;

    function showStep() {
      if (lastSelector) setHighlight(lastSelector, false);

      const step = steps[stepIndex];
      if (!step) return;

      lastSelector = step.selector || null;
      if (lastSelector) setHighlight(lastSelector, true);

      document.getElementById("storyTutorialTalk").textContent = step.text;

      if (step.finish) {
        document.getElementById("storyTutorialNextBtn").style.display = "none";

        const readyBtn = document.getElementById("storyReadyBtn");
        readyBtn.dataset.readyMode = "chapter1Ready";
        readyBtn.onclick = () => {
          if (isCostOver()) return;
          applyChapter1Override();
          chapter1Controller.startAfterCustomize();
        };

        renderCustomizeValues();
      }
    }

    document.getElementById("storyTutorialNextBtn").addEventListener("click", () => {
      stepIndex += 1;
      showStep();
    });

    showStep();
  }

  return {
    start,
    updateStartButtonVisibility
  };
}
