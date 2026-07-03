import {
  loadStorySave,
  addStoryUnitExp,
  getStoryUnitLevelInfo,
  unlockStoryCompanionUnit,
  unlockStoryDrop,
  unlockStoryGaUnit
} from "./story_save.js";

function getUnitExp(unit) {
  return Math.max(0, Number(unit?.exp || 0));
}

function collectDropCandidates(units, save) {
  const acquired = save.inventory?.storyDrops || {};
  const result = [];

  units.forEach(unit => {
    const drops = unit?.storyDrops;
    if (!drops) return;

    [
      ...(Array.isArray(drops.initial) ? drops.initial : []),
      ...(Array.isArray(drops.random) ? drops.random : []),
      ...(Array.isArray(drops.equipment) ? drops.equipment : [])
    ].forEach(drop => {
      if (!drop?.id) return;
      if (acquired[drop.id] === true) return;
      result.push({ ...drop, sourceUnitId: unit.id, sourceUnitName: unit.name });
    });
  });

  return result;
}

function pickOneDrop(units, save) {
  const candidates = collectDropCandidates(units, save);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function formatLevelLine(unit, before, after, gainExp) {
  return `
${unit.name}
Lv ${before.level} → ${after.level}
Exp ${before.currentExp} → ${after.currentExp}
獲得Exp +${gainExp}
`;
}

export function createStoryResultController(ctx) {
  function renderResult({ winnerPlayer, playerUnits = [], enemyUnits = [], learningMode = "", onDone } = {}) {
    const root = document.getElementById("storyModeRoot") || document.createElement("div");

    root.id = "storyModeRoot";
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "20000";
    root.style.background = "black";
    root.style.color = "white";
    root.style.overflowY = "auto";
    root.style.padding = "16px";
    root.style.boxSizing = "border-box";

    if (!root.parentElement) document.body.appendChild(root);

    const win = winnerPlayer === "A";
    const gainExp = win ? enemyUnits.reduce((sum, unit) => sum + getUnitExp(unit), 0) : 0;
    const expRows = [];

    if (win && gainExp > 0) {
      playerUnits.forEach(unit => {
        if (!unit?.id) return;

        const before = getStoryUnitLevelInfo(unit.id);
        addStoryUnitExp(unit.id, gainExp);
        const after = getStoryUnitLevelInfo(unit.id);

        expRows.push(formatLevelLine(unit, before, after, gainExp));
      });
    }

    let dropText = "なし";
    let unlockedText = "なし";
    let gaText = "なし";

    if (win) {
      const saveBeforeDrop = loadStorySave();
      const drop = pickOneDrop(enemyUnits, saveBeforeDrop);

      if (drop) {
        unlockStoryDrop(drop);
        dropText = `${drop.sourceUnitName}：${drop.label}`;
      }

      if (learningMode === "companion") {
        const unlocked = [];

        enemyUnits.forEach(unit => {
          if (!unit?.storyCompanion) return;

          const save = loadStorySave();
          if (save.companionUnits?.[unit.id]?.unlocked === true) return;

          unlockStoryCompanionUnit(unit.id, unit.storyCompanion.cost || 0);
          unlocked.push(`${unit.name} が同行可能になりました`);
        });

        if (unlocked.length) unlockedText = unlocked.join("\n");
      }

      if (learningMode === "ga") {
        const unlocked = [];

        enemyUnits.forEach(unit => {
          if (!unit?.id) return;
          unlockStoryGaUnit(unit);
          unlocked.push(`${unit.name} のGAデータを取得しました`);
        });

        if (unlocked.length) gaText = unlocked.join("\n");
      }
    }

    root.innerHTML = `
      <h2>RESULT</h2>

      <h3>${win ? "勝利" : "敗北"}</h3>

      <h3>獲得Exp</h3>
      <pre>${expRows.length ? expRows.join("") : "なし"}</pre>

      <h3>ドロップ</h3>
      <pre>${dropText}</pre>

      <h3>同行条件解放</h3>
      <pre>${unlockedText}</pre>

      <h3>GAデータ</h3>
      <pre>${gaText}</pre>

      <button id="storyResultOkBtn">OK</button>
    `;

    document.getElementById("storyResultOkBtn")?.addEventListener("click", () => {
      if (typeof onDone === "function") {
        onDone();
      } else {
        ctx.renderStoryMainMenu?.();
      }
    });
  }

  return {
    renderResult
  };
}
