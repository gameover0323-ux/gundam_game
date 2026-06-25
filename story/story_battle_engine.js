import { getStoryCreateUnit } from "./story_units.js";
import { training_machine } from "../js/js_units_training_machine.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomSlotNumber() {
  return Math.floor(Math.random() * 6) + 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

function getAttackTags(effect = {}) {
  if (effect.type !== "attack") return "";

  const list = [];
  if (effect.attackType === "melee") list.push("[格]");
  if (effect.attackType === "shoot") list.push("[射]");
  if (effect.beam) list.push("[ビ]");
  if (effect.ignoreReduction) list.push("[不]");
  if (effect.cannotEvade) list.push("[必]");
  if (effect.criticalHit) list.push("[会心]");

  return list.join("");
}

function createBattleUnit(unit, options = {}) {
  const form = getForm(unit);

  return {
    id: unit.id,
    name: form.name || unit.name,
    hp: Number(form.hp || 0),
    maxHp: Number(form.hp || 0),
    displayHp: form.displayHp || null,
    evade: Number(form.evadeMax || 0),
    evadeMax: Number(form.evadeMax || 0),
    energy: Number(form.storyEnergyMax || 0),
    energyMax: Number(form.storyEnergyMax || 0),
    criticalRate: Number(form.criticalRate ?? options.defaultCriticalRate ?? 5),
    slots: clone(form.slots || {}),
    slotOrder: Array.isArray(form.ownedSlotOrder) ? form.ownedSlotOrder : SLOT_KEYS,
    specials: clone(form.specials || [])
  };
}

export function createStoryBattleEngine() {
  let root = null;
  let playerA = null;
  let playerB = null;
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

  function isEndButtonAllowed() {
    return isAllowed("end") || isAllowed("endOnly");
  }

  function refreshButtons() {
    const map = [
      ["storyCriticalBtn", "critical"],
      ["storyMockSlotBtn", "slot"],
      ["storyMockSimBtn", "sim"],
      ["storyMockEndBtn", "end"],
      ["storyHitBtn", "hit"],
      ["storyEvadeBtn", "evade"],
      ["storyNext2v2Btn", "next2v2"],
      ["storyTeamStyleBtn", "style"],
      ["storyTauntBtn", "taunt"],
      ["storyDuelBtn", "duel"],
      ["storyBreakthroughBtn", "breakthrough"],
      ["storyTeamSlotBtn", "teamSlot"],
      ["storyUnit1SlotBtn", "teamSingle"],
      ["storyUnit2SlotBtn", "teamSingle"],
      ["storyCoverBtn", "cover"]
    ];

    map.forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      if (id === "storyMockEndBtn") {
        btn.disabled = allowedActions.size > 0 && !isEndButtonAllowed();
        return;
      }

      btn.disabled = allowedActions.size > 0 && !allowedActions.has(action);
    });
  }

  function setLog(text) {
    const log = document.getElementById("storyBattleLog");
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

  function renderOneOnOneTraining({ root: targetRoot, free = false } = {}) {
    root = targetRoot || document.getElementById("storyModeRoot");
    if (!root) return;

    const proto = getStoryCreateUnit("proto_create_gundam");

    playerA = createBattleUnit(proto, { defaultCriticalRate: 5 });
    playerB = createBattleUnit(training_machine, { defaultCriticalRate: free ? 5 : 0 });

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
      <div id="storyBattleRoot" class="story-battle-normal-skin">
        <h2 id="storyTurnText">チャプター1 演習 1on1</h2>
        <h3 id="storyCurrentPlayer">PLAYER A</h3>

        <div class="container">
          <div class="player" id="storyMockPlayerA"></div>

          <div class="story-center-counters">
            <div class="story-counter-box story-turn-counter">
              <div>TURN</div>
              <div id="storyTurnCounterValue">1</div>
            </div>
            <div class="story-counter-box story-action-counter">
              <div>行動</div>
              <div id="storyActionCounter">1</div>
            </div>
          </div>

          <div class="player" id="storyMockPlayerB"></div>
        </div>

        <div class="bottom">
          <div id="storyBattleLog">演習開始待機中</div>

          <div id="storyQteArea" class="story-qte-area" style="display:none;">
            <button id="storyHitBtn">被弾</button>
            <button id="storyEvadeBtn">回避</button>
          </div>

          <button id="storyCriticalBtn">会心率強化</button>
          <button id="storyMockSlotBtn">スロット行動</button>
          <button id="storyMockSimBtn">シミュレーション</button>
          <button id="storyMockEndBtn">ターン終了</button>

          <div id="storyBattleExtraPanel"></div>
        </div>
      </div>
    `;

    redraw1v1();
    bind1v1();
    refreshButtons();
  }

  function renderTwoOnTwoTraining({ root: targetRoot, free = false } = {}) {
    root = targetRoot || document.getElementById("storyModeRoot");
    if (!root) return;

    const proto = getStoryCreateUnit("proto_create_gundam");

    const a1 = createBattleUnit(proto, { defaultCriticalRate: 5 });
    const a2 = createBattleUnit(proto, { defaultCriticalRate: 5 });
    const b1 = createBattleUnit(training_machine, { defaultCriticalRate: free ? 5 : 0 });
    const b2 = createBattleUnit(training_machine, { defaultCriticalRate: free ? 5 : 0 });

    a2.name = "プロトクリエイトガンダム 2番機";
    a2.evade = 1;
    a2.evadeMax = 1;
    a2.energy = 100;
    a2.energyMax = 100;
    a2.slotOrder = [...SLOT_KEYS].reverse();

    b2.name = "トレーニングマシン 2番機";

    pendingAttack = null;
    actionCount = 1;
    turnCount = 1;
    allowedActions = new Set();

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      ${styleBlock()}
      <div id="storyBattleRoot" class="story-battle-normal-skin">
        <h2 id="storyTurnText">チャプター1 演習 2on2</h2>
        <h3 id="storyCurrentPlayer">PLAYER A</h3>

        <div class="story-team-mode-row">
          <button id="storyTeamStyleBtn">自軍：分散型</button>
          <button id="storyTauntBtn">挑発</button>
          <button id="storyDuelBtn">決戦</button>
          <button id="storyBreakthroughBtn">打破</button>
        </div>

        <div class="container story-2v2-container">
          <div class="player story-focus-unit" id="storyPlayerUnit1">${renderUnitInner(a1, "A1", true)}</div>
          <div class="player" id="storyPlayerUnit2">${renderUnitInner(a2, "A2", true)}</div>
          <div class="player story-focus-unit" id="storyEnemyUnit1">${renderUnitInner(b1, "B1", true)}</div>
          <div class="player" id="storyEnemyUnit2">${renderUnitInner(b2, "B2", true)}</div>
        </div>

        <div class="bottom">
          <div id="storyBattleLog">2on2演習開始待機中</div>

          <div id="storyQteArea" class="story-qte-area" style="display:none;">
            <button id="storyHitBtn">被弾</button>
            <button id="storyEvadeBtn">回避</button>
            <button id="storyCoverBtn">援護防御</button>
          </div>

          <button id="storyTeamSlotBtn">スロット行動</button>
          <button id="storyUnit1SlotBtn">1単独行動</button>
          <button id="storyUnit2SlotBtn">2単独行動</button>
          <button id="storyMockEndBtn">ターン終了</button>

          <div id="storyBattleExtraPanel"></div>
        </div>
      </div>
    `;

    bind2v2();
    refreshButtons();
  }

  function renderUnitInner(unit, label, isTeam = false) {
    const hpText = unit.displayHp ? unit.displayHp : `${unit.hp}/${unit.maxHp}`;

    return `
      <h3>PLAYER ${label}</h3>
      ${isTeam ? `
        <button class="story-status-switch-btn">表示切替</button>
        <button class="story-focus-btn">フォーカス</button>
      ` : ""}
      <div class="story-unit-name">${escapeHtml(unit.name)}</div>
      <div class="story-hp">HP ${escapeHtml(hpText)}</div>
      <div class="story-evade">回避:${unit.evade}/${unit.evadeMax}</div>
      ${unit.energyMax > 0 ? `<div class="story-energy">EN ${unit.energy}/${unit.energyMax}</div>` : ""}
      <button class="story-critical-display">会心${unit.criticalRate}%</button>

      <h3>スロット</h3>
      <div class="story-slot-area">
        ${renderSlots(unit)}
      </div>

      ${renderSpecials(unit)}
    `;
  }

  function renderSlots(unit) {
    return unit.slotOrder.map((slotKey, index) => {
      const slot = unit.slots?.[slotKey];
      return `
        <div
          class="slot story-slot-name"
          data-desc="${escapeHtml(getSlotDesc(slot))}"
        >
          ${index + 1}.${escapeHtml(getSlotLabel(slot))}${getAttackTags(slot?.effect)}
        </div>
      `;
    }).join("");
  }

  function renderSpecials(unit) {
    if (!unit.specials?.length) return "";

    return `
      <h3>特殊行動</h3>
      <div class="story-special-area">
        ${unit.specials.map((special, index) => `
          <div class="special">
            <div>${index + 1}.${escapeHtml(special.name || "特殊行動")}</div>
            <button
              class="story-special-name"
              data-desc="${escapeHtml(special.desc || "詳細なし")}"
            >説明</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function bindDetails() {
    document.querySelectorAll(".story-slot-name").forEach(el => {
      el.addEventListener("click", () => setLog(el.dataset.desc || "詳細なし"));
    });

    document.querySelectorAll(".story-special-name").forEach(btn => {
      btn.addEventListener("click", () => setLog(btn.dataset.desc || "詳細なし"));
    });
  }

  function bind1v1() {
    bindDetails();

    document.getElementById("storyMockSlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("slot")) return;
      executePlayerSlot();
    });

    document.getElementById("storyMockSimBtn")?.addEventListener("click", () => {
      if (!isAllowed("sim")) return;
      simulateSlot();
    });

    document.getElementById("storyMockEndBtn")?.addEventListener("click", () => {
      if (isAllowed("endOnly")) {
        endOnly();
        return;
      }

      if (!isAllowed("end")) return;
      executeEnemyTurn();
    });

    document.getElementById("storyHitBtn")?.addEventListener("click", () => {
      if (!isAllowed("hit")) return;
      resolveHit();
    });

    document.getElementById("storyEvadeBtn")?.addEventListener("click", () => {
      if (!isAllowed("evade")) return;
      resolveEvade();
    });

    document.getElementById("storyCriticalBtn")?.addEventListener("click", () => {
      if (!isAllowed("critical")) return;
      spendCritical();
    });
  }

  function bind2v2() {
    bindDetails();

    document.getElementById("storyTeamSlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSlot")) return;
      setLog("2機同時にスロット行動を行いました。相手フォーカス機体へ連携攻撃します。");
      emit("teamSlot");
    });

    document.getElementById("storyUnit1SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      setLog("1番機単独行動を選びました。");
      emit("teamSingle1");
    });

    document.getElementById("storyUnit2SlotBtn")?.addEventListener("click", () => {
      if (!isAllowed("teamSingle")) return;
      setLog("2番機単独行動を選びました。");
      emit("teamSingle2");
    });

    document.getElementById("storyMockEndBtn")?.addEventListener("click", () => {
      if (!isAllowed("end")) return;
      setLog("トレーニングマシン1番機：3.演習属性攻撃[射][不]\nトレーニングマシン2番機：4.演習属性攻撃[格][必]");
      document.getElementById("storyQteArea").style.display = "";
      emit("teamEnemyTurn");
    });

    document.getElementById("storyEvadeBtn")?.addEventListener("click", () => {
      if (!isAllowed("evade")) return;
      setLog("上の攻撃を回避しました。");
      emit("teamEvade");
    });

    document.getElementById("storyCoverBtn")?.addEventListener("click", () => {
      if (!isAllowed("cover")) return;
      setLog("援護防御が成立しました。パートナーが半分のダメージを肩代わりします。");
      document.getElementById("storyQteArea").style.display = "none";
      emit("cover");
    });

    document.getElementById("storyTeamStyleBtn")?.addEventListener("click", () => {
      if (!isAllowed("style")) return;
      const btn = document.getElementById("storyTeamStyleBtn");
      btn.textContent = btn.textContent.includes("分散型") ? "自軍：統合型" : "自軍：分散型";
      setLog(btn.textContent.replace("自軍：", "") + "に変更しました。");
      emit("style");
    });

    document.getElementById("storyTauntBtn")?.addEventListener("click", () => {
      if (!isAllowed("taunt")) return;
      renderTauntChoice();
      emit("taunt");
    });

    document.getElementById("storyDuelBtn")?.addEventListener("click", () => {
      if (!isAllowed("duel")) return;
      renderDuelChoice();
      emit("duel");
    });

    document.getElementById("storyBreakthroughBtn")?.addEventListener("click", () => {
      if (!isAllowed("breakthrough")) return;
      renderBreakthroughChoice();
      emit("breakthrough");
    });
  }

  function redraw1v1() {
    const a = document.getElementById("storyMockPlayerA");
    const b = document.getElementById("storyMockPlayerB");

    if (a && playerA) a.innerHTML = renderUnitInner(playerA, "A");
    if (b && playerB) b.innerHTML = renderUnitInner(playerB, "B");

    const action = document.getElementById("storyActionCounter");
    if (action) action.textContent = String(actionCount);

    const turn = document.getElementById("storyTurnCounterValue");
    if (turn) turn.textContent = String(turnCount);

    bindDetails();
    refreshButtons();
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

    const n = nextPlayerSlot();
    const slot = playerA.slots?.[`slot${n}`];
    const effect = slot?.effect || {};

    if (effect.type === "evade") {
      playerA.evade += Number(effect.amount || 0);
      setLog(`結果：${n}.${getSlotLabel(slot)}\n回避+${effect.amount || 0}`);
    } else if (effect.type === "heal") {
      playerA.hp = Math.min(playerA.maxHp, playerA.hp + Number(effect.amount || 0));
      setLog(`結果：${n}.${getSlotLabel(slot)}\nHPを${effect.amount || 0}回復。`);
    } else if (effect.type === "attack") {
      const count = Number(effect.count || 1);
      let damage = Number(effect.damage || 0) * count;
      let evadeText = "";

      if (!effect.cannotEvade && playerB.evade >= count) {
        playerB.evade -= count;
        damage = 0;
        evadeText = "\n相手は回避しました。";
      }

      playerB.hp = Math.max(0, playerB.hp - damage);
      setLog(`結果：${n}.${getSlotLabel(slot)}${getAttackTags(effect)}\n${damage}ダメージ。${evadeText}`);
    } else {
      setLog(`結果：${n}.${getSlotLabel(slot)}\n何も起きません。`);
    }

    actionCount = Math.max(0, actionCount - 1);
    redraw1v1();
    emit("playerSlot", { slotNumber: n, slot });
  }

  function executeEnemyTurn() {
    actionCount = 1;
    turnCount += 1;

    const n = nextEnemySlot();
    const slot = playerB.slots?.[`slot${n}`];
    const effect = slot?.effect || {};

    if (effect.type === "evade") {
      playerB.evade = Math.min(playerB.evadeMax, playerB.evade + Number(effect.amount || 0));
      setLog(`トレーニングマシン：${n}.${getSlotLabel(slot)}\n回避が増えました。`);
      redraw1v1();
      emit("enemyTurn", { slotNumber: n, slot });
      return;
    }

    pendingAttack = {
      slotNumber: n,
      slot,
      effect,
      damage: Number(effect.damage || 0) * Number(effect.count || 1)
    };

    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "";

    setLog(`トレーニングマシン：${n}.${getSlotLabel(slot)}${getAttackTags(effect)}\n対応を選んでください。`);
    redraw1v1();
    emit("enemyTurn", { slotNumber: n, slot });
  }

  function endOnly() {
    pendingAttack = null;
    actionCount = 1;
    turnCount += 1;

    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "none";

    setLog("ターンを進めました。");
    redraw1v1();
    emit("endOnly");
  }

  function resolveHit() {
    if (!pendingAttack) return;

    let damage = pendingAttack.damage;
    if (pendingAttack.effect.criticalHit) damage *= 2;

    playerA.hp = Math.max(0, playerA.hp - damage);

    const info = pendingAttack;
    pendingAttack = null;

    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "none";

    setLog(`被弾しました。${damage}ダメージ。`);
    redraw1v1();
    emit("hit", info);
  }

  function resolveEvade() {
    if (!pendingAttack) return;

    const count = Number(pendingAttack.effect.count || 1);

    if (pendingAttack.effect.cannotEvade) {
      setLog("必中属性のため回避できません。");
      emit("evadeFailed", pendingAttack);
      return;
    }

    if (playerA.evade < count) {
      setLog("回避ストックが足りません。");
      return;
    }

    playerA.evade -= count;

    const info = pendingAttack;
    pendingAttack = null;

    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "none";

    setLog("回避しました。");
    redraw1v1();
    emit("evade", info);
  }

  function spendCritical() {
    if (playerA.evade <= 0) {
      setLog("回避ストックがありません。");
      return;
    }

    const before = playerA.criticalRate;
    playerA.evade -= 1;
    playerA.criticalRate += 4;

    setLog(`会心率が${before}%→${playerA.criticalRate}%になりました。`);
    redraw1v1();
    emit("critical", { before, after: playerA.criticalRate });
  }

  function renderNext2v2Button() {
    setExtraPanel(`<button id="storyNext2v2Btn">次へ</button>`);
    document.getElementById("storyNext2v2Btn").addEventListener("click", () => {
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

    document.getElementById("storyFree1v1Btn").addEventListener("click", () => on1v1?.());
    document.getElementById("storyFree2v2Btn").addEventListener("click", () => on2v2?.());
    document.getElementById("storyChapter1EndBtn").addEventListener("click", () => onEnd?.());
  }

  function renderTauntChoice() {
    setExtraPanel(`<button id="storyTauntTarget2Btn">2番機を指定</button>`);
    document.getElementById("storyTauntTarget2Btn").addEventListener("click", () => {
      document.getElementById("storyEnemyUnit2")?.classList.add("story-taunted-unit");
      setLog("2番機を挑発対象にしました。");
      emit("tauntTarget");
    });
  }

  function renderDuelChoice() {
    setExtraPanel(`
      <button id="storyDuelUnit1Btn">1番機で決戦</button>
      <button id="storyDuelUnit2Btn">2番機で決戦</button>
    `);

    ["storyDuelUnit1Btn", "storyDuelUnit2Btn"].forEach(id => {
      document.getElementById(id).addEventListener("click", () => {
        document.getElementById("storyPlayerUnit1")?.classList.add("story-duel-unit");
        document.getElementById("storyEnemyUnit1")?.classList.add("story-duel-unit");
        setLog("決戦状態になりました。");
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
          width: 100%;
          color: white;
          text-align: center;
        }

        #storyBattleRoot .container {
          align-items: flex-start;
        }

        #storyBattleRoot .player {
          box-sizing: border-box;
        }

        #storyBattleRoot .story-center-counters {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0 4px;
          flex-shrink: 0;
        }

        #storyBattleRoot .story-counter-box {
          width: 35px;
          height: 35px;
          border: 1px solid white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 11px;
          line-height: 1.2;
        }

        #storyBattleRoot .story-counter-box div:last-child {
          font-size: 18px;
          font-weight: bold;
        }

        #storyBattleRoot .story-unit-name {
          font-weight: bold;
          margin: 6px 0;
          word-break: keep-all;
          overflow-wrap: anywhere;
        }

        #storyBattleRoot .slot {
          cursor: pointer;
          user-select: none;
        }

        #storyBattleRoot .story-slot-area,
        #storyBattleRoot .story-special-area {
          margin-top: 4px;
        }

        #storyBattleRoot #storyBattleLog {
          white-space: pre-wrap;
          margin-bottom: 8px;
        }

        #storyBattleRoot .story-qte-area {
          margin: 8px 0;
          padding: 6px;
          border: 1px solid #777;
        }

        #storyBattleRoot .story-highlighted {
          color: red !important;
          border-color: red !important;
          box-shadow: 0 0 10px red !important;
        }

        #storyBattleRoot .story-focus-unit {
          outline: 2px solid red;
        }

        #storyBattleRoot .story-taunted-unit {
          outline: 2px solid dodgerblue;
        }

        #storyBattleRoot .story-duel-unit {
          outline: 3px solid hotpink;
        }

        #storyBattleRoot .story-2v2-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        #storyBattleRoot .story-2v2-container .player {
          width: auto;
        }

        @media (max-width: 520px) {
          #storyBattleRoot .story-2v2-container {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
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
