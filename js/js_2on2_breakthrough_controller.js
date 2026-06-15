import { create2v2BreakthroughEngine } from "./js_2on2_breakthrough_engine.js";

export function create2v2BreakthroughController(ctx) {
  const engine = create2v2BreakthroughEngine(ctx);

  function isCpuPlayer(playerKey) {
    return (
      typeof ctx.getBattleMode === "function" &&
      ctx.getBattleMode() === "vscpu2v2" &&
      playerKey === "B"
    );
  }

  function getAttackLog() {
    return document.getElementById("attackLog");
  }

  function renderBetChoice(options = {}) {
    const attackLog = getAttackLog();
    if (!attackLog) return;

    const initiatorPlayer = options.initiatorPlayer === "B" ? "B" : "A";
    const cpuPlayer = "B";

    let betA = null;
    let betB = null;

    function setBet(player, value) {
      if (player === "A") betA = value;
      if (player === "B") betB = value;

      if (isCpuPlayer(cpuPlayer) && player !== cpuPlayer) {
        betB = value;
      }
    }

    function render() {
      attackLog.innerHTML = "";

      const title = document.createElement("div");
      title.style.fontWeight = "bold";
      title.style.marginBottom = "6px";
      title.textContent = "打破賭け：0〜10を選択";
      attackLog.appendChild(title);

      [
        { player: "A", value: betA },
        { player: "B", value: betB }
      ].forEach(({ player, value }) => {
        const row = document.createElement("div");
        row.style.marginBottom = "8px";

        const label = document.createElement("div");
        label.textContent = `PLAYER ${player}: ${value === null ? "未選択" : value}`;
        row.appendChild(label);

        const isCpuRow = isCpuPlayer(player);

        for (let i = 0; i <= 10; i += 1) {
          const btn = document.createElement("button");
          btn.textContent = i === 0 ? "0 放棄" : String(i);
          btn.disabled = isCpuRow;

          btn.addEventListener("click", () => {
            if (isCpuRow) {
              ctx.showPopup("CPUの打破ベットは相手と同じ値になります");
              return;
            }

            setBet(player, i);

            if (betA !== null && betB !== null) {
              const result = engine.runBreakthrough({ betA, betB });
              renderResult(result);
              return;
            }

            render();
          });

          row.appendChild(btn);
        }

        if (isCpuRow) {
          const note = document.createElement("div");
          note.style.fontSize = "12px";
          note.textContent = "CPUは相手と同じターン数を自動ベット";
          row.appendChild(note);
        }

        attackLog.appendChild(row);
      });

      if (isCpuPlayer(cpuPlayer) && initiatorPlayer === cpuPlayer) {
        const note = document.createElement("div");
        note.textContent = "CPUは自発的に打破を行いません";
        attackLog.appendChild(note);
      }
    }

    render();
  }

  function renderResult(result) {
    const attackLog = getAttackLog();
    if (!attackLog) return;

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

    if (!result.winnerPlayer) {
      const retryBtn = document.createElement("button");
      retryBtn.textContent = "賭け直す";
      retryBtn.addEventListener("click", () => {
        engine.clampAllTeamEvade();
        renderBetChoice();
      });
      attackLog.appendChild(retryBtn);
    }

    ctx.redrawBattleBoards();
  }

  return {
    renderBetChoice,
    renderResult,
    runBreakthrough: engine.runBreakthrough,
    simulateOneDuelSlot: engine.simulateOneDuelSlot,
    clampAllTeamEvade: engine.clampAllTeamEvade,
    getDuelUnitKey: engine.getDuelUnitKey,
    getBonusTurns: engine.getBonusTurns
  };
}
