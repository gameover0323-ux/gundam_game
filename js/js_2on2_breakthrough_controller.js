import { create2v2BreakthroughEngine } from "./js_2on2_breakthrough_engine.js";

export function create2v2BreakthroughController(ctx) {
  const engine = create2v2BreakthroughEngine(ctx);

  let onlineBetA = null;
  let onlineBetB = null;
  let onlineResultApplied = false;

  function getAttackLog() {
    return document.getElementById("attackLog");
  }

  function isOnline2v2() {
    return typeof ctx.getBattleMode === "function" && ctx.getBattleMode() === "online2v2";
  }

  function getMyPlayer() {
    return typeof ctx.getOnlineMyPlayer === "function" ? ctx.getOnlineMyPlayer() : null;
  }

  function canSelectBet(player) {
    if (!isOnline2v2()) return true;
    return getMyPlayer() === player;
  }

function shouldAutoMirrorCpuBet() {
  if (isOnline2v2()) return false;

  const mode =
    typeof ctx.getBattleMode === "function"
      ? ctx.getBattleMode()
      : "";

  return mode === "vscpu2v2" || mode === "challenge2v2";
}

function getOpponentPlayer(player) {
  return player === "A" ? "B" : "A";
}
  
  function resetOnlineBets() {
    onlineBetA = null;
    onlineBetB = null;
    onlineResultApplied = false;
  }

  function getBetValue(player) {
    return player === "A" ? onlineBetA : onlineBetB;
  }

  function setBetValue(player, value) {
    if (player === "A") onlineBetA = value;
    if (player === "B") onlineBetB = value;
  }

  function bothBetsReady() {
    return onlineBetA !== null && onlineBetB !== null;
  }

  function shouldRunOnlineBreakthrough() {
    return isOnline2v2() && getMyPlayer() === "A";
  }

  function runOnlineBreakthroughIfReady() {
    if (!isOnline2v2()) return false;
    if (!bothBetsReady()) return false;
    if (onlineResultApplied) return true;

    if (!shouldRunOnlineBreakthrough()) {
      renderWaitingForPlayerAResult();
      return true;
    }

    const result = engine.runBreakthrough({
      betA: onlineBetA,
      betB: onlineBetB
    });

    onlineResultApplied = true;
    renderResult(result, { publishOnline: true });
    return true;
  }

  function renderWaitingForPlayerAResult() {
    const attackLog = getAttackLog();
    if (!attackLog) return;

    attackLog.innerHTML = "";

    const title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    title.textContent = "打破賭け：PLAYER A の結果待ち";
    attackLog.appendChild(title);

    const summary = document.createElement("div");
    summary.innerHTML = `
      PLAYER A: ${onlineBetA === null ? "未選択" : onlineBetA}<br>
      PLAYER B: ${onlineBetB === null ? "未選択" : onlineBetB}<br>
      PLAYER A端末でシミュレーション結果を確定します。
    `;
    attackLog.appendChild(summary);
  }

  function renderBetChoice() {
    if (isOnline2v2() && onlineBetA === null && onlineBetB === null) {
      onlineResultApplied = false;
    }

    const attackLog = getAttackLog();
    if (!attackLog) return;

    function render() {
      attackLog.innerHTML = "";

      const title = document.createElement("div");
      title.style.fontWeight = "bold";
      title.style.marginBottom = "6px";
      title.textContent = "打破賭け：0〜10を選択";
      attackLog.appendChild(title);

      [
        { player: "A", value: getBetValue("A") },
        { player: "B", value: getBetValue("B") }
      ].forEach(({ player, value }) => {
        const row = document.createElement("div");
        row.style.marginBottom = "8px";

        const label = document.createElement("div");
        label.textContent = `PLAYER ${player}: ${value === null ? "未選択" : value}`;
        row.appendChild(label);

        for (let i = 0; i <= 10; i += 1) {
          const btn = document.createElement("button");
          btn.textContent = i === 0 ? "0 放棄" : String(i);

          if (!canSelectBet(player) || value !== null) {
            btn.disabled = true;
          }

          btn.addEventListener("click", () => {
            if (!canSelectBet(player)) {
              if (ctx.showPopup) ctx.showPopup("自分側のベットのみ選択できます");
              return;
            }

           setBetValue(player, i);

if (shouldAutoMirrorCpuBet()) {
  const opponent = getOpponentPlayer(player);
  if (getBetValue(opponent) === null) {
    setBetValue(opponent, i);
  }
}

if (isOnline2v2() && typeof ctx.onOnline2v2BreakthroughBet === "function") {
              ctx.onOnline2v2BreakthroughBet(player, i);
            }

            if (isOnline2v2()) {
              if (!runOnlineBreakthroughIfReady()) {
                render();
              }
              return;
            }

            if (bothBetsReady()) {
              const result = engine.runBreakthrough({
                betA: onlineBetA,
                betB: onlineBetB
              });
              renderResult(result);
              return;
            }

            render();
          });

          row.appendChild(btn);
        }

        attackLog.appendChild(row);
      });
    }

    render();
  }

  function renderResult(result, options = {}) {
    const attackLog = getAttackLog();
    if (!attackLog || !result) return;

    onlineResultApplied = true;

    attackLog.innerHTML = "";

    const title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    title.textContent = "打破賭け 結果";
    attackLog.appendChild(title);

    const summary = document.createElement("div");
    summary.style.marginBottom = "8px";
    summary.innerHTML = `
      PLAYER A: ${result.scoreA}（素点:${result.rawA} / 回復減算:${result.reductionA} / ベット:${result.betA}）<br>
      PLAYER B: ${result.scoreB}（素点:${result.rawB} / 回復減算:${result.reductionB} / ベット:${result.betB}）<br>
      ${
        result.winnerPlayer
          ? `勝者: PLAYER ${result.winnerPlayer}<br>取得ボーナス行動権: +${result.bonusTurns}`
          : "同点：賭け直し可能"
      }
    `;
    attackLog.appendChild(summary);

    if (Array.isArray(result.logs)) {
      result.logs.forEach((log) => {
        const div = document.createElement("div");
        div.style.borderTop = "1px solid #666";
        div.style.paddingTop = "4px";
        div.style.marginTop = "4px";

        div.innerHTML = `
          ${log.turnIndex}T / PLAYER ${log.player} / ${log.unitKey === "unit2" ? "2" : "1"}機目 ${log.unitName}<br>
          ${log.slotNumber}.${log.slotName}<br>
          加算ダメージ:${log.damage}
          ${log.healReduction ? ` / 回復減算:${log.healReduction}` : ""}
          ${log.evadeGain ? ` / 回避+${log.evadeGain}` : ""}
          ${
            Array.isArray(log.notes) && log.notes.length > 0
              ? `<br>${log.notes.join("<br>")}`
              : ""
          }
        `;

        attackLog.appendChild(div);
      });
    }

    if (!result.winnerPlayer) {
      const retryBtn = document.createElement("button");
      retryBtn.textContent = "賭け直す";
      retryBtn.addEventListener("click", () => {
        engine.clampAllTeamEvade();
        resetOnlineBets();

        if (isOnline2v2() && typeof ctx.onOnline2v2BreakthroughStart === "function") {
          ctx.onOnline2v2BreakthroughStart(getMyPlayer());
        }

        renderBetChoice();
      });
      attackLog.appendChild(retryBtn);
    }

    ctx.redrawBattleBoards();

    if (
      isOnline2v2() &&
      options.publishOnline === true &&
      typeof ctx.onOnline2v2BreakthroughResult === "function"
    ) {
      ctx.onOnline2v2BreakthroughResult(result);
    }
  }

  function applyOnlineBet(player, value) {
    if (player !== "A" && player !== "B") return;

    const safeValue = Number(value);
    if (!Number.isInteger(safeValue) || safeValue < 0 || safeValue > 10) return;

    setBetValue(player, safeValue);

    if (!runOnlineBreakthroughIfReady()) {
      renderBetChoice();
    }
  }

  function applyOnlineResult(result) {
    if (!result) return;

    onlineResultApplied = true;

    onlineBetA = typeof result.betA === "number" ? result.betA : onlineBetA;
    onlineBetB = typeof result.betB === "number" ? result.betB : onlineBetB;

    renderResult(result, { publishOnline: false });
  }

  return {
    renderBetChoice,
    renderResult,
    applyOnlineBet,
    applyOnlineResult,
    runBreakthrough: engine.runBreakthrough,
    simulateOneDuelSlot: engine.simulateOneDuelSlot,
    clampAllTeamEvade: engine.clampAllTeamEvade,
    getDuelUnitKey: engine.getDuelUnitKey,
    getBonusTurns: engine.getBonusTurns
  };
}
