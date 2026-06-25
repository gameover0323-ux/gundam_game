import { getStoryCreateUnit } from "./story_units.js";
import { training_machine } from "../js/js_units_training_machine.js";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"];

function deepClone(value) {
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

function formatAttackTags(effect) {
  if (!effect || effect.type !== "attack") return "";

  const tags = [];

  if (effect.attackType === "melee") tags.push("[格]");
  if (effect.attackType === "shoot") tags.push("[射]");
  if (effect.beam) tags.push("[ビ]");
  if (effect.ignoreReduction) tags.push("[不]");
  if (effect.cannotEvade) tags.push("[必]");
  if (effect.criticalHit) tags.push("[会心]");

  return tags.join("");
}

function createBattleUnit(unit, options = {}) {
  const form = getForm(unit);

  return {
    id: unit.id,
    name: form.name || unit.name,
    unit,
    form,
    hp: Number(form.hp || 0),
    maxHp: Number(form.hp || 0),
    displayHp: form.displayHp || null,
    evade: Number(form.evadeMax || 0),
    evadeMax: Number(form.evadeMax || 0),
    energy: Number(form.storyEnergyMax || 0),
    energyMax: Number(form.storyEnergyMax || 0),
    criticalRate: Number(form.criticalRate ?? options.defaultCriticalRate ?? 5),
    slots: deepClone(form.slots || {}),
    slotOrder: Array.isArray(form.ownedSlotOrder)
      ? form.ownedSlotOrder
      : SLOT_KEYS,
    specials: deepClone(form.specials || [])
  };
}

export function createStoryBattleEngine(ctx = {}) {
  let root = null;
  let battleMode = "1v1";
  let freeMode = false;

  let playerA = null;
  let playerB = null;

  let playerTeam = null;
  let enemyTeam = null;

  let pendingAttack = null;
  let forcedPlayerSlots = [];
  let forcedEnemySlots = [];
  let logText = "演習開始待機中";
  let actionCount = 1;

  function getRoot() {
    return root || document.getElementById("storyModeRoot");
  }

  function setExtraPanel(html) {
    const panel = document.getElementById("storyBattleExtraPanel");
    if (panel) panel.innerHTML = html || "";
  }

  function setLog(text) {
    logText = String(text || "");
    const log = document.getElementById("storyBattleLog");
    if (log) log.textContent = logText;
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

  function getNextPlayerSlotNumber() {
    if (forcedPlayerSlots.length > 0) return forcedPlayerSlots.shift();
    return randomSlotNumber();
  }

  function getNextEnemySlotNumber() {
    if (forcedEnemySlots.length > 0) return forcedEnemySlots.shift();
    return randomSlotNumber();
  }

  function renderOneOnOneTraining(options = {}) {
    root = options.root || getRoot();
    if (!root) return;

    battleMode = "1v1";
    freeMode = options.free === true;
    forcedPlayerSlots = [];
    forcedEnemySlots = [];
    pendingAttack = null;
    actionCount = 1;

    const protoUnit = getStoryCreateUnit("proto_create_gundam");
    playerA = createBattleUnit(protoUnit, { defaultCriticalRate: 5 });
    playerB = createBattleUnit(training_machine, {
      defaultCriticalRate: freeMode ? 5 : 0
    });

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      ${renderStyle()}
      <div id="storyBattleRoot">
        <h2 id="storyBattleTitle">チャプター1 演習 1on1</h2>

        <div class="story-top-line">
          <div class="story-turn-box">
            <div>TURN</div>
            <strong id="storyTurnValue">1</strong>
          </div>
          <div class="story-turn-box story-action-box">
            <div>行動</div>
            <strong id="storyActionCounter">1</strong>
          </div>
        </div>

        <div class="story-battle-container">
          ${renderUnitCard(playerA, "A", "storyMockPlayerA")}
          ${renderUnitCard(playerB, "B", "storyMockPlayerB")}
        </div>

        <div class="story-bottom">
          <div id="storyBattleLog">${escapeHtml(logText)}</div>

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

    bindOneOnOneButtons();
    redrawOneOnOne();
    setLog("演習開始待機中");
  }

  function renderTwoOnTwoTraining(options = {}) {
    root = options.root || getRoot();
    if (!root) return;

    battleMode = "2v2";
    freeMode = options.free === true;
    pendingAttack = null;
    actionCount = 1;

    const protoUnit = getStoryCreateUnit("proto_create_gundam");
    const proto1 = createBattleUnit(protoUnit, { defaultCriticalRate: 5 });
    const proto2 = createBattleUnit(protoUnit, { defaultCriticalRate: 5 });

    proto2.name = "プロトクリエイトガンダム 2番機";
    proto2.hp = Number(getForm(protoUnit).hp || 200);
    proto2.maxHp = proto2.hp;
    proto2.evade = 1;
    proto2.evadeMax = 1;
    proto2.energy = 100;
    proto2.energyMax = 100;
    proto2.slotOrder = [...SLOT_KEYS].reverse();

    const tm1 = createBattleUnit(training_machine, { defaultCriticalRate: freeMode ? 5 : 0 });
    const tm2 = createBattleUnit(training_machine, { defaultCriticalRate: freeMode ? 5 : 0 });
    tm2.name = "トレーニングマシン 2番機";

    playerTeam = {
      style: "分散型",
      focus: "unit1",
      unit1: proto1,
      unit2: proto2
    };

    enemyTeam = {
      style: "分散型",
      focus: "unit1",
      unit1: tm1,
      unit2: tm2
    };

    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      ${renderStyle()}
      <div id="storyBattleRoot">
        <h2 id="storyBattleTitle">チャプター1 演習 2on2</h2>

        <div class="story-team-mode-row">
          <button id="storyTeamStyleBtn">自軍：分散型</button>
          <button id="storyTauntBtn">挑発</button>
          <button id="storyBreakthroughBtn">打破</button>
        </div>

        <div class="story-battle-container story-battle-container-2v2">
          ${renderTeamUnitCard(playerTeam.unit1, "A1", "storyPlayerUnit1", true)}
          ${renderTeamUnitCard(playerTeam.unit2, "A2", "storyPlayerUnit2", false)}
          ${renderTeamUnitCard(enemyTeam.unit1, "B1", "storyEnemyUnit1", true)}
          ${renderTeamUnitCard(enemyTeam.unit2, "B2", "storyEnemyUnit2", false)}
        </div>

        <div class="story-bottom">
          <div id="storyBattleLog">${escapeHtml(logText)}</div>

          <button id="storyMockSlotBtn">スロット行動</button>
          <button id="storyUnit1SlotBtn">1単独行動</button>
          <button id="storyUnit2SlotBtn">2単独行動</button>
          <button id="storyMockEndBtn">ターン終了</button>

          <div id="storyBattleExtraPanel"></div>
        </div>
      </div>
    `;

    bindTwoOnTwoButtons();
    setLog("2on2演習開始待機中");
  }

  function renderUnitCard(unit, sideLabel, id) {
    const hpText = unit.displayHp
      ? unit.displayHp
      : `${unit.hp}/${unit.maxHp}`;

    return `
      <div id="${id}" class="story-unit-card">
        <h3>PLAYER ${sideLabel}</h3>
        <div class="story-unit-name">${escapeHtml(unit.name)}</div>
        <div class="story-hp">HP ${escapeHtml(hpText)}</div>
        <div class="story-evade">回避 ${unit.evade}/${unit.evadeMax}</div>
        ${unit.energyMax > 0 ? `<div class="story-energy">EN ${unit.energy}/${unit.energyMax}</div>` : ""}
        <div class="story-critical">会心率 ${unit.criticalRate}%</div>

        <div class="story-slot-area">
          <b>スロット</b>
          ${renderSlotList(unit)}
        </div>

        ${renderSpecialList(unit)}
      </div>
    `;
  }

  function renderTeamUnitCard(unit, sideLabel, id, focused) {
    const hpText = unit.displayHp
      ? unit.displayHp
      : `${unit.hp}/${unit.maxHp}`;

    return `
      <div id="${id}" class="story-unit-card ${focused ? "story-focus-unit" : ""}">
        <h3>${sideLabel}</h3>
        <button class="story-status-switch-btn" type="button">表示切替</button>
        <button class="story-focus-btn" type="button">フォーカス</button>
        <div class="story-unit-name">${escapeHtml(unit.name)}</div>
        <div class="story-hp">HP ${escapeHtml(hpText)}</div>
        <div class="story-evade">回避 ${unit.evade}/${unit.evadeMax}</div>
        ${unit.energyMax > 0 ? `<div class="story-energy">EN ${unit.energy}/${unit.energyMax}</div>` : ""}
        <div class="story-slot-area">
          <b>スロット</b>
          ${renderSlotList(unit)}
        </div>
      </div>
    `;
  }

  function renderSlotList(unit) {
    return unit.slotOrder.map((slotKey, index) => {
      const slot = unit.slots?.[slotKey];
      const effect = slot?.effect || {};
      return `
        <button
          class="story-slot-name"
          data-unit-id="${escapeHtml(unit.id)}"
          data-slot-key="${slotKey}"
          data-slot-desc="${escapeHtml(getSlotDesc(slot))}"
          type="button"
        >
          ${index + 1}.${escapeHtml(getSlotLabel(slot))}${formatAttackTags(effect)}
        </button>
      `;
    }).join("");
  }

  function renderSpecialList(unit) {
    if (!Array.isArray(unit.specials) || unit.specials.length === 0) return "";

    return `
      <div class="story-special-area">
        <b>特殊行動</b>
        ${unit.specials.map((special, index) => `
          <button
            class="story-special-name"
            data-special-desc="${escapeHtml(special.desc || "詳細なし")}"
            type="button"
          >
            ${index + 1}.${escapeHtml(special.name || "特殊行動")}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderStyle() {
    return `
      <style>
        #storyBattleRoot {
          width: min(900px, 98vw);
          margin: 0 auto;
          color: white;
          box-sizing: border-box;
        }

        #storyBattleRoot button {
          margin: 3px;
        }

        .story-top-line {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 8px 0;
        }

        .story-turn-box {
          width: 48px;
          height: 42px;
          border: 1px solid white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .story-turn-box strong {
          font-size: 18px;
        }

        .story-battle-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .story-battle-container-2v2 {
          grid-template-columns: 1fr 1fr;
        }

        .story-unit-card {
          border: 1px solid white;
          border-radius: 8px;
          padding: 10px;
          background: rgba(0,0,0,0.45);
          box-sizing: border-box;
          min-width: 0;
        }

        .story-focus-unit {
          outline: 2px solid red;
        }

        .story-unit-name {
          font-weight: bold;
          margin-bottom: 6px;
        }

        .story-slot-area,
        .story-special-area {
          margin-top: 8px;
          border-top: 1px solid #777;
          padding-top: 8px;
        }

        .story-slot-name,
        .story-special-name {
          display: block;
          width: 100%;
          text-align: left;
          white-space: normal;
        }

        .story-bottom {
          margin-top: 12px;
          text-align: center;
        }

        #storyBattleLog {
          border: 1px solid white;
          min-height: 44px;
          padding: 8px;
          margin-bottom: 8px;
          white-space: pre-wrap;
          background: rgba(0,0,0,0.8);
        }

        .story-qte-area {
          border: 1px solid #777;
          padding: 6px;
          margin-bottom: 6px;
        }

        .story-highlighted {
          color: red !important;
          border-color: red !important;
          box-shadow: 0 0 10px red !important;
        }

        .story-team-mode-row {
          text-align: center;
          margin-bottom: 8px;
        }

        @media (max-width: 520px) {
          .story-battle-container,
          .story-battle-container-2v2 {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .story-unit-card {
            padding: 6px;
            font-size: 13px;
          }

          #storyBattleRoot button {
            font-size: 12px;
            padding: 4px;
          }
        }
      </style>
    `;
  }

  function bindOneOnOneButtons() {
    document.querySelectorAll(".story-slot-name").forEach(btn => {
      btn.addEventListener("click", () => {
        setLog(btn.dataset.slotDesc || "詳細なし");
      });
    });

    document.querySelectorAll(".story-special-name").forEach(btn => {
      btn.addEventListener("click", () => {
        setLog(btn.dataset.specialDesc || "詳細なし");
      });
    });

    document.getElementById("storyMockSlotBtn")?.addEventListener("click", executePlayerSlot);
    document.getElementById("storyMockSimBtn")?.addEventListener("click", simulatePlayerSlot);
    document.getElementById("storyMockEndBtn")?.addEventListener("click", executeEnemyTurn);
    document.getElementById("storyHitBtn")?.addEventListener("click", resolveHit);
    document.getElementById("storyEvadeBtn")?.addEventListener("click", resolveEvade);
    document.getElementById("storyCriticalBtn")?.addEventListener("click", spendEvadeForCritical);
  }

  function bindTwoOnTwoButtons() {
    document.getElementById("storyMockSlotBtn")?.addEventListener("click", () => {
      setLog("2機同時スロット行動。実処理は次段階で接続します。");
    });

    document.getElementById("storyUnit1SlotBtn")?.addEventListener("click", () => {
      setLog("1番機単独行動。実処理は次段階で接続します。");
    });

    document.getElementById("storyUnit2SlotBtn")?.addEventListener("click", () => {
      setLog("2番機単独行動。実処理は次段階で接続します。");
    });

    document.getElementById("storyMockEndBtn")?.addEventListener("click", () => {
      setLog("敵2機の行動。強制出目処理は次段階で接続します。");
    });

    document.getElementById("storyTeamStyleBtn")?.addEventListener("click", () => {
      if (!playerTeam) return;
      playerTeam.style = playerTeam.style === "分散型" ? "統合型" : "分散型";
      document.getElementById("storyTeamStyleBtn").textContent = `自軍：${playerTeam.style}`;
      setLog(`${playerTeam.style}に変更しました。`);
    });

    document.getElementById("storyTauntBtn")?.addEventListener("click", () => {
      setLog("挑発UI。対象選択処理は次段階で接続します。");
    });

    document.getElementById("storyBreakthroughBtn")?.addEventListener("click", () => {
      renderBreakthroughMock();
    });
  }

  function redrawOneOnOne() {
    const aCard = document.getElementById("storyMockPlayerA");
    const bCard = document.getElementById("storyMockPlayerB");

    if (aCard && playerA) {
      aCard.outerHTML = renderUnitCard(playerA, "A", "storyMockPlayerA");
    }

    if (bCard && playerB) {
      bCard.outerHTML = renderUnitCard(playerB, "B", "storyMockPlayerB");
    }

    const action = document.getElementById("storyActionCounter");
    if (action) action.textContent = String(actionCount);

    bindSlotDetailButtonsOnly();
  }

  function bindSlotDetailButtonsOnly() {
    document.querySelectorAll(".story-slot-name").forEach(btn => {
      btn.addEventListener("click", () => {
        setLog(btn.dataset.slotDesc || "詳細なし");
      });
    });

    document.querySelectorAll(".story-special-name").forEach(btn => {
      btn.addEventListener("click", () => {
        setLog(btn.dataset.specialDesc || "詳細なし");
      });
    });
  }

  function simulatePlayerSlot() {
    const slotNumber = randomSlotNumber();
    const slotKey = `slot${slotNumber}`;
    const slot = playerA?.slots?.[slotKey];

    setLog(`シミュレーション：${slotNumber}. ${getSlotLabel(slot)}`);
  }

  function executePlayerSlot() {
    if (!playerA || !playerB) return;
    if (pendingAttack) {
      setLog("先に相手の攻撃を処理してください。");
      return;
    }

    if (actionCount <= 0) {
      setLog("行動権がありません。ターン終了してください。");
      return;
    }

    const slotNumber = getNextPlayerSlotNumber();
    const slotKey = `slot${slotNumber}`;
    const slot = playerA.slots?.[slotKey];

    applySlotEffect(playerA, playerB, slotNumber, slot, "player");
    actionCount = Math.max(0, actionCount - 1);
    redrawOneOnOne();
  }

  function executeEnemyTurn() {
    if (!playerA || !playerB) return;

    actionCount = 1;

    const slotNumber = getNextEnemySlotNumber();
    const slotKey = `slot${slotNumber}`;
    const slot = playerB.slots?.[slotKey];
    const effect = slot?.effect || {};

    if (effect.type === "evade") {
      playerB.evade = Math.min(playerB.evadeMax, playerB.evade + Number(effect.amount || 0));
      setLog(`トレーニングマシン：${slotNumber}. ${getSlotLabel(slot)}\n回避が増えました。`);
      redrawOneOnOne();
      return;
    }

    if (effect.type !== "attack") {
      setLog(`トレーニングマシン：${slotNumber}. ${getSlotLabel(slot)}\n何も起きません。`);
      redrawOneOnOne();
      return;
    }

    pendingAttack = {
      attacker: playerB,
      defender: playerA,
      slotNumber,
      slot,
      effect,
      damage: Number(effect.damage || 0) * Number(effect.count || 1)
    };

    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "";

    setLog(`トレーニングマシン：${slotNumber}. ${getSlotLabel(slot)}${formatAttackTags(effect)}\n対応を選んでください。`);
    redrawOneOnOne();
  }

  function applySlotEffect(actor, target, slotNumber, slot, actorType) {
    const effect = slot?.effect || {};

    if (effect.type === "heal") {
      const amount = Number(effect.amount || 0);
      actor.hp = Math.min(actor.maxHp, actor.hp + amount);
      setLog(`${actor.name}：${slotNumber}. ${getSlotLabel(slot)}\nHPを${amount}回復。`);
      return;
    }

    if (effect.type === "evade") {
      const amount = Number(effect.amount || 0);
      actor.evade += amount;
      setLog(`${actor.name}：${slotNumber}. ${getSlotLabel(slot)}\n回避+${amount}。`);
      return;
    }

    if (effect.type !== "attack") {
      setLog(`${actor.name}：${slotNumber}. ${getSlotLabel(slot)}\n何も起きません。`);
      return;
    }

    const count = Number(effect.count || 1);
    const damage = Number(effect.damage || 0) * count;

    let finalDamage = damage;
    let evadeText = "";

    if (actorType === "player" && target.evade >= count && !effect.cannotEvade) {
      target.evade -= count;
      finalDamage = 0;
      evadeText = "\n相手は回避しました。";
    }

    target.hp = Math.max(0, target.hp - finalDamage);

    setLog(`${actor.name}：${slotNumber}. ${getSlotLabel(slot)}${formatAttackTags(effect)}\n${finalDamage}ダメージ。${evadeText}`);

    if (target.hp <= 0) {
      setLog(`${target.name}を撃破しました。`);
    }
  }

  function resolveHit() {
    if (!pendingAttack) {
      setLog("処理中の攻撃がありません。");
      return;
    }

    const { attacker, defender, slot, slotNumber, effect } = pendingAttack;

    let damage = Number(effect.damage || 0) * Number(effect.count || 1);
    if (effect.criticalHit) damage *= 2;

    defender.hp = Math.max(0, defender.hp - damage);

    pendingAttack = null;
    hideQte();

    setLog(`${attacker.name}：${slotNumber}. ${getSlotLabel(slot)}${formatAttackTags(effect)}\n被弾しました。${damage}ダメージ。`);
    redrawOneOnOne();
  }

  function resolveEvade() {
    if (!pendingAttack) {
      setLog("処理中の攻撃がありません。");
      return;
    }

    const { attacker, defender, slot, slotNumber, effect } = pendingAttack;
    const count = Number(effect.count || 1);

    if (effect.cannotEvade) {
      setLog(`${attacker.name}：${slotNumber}. ${getSlotLabel(slot)}${formatAttackTags(effect)}\n必中属性のため回避できません。`);
      return;
    }

    if (defender.evade < count) {
      setLog("回避ストックが足りません。");
      return;
    }

    defender.evade -= count;

    pendingAttack = null;
    hideQte();

    setLog(`${attacker.name}：${slotNumber}. ${getSlotLabel(slot)}${formatAttackTags(effect)}\n回避しました。`);
    redrawOneOnOne();
  }

  function hideQte() {
    const qte = document.getElementById("storyQteArea");
    if (qte) qte.style.display = "none";
  }

  function spendEvadeForCritical() {
    if (!playerA) return;

    if (playerA.evade <= 0) {
      setLog("回避ストックがありません。");
      return;
    }

    playerA.evade -= 1;
    playerA.criticalRate += 4;

    setLog(`会心率が${playerA.criticalRate - 4}%→${playerA.criticalRate}%になりました。`);
    redrawOneOnOne();
  }

  function renderBreakthroughMock() {
    setExtraPanel(`
      <div id="storyBreakthroughMock" style="border:1px solid white;margin-top:8px;padding:8px;">
        <div>打破賭け</div>
        <div>
          ${Array.from({ length: 11 }, (_, i) => `<button class="story-breakthrough-bet-btn" data-bet="${i}">${i}</button>`).join("")}
        </div>
        <div id="storyBreakthroughResult"></div>
      </div>
    `);

    document.querySelectorAll(".story-breakthrough-bet-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bet = Number(btn.dataset.bet || 0);
        const bonus = Math.max(1, Math.ceil(bet / 2));
        document.getElementById("storyBreakthroughResult").innerHTML = `
          <p>${bet}ターン分のシミュレーションを行いました。</p>
          <p class="story-breakthrough-bonus">ボーナス行動権 +${bonus}</p>
        `;
      });
    });
  }

  function renderModeButtons({ on1v1, on2v2, onEnd } = {}) {
    setExtraPanel(`
      <div style="margin-top:10px;">
        <button id="storyFree1v1Btn">1on1</button>
        <button id="storyFree2v2Btn">2on2</button>
        <button id="storyChapter1EndBtn">終了</button>
      </div>
    `);

    document.getElementById("storyFree1v1Btn")?.addEventListener("click", () => {
      if (typeof on1v1 === "function") on1v1();
    });

    document.getElementById("storyFree2v2Btn")?.addEventListener("click", () => {
      if (typeof on2v2 === "function") on2v2();
    });

    document.getElementById("storyChapter1EndBtn")?.addEventListener("click", () => {
      if (typeof onEnd === "function") onEnd();
    });
  }

  return {
    renderOneOnOneTraining,
    renderTwoOnTwoTraining,
    renderModeButtons,
    setExtraPanel,
    setLog,
    setHighlight,
    clearHighlight,
    forceNextPlayerSlot,
    forceNextEnemySlot
  };
}
