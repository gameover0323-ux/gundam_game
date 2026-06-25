import {
  renderPlayerState,
  renderPlayerState2v2
} from "../js/js_ui.js";

import { getStoryCreateUnit } from "./story_units.js";
import { training_machine } from "../js/js_units_training_machine.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomSlotNumber() {
  return Math.floor(Math.random() * 6) + 1;
}

function getForm(unit) {
  return unit?.forms?.[unit.defaultFormId || "normal"] || unit?.forms?.normal || {};
}

function getSlotLabel(slot) {
  return slot?.label || "未設定";
}

function getSlotDesc(slot) {
  return slot?.desc || slot?.detail || "詳細なし";
}

function buildAttackTags(attack) {
  const tags = [];
  if (attack.type === "shoot") tags.push("[射]");
  if (attack.type === "melee") tags.push("[格]");
  if (attack.cannotEvade) tags.push("[必]");
  if (attack.ignoreReduction) tags.push("[不]");
  if (attack.beam) tags.push("[ビ]");
  if (attack.criticalHit) tags.push("[会心]");
  return tags.join("");
}

function normalizeSpecials(rawSpecials) {
  const list = Array.isArray(rawSpecials) ? rawSpecials : [];
  const specials = {};
  const specialOrder = [];

  list.forEach((sp, index) => {
    const key = `special${index + 1}`;
    specials[key] = sp;
    specialOrder.push(key);
  });

  return { specials, specialOrder };
}

function createBattleState(unit, options = {}) {
  const form = getForm(unit);
  const normalizedSpecials = normalizeSpecials(form.specials);

  const hp = Number(form.hp || 0);
  const evadeMax = Number(form.evadeMax || 0);
  const energyMax = Number(form.storyEnergyMax || 0);

  const state = {
    id: unit.id,
    unitId: unit.id,
    name: form.name || unit.name,
    formId: unit.defaultFormId || "normal",

    hp,
    maxHp: hp,
    storyInternalHp: hp,
    storyDisplayHp: form.displayHp || null,

    evade: evadeMax,
    evadeMax,
    rollableSlotOrder: Array.isArray(form.rollableSlotOrder)
      ? [...form.rollableSlotOrder]
      : Array.isArray(form.ownedSlotOrder)
        ? [...form.ownedSlotOrder]
        : [...SLOT_KEYS],

    slots: clone(form.slots || {}),
    specials: clone(normalizedSpecials.specials),
    specialOrder: [...normalizedSpecials.specialOrder],

    storyEnergy: energyMax,
    storyEnergyMax: energyMax,

    storyCriticalRate: Number(form.criticalRate ?? options.defaultCriticalRate ?? 5),
    statusList: []
  };

  refreshStoryStatus(state);
  return state;
}

function refreshStoryStatus(state) {
  if (!state) return;

  const status = [];
  if (Number(state.storyEnergyMax || 0) > 0) {
    status.push(`EN ${state.storyEnergy}/${state.storyEnergyMax}`);
  }

  state.statusList = status;
}

function getHpText(state) {
  if (state?.storyDisplayHp) return state.storyDisplayHp;
  return `${state.hp}/${state.maxHp}`;
}

export function createStoryBattleEngine() {
  let root = null;

  let playerA = null;
  let playerB = null;

  let teamA = null;
  let teamB = null;
  let twoVtwoPhase = "taunt";

  let pendingAttack = null;
  let actionCount = 1;
  let turnCount = 1;

  let forcedPlayerSlots = [];
  let forcedEnemySlots = [];
  let allowedActions = new Set();
  let handlers = {};

  function emit(name, payload = {}) {
    if (typeof handlers[name] === "function") handlers[name](payload);
  }

  function on(name, handler) {
    handlers[name] = handler;
  }

  function clearHandlers() {
    handlers = {};
  }

  function allow(actions) {
    allowedActions = new Set(actions || []);
    refreshButtons();
  }

  function isAllowed(action) {
    if (allowedActions.size === 0) return true;
    return allowedActions.has(action);
  }

  function refreshButtons() {
    const buttonMap = [
      ["storyExecuteSlotBtn", "slot"],
      ["storyTeamSlotBtn", "teamSlot"],
      ["storyUnit1SlotBtn", "teamSingle"],
      ["storyUnit2SlotBtn", "teamSingle"],
      ["storySimulateBtn", "sim"],
      ["storyEndTurnBtn", "end"],
      ["storyNext2v2Btn", "next2v2"]
    ];

    buttonMap.forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      if (id === "storyEndTurnBtn") {
        btn.disabled = allowedActions.size > 0 && !(allowedActions.has("end") || allowedActions.has("endOnly"));
        return;
      }

      btn.disabled = allowedActions.size > 0 && !allowedActions.has(action);
    });

    document.querySelectorAll("#storyBattleRoot .criticalBoostBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("critical");
    });

    document.querySelectorAll("#storyBattleRoot .hitBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("hit");
    });

    document.querySelectorAll("#storyBattleRoot .evadeBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("evade");
    });

    document.querySelectorAll("#storyBattleRoot .supportDefenseBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("cover");
    });

    document.querySelectorAll("#storyBattleRoot .teamModeBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("style");
    });

    document.querySelectorAll("#storyBattleRoot .tauntSystemBtn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !(allowedActions.has("taunt") || allowedActions.has("duel"));
    });
  }

  function setLog(text) {
    const log = document.getElementById("storyAttackLog");
    if (log) log.textContent = String(text || "");
  }

  function setExtraPanel(html) {
    const panel = document.getElementById("storyBattleExtraPanel");
    if (panel) panel.innerHTML = html || "";
  }

  function clearHighlight() {
    document.querySelectorAll("#storyBattleRoot .story-highlighted").forEach(el => {
      el.classList.remove("story-highlighted");
    });
  }

  function setHighlight(selector) {
    clearHighlight();
    if (!selector) return;
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add("story-highlighted");
    });
  }

  function forceNextPlayerSlot(slotNumber) {
    forcedPlayerSlots.push(Number(slotNumber));
  }

  function forceNextEnemySlot(slotNumber) {
    forcedEnemySlots.push(Number(slotNumber));
  }

  function nextPlayerSlot() {
    return forcedPlayerSlots.length ? forcedPlayerSlots.shift() : randomSlotNumber();
  }

  function nextEnemySlot() {
    return forcedEnemySlots.length ? forcedEnemySlots.shift() : randomSlotNumber();
  }

  function makePlayerHandlers() {
    return {
      getCriticalRate: state => Number(state.storyCriticalRate ?? 5),

      onCriticalBoost: state => {
        if (!isAllowed("critical")) return;
        spendCritical(state);
      },

      onSlotClick: slot => {
        setLog(getSlotDesc(slot));
      },

      onSpecialDesc: special => {
        setLog(special?.desc || "詳細なし");
      },

      onSpecialExec: () => {
        setLog("チュートリアル中は特殊行動の実行を制限しています。");
      },

      canExecuteSpecial: () => false
    };
  }

  function make2v2Handlers(team, side) {
    return {
      getCriticalRate: state => Number(state?.storyCriticalRate ?? 5),

      onCriticalBoost: state => {
        if (!isAllowed("critical")) return;
        spendCritical(state);
      },

      onSlotClick: slot => {
        setLog(getSlotDesc(slot));
      },

      onSpecialDesc: special => {
        setLog(special?.desc || "詳細なし");
      },

      onSpecialExec: () => {
        setLog("チュートリアル中は特殊行動の実行を制限しています。");
      },

      canExecuteSpecial: () => false,

      canChangeFocus: true,

      onSwitchActiveUnit: unitKey => {
        team.activeUnitKey = unitKey;
        redraw2v2();
      },

      onSwitchFocusUnit: unitKey => {
        team.focusUnitKey = unitKey;
        redraw2v2();
      },

      onToggleTeamMode: () => {
        if (!isAllowed("style")) return;
        team.mode = team.mode === "unified" ? "separate" : "unified";
        redraw2v2();
        emit("style");
      },

      getTauntButtonLabel: () => {
        return twoVtwoPhase === "duelReady" && side === "A" ? "決戦" : "挑発";
      },

      onTauntSystemButton: () => {
        if (twoVtwoPhase === "duelReady") {
          if (!isAllowed("duel")) return;
          renderDuelChoice();
          emit("duel");
          return;
        }

        if (!isAllowed("taunt")) return;
        renderTauntChoice();
        emit("taunt");
      },

      isTauntTarget: unitKey => {
        return side === "B" && unitKey === "unit2" && twoVtwoPhase !== "taunt";
      },

      isDuelTarget: unitKey => {
        return side === "A" && unitKey === "unit1" && twoVtwoPhase === "duel";
      }
    };
  }

  function renderOneOnOneTraining({ root: targetRoot, free = false } = {}) {
    root = targetRoot || document.getElementById("storyModeRoot");
    if (!root) return;

    const proto = getStoryCreateUnit("proto_create_gundam");

    playerA = createBattleState(proto, { defaultCriticalRate: 5 });
    playerB = createBattleState(training_machine, { defaultCriticalRate: free ? 5 : 0 });

    if (playerB.storyDisplayHp) {
      playerB.hp = playerB.storyDisplayHp;
      playerB.maxHp = playerB.storyDisplayHp;
    }

    pendingAttack = null;
    actionCount = 1;
    turnCount = 1;
    forcedPlayerSlots = [];
    forcedEnemySlots = [];
    allowedActions = new Set();

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      ${styleBlock()}
      <div id="storyBattleRoot">
        <h2 id="storyTurnText">チャプター1 演習 1on1</h2>
        <h3 id="storyCurrentPlayer">PLAYER A</h3>

        <div class="container">
          <div class="player" id="storyPlayerA"></div>

          <div class="story-center-counters">
            <div class="story-counter-box">
              <div>TURN</div>
              <div id="storyTurnCounterValue">1</div>
            </div>
            <div class="story-counter-box story-action-counter">
              <div>行動</div>
              <div id="storyActionCounterValue">1</div>
            </div>
          </div>

          <div class="player" id="storyPlayerB"></div>
        </div>

        <div class="bottom">
          <div id="storyAttackLog">演習開始待機中</div>

          <button id="storyExecuteSlotBtn">スロット行動実行</button>
          <button id="storySimulateBtn">シミュレーション</button>
          <button id="storyEndTurnBtn">ターン終了</button>

          <div id="storyBattleExtraPanel"></div>
        </div>
      </div>
    `;

    redraw1v1();
    bind1v1Buttons();
    refreshButtons();
  }

  function renderTwoOnTwoTraining({ root: targetRoot, free = false } = {}) {
    root = targetRoot || document.getElementById("storyModeRoot");
    if (!root) return;

    const proto = getStoryCreateUnit("proto_create_gundam");

    const a1 = createBattleState(proto, { defaultCriticalRate: 5 });
    const a2 = createBattleState(proto, { defaultCriticalRate: 5 });
    const b1 = createBattleState(training_machine, { defaultCriticalRate: free ? 5 : 0 });
    const b2 = createBattleState(training_machine, { defaultCriticalRate: free ? 5 : 0 });

    a2.name = "プロトクリエイトガンダム 2番機";
    a2.evade = 1;
    a2.evadeMax = 1;
    a2.storyEnergy = 100;
    a2.storyEnergyMax = 100;
    a2.rollableSlotOrder = [...SLOT_KEYS].reverse();
    refreshStoryStatus(a2);

    b2.name = "トレーニングマシン 2番機";

    [b1, b2].forEach(unit => {
      if (unit.storyDisplayHp) {
        unit.hp = unit.storyDisplayHp;
        unit.maxHp = unit.storyDisplayHp;
      }
    });

    teamA = {
      mode: "separate",
      activeUnitKey: "unit1",
      focusUnitKey: "unit1",
      unit1: a1,
      unit2: a2,
      unified: {}
    };

    teamB = {
      mode: "separate",
      activeUnitKey: "unit1",
      focusUnitKey: "unit1",
      unit1: b1,
      unit2: b2,
      unified: {}
    };

    twoVtwoPhase = "taunt";
    pendingAttack = null;
    actionCount = 1;
    turnCount = 1;
    allowedActions = new Set();

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      ${styleBlock()}
      <div id="storyBattleRoot">
        <h2 id="storyTurnText">チャプター1 演習 2on2</h2>
        <h3 id="storyCurrentPlayer">PLAYER A</h3>

        <div class="container">
          <div class="player" id="storyPlayerA"></div>

          <div class="story-center-counters">
            <div class="story-counter-box">
              <div>TURN</div>
              <div id="storyTurnCounterValue">1</div>
            </div>
            <div class="story-counter-box story-action-counter">
              <div>行動</div>
              <div id="storyActionCounterValue">1</div>
            </div>
          </div>

          <div class="player" id="storyPlayerB"></div>
        </div>

        <div class="bottom">
          <div id="storyAttackLog">2on2演習開始待機中</div>

          <button id="storyTeamSlotBtn">スロット行動実行</button>
          <div id="storySingleTeamActionButtons">
            <button id="storyUnit1SlotBtn">1単独行動</button>
            <button id="storyUnit2SlotBtn">2単独行動</button>
          </div>
          <button id="storySimulateBtn">シミュレーション</button>
          <button id="storyEndTurnBtn">ターン終了</button>

          <div id="storyBattleExtraPanel"></div>
        </div>
      </div>
    `;

    redraw2v2();
    bind2v2Buttons();
    refreshButtons();
  }

  function redraw1v1() {
    if (!playerA || !playerB) return;

    refreshStoryStatus(playerA);
    refreshStoryStatus(playerB);

    const playerAContainer = document.getElementById("storyPlayerA");
    const playerBContainer = document.getElementById("storyPlayerB");

    if (playerAContainer) renderPlayerState(playerA, playerAContainer, "PLAYER A", makePlayerHandlers());
    if (playerBContainer) renderPlayerState(playerB, playerBContainer, "PLAYER B", makePlayerHandlers());

    const action = document.getElementById("storyActionCounterValue");
    if (action) action.textContent = String(actionCount);

    const turn = document.getElementById("storyTurnCounterValue");
    if (turn) turn.textContent = String(turnCount);

    refreshButtons();
  }

  function redraw2v2() {
    if (!teamA || !teamB) return;

    [teamA.unit1, teamA.unit2, teamB.unit1, teamB.unit2].forEach(refreshStoryStatus);

    const playerAContainer = document.getElementById("storyPlayerA");
    const playerBContainer = document.getElementById("storyPlayerB");

    if (playerAContainer) renderPlayerState2v2(teamA, playerAContainer, "PLAYER A", make2v2Handlers(teamA, "A"));
    if (playerBContainer) renderPlayerState2v2(teamB, playerBContainer, "PLAYER B", make2v2Handlers(teamB, "B"));

    const action = document.getElementById("storyActionCounterValue");
    if (action) action.textContent = String(actionCount);

    const turn = document.getElementById("storyTurnCounterValue");
    if (turn) turn.textContent = String(turnCount);

    refreshButtons();
  }

  function bind1v1Buttons() {
    document.getElementById("storyExecuteSlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("slot")) return;
      executePlayerSlot();
    });

    document.getElementById("storySimulateBtn")?.addEventListener("click", () => {
      if (!isAllowed("sim")) return;
      simulateSlot();
    });

    document.getElementById("storyEndTurnBtn")?.addEventListener("click", () => {
      if (isAllowed("endOnly")) {
        endOnly();
        return;
      }

      if (!isAllowed("end")) return;
      executeEnemyTurn();
    });
  }

  function bind2v2Buttons() {
    document.getElementById("storyTeamSlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSlot")) return;
      setLog("PLAYER A の行動\n1番機と2番機が同時にスロット行動を行いました。");
      emit("teamSlot");
    });

    document.getElementById("storyUnit1SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      setLog("PLAYER A 1番機の単独行動を選びました。");
      emit("teamSingle1");
    });

    document.getElementById("storyUnit2SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      setLog("PLAYER A 2番機の単独行動を選びました。");
      emit("teamSingle2");
    });

    document.getElementById("storySimulateBtn")?.addEventListener("click", () => {
      if (!isAllowed("sim")) return;
      setLog("2on2シミュレーション。チュートリアル中は詳細処理を省略しています。");
    });

    document.getElementById("storyEndTurnBtn")?.addEventListener("click", () => {
      if (!isAllowed("end")) return;
      renderStoryAttackChoicesUI({
        currentAttack: [
          {
            sourceLabel: "トレーニングマシン1番機の行動",
            damage: 5,
            type: "shoot",
            ignoreReduction: true
          },
          {
            sourceLabel: "トレーニングマシン2番機の行動",
            damage: 5,
            type: "melee",
            cannotEvade: true
          }
        ],
        currentActionHeader: "PLAYER B の行動",
        currentActionLabel: "1番機：3.演習属性攻撃 / 2番機：4.演習属性攻撃",
        onHit: () => {},
        onEvade: index => {
          if (!isAllowed("evade")) return;
          if (index === 0) {
            setLog("上の攻撃を回避しました。");
            emit("teamEvade");
          } else {
            setLog("必中属性のため回避できません。");
          }
        },
        onSupportDefense: () => {
          if (!isAllowed("cover")) return;
          setLog("援護防御が成立しました。パートナーが半分のダメージを肩代わりします。");
          emit("cover");
        },
        canSupportDefense: true
      });

      emit("teamEnemyTurn");
      refreshButtons();
    });
  }

  function simulateSlot() {
    const n = randomSlotNumber();
    const slot = playerA.slots?.[`slot${n}`];
    setLog(`シミュレーション：${n}.${getSlotLabel(slot)}`);
    emit("sim", { slotNumber: n, slot });
  }

  function executePlayerSlot() {
    if (pendingAttack) {
      setLog("先に相手の攻撃を処理してください。");
      return;
    }

    if (actionCount <= 0) {
      setLog("行動権がありません。ターン終了してください。");
      return;
    }

    const slotNumber = nextPlayerSlot();
    const slot = playerA.slots?.[`slot${slotNumber}`];
    const effect = slot?.effect || {};

    if (effect.type === "evade") {
      playerA.evade += Number(effect.amount || 0);
      setLog(`PLAYER A の行動\n${slotNumber}.${getSlotLabel(slot)}\n回避+${effect.amount || 0}`);
    } else if (effect.type === "heal") {
      playerA.hp = Math.min(playerA.maxHp, Number(playerA.hp || 0) + Number(effect.amount || 0));
      setLog(`PLAYER A の行動\n${slotNumber}.${getSlotLabel(slot)}\nHPを${effect.amount || 0}回復。`);
    } else if (effect.type === "attack") {
      const count = Number(effect.count || 1);
      let damage = Number(effect.damage || 0) * count;
      let result = "";

      if (!effect.cannotEvade && Number(playerB.evade || 0) >= count) {
        playerB.evade -= count;
        damage = 0;
        result = "\n相手は回避しました。";
      }

      playerB.storyInternalHp = Math.max(0, Number(playerB.storyInternalHp || 0) - damage);
      setLog(`PLAYER A の行動\n${slotNumber}.${getSlotLabel(slot)}\n${damage}ダメージ。${result}`);
    } else {
      setLog(`PLAYER A の行動\n${slotNumber}.${getSlotLabel(slot)}\n何も起きません。`);
    }

    actionCount = Math.max(0, actionCount - 1);
    redraw1v1();
    emit("playerSlot", { slotNumber, slot });
  }

  function executeEnemyTurn() {
    actionCount = 1;
    turnCount += 1;

    const slotNumber = nextEnemySlot();
    const slot = playerB.slots?.[`slot${slotNumber}`];
    const effect = slot?.effect || {};

    if (effect.type === "evade") {
      playerB.evade = Math.min(playerB.evadeMax, Number(playerB.evade || 0) + Number(effect.amount || 0));
      setLog(`トレーニングマシンの行動\n${slotNumber}.${getSlotLabel(slot)}\n回避が増えました。`);
      redraw1v1();
      emit("enemyTurn", { slotNumber, slot });
      return;
    }

    const count = Number(effect.count || 1);
    const attacks = Array.from({ length: count }, () => ({
      damage: Number(effect.damage || 0),
      type: effect.attackType || "shoot",
      beam: effect.beam === true,
      ignoreReduction: effect.ignoreReduction === true,
      cannotEvade: effect.cannotEvade === true,
      criticalHit: effect.criticalHit === true,
      sourceLabel: `トレーニングマシンの行動`
    }));

    pendingAttack = {
      slotNumber,
      slot,
      effect,
      attacks
    };

    renderStoryAttackChoicesUI({
      currentAttack: attacks,
      currentActionHeader: "トレーニングマシンの行動",
      currentActionLabel: `${slotNumber}.${getSlotLabel(slot)}`,
      onHit: index => {
        if (!isAllowed("hit")) return;
        resolveHit(index);
      },
      onEvade: index => {
        if (!isAllowed("evade")) return;
        resolveEvade(index);
      },
      canSupportDefense: false
    });

    redraw1v1();
    emit("enemyTurn", { slotNumber, slot });
    refreshButtons();
  }

  function resolveHit(index = 0) {
    if (!pendingAttack) return;

    const attack = pendingAttack.attacks[index];
    if (!attack) return;

    let damage = Number(attack.damage || 0);
    if (attack.criticalHit) damage *= 2;

    playerA.hp = Math.max(0, Number(playerA.hp || 0) - damage);
    pendingAttack.attacks.splice(index, 1);

    if (pendingAttack.attacks.length === 0) {
      pendingAttack = null;
      setLog(`被弾しました。${damage}ダメージ。`);
    } else {
      setLog(`被弾しました。${damage}ダメージ。\n残りの攻撃を処理してください。`);
    }

    redraw1v1();
    emit("hit", { damage });
  }

  function resolveEvade(index = 0) {
    if (!pendingAttack) return;

    const attack = pendingAttack.attacks[index];
    if (!attack) return;

    if (attack.cannotEvade) {
      setLog("必中属性のため回避できません。");
      return;
    }

    if (Number(playerA.evade || 0) <= 0) {
      setLog("回避ストックが足りません。");
      return;
    }

    playerA.evade -= 1;
    pendingAttack.attacks.splice(index, 1);

    if (pendingAttack.attacks.length === 0) {
      pendingAttack = null;
      setLog("回避しました。");
    } else {
      setLog("回避しました。\n残りの攻撃を処理してください。");
    }

    redraw1v1();
    emit("evade", { attack });
  }

  function spendCritical(state = playerA) {
    if (!state || Number(state.evade || 0) <= 0) {
      setLog("回避ストックがありません。");
      return;
    }

    const before = Number(state.storyCriticalRate ?? 5);
    state.evade -= 1;
    state.storyCriticalRate = before + 4;

    setLog(`会心率が${before}%→${state.storyCriticalRate}%になりました。`);
    redraw1v1();
    emit("critical", { before, after: state.storyCriticalRate });
  }

  function endOnly() {
    pendingAttack = null;
    actionCount = 1;
    turnCount += 1;
    setLog("ターンを進めました。");
    redraw1v1();
    emit("endOnly");
  }

  function renderStoryAttackChoicesUI({
    currentAttack,
    battleNotice,
    currentActionHeader,
    currentActionLabel,
    onHit,
    onEvade,
    onSupportDefense,
    canSupportDefense
  }) {
    const attackLog = document.getElementById("storyAttackLog");
    if (!attackLog) return;

    attackLog.innerHTML = "";

    if (battleNotice) {
      const notice = document.createElement("div");
      notice.style.color = "#ff6666";
      notice.style.fontWeight = "bold";
      notice.style.marginBottom = "4px";
      notice.innerHTML = battleNotice;
      attackLog.appendChild(notice);
    }

    if (currentActionHeader) {
      const header = document.createElement("div");
      header.style.fontWeight = "bold";
      header.textContent = currentActionHeader;
      attackLog.appendChild(header);
    }

    if (currentActionLabel) {
      const label = document.createElement("div");
      label.style.marginBottom = "4px";
      label.textContent = currentActionLabel;
      attackLog.appendChild(label);
    }

    let lastSourceLabel = null;

    currentAttack.forEach((attack, index) => {
      if (attack.sourceLabel && attack.sourceLabel !== lastSourceLabel) {
        const source = document.createElement("div");
        source.style.marginTop = "6px";
        source.style.fontWeight = "bold";
        source.textContent = attack.sourceLabel;
        attackLog.appendChild(source);
        lastSourceLabel = attack.sourceLabel;
      }

      const row = document.createElement("div");
      const supportButtonHtml = canSupportDefense && typeof onSupportDefense === "function"
        ? `<button class="supportDefenseBtn">援護防御</button>`
        : "";

      row.innerHTML = `
        ${index + 1}発目：${attack.damage}ダメージ ${buildAttackTags(attack)}
        <button class="hitBtn">被弾</button>
        <button class="evadeBtn">回避</button>
        ${supportButtonHtml}
      `;

      row.querySelector(".hitBtn")?.addEventListener("click", () => onHit?.(index));
      row.querySelector(".evadeBtn")?.addEventListener("click", () => onEvade?.(index));
      row.querySelector(".supportDefenseBtn")?.addEventListener("click", () => onSupportDefense?.(index));

      attackLog.appendChild(row);
    });

    if (currentAttack.length === 0 && !battleNotice && !currentActionHeader && !currentActionLabel) {
      attackLog.textContent = "攻撃解決済み";
    }

    refreshButtons();
  }

  function renderNext2v2Button() {
    setExtraPanel(`<button id="storyNext2v2Btn">次へ</button>`);
    document.getElementById("storyNext2v2Btn")?.addEventListener("click", () => {
      if (!isAllowed("next2v2")) return;
      emit("next2v2");
    });
    refreshButtons();
  }

  function renderModeButtons({ on1v1, on2v2, onEnd } = {}) {
    setExtraPanel(`
      <button id="storyFree1v1Btn">1on1</button>
      <button id="storyFree2v2Btn">2on2</button>
      <button id="storyChapter1EndBtn">終了</button>
    `);

    document.getElementById("storyFree1v1Btn")?.addEventListener("click", () => on1v1?.());
    document.getElementById("storyFree2v2Btn")?.addEventListener("click", () => on2v2?.());
    document.getElementById("storyChapter1EndBtn")?.addEventListener("click", () => onEnd?.());
  }

  function renderTauntChoice() {
    setExtraPanel(`<button id="storyTauntTarget2Btn">2番機を指定</button>`);

    document.getElementById("storyTauntTarget2Btn")?.addEventListener("click", () => {
      twoVtwoPhase = "duelReady";
      teamB.focusUnitKey = "unit2";
      setLog("2番機を挑発対象にしました。");
      redraw2v2();
      emit("tauntTarget");
    });
  }

  function renderDuelChoice() {
    setExtraPanel(`
      <button id="storyDuelUnit1Btn">1番機で決戦</button>
      <button id="storyDuelUnit2Btn">2番機で決戦</button>
    `);

    ["storyDuelUnit1Btn", "storyDuelUnit2Btn"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", () => {
        twoVtwoPhase = "duel";
        setLog("決戦状態になりました。");
        redraw2v2();
        emit("duelSelected");
      });
    });
  }

  function renderBreakthroughChoice() {
    setExtraPanel(`
      <div id="storyBreakthroughPanel">
        ${Array.from({ length: 11 }, (_, i) => `<button class="story-bet-btn" data-bet="${i}">${i}</button>`).join("")}
        <div id="storyBreakthroughResult"></div>
      </div>
    `);

    document.querySelectorAll(".story-bet-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bet = Number(btn.dataset.bet || 0);
        document.getElementById("storyBreakthroughResult").innerHTML =
          `<p>${bet}ターン分のシミュレーションを行いました。</p><p class="story-breakthrough-bonus">ボーナス行動権 +5</p>`;
        emit("breakthroughBet", { bet });
      });
    });
  }

  function styleBlock() {
    return `
      <style>
        #storyBattleRoot {
          width:100%;
          color:white;
          text-align:center;
        }

        #storyBattleRoot .container {
          align-items:flex-start;
        }

        #storyBattleRoot .story-center-counters {
          display:flex;
          flex-direction:column;
          gap:8px;
          margin:0 4px;
          flex-shrink:0;
        }

        #storyBattleRoot .story-counter-box {
          width:35px;
          height:35px;
          border:1px solid white;
          border-radius:8px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          font-size:11px;
          line-height:1.2;
        }

        #storyBattleRoot .story-counter-box div:last-child {
          font-size:18px;
          font-weight:bold;
        }

        #storyBattleRoot #storyAttackLog {
          white-space:pre-wrap;
          margin-bottom:8px;
        }

        #storyBattleRoot .story-highlighted {
          color:red !important;
          border-color:red !important;
          box-shadow:0 0 10px red !important;
        }

        #storyBattleRoot .criticalBoostBtn.story-highlighted,
        #storyBattleRoot .hitBtn.story-highlighted,
        #storyBattleRoot .evadeBtn.story-highlighted,
        #storyBattleRoot .supportDefenseBtn.story-highlighted,
        #storyBattleRoot button.story-highlighted {
          color:red !important;
          box-shadow:0 0 10px red !important;
        }

        #storyBattleRoot #storySingleTeamActionButtons {
          margin-top:4px;
        }
      </style>
    `;
  }

  return {
    renderOneOnOneTraining,
    renderTwoOnTwoTraining,
    renderModeButtons,
    renderNext2v2Button,
    setExtraPanel,
    setLog,
    setHighlight,
    clearHighlight,
    forceNextPlayerSlot,
    forceNextEnemySlot,
    allow,
    on,
    clearHandlers
  };
}
