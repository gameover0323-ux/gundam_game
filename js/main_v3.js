/*
このファイルは関数呼び出し入口にのみ基本利用したいため、
新規コード追加の際にこのファイルに入口以上の機能を増やしたくありません。
このファイルを弄る場合は入口設置にとどめ、
新たなファイルを作成して機能を追加してください。
…って描いてあってもガン無視して入れちゃうんだろうな。また後で私に
ガン無視して機能入れすぎですって言われてやっとこの文面見て反省するんだろうけど、
そういうとこだぞ。お前がこのファイルを超モンスター級の行数にして神でも読めないファイルにしたんだからな。
整理できないならもうここに入口以上の機能増やすなよ。
*/

import { bindMainEvents } from "./js_main_event_bindings.js";
import { createBattleRuntimeAccessors } from "./js_battle_runtime_accessors.js";
import { createBattleInitController } from "./js_battle_init_controller.js";
import { createResetController } from "./js_reset_controller.js";
import { createUnitLookupController } from "./js_unit_lookup_controller.js";
import { createTurnActionController } from "./js_turn_action_controller.js";
import { createCpuTurnGuard } from "./js_cpu_turn_guard.js";
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
  readSpectatableRooms,
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
  cleanupOldRandomMatch,
  submitFeedback,
readFeedbackList,
deleteFeedback
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
  executeUnitModifyEvadeAttempt,
  getCriticalRate,
  spendEvadeForCritical,
  tickCriticalBoosts,
  rollCritical
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
import { create2v2TauntController } from "./js_2on2_taunt_controller.js";
import { create2v2BreakthroughController } from "./js_2on2_breakthrough_controller.js";
import { createOnline2v2RoomController } from "./js_online_2v2_room_controller.js";
import { createOnline2v2ActionSync } from "./js_online_2v2_action_sync.js";

import { createBattleFlow } from "./js_battle_flow.js";

import { createAttackResolution } from "./js_attack_resolution.js";

import { createUiController } from "./js_ui_controller.js";

import { createGameSetup } from "./js_game_setup.js";

import { createActionLayer } from "./js_action_layer.js";

import { createFeedbackForm } from "./js_feedback_form.js";
import { createSpecTutorialController } from "./js_spec_tutorial_controller.js";
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
let feedbackForm = null;
let specTutorialController = null;
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
let cpuTurnGuard = null;
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
let twoVtwoTauntController = null;
let twoVtwoBreakthroughController = null;
let uiController = null;

let online2v2RoomController = null;
let online2v2ActionSync = null;

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
function renderFeedbackViewer() {
  return feedbackForm.renderFeedbackViewer();
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
function enterRandomMatchedRoom(params) {
  return randomMatchController.enterRandomMatchedRoom(params);
}
function spectateOnlineRoom() {
  return onlineSpectatorController.spectateOnlineRoom();
}

function showRandomSpectateRooms() {
  return onlineSpectatorController.showRandomSpectateRooms();
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
  const team = getTeam(playerKey);
  if (!team || !twoVtwoHelpers) return;

  if (pendingChoice || currentAttack.length > 0) {
    showPopup("QTE中・選択中は型を切り替えられません");
    return;
  }

 if (team.modeChangeLockedThisTurn) {
    showPopup("スロット行動後はこのターン中、型を切り替えられません");
    return;
  }

  if (
    twoVtwoTauntController &&
    twoVtwoTauntController.isTeamModeLocked(playerKey)
  ) {
    showPopup("挑発・決戦中は統合型へ切り替えられません");
    return;
  }

  if (team.mode === "unified") {
    twoVtwoHelpers.exitUnified(team);
  } else {
    twoVtwoHelpers.enterUnified(team);
  }

  redrawBattleBoards();
}

function createTeam(unit1, unit2) {
  return {
    unit1: createBattleState(unit1),
    unit2: createBattleState(unit2),
    mode: "split",
    activeUnitKey: "unit1",
    focusUnitKey: "unit1",
    modeChangeLockedThisTurn: false,
    tauntState: {
      tauntTargetPlayer: null,
      tauntTargetUnitKey: null,
      tauntOwnerPlayer: null,
      tauntTurns: 0,
      duelActive: false,
      duelAUnitKey: null,
      duelBUnitKey: null,
      duelTurns: 0,
      cooldown: 0,
      disabledThisTurn: false
    },
    unified: {
      baseHpA: 0,
      baseHpB: 0,
      totalDamage: 0,
      healA: 0,
      healB: 0,
      baseActionCount: 1,
      actionCount: 1
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
function zeroUnifiedEvade(team) {
  return twoVtwoHelpers.zeroUnifiedEvade(team);
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

function publishOnlineCriticalBoostAction(ownerPlayer) {
  return onlineActionSync.publishOnlineCriticalBoostAction(ownerPlayer);
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

function applyOnlineAction(action, battleSnapshot = null) {
  return onlineActionSync.applyOnlineAction(action, battleSnapshot);
}
function applyOnline2v2Action(action, battleSnapshot = null) {
  return online2v2ActionSync.applyOnline2v2Action(action, battleSnapshot);
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
  const debugAllowed = canUseTestMode();

  const btn = document.getElementById("toggleTestModeBtn");
  if (btn) {
    btn.style.display = debugAllowed ? "" : "none";
  }

  if (specTutorialController?.updateVisibility) {
    specTutorialController.updateVisibility();
  }
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
function canExecuteSpecialForPlayer(playerKey, special, stateOverride = null) {
  return specialActionController.canExecuteSpecialForPlayer(playerKey, special, stateOverride);
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
  function canOperateCriticalBoost() {
    if (isOnlineSpectator()) return false;

    if (onlineState.enabled && onlineState.myPlayer !== playerKey) {
      return false;
    }

    if (currentPlayer !== playerKey) {
      return false;
    }

    if (isChallengeMode() && playerKey === "B") {
      return false;
    }

    return true;
  }

  return {
    onSlotClick: (slot) => showPopup(slot.desc),
    onSpecialDesc: (special) => showPopup(special.desc),
    onSpecialExec: (specialKey) => executeSpecial(playerKey, specialKey),
    canExecuteSpecial: (special, specialKey, stateOverride = null) =>
      canExecuteSpecialForPlayer(playerKey, special, stateOverride),

    getCriticalRate: (state) => getCriticalRate(state),

    onCriticalBoost: (state) => {
  if (!canOperateCriticalBoost()) {
    showPopup("自機のみ操作可能");
    return;
  }

  if (!state) return;

  const changed = spendEvadeForCritical(state);
  if (!changed) {
    showPopup("回避が足りません");
    return;
  }

  publishOnlineCriticalBoostAction(playerKey);
  redrawBattleBoards();
    }
  };
}

function build2v2RenderHandlers(playerKey) {
  const isBossSide = isChallengeMode() && playerKey === "B";

  function canOperateOnline2v2Side() {
    if (isOnlineSpectator()) return false;

    if (battleMode === "online2v2" && onlineState.myPlayer !== playerKey) {
      return false;
    }

    return true;
  }

  function canOperateCriticalBoost() {
    if (!canOperateOnline2v2Side()) return false;

    if (currentPlayer !== playerKey) {
      return false;
    }

    if (isBossSide) {
      return false;
    }

    return true;
  }

  function canOperateSideButton() {
    if (!canOperateOnline2v2Side()) {
      showPopup("自機のみ操作可能");
      return false;
    }

    return true;
  }

  return {
    currentPlayer,
    playerKey,
    canChangeFocus:
      isBossSide
        ? false
        : canOperateOnline2v2Side() &&
          canChangeFocus(playerKey) &&
          (!twoVtwoTauntController || twoVtwoTauntController.canChangeFocus(playerKey)),

    canUseTauntSystem: () =>
      canOperateOnline2v2Side() &&
      (twoVtwoTauntController ? twoVtwoTauntController.canUse(playerKey) : false),

    getTauntButtonLabel: () =>
      twoVtwoTauntController ? twoVtwoTauntController.getButtonLabel(playerKey) : "挑発",

    isTauntTarget: (unitKey) =>
      twoVtwoTauntController ? twoVtwoTauntController.isTauntTarget(playerKey, unitKey) : false,

    isDuelTarget: (unitKey) =>
      twoVtwoTauntController ? twoVtwoTauntController.isDuelTarget(playerKey, unitKey) : false,

    onTauntSystemButton: () => {
      if (!canOperateSideButton()) return;

      if (twoVtwoTauntController) {
        twoVtwoTauntController.handleButton(playerKey);
      }
    },

    onToggleTeamMode: () => {
      if (!canOperateSideButton()) return;

      if (currentPlayer !== playerKey) {
        showPopup("型変更は自分ターン中のみ可能");
        return;
      }

      toggleTeamMode(playerKey);
    },

    onSwitchActiveUnit: (unitKey) => {
      if (!canOperateSideButton()) return;

      const team = getTeam(playerKey);
      if (!team || !team[unitKey]) return;

      setActiveUnit(playerKey, unitKey);
      redrawBattleBoards();
    },

    onSwitchFocusUnit: (unitKey) => {
      if (!canOperateSideButton()) return;

      const team = getTeam(playerKey);
      if (!team || !team[unitKey]) return;

      if (!canChangeFocus(playerKey)) {
        showPopup("フォーカス変更は自分ターン中、かつQTE中でない時のみ可能");
        return;
      }

      if (
        twoVtwoTauntController &&
        !twoVtwoTauntController.canChangeFocus(playerKey)
      ) {
        showPopup("決戦中はフォーカス機体を変更できません");
        return;
      }

      setFocusUnit(playerKey, unitKey);
      redrawBattleBoards();
    },

    onSlotClick: (slot) => showPopup(slot.desc),
    onSpecialDesc: (special) => showPopup(special.desc),
    onSpecialExec: (specialKey) => {
      if (!canOperateSideButton()) return;
      executeSpecial(playerKey, specialKey);
    },
    canExecuteSpecial: (special, specialKey, stateOverride = null) =>
      canOperateOnline2v2Side() &&
      canExecuteSpecialForPlayer(playerKey, special, stateOverride),

    getCriticalRate: (state) => getCriticalRate(state),

    onCriticalBoost: (state) => {
      if (!canOperateCriticalBoost()) {
        showPopup("自機のみ操作可能");
        return;
      }

      if (!state) return;

      spendEvadeForCritical(state);
      redrawBattleBoards();
    }
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
function selectOnlineUnit(unit) {
  return onlineRoomController.selectOnlineUnit(unit);
}
function getOnlineProfilePatch(playerKey) {
  return onlineRoomController.getOnlineProfilePatch(playerKey);
}

function bootOnlineFromUrl() {
  if (online2v2RoomController?.bootOnline2v2FromUrl?.()) {
    return true;
  }

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


function init2v2(unitsA, unitsB) {
  return battleInitController.init2v2(unitsA, unitsB);
}

function initChallenge1v1(unitA, bossUnit) {
  return battleInitController.initChallenge1v1(unitA, bossUnit);
}

function initChallenge2v2(unitsA, bossUnits) {
  return battleInitController.initChallenge2v2(unitsA, bossUnits);
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
feedbackForm = createFeedbackForm({
  getPlayerProfile: () => playerSession.profile,
  submitFeedback,
  readFeedbackList,
  deleteFeedback,
  renderAccountListPanel,
  showPopup
});

feedbackForm.ensureFeedbackButton();
specTutorialController = createSpecTutorialController({
  canUseDebug: canUseTestMode,
  getPlayerProfile: () => playerSession.profile,
  showPopup
});
specTutorialController.ensureButton();
specTutorialController.updateVisibility();
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
isOnlineSpectator,
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
twoVtwoHelpers = create2v2Helpers({
  getBattleMode: () => battleMode,
  getTeam
});

twoVtwoAdapter = create2v2Adapter({
  isTeamBattleMode,
  getTeam,
  getUnifiedEvade,
  consumeUnifiedEvade,
  zeroUnifiedEvade
});

twoVtwoTauntController = create2v2TauntController({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,
  getOpponentPlayer,
  getTeam,
  exitUnified: (team) => twoVtwoHelpers.exitUnified(team),
  hasPendingChoice: () => !!pendingChoice,
  hasCurrentAttack: () => currentAttack.length > 0,
  appendBattleNotice,
  showPopup,
  redrawBattleBoards,
  openBreakthrough: (options = {}) => {
    if (twoVtwoBreakthroughController) {
      twoVtwoBreakthroughController.renderBetChoice(options);
      return;
    }

    showPopup("打破システムを参照できません");
  }
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
  updateRoom,
  listenRoom,
  readSpectatableRooms,
  getPlayerProfile: () => playerSession.profile,
  getUnitNameById,
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
  spendEvadeForCritical,
  ensureActionState,
  consumeActionCount,
  startSlotAction,
  redrawBattleBoards,
  applyOnlineBattleSnapshot,

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

online2v2ActionSync = createOnline2v2ActionSync({
  isOnlineEnabled: () => onlineState.enabled,
  getBattleMode: () => battleMode,
  getOnlineRoomId: () => onlineState.roomId,
  getOnlineMyPlayer: () => onlineState.myPlayer,

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

  getCurrentTurn: () => currentTurn,
  setCurrentTurn: (value) => {
    currentTurn = value;
  },

  getCurrentPlayer: () => currentPlayer,
  setCurrentPlayer: (value) => {
    currentPlayer = value;
  },

  getTeam,
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

  getCurrentAttack: () => currentAttack,
  setCurrentAttack: (value) => {
    currentAttack = value;
  },

  getCurrentAttackContext: () => currentAttackContext,
  setCurrentAttackContext: (value) => {
    currentAttackContext = value;
  },

  getCurrentAttackContexts: () => currentAttackContexts,
  setCurrentAttackContexts: (value) => {
    currentAttackContexts = value;
  },

  getBattleNotice: () => battleNotice,
  setBattleNotice: (value) => {
    battleNotice = value;
  },

  getCurrentActionHeader: () => currentActionHeader,
  setCurrentActionHeader: (value) => {
    currentActionHeader = value;
  },

  getCurrentActionLabel: () => currentActionLabel,
  setCurrentActionLabel: (value) => {
    currentActionLabel = value;
  },

  executeTeamSlotRaw: () => twoVtwoActions.executeTeamSlot(),
  executeSingleTeamSlotRaw: (unitKey) => twoVtwoActions.executeSingleTeamSlot(unitKey),

  takeHitRaw: (index) => attackResolution.takeHit(index),
  evadeAttackRaw: (index) => attackResolution.evadeAttack(index),
  supportDefenseAttackRaw: (index) => attackResolution.supportDefenseAttack(index),

  checkBattleEnd,
  finishBattle,
  endTurnRaw: () => battleFlow.endTurn(),

  redrawBattleBoards,
  renderAttackChoices
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

  twoVtwoAdapter,

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
  twoVtwoAdapter,
  twoVtwoTauntSystem: twoVtwoTauntController,

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
  resolveEvadeAttack,

  rollCritical
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
  publishOnlineQteAction: (kind, index) => {
    if (battleMode === "online2v2") {
      online2v2ActionSync.publishOnline2v2QteAction(kind, index);
      return;
    }

    publishOnlineQteAction(kind, index);
  },
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
  resolveEvadeAttack,

  rollCritical
});
specialActionController = createSpecialActionController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,
  isOnlineSpectator,
  getCurrentPlayer: () => currentPlayer,
  getCurrentAttack: () => currentAttack,
  getCurrentAttackContext: () => currentAttackContext,
  getCurrentAttackContexts: () => currentAttackContexts,

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
  twoVtwoTauntSystem: twoVtwoTauntController,

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
  appendBattleNotice,
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
tickCriticalBoosts,
  showPopup,
  getCurrentAttack,
renderAttackChoices
});

cpuTurnGuard = createCpuTurnGuard({
  getBattleMode: () => battleMode,
  isTeamBattleMode,
  getTeam,
  getPlayerState
});

twoVtwoBreakthroughController = create2v2BreakthroughController({
  getBattleMode: () => battleMode,
  getTeam,
  getOpponentPlayer,
  getRollableSlotKeys,
  getSlotByKey,
  getSlotNumberFromKey,
  twoVtwoAdapter,
  twoVtwoTauntController,
  clampTeamEvadeToMax: (team) => {
    battleFlow.clampTeamEvadeToMax(team);
  },
  setCurrentPlayer: (value) => {
    currentPlayer = value;
  },
  redrawBattleBoards,
  showPopup
});
turnActionController = createTurnActionController({
  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,
  isOnlineSpectator,
  getCurrentPlayer: () => currentPlayer,

  shouldBlockManualEndTurn: (playerKey) =>
    cpuTurnGuard ? cpuTurnGuard.shouldBlockManualEndTurn(playerKey) : false,

  getManualEndTurnBlockMessage: () =>
    cpuTurnGuard ? cpuTurnGuard.getBlockMessage() : "CPUの行動権が残っています。",

  executeSlotRaw: () => battleFlow.executeSlot(),
  simulateSlotRaw: () => battleFlow.simulateSlot(),
  endTurnRaw: () => battleFlow.endTurn(),

  publishOnlineEndTurnAction: (actorPlayer) => {
    if (battleMode === "online2v2") {
      online2v2ActionSync.publishOnline2v2EndTurnAction(actorPlayer);
      return;
    }

    publishOnlineEndTurnAction(actorPlayer);
  },
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
  getOnlineRoomId: () => onlineState.roomId,
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
  showPopup,

  enterRandomMatchedRoom
});

online2v2RoomController = createOnline2v2RoomController({
  getPlayerProfile: () => playerSession.profile,

  getBattleMode: () => battleMode,
  setBattleMode: (value) => {
    battleMode = value;
  },

  getOnlineRoomIdInput: () => onlineRoomIdInput,
  getOnlineRoomStatus: () => onlineRoomStatus,
  getOnlineInviteUrl: () => onlineInviteUrl,

  isOnlineEnabled: () => onlineState.enabled,
  getOnlineRoomId: () => onlineState.roomId,
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

  setSelectingPlayer: (value) => {
    selectingPlayer = value;
  },

  setSelectedUnitA: (value) => {
    selectedUnitA = value;
  },

  setSelectedUnitB: (value) => {
    selectedUnitB = value;
  },

  getTeamA: () => teamA,
  setTeamA: (value) => {
    teamA = value;
  },

  getTeamB: () => teamB,
  setTeamB: (value) => {
    teamB = value;
  },

  createRoomId,
  writeRoom,
  readRoom,
  updateRoom,
  listenRoom,
  buildInitialRoomData,
  cleanupOldRooms,

  getUnitById,
  updateSelectUi,
  applyOnline2v2Action,

  renderOnlineExtraUi,
  applyOnlinePeaceRequest,
  applyOnlineMetaResult,
  saveOnlineEncounteredPlayer,

  init2v2,

  redrawBattleBoards,
  ensureOnlineBattleExtraUi,
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
  showPopup,
  renderFeedbackViewer
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
  if (battleMode === "online2v2") {
    return online2v2RoomController.selectOnline2v2Unit(unit);
  }

  if (String(battleMode).startsWith("online")) {
    return selectOnlineUnit(unit);
  }

  return false;
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

  onOnline2v2SlotAction: (ownerPlayer, slotMode = "team", unitKey = null) => {
    if (battleMode === "online2v2") {
      online2v2ActionSync.publishOnline2v2SlotAction(ownerPlayer, slotMode, unitKey);
    }
  },

  executeSlot
});


loadUnitButtons();
bindMainEvents({
  getBattleMode: () => battleMode,
  getCurrentPlayer: () => currentPlayer,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  setBattleMode: (value) => {
    battleMode = value;
  },

  spectateOnlineRoom,
  showRandomSpectateRooms,
  startOnline1v1Btn,
  startOnline2v2Btn,
  createOnlineRoomBtn,
  joinOnlineRoomBtn,
  backFromOnlineRoomBtn,
  
  showScreen,
  showPopup,
  showTitle,

  onlineRoomController,
  online2v2RoomController,
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
