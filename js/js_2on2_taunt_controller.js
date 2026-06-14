export function create2v2TauntController(ctx) {
  const EFFECT_TURNS = 5;
  const COOLDOWN_TURNS = 5;

  function ensureTeamTauntState(team) {
    if (!team) return null;
    if (!team.tauntState) {
      team.tauntState = {
        tauntTargetPlayer: null,
        tauntTargetUnitKey: null,
        tauntOwnerPlayer: null,
        tauntTurns: 0,
        duelActive: false,
        duelAUnitKey: null,
        duelBUnitKey: null,
        duelTurns: 0,
        cooldown: 0,
        disabledThisTurn: false
      };
    }
    return team.tauntState;
  }

  function tickTeam(team) {
    const state = ensureTeamTauntState(team);
    if (!state) return;

    state.disabledThisTurn = false;
    if (state.cooldown > 0) state.cooldown -= 1;

    if (state.tauntTurns > 0) {
      state.tauntTurns -= 1;
      if (state.tauntTurns <= 0) {
        state.tauntTargetPlayer = null;
        state.tauntTargetUnitKey = null;
        state.tauntOwnerPlayer = null;
      }
    }

    if (state.duelTurns > 0) {
      state.duelTurns -= 1;
      if (state.duelTurns <= 0) {
        state.duelActive = false;
        state.duelAUnitKey = null;
        state.duelBUnitKey = null;
      }
    }
  }

  function clearBattleState(team) {
    const state = ensureTeamTauntState(team);
    if (!state) return;

    state.tauntTargetPlayer = null;
    state.tauntTargetUnitKey = null;
    state.tauntOwnerPlayer = null;
    state.tauntTurns = 0;
    state.duelActive = false;
    state.duelAUnitKey = null;
    state.duelBUnitKey = null;
    state.duelTurns = 0;
    state.cooldown = Math.max(Number(state.cooldown || 0), COOLDOWN_TURNS);
    state.disabledThisTurn = true;
  }

  function canUse(playerKey) {
    const team = ctx.getTeam(playerKey);
    const state = ensureTeamTauntState(team);

    if (!team || !state) return false;
    if (state.disabledThisTurn) return false;
    if (state.cooldown > 0) return false;
    if (ctx.getCurrentPlayer() !== playerKey) return false;
    if (ctx.hasPendingChoice()) return false;
    if (ctx.hasCurrentAttack()) return false;

    return true;
  }

  function getButtonLabel(playerKey) {
    const ownTeam = ctx.getTeam(playerKey);
    const enemyTeam = ctx.getTeam(ctx.getOpponentPlayer(playerKey));
    const ownState = ensureTeamTauntState(ownTeam);
    const enemyState = ensureTeamTauntState(enemyTeam);

    if (ownState?.duelActive || enemyState?.duelActive) return "打破";

    if (
      ownState?.tauntTurns > 0 &&
      ownState.tauntOwnerPlayer === ctx.getOpponentPlayer(playerKey)
    ) {
      return "決戦";
    }

    return "挑発";
  }

  function startTaunt(ownerPlayer, targetUnitKey) {
    if (!canUse(ownerPlayer)) return { ok: false, message: "現在は挑発できません" };

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const enemyState = ensureTeamTauntState(enemyTeam);

    if (!enemyTeam?.[targetUnitKey]) {
      return { ok: false, message: "挑発対象が見つかりません" };
    }

    enemyState.tauntTargetPlayer = enemyPlayer;
    enemyState.tauntTargetUnitKey = targetUnitKey;
    enemyState.tauntOwnerPlayer = ownerPlayer;
    enemyState.tauntTurns = EFFECT_TURNS;
    enemyState.cooldown = COOLDOWN_TURNS;

    return { ok: true, message: `${targetUnitKey === "unit2" ? "2" : "1"}番機を挑発しました` };
  }

  function startDuel(ownerPlayer, ownUnitKey) {
    if (!canUse(ownerPlayer)) return { ok: false, message: "現在は決戦できません" };

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const ownTeam = ctx.getTeam(ownerPlayer);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const ownState = ensureTeamTauntState(ownTeam);
    const enemyState = ensureTeamTauntState(enemyTeam);

    if (!ownTeam?.[ownUnitKey]) {
      return { ok: false, message: "決戦する自軍機体が見つかりません" };
    }

    if (
      ownState?.tauntTurns <= 0 ||
      ownState.tauntOwnerPlayer !== enemyPlayer ||
      !ownState.tauntTargetUnitKey
    ) {
      return { ok: false, message: "相手から受けている挑発がありません" };
    }

    const challengedUnitKey = ownState.tauntTargetUnitKey;
    const aUnitKey = ownerPlayer === "A" ? ownUnitKey : challengedUnitKey;
    const bUnitKey = ownerPlayer === "B" ? ownUnitKey : challengedUnitKey;

    ownState.duelActive = true;
    ownState.duelAUnitKey = aUnitKey;
    ownState.duelBUnitKey = bUnitKey;
    ownState.duelTurns = EFFECT_TURNS;
    ownState.cooldown = COOLDOWN_TURNS;

    enemyState.duelActive = true;
    enemyState.duelAUnitKey = aUnitKey;
    enemyState.duelBUnitKey = bUnitKey;
    enemyState.duelTurns = EFFECT_TURNS;

    ownState.tauntTargetPlayer = null;
    ownState.tauntTargetUnitKey = null;
    ownState.tauntOwnerPlayer = null;
    ownState.tauntTurns = 0;

    enemyState.tauntTargetPlayer = null;
    enemyState.tauntTargetUnitKey = null;
    enemyState.tauntOwnerPlayer = null;
    enemyState.tauntTurns = 0;

    return { ok: true, message: "決戦成立" };
  }

  function isTauntTarget(playerKey, unitKey) {
    const state = ensureTeamTauntState(ctx.getTeam(playerKey));
    return state?.tauntTargetPlayer === playerKey && state?.tauntTargetUnitKey === unitKey;
  }

  function isDuelTarget(playerKey, unitKey) {
    const state = ensureTeamTauntState(ctx.getTeam(playerKey));
    if (!state?.duelActive) return false;
    return playerKey === "A" ? state.duelAUnitKey === unitKey : state.duelBUnitKey === unitKey;
  }

  function modifyDamage({ attackerPlayer, attackerUnitKey, defenderPlayer, defenderUnitKey, damage }) {
    let result = Math.max(0, Number(damage || 0));

    const defenderState = ensureTeamTauntState(ctx.getTeam(defenderPlayer));
    if (
      defenderState?.tauntTurns > 0 &&
      defenderState.tauntTargetUnitKey &&
      defenderUnitKey !== defenderState.tauntTargetUnitKey
    ) {
      result = Math.floor(result * 1.5);
    }

    const attackerState = ensureTeamTauntState(ctx.getTeam(attackerPlayer));
    if (attackerState?.duelActive) {
      const attackerDuelKey = attackerPlayer === "A" ? attackerState.duelAUnitKey : attackerState.duelBUnitKey;
      const defenderDuelKey = defenderPlayer === "A" ? attackerState.duelAUnitKey : attackerState.duelBUnitKey;

      if (attackerUnitKey === attackerDuelKey && defenderUnitKey === defenderDuelKey) {
        result = Math.floor(result * 2);
      }
    }

    return result;
  }

  function renderTauntTargetChoice(ownerPlayer) {
    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const attackLog = document.getElementById("attackLog");
    if (!attackLog || !enemyTeam) return;

    attackLog.innerHTML = `<div style="font-weight:bold;margin-bottom:6px;">PLAYER ${enemyPlayer} の挑発対象を選択</div>`;

    ["unit1", "unit2"].forEach((unitKey) => {
      const unit = enemyTeam[unitKey];
      if (!unit) return;

      const btn = document.createElement("button");
      btn.textContent = `${unitKey === "unit2" ? "2" : "1"}. ${unit.name}`;
      btn.disabled = Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
      btn.addEventListener("click", () => {
        const result = startTaunt(ownerPlayer, unitKey);
        ctx.showPopup(result.message);
        ctx.redrawBattleBoards();
      });

      attackLog.appendChild(btn);
    });
  }

  function renderDuelUnitChoice(ownerPlayer) {
    const ownTeam = ctx.getTeam(ownerPlayer);
    const attackLog = document.getElementById("attackLog");
    if (!attackLog || !ownTeam) return;

    attackLog.innerHTML = `<div style="font-weight:bold;margin-bottom:6px;">PLAYER ${ownerPlayer} の決戦機体を選択</div>`;

    ["unit1", "unit2"].forEach((unitKey) => {
      const unit = ownTeam[unitKey];
      if (!unit) return;

      const btn = document.createElement("button");
      btn.textContent = `${unitKey === "unit2" ? "2" : "1"}. ${unit.name}`;
      btn.disabled = Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
      btn.addEventListener("click", () => {
        const result = startDuel(ownerPlayer, unitKey);
        ctx.showPopup(result.message);
        ctx.redrawBattleBoards();
      });

      attackLog.appendChild(btn);
    });
  }

  function handleButton(playerKey) {
    const label = getButtonLabel(playerKey);

    if (label === "挑発") {
      renderTauntTargetChoice(playerKey);
      return;
    }

    if (label === "決戦") {
      renderDuelUnitChoice(playerKey);
      return;
    }

    ctx.showPopup("打破は未実装です");
  }

  return {
    tickTeam,
    clearBattleState,
    canUse,
    getButtonLabel,
    isTauntTarget,
    isDuelTarget,
    modifyDamage,
    handleButton
  };
}
