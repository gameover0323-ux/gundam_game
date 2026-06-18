import { create2v2BreakthroughEngine } from "./js_2on2_breakthrough_engine.js";

export function create2v2BreakthroughController(ctx) {
  const engine = create2v2BreakthroughEngine(ctx);

  let session = {
    active: false,
    initiatorPlayer: "A",
    betA: null,
    betB: null,
    resolved: false
  };

  function isOnline2v2() {
    return ctx.getBattleMode?.() === "online2v2";
  }

  function getMyPlayer() {
    return ctx.getOnlineMyPlayer?.() || null;
  }

  function canBetPlayer(player) {
    if (!isOnline2v2()) return true;
    return getMyPlayer() === player;
  }

  function isCpuPlayer(playerKey) {
    return ctx.getBattleMode?.() === "vscpu2v2" && playerKey === "B";
  }

  function getAttackLog() {
    return document.getElementById("attackLog");
  }

  function setBet(player, value, options = {}) {
    if (player === "A") session.betA = value;
    if (player === "B") session.betB = value;

    if (isCpuPlayer("B") && player !== "B") {
      session.betB = value;
    }

    if (
      options.publish !== false &&
      isOnline2v2() &&
      typeof ctx.onOnline2v2BreakthroughBet === "function"
    ) {
      ctx.onOnline2v2BreakthroughBet(player, value);
    }
  }

  function maybeResolve() {
    if (session.resolved) return;
    if (session.betA === null || session.betB === null) return;

    if (isOnline2v2() && getMyPlayer() !== session.initiatorPlayer) {
      renderBetChoice({ keepSession: true, suppressOnlinePublish: true });
      return;
    }

    const result = engine.runBreakthrough({
      betA: session.betA,
      betB: session.betB
    });

    session.resolved = true;
    renderResult(result);

    if (
      isOnline2v2() &&
      typeof ctx.onOnline2v2BreakthroughResult === "function"
    ) {
      ctx.onOnline2v2BreakthroughResult(result);
    }
  }

  function applyOnlineBet(player, value) {
    if (!session.active) {
      session = {
        active: true,
        initiatorPlayer: "A",
        betA: null,
        betB: null,
        resolved: false
      };
    }

    setBet(player, Number(value), { publish: false });
    maybeResolve();

    if (!session.resolved) {
      renderBetChoice({ keepSession: true, suppressOnlinePublish: true });
    }
  }

  function renderBetChoice(options = {}) {
    const attackLog = getAttackLog();
    if (!attackLog) return;

    if (!options.keepSession) {
      session = {
        active: true,
        initiatorPlayer: options.initiatorPlayer === "B" ? "B" : "A",
        betA: null,
        betB: null,
        resolved: false
      };
    }

    if (
      isOnline2v2() &&
      !options.suppressOnlinePublish &&
      typeof ctx.onOnline2v2BreakthroughStart === "function"
    ) {
      ctx.onOnline2v2BreakthroughStart(session.initiatorPlayer);
    }

    attackLog.innerHTML = "";

    const title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    title.textContent = "打破賭け：0〜10を選択";
    attackLog.appendChild(title);

    [
      { player: "A", value: session.betA },
      { player: "B", value: session.betB }
    ].forEach(({ player, value }) => {
      const row = document.createElement("div");
      row.style.marginBottom = "8px";

      const label = document.createElement("div");
      label.textContent = `PLAYER ${player}: ${value === null ? "未選択" : value}`;
      row.appendChild(label);

      const isCpuRow = isCpuPlayer(player);
      const disabledByOnline = isOnline2v2() && !canBetPlayer(player);

      for (let i = 0; i <= 10; i += 1) {
        const btn = document.createElement("button");
        btn.textContent = i === 0 ? "0 放棄" : String(i);
        btn.disabled = isCpuRow || disabledByOnline;

        btn.addEventListener("click", () => {
          if (isCpuRow) {
            ctx.showPopup("CPUの打破ベットは相手と同じ値になります");
            return;
          }

          setBet(player, i);
          maybeResolve();

          if (!session.resolved) {
            renderBetChoice({ keepSession: true, suppressOnlinePublish: true });
          }
        });

        row.appendChild(btn);
      }

      if (disabledByOnline) {
        const note = document.createElement("div");
        note.style.fontSize = "12px";
        note.textContent = "相手の選択待ち";
        row.appendChild(note);
      }

      attackLog.appendChild(row);
    });
  }

  function renderResult(result) {
    const attackLog = getAttackLog();
    if (!attackLog) return;

    session.resolved = true;

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

    ctx.redrawBattleBoards();
  }

  return {
    renderBetChoice,
    renderResult,
    applyOnlineBet,
    runBreakthrough: engine.runBreakthrough,
    simulateOneDuelSlot: engine.simulateOneDuelSlot,
    clampAllTeamEvade: engine.clampAllTeamEvade,
    getDuelUnitKey: engine.getDuelUnitKey,
    getBonusTurns: engine.getBonusTurns
  };
}
