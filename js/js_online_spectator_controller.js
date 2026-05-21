export function createOnlineSpectatorController(ctx) {
  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function buildOnlineBattleSnapshot() {
    return {
      mode: ctx.getBattleMode(),
      currentTurn: ctx.getCurrentTurn(),
      currentPlayer: ctx.getCurrentPlayer(),
      playerAState: cloneValue(ctx.getPlayerAState()),
      playerBState: cloneValue(ctx.getPlayerBState()),
      currentAttack: cloneValue(ctx.getCurrentAttack()),
      currentAttackContext: cloneValue(ctx.getCurrentAttackContext()),
      currentAttackContexts: cloneValue(ctx.getCurrentAttackContexts()),
      battleNotice: ctx.getBattleNotice(),
      currentActionHeader: ctx.getCurrentActionHeader(),
      currentActionLabel: ctx.getCurrentActionLabel(),
      updatedAt: Date.now()
    };
  }

  function applyOnlineBattleSnapshot(snapshot) {
    if (!snapshot) return;

    if (snapshot.playerAState) {
      ctx.setPlayerAState(cloneValue(snapshot.playerAState));
    }

    if (snapshot.playerBState) {
      ctx.setPlayerBState(cloneValue(snapshot.playerBState));
    }

    ctx.setCurrentTurn(Number(snapshot.currentTurn || 1));
    ctx.setCurrentPlayer(snapshot.currentPlayer === "B" ? "B" : "A");

    ctx.setCurrentAttack(Array.isArray(snapshot.currentAttack)
      ? cloneValue(snapshot.currentAttack)
      : []);

    ctx.setCurrentAttackContext(cloneValue(snapshot.currentAttackContext));

    ctx.setCurrentAttackContexts(Array.isArray(snapshot.currentAttackContexts)
      ? cloneValue(snapshot.currentAttackContexts)
      : []);

    ctx.setBattleNotice(snapshot.battleNotice || "");
    ctx.setCurrentActionHeader(snapshot.currentActionHeader || "");
    ctx.setCurrentActionLabel(snapshot.currentActionLabel || "");

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
    ctx.ensureOnlineBattleExtraUi();
    ctx.showScreen("battle");
  }

  async function spectateOnlineRoom() {
    await ctx.cleanupOldRooms();

    const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    const roomId = onlineRoomIdInput?.value.trim();

    if (!roomId) {
      ctx.showPopup("観戦する部屋IDを入力してください");
      return;
    }

    const snapshot = await ctx.readRoom(roomId);

    if (!snapshot.exists()) {
      ctx.showPopup("部屋が見つかりません");
      return;
    }

    const roomData = snapshot.val();

    if (!roomData?.players?.A?.unitId || !roomData?.players?.B?.unitId) {
      ctx.showPopup("まだ戦闘開始前の部屋です");
      return;
    }

  
  ctx.setOnlineState({
  enabled: true,
  roomId,
  myPlayer: null,
  isHost: false,
  isSpectator: true
});

    ctx.setBattleMode("online1v1");
    ctx.setOnlineSelectEntered(true);
    ctx.setOnlineBattleStarted(true);

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = `観戦中です。部屋ID：${roomId}`;
    }

    ctx.listenRoom(roomId, latestRoomData => {
      if (!latestRoomData) return;

      ctx.applyOnlineRoomData(latestRoomData);

      if (latestRoomData.battleSnapshot) {
        applyOnlineBattleSnapshot(latestRoomData.battleSnapshot);
      }
    });
  }

  function isOnlineSpectator() {
  return ctx.getOnlineState()?.isSpectator === true;
  }

  return {
    buildOnlineBattleSnapshot,
    applyOnlineBattleSnapshot,
    spectateOnlineRoom,
    isOnlineSpectator
  };
}
