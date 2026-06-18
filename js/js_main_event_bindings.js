export function bindMainEvents(ctx) {
  const {
    startOnline1v1Btn,
    startOnline2v2Btn,
    createOnlineRoomBtn,
    joinOnlineRoomBtn,
    backFromOnlineRoomBtn,
    localModeController,
    onlineRoomController,
    online2v2RoomController,
    playerAccountUi,
    showScreen,
    showTitle,
    simulateSlot,
    endTurn,
    toggleTestMode,
    renderPlayerStatsPanel
  } = ctx;

  startOnline1v1Btn?.addEventListener("click", () => {
    ctx.setBattleMode("online1v1");
    showScreen("onlineRoom");
  });

  startOnline2v2Btn?.addEventListener("click", () => {
    ctx.setBattleMode("online2v2");
    showScreen("onlineRoom");
  });

  createOnlineRoomBtn?.addEventListener("click", () => {
    if (ctx.getBattleMode && ctx.getBattleMode() === "online2v2") {
      online2v2RoomController.createOnline2v2Room();
      return;
    }
    onlineRoomController.createOnlineRoom();
  });

  joinOnlineRoomBtn?.addEventListener("click", () => {
    if (ctx.getBattleMode && ctx.getBattleMode() === "online2v2") {
      online2v2RoomController.joinOnline2v2Room();
      return;
    }
    onlineRoomController.joinOnlineRoom();
  });

  backFromOnlineRoomBtn?.addEventListener("click", () => {
    showTitle();
  });

  document.getElementById("start1v1Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("1v1");
  });

  document.getElementById("start2v2Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("2v2");
  });

  document.getElementById("startChallenge1v1Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("challenge1v1");
  });

  document.getElementById("startChallenge2v2Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("challenge2v2");
  });

  document.getElementById("startVsCpu1v1Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("vscpu1v1");
  });

  document.getElementById("startVsCpu2v2Btn")?.addEventListener("click", () => {
    localModeController.startLocalMode("vscpu2v2");
  });

  document.getElementById("executeSlotBtn")?.addEventListener("click", () => {
    if (typeof ctx.executeSlot === "function") {
      ctx.executeSlot();
      return;
    }

    ctx.twoVtwoActions.executeTeamSlot();
  });

  document.getElementById("executeUnit1SlotBtn")?.addEventListener("click", () => {
    if (typeof ctx.executeUnit1Slot === "function") {
      ctx.executeUnit1Slot();
      return;
    }

    ctx.twoVtwoActions.executeSingleTeamSlot("unit1");
  });

  document.getElementById("executeUnit2SlotBtn")?.addEventListener("click", () => {
    if (typeof ctx.executeUnit2Slot === "function") {
      ctx.executeUnit2Slot();
      return;
    }

    ctx.twoVtwoActions.executeSingleTeamSlot("unit2");
  });

  document.getElementById("simulateSlotBtn")?.addEventListener("click", simulateSlot);
  document.getElementById("endTurnBtn")?.addEventListener("click", endTurn);
  document.getElementById("toggleTestModeBtn")?.addEventListener("click", toggleTestMode);

  document.getElementById("playerLoginBtn")?.addEventListener("click", () => {
    playerAccountUi.handleLogin();
  });

  document.getElementById("playerRegisterBtn")?.addEventListener("click", () => {
    playerAccountUi.handleRegister();
  });

  document.getElementById("playerLogoutBtn")?.addEventListener("click", () => {
    playerAccountUi.handleLogout();
  });

  document.getElementById("playerStatsBtn")?.addEventListener("click", () => {
    renderPlayerStatsPanel();
  });

  document.getElementById("closePlayerStatsBtn")?.addEventListener("click", () => {
    const panel = document.getElementById("playerStatsPanel");
    if (panel) panel.style.display = "none";
  });
}
