import { getStoryCreateUnit } from "./story_units.js";
import {
  loadStorySave,
  getStoryUnitLevelInfo,
  getStoryLevelBattleBonus
} from "./story_save.js";
import { createStoryResultController } from "./story_result_controller.js";

import { gundam_mc } from "../js/js_units_gundam_mc.js";
import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";
import { story_ball } from "../js/js_units_story_ball.js";
import { story_gm } from "../js/js_units_story_gm.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCpuGundamUnit() {
  const unit = clone(gundam_mc);

  unit.id = "cpu_gundam_mc";
  unit.name = "ガンダム";
  unit.exp = 30;

  Object.values(unit.forms || {}).forEach(form => {
    form.name = "ガンダム";
  });

  return unit;
}

const cpu_gundam_mc = createCpuGundamUnit();

const STORY_UNIT_MAP = {
  proto_create_gundam: null,
  cpu_gundam_mc,
  story_zaku_ii_gene,
  story_zaku_ii_denim,
  story_ball,
  story_gm
};

export function createStoryLearningBattleController(ctx) {
  const resultController = createStoryResultController(ctx);

  let learningMode = "single";
  let selectingSide = "A";
  let pendingUnit = null;
  let selectedA = [];
  let selectedB = [];

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function cloneUnit(unit) {
    return JSON.parse(JSON.stringify(unit));
  }

  function decorateStoryBattleUnit(unit) {
    const cloned = cloneUnit(unit);
    const bonus = getStoryLevelBattleBonus(cloned.id);

    cloned.storyLevel = bonus.level;
    cloned.storyCriticalBonusRate = bonus.criticalRateBonus;
    cloned.storyDamageReductionRate = bonus.damageReductionRate;

    return cloned;
  }

  function getUnitById(unitId) {
    if (unitId === "proto_create_gundam") return getStoryCreateUnit("proto_create_gundam");
    return STORY_UNIT_MAP[unitId] || null;
  }

  function getUnitLabel(unit) {
    if (!unit) return "";
    const info = getStoryUnitLevelInfo(unit.id);
    return `${unit.name} Lv${info.level}`;
  }

  function canUseLiberal(save = loadStorySave()) {
    return save.flags?.createGundamLiberalUnlocked === true;
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

    const units = [
      story_zaku_ii_gene,
      story_zaku_ii_denim,
      story_ball,
      story_gm
    ];

    if (save.flags?.chapterBossGundamCleared === true) {
      units.push(cpu_gundam_mc);
    }

    return units;
  }

  function getCurrentList() {
    return selectingSide === "A" ? buildAvailablePlayerUnits() : buildAvailableEnemyUnits();
  }

  function getRequiredCount() {
    return learningMode === "companion" ? 2 : 1;
  }

  function getCurrentSelectedList() {
    return selectingSide === "A" ? selectedA : selectedB;
  }

  function setCurrentSelectedList(list) {
    if (selectingSide === "A") selectedA = list;
    else selectedB = list;
  }

  function getSideLabel(side = selectingSide) {
    if (side === "A") return learningMode === "companion" ? "PLAYER A チーム" : "PLAYER A";
    return learningMode === "companion" ? "CPUチーム" : "CPU";
  }

  function renderLearningMenu() {
    const root = getRoot();
    if (!root) return;

    const save = loadStorySave();
    const gaUnlocked = save.flags?.gaBattleUnlocked === true;

    root.style.justifyContent = "center";
    root.style.overflowY = "auto";

    root.innerHTML = `
      <h2>学習戦闘</h2>
      <button id="storySingleLearningBtn">単体学習</button>
      <button id="storyCompanionLearningBtn">同行学習</button>
      ${gaUnlocked ? `<button id="storyGaBattleBtn">GA戦闘</button>` : ""}
      <button id="storyLearningBackBtn">戻る</button>
    `;

    document.getElementById("storySingleLearningBtn")?.addEventListener("click", renderSingleLearningSelect);
    document.getElementById("storyCompanionLearningBtn")?.addEventListener("click", renderCompanionLearningSelect);
    document.getElementById("storyGaBattleBtn")?.addEventListener("click", renderGaBattleSelect);
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

  function renderGaBattleSelect() {
    learningMode = "ga";
    selectingSide = "B";
    pendingUnit = null;
    selectedA = [getStoryCreateUnit("proto_create_gundam")];
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
    const canStart = selectedA.length >= requiredCount && selectedB.length >= requiredCount;

    root.innerHTML = `
      <h2>${getLearningTitle()}</h2>

      <div style="white-space:pre-wrap;line-height:1.6;margin-bottom:12px;">
${getSideLabel()} の機体を${requiredCount}機選択

${buildPreviewText()}
      </div>

      ${renderUnitSection(selectingSide === "A" ? "プレイヤー側候補" : "CPU側候補", currentList)}
      ${selectingSide === "A" ? renderLiberalButton() : ""}

      <div style="margin:12px 0;">
        ${pendingUnit ? getPendingLabel() : ""}
      </div>

      <button id="storyLearningConfirmBtn" ${pendingUnit ? "" : "disabled"}>
        ${pendingUnit ? `${getPendingLabel()} に決定` : "決定"}
      </button>

      ${selectingSide === "B" && canStart ? `<button id="storyLearningStartBtn">この編成で開始</button>` : ""}
      <button id="storyLearningCancelBtn">戻る</button>
    `;

    bindUnitButtons();

    document.getElementById("storyLearningConfirmBtn")?.addEventListener("click", confirmPendingUnit);

    document.getElementById("storyLearningStartBtn")?.addEventListener("click", () => {
      if (learningMode === "companion") {
        startCompanionLearning();
        return;
      }

      if (learningMode === "ga") {
        startGaBattle();
        return;
      }

      startSingleLearning();
    });

    document.getElementById("storyLearningCancelBtn")?.addEventListener("click", () => {
      if (learningMode === "ga") {
        renderLearningMenu();
        return;
      }

      if (selectingSide === "B") {
        selectingSide = "A";
        pendingUnit = null;
        renderLearningSelect();
        return;
      }

      renderLearningMenu();
    });
  }

  function getLearningTitle() {
    if (learningMode === "companion") return "同行学習";
    if (learningMode === "ga") return "GA戦闘";
    return "単体学習";
  }

  function getPendingLabel() {
    if (!pendingUnit) return "";
    return selectingSide === "A" ? getUnitLabel(pendingUnit) : pendingUnit.name;
  }

  function renderUnitSection(title, units) {
    if (!units.length) {
      return `
        <div>
          <h3>${title}</h3>
          <p>選択可能な機体がありません</p>
        </div>
      `;
    }

    return `
      <div>
        <h3>${title}</h3>
        ${units.map(unit => `
          <button class="story-learning-unit-btn" data-unit-id="${unit.id}">
            ${selectingSide === "A" ? getUnitLabel(unit) : unit.name}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderLiberalButton() {
    const save = loadStorySave();

    if (!canUseLiberal(save)) {
      return `
        <div style="margin-top:12px;">
          <div>未解禁</div>
          <button disabled>？？？ クリエイトガンダムリベラル</button>
        </div>
      `;
    }

    return `
      <div style="margin-top:12px;">
        <div>解禁済</div>
        <button disabled>クリエイトガンダムリベラル</button>
        <div style="font-size:12px;opacity:0.8;">
          クリエイトガンダムリベラルの本体切替・名称変更・GA変化はラボ側実装で使用します。
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
      ? `${getSideLabel("A")}: ${selectedA.map(getUnitLabel).join(" / ")}`
      : `${getSideLabel("A")}: 未選択`;

    const bText = selectedB.length
      ? `${getSideLabel("B")}: ${selectedB.map(unit => unit.name).join(" / ")}`
      : `${getSideLabel("B")}: 未選択`;

    const pendingText = pendingUnit
      ? `\n選択中: ${getPendingLabel()}`
      : "";

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

    if (current.length >= requiredCount && selectingSide === "A") {
      selectingSide = "B";
    }

    renderLearningSelect();
  }

  function renderLearningResult(winnerPlayer, playerUnits, enemyUnits) {
    resultController.renderResult({
      winnerPlayer,
      playerUnits,
      enemyUnits,
      learningMode,
      onDone: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startSingleLearning() {
    const ally = selectedA[0];
    const enemy = selectedB[0];

    if (!ally || !enemy) {
      ctx.showPopup?.("単体学習に必要な機体が選択されていません");
      return;
    }

    const save = loadStorySave();
    const companionId = save.createUnits?.proto_create_gundam?.lab?.companion || "none";
    const companionUnit =
      ally.id === "proto_create_gundam" &&
      companionId !== "none" &&
      save.companionUnits?.[companionId]?.unlocked === true
        ? getUnitById(companionId)
        : null;

    const playerUnits = companionUnit ? [ally, companionUnit] : [ally];
    const battlePlayerUnits = playerUnits.map(decorateStoryBattleUnit);
    const battleEnemyUnits = [enemy];

    ctx.startStoryFreeBattle?.({
      mode: companionUnit ? "2v2" : "1v1",
      allowModeSwitch: false,
      exitLabel: "単体学習を中断",
      allyUnits: battlePlayerUnits,
      enemyUnits: battleEnemyUnits,
      onWin: winner => renderLearningResult(winner, playerUnits, battleEnemyUnits),
      onLose: winner => renderLearningResult(winner, playerUnits, battleEnemyUnits),
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startCompanionLearning() {
    if (selectedA.length < 2 || selectedB.length < 2) {
      ctx.showPopup?.("同行学習に必要な機体が選択されていません");
      return;
    }

    const playerUnits = selectedA.slice(0, 2);
    const enemyUnits = selectedB.slice(0, 2);

    ctx.startStoryFreeBattle?.({
      mode: "2v2",
      allowModeSwitch: false,
      exitLabel: "同行学習を中断",
      allyUnits: playerUnits.map(decorateStoryBattleUnit),
      enemyUnits,
      onWin: winner => renderLearningResult(winner, playerUnits, enemyUnits),
      onLose: winner => renderLearningResult(winner, playerUnits, enemyUnits),
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startGaBattle() {
    const enemy = selectedB[0];

    if (!enemy) {
      ctx.showPopup?.("GA戦闘に必要な相手機体が選択されていません");
      return;
    }

    const playerUnit = getStoryCreateUnit("proto_create_gundam");
    const battlePlayerUnit = decorateStoryBattleUnit(playerUnit);
    const battleEnemyUnits = [enemy];

    ctx.startStoryFreeBattle?.({
      mode: "1v1",
      allowModeSwitch: false,
      exitLabel: "GA戦闘を中断",
      allyUnits: [battlePlayerUnit],
      enemyUnits: battleEnemyUnits,
      onWin: winner => renderLearningResult(winner, [playerUnit], battleEnemyUnits),
      onLose: winner => renderLearningResult(winner, [playerUnit], battleEnemyUnits),
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
