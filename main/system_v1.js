import { unitList } from "../js_units_index.js";
import {
  createBattleState,
  applyUnitDerivedState,
  getSlotByKey,
  getRandomSlotKey,
  getPredictableSlotKeys,
  getSlotNumberFromKey,
  getRollableSlotKeys,
  executeUnitSpecial,
  executeUnitCanUseSpecial,
  executeUnitResolveChoice,
  executeUnitTurnEnd,
  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,
  executeUnitAfterSlotResolved,
  executeUnitActionResolved,
  executeUnitOnDamaged,
  executeUnitModifyTakenDamage,
  executeUnitModifyEvadeAttempt
} from "../js_unit_runtime.js";
import {
  takeHit as resolveTakeHit,
  evadeAttack as resolveEvadeAttack
} from "../js_battle_system.js";
import { resolveSlotEffect } from "../js_slot_effects.js";
import { executeCommonSpecial } from "../js_special_actions.js";
import {
  showPopup,
  renderPlayerState,
  renderPlayerState2v2,
  renderAttackChoicesUI,
  renderPendingChoiceUI
} from "../js_ui.js";

import { create2v2Helpers } from "../js_2on2_helpers.js";
import { create2v2Actions } from "../js_2on2_actions.js";

import { createBattleFlow } from "../js_battle_flow.js";

import { createAttackResolution } from "../js_attack_resolution.js";

import { createUiController } from "../js_ui_controller.js";

import { createGameSetup } from "../js_game_setup.js";

import { createActionLayer } from "../js_action_layer.js";


const screens = {
  title: document.getElementById("title"),
  select: document.getElementById("select"),
  battle: document.getElementById("battle")
};



document.getElementById("start1v1Btn").addEventListener("click", () => {
  battleMode = "1v1";
  teamA = null;
  teamB = null;
  selectingPlayer = "A";
  selectedUnitA = null;
  selectedUnitB = null;
  showScreen("select");
  updateSelectUi();
});

document.getElementById("start2v2Btn").addEventListener("click", () => {
  battleMode = "2v2";
  teamA = null;
  teamB = null;
  selectingPlayer = "A";
  selectedUnitA = null;
  selectedUnitB = null;
  showScreen("select");
  updateSelectUi();
});

const units = unitList;

const unitButtons = document.getElementById("unitButtons");
const playerABox = document.getElementById("playerA");
const playerBBox = document.getElementById("playerB");
const selectGuide = document.getElementById("selectGuide");
const selectedUnitsPreview = document.getElementById("selectedUnitsPreview");

let selectingPlayer = "A";
let selectedUnitA = null;
let selectedUnitB = null;

let currentTurn = 1;
let currentPlayer = "A";
let isTestMode = false;

let battleMode = "1v1"; // "1v1" or "2v2"

// 2on2用チーム構造
let teamA = null;
let teamB = null;

let playerAState = null;
let playerBState = null;

let currentAttack = [];
let currentAttackContext = null;
let currentAttackContexts = [];

let battleNotice = "";
let currentActionHeader = "";
let currentActionLabel = "";
let pendingChoice = null;

let battleFlow = null;

let attackResolution = null;

let twoVtwoHelpers = null;
let twoVtwoActions = null;

let uiController = null;

let gameSetup = null;

let actionLayer = null;

function getPlayerState(playerKey) {
  if (battleMode === "2v2") {
    return getActiveUnitState(playerKey);
  }

  return playerKey === "A" ? playerAState : playerBState;
}

function getOpponentPlayer(playerKey) {
  return playerKey === "A" ? "B" : "A";
}

function getTeam(playerKey) {
  return playerKey === "A" ? teamA : teamB;
}

function getActiveUnitState(playerKey) {
  const team = getTeam(playerKey);
  if (!team) return null;

  return team[team.activeUnitKey] || null;
}

function getFocusUnitState(playerKey) {
  const team = getTeam(playerKey);
  if (!team) return null;

  return team[team.focusUnitKey] || null;
}

function setActiveUnit(playerKey, unitKey) {
  const team = getTeam(playerKey);
  if (!team) return;
  if (unitKey !== "unit1" && unitKey !== "unit2") return;

  team.activeUnitKey = unitKey;
}

function getCombatTargetState(playerKey) {
  if (battleMode === "2v2") {
    return getFocusUnitState(playerKey);
  }

  return getPlayerState(playerKey);
}

function canChangeFocus(playerKey) {
  if (battleMode !== "2v2") return false;
  if (playerKey !== currentPlayer) return false;
  if (pendingChoice) return false;
  if (currentAttack.length > 0) return false;
  return true;
}

function setFocusUnit(playerKey, unitKey) {
  const team = getTeam(playerKey);
  if (!team) return;
  if (unitKey !== "unit1" && unitKey !== "unit2") return;

  team.focusUnitKey = unitKey;
}

function toggleTeamMode(playerKey) {
  const team = getTeam(playerKey);
  if (!team) return;

  showPopup("統合型は未実装です");
}

function setBattleNotice(text) {
  battleNotice = text || "";
}

function createTeam(unit1, unit2) {
  return {
    unit1: createBattleState(unit1),
    unit2: createBattleState(unit2),

    mode: "split", // "split" or "unified"

    activeUnitKey: "unit1",
    focusUnitKey: "unit1",

    // 統合用
    unified: {
      baseHpA: 0,
      baseHpB: 0,
      totalDamage: 0,
      healA: 0,
      healB: 0
    }
  };
}
function isUnifiedTeam(playerKey) {
  return twoVtwoHelpers.isUnifiedTeam(playerKey);
}

function getUnifiedEvade(team) {
  return twoVtwoHelpers.getUnifiedEvade(team);
}

function consumeUnifiedEvade(team, amount) {
  return twoVtwoHelpers.consumeUnifiedEvade(team, amount);
}

function withUnifiedEvadeForCheck(playerKey, actor, callback) {
  return twoVtwoHelpers.withUnifiedEvadeForCheck(playerKey, actor, callback);
}
function clearBattleNotice() {
  battleNotice = "";
}

function appendBattleNotice(text) {
  if (!text) return;

  if (!battleNotice) {
    battleNotice = text;
    return;
  }

  battleNotice += `<br>${text}`;
}

function setCurrentAction(header, label) {
  currentActionHeader = header || "";
  currentActionLabel = label || "";
}

function clearCurrentAction() {
  currentActionHeader = "";
  currentActionLabel = "";
  currentAttackContext = null;
}
function clearPendingChoice() {
  pendingChoice = null;
}



function toggleTestMode() {
  isTestMode = !isTestMode;
  redrawBattleBoards();
  showPopup(isTestMode ? "テストモードON" : "テストモードOFF");
}


function canExecuteSpecialForPlayer(playerKey, special) {
  if (!special || special.actionType === "auto") {
    return false;
  }

  if (pendingChoice) {
    return false;
  }

  const timing = special.timing || "self";

  let timingAllowed = false;

  if (timing === "self") {
    timingAllowed = playerKey === currentPlayer && currentAttack.length === 0;
  } else if (timing === "reaction") {
    timingAllowed = playerKey !== currentPlayer && currentAttack.length > 0;
  } else if (timing === "attack") {
    timingAllowed = playerKey === currentPlayer && currentAttack.length > 0;
  }

  if (!timingAllowed) {
    return false;
  }

  const actor = getPlayerState(playerKey);
  if (!actor) return false;

  const availability = withUnifiedEvadeForCheck(playerKey, actor, () =>
    executeUnitCanUseSpecial(actor, special.key, {
      ownerPlayer: playerKey,
      enemyPlayer: getOpponentPlayer(playerKey),
      currentAttackContext,
      currentAttack
    })
  );

  return availability.allowed !== false;
}

function loadUnitButtons() {
  return gameSetup.loadUnitButtons();
}

function updateSelectUi() {
  return gameSetup.updateSelectUi();
}

function showScreen(screenId) {
  return uiController.showScreen(screenId);
}

function renderAttackLogText(message) {
  return uiController.renderAttackLogText(message);
}

function renderPendingChoice() {
  return uiController.renderPendingChoice();
}

function updateBattleCenterUi() {
  return uiController.updateBattleCenterUi();
}

function redrawBattleBoards() {
  return uiController.redrawBattleBoards();
}

function getPlayerStateRaw(playerKey) {
  return playerKey === "A" ? playerAState : playerBState;
}

function build1v1RenderHandlers(playerKey) {
  return {
    onSlotClick: (slot) => showPopup(slot.desc),
    onSpecialDesc: (special) => showPopup(special.desc),
    onSpecialExec: (specialKey) => executeSpecial(playerKey, specialKey),
    canExecuteSpecial: (special) => canExecuteSpecialForPlayer(playerKey, special)
  };
}

function build2v2RenderHandlers(playerKey) {
  return {
    currentPlayer,
    playerKey,
    canChangeFocus: canChangeFocus(playerKey),
    onToggleTeamMode: () => toggleTeamMode(playerKey),
    onSwitchActiveUnit: (unitKey) => {
      setActiveUnit(playerKey, unitKey);
      redrawBattleBoards();
    },
    onSwitchFocusUnit: (unitKey) => {
      if (!canChangeFocus(playerKey)) {
        showPopup("フォーカス変更は自分ターン中、かつQTE中でない時のみ可能");
        return;
      }
      setFocusUnit(playerKey, unitKey);
      redrawBattleBoards();
    },
    onSlotClick: (slot) => showPopup(slot.desc),
    onSpecialDesc: (special) => showPopup(special.desc),
    onSpecialExec: (specialKey) => executeSpecial(playerKey, specialKey),
    canExecuteSpecial: (special) => canExecuteSpecialForPlayer(playerKey, special)
  };
}

function handleChoiceRequest(requestChoice) {
  if (!requestChoice) return;

  pendingChoice = {
    ...requestChoice
  };

  redrawBattleBoards();
  renderPendingChoice();
}

function renderAttackChoices() {
  renderAttackChoicesUI({
    currentAttack,
    battleNotice,
    currentActionHeader,
    currentActionLabel,
    onHit: (index) => takeHit(index),
    onEvade: (index) => evadeAttack(index),
    onSupportDefense: (index) => supportDefenseAttack(index),
    canSupportDefense: battleMode === "2v2"
  });

  clearBattleNotice();
}
function takeHit(i) {
  return attackResolution.takeHit(i);
}

function evadeAttack(i) {
  return attackResolution.evadeAttack(i);
}

function supportDefenseAttack(i) {
  return attackResolution.supportDefenseAttack(i);
}

function finishCurrentAttackResolution() {
  return attackResolution.finishCurrentAttackResolution();
}

function startSlotAction(ownerPlayer, slotKey, slotOverride = null) {
  return actionLayer.startSlotAction(ownerPlayer, slotKey, slotOverride);
}

function runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta = {}) {
  return actionLayer.runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta);
}

function resolveSlot(slot, slotMeta = {}) {
  return actionLayer.resolveSlot(slot, slotMeta);
}

function executeSpecial(ownerPlayer, specialKey) {
  return actionLayer.executeSpecial(ownerPlayer, specialKey);
}

function resolvePendingChoice(selectedValue) {
  return actionLayer.resolvePendingChoice(selectedValue);
}

function executeNextQueuedSlot() {
  return actionLayer.executeNextQueuedSlot();
}

function getPendingChoice() {
  return pendingChoice;
}

function getCurrentAttack() {
  return currentAttack;
}

function getCurrentAttackContext() {
  return currentAttackContext;
}

function getCurrentAttackContexts() {
  return currentAttackContexts;
}

function setCurrentAttack(value) {
  currentAttack = value;
}

function setCurrentAttackContext(value) {
  currentAttackContext = value;
}

function setCurrentAttackContexts(value) {
  currentAttackContexts = value;
}

function ensureActionState(state) {
  return battleFlow.ensureActionState(state);
}

function resetActionCount(state) {
  return battleFlow.resetActionCount(state);
}

function canConsumeAction(state, amount = 1) {
  return battleFlow.canConsumeAction(state, amount);
}

function consumeActionCount(state, amount = 1) {
  return battleFlow.consumeActionCount(state, amount);
}

function clampEvadeToMax(state) {
  return battleFlow.clampEvadeToMax(state);
}

function executeSlot() {
  return battleFlow.executeSlot();
}

function simulateSlot() {
  return battleFlow.simulateSlot();
}

function endTurn() {
  return battleFlow.endTurn();
}



uiController = createUiController({
  screens,

  playerABox,
  playerBBox,

  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,
  getCurrentTurn: () => currentTurn,
  getIsTestMode: () => isTestMode,

  getBattleNotice: () => battleNotice,
  clearBattleNotice,

  getCurrentActionHeader: () => currentActionHeader,
  getCurrentActionLabel: () => currentActionLabel,

  getPendingChoice: () => pendingChoice,
  resolvePendingChoice,

  getPlayerState,
  getPlayerStateRaw,
  getTeam,

  getSlotNumberFromKey,

  ensureActionState,

  applyUnitDerivedState,
  renderPlayerState,
  renderPlayerState2v2,
  renderPendingChoiceUI,

  build1v1RenderHandlers,
  build2v2RenderHandlers
});

attackResolution = createAttackResolution({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,

  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,
  getCurrentAttackContexts: () => currentAttackContexts,

  setCurrentAttack: (v) => currentAttack = v,
  setCurrentAttackContext: (v) => currentAttackContext = v,
  setCurrentAttackContexts: (v) => currentAttackContexts = v,

  getPlayerState,
  getOpponentPlayer,
  getCombatTargetState,
  getTeam,

  appendBattleNotice,
  redrawBattleBoards,
  renderAttackChoices,
  renderAttackLogText,
  showPopup,

  handleChoiceRequest,

  executeUnitActionResolved,
  executeUnitOnDamaged,
  executeUnitModifyTakenDamage,
  executeUnitModifyEvadeAttempt,

  resolveTakeHit,
  resolveEvadeAttack
});

actionLayer = createActionLayer({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,

  getPendingChoice,
  clearPendingChoice,

  getCurrentAttack,
  getCurrentAttackContext,
  getCurrentAttackContexts,

  setCurrentAttack,
  setCurrentAttackContext,
  setCurrentAttackContexts,

  getPlayerState,
  getOpponentPlayer,
  getCombatTargetState,
  getTeam,

  setActiveUnit,

  isUnifiedTeam,
  getUnifiedEvade,
  consumeUnifiedEvade,

  canExecuteSpecialForPlayer,

  setCurrentAction,
  appendBattleNotice,

  redrawBattleBoards,
  renderAttackChoices,
  renderAttackLogText,
  showPopup,

  handleChoiceRequest,

  executeUnifiedSelectedSlot: (...args) =>
    twoVtwoActions.executeUnifiedSelectedSlot(...args)
});


battleFlow = createBattleFlow({
  getBattleMode: () => battleMode,

  getCurrentPlayer: () => currentPlayer,
  setCurrentPlayer: (value) => { currentPlayer = value; },

  getCurrentTurn: () => currentTurn,
  setCurrentTurn: (value) => { currentTurn = value; },

  getIsTestMode: () => isTestMode,

  getPlayerState,
  getOpponentPlayer,
  getTeam,

  hasPendingChoice: () => !!pendingChoice,

  setCurrentAttack,
setCurrentAttackContext,
setCurrentAttackContexts,

  clearBattleNotice,
  clearCurrentAction,
  clearPendingChoice,

  renderPendingChoice,
  handleChoiceRequest,

  redrawBattleBoards,
  startSlotAction,

  getRollableSlotKeys,
  getRandomSlotKey,
  getSlotByKey,
  getPredictableSlotKeys,

  executeUnitTurnEnd,

  showPopup
});

gameSetup = createGameSetup({
  units,

  unitButtons,
  selectGuide,
  selectedUnitsPreview,

  getBattleMode: () => battleMode,

  getSelectingPlayer: () => selectingPlayer,
  setSelectingPlayer: (v) => selectingPlayer = v,

  getSelectedUnitA: () => selectedUnitA,
  setSelectedUnitA: (v) => selectedUnitA = v,

  getSelectedUnitB: () => selectedUnitB,
  setSelectedUnitB: (v) => selectedUnitB = v,

  getTeamA: () => teamA,
  setTeamA: (v) => teamA = v,

  getTeamB: () => teamB,
  setTeamB: (v) => teamB = v,

  init1v1: (unitA, unitB) => {
    playerAState = createBattleState(unitA);
    playerBState = createBattleState(unitB);

    resetActionCount(playerAState);
    resetActionCount(playerBState);

    currentTurn = 1;
    currentPlayer = "A";
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
    battleNotice = "";
    currentActionHeader = "";
    currentActionLabel = "";
    pendingChoice = null;

    isTestMode = false;
    selectingPlayer = "A";
    selectedUnitA = null;
    selectedUnitB = null;

    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "バトル開始待機中";
    showScreen("battle");
  },

  init2v2: (unitsA, unitsB) => {
    teamA = createTeam(unitsA[0], unitsA[1]);
    teamB = createTeam(unitsB[0], unitsB[1]);

    teamA.activeUnitKey = "unit1";
    teamA.focusUnitKey = "unit1";
    teamB.activeUnitKey = "unit1";
    teamB.focusUnitKey = "unit1";

    playerAState = teamA.unit1;
    playerBState = teamB.unit1;

    resetActionCount(teamA.unit1);
    resetActionCount(teamA.unit2);
    resetActionCount(teamB.unit1);
    resetActionCount(teamB.unit2);

    currentTurn = 1;
    currentPlayer = "A";
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
    battleNotice = "";
    currentActionHeader = "";
    currentActionLabel = "";
    pendingChoice = null;

    isTestMode = false;
    selectingPlayer = "A";
    selectedUnitA = null;
    selectedUnitB = null;

    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "バトル開始待機中";
    showScreen("battle");
  }
});

twoVtwoHelpers = create2v2Helpers({
  getBattleMode: () => battleMode,
  getTeam
});

twoVtwoActions = create2v2Actions({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,
  getTeam,
  getOpponentPlayer,
  getCombatTargetState,

  hasPendingChoice: () => !!pendingChoice,

  getCurrentAttack,
setCurrentAttack,

getCurrentAttackContext,
setCurrentAttackContext,

getCurrentAttackContexts,
setCurrentAttackContexts,

  ensureActionState,
  canConsumeAction,
  consumeActionCount,

  getRollableSlotKeys,
  getSlotByKey,
  getSlotNumberFromKey,

  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,

  resolveSlotEffect,
  runAfterSlotResolvedHook,

  appendBattleNotice,
  clearBattleNotice,
  clearCurrentAction,
  setCurrentAction,

  redrawBattleBoards,
  renderAttackChoices,
  renderAttackLogText,

  executeSlot
});

document.getElementById("executeSlotBtn").addEventListener("click", () => {
  twoVtwoActions.executeTeamSlot();
});

document.getElementById("executeUnit1SlotBtn").addEventListener("click", () => {
  twoVtwoActions.executeSingleTeamSlot("unit1");
});

document.getElementById("executeUnit2SlotBtn").addEventListener("click", () => {
  twoVtwoActions.executeSingleTeamSlot("unit2");
});
document.getElementById("simulateSlotBtn").addEventListener("click", simulateSlot);
document.getElementById("endTurnBtn").addEventListener("click", endTurn);
document.getElementById("toggleTestModeBtn").addEventListener("click", toggleTestMode);





loadUnitButtons();
