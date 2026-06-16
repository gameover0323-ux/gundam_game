export function createCpuTurnGuard(ctx) {
  function isCpuBattleMode() {
    const mode = ctx.getBattleMode ? ctx.getBattleMode() : "";
    return mode === "vscpu1v1" || mode === "vscpu2v2";
  }

  function isCpuPlayer(playerKey) {
    return isCpuBattleMode() && playerKey === "B";
  }

  function hasRemainingAction(playerKey) {
    if (!isCpuPlayer(playerKey)) return false;

    if (ctx.isTeamBattleMode && ctx.isTeamBattleMode()) {
      const team = ctx.getTeam ? ctx.getTeam(playerKey) : null;
      if (!team) return false;

      if (team.mode === "unified") {
        return Number(team.unified?.actionCount || 0) > 0;
      }

      return (
        Number(team.unit1?.actionCount || 0) > 0 ||
        Number(team.unit2?.actionCount || 0) > 0
      );
    }

    const state = ctx.getPlayerState ? ctx.getPlayerState(playerKey) : null;
    return Number(state?.actionCount || 0) > 0;
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
