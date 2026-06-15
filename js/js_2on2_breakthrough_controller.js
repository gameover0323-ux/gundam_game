import { create2v2BreakthroughEngine } from "./js_2on2_breakthrough_engine.js";

export function create2v2BreakthroughController(ctx) {
  const engine = create2v2BreakthroughEngine(ctx);

  function getAttackLog() {
    return document.getElementById("attackLog");
  }

  function renderBetChoice() {
    const attackLog = getAttackLog();
    if (!attackLog) return;

    let betA = null;
    let betB = null;

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

        for (let i = 0; i <= 10; i += 1) {
          const btn = document.createElement("button");
          btn.textContent = i === 0 ? "0 放棄" : String(i);

          btn.addEventListener("click", () => {
            if (player === "A") betA = i;
            if (player === "B") betB = i;

            if (betA !== null && betB !== null) {
              const result = engine.runBreakthrough({ betA, betB });
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
