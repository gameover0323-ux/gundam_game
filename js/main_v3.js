import { createBattleOutcomeController } from "./js_battle_outcome_controller.js";
import { createPlayerAccountUi } from "./js_player_account_ui.js";
import { createLocalModeController } from "./js_local_mode_controller.js";
import { createOnlineRoomController } from "./js_online_room_controller.js";
import { createBattleRecordController } from "./js_battle_record_controller.js";
import { createOnlineActionSync } from "./js_online_action_sync.js";
import { createOnlineBattleUi } from "./js_online_battle_ui.js";
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

startOnline1v1Btn.addEventListener("click", () => {
  battleMode = "online1v1";
  showScreen("onlineRoom");
});

startOnline2v2Btn.addEventListener("click", () => {
  showPopup("オンライン2on2はオンライン1on1安定後に実装予定です");
});

createOnlineRoomBtn.addEventListener("click", () => {
  onlineRoomController.createOnlineRoom();
});
joinOnlineRoomBtn.addEventListener("click", () => {
  onlineRoomController.joinOnlineRoom();
});

backFromOnlineRoomBtn.addEventListener("click", () => {
  showTitle();
});

document.getElementById("start1v1Btn").addEventListener("click", () => {
  localModeController.startLocalMode("1v1");
});

document.getElementById("start2v2Btn").addEventListener("click", () => {
  localModeController.startLocalMode("2v2");
});

document.getElementById("startChallenge1v1Btn").addEventListener("click", () => {
  localModeController.startLocalMode("challenge1v1");
});

document.getElementById("startChallenge2v2Btn").addEventListener("click", () => {
  localModeController.startLocalMode("challenge2v2");
});

document.getElementById("startVsCpu1v1Btn").addEventListener("click", () => {
  localModeController.startLocalMode("vscpu1v1");
});

document.getElementById("startVsCpu2v2Btn").addEventListener("click", () => {
  localModeController.startLocalMode("vscpu2v2");
});

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
let twoVtwoCore = null;
let battleRecordController = null;
let onlineRoomController = null;
let localModeController = null;
let playerAccountUi = null;
let battleOutcomeController = null;
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
  if (!unit) return "";
  return `${unit.name}${getUnitTrophyText(profile, unit.id)}`;
}

function applyBattleDisplayNames() {
  const profile = playerSession.profile;

  if (playerAState) {
    playerAState.displayName = getUnitDisplayNameWithTrophy(playerAState, profile);
  }

  if (playerBState) {
    playerBState.displayName = getUnitDisplayNameWithTrophy(playerBState, null);
  }

  if (teamA) {
    if (teamA.unit1) teamA.unit1.displayName = getUnitDisplayNameWithTrophy(teamA.unit1, profile);
    if (teamA.unit2) teamA.unit2.displayName = getUnitDisplayNameWithTrophy(teamA.unit2, profile);
  }

  if (teamB) {
    if (teamB.unit1) teamB.unit1.displayName = getUnitDisplayNameWithTrophy(teamB.unit1, null);
    if (teamB.unit2) teamB.unit2.displayName = getUnitDisplayNameWithTrophy(teamB.unit2, null);
  }
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
  cleanupOnlineBattleUi();
  onlineEncounterSaved = false;
currentOnlineOpponentPlayerId = "";
}
function resetLocalSelectionAndBattleState() {
  selectingPlayer = "A";
  selectedUnitA = null;
  selectedUnitB = null;
  pendingSelectedUnit = null;

  teamA = null;
  teamB = null;
  playerAState = null;
  playerBState = null;

  currentTurn = 1;
  currentPlayer = "A";
  currentAttack = [];
  currentAttackContext = null;
  currentAttackContexts = [];
  battleNotice = "";
  currentActionHeader = "";
  currentActionLabel = "";
  pendingChoice = null;

  if (unitButtons) unitButtons.innerHTML = "";
  if (selectedUnitsPreview) selectedUnitsPreview.innerHTML = "";
}
function cleanupOnlineBattleUi() {
  document.getElementById("onlineTopPlayerHud")?.remove();
  document.getElementById("onlineBattleExtraArea")?.remove();
  document.getElementById("onlinePeaceSurrenderBox")?.remove();
}
function showTitle() {
  resetRandomMatchState();
  if (
  onlineState.enabled &&
  onlineState.roomId &&
  onlineState.myPlayer &&
  onlineBattleStarted &&
  !onlineBattleFinished
) {
  markOnlinePlayerLeft();
}

  cleanupOnlineBattleUi();
  resetOnlineStateForLocalBattle();
  resetLocalSelectionAndBattleState();

  const popup = document.getElementById("popup");
  if (popup) {
    popup.style.display = "none";
    popup.innerHTML = "";
  }

  showScreen("title");
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
  return twoVtwoCore.toggleTeamMode(playerKey);
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
  const allUnits = [
  ...unitList,
  ...bossList,
  ...cpuList,
  ...cpuBeginnerList,
  ...debugUnitList
];

  const unit = allUnits.find(u => u.id === unitId);
  return unit ? unit.name : unitId;
}
function ensureAccountListButton() {
  return playerAccountUi.ensureAccountListButton();
}

function canExecuteSpecialForPlayer(playerKey, special) {
  if (!special || special.actionType === "auto") {
    return false;
  }

  if (pendingChoice) {
    return false;
  }

  const timing = special.timing || "self";
if (
  special.effectType === "jegan_request_arms" &&
  currentAttack.length > 0 &&
  playerKey !== currentPlayer
) {
  const actor = getPlayerState(playerKey);
  if (!actor) return false;

  const availability = executeUnitCanUseSpecial(actor, special.key, {
    ownerPlayer: playerKey,
    enemyPlayer: getOpponentPlayer(playerKey),
    currentAttackContext,
    currentAttack
  });

  return availability.allowed !== false;
}
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
  const isBossSide = isChallengeMode() && playerKey === "B";

  return {
    currentPlayer,
    playerKey,
    canChangeFocus: isBossSide ? false : canChangeFocus(playerKey),
    onToggleTeamMode: () => toggleTeamMode(playerKey),
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
  if (!requestChoice) return;

  pendingChoice = {
    ...requestChoice
  };

  redrawBattleBoards();
  renderPendingChoice();
}
function shouldCpuUseEvade(defender) {
  if (!defender) return false;
  if (defender.evade <= 0) return false;

  const evadeMax = Math.max(1, defender.evadeMax || 1);
  const rate = defender.evade / evadeMax;

  return Math.random() < rate;
}

function autoResolveBossQteIfNeeded() {
  if (!isChallengeMode()) return false;

  const context = currentAttackContext;
  if (!context) return false;

  if (context.ownerPlayer !== "A") return false;
  if (context.enemyPlayer !== "B") return false;
  if (!currentAttack || currentAttack.length === 0) return false;

  const attacker = getPlayerState("A");
  const defender = getCombatTargetState("B");
  if (!attacker || !defender) return false;

  const damageBySource = new Map();
  let totalDamage = 0;
  let hitCount = 0;

  while (currentAttack.length > 0) {
  const attack = currentAttack[0];
  const sourceLabel =
    attack?.sourceLabel || `${attacker.name} ${context.slotNumber}.${context.slotLabel}`;
  const baseDamage = attack ? attack.damage : 0;

  // まずCPU側の特殊回避判定を試す
  const customEvade = executeUnitModifyEvadeAttempt(
    defender,
    attacker,
    attack,
    {
      attacker,
      defender,
      currentAttack,
      attackIndex: 0,
      currentAttackContext: context,
      isCpuAutoResolve: true
    }
  );

  if (customEvade && customEvade.handled) {
    if (customEvade.ok) {
      defender.evade -= customEvade.consumeEvade || 0;
      currentAttack.splice(0, 1);
      context.evadeCount++;

      if (customEvade.message) {
        appendBattleNotice(customEvade.message);
      }

      continue;
    }
  } else {
// 通常回避を試す
if (shouldCpuUseEvade(defender)) {
  const evadeResult = resolveEvadeAttack({
    defender,
    currentAttack,
    attackIndex: 0
  });

  if (evadeResult.ok) {
    context.evadeCount++;
    continue;
  }
}
  }

  // 回避できなければ被弾
  const hitResult = resolveTakeHit({
    attacker,
    defender,
    currentAttack,
    attackIndex: 0,
    modifyTakenDamage: (d, a, atk, dmg) =>
      executeUnitModifyTakenDamage(d, a, atk, dmg)
  });

  if (!hitResult || !hitResult.cancelled) {
    const finalDamage =
      typeof hitResult?.finalDamage === "number"
        ? hitResult.finalDamage
        : baseDamage;

    totalDamage += finalDamage;
    hitCount++;

    damageBySource.set(
      sourceLabel,
      (damageBySource.get(sourceLabel) || 0) + finalDamage
    );

    if (hitResult?.damageMessage) {
      appendBattleNotice(hitResult.damageMessage);
    }

    const damagedResult = executeUnitOnDamaged(defender, attacker);
    if (damagedResult.message) {
      appendBattleNotice(damagedResult.message);
    }
  }
}

  context.hitCount += hitCount;

  finishCurrentAttackResolution();

if (checkBattleEnd()) {
    return true;
  }

  const detailLines = [...damageBySource.entries()].map(
    ([label, damage]) => `${label}<br>→ ${damage}ダメージ`
  );

  renderAttackLogText(
    `${currentActionHeader}<br>` +
    `${detailLines.join("<br>")}<br>` +
    `合計${totalDamage}ダメージを与えた。`
  );

  return true;
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
  if (autoResolveBossQteIfNeeded()) {
    clearBattleNotice();
    return;
  }

  renderAttackChoicesUI({
    currentAttack,
    battleNotice,
    currentActionHeader,
    currentActionLabel,
    onHit: (index) => takeHit(index),
    onEvade: (index) => evadeAttack(index),
    onSupportDefense: (index) => supportDefenseAttack(index),
    canSupportDefense: isTeamBattleMode()
  });

  clearBattleNotice();
}
function canOperateQteDefender() {
  if (!onlineState.enabled) return true;

  const context = currentAttackContext;
  if (!context) return false;

  return context.enemyPlayer === onlineState.myPlayer;
}

function takeHit(i) {
  if (!canOperateQteDefender()) {
    showPopup("防御側プレイヤーのみ操作できます");
    return;
  }

  const result = attackResolution.takeHit(i);
  checkBattleEnd();

  publishOnlineQteAction("hit", i);

  return result;
}

function evadeAttack(i) {
  if (!canOperateQteDefender()) {
    showPopup("防御側プレイヤーのみ操作できます");
    return;
  }

  const result = attackResolution.evadeAttack(i);

  publishOnlineQteAction("evade", i);

  return result;
}

function supportDefenseAttack(i) {
  if (!canOperateQteDefender()) {
    showPopup("防御側プレイヤーのみ操作できます");
    return;
  }

  const result = attackResolution.supportDefenseAttack(i);
  checkBattleEnd();

  publishOnlineQteAction("supportDefense", i);

  return result;
}
function finishCurrentAttackResolution() {
  return attackResolution.finishCurrentAttackResolution();
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
  if (onlineState.enabled && ownerPlayer !== onlineState.myPlayer) {
    showPopup("相手側の特殊行動は操作できません");
    return;
  }

  const result = actionLayer.executeSpecial(ownerPlayer, specialKey);

  publishOnlineSpecialAction(ownerPlayer, specialKey);

  return result;
}

function resolvePendingChoice(selectedValue) {
  const choice = pendingChoice;

  if (onlineState.enabled && choice) {
    const ownerPlayer = choice.ownerPlayer;

    if (ownerPlayer !== onlineState.myPlayer) {
      showPopup("選択権のあるプレイヤーのみ操作できます");
      return;
    }
  }

  publishOnlineChoiceAction(choice, selectedValue);

  return actionLayer.resolvePendingChoice(selectedValue);
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
  if (!canOperateOnlinePlayer()) {
    showPopup("相手のターンです");
    return;
  }

  return battleFlow.executeSlot();
}

function simulateSlot() {
  return battleFlow.simulateSlot();
}

function endTurn() {
  if (!canOperateOnlinePlayer()) {
    showPopup("相手のターンです");
    return;
  }

  const beforePlayer = currentPlayer;

  const result = battleFlow.endTurn();

if (onlineState.enabled && beforePlayer !== currentPlayer) {
  publishOnlineEndTurnAction(beforePlayer);
}

  return result;
}
  

let onlineEncounterSaved = false;
let currentOnlineOpponentPlayerId = "";
let onlineBattleStarted = false;
let onlineBattleFinished = false;
let onlineActionSeq = 0;
let onlineSelectEntered = false;


function getUnitById(unitId) {
  const allUnits = [
  ...unitList,
  ...bossList,
  ...cpuList,
  ...cpuBeginnerList,
  ...debugUnitList
];

  return allUnits.find(unit => unit.id === unitId) || null;
}
function syncExtraUnlockedUnitsFromProfile() {
  if (!playerSession.profile?.unlocks) {
    extraUnlockedUnits = [];
  } else {
    extraUnlockedUnits = Object.entries(playerSession.profile.unlocks)
      .filter(([, unlocked]) => unlocked)
      .map(([unlockKey]) => UNLOCKABLE_UNIT_MAP[unlockKey])
      .filter(Boolean)
      .map(unitId => getUnitById(unitId))
      .filter(Boolean);
  }


}

function abortCurrentBattleWithoutRecordForRandomMatch() {
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

  onlineBattleStarted = false;
  onlineBattleFinished = false;
  onlineSelectEntered = false;
  onlineActionSeq = 0;
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
  if (!onlineState.enabled) return true;
  return currentPlayer === onlineState.myPlayer;
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
onlineActionSync = createOnlineActionSync({
  isOnlineEnabled: () => onlineState.enabled,
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


battleFlow = createBattleFlow({
  getBattleMode: () => battleMode,
isTeamBattleMode,
isChallengeMode,
executeTeamSlot: () => twoVtwoActions.executeTeamSlot(),
executeCpuAutoSlotBatch,
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
onlineRoomController = createOnlineRoomController({
  getPlayerProfile: () => playerSession.profile,

  getOnlineRoomIdInput: () => onlineRoomIdInput,
  getOnlineRoomStatus: () => onlineRoomStatus,
  getOnlineInviteUrl: () => onlineInviteUrl,

  isOnlineEnabled: () => onlineState.enabled,
  getOnlineMyPlayer: () => onlineState.myPlayer,

  setOnlineState: ({ enabled, roomId, myPlayer, isHost }) => {
    onlineState.enabled = enabled;
    onlineState.roomId = roomId;
    onlineState.myPlayer = myPlayer;
    onlineState.isHost = isHost;
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
applyBattleDisplayNames();
    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "バトル開始待機中";
  updateDebugButtonVisibility();
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
applyBattleDisplayNames();
    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "バトル開始待機中";
  updateDebugButtonVisibility();
    showScreen("battle");
  },
    
  initChallenge1v1: (unitA, bossUnit) => {
    playerAState = createBattleState(unitA);
    playerBState = createBattleState(bossUnit);

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
applyBattleDisplayNames();
    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "チャレンジバトル開始";
   updateDebugButtonVisibility();
    showScreen("battle");
  },

  initChallenge2v2: (unitsA, bossUnits) => {
    teamA = createTeam(unitsA[0], unitsA[1]);

    teamB = {
      unit1: createBattleState(bossUnits[0]),
      unit2: bossUnits[1] ? createBattleState(bossUnits[1]) : null,

      mode: "split",
      activeUnitKey: "unit1",
      focusUnitKey: "unit1",

      unified: {
        baseHpA: 0,
        baseHpB: 0,
        totalDamage: 0,
        healA: 0,
        healB: 0
      }
    };

    playerAState = teamA.unit1;
    playerBState = teamB.unit1;

    resetActionCount(teamA.unit1);
    resetActionCount(teamA.unit2);
    resetActionCount(teamB.unit1);
    if (teamB.unit2) resetActionCount(teamB.unit2);

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
applyBattleDisplayNames();
    redrawBattleBoards();
    document.getElementById("attackLog").textContent = "2機チャレンジバトル開始";
   updateDebugButtonVisibility();
    showScreen("battle");
  }
});

twoVtwoHelpers = create2v2Helpers({
  getBattleMode: () => battleMode,
  getTeam
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
document.getElementById("playerLoginBtn")?.addEventListener("click", () => {
  playerAccountUi.handleLogin();
});

document.getElementById("playerRegisterBtn")?.addEventListener("click", () => {
  playerAccountUi.handleRegister();
});

document.getElementById("playerLogoutBtn")?.addEventListener("click", () => {
  playerAccountUi.handleLogout();
});
document.getElementById("playerStatsBtn")?.addEventListener("click", () => {
  renderPlayerStatsPanel();
});

document.getElementById("closePlayerStatsBtn")?.addEventListener("click", () => {
  const panel = document.getElementById("playerStatsPanel");
  if (panel) panel.style.display = "none";
});

loadUnitButtons();

restorePlayerSession().then(() => {
  syncExtraUnlockedUnitsFromProfile();
  updatePlayerCardUi();
  updateDebugButtonVisibility();
  ensureRandomMatchUi();
  bootOnlineFromUrl();
  listenRandomMatchAnnouncementsOnceReady();
});
