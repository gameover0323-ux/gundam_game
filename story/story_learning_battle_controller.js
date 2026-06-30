import { getStoryCreateUnit } from "./story_units.js";
import { loadStorySave } from "./story_save.js";

import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";

const STORY_UNIT_MAP = {
  proto_create_gundam: null,
  story_zaku_ii_gene,
  story_zaku_ii_denim
};

export function createStoryLearningBattleController(ctx) {
  let learningMode = "single";
  let selectingSide = "A";
  let pendingUnit = null;
  let selectedA = [];
  let selectedB = [];

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function getUnitById(unitId) {
    if (unitId === "proto_create_gundam") return getStoryCreateUnit("proto_create_gundam");
    return STORY_UNIT_MAP[unitId] || null;
  }

  function buildAvailablePlayerUnits() {
    const save = loadStorySave();
    const units = [getStoryCreateUnit("proto_create_gundam")];

    Object.entries(save.companionUnits || {}).forEach(([unitId, info]) => {
      if (info?.unlocked !== true) return;
      const unit = getUnitById(unitId);
      if (unit && !units.some(existing => existing.id === unit.id)) {
        units.push(unit);
      }
    });

    return units;
  }

  function buildAvailableEnemyUnits() {
    const save = loadStorySave();
    if (save.flags?.chapter2Cleared !== true) return [];

    return [
      story_zaku_ii_gene,
      story_zaku_ii_denim
    ];
  }

  function getCurrentList() {
    return selectingSide === "A"
      ? buildAvailablePlayerUnits()
      : buildAvailableEnemyUnits();
  }

  function getRequiredCount() {
    return learningMode === "companion" ? 2 : 1;
  }

  function getCurrentSelectedList() {
    return selectingSide === "A" ? selectedA : selectedB;
  }

  function setCurrentSelectedList(list) {
    if (selectingSide === "A") {
      selectedA = list;
    } else {
      selectedB = list;
    }
  }

  function getSideLabel(side = selectingSide) {
    if (side === "A") return learningMode === "companion" ? "PLAYER A チーム" : "PLAYER A";
    return learningMode === "companion" ? "CPUチーム" : "CPU";
  }

  function renderLearningMenu() {
    const root = getRoot();
    if (!root) return;

    root.style.justifyContent = "center";
    root.style.overflowY = "auto";

    root.innerHTML = `
      <h2>学習戦闘</h2>
      <button id="storySingleLearningBtn">単体学習</button>
      <button id="storyCompanionLearningBtn">同行学習</button>
      <button id="storyLearningBackBtn">戻る</button>
    `;

    document.getElementById("storySingleLearningBtn")?.addEventListener("click", renderSingleLearningSelect);
    document.getElementById("storyCompanionLearningBtn")?.addEventListener("click", renderCompanionLearningSelect);
    document.getElementById("storyLearningBackBtn")?.addEventListener("click", () => ctx.renderStoryMainMenu?.());
  }

  function renderSingleLearningSelect() {
    learningMode = "single";
    selectingSide = "A";
    pendingUnit = null;
    selectedA = [];
    selectedB = [];
    renderLearningSelect();
  }

  function renderCompanionLearningSelect() {
    learningMode = "companion";
    selectingSide = "A";
    pendingUnit = null;
    selectedA = [];
    selectedB = [];
    renderLearningSelect();
  }

  function renderLearningSelect() {
    const root = getRoot();
    if (!root) return;

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    const currentList = getCurrentList();
    const requiredCount = getRequiredCount();
    const selectedList = getCurrentSelectedList();
    const canConfirm = !!pendingUnit;
    const canStart = selectedA.length >= requiredCount && selectedB.length >= requiredCount;

    root.innerHTML = `
      <h2>${learningMode === "companion" ? "同行学習" : "単体学習"}</h2>

      <div id="storyLearningSelectPanel" style="width:min(760px,96vw); margin:0 auto;">
        <div id="storyLearningGuide" style="margin-bottom:10px; text-align:center;">
          ${getSideLabel()} の機体を${requiredCount}機選択
        </div>

        <div id="storyLearningPreview" style="
          white-space:pre-line;
          border:1px solid #777;
          border-radius:8px;
          padding:10px;
          margin-bottom:12px;
          background:#111;
        ">${buildPreviewText()}</div>

        <div id="storyLearningButtons" style="display:flex; flex-direction:column; gap:10px;">
          ${renderUnitSection(selectingSide === "A" ? "プレイヤー側候補" : "CPU側候補", currentList)}
          ${selectingSide === "A" ? renderLockedLiberalButton() : ""}
        </div>

        <div id="storyLearningDescription" style="
          display:${pendingUnit ? "" : "none"};
          white-space:pre-line;
          border:1px solid #777;
          border-radius:8px;
          padding:10px;
          margin-top:12px;
          background:#111;
        ">${pendingUnit ? pendingUnit.name : ""}</div>

        <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:14px;">
          <button id="storyLearningConfirmBtn" ${canConfirm ? "" : "disabled"}>
            ${pendingUnit ? `${pendingUnit.name} に決定` : "決定"}
          </button>
          ${selectingSide === "B" && canStart ? `<button id="storyLearningStartBtn">この編成で開始</button>` : ""}
          <button id="storyLearningCancelBtn">戻る</button>
        </div>
      </div>
    `;

    bindUnitButtons();

    document.getElementById("storyLearningConfirmBtn")?.addEventListener("click", confirmPendingUnit);

    document.getElementById("storyLearningStartBtn")?.addEventListener("click", () => {
      if (learningMode === "companion") {
        startCompanionLearning();
      } else {
        startSingleLearning();
      }
    });

    document.getElementById("storyLearningCancelBtn")?.addEventListener("click", () => {
      if (selectingSide === "B") {
        selectingSide = "A";
        pendingUnit = null;
        renderLearningSelect();
        return;
      }

      renderLearningMenu();
    });
  }

  function renderUnitSection(title, units) {
    if (!units.length) {
      return `
        <div class="story-learning-section">
          <div class="selectSectionTitle">${title}</div>
          <div>選択可能な機体がありません</div>
        </div>
      `;
    }

    return `
      <div class="story-learning-section">
        <div class="selectSectionTitle" style="margin-bottom:6px;">${title}</div>
        <div class="selectSectionButtons" style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center;">
          ${units.map(unit => `
            <button class="story-learning-unit-btn" data-unit-id="${unit.id}">
              ${unit.name}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderLockedLiberalButton() {
    return `
      <div class="story-learning-section">
        <div class="selectSectionTitle" style="margin-bottom:6px;">未実装</div>
        <div class="selectSectionButtons" style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center;">
          <button disabled>？？？ クリエイトガンダムリベラル</button>
        </div>
      </div>
    `;
  }

  function bindUnitButtons() {
    document.querySelectorAll(".story-learning-unit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const unit = getUnitById(btn.dataset.unitId);
        if (!unit) return;
        pendingUnit = unit;
        renderLearningSelect();
      });
    });
  }

  function buildPreviewText() {
    const requiredCount = getRequiredCount();

    const aText = selectedA.length
      ? `${getSideLabel("A")}: ${selectedA.map(unit => unit.name).join(" / ")}`
      : `${getSideLabel("A")}: 未選択`;

    const bText = selectedB.length
      ? `${getSideLabel("B")}: ${selectedB.map(unit => unit.name).join(" / ")}`
      : `${getSideLabel("B")}: 未選択`;

    const pendingText = pendingUnit ? `\n選択中: ${pendingUnit.name}` : "";
    const progressText = `\n現在: ${getSideLabel()} ${getCurrentSelectedList().length}/${requiredCount}`;

    return `${aText}\n${bText}${pendingText}${progressText}`;
  }

  function confirmPendingUnit() {
    if (!pendingUnit) return;

    const requiredCount = getRequiredCount();
    const current = getCurrentSelectedList().slice();

    if (current.length >= requiredCount) return;

    current.push(pendingUnit);
    setCurrentSelectedList(current);
    pendingUnit = null;

    if (current.length >= requiredCount) {
      if (selectingSide === "A") {
        selectingSide = "B";
      }
    }

    renderLearningSelect();
  }

  function startSingleLearning() {
    const ally = selectedA[0];
    const enemy = selectedB[0];

    if (!ally || !enemy) {
      ctx.showPopup?.("単体学習に必要な機体が選択されていません");
      return;
    }

    ctx.startStoryFreeBattle?.({
      mode: "1v1",
      allowModeSwitch: false,
      exitLabel: "単体学習を中断",
      allyUnits: [ally],
      enemyUnits: [enemy],
      onWin: () => ctx.renderStoryMainMenu?.(),
      onLose: () => ctx.renderStoryMainMenu?.(),
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startCompanionLearning() {
    if (selectedA.length < 2 || selectedB.length < 2) {
      ctx.showPopup?.("同行学習に必要な機体が選択されていません");
      return;
    }

    ctx.startStoryFreeBattle?.({
      mode: "2v2",
      allowModeSwitch: false,
      exitLabel: "同行学習を中断",
      allyUnits: selectedA.slice(0, 2),
      enemyUnits: selectedB.slice(0, 2),
      onWin: () => ctx.renderStoryMainMenu?.(),
      onLose: () => ctx.renderStoryMainMenu?.(),
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  return {
    renderLearningMenu,
    renderSingleLearningSelect,
    renderCompanionLearningSelect,
    buildAvailablePlayerUnits,
    buildAvailableEnemyUnits,
    startSingleLearning,
    startCompanionLearning
  };
}
