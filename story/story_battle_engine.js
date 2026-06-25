import { renderPlayerState, renderPlayerState2v2 } from "../js/js_ui.js";
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

function getSlotKeyFromNumber(slotNumber) {
  return `slot${Number(slotNumber) || 1}`;
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

function makeAttackFromSlot(unit, slotNumber, slot) {
  const effect = slot?.effect || {};
  const count = Math.max(1, Number(effect.count || 1));

  if (effect.type !== "attack") return [];

  return Array.from({ length: count }, (_, index) => ({
    damage: Number(effect.damage || 0),
    type: effect.attackType || effect.typeTag || "shoot",
    beam: effect.beam === true,
    ignoreReduction: effect.ignoreReduction === true,
    cannotEvade: effect.cannotEvade === true,
    criticalHit: effect.criticalHit === true,
    sourceLabel: `${unit.name}の行動`,
    slotLabel: `${slotNumber}.${getSlotLabel(slot)}`,
    shotIndex: index + 1,
    ownerUnit: unit
  }));
}

function applySimpleSlotEffect(unit, slotNumber, slot) {
  const effect = slot?.effect || {};

  if (effect.type === "evade") {
    const amount = Number(effect.amount || 0);
    unit.evade = Number(unit.evade || 0) + amount;
    return `${unit.name} ${slotNumber}.${getSlotLabel(slot)}\n${unit.name}の回避が${amount}増加`;
  }

  if (effect.type === "heal") {
    const amount = Number(effect.amount || 0);
    const before = Number(unit.hp || 0);
    unit.hp = Math.min(Number(unit.maxHp || before), before + amount);
    unit.storyInternalHp = unit.hp;
    return `${unit.name} ${slotNumber}.${getSlotLabel(slot)}\n${unit.name}のHPを${unit.hp - before}回復`;
  }

  return `${unit.name} ${slotNumber}.${getSlotLabel(slot)}\n効果なし`;
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
      ["storyNext2v2Btn", "next2v2"],
      ["storyBreakthroughBtn", "breakthrough"]
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

    document.querySelectorAll("#storyBattleRoot .story-bet-btn").forEach(btn => {
      btn.disabled = allowedActions.size > 0 && !allowedActions.has("breakthroughBet");
    });
  }

  function setLog(text) {
    const log = document.getElementById("storyAttackLog");
    if (log) log.textContent = String(text || "");
  }

  function setExtraPanel(html) {
    const panel = document.getElementById("storyBattleExtraPanel");
    if (panel) panel.innerHTML = html || "";
    refreshButtons();
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
      canChangeFocus: pendingAttack === null,
      onSwitchActiveUnit: unitKey => {
        if (pendingAttack) return;
        team.activeUnitKey = unitKey;
        redraw2v2();
      },
      onSwitchFocusUnit: unitKey => {
        if (pendingAttack) return;
        team.focusUnitKey = unitKey;
        redraw2v2();
      },
      onToggleTeamMode: () => {
        if (!isAllowed("style")) return;
        if (pendingAttack) return;
        team.mode = team.mode === "unified" ? "separate" : "unified";
        redraw2v2();
        emit("style");
      },
      getTauntButtonLabel: () => {
        if (twoVtwoPhase === "duelReady" && side === "A") return "決戦";
        if (twoVtwoPhase === "duel") return "打破";
        return "挑発";
      },
      onTauntSystemButton: () => {
        if (twoVtwoPhase === "duel") {
          if (!isAllowed("breakthrough")) return;
          renderBreakthroughChoice();
          emit("breakthrough");
          return;
        }

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
        <h2>チャプター1 演習 1on1</h2>
        <div class="story-battle-board">
          <section id="storyPlayerA" class="story-player-area"></section>
          <section id="storyPlayerB" class="story-player-area"></section>
        </div>
        <hr>
        <div class="story-counter-row">
          <div>TURN <span id="storyTurnCounterValue">1</span></div>
          <div>行動 <span id="storyActionCounterValue">1</span></div>
        </div>
        <div id="storyAttackLog" class="story-attack-log">演習開始待機中</div>
        <div class="story-command-row">
          <button id="storyExecuteSlotBtn">スロット行動実行</button>
          <button id="storySimulateBtn">シミュレーション</button>
          <button id="storyEndTurnBtn">ターン終了</button>
        </div>
        <div id="storyBattleExtraPanel"></div>
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

    teamA = { mode: "separate", activeUnitKey: "unit1", focusUnitKey: "unit1", unit1: a1, unit2: a2, unified: {} };
    teamB = { mode: "separate", activeUnitKey: "unit1", focusUnitKey: "unit1", unit1: b1, unit2: b2, unified: {} };

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
        <h2>チャプター1 演習 2on2</h2>
        <div class="story-battle-board">
          <section id="storyPlayerA" class="story-player-area"></section>
          <section id="storyPlayerB" class="story-player-area"></section>
        </div>
        <hr>
        <div class="story-counter-row">
          <div>TURN <span id="storyTurnCounterValue">1</span></div>
          <div>行動 <span id="storyActionCounterValue">1</span></div>
        </div>
        <div id="storyAttackLog" class="story-attack-log">2on2演習開始待機中</div>
        <div class="story-command-row">
          <button id="storyTeamSlotBtn">スロット行動実行</button>
          <button id="storyUnit1SlotBtn">1単独行動</button>
          <button id="storyUnit2SlotBtn">2単独行動</button>
          <button id="storySimulateBtn">シミュレーション</button>
          <button id="storyEndTurnBtn">ターン終了</button>
        </div>
        <div id="storyBattleExtraPanel"></div>
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
      executeTeamSlot(["unit1", "unit2"]);
      emit("teamSlot");
    });

    document.getElementById("storyUnit1SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      executeTeamSlot(["unit1"]);
      emit("teamSingle1");
    });

    document.getElementById("storyUnit2SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      executeTeamSlot(["unit2"]);
      emit("teamSingle2");
    });

    document.getElementById("storySimulateBtn")?.addEventListener("click", () => {
      if (!isAllowed("sim")) return;
      simulateTeamSlot();
    });

    document.getElementById("storyEndTurnBtn")?.addEventListener("click", () => {
      if (!isAllowed("end")) return;
      if (pendingAttack) {
        setLog("先に表示中の攻撃を処理してください。");
        return;
      }
      executeTeamEnemyTurn();
      emit("teamEnemyTurn");
    });
  }

  function simulateSlot() {
    const n = randomSlotNumber();
    const slot = playerA.slots?.[`slot${n}`];
    setLog(`シミュレーション：${n}.${getSlotLabel(slot)}`);
    emit("sim", { slotNumber: n, slot });
  }

  function simulateTeamSlot() {
    const a1 = randomSlotNumber();
    const a2 = randomSlotNumber();
    setLog(
      `PLAYER A の2on2スロット行動\n` +
      `1機目：${teamA.unit1.name} ${a1}.${getSlotLabel(teamA.unit1.slots?.[getSlotKeyFromNumber(a1)])}\n` +
      `2機目：${teamA.unit2.name} ${a2}.${getSlotLabel(teamA.unit2.slots?.[getSlotKeyFromNumber(a2)])}`
    );
    emit("sim", { unit1: a1, unit2: a2 });
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

  function executeTeamSlot(unitKeys = ["unit1", "unit2"]) {
    if (!teamA || !teamB) return;

    if (pendingAttack) {
      setLog("先に相手の攻撃を処理してください。");
      return;
    }

    const lines = ["PLAYER A の2on2スロット行動"];
    let totalDamage = 0;
    const defender = teamB[teamB.focusUnitKey || "unit1"];

    unitKeys.forEach(unitKey => {
      const unit = teamA[unitKey];
      if (!unit) return;

      const slotNumber = nextPlayerSlot();
      const slot = unit.slots?.[getSlotKeyFromNumber(slotNumber)];
      const effect = slot?.effect || {};

      lines.push(`${unitKey === "unit1" ? "1機目" : "2機目"}：${unit.name} ${slotNumber}.${getSlotLabel(slot)}`);

      if (effect.type === "attack") {
        const attacks = makeAttackFromSlot(unit, slotNumber, slot);
        const unitDamage = attacks.reduce((sum, attack) => sum + Number(attack.damage || 0), 0);
        totalDamage += unitDamage;
        lines.push(`${unit.name} ${slotNumber}.${getSlotLabel(slot)}\n→${unitDamage}ダメージ`);
      } else {
        lines.push(applySimpleSlotEffect(unit, slotNumber, slot));
      }
    });

    if (defender && totalDamage > 0) {
      defender.hp = Math.max(0, Number(defender.hp || 0) - totalDamage);
      defender.storyInternalHp = defender.hp;
      lines.push(`合計${totalDamage}ダメージを与えた。`);
    }

    actionCount = Math.max(0, actionCount - 1);
    setLog(lines.join("\n"));
    redraw2v2();
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

    const attacks = makeAttackFromSlot(playerB, slotNumber, slot);
    pendingAttack = {
      mode: "1v1",
      attacks
    };

    renderPendingAttackChoices({
      currentActionHeader: "トレーニングマシンの行動",
      currentActionLabel: `${slotNumber}.${getSlotLabel(slot)}`,
      canSupportDefense: false
    });

    redraw1v1();
    emit("enemyTurn", { slotNumber, slot });
    refreshButtons();
  }

  function executeTeamEnemyTurn() {
    if (!teamA || !teamB) return;

    actionCount = 1;
    turnCount += 1;

    const unitEntries = [
      ["unit1", teamB.unit1],
      ["unit2", teamB.unit2]
    ];

    const attacks = [];
    const labels = [];

    unitEntries.forEach(([unitKey, unit]) => {
      const slotNumber = nextEnemySlot();
      const slot = unit.slots?.[getSlotKeyFromNumber(slotNumber)];
      const effect = slot?.effect || {};

      labels.push(`${unitKey === "unit1" ? "1番機" : "2番機"}：${slotNumber}.${getSlotLabel(slot)}`);

      if (effect.type === "attack") {
        attacks.push(...makeAttackFromSlot(unit, slotNumber, slot));
      } else {
        setLog(applySimpleSlotEffect(unit, slotNumber, slot));
      }
    });

    pendingAttack = {
      mode: "2v2",
      attacks,
      focusTeam: teamA,
      targetUnitKey: teamA.focusUnitKey || "unit1"
    };

    renderPendingAttackChoices({
      currentActionHeader: "PLAYER B の2on2スロット行動",
      currentActionLabel: labels.join(" / "),
      canSupportDefense: teamA.mode !== "unified"
    });

    redraw2v2();
    refreshButtons();
  }

  function renderPendingAttackChoices(options = {}) {
    const attacks = pendingAttack?.attacks || [];
    renderStoryAttackChoicesUI({
      currentAttack: attacks,
      currentActionHeader: options.currentActionHeader,
      currentActionLabel: options.currentActionLabel,
      onHit: index => {
        if (!isAllowed("hit")) return;
        resolveHit(index);
      },
      onEvade: index => {
        if (!isAllowed("evade")) return;
        resolveEvade(index);
      },
      onSupportDefense: index => {
        if (!isAllowed("cover")) return;
        resolveSupportDefense(index);
      },
      canSupportDefense: options.canSupportDefense
    });
  }

  function resolveHit(index = 0) {
    if (!pendingAttack) return;

    const attack = pendingAttack.attacks[index];
    if (!attack) return;

    let damage = Number(attack.damage || 0);
    if (attack.criticalHit) damage *= 2;

    if (pendingAttack.mode === "2v2") {
      const targetTeam = pendingAttack.focusTeam || teamA;
      const targetUnit = targetTeam[targetTeam.focusUnitKey || "unit1"];
      targetUnit.hp = Math.max(0, Number(targetUnit.hp || 0) - damage);
      targetUnit.storyInternalHp = targetUnit.hp;
    } else {
      playerA.hp = Math.max(0, Number(playerA.hp || 0) - damage);
    }

    pendingAttack.attacks.splice(index, 1);

    const message = pendingAttack.attacks.length === 0
      ? `被弾しました。${damage}ダメージ。`
      : `被弾しました。${damage}ダメージ。\n残りの攻撃を処理してください。`;

    if (pendingAttack.attacks.length === 0) pendingAttack = null;

    setLog(message);
    pendingAttack?.attacks?.length ? renderPendingAttackChoices({ canSupportDefense: pendingAttack.mode === "2v2" }) : null;

    redraw1v1();
    redraw2v2();
    emit(pendingAttack?.mode === "2v2" ? "teamHit" : "hit", { damage });
  }

  function resolveEvade(index = 0) {
    if (!pendingAttack) return;

    const attack = pendingAttack.attacks[index];
    if (!attack) return;

    if (attack.cannotEvade) {
      setLog("必中属性のため回避できません。");
      return;
    }

    const evader = pendingAttack.mode === "2v2"
      ? teamA[teamA.focusUnitKey || "unit1"]
      : playerA;

    if (Number(evader.evade || 0) <= 0) {
      setLog("回避ストックが足りません。");
      return;
    }

    evader.evade -= 1;
    pendingAttack.attacks.splice(index, 1);

    const hadRest = pendingAttack.attacks.length > 0;

    if (!hadRest) {
      pendingAttack = null;
      setLog("回避しました。");
    } else {
      renderPendingAttackChoices({ canSupportDefense: pendingAttack.mode === "2v2" });
    }

    redraw1v1();
    redraw2v2();
    emit(pendingAttack?.mode === "2v2" || teamA ? "teamEvade" : "evade", { attack });
  }

  function resolveSupportDefense(index = 0) {
    if (!pendingAttack || pendingAttack.mode !== "2v2") return;

    const attack = pendingAttack.attacks[index];
    if (!attack) return;

    const focusKey = teamA.focusUnitKey || "unit1";
    const partnerKey = focusKey === "unit1" ? "unit2" : "unit1";
    const partner = teamA[partnerKey];

    if (!partner || Number(partner.evade || 0) <= 0) {
      setLog("援護防御するパートナーの回避ストックが足りません。");
      return;
    }

    partner.evade -= 1;

    let damage = Math.floor(Number(attack.damage || 0) / 2);
    if (attack.criticalHit) damage *= 2;

    partner.hp = Math.max(0, Number(partner.hp || 0) - damage);
    partner.storyInternalHp = partner.hp;

    pendingAttack.attacks.splice(index, 1);

    if (pendingAttack.attacks.length === 0) {
      pendingAttack = null;
      setLog(`援護防御が成立しました。\n${partner.name}が${damage}ダメージを肩代わりしました。`);
    } else {
      renderPendingAttackChoices({ canSupportDefense: true });
    }

    redraw2v2();
    emit("cover", { damage, partnerKey });
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
    redraw2v2();
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
        source.style.marginTop = "10px";
        source.style.fontWeight = "bold";
        source.textContent = attack.sourceLabel;
        attackLog.appendChild(source);
        lastSourceLabel = attack.sourceLabel;
      }

      const row = document.createElement("div");
      row.className = "story-qte-row";

      const shot = document.createElement("span");
      shot.textContent = `${attack.shotIndex || index + 1}発目：${attack.damage}ダメージ ${buildAttackTags(attack)} `;
      row.appendChild(shot);

      const hitBtn = document.createElement("button");
      hitBtn.className = "hitBtn";
      hitBtn.textContent = "被弾";
      hitBtn.addEventListener("click", () => onHit?.(index));
      row.appendChild(hitBtn);

      const evadeBtn = document.createElement("button");
      evadeBtn.className = "evadeBtn";
      evadeBtn.textContent = "回避";
      evadeBtn.addEventListener("click", () => onEvade?.(index));
      row.appendChild(evadeBtn);

      if (canSupportDefense && typeof onSupportDefense === "function") {
        const supportBtn = document.createElement("button");
        supportBtn.className = "supportDefenseBtn";
        supportBtn.textContent = "援護防御";
        supportBtn.addEventListener("click", () => onSupportDefense?.(index));
        row.appendChild(supportBtn);
      }

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
        <div>打破賭け：0〜10を選択</div>
        ${Array.from({ length: 11 }, (_, i) => `<button class="story-bet-btn" data-bet="${i}">${i}</button>`).join("")}
        <div id="storyBreakthroughResult"></div>
      </div>
    `);

    document.querySelectorAll(".story-bet-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bet = Number(btn.dataset.bet || 0);
        runStoryBreakthroughSimulation(bet);
      });
    });

    refreshButtons();
  }

  function runStoryBreakthroughSimulation(bet) {
    const result = document.getElementById("storyBreakthroughResult");
    if (!result) return;

    const turns = Math.max(0, Math.min(10, Number(bet || 0)));
    const lines = [];
    let aDamage = 0;
    let bDamage = 0;

    for (let i = 1; i <= turns; i++) {
      const a1 = randomSlotNumber();
      const a2 = randomSlotNumber();
      const b1 = randomSlotNumber();
      const b2 = randomSlotNumber();

      const a1Slot = teamA.unit1.slots?.[getSlotKeyFromNumber(a1)];
      const a2Slot = teamA.unit2.slots?.[getSlotKeyFromNumber(a2)];
      const b1Slot = teamB.unit1.slots?.[getSlotKeyFromNumber(b1)];
      const b2Slot = teamB.unit2.slots?.[getSlotKeyFromNumber(b2)];

      const aTurnDamage = estimateSlotDamage(a1Slot) + estimateSlotDamage(a2Slot);
      const bTurnDamage = estimateSlotDamage(b1Slot) + estimateSlotDamage(b2Slot);

      aDamage += aTurnDamage;
      bDamage += bTurnDamage;

      lines.push(
        `<div>【${i}T】A：${a1}.${getSlotLabel(a1Slot)} / ${a2}.${getSlotLabel(a2Slot)} → ${aTurnDamage}ダメージ</div>` +
        `<div>【${i}T】B：${b1}.${getSlotLabel(b1Slot)} / ${b2}.${getSlotLabel(b2Slot)} → ${bTurnDamage}ダメージ</div>`
      );
    }

    const win = aDamage >= bDamage;
    const bonus = win ? Math.floor(turns / 2) + 1 : 0;
    actionCount += bonus;

    result.innerHTML = `
      <div class="story-breakthrough-result-lines">
        ${lines.join("")}
      </div>
      <p>PLAYER A 合計：${aDamage}ダメージ</p>
      <p>PLAYER B 合計：${bDamage}ダメージ</p>
      <p class="story-breakthrough-bonus">${win ? `打破成功：ボーナス行動権 +${bonus}` : "打破失敗：ボーナスなし"}</p>
    `;

    redraw2v2();
    emit("breakthroughBet", { bet: turns, aDamage, bDamage, bonus });
  }

  function estimateSlotDamage(slot) {
    const effect = slot?.effect || {};
    if (effect.type !== "attack") return 0;
    return Number(effect.damage || 0) * Math.max(1, Number(effect.count || 1));
  }

  function styleBlock() {
    return `
      <style>
        #storyBattleRoot {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          color: #fff;
          background: #000;
          text-align: center;
        }

        .story-battle-board {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: start;
        }

        .story-player-area {
          border: 2px solid #fff;
          padding: 8px;
          min-width: 0;
        }

        .story-counter-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 10px 0;
          font-weight: bold;
        }

        .story-attack-log {
          white-space: pre-line;
          font-size: 18px;
          line-height: 1.55;
          margin: 10px auto;
          max-width: 760px;
        }

        .story-command-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 10px 0;
        }

        .story-command-row button,
        #storyBattleExtraPanel button,
        .story-qte-row button {
          font-size: 16px;
          padding: 8px 12px;
          margin: 4px;
        }

        .story-qte-row {
          margin: 8px 0;
        }

        .story-highlighted {
          outline: 3px solid #ff3333 !important;
          box-shadow: 0 0 12px #ff3333 !important;
        }

        .story-breakthrough-result-lines {
          text-align: left;
          display: inline-block;
          margin-top: 10px;
          line-height: 1.5;
        }

        .story-breakthrough-bonus {
          color: #ff6666;
          font-weight: bold;
        }

        @media (max-width: 700px) {
          .story-battle-board {
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }

          .story-attack-log {
            font-size: 16px;
          }
        }
      </style>
    `;
  }

  return {
    renderOneOnOneTraining,
    renderTwoOnTwoTraining,
    renderModeButtons,
    renderNext2v2Button,
    renderBreakthroughChoice,
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
