import { resolveSlotEffect } from "./js_slot_effects.js";
import {
  applyUnitDerivedState,
  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,
  executeUnitAfterSlotResolved,
  executeUnitExtraWeaponResult
} from "./js_unit_runtime.js";

export function create2v2Breakthrough(ctx) {
  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function getAliveUnitKeys(team) {
    return ["unit1", "unit2"].filter((unitKey) => team?.[unitKey] && !isUnitDefeated(team[unitKey]));
  }

  function getRandomSlotKey(unit) {
    const keys = ctx.getRollableSlotKeys(unit);
    if (!Array.isArray(keys) || keys.length <= 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function createBreakthroughAdapter(realAdapter, scoreState) {
    return {
      ...realAdapter,

      heal(ownerPlayer, actor, amount) {
        const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
        const value = Math.max(0, Number(amount || 0));
        scoreState[enemyPlayer].healReduction += value;
        return value;
      },

      addTeamEvade(ownerPlayer, actor, amount) {
        const value = Math.max(0, Number(amount || 0));

        if (realAdapter && typeof realAdapter.addTeamEvade === "function") {
          return realAdapter.addTeamEvade(ownerPlayer, actor, value);
        }

        actor.evade = Math.max(0, Number(actor.evade || 0)) + value;
        return value;
      }
    };
  }

  function collectDamageFromAttacks({
    attacks,
    ownerPlayer,
    unitKey,
    enemyPlayer
  }) {
    return attacks.reduce((sum, attack) => {
      let value = Math.max(0, Number(attack.damage || 0));

      if (
        ctx.twoVtwoTauntSystem &&
        typeof ctx.twoVtwoTauntSystem.modifyDamage === "function"
      ) {
        const enemyTeam = ctx.getTeam(enemyPlayer);
        const defenderUnitKey = enemyTeam?.focusUnitKey || "unit1";

        value = ctx.twoVtwoTauntSystem.modifyDamage({
          attackerPlayer: ownerPlayer,
          attackerUnitKey: unitKey,
          defenderPlayer: enemyPlayer,
          defenderUnitKey,
          damage: value
        });
      }

      return sum + value;
    }, 0);
  }

  function simulateOneUnitSlot({
    ownerPlayer,
    unitKey,
    unit,
    enemyPlayer,
    scoreState,
    realAdapter,
    turnIndex
  }) {
    applyUnitDerivedState(unit);

    const slotKey = getRandomSlotKey(unit);
    if (!slotKey) {
      return {
        turnIndex,
        unitKey,
        unitName: unit?.name || "不明",
        slotNumber: "-",
        slotName: "使用可能スロットなし",
        damage: 0,
        healReduction: 0,
        evadeGain: 0,
        notes: []
      };
    }

    const slot = ctx.getSlotByKey(unit, slotKey);
    const slotNumber = ctx.getSlotNumberFromKey(slotKey);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const enemyUnit = enemyTeam?.[enemyTeam.focusUnitKey || "unit1"] || null;

    const evadeBefore = Number(unit.evade || 0);
    const enemyReductionBefore = Number(scoreState[enemyPlayer].healReduction || 0);

    const breakthroughAdapter = createBreakthroughAdapter(realAdapter, scoreState);
    const notes = [];

    const beforeResult = executeUnitBeforeSlot(unit, slotNumber, {
      ownerPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: enemyUnit,
      slotKey,
      slot,
      isBreakthroughSimulation: true,
      twoVtwoAdapter: breakthroughAdapter
    });

    if (beforeResult?.message) notes.push(beforeResult.message);

    if (beforeResult?.cancelSlot) {
      return {
        turnIndex,
        unitKey,
        unitName: unit.name,
        slotNumber,
        slotName: slot?.label || "不明",
        damage: 0,
        healReduction: 0,
        evadeGain: Math.max(0, Number(unit.evade || 0) - evadeBefore),
        notes
      };
    }

    let resolvedSlot = slot;
    let resolvedSlotKey = slotKey;
    let resolvedSlotNumber = slotNumber;

    if (beforeResult?.replaceSlotAction) {
      resolvedSlotKey = beforeResult.replaceSlotAction.slotKey || resolvedSlotKey;
      resolvedSlot = beforeResult.replaceSlotAction.slotData || resolvedSlot;
      resolvedSlotNumber = ctx.getSlotNumberFromKey(resolvedSlotKey);
    }

    if (enemyUnit) {
      const enemyBeforeResult = executeUnitEnemyBeforeSlot(enemyUnit, resolvedSlotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: ownerPlayer,
        enemyPlayerLabel: `PLAYER ${ownerPlayer}`,
        enemyRolledSlotKey: resolvedSlotKey,
        enemyState: unit,
        isBreakthroughSimulation: true,
        twoVtwoAdapter: breakthroughAdapter
      });

      if (enemyBeforeResult?.message) notes.push(enemyBeforeResult.message);
    }

    const result = resolveSlotEffect({
      slot: resolvedSlot,
      actor: unit,
      ownerPlayer,
      twoVtwoAdapter: breakthroughAdapter
    });

    const afterResult = executeUnitAfterSlotResolved(unit, resolvedSlotNumber, result, {
      ownerPlayer,
      enemyPlayer,
      slotKey: resolvedSlotKey,
      slotNumber: resolvedSlotNumber,
      slot: resolvedSlot,
      isBreakthroughSimulation: true,
      twoVtwoAdapter: breakthroughAdapter
    });

    const extraResult = executeUnitExtraWeaponResult(unit, {
      ownerPlayer,
      enemyPlayer,
      slotKey: resolvedSlotKey,
      slotNumber: resolvedSlotNumber,
      slot: resolvedSlot,
      isBreakthroughSimulation: true,
      twoVtwoAdapter: breakthroughAdapter
    });

    const attacks = [
      ...(Array.isArray(result?.attacks) ? result.attacks : []),
      ...(Array.isArray(afterResult?.appendAttacks) ? afterResult.appendAttacks : []),
      ...(Array.isArray(extraResult?.appendAttacks) ? extraResult.appendAttacks : [])
    ];

    const damage = collectDamageFromAttacks({
      attacks,
      ownerPlayer,
      unitKey,
      enemyPlayer
    });

    const evadeGain = Math.max(0, Number(unit.evade || 0) - evadeBefore);
    const healReductionGain = Math.max(
      0,
      Number(scoreState[enemyPlayer].healReduction || 0) - enemyReductionBefore
    );

    scoreState[ownerPlayer].rawDamage += damage;

    if (result?.message) notes.push(result.message);
    if (afterResult?.message) notes.push(afterResult.message);
    if (extraResult?.message) notes.push(extraResult.message);

    if (Array.isArray(extraResult?.appendMessages)) {
      notes.push(...extraResult.appendMessages.filter(Boolean));
    }

    applyUnitDerivedState(unit);

    return {
      turnIndex,
      unitKey,
      unitName: unit.name,
      slotNumber: resolvedSlotNumber,
      slotName: resolvedSlot?.label || "不明",
      damage,
      healReduction: healReductionGain,
      evadeGain,
      notes
    };
  }

  function calculateBonusTurns(winnerBet, loserBet) {
    const high = Math.max(Number(winnerBet || 0), Number(loserBet || 0));

    if (high >= 9) return 5;
    if (high >= 7) return 4;
    if (high >= 5) return 3;
    if (high >= 3) return 2;
    return 1;
  }

  function applyBonusActions(winnerPlayer, bonusTurns) {
    const team = ctx.getTeam(winnerPlayer);
    if (!team) return;

    if (team.mode === "unified") {
      const unified = team.unified;
      if (unified) {
        unified.actionCount = Math.max(0, Number(unified.actionCount || 0)) + Number(bonusTurns || 0);
      }
      return;
    }

    if (team.unit1 && !isUnitDefeated(team.unit1)) {
      team.unit1.actionCount = Math.max(0, Number(team.unit1.actionCount || 0)) + Number(bonusTurns || 0);
    }

    if (team.unit2 && !isUnitDefeated(team.unit2)) {
      team.unit2.actionCount = Math.max(0, Number(team.unit2.actionCount || 0)) + Number(bonusTurns || 0);
    }
  }

  function endTauntAndDuelAfterBreakthrough() {
    ["A", "B"].forEach((playerKey) => {
      const team = ctx.getTeam(playerKey);
      if (!team || !ctx.twoVtwoTauntSystem) return;
      ctx.twoVtwoTauntSystem.clearBattleState(team);
    });
  }

  function clampAllTeamEvade() {
    const teamA = ctx.getTeam("A");
    const teamB = ctx.getTeam("B");

    if (teamA && typeof ctx.clampTeamEvadeToMax === "function") {
      ctx.clampTeamEvadeToMax(teamA);
    }

    if (teamB && typeof ctx.clampTeamEvadeToMax === "function") {
      ctx.clampTeamEvadeToMax(teamB);
    }
  }

  function runBreakthrough({ betA, betB }) {
    const aBet = Math.max(0, Math.min(10, Number(betA || 0)));
    const bBet = Math.max(0, Math.min(10, Number(betB || 0)));

    const teamA = ctx.getTeam("A");
    const teamB = ctx.getTeam("B");

    const scoreState = {
      A: { rawDamage: 0, healReduction: 0 },
      B: { rawDamage: 0, healReduction: 0 }
    };

    const logs = [];
    const maxTurns = Math.max(aBet, bBet);

    for (let turnIndex = 1; turnIndex <= maxTurns; turnIndex += 1) {
      if (turnIndex <= aBet) {
        getAliveUnitKeys(teamA).forEach((unitKey) => {
          logs.push(simulateOneUnitSlot({
            ownerPlayer: "A",
            unitKey,
            unit: teamA[unitKey],
            enemyPlayer: "B",
            scoreState,
            realAdapter: ctx.twoVtwoAdapter,
            turnIndex
          }));
        });
      }

      if (turnIndex <= bBet) {
        getAliveUnitKeys(teamB).forEach((unitKey) => {
          logs.push(simulateOneUnitSlot({
            ownerPlayer: "B",
            unitKey,
            unit: teamB[unitKey],
            enemyPlayer: "A",
            scoreState,
            realAdapter: ctx.twoVtwoAdapter,
            turnIndex
          }));
        });
      }
    }

    const finalA = Math.max(0, scoreState.A.rawDamage - scoreState.A.healReduction);
    const finalB = Math.max(0, scoreState.B.rawDamage - scoreState.B.healReduction);

    let winnerPlayer = null;
    let bonusTurns = 0;

    if (finalA > finalB) {
      winnerPlayer = "A";
      bonusTurns = calculateBonusTurns(aBet, bBet);
    } else if (finalB > finalA) {
      winnerPlayer = "B";
      bonusTurns = calculateBonusTurns(bBet, aBet);
    }

    if (winnerPlayer) {
      applyBonusActions(winnerPlayer, bonusTurns);
      ctx.setCurrentPlayer(winnerPlayer);
    }

    endTauntAndDuelAfterBreakthrough();
    clampAllTeamEvade();

    return {
      logs,
      scoreA: finalA,
      scoreB: finalB,
      rawA: scoreState.A.rawDamage,
      rawB: scoreState.B.rawDamage,
      reductionA: scoreState.A.healReduction,
      reductionB: scoreState.B.healReduction,
      winnerPlayer,
      bonusTurns
    };
  }

  function renderBreakthroughBetChoice() {
    const attackLog = document.getElementById("attackLog");
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
              const result = runBreakthrough({ betA, betB });
              renderBreakthroughResult(result);
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

  function renderBreakthroughResult(result) {
    const attackLog = document.getElementById("attackLog");
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
      PLAYER A: ${result.scoreA}（素点:${result.rawA} / 回復減算:${result.reductionA}）<br>
      PLAYER B: ${result.scoreB}（素点:${result.rawB} / 回復減算:${result.reductionB}）<br>
      ${
        result.winnerPlayer
          ? `勝者: PLAYER ${result.winnerPlayer}<br>取得ボーナスターン: +${result.bonusTurns}`
          : "引き分け：ボーナスなし"
      }
    `;
    attackLog.appendChild(summary);

    result.logs.forEach((log) => {
      const div = document.createElement("div");
      div.style.borderTop = "1px solid #666";
      div.style.paddingTop = "4px";
      div.style.marginTop = "4px";

      div.innerHTML = `
        ${log.turnIndex}T / ${log.unitKey === "unit2" ? "2" : "1"}機目 ${log.unitName}<br>
        ${log.slotNumber}.${log.slotName}<br>
        加算ダメージ:${log.damage}
        ${log.healReduction ? ` / 回復減算:${log.healReduction}` : ""}
        ${log.evadeGain ? ` / 回避+${log.evadeGain}` : ""}
        ${
          log.notes.length > 0
            ? `<br>${log.notes.join("<br>")}`
            : ""
        }
      `;

      attackLog.appendChild(div);
    });

   ctx.redrawBattleBoards();
    });

    attackLog.appendChild(backBtn);
  }

  return {
    renderBreakthroughBetChoice,
    runBreakthrough
  };
}
