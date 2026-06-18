export function create2v2TauntController(ctx) {
  const EFFECT_TURNS = 5;
  const COOLDOWN_TURNS = 5;
  const CPU_USE_RATE = 0.1;

  function isCpuPlayer(playerKey) {
    return (
      typeof ctx.getBattleMode === "function" &&
      ctx.getBattleMode() === "vscpu2v2" &&
      playerKey === "B"
    );
  }

  function getPlayerLabel(playerKey) {
    return isCpuPlayer(playerKey) ? "CPU" : `PLAYER ${playerKey}`;
  }

  function isDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function getAliveUnitKeys(team) {
    return ["unit1", "unit2"].filter((unitKey) => team?.[unitKey] && !isDefeated(team[unitKey]));
  }

  function pickRandomAliveUnitKey(team) {
    const keys = getAliveUnitKeys(team);
    if (keys.length <= 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
  }

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
        disabledThisTurn: false,
        cpuTauntCheckedThisTurn: false
      };
    }

    if (typeof team.tauntState.cpuTauntCheckedThisTurn !== "boolean") {
      team.tauntState.cpuTauntCheckedThisTurn = false;
    }

    return team.tauntState;
  }

  function getOwnState(playerKey) {
    return ensureTeamTauntState(ctx.getTeam(playerKey));
  }

  function getEnemyState(playerKey) {
    return ensureTeamTauntState(ctx.getTeam(ctx.getOpponentPlayer(playerKey)));
  }

  function isTauntOwner(playerKey) {
    const enemyState = getEnemyState(playerKey);
    return enemyState?.tauntTurns > 0 && enemyState.tauntOwnerPlayer === playerKey;
  }

  function isDuelActiveForPlayer(playerKey) {
    const ownState = getOwnState(playerKey);
    const enemyState = getEnemyState(playerKey);
    return ownState?.duelActive || enemyState?.duelActive;
  }

  function getDuelUnitKey(playerKey) {
    const state = getOwnState(playerKey);
    if (!state?.duelActive) return null;
    return playerKey === "A" ? state.duelAUnitKey : state.duelBUnitKey;
  }

  function isTeamModeLocked(playerKey) {
    return isTauntOwner(playerKey) || isDuelActiveForPlayer(playerKey);
  }

  function canChangeFocus(playerKey) {
    return !isDuelActiveForPlayer(playerKey);
  }

  function getLockedFocusUnitKey(playerKey) {
    if (!isDuelActiveForPlayer(playerKey)) return null;
    return getDuelUnitKey(playerKey);
  }

  function forceSplit(playerKey) {
    const team = ctx.getTeam(playerKey);
    if (!team) return;

    if (team.mode === "unified" && typeof ctx.exitUnified === "function") {
      ctx.exitUnified(team);
    }

    team.mode = "split";
  }

  function tickTeam(team) {
    const state = ensureTeamTauntState(team);
    if (!state) return;

    state.disabledThisTurn = false;
    state.cpuTauntCheckedThisTurn = false;

    if (state.cooldown > 0) {
      state.cooldown -= 1;
    }

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

  function canUse(playerKey, options = {}) {
    const allowCpu = options.allowCpu === true;
    const team = ctx.getTeam(playerKey);
    const state = ensureTeamTauntState(team);

    if (!team || !state) return false;
    if (!allowCpu && isCpuPlayer(playerKey)) return false;
    if (ctx.hasPendingChoice()) return false;
    if (ctx.hasCurrentAttack()) return false;

    if (isDuelActiveForPlayer(playerKey)) {
      return true;
    }

    if (ctx.getCurrentPlayer() !== playerKey) return false;
    if (state.disabledThisTurn) return false;
    if (state.cooldown > 0) return false;

    return true;
  }

  function getButtonLabel(playerKey) {
    const ownState = getOwnState(playerKey);
    const enemyState = getEnemyState(playerKey);

    if (ownState?.duelActive || enemyState?.duelActive) {
      return "打破";
    }

    if (
      ownState?.tauntTurns > 0 &&
      ownState.tauntOwnerPlayer === ctx.getOpponentPlayer(playerKey)
    ) {
      return "決戦";
    }

    return "挑発";
  }

  function startTaunt(ownerPlayer, targetUnitKey, options = {}) {
    if (!canUse(ownerPlayer, options)) {
      return { ok: false, message: "現在は挑発できません" };
    }

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const ownerTeam = ctx.getTeam(ownerPlayer);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const ownerState = ensureTeamTauntState(ownerTeam);
    const enemyState = ensureTeamTauntState(enemyTeam);

    if (!enemyTeam?.[targetUnitKey] || isDefeated(enemyTeam[targetUnitKey])) {
      return { ok: false, message: "挑発対象が見つかりません" };
    }

    forceSplit(ownerPlayer);

    enemyState.tauntTargetPlayer = enemyPlayer;
    enemyState.tauntTargetUnitKey = targetUnitKey;
    enemyState.tauntOwnerPlayer = ownerPlayer;
    enemyState.tauntTurns = EFFECT_TURNS;
    ownerState.cooldown = COOLDOWN_TURNS;

    return {
      ok: true,
      message: `${getPlayerLabel(ownerPlayer)} が ${targetUnitKey === "unit2" ? "2" : "1"}番機を挑発しました`
    };
  }

  function startDuel(ownerPlayer, ownUnitKey, options = {}) {
    if (!canUse(ownerPlayer, options)) {
      return { ok: false, message: "現在は決戦できません" };
    }

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const ownTeam = ctx.getTeam(ownerPlayer);
    const enemyTeam = ctx.getTeam(enemyPlayer);
    const ownState = ensureTeamTauntState(ownTeam);
    const enemyState = ensureTeamTauntState(enemyTeam);

    if (!ownTeam?.[ownUnitKey] || isDefeated(ownTeam[ownUnitKey])) {
      return { ok: false, message: "決戦する自軍機体が見つかりません" };
    }

    if (
      ownState?.tauntTurns <= 0 ||
      ownState.tauntOwnerPlayer !== enemyPlayer ||
      !ownState.tauntTargetUnitKey
    ) {
      return { ok: false, message: "相手から受けている挑発がありません" };
    }

    const enemyFocusUnitKey = enemyTeam?.focusUnitKey === "unit2" ? "unit2" : "unit1";

    if (!enemyTeam?.[enemyFocusUnitKey] || isDefeated(enemyTeam[enemyFocusUnitKey])) {
      return { ok: false, message: "相手のフォーカス機体が見つかりません" };
    }

    const aUnitKey = ownerPlayer === "A" ? ownUnitKey : enemyFocusUnitKey;
    const bUnitKey = ownerPlayer === "B" ? ownUnitKey : enemyFocusUnitKey;

    forceSplit("A");
    forceSplit("B");

    const teamA = ctx.getTeam("A");
    const teamB = ctx.getTeam("B");

    if (teamA) {
      teamA.focusUnitKey = aUnitKey;
      teamA.activeUnitKey = aUnitKey;
    }

    if (teamB) {
      teamB.focusUnitKey = bUnitKey;
      teamB.activeUnitKey = bUnitKey;
    }

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

    return {
      ok: true,
      message: `${getPlayerLabel(ownerPlayer)} が決戦を受けました`
    };
  }

  function tryCpuAutoUse(playerKey) {
    if (!isCpuPlayer(playerKey)) {
      return { used: false, message: "" };
    }

    const team = ctx.getTeam(playerKey);
    const state = ensureTeamTauntState(team);

    if (!team || !state) {
      return { used: false, message: "" };
    }

    if (state.cpuTauntCheckedThisTurn) {
      return { used: false, message: "" };
    }

    state.cpuTauntCheckedThisTurn = true;

    if (!canUse(playerKey, { allowCpu: true })) {
      return { used: false, message: "" };
    }

    if (Math.random() >= CPU_USE_RATE) {
      return { used: false, message: "" };
    }

    const label = getButtonLabel(playerKey);

    if (label === "打破") {
      return { used: false, message: "" };
    }

    if (label === "決戦") {
      const ownUnitKey = pickRandomAliveUnitKey(team);
      if (!ownUnitKey) return { used: false, message: "" };

      const result = startDuel(playerKey, ownUnitKey, { allowCpu: true });
      return { used: result.ok === true, message: result.message || "" };
    }

    const enemyTeam = ctx.getTeam(ctx.getOpponentPlayer(playerKey));
    const targetUnitKey = pickRandomAliveUnitKey(enemyTeam);

    if (!targetUnitKey) {
      return { used: false, message: "" };
    }

    const result = startTaunt(playerKey, targetUnitKey, { allowCpu: true });
    return { used: result.ok === true, message: result.message || "" };
  }

  function isTauntTarget(playerKey, unitKey) {
    const state = getOwnState(playerKey);
    return state?.tauntTargetPlayer === playerKey && state?.tauntTargetUnitKey === unitKey;
  }

  function isDuelTarget(playerKey, unitKey) {
    const state = getOwnState(playerKey);
    if (!state?.duelActive) return false;
    return playerKey === "A" ? state.duelAUnitKey === unitKey : state.duelBUnitKey === unitKey;
  }

  function modifyDamage({ attackerPlayer, attackerUnitKey, defenderPlayer, defenderUnitKey, damage }) {
    let result = Math.max(0, Number(damage || 0));
    const defenderState = getOwnState(defenderPlayer);

    if (
      defenderState?.tauntTurns > 0 &&
      defenderState.tauntTargetUnitKey &&
      defenderUnitKey !== defenderState.tauntTargetUnitKey
    ) {
      result = Math.floor(result * 1.5);
    }

    const attackerState = getOwnState(attackerPlayer);

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

    attackLog.innerHTML = `
PLAYER ${enemyPlayer} の挑発対象を選択
`;

    ["unit1", "unit2"].forEach((unitKey) => {
      const unit = enemyTeam[unitKey];
      if (!unit) return;

      const btn = document.createElement("button");
      btn.textContent = `${unitKey === "unit2" ? "2" : "1"}. ${unit.name}`;
      btn.disabled = isDefeated(unit);

      btn.addEventListener("click", () => {
        const result = startTaunt(ownerPlayer, unitKey);
        attackLog.textContent = result.message;
        ctx.showPopup(result.message);
        ctx.redrawBattleBoards();

        if (result.ok && typeof ctx.onOnline2v2TauntAction === "function") {
          ctx.onOnline2v2TauntAction(ownerPlayer, unitKey);
        }
      });

      attackLog.appendChild(btn);
    });
  }

  function renderDuelUnitChoice(ownerPlayer) {
    const ownTeam = ctx.getTeam(ownerPlayer);
    const attackLog = document.getElementById("attackLog");

    if (!attackLog || !ownTeam) return;

    attackLog.innerHTML = `
PLAYER ${ownerPlayer} の決戦機体を選択
`;

    ["unit1", "unit2"].forEach((unitKey) => {
      const unit = ownTeam[unitKey];
      if (!unit) return;

      const btn = document.createElement("button");
      btn.textContent = `${unitKey === "unit2" ? "2" : "1"}. ${unit.name}`;
      btn.disabled = isDefeated(unit);

      btn.addEventListener("click", () => {
        const result = startDuel(ownerPlayer, unitKey);
        attackLog.textContent = result.message;
        ctx.showPopup(result.message);
        ctx.redrawBattleBoards();

        if (result.ok && typeof ctx.onOnline2v2DuelAction === "function") {
          ctx.onOnline2v2DuelAction(ownerPlayer, unitKey);
        }
      });

      attackLog.appendChild(btn);
    });
  }

  function handleButton(playerKey) {
    if (isCpuPlayer(playerKey)) {
      ctx.showPopup("CPU側の挑発・決戦・打破は手動操作できません");
      return;
    }

    const label = getButtonLabel(playerKey);

    if (label === "挑発") {
      renderTauntTargetChoice(playerKey);
      return;
    }

    if (label === "決戦") {
      renderDuelUnitChoice(playerKey);
      return;
    }

    if (typeof ctx.openBreakthrough === "function") {
      ctx.openBreakthrough({ initiatorPlayer: playerKey });
      return;
    }

    ctx.showPopup("打破システムを参照できません");
  }

  return {
    tickTeam,
    clearBattleState,
    canUse,
    getButtonLabel,
    isTauntTarget,
    isDuelTarget,
    isTeamModeLocked,
    canChangeFocus,
    getLockedFocusUnitKey,
    modifyDamage,
    handleButton,
    startTaunt,
    startDuel,
    tryCpuAutoUse
  };
}
