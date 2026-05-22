/*
このファイルは関数呼び出し入口にのみ基本利用したいため、
新規コード追加の際にこのファイルに入口以上の機能を増やしたくありません。
このファイルを弄る場合は入口設置にとどめ、
新たなファイルを作成して機能を追加してください。
*/

import { bindMainEvents } from "./js_main_event_bindings.js";
import { createBattleRuntimeAccessors } from "./js_battle_runtime_accessors.js";
import { createBattleInitController } from "./js_battle_init_controller.js";
import { createResetController } from "./js_reset_controller.js";
import { createUnitLookupController } from "./js_unit_lookup_controller.js";
import { createTurnActionController } from "./js_turn_action_controller.js";
import { createSpecialActionController } from "./js_special_action_controller.js";
import { createQteController } from "./js_qte_controller.js";
import { createBossQteAutoResolver } from "./js_boss_qte_auto_resolver.js";
import { createBattleOutcomeController } from "./js_battle_outcome_controller.js";
import { createPlayerAccountUi } from "./js_player_account_ui.js";
import { createLocalModeController } from "./js_local_mode_controller.js";
import { createOnlineRoomController } from "./js_online_room_controller.js";
import { createBattleRecordController } from "./js_battle_record_controller.js";
import { createOnlineActionSync } from "./js_online_action_sync.js";
import { createOnlineBattleUi } from "./js_online_battle_ui.js";
import { createOnlineSpectatorController } from "./js_online_spectator_controller.js";
import { createRandomMatchController } from "./js_random_match_controller.js";
import { createPlayerStatsUi } from "./js_player_stats_ui.js";
import {
  TITLE_DEFINITIONS,
  TITLE_NAME_MAP,
  UNLOCKABLE_UNIT_MAP,
  TITLE_GROUPS,
  BOSS_TROPHY_RULES,
  getTitleConditionText
} from "./js_player_titles.js";
import { updatePlayerAchievements } from "./js_player_achievements.js";
import {
  playerSession,
  loginPlayer,
  registerPlayer,
  logoutPlayer,
  canUseTestMode,
  recordBattleResult,
  record2v2BattleResult,
  restorePlayerSession,
  saveCurrentPlayerProfile,
  readAccountListForViewer
} from "./js_player_profile.js";
import {
  createRoomId,
  writeRoom,
  readRoom,
  updateRoom,
  listenRoom,
  buildInitialRoomData,
  cleanupOldRooms,
  writeRandomMatchWaiting,
  updateRandomMatchWaiting,
  removeRandomMatchWaiting,
  readRandomMatchWaiting,
  listenRandomMatchWaiting,
  writeRandomMatchSession,
  updateRandomMatchSession,
  listenRandomMatchSession,
  removeRandomMatchSession,
  writeRandomMatchAnnouncement,
listenRandomMatchAnnouncement,
  cleanupOldRandomMatch
} from "./js_online_firebase.js";
import { onlineState } from "./js_online_state.js";
import { unitList, bossList, cpuList, cpuBeginnerList, debugUnitList } from "./js_units_index.js";
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
} from "./js_unit_runtime.js";

import {
  takeHit as resolveTakeHit,
  evadeAttack as resolveEvadeAttack
} from "./js_battle_system.js";
import { resolveSlotEffect } from "./js_slot_effects.js";
import { executeCommonSpecial } from "./js_special_actions.js";
import {
  showPopup,
  renderPlayerState,
  renderPlayerState2v2,
  renderAttackChoicesUI,
  renderPendingChoiceUI
} from "./js_ui.js";

import { create2v2Core } from "./js_2on2_core.js";
import { create2v2Helpers } from "./js_2on2_helpers.js";
import { create2v2Actions } from "./js_2on2_actions.js";
import { create2v2Adapter } from "./js_2on2_adapter.js";
import { createBattleFlow } from "./js_battle_flow.js";

import { createAttackResolution } from "./js_attack_resolution.js";

import { createUiController } from "./js_ui_controller.js";

import { createGameSetup } from "./js_game_setup.js";

import { createActionLayer } from "./js_action_layer.js";

const screens = {
  title: document.getElementById("title"),
  select: document.getElementById("select"),
  battle: document.getElementById("battle"),
  onlineRoom: document.getElementById("onlineRoom")
};
const startOnline1v1Btn = document.getElementById("startOnline1v1Btn");
const startOnline2v2Btn = document.getElementById("startOnline2v2Btn");
const createOnlineRoomBtn = document.getElementById("createOnlineRoomBtn");
const joinOnlineRoomBtn = document.getElementById("joinOnlineRoomBtn");
const backFromOnlineRoomBtn = document.getElementById("backFromOnlineRoomBtn");
const onlineRoomIdInput = document.getElementById("onlineRoomIdInput");
const onlineRoomStatus = document.getElementById("onlineRoomStatus");
const onlineInviteUrl = document.getElementById("onlineInviteUrl");



const units = unitList;

const unitButtons = document.getElementById("unitButtons");
const playerABox = document.getElementById("playerA");
const playerBBox = document.getElementById("playerB");
const selectGuide = document.getElementById("selectGuide");
const selectedUnitsPreview = document.getElementById("selectedUnitsPreview");
const confirmSelectedUnitBtn = document.getElementById("confirmSelectedUnitBtn");
const backFromSelectBtn = document.getElementById("backFromSelectBtn");

let selectingPlayer = "A";
let selectedUnitA = null;
let selectedUnitB = null;
let pendingSelectedUnit = null;
let extraUnlockedUnits = [];

let currentTurn = 1;
let currentPlayer = "A";
let isTestMode = false;

let battleMode = "1v1";
let playerStatsUi = null;
let randomMatchController = null;
let onlineBattleUi = null;
let onlineActionSync = null;
let onlineSpectatorController = null;
let twoVtwoCore = null;
let battleRecordController = null;
let onlineRoomController = null;
let localModeController = null;
let playerAccountUi = null;
let battleOutcomeController = null;
let bossQteAutoResolver = null;
let qteController = null;
let specialActionController = null;
let turnActionController = null;
let unitLookupController = null;
let resetController = null;
let battleInitController = null;
let battleRuntimeAccessors = null;
/*
  battleMode:
  - 1v1
  - 2v2
  - challenge1v1
  - challenge2v2
  - vscpu1v1
  - vscpu2v2
  - online1v1
*/

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
let twoVtwoAdapter = null;

let uiController = null;

let gameSetup = null;

let actionLayer = null;

function canUseDebugUnit() {
  const role = playerSession.profile?.role;
  return role === "debug" || role === "Ciel_debugger";
}

function getTitleName(titleId) {
  return TITLE_NAME_MAP[titleId] || titleId;
}
function renderAccountListPanel() {
  return playerStatsUi.renderAccountListPanel();
}

function refreshPlayerAchievementsNow() {
  return playerStatsUi.refreshPlayerAchievementsNow();
}

function renderPlayerStatsPanel() {
  return playerStatsUi.renderPlayerStatsPanel();
}

function renderTitleCustomizePanel() {
  return playerStatsUi.renderTitleCustomizePanel();
}

function renderTitleListPanel() {
  return playerStatsUi.renderTitleListPanel();
}

function renderTrophyCustomizePanel() {
  return playerStatsUi.renderTrophyCustomizePanel();
}
function getUnitTrophyText(profile, unitId) {
  return playerAccountUi.getUnitTrophyText(profile, unitId);
}

function formatPlayerComment(text) {
  return playerAccountUi.formatPlayerComment(text);
}

function getFavoriteUnitIds(profile) {
  return playerAccountUi.getFavoriteUnitIds(profile);
}
function getUnitDisplayNameWithTrophy(unit, profile) {
  return unitLookupController.getUnitDisplayNameWithTrophy(unit, profile);
}

function applyBattleDisplayNames() {
  return unitLookupController.applyBattleDisplayNames();
}

function resetRandomMatchState() {
  return randomMatchController.resetRandomMatchState();
}

function ensureRandomMatchUi() {
  return randomMatchController.ensureRandomMatchUi();
}

function listenRandomMatchAnnouncementsOnceReady() {
  return randomMatchController.listenRandomMatchAnnouncementsOnceReady();
}

function startRandomMatch() {
  return randomMatchController.startRandomMatch();
}
function spectateOnlineRoom() {
  return onlineSpectatorController.spectateOnlineRoom();
}

function buildOnlineBattleSnapshot() {
  return onlineSpectatorController.buildOnlineBattleSnapshot();
}

function applyOnlineBattleSnapshot(snapshot) {
  return onlineSpectatorController.applyOnlineBattleSnapshot(snapshot);
}

function isOnlineSpectator() {
  return onlineSpectatorController.isOnlineSpectator();
}
function ensureOnlineBattleExtraUi() {
  return onlineBattleUi.ensureOnlineBattleExtraUi();
}

function ensureOnlineTopPlayerHud() {
  return onlineBattleUi.ensureOnlineTopPlayerHud();
}

function ensureOnlineCenterButtons() {
  return onlineBattleUi.ensureOnlineCenterButtons();
}

function sendOnlineChat(playerKey) {
  return onlineBattleUi.sendOnlineChat(playerKey);
}

function renderOnlineExtraUi(roomData) {
  return onlineBattleUi.renderOnlineExtraUi(roomData);
}

function requestOnlinePeace() {
  return onlineBattleUi.requestOnlinePeace();
}

function respondOnlinePeace(accept) {
  return onlineBattleUi.respondOnlinePeace(accept);
}

function showOnlinePeaceRequestPopup(requester) {
  return onlineBattleUi.showOnlinePeaceRequestPopup(requester);
}

function showOnlinePeaceFinishedPopup() {
  return onlineBattleUi.showOnlinePeaceFinishedPopup();
}

function requestOnlineSurrender() {
  return onlineBattleUi.requestOnlineSurrender();
}

function applyOnlineMetaResult(roomData) {
  return onlineBattleUi.applyOnlineMetaResult(roomData);
}

function applyOnlinePeaceRequest(roomData) {
  return onlineBattleUi.applyOnlinePeaceRequest(roomData);
}

function markOnlinePlayerLeft() {
  return onlineBattleUi.markOnlinePlayerLeft();
}
function resetOnlineStateForLocalBattle() {
  return resetController.resetOnlineStateForLocalBattle();
}

  function resetLocalSelectionAndBattleState() {
  return resetController.resetLocalSelectionAndBattleState();
}

function cleanupOnlineBattleUi() {
  return resetController.cleanupOnlineBattleUi();
}

function showTitle() {
  return resetController.showTitle();
}

function isChallengeMode() {
  return battleMode === "challenge1v1" ||
    battleMode === "challenge2v2" ||
    battleMode === "vscpu1v1" ||
    battleMode === "vscpu2v2";
}

function getPlayerState(playerKey) {
  if (isTeamBattleMode()) {
    return getActiveUnitState(playerKey);
  }

  return playerKey === "A" ? playerAState : playerBState;
}

function getOpponentPlayer(playerKey) {
  return playerKey === "A" ? "B" : "A";
}

function setBattleNotice(text) {
  battleNotice = text || "";
}
function isTeamBattleMode() {
  return twoVtwoCore.isTeamBattleMode();
}

function getTeam(playerKey) {
  return twoVtwoCore.getTeam(playerKey);
}

function getActiveUnitState(playerKey) {
  return twoVtwoCore.getActiveUnitState(playerKey);
}

function getFocusUnitState(playerKey) {
  return twoVtwoCore.getFocusUnitState(playerKey);
}

function setActiveUnit(playerKey, unitKey) {
  return twoVtwoCore.setActiveUnit(playerKey, unitKey);
}

function getCombatTargetState(playerKey) {
  return twoVtwoCore.getCombatTargetState(playerKey);
}

function canChangeFocus(playerKey) {
  return twoVtwoCore.canChangeFocus(playerKey);
}

function setFocusUnit(playerKey, unitKey) {
  return twoVtwoCore.setFocusUnit(playerKey, unitKey);
}

function toggleTeamMode(playerKey) {
  const result = twoVtwoCore.toggleTeamMode(playerKey);
  redrawBattleBoards();
  return result;
}

function createTeam(unit1, unit2) {
  return twoVtwoCore.createTeam(unit1, unit2);
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

function publishOnlineChoiceAction(choice, selectedValue) {
  return onlineActionSync.publishOnlineChoiceAction(choice, selectedValue);
}

function publishOnlineSpecialAction(ownerPlayer, specialKey) {
  return onlineActionSync.publishOnlineSpecialAction(ownerPlayer, specialKey);
}

function publishOnlineQteAction(kind, index) {
  return onlineActionSync.publishOnlineQteAction(kind, index);
}

function publishOnlineEndTurnAction(actorPlayer) {
  return onlineActionSync.publishOnlineEndTurnAction(actorPlayer);
}

function publishOnlineSlotAction(ownerPlayer, slotKey) {
  return onlineActionSync.publishOnlineSlotAction(ownerPlayer, slotKey);
}

function publishOnlineBattleEnd(winnerPlayer) {
  return onlineActionSync.publishOnlineBattleEnd(winnerPlayer);
}

function applyOnlineAction(action) {
  return onlineActionSync.applyOnlineAction(action);
}

function toggleTestMode() {
  if (!canUseTestMode()) {
    showPopup("テストモードはデバッグアカウント専用です");
    return;
  }

  isTestMode = !isTestMode;
  redrawBattleBoards();
  showPopup(isTestMode ? "テストモードON" : "テストモードOFF");
}
function updateDebugButtonVisibility() {
  const btn = document.getElementById("toggleTestModeBtn");
  if (!btn) return;

  btn.style.display = canUseTestMode() ? "" : "none";
}
function updatePlayerCardUi() {
  return playerAccountUi.updatePlayerCardUi();
}

function getUnitNameById(unitId) {
  return unitLookupController.getUnitNameById(unitId);
}
function ensureAccountListButton() {
  return playerAccountUi.ensureAccountListButton();
}
function canExecuteSpecialForPlayer(playerKey, special) {
  return specialActionController.canExecuteSpecialForPlayer(playerKey, special);
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
  const isBossSide = isChallengeMode() && playerKey === "B";

  return {
    currentPlayer,
    playerKey,
    canChangeFocus: isBossSide ? false : canChangeFocus(playerKey),
  onToggleTeamMode: () => {
      if (currentPlayer !== playerKey) {
        showPopup("型変更は自分ターン中のみ可能");
        return;
      }

      toggleTeamMode(playerKey);
    },
    onSwitchActiveUnit: (unitKey) => {
      const team = getTeam(playerKey);
      if (!team || !team[unitKey]) return;

      setActiveUnit(playerKey, unitKey);
      redrawBattleBoards();
    },
    onSwitchFocusUnit: (unitKey) => {
      const team = getTeam(playerKey);
      if (!team || !team[unitKey]) return;

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
  return specialActionController.handleChoiceRequest(requestChoice);
}
function shouldCpuUseEvade(defender) {
  return bossQteAutoResolver.shouldCpuUseEvade(defender);
}

function autoResolveBossQteIfNeeded() {
  return bossQteAutoResolver.autoResolveBossQteIfNeeded();
}

function isUnitDefeated(unit) {
  return battleOutcomeController.isUnitDefeated(unit);
}

function isSideDefeated(playerKey) {
  return battleOutcomeController.isSideDefeated(playerKey);
}

function getBattleRecordModeKey() {
  return battleRecordController.getBattleRecordModeKey();
}

function getOpponentCategoryForBattle() {
  return battleRecordController.getOpponentCategoryForBattle();
}

function getUnitIdFromState(state) {
  return battleRecordController.getUnitIdFromState(state);
}

function getTeamUnitIds(playerKey) {
  return battleRecordController.getTeamUnitIds(playerKey);
}

function get1v1UnitId(playerKey) {
  return battleRecordController.get1v1UnitId(playerKey);
}

function recordBattleResultIfNeeded(winnerPlayer) {
  return battleRecordController.recordBattleResultIfNeeded(winnerPlayer);
}

function getOpponentCategoryByMode() {
  return battleRecordController.getOpponentCategoryByMode();
}

function getBattleRecordMode() {
  return battleRecordController.getBattleRecordMode();
}

function saveOnlineEncounteredPlayer(roomData) {
  return battleRecordController.saveOnlineEncounteredPlayer(roomData);
}

function saveBattleResultForCurrentPlayer(winnerPlayer) {
  return battleRecordController.saveBattleResultForCurrentPlayer(winnerPlayer);
}

function get2v2StatsModeKey() {
  return battleRecordController.get2v2StatsModeKey();
}
function finishBattle(winnerPlayer) {
  return battleOutcomeController.finishBattle(winnerPlayer);
}

function checkBattleEnd() {
  return battleOutcomeController.checkBattleEnd();
}

function renderAttackChoices() {
  return qteController.renderAttackChoices();
}
function canOperateQteDefender() {
  return qteController.canOperateQteDefender();
}

function takeHit(i) {
  return qteController.takeHit(i);
}

function evadeAttack(i) {
  return qteController.evadeAttack(i);
}

function supportDefenseAttack(i) {
  return qteController.supportDefenseAttack(i);
}

function finishCurrentAttackResolution() {
  return qteController.finishCurrentAttackResolution();
}
function startSlotAction(ownerPlayer, slotKey, slotOverride = null) {
  return actionLayer.startSlotAction(ownerPlayer, slotKey, slotOverride);
}
function executeCpuAutoSlotBatch(ownerPlayer) {
  return actionLayer.executeCpuAutoSlotBatch(ownerPlayer);
}
function runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta = {}) {
  return actionLayer.runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta);
}

function resolveSlot(slot, slotMeta = {}) {
  return actionLayer.resolveSlot(slot, slotMeta);
}

function executeSpecial(ownerPlayer, specialKey) {
  return specialActionController.executeSpecial(ownerPlayer, specialKey);
}

function resolvePendingChoice(selectedValue) {
  return specialActionController.resolvePendingChoice(selectedValue);
}

  
function executeNextQueuedSlot() {
  return actionLayer.executeNextQueuedSlot();
}
function reserveAction(state, action) {
    return actionLayer.reserveAction(state, action);
  }

  function processReservedActionsForTrigger(ownerPlayer, trigger) {
    return actionLayer.processReservedActionsForTrigger(ownerPlayer, trigger);
  }
function getPendingChoice() {
  return battleRuntimeAccessors.getPendingChoice();
}

function getCurrentAttack() {
  return battleRuntimeAccessors.getCurrentAttack();
}

function getCurrentAttackContext() {
  return battleRuntimeAccessors.getCurrentAttackContext();
}

function getCurrentAttackContexts() {
  return battleRuntimeAccessors.getCurrentAttackContexts();
}

function setCurrentAttack(value) {
  return battleRuntimeAccessors.setCurrentAttack(value);
}

function setCurrentAttackContext(value) {
  return battleRuntimeAccessors.setCurrentAttackContext(value);
}

function setCurrentAttackContexts(value) {
  return battleRuntimeAccessors.setCurrentAttackContexts(value);
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
  return turnActionController.executeSlot();
}

function simulateSlot() {
  return turnActionController.simulateSlot();
}

function endTurn() {
  return turnActionController.endTurn();
}
  

let onlineEncounterSaved = false;
let currentOnlineOpponentPlayerId = "";
let onlineBattleStarted = false;
let onlineBattleFinished = false;
let onlineActionSeq = 0;
let onlineSelectEntered = false;

function getUnitById(unitId) {
  return unitLookupController.getUnitById(unitId);
}

function syncExtraUnlockedUnitsFromProfile() {
  return unitLookupController.syncExtraUnlockedUnitsFromProfile();
}
function abortCurrentBattleWithoutRecordForRandomMatch() {
  return resetController.abortCurrentBattleWithoutRecordForRandomMatch();
}
function getOnlineTitleText(playerData) {
  const titleIds = Array.isArray(playerData?.equippedTitles)
    ? playerData.equippedTitles
    : [];

  if (titleIds.length === 0) {
    return "称号なし";
  }

  return titleIds.map(id => `[${getTitleName(id)}]`).join("");
}

function canOperateOnlinePlayer() {
  return turnActionController.canOperateOnlinePlayer();
}

function getOnlineProfilePatch(playerKey) {
  return onlineRoomController.getOnlineProfilePatch(playerKey);
}

function bootOnlineFromUrl() {
  return onlineRoomController.bootOnlineFromUrl();
}

function applyOnlineRoomData(roomData) {
  return onlineRoomController.applyOnlineRoomData(roomData);
}

function enterOnlineSelect() {
  return onlineRoomController.enterOnlineSelect();
}

function initOnline1v1Battle(unitA, unitB) {
  return onlineRoomController.initOnline1v1Battle(unitA, unitB);
}
battleOutcomeController = createBattleOutcomeController({
  isTeamBattleMode,
  getTeam,
  getPlayerStateRaw,

  recordBattleResultIfNeeded,

  resetBattleAfterFinish: () => {
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
    pendingChoice = null;
    battleNotice = "";
    currentActionHeader = "";
    currentActionLabel = "";

    teamA = null;
    teamB = null;
    playerAState = null;
    playerBState = null;
    selectedUnitA = null;
    selectedUnitB = null;
    selectingPlayer = "A";
    currentTurn = 1;
    currentPlayer = "A";
onlineState.isSpectator = false;
    onlineState.enabled = false;
    onlineState.roomId = null;
    onlineState.myPlayer = null;
    onlineState.isHost = false;
    onlineState.lastAppliedActionId = 0;
    onlineState.isApplyingRemote = false;

    onlineBattleStarted = false;
    onlineBattleFinished = false;
    onlineSelectEntered = false;
    onlineActionSeq = 0;
  },

  showTitle
});
unitLookupController = createUnitLookupController({
  getAllUnits: () => [
    ...unitList,
    ...bossList,
    ...cpuList,
    ...cpuBeginnerList,
    ...debugUnitList
  ],

  getPlayerProfile: () => playerSession.profile,

  getUnitTrophyText,

  getUnlockableUnitMap: () => UNLOCKABLE_UNIT_MAP,

  getPlayerAState: () => playerAState,
  getPlayerBState: () => playerBState,

  getTeamA: () => teamA,
  getTeamB: () => teamB,

  setExtraUnlockedUnits: (value) => {
    extraUnlockedUnits = value;
  }
});
playerAccountUi = createPlayerAccountUi({
  getPlayerProfile: () => playerSession.profile,

  getTitleName,
  getUnitNameById,

  loginPlayer,
  registerPlayer,
  logoutPlayer,

  syncExtraUnlockedUnitsFromProfile,
  updateDebugButtonVisibility,
  ensureRandomMatchUi,
  listenRandomMatchAnnouncementsOnceReady,
  renderAccountListPanel,

  clearExtraUnlockedUnits: () => {
    extraUnlockedUnits = [];
  },

  setTestMode: (value) => {
    isTestMode = value;
  },

  showPopup
});
localModeController = createLocalModeController({
  resetOnlineStateForLocalBattle,

  setBattleMode: (value) => {
    battleMode = value;
  },

  setTeamA: (value) => {
    teamA = value;
  },

  setTeamB: (value) => {
    teamB = value;
  },

  setSelectingPlayer: (value) => {
    selectingPlayer = value;
  },

  setSelectedUnitA: (value) => {
    selectedUnitA = value;
  },

  setSelectedUnitB: (value) => {
    selectedUnitB = value;
  },

  showScreen,
  loadUnitButtons
});

onlineBattleUi = createOnlineBattleUi({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineRoomId: () => onlineState.roomId,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  getOnlineBattleStarted: () => onlineBattleStarted,
  getOnlineBattleFinished: () => onlineBattleFinished,
  setOnlineBattleFinished: (value) => {
    onlineBattleFinished = value;
  },

  updateRoom,

  showPopup,
  showScreen,
  finishBattle,

  cleanupOnlineBattleUi,
  resetOnlineStateForLocalBattle,
  resetLocalSelectionAndBattleState
});

onlineBattleUi.bindBeforeUnloadLeaveHandler();
twoVtwoCore = create2v2Core({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,

  getTeamA: () => teamA,
  getTeamB: () => teamB,

  getPlayerStateRaw,

  hasPendingChoice: () => !!pendingChoice,
  hasCurrentAttack: () => currentAttack.length > 0,

  createBattleState,
  showPopup
});
onlineSpectatorController = createOnlineSpectatorController({
  getBattleMode: () => battleMode,
  setBattleMode: value => {
    battleMode = value;
  },

  getCurrentTurn: () => currentTurn,
  setCurrentTurn: value => {
    currentTurn = value;
  },

  getCurrentPlayer: () => currentPlayer,
  setCurrentPlayer: value => {
    currentPlayer = value;
  },

  getPlayerAState: () => playerAState,
  setPlayerAState: value => {
    playerAState = value;
  },

  getPlayerBState: () => playerBState,
  setPlayerBState: value => {
    playerBState = value;
  },

  getCurrentAttack: () => currentAttack,
  setCurrentAttack: value => {
    currentAttack = value;
  },

  getCurrentAttackContext: () => currentAttackContext,
  setCurrentAttackContext: value => {
    currentAttackContext = value;
  },

  getCurrentAttackContexts: () => currentAttackContexts,
  setCurrentAttackContexts: value => {
    currentAttackContexts = value;
  },

  getBattleNotice: () => battleNotice,
  setBattleNotice: value => {
    battleNotice = value;
  },

  getCurrentActionHeader: () => currentActionHeader,
  setCurrentActionHeader: value => {
    currentActionHeader = value;
  },

  getCurrentActionLabel: () => currentActionLabel,
  setCurrentActionLabel: value => {
    currentActionLabel = value;
  },

  getOnlineState: () => onlineState,
  setOnlineState: patch => {
    Object.assign(onlineState, patch);
  },
  getOnlineMyPlayer: () => onlineState.myPlayer,

  setOnlineSelectEntered: value => {
    onlineSelectEntered = value;
  },
  setOnlineBattleStarted: value => {
    onlineBattleStarted = value;
  },

  getOnlineRoomIdInput: () => onlineRoomIdInput,
  getOnlineRoomStatus: () => onlineRoomStatus,

  cleanupOldRooms,
  readRoom,
  listenRoom,
  applyOnlineRoomData,
  redrawBattleBoards,
  renderAttackChoices,
  ensureOnlineBattleExtraUi,
  showScreen,
  showPopup
});
onlineActionSync = createOnlineActionSync({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineRoomId: () => onlineState.roomId,
  getOnlineMyPlayer: () => onlineState.myPlayer,
buildOnlineBattleSnapshot,
  isApplyingRemote: () => onlineState.isApplyingRemote,
  setApplyingRemote: (value) => {
    onlineState.isApplyingRemote = value;
  },

  getLastAppliedActionId: () => onlineState.lastAppliedActionId,
  setLastAppliedActionId: (value) => {
    onlineState.lastAppliedActionId = value;
  },

  getOnlineActionSeq: () => onlineActionSeq,
  setOnlineActionSeq: (value) => {
    onlineActionSeq = value;
  },
  nextOnlineActionSeq: () => {
    onlineActionSeq += 1;
    onlineState.lastAppliedActionId = onlineActionSeq;
    return onlineActionSeq;
  },

  updateRoom,

  getPlayerState,
  ensureActionState,
  consumeActionCount,
  startSlotAction,
  redrawBattleBoards,

  executeSpecialRaw: (ownerPlayer, specialKey) =>
    actionLayer.executeSpecial(ownerPlayer, specialKey),

  resolvePendingChoiceRaw: (selectedValue) =>
    actionLayer.resolvePendingChoice(selectedValue),

  takeHitRaw: (index) => attackResolution.takeHit(index),
  evadeAttackRaw: (index) => attackResolution.evadeAttack(index),
  supportDefenseAttackRaw: (index) => attackResolution.supportDefenseAttack(index),

  checkBattleEnd,
  finishBattle,
  endTurnRaw: () => battleFlow.endTurn()
});
uiController = createUiController({
  screens,

  playerABox,
  playerBBox,

  getBattleMode: () => battleMode,
isTeamBattleMode,

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
battleRecordController = createBattleRecordController({
  getBattleMode: () => battleMode,
  getIsTestMode: () => isTestMode,

  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  getPlayerProfile: () => playerSession.profile,

  isTeamBattleMode,
  getOpponentPlayer,
  getTeam,
  getPlayerStateRaw,

  recordBattleResult,
  record2v2BattleResult,
  saveCurrentPlayerProfile,

  getOnlineEncounterSaved: () => onlineEncounterSaved,
  setOnlineEncounterSaved: (value) => {
    onlineEncounterSaved = value;
  },

  getCurrentOnlineOpponentPlayerId: () => currentOnlineOpponentPlayerId,
  setCurrentOnlineOpponentPlayerId: (value) => {
    currentOnlineOpponentPlayerId = value;
  }
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
qteController = createQteController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,
isOnlineSpectator,
  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,

  getBattleNotice: () => battleNotice,
  getCurrentActionHeader: () => currentActionHeader,
  getCurrentActionLabel: () => currentActionLabel,

  isTeamBattleMode,

  autoResolveBossQteIfNeeded,
  clearBattleNotice,

  renderAttackChoicesUI,

  attackTakeHit: (index) => attackResolution.takeHit(index),
  attackEvadeAttack: (index) => attackResolution.evadeAttack(index),
  attackSupportDefenseAttack: (index) => attackResolution.supportDefenseAttack(index),
  finishCurrentAttackResolutionRaw: () => attackResolution.finishCurrentAttackResolution(),

  checkBattleEnd,
  publishOnlineQteAction,
  showPopup
});
bossQteAutoResolver = createBossQteAutoResolver({
  isChallengeMode,

  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,

  getCurrentActionHeader: () => currentActionHeader,

  getPlayerState,
  getCombatTargetState,

  appendBattleNotice,
  finishCurrentAttackResolution,
  checkBattleEnd,
  renderAttackLogText,

  executeUnitModifyEvadeAttempt,
  executeUnitModifyTakenDamage,
  executeUnitOnDamaged,

  resolveTakeHit,
  resolveEvadeAttack
});
specialActionController = createSpecialActionController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,
  isOnlineSpectator,
  getCurrentPlayer: () => currentPlayer,
  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,

  getPendingChoice: () => pendingChoice,
  setPendingChoice: (value) => {
    pendingChoice = value;
  },
  hasPendingChoice: () => !!pendingChoice,

  getPlayerState,
  getOpponentPlayer,

  executeUnitCanUseSpecial,
  withUnifiedEvadeForCheck,
  twoVtwoAdapter,

  executeSpecialRaw: (ownerPlayer, specialKey) =>
    actionLayer.executeSpecial(ownerPlayer, specialKey),

  resolvePendingChoiceRaw: (selectedValue) =>
    actionLayer.resolvePendingChoice(selectedValue),

  publishOnlineSpecialAction,
  publishOnlineChoiceAction,

  redrawBattleBoards,
  renderPendingChoice,
  showPopup
});
actionLayer = createActionLayer({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,
getRollableSlotKeys,
  ensureActionState,
  canConsumeAction,
  consumeActionCount,
  executeCpuAutoSlotBatch,
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
twoVtwoAdapter,
  canExecuteSpecialForPlayer,

  setCurrentAction,
  appendBattleNotice,
processReservedActionsForTrigger,
  redrawBattleBoards,
  renderAttackChoices,
  renderAttackLogText,
  showPopup,

  handleChoiceRequest,

  executeUnifiedSelectedSlot: (...args) =>
    twoVtwoActions.executeUnifiedSelectedSlot(...args)
});

battleRuntimeAccessors = createBattleRuntimeAccessors({
  getPendingChoice: () => pendingChoice,

  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,
  getCurrentAttackContexts: () => currentAttackContexts,

  setCurrentAttack: (value) => {
    currentAttack = value;
  },

  setCurrentAttackContext: (value) => {
    currentAttackContext = value;
  },

  setCurrentAttackContexts: (value) => {
    currentAttackContexts = value;
  }
});
battleFlow = createBattleFlow({
  getBattleMode: () => battleMode,
isTeamBattleMode,
isChallengeMode,
executeTeamSlot: () => twoVtwoActions.executeTeamSlot(),
executeCpuAutoSlotBatch,
  getCurrentPlayer: () => currentPlayer,
  setCurrentPlayer: (value) => { currentPlayer = value; },
twoVtwoAdapter,
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
  processReservedActionsForTrigger,

  onSlotActionResolved: publishOnlineSlotAction,
  getRollableSlotKeys,
  getRandomSlotKey,
  getSlotByKey,
  getPredictableSlotKeys,

  executeUnitTurnEnd,

  showPopup,
  getCurrentAttack,
renderAttackChoices
});
turnActionController = createTurnActionController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,
  isOnlineSpectator,
  getCurrentPlayer: () => currentPlayer,

  executeSlotRaw: () => battleFlow.executeSlot(),
  simulateSlotRaw: () => battleFlow.simulateSlot(),
  endTurnRaw: () => battleFlow.endTurn(),

  publishOnlineEndTurnAction,
  showPopup
});
onlineRoomController = createOnlineRoomController({
  getPlayerProfile: () => playerSession.profile,
isOnlineSpectator,
applyOnlineBattleSnapshot,
  getOnlineRoomIdInput: () => onlineRoomIdInput,
  getOnlineRoomStatus: () => onlineRoomStatus,
  getOnlineInviteUrl: () => onlineInviteUrl,

  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  setOnlineState: (patch) => {
  Object.assign(onlineState, { isSpectator: false }, patch);
},

  getOnlineBattleStarted: () => onlineBattleStarted,
  setOnlineBattleStarted: (value) => {
    onlineBattleStarted = value;
  },

  getOnlineSelectEntered: () => onlineSelectEntered,
  setOnlineSelectEntered: (value) => {
    onlineSelectEntered = value;
  },

  setBattleMode: (value) => {
    battleMode = value;
  },

  getSelectedUnitA: () => selectedUnitA,
  setSelectedUnitA: (value) => {
    selectedUnitA = value;
  },

  getSelectedUnitB: () => selectedUnitB,
  setSelectedUnitB: (value) => {
    selectedUnitB = value;
  },

  setSelectingPlayer: (value) => {
    selectingPlayer = value;
  },

  setTeamA: (value) => {
    teamA = value;
  },

  setTeamB: (value) => {
    teamB = value;
  },

  setPlayerAState: (value) => {
    playerAState = value;
  },

  setPlayerBState: (value) => {
    playerBState = value;
  },

  resetBattleRuntimeState: ({
    currentTurn: nextTurn,
    currentPlayer: nextPlayer,
    isTestMode: nextTestMode,
    onlineBattleFinished: nextOnlineBattleFinished
  }) => {
    currentTurn = nextTurn;
    currentPlayer = nextPlayer;
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
    battleNotice = "";
    currentActionHeader = "";
    currentActionLabel = "";
    pendingChoice = null;
    isTestMode = nextTestMode;
    onlineBattleFinished = nextOnlineBattleFinished;
  },

  createRoomId,
  writeRoom,
  readRoom,
  updateRoom,
  listenRoom,
  buildInitialRoomData,
  cleanupOldRooms,

  createBattleState,
  resetActionCount,

  getUnitById,
  updateSelectUi,
  applyOnlineAction,
  renderOnlineExtraUi,
  applyOnlinePeaceRequest,
  applyOnlineMetaResult,
  saveOnlineEncounteredPlayer,

  initOnline1v1Battle: (...args) => onlineRoomController.initOnline1v1Battle(...args),

  applyBattleDisplayNames,
  redrawBattleBoards,
  ensureOnlineBattleExtraUi,
  updateDebugButtonVisibility,
  showScreen,
  loadUnitButtons,
  showPopup
});
resetController = createResetController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineRoomId: () => onlineState.roomId,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  setOnlineState: (patch = {}) => {
  onlineState.enabled = patch.enabled ?? false;
  onlineState.roomId = patch.roomId ?? null;
  onlineState.myPlayer = patch.myPlayer ?? null;
  onlineState.isHost = patch.isHost ?? false;
  onlineState.lastAppliedActionId = patch.lastAppliedActionId ?? 0;
  onlineState.isApplyingRemote = patch.isApplyingRemote ?? false;
  onlineState.isSpectator = patch.isSpectator ?? false;
},
  getOnlineBattleStarted: () => onlineBattleStarted,
  setOnlineBattleStarted: (value) => {
    onlineBattleStarted = value;
  },

  getOnlineBattleFinished: () => onlineBattleFinished,
  setOnlineBattleFinished: (value) => {
    onlineBattleFinished = value;
  },

  setOnlineSelectEntered: (value) => {
    onlineSelectEntered = value;
  },

  setOnlineActionSeq: (value) => {
    onlineActionSeq = value;
  },

  setOnlineEncounterSaved: (value) => {
    onlineEncounterSaved = value;
  },

  setCurrentOnlineOpponentPlayerId: (value) => {
    currentOnlineOpponentPlayerId = value;
  },

  setSelectingPlayer: (value) => {
    selectingPlayer = value;
  },

  setSelectedUnitA: (value) => {
    selectedUnitA = value;
  },

  setSelectedUnitB: (value) => {
    selectedUnitB = value;
  },

  setPendingSelectedUnit: (value) => {
    pendingSelectedUnit = value;
  },

  setTeamA: (value) => {
    teamA = value;
  },

  setTeamB: (value) => {
    teamB = value;
  },

  setPlayerAState: (value) => {
    playerAState = value;
  },

  setPlayerBState: (value) => {
    playerBState = value;
  },

  setCurrentTurn: (value) => {
    currentTurn = value;
  },

  setCurrentPlayer: (value) => {
    currentPlayer = value;
  },

  resetBattleRuntime: () => {
    currentTurn = 1;
    currentPlayer = "A";
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
    battleNotice = "";
    currentActionHeader = "";
    currentActionLabel = "";
    pendingChoice = null;
  },

  getUnitButtons: () => unitButtons,
  getSelectedUnitsPreview: () => selectedUnitsPreview,

  resetRandomMatchState,
  markOnlinePlayerLeft,
  showScreen
});
randomMatchController = createRandomMatchController({
  getScreens: () => screens,
  getBattleMode: () => battleMode,
  setBattleMode: (value) => { battleMode = value; },

  getPlayerProfile: () => playerSession.profile,
  getTitleName,

  isOnlineEnabled: () => onlineState.enabled,

  getOnlineRoomStatus: () => onlineRoomStatus,
  getCreateOnlineRoomBtn: () => createOnlineRoomBtn,

  showScreen,
  showPopup,

  createRoomId,
  writeRoom,
  buildInitialRoomData,

  cleanupOldRandomMatch,
  writeRandomMatchWaiting,
  updateRandomMatchWaiting,
  removeRandomMatchWaiting,
  readRandomMatchWaiting,
  listenRandomMatchWaiting,
  writeRandomMatchSession,
  updateRandomMatchSession,
  listenRandomMatchSession,
  removeRandomMatchSession,
  writeRandomMatchAnnouncement,
  listenRandomMatchAnnouncement,

  abortCurrentBattleWithoutRecordForRandomMatch,

  enterRandomMatchedRoom: ({ roomId, playerSide }) => {
  onlineState.enabled = true;
  onlineState.roomId = roomId;
  onlineState.myPlayer = playerSide;
  onlineState.isHost = playerSide === "A";
  onlineState.lastAppliedActionId = 0;
  onlineState.isApplyingRemote = false;
onlineState.isSpectator = false;
  onlineSelectEntered = false;
  onlineBattleStarted = false;
  onlineBattleFinished = false;
  onlineActionSeq = 0;

  onlineRoomStatus.textContent = `ランダムマッチ成立。あなたはPLAYER ${playerSide}です。`;

  listenRoom(roomId, roomData => {
    if (!roomData) return;

    enterOnlineSelect();
    applyOnlineRoomData(roomData);
  });
  }
});
playerStatsUi = createPlayerStatsUi({
  getPlayerProfile: () => playerSession.profile,

  getUnitList: () => unitList,
  getTitleGroups: () => TITLE_GROUPS,
  getBossTrophyRules: () => BOSS_TROPHY_RULES,

  getTitleName,
  getUnitNameById,
  getUnitTrophyText,
  getFavoriteUnitIds,
  getTitleConditionText,

  updatePlayerAchievements,
  saveCurrentPlayerProfile,
  updatePlayerCardUi,
  readAccountListForViewer,
  showPopup
});
battleInitController = createBattleInitController({
  createBattleState,
  createTeam,
  resetActionCount,

  getPlayerAState: () => playerAState,
  getPlayerBState: () => playerBState,

  setPlayerAState: (value) => {
    playerAState = value;
  },

  setPlayerBState: (value) => {
    playerBState = value;
  },

  setTeamA: (value) => {
    teamA = value;
  },

  setTeamB: (value) => {
    teamB = value;
  },

  setCurrentTurn: (value) => {
    currentTurn = value;
  },

  setCurrentPlayer: (value) => {
    currentPlayer = value;
  },

  clearCurrentAttackState: () => {
    currentAttack = [];
    currentAttackContext = null;
    currentAttackContexts = [];
  },

  setBattleNotice: (value) => {
    battleNotice = value || "";
  },

  setCurrentAction,

  clearPendingChoice,

  setTestMode: (value) => {
    isTestMode = value;
  },

  setSelectingPlayer: (value) => {
    selectingPlayer = value;
  },

  setSelectedUnitA: (value) => {
    selectedUnitA = value;
  },

  setSelectedUnitB: (value) => {
    selectedUnitB = value;
  },

  applyBattleDisplayNames,
  redrawBattleBoards,
  updateDebugButtonVisibility,
  showScreen
});
gameSetup = createGameSetup({
  units,
  bosses: bossList,
  cpus: cpuList,
  cpuBeginnerList,
  debugUnits: debugUnitList,
  canUseDebugUnit,
  unitButtons,
  selectGuide,
  selectedUnitsPreview,
confirmSelectedUnitBtn,
backFromSelectBtn,
getPendingSelectedUnit: () => pendingSelectedUnit,
setPendingSelectedUnit: (unit) => { pendingSelectedUnit = unit; },
getExtraUnlockedUnits: () => extraUnlockedUnits,
setExtraUnlockedUnits: (units) => { extraUnlockedUnits = units; },

showTitle: () => {
  showTitle();
},
  onSelectUnit: (unit) => {
    if (!onlineState.enabled) return false;

    const playerKey = onlineState.myPlayer;
    if (playerKey !== "A" && playerKey !== "B") return false;

    updateRoom(onlineState.roomId, {
      [`players/${playerKey}/unitId`]: unit.id,
      [`players/${playerKey}/ready`]: true,
      "meta/updatedAt": Date.now()
    });

    if (playerKey === "A") {
      selectedUnitA = unit;
    } else {
      selectedUnitB = unit;
    }

    updateSelectUi();
    return true;
  },

  getBattleMode: () => battleMode,
  

  isTeamBattleMode,
  isChallengeMode,

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
    return battleInitController.init1v1(unitA, unitB);
  },

  init2v2: (unitsA, unitsB) => {
    return battleInitController.init2v2(unitsA, unitsB);
  },

  initChallenge1v1: (unitA, bossUnit) => {
    return battleInitController.initChallenge1v1(unitA, bossUnit);
  },

  initChallenge2v2: (unitsA, bossUnits) => {
    return battleInitController.initChallenge2v2(unitsA, bossUnits);
  }
});

twoVtwoHelpers = create2v2Helpers({
  getBattleMode: () => battleMode,
  getTeam
});
twoVtwoAdapter = create2v2Adapter({
  isTeamBattleMode,
  getTeam,
  getUnifiedEvade,
  consumeUnifiedEvade
});
twoVtwoActions = create2v2Actions({
  getBattleMode: () => battleMode,
isTeamBattleMode,

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
twoVtwoAdapter,
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


loadUnitButtons();
bindMainEvents({
  setBattleMode: (value) => {
    battleMode = value;
  },
  spectateOnlineRoom,
startOnline1v1Btn,
  startOnline2v2Btn,
  createOnlineRoomBtn,
  joinOnlineRoomBtn,
  backFromOnlineRoomBtn,
  
  showScreen,
  showPopup,
  showTitle,

  onlineRoomController,
  localModeController,
  twoVtwoActions,
  playerAccountUi,

  simulateSlot,
  endTurn,
  toggleTestMode,
  renderPlayerStatsPanel
});
restorePlayerSession().then(() => {
  syncExtraUnlockedUnitsFromProfile();
  updatePlayerCardUi();
  updateDebugButtonVisibility();
  ensureRandomMatchUi();
  bootOnlineFromUrl();
  listenRandomMatchAnnouncementsOnceReady();
});
