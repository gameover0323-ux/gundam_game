export function createCpuTurnGuard(ctx) {
  function isCpuBattleMode() {
    const mode = ctx.getBattleMode ? ctx.getBattleMode() : "";
    return mode === "vscpu1v1" || mode === "vscpu2v2";
  }

  function isCpuPlayer(playerKey) {
    return isCpuBattleMode() && playerKey === "B";
  }

  function isDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function unitHasRemainingAction(unit) {
    if (isDefeated(unit)) return false;
    return Number(unit.actionCount || 0) > 0;
  }

  function hasRemainingAction(playerKey) {
    if (!isCpuPlayer(playerKey)) return false;

    if (ctx.isTeamBattleMode && ctx.isTeamBattleMode()) {
      const team = ctx.getTeam ? ctx.getTeam(playerKey) : null;
      if (!team) return false;

      if (team.mode === "unified") {
        const aliveUnitExists =
          !isDefeated(team.unit1) || !isDefeated(team.unit2);

        if (!aliveUnitExists) return false;

        return Number(team.unified?.actionCount || 0) > 0;
      }

      return (
        unitHasRemainingAction(team.unit1) ||
        unitHasRemainingAction(team.unit2)
      );
    }

    const state = ctx.getPlayerState ? ctx.getPlayerState(playerKey) : null;
    return unitHasRemainingAction(state);
  }

  function shouldBlockManualEndTurn(playerKey) {
    if (!isCpuPlayer(playerKey)) return false;
    return hasRemainingAction(playerKey);
  }

  function getBlockMessage() {
    return "CPUの行動権が残っています。スロット行動を実行してください。";
  }

  return {
    isCpuPlayer,
    hasRemainingAction,
    shouldBlockManualEndTurn,
    getBlockMessage
  };
}
