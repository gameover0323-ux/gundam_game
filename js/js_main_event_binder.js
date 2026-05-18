export function bindMainEvents(ctx) {
  document.getElementById("startOnline1v1Btn")?.addEventListener("click", () => {
    ctx.setBattleMode("online1v1");
    ctx.showScreen("onlineRoom");
  });

  document.getElementById("startOnline2v2Btn")?.addEventListener("click", () => {
    ctx.showPopup("オンライン2on2はオンライン1on1安定後に実装予定です");
  });

  document.getElementById("createOnlineRoomBtn")?.addEventListener("click", () => {
    ctx.onlineRoomController.createOnlineRoom();
  });

  document.getElementById("joinOnlineRoomBtn")?.addEventListener("click", () => {
    ctx.onlineRoomController.joinOnlineRoom();
  });

  document.getElementById("backFromOnlineRoomBtn")?.addEventListener("click", () => {
    ctx.showTitle();
  });

  [
    ["start1v1Btn", "1v1"],
    ["start2v2Btn", "2v2"],
    ["startChallenge1v1Btn", "challenge1v1"],
    ["startChallenge2v2Btn", "challenge2v2"],
    ["startVsCpu1v1Btn", "vscpu1v1"],
    ["startVsCpu2v2Btn", "vscpu2v2"]
  ].forEach(([buttonId, mode]) => {
    document.getElementById(buttonId)?.addEventListener("click", () => {
      ctx.localModeController.startLocalMode(mode);
    });
  });

  document.getElementById("executeSlotBtn")?.addEventListener("click", () => {
    ctx.twoVtwoActions.executeTeamSlot();
  });

  document.getElementById("executeUnit1SlotBtn")?.addEventListener("click", () => {
    ctx.twoVtwoActions.executeSingleTeamSlot("unit1");
  });

  document.getElementById("executeUnit2SlotBtn")?.addEventListener("click", () => {
    ctx.twoVtwoActions.executeSingleTeamSlot("unit2");
  });

  document.getElementById("simulateSlotBtn")?.addEventListener("click", ctx.simulateSlot);
  document.getElementById("endTurnBtn")?.addEventListener("click", ctx.endTurn);
  document.getElementById("toggleTestModeBtn")?.addEventListener("click", ctx.toggleTestMode);

  document.getElementById("playerLoginBtn")?.addEventListener("click", () => {
    ctx.playerAccountUi.handleLogin();
  });

  document.getElementById("playerRegisterBtn")?.addEventListener("click", () => {
    ctx.playerAccountUi.handleRegister();
  });

  document.getElementById("playerLogoutBtn")?.addEventListener("click", () => {
    ctx.playerAccountUi.handleLogout();
  });

  document.getElementById("playerStatsBtn")?.addEventListener("click", () => {
    ctx.renderPlayerStatsPanel();
  });

  document.getElementById("closePlayerStatsBtn")?.addEventListener("click", () => {
    const panel = document.getElementById("playerStatsPanel");
    if (panel) panel.style.display = "none";
  });
}
