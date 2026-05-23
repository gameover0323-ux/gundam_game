export function createLocalModeController(ctx) {
  function startLocalMode(mode) {
    if (mode === "challenge2v2") {
      if (typeof ctx.showPopup === "function") {
        ctx.showPopup("2vsボスは一旦閉鎖中です。1vsボスを選択してください。");
      }
      return;
    }

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
