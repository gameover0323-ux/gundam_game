export function createOnlineRoomController(ctx) {
  function getOnlineProfilePatch(playerKey) {
    const profile = ctx.getPlayerProfile();

    if (!profile) {
      return {
        [`players/${playerKey}/profileId`]: null,
        [`players/${playerKey}/profileName`]: "ゲスト",
        [`players/${playerKey}/equippedTitles`]: []
      };
    }

    return {
      [`players/${playerKey}/profileId`]: profile.id || null,
      [`players/${playerKey}/profileName`]: profile.name || profile.id || "名無し",
      [`players/${playerKey}/equippedTitles`]: Array.isArray(profile.equippedTitles)
        ? profile.equippedTitles
        : []
    };
  }

  async function createOnlineRoom() {
    try {
      await ctx.cleanupOldRooms();

      const roomId = ctx.createRoomId();
      ctx.setOnlineState({
        enabled: true,
        roomId,
        myPlayer: "A",
        isHost: true
      });

      ctx.setOnlineSelectEntered(false);
      ctx.setOnlineBattleStarted(false);

      const onlineRoomStatus = ctx.getOnlineRoomStatus();
      const onlineInviteUrl = ctx.getOnlineInviteUrl();

      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = `部屋作成中... 部屋ID：${roomId}`;
      }

      const initialRoomData = ctx.buildInitialRoomData({ mode: "online1v1" });
      const profile = ctx.getPlayerProfile();

      Object.assign(initialRoomData.players.A, {
        joined: true,
        ready: false,
        unitId: null,
        profileId: profile?.id || null,
        profileName: profile?.name || profile?.id || "ゲスト",
        equippedTitles: Array.isArray(profile?.equippedTitles)
          ? profile.equippedTitles
          : [],
        lastSeen: Date.now()
      });

      await ctx.writeRoom(roomId, initialRoomData);

      const inviteUrl = `${location.origin}${location.pathname}?mode=online1v1&room=${roomId}`;

      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = `部屋を作成しました。あなたはPLAYER Aです。部屋ID：${roomId}`;
      }

      if (onlineInviteUrl) {
        onlineInviteUrl.textContent = inviteUrl;
      }

      ctx.listenRoom(roomId, roomData => {
        if (!roomData) return;

        const playerBJoined = roomData.players?.B?.joined;
        const status = ctx.getOnlineRoomStatus();

        if (status) {
          status.textContent = playerBJoined
            ? `PLAYER B が参加しました。部屋ID：${roomId}`
            : `PLAYER B の参加待ちです。部屋ID：${roomId}`;
        }

        if (playerBJoined) {
          ctx.enterOnlineSelect();
        }

        ctx.applyOnlineRoomData(roomData);
      });
    } catch (error) {
      console.error(error);

      const onlineRoomStatus = ctx.getOnlineRoomStatus();
      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = "部屋作成に失敗しました";
      }

      ctx.showPopup(`部屋作成エラー：${error.message}`);
    }
  }

  async function joinOnlineRoom() {
    await ctx.cleanupOldRooms();

    const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    const roomId = onlineRoomIdInput?.value.trim();

    if (!roomId) {
      ctx.showPopup("部屋IDを入力してください");
      return;
    }

    const snapshot = await ctx.readRoom(roomId);

    if (!snapshot.exists()) {
      ctx.showPopup("部屋が見つかりません");
      return;
    }

    ctx.setOnlineState({
      enabled: true,
      roomId,
      myPlayer: "B",
      isHost: false
    });

    ctx.setOnlineSelectEntered(false);
    ctx.setOnlineBattleStarted(false);

    await ctx.updateRoom(roomId, {
      "players/B/joined": true,
      "players/B/ready": false,
      "players/B/unitId": null,
      "players/B/left": false,
      "players/B/lastSeen": Date.now(),
      ...getOnlineProfilePatch("B"),
      "meta/status": "selecting",
      "meta/updatedAt": Date.now()
    });

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = "部屋に参加しました。機体選択へ移動します。";
    }

    ctx.enterOnlineSelect();

    ctx.listenRoom(roomId, roomData => {
      if (!roomData) return;
      ctx.applyOnlineRoomData(roomData);
    });
  }

  function bootOnlineFromUrl() {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const roomId = params.get("room");

    if (mode !== "online1v1" || !roomId) return;

    ctx.setBattleMode("online1v1");
    ctx.showScreen("onlineRoom");

    const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
    const onlineRoomStatus = ctx.getOnlineRoomStatus();

    if (onlineRoomIdInput) {
      onlineRoomIdInput.value = roomId;
    }

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent =
        "招待URLから部屋IDを読み込みました。「部屋に入る」を押してください。";
    }
  }

  async function selectOnlineUnit(unit) {
  if (!ctx.isOnlineEnabled || !ctx.isOnlineEnabled()) return false;
  if (!unit) return true;

const roomId = ctx.getOnlineRoomId();
const myPlayer = ctx.getOnlineMyPlayer();
  if (!roomId || (myPlayer !== "A" && myPlayer !== "B")) {
    ctx.showPopup("オンライン部屋情報が取得できません");
    return true;
  }

  if (myPlayer === "A") {
    ctx.setSelectedUnitA(unit);
  } else {
    ctx.setSelectedUnitB(unit);
  }

  ctx.updateSelectUi();

  await ctx.updateRoom(roomId, {
    [`players/${myPlayer}/unitId`]: unit.id || unit.name,
    [`players/${myPlayer}/ready`]: true,
    [`players/${myPlayer}/lastSeen`]: Date.now(),
    "meta/status": "selecting",
    "meta/updatedAt": Date.now()
  });

  return true;
}

  function applyOnlineRoomData(roomData) {
    if (!ctx.isOnlineEnabled() || !roomData) return;

    ctx.renderOnlineExtraUi(roomData);
    ctx.applyOnlinePeaceRequest(roomData);
    ctx.applyOnlineMetaResult(roomData);

    const playerA = roomData.players?.A || {};
    const playerB = roomData.players?.B || {};

    if (playerA.unitId) {
      ctx.setSelectedUnitA(ctx.getUnitById(playerA.unitId));
    }

    if (playerB.unitId) {
      ctx.setSelectedUnitB(ctx.getUnitById(playerB.unitId));
    }

    ctx.updateSelectUi();

    if (!ctx.isOnlineSpectator()) {
      ctx.applyOnlineAction(roomData.action);
    }

    if (
      !ctx.isOnlineSpectator() &&
      !ctx.getOnlineBattleStarted() &&
      playerA.ready &&
      playerB.ready &&
      ctx.getSelectedUnitA() &&
      ctx.getSelectedUnitB()
    ) {
      ctx.saveOnlineEncounteredPlayer(roomData);
      ctx.setOnlineBattleStarted(true);
      ctx.initOnline1v1Battle(ctx.getSelectedUnitA(), ctx.getSelectedUnitB());
    }
  }

  function enterOnlineSelect() {
    if (ctx.getOnlineSelectEntered()) return;

    ctx.setBattleMode("online1v1");
    ctx.setTeamA(null);
    ctx.setTeamB(null);
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);
    ctx.setSelectingPlayer(ctx.getOnlineMyPlayer() === "B" ? "B" : "A");
    ctx.setOnlineBattleStarted(false);
    ctx.setOnlineSelectEntered(true);
    ctx.showScreen("select");
    ctx.loadUnitButtons();
  }

  function initOnline1v1Battle(unitA, unitB) {
    const playerAState = ctx.createBattleState(unitA);
    const playerBState = ctx.createBattleState(unitB);

    ctx.setPlayerAState(playerAState);
    ctx.setPlayerBState(playerBState);

    ctx.resetActionCount(playerAState);
    ctx.resetActionCount(playerBState);

    ctx.resetBattleRuntimeState({
      currentTurn: 1,
      currentPlayer: "A",
      isTestMode: false,
      onlineBattleFinished: false
    });

    ctx.applyBattleDisplayNames();
    ctx.redrawBattleBoards();
    ctx.ensureOnlineBattleExtraUi();

    const attackLog = document.getElementById("attackLog");
    if (attackLog) {
      attackLog.textContent = "オンラインバトル開始";
    }

    ctx.updateDebugButtonVisibility();
    ctx.showScreen("battle");
  }

  return {
  getOnlineProfilePatch,
  createOnlineRoom,
  joinOnlineRoom,
  bootOnlineFromUrl,
  selectOnlineUnit,
  applyOnlineRoomData,
  enterOnlineSelect,
  initOnline1v1Battle
};
}
