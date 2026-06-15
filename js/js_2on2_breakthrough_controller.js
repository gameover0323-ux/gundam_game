import { resolveSlotEffect } from "./js_slot_effects.js";
import {
  applyUnitDerivedState,
  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,
  executeUnitAfterSlotResolved,
  executeUnitExtraWeaponResult
} from "./js_unit_runtime.js";

export function create2v2Breakthrough(ctx) {
  const BONUS_TABLE = {
    10: { 10: 5, 9: 4, 8: 4, 7: 3, 6: 3, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    9:  { 10: 4, 9: 4, 8: 4, 7: 3, 6: 3, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    8:  { 10: 4, 9: 4, 8: 4, 7: 3, 6: 3, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    7:  { 10: 3, 9: 3, 8: 3, 7: 3, 6: 3, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    6:  { 10: 3, 9: 3, 8: 3, 7: 3, 6: 3, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    5:  { 10: 2, 9: 2, 8: 2, 7: 2, 6: 2, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    4:  { 10: 2, 9: 2, 8: 2, 7: 2, 6: 2, 5: 2, 4: 2, 3: 1, 2: 1, 1: 1, 0: 1 },
    3:  { 10: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 4: 1, 3: 1, 2: 1, 1: 1, 0: 1 },
    2:  { 10: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 4: 1, 3: 1, 2: 1, 1: 1, 0: 1 },
    1:  { 10: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 4: 1, 3: 1, 2: 1, 1: 1, 0: 1 },
    0:  { 10: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 4: 1, 3: 1, 2: 1, 1: 1, 0: 0 }
  };

  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function getDuelUnitKey(playerKey) {
    if (ctx.twoVtwoTauntSystem?.getLockedFocusUnitKey) {
      return ctx.twoVtwoTauntSystem.getLockedFocusUnitKey(playerKey);
    }

    const team = ctx.getTeam(playerKey);
    return team?.focusUnitKey || "unit1";
  }

  function getDuelUnit(playerKey) {
    const team = ctx.getTeam(playerKey);
    const unitKey = getDuelUnitKey(playerKey);
    if (!team || !unitKey) return null;
    return team[unitKey] || null;
  }

  function getRandomSlotKey(unit) {
    const keys = ctx.getRollableSlotKeys(unit);
    if (!Array.isArray(keys) || keys.length <= 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function getBonusTurns(winnerBet, loserBet) {
    const w = Math.max(0, Math.min(10, Number(winnerBet || 0)));
    const l = Math.max(0, Math.min(10, Number(loserBet || 0)));
    return BONUS_TABLE[w]?.[l] ?? 0;
  }

  function createBreakthroughAdapter(realAdapter, scoreState) {
    return {
      ...(realAdapter || {}),

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

        if (actor) {
          actor.evade = Math.max(0, Number(actor.evade || 0)) + value;
        }

        return value;
      }
    };
  }

  function collectDamageFromAttacks({ attacks, ownerPlayer, unitKey, enemyPlayer }) {
    return attacks.reduce((sum, attack) => {
      let value = Math.max(0, Number(attack.damage || 0));

      if (
        ctx.twoVtwoTauntSystem &&
        typeof ctx.twoVtwoTauntSystem.modifyDamage === "function"
      ) {
        const defenderUnitKey = getDuelUnitKey(enemyPlayer);

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

  function simulateOneDuelSlot({ ownerPlayer, enemyPlayer, scoreState, turnIndex }) {
    const unitKey = getDuelUnitKey(ownerPlayer);
    const unit = getDuelUnit(ownerPlayer);
    const enemyUnit = getDuelUnit(enemyPlayer);

    if (!unitKey || !unit || isUnitDefeated(unit)) {
      return {
        turnIndex,
        player: ownerPlayer,
        unitKey: unitKey || "-",
        unitName: "決戦機体なし",
        slotNumber: "-",
        slotName: "行動不可",
        damage: 0,
        healReduction: 0,
        evadeGain: 0,
        notes: ["決戦機体が存在しないか撃墜されています"]
      };
    }

    applyUnitDerivedState(unit);

    const slotKey = getRandomSlotKey(unit);
    if (!slotKey) {
      return {
        turnIndex,
        player: ownerPlayer,
        unitKey,
        unitName: unit.name,
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

    const evadeBefore = Number(unit.evade || 0);
    const enemyReductionBefore = Number(scoreState[enemyPlayer].healReduction || 0);

    const breakthroughAdapter = createBreakthroughAdapter(ctx.twoVtwoAdapter, scoreState);
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

    applyUnitDerivedState(unit);

    if (beforeResult?.cancelSlot) {
      return {
        turnIndex,
        player: ownerPlayer,
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

      applyUnitDerivedState(enemyUnit);
    }

    const result = resolveSlotEffect({
      slot: resolvedSlot,
      actor: unit,
      ownerPlayer,
      twoVtwoAdapter: breakthroughAdapter
    });

    applyUnitDerivedState(unit);

    const afterResult = executeUnitAfterSlotResolved(unit, resolvedSlotNumber, result, {
      ownerPlayer,
      enemyPlayer,
      slotKey: resolvedSlotKey,
      slotNumber: resolvedSlotNumber,
      slot: resolvedSlot,
      isBreakthroughSimulation: true,
      twoVtwoAdapter: breakthroughAdapter
    });

    applyUnitDerivedState(unit);

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
      player: ownerPlayer,
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

  function applyBonusActions(winnerPlayer, bonusTurns) {
    const team = ctx.getTeam(winnerPlayer);
    if (!team) return;

    const add = Math.max(0, Number(bonusTurns || 0));

    if (team.mode === "unified") {
      if (team.unified) {
        team.unified.actionCount = Math.max(0, Number(team.unified.actionCount || 0)) + add;
      }
      return;
    }

    if (team.unit1 && !isUnitDefeated(team.unit1)) {
      team.unit1.actionCount = Math.max(0, Number(team.unit1.actionCount || 0)) + add;
    }

    if (team.unit2 && !isUnitDefeated(team.unit2)) {
      team.unit2.actionCount = Math.max(0, Number(team.unit2.actionCount || 0)) + add;
    }
  }

  function clearTauntAndDuelAfterBreakthrough() {
    ["A", "B"].forEach((playerKey) => {
      const team = ctx.getTeam(playerKey);
      if (!team || !ctx.twoVtwoTauntSystem?.clearBattleState) return;
      ctx.twoVtwoTauntSystem.clearBattleState(team);
    });
  }

  function clampAllTeamEvade() {
    ["A", "B"].forEach((playerKey) => {
      const team = ctx.getTeam(playerKey);
      if (team && typeof ctx.clampTeamEvadeToMax === "function") {
        ctx.clampTeamEvadeToMax(team);
      }
    });
  }

  function runBreakthrough({ betA, betB }) {
    const aBet = Math.max(0, Math.min(10, Number(betA || 0)));
    const bBet = Math.max(0, Math.min(10, Number(betB || 0)));

    const scoreState = {
      A: { rawDamage: 0, healReduction: 0 },
      B: { rawDamage: 0, healReduction: 0 }
    };

    const logs = [];
    const maxTurns = Math.max(aBet, bBet);

    for (let turnIndex = 1; turnIndex <= maxTurns; turnIndex += 1) {
      if (turnIndex <= aBet) {
        logs.push(simulateOneDuelSlot({
          ownerPlayer: "A",
          enemyPlayer: "B",
          scoreState,
          turnIndex
        }));
      }

      if (turnIndex <= bBet) {
        logs.push(simulateOneDuelSlot({
          ownerPlayer: "B",
          enemyPlayer: "A",
          scoreState,
          turnIndex
        }));
      }
    }

    const scoreA = Math.max(0, scoreState.A.rawDamage - scoreState.A.healReduction);
    const scoreB = Math.max(0, scoreState.B.rawDamage - scoreState.B.healReduction);

    let winnerPlayer = null;
    let bonusTurns = 0;

    if (scoreA > scoreB) {
      winnerPlayer = "A";
      bonusTurns = getBonusTurns(aBet, bBet);
    } else if (scoreB > scoreA) {
      winnerPlayer = "B";
      bonusTurns = getBonusTurns(bBet, aBet);
    }

    if (winnerPlayer) {
      applyBonusActions(winnerPlayer, bonusTurns);
      ctx.setCurrentPlayer(winnerPlayer);
      clearTauntAndDuelAfterBreakthrough();
    } else {
      clampAllTeamEvade();
    }

    return {
      betA: aBet,
      betB: bBet,
      logs,
      scoreA,
      scoreB,
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
          log.notes.length > 0
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
        clampAllTeamEvade();
        renderBreakthroughBetChoice();
      });
      attackLog.appendChild(retryBtn);
    }

    ctx.redrawBattleBoards();
  }

  return {
    renderBreakthroughBetChoice,
    runBreakthrough
  };
}
