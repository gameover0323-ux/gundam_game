import { getStoryCreateUnit } from "./story_units.js";
import { loadStorySave } from "./story_save.js";

import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";

const STORY_COMPANION_UNIT_MAP = {
  story_zaku_ii_gene
};

const STORY_CPU_UNIT_MAP = {
  story_zaku_ii_gene,
  story_zaku_ii_denim
};

export function createStoryLearningBattleController(ctx) {
  let selectedSinglePlayerUnitId = "proto_create_gundam";
  let selectedSingleEnemyUnitId = "story_zaku_ii_gene";

  let selectedCompanionAlly1Id = "proto_create_gundam";
  let selectedCompanionAlly2Id = "story_zaku_ii_gene";
  let selectedCompanionEnemy1Id = "story_zaku_ii_gene";
  let selectedCompanionEnemy2Id = "story_zaku_ii_denim";

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function renderBackButtonHtml() {
    return `<button id="storyLearningBackBtn">戻る</button>`;
  }

  function bindBackToMenu() {
    document.getElementById("storyLearningBackBtn")?.addEventListener("click", () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  function buildUnitButton(unit, selectedId, buttonClass, disabled = false) {
    const selected = unit.id === selectedId;
    return `
      <button
        class="${buttonClass}"
        data-unit-id="${unit.id}"
        ${selected || disabled ? "disabled" : ""}
      >
        ${disabled ? "？？？" : unit.name}${selected ? "【選択中】" : ""}
      </button>
    `;
  }

  function buildAvailablePlayerUnits() {
    const save = loadStorySave();
    const units = [
      getStoryCreateUnit("proto_create_gundam")
    ];

    Object.entries(save.companionUnits || {}).forEach(([unitId, info]) => {
      if (info?.unlocked !== true) return;
      const unit = STORY_COMPANION_UNIT_MAP[unitId];
      if (unit) units.push(unit);
    });

    return units;
  }

  function buildAvailableEnemyUnits() {
    const save = loadStorySave();

    if (save.flags?.chapter2Cleared !== true) {
      return [];
    }

    return [
      story_zaku_ii_gene,
      story_zaku_ii_denim
    ];
  }

  function getUnitById(unitId, list) {
    return list.find(unit => unit.id === unitId) || list[0] || null;
  }

  function renderLearningMenu() {
    const root = getRoot();
    if (!root) return;

    root.innerHTML = `
      <h2>学習戦闘</h2>
      <button id="storySingleLearningBtn">単体学習</button>
      <button id="storyCompanionLearningBtn">同行学習</button>
      ${renderBackButtonHtml()}
    `;

    document.getElementById("storySingleLearningBtn")?.addEventListener("click", renderSingleLearningSelect);
    document.getElementById("storyCompanionLearningBtn")?.addEventListener("click", renderCompanionLearningSelect);
    bindBackToMenu();
  }

  function renderSingleLearningSelect() {
    const root = getRoot();
    if (!root) return;

    const playerUnits = buildAvailablePlayerUnits();
    const enemyUnits = buildAvailableEnemyUnits();

    if (!playerUnits.some(unit => unit.id === selectedSinglePlayerUnitId)) {
      selectedSinglePlayerUnitId = playerUnits[0]?.id || "proto_create_gundam";
    }

    if (!enemyUnits.some(unit => unit.id === selectedSingleEnemyUnitId)) {
      selectedSingleEnemyUnitId = enemyUnits[0]?.id || "";
    }

    root.innerHTML = `
      <h2>単体学習</h2>

      <h3>プレイヤー機体</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${playerUnits.map(unit =>
          buildUnitButton(unit, selectedSinglePlayerUnitId, "story-single-player-unit-btn")
        ).join("")}
        <button disabled>？？？ クリエイトガンダムリベラル</button>
      </div>

      <h3>CPU機体</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${enemyUnits.map(unit =>
          buildUnitButton(unit, selectedSingleEnemyUnitId, "story-single-enemy-unit-btn")
        ).join("")}
      </div>

      <div style="margin-top:16px; display:flex; gap:8px;">
        <button id="storySingleLearningStartBtn">開始</button>
        <button id="storySingleLearningBackBtn">戻る</button>
      </div>
    `;

    document.querySelectorAll(".story-single-player-unit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSinglePlayerUnitId = btn.dataset.unitId;
        renderSingleLearningSelect();
      });
    });

    document.querySelectorAll(".story-single-enemy-unit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSingleEnemyUnitId = btn.dataset.unitId;
        renderSingleLearningSelect();
      });
    });

    document.getElementById("storySingleLearningStartBtn")?.addEventListener("click", startSingleLearning);
    document.getElementById("storySingleLearningBackBtn")?.addEventListener("click", renderLearningMenu);
  }

  function renderCompanionLearningSelect() {
    const root = getRoot();
    if (!root) return;

    const playerUnits = buildAvailablePlayerUnits();
    const enemyUnits = buildAvailableEnemyUnits();

    if (!playerUnits.some(unit => unit.id === selectedCompanionAlly1Id)) {
      selectedCompanionAlly1Id = playerUnits[0]?.id || "proto_create_gundam";
    }

    if (!playerUnits.some(unit => unit.id === selectedCompanionAlly2Id)) {
      selectedCompanionAlly2Id = playerUnits[1]?.id || playerUnits[0]?.id || "proto_create_gundam";
    }

    if (!enemyUnits.some(unit => unit.id === selectedCompanionEnemy1Id)) {
      selectedCompanionEnemy1Id = enemyUnits[0]?.id || "";
    }

    if (!enemyUnits.some(unit => unit.id === selectedCompanionEnemy2Id)) {
      selectedCompanionEnemy2Id = enemyUnits[1]?.id || enemyUnits[0]?.id || "";
    }

    root.innerHTML = `
      <h2>同行学習</h2>

      <h3>味方1</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${playerUnits.map(unit =>
          buildUnitButton(unit, selectedCompanionAlly1Id, "story-companion-ally1-btn")
        ).join("")}
        <button disabled>？？？ クリエイトガンダムリベラル</button>
      </div>

      <h3>味方2</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${playerUnits.map(unit =>
          buildUnitButton(unit, selectedCompanionAlly2Id, "story-companion-ally2-btn")
        ).join("")}
        <button disabled>？？？ クリエイトガンダムリベラル</button>
      </div>

      <h3>CPU1</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${enemyUnits.map(unit =>
          buildUnitButton(unit, selectedCompanionEnemy1Id, "story-companion-enemy1-btn")
        ).join("")}
      </div>

      <h3>CPU2</h3>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${enemyUnits.map(unit =>
          buildUnitButton(unit, selectedCompanionEnemy2Id, "story-companion-enemy2-btn")
        ).join("")}
      </div>

      <div style="margin-top:16px; display:flex; gap:8px;">
        <button id="storyCompanionLearningStartBtn">開始</button>
        <button id="storyCompanionLearningBackBtn">戻る</button>
      </div>
    `;

    document.querySelectorAll(".story-companion-ally1-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCompanionAlly1Id = btn.dataset.unitId;
        renderCompanionLearningSelect();
      });
    });

    document.querySelectorAll(".story-companion-ally2-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCompanionAlly2Id = btn.dataset.unitId;
        renderCompanionLearningSelect();
      });
    });

    document.querySelectorAll(".story-companion-enemy1-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCompanionEnemy1Id = btn.dataset.unitId;
        renderCompanionLearningSelect();
      });
    });

    document.querySelectorAll(".story-companion-enemy2-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedCompanionEnemy2Id = btn.dataset.unitId;
        renderCompanionLearningSelect();
      });
    });

    document.getElementById("storyCompanionLearningStartBtn")?.addEventListener("click", startCompanionLearning);
    document.getElementById("storyCompanionLearningBackBtn")?.addEventListener("click", renderLearningMenu);
  }

  function startSingleLearning() {
    const playerUnits = buildAvailablePlayerUnits();
    const enemyUnits = buildAvailableEnemyUnits();

    const playerUnit = getUnitById(selectedSinglePlayerUnitId, playerUnits);
    const enemyUnit = getUnitById(selectedSingleEnemyUnitId, enemyUnits);

    if (!playerUnit || !enemyUnit) {
      ctx.showPopup?.("学習戦闘に必要な機体がありません");
      return;
    }

    ctx.startStoryFreeBattle?.({
      mode: "1v1",
      allowModeSwitch: false,
      exitLabel: "学習戦闘を中断",
      allyUnits: [playerUnit],
      enemyUnits: [enemyUnit],
      onWin: () => ctx.renderStoryMainMenu?.(),
      onLose: () => ctx.renderStoryMainMenu?.(),
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startCompanionLearning() {
    const playerUnits = buildAvailablePlayerUnits();
    const enemyUnits = buildAvailableEnemyUnits();

    const ally1 = getUnitById(selectedCompanionAlly1Id, playerUnits);
    const ally2 = getUnitById(selectedCompanionAlly2Id, playerUnits);
    const enemy1 = getUnitById(selectedCompanionEnemy1Id, enemyUnits);
    const enemy2 = getUnitById(selectedCompanionEnemy2Id, enemyUnits);

    if (!ally1 || !ally2 || !enemy1 || !enemy2) {
      ctx.showPopup?.("同行学習に必要な機体がありません");
      return;
    }

    ctx.startStoryFreeBattle?.({
      mode: "2v2",
      allowModeSwitch: false,
      exitLabel: "同行学習を中断",
      allyUnits: [ally1, ally2],
      enemyUnits: [enemy1, enemy2],
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
