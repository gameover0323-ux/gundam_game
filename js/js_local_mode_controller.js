export function createLocalModeController(ctx) {
  function startLocalMode(mode) {
    ctx.resetOnlineStateForLocalBattle();

    ctx.setBattleMode(mode);
    ctx.setTeamA(null);
    ctx.setTeamB(null);
    ctx.setSelectingPlayer("A");
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);

    ctx.showScreen("select");
    ctx.loadUnitButtons();
  }

  return {
    startLocalMode
  };
}
