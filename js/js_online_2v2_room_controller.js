export function createOnline2v2RoomController(ctx) {
  let roomIdMatchActiveRoomId = null;
  let roomIdMatchUnsubscribe = null;
  let roomIdMatchEntering = false;

  function cleanupRoomIdMatchListener() {
    if (typeof roomIdMatchUnsubscribe === "function") {
      roomIdMatchUnsubscribe();
    }

    roomIdMatchUnsubscribe = null;
  }

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

  function getUnitId(unit) {
    return unit?.id || unit?.name || "";
  }

function isOnlineSpectator() {
    return typeof ctx.isOnlineSpectator === "function" && ctx.isOnlineSpectator();
}
  
  function getRoomUnitIds(roomData, playerKey) {
    const playerData = roomData?.players?.[playerKey] || {};
    return Array.isArray(playerData.unitIds)
      ? playerData.unitIds.filter(Boolean)
      : [];
  }

  function idsToUnits(ids) {
    return ids.map((id) => ctx.getUnitById(id)).filter(Boolean);
  }

  function setSelectTeamUnits(playerKey, units) {
    const safeUnits = Array.isArray(units) ? units.filter(Boolean) : [];

    if (playerKey === "A") {
      ctx.setTeamA({ units: safeUnits });
    } else {
      ctx.setTeamB({ units: safeUnits });
    }
  }

  function getSelectTeamUnits(playerKey) {
    const team = playerKey === "A" ? ctx.getTeamA() : ctx.getTeamB();
    return Array.isArray(team?.units) ? team.units : [];
  }

  function enterRoomIdMatchedRoom(roomId, playerSide) {
    if (!roomId || (playerSide !== "A" && playerSide !== "B")) return;
    if (roomIdMatchEntering && roomIdMatchActiveRoomId === roomId) return;

    roomIdMatchEntering = true;
    roomIdMatchActiveRoomId = roomId;
    cleanupRoomIdMatchListener();

    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = `オンライン2on2マッチ成立。あなたはPLAYER ${playerSide}です。`;
    }

    enterOnline2v2Select();

    ctx.readRoom(roomId).then((snapshot) => {
      if (!snapshot.exists()) return;
      applyOnline2v2RoomData(snapshot.val());
    });

    roomIdMatchUnsubscribe = ctx.listenRoom(roomId, (roomData) => {
      if (!roomData) return;
      applyOnline2v2RoomData(roomData);
    });
  }

  async function createOnline2v2Room() {
    try {
      await ctx.cleanupOldRooms();
      cleanupRoomIdMatchListener();

      const roomId = ctx.createRoomId();
      roomIdMatchActiveRoomId = roomId;
      roomIdMatchEntering = false;

      ctx.setOnlineState({
        enabled: true,
        roomId,
        myPlayer: "A",
        isHost: true,
        isSpectator: false
      });

      ctx.setOnlineSelectEntered(false);
      ctx.setOnlineBattleStarted(false);

      const onlineRoomStatus = ctx.getOnlineRoomStatus();
      const onlineInviteUrl = ctx.getOnlineInviteUrl();

      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = `オンライン2on2部屋作成中...\n部屋ID：${roomId}`;
      }

      const initialRoomData = ctx.buildInitialRoomData({ mode: "online2v2" });
      const profile = ctx.getPlayerProfile();

      Object.assign(initialRoomData.players.A, {
        joined: true,
        ready: false,
        unitIds: [],
        unitId: null,
        profileId: profile?.id || null,
        profileName: profile?.name || profile?.id || "ゲスト",
        equippedTitles: Array.isArray(profile?.equippedTitles) ? profile.equippedTitles : [],
        lastSeen: Date.now()
      });

      Object.assign(initialRoomData.players.B, {
        joined: false,
        ready: false,
        unitIds: [],
        unitId: null,
        lastSeen: 0
      });

      await ctx.writeRoom(roomId, initialRoomData);

      const inviteUrl = `${location.origin}${location.pathname}?mode=online2v2&room=${roomId}`;

      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = `オンライン2on2部屋を作成しました。あなたはPLAYER Aです。部屋ID：${roomId}`;
      }

      if (onlineInviteUrl) {
        onlineInviteUrl.textContent = inviteUrl;
      }

      roomIdMatchUnsubscribe = ctx.listenRoom(roomId, (roomData) => {
        if (!roomData) return;

        const playerBJoined = roomData.players?.B?.joined;
        const status = ctx.getOnlineRoomStatus();

        if (status) {
          status.textContent = playerBJoined
            ? `PLAYER B が参加しました。2on2機体選択へ移動します。部屋ID：${roomId}`
            : `PLAYER B の参加待ちです。部屋ID：${roomId}`;
        }

        if (playerBJoined) {
          enterRoomIdMatchedRoom(roomId, "A");
        }
      });
    } catch (error) {
      console.error(error);
      ctx.showPopup(`オンライン2on2部屋作成エラー：${error.message}`);
    }
  }

  async function joinOnline2v2Room() {
    try {
      await ctx.cleanupOldRooms();
      cleanupRoomIdMatchListener();

      const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
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

      const roomData = snapshot.val();

      if (roomData?.meta?.mode !== "online2v2") {
        ctx.showPopup("この部屋はオンライン2on2部屋ではありません");
        return;
      }

      roomIdMatchActiveRoomId = roomId;
      roomIdMatchEntering = false;

      ctx.setOnlineState({
        enabled: true,
        roomId,
        myPlayer: "B",
        isHost: false,
        isSpectator: false
      });

      ctx.setOnlineSelectEntered(false);
      ctx.setOnlineBattleStarted(false);

      await ctx.updateRoom(roomId, {
        "players/B/joined": true,
        "players/B/ready": false,
        "players/B/unitIds": [],
        "players/B/unitId": null,
        "players/B/left": false,
        "players/B/lastSeen": Date.now(),
        ...getOnlineProfilePatch("B"),
        "meta/status": "selecting",
        "meta/updatedAt": Date.now()
      });

      const onlineRoomStatus = ctx.getOnlineRoomStatus();

      if (onlineRoomStatus) {
        onlineRoomStatus.textContent = "オンライン2on2部屋に参加しました。機体選択へ移動します。";
      }

      enterRoomIdMatchedRoom(roomId, "B");
    } catch (error) {
      console.error(error);
      ctx.showPopup(`オンライン2on2部屋参加エラー：${error.message}`);
    }
  }

  function bootOnline2v2FromUrl() {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const roomId = params.get("room");

    if (mode !== "online2v2" || !roomId) return false;

    ctx.setBattleMode("online2v2");
    ctx.showScreen("onlineRoom");

    const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
    const onlineRoomStatus = ctx.getOnlineRoomStatus();

    if (onlineRoomIdInput) {
      onlineRoomIdInput.value = roomId;
    }

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = "オンライン2on2招待URLから部屋IDを読み込みました。「部屋に入る」を押してください。";
    }

    return true;
  }

  async function selectOnline2v2Unit(unit) {
    if (!ctx.isOnlineEnabled || !ctx.isOnlineEnabled()) return false;
    if (ctx.getBattleMode() !== "online2v2") return false;
    if (!unit) return true;

    const roomId = ctx.getOnlineRoomId();
    const myPlayer = ctx.getOnlineMyPlayer();

    if (!roomId || (myPlayer !== "A" && myPlayer !== "B")) {
      ctx.showPopup("オンライン2on2部屋情報が取得できません");
      return true;
    }

    const currentUnits = getSelectTeamUnits(myPlayer);
    const currentIds = currentUnits.map(getUnitId).filter(Boolean);

    if (currentIds.length >= 2) {
      ctx.showPopup("オンライン2on2では2機まで選択済みです");
      return true;
    }

    const nextIds = [...currentIds, getUnitId(unit)].filter(Boolean).slice(0, 2);
    const nextUnits = idsToUnits(nextIds);
    const ready = nextIds.length >= 2;

    setSelectTeamUnits(myPlayer, nextUnits);
    ctx.updateSelectUi();

    await ctx.updateRoom(roomId, {
      [`players/${myPlayer}/unitIds`]: nextIds,
      [`players/${myPlayer}/unitId`]: nextIds[0] || null,
      [`players/${myPlayer}/ready`]: ready,
      [`players/${myPlayer}/lastSeen`]: Date.now(),
      "meta/status": "selecting",
      "meta/updatedAt": Date.now()
    });

    return true;
  }

  function syncSelectedUnitsFromRoom(roomData) {
    const idsA = getRoomUnitIds(roomData, "A");
    const idsB = getRoomUnitIds(roomData, "B");

    setSelectTeamUnits("A", idsToUnits(idsA));
    setSelectTeamUnits("B", idsToUnits(idsB));

    ctx.updateSelectUi();
  }

 function applyOnline2v2RoomData(roomData) {
    if (!ctx.isOnlineEnabled() || !roomData) return;
    if (roomData?.meta?.mode !== "online2v2") return;

    ctx.renderOnlineExtraUi(roomData);
    ctx.applyOnlinePeaceRequest(roomData);
    ctx.applyOnlineMetaResult(roomData);

    const playerA = roomData.players?.A || {};
    const playerB = roomData.players?.B || {};

    const idsA = getRoomUnitIds(roomData, "A");
    const idsB = getRoomUnitIds(roomData, "B");
    const unitsA = idsToUnits(idsA);
    const unitsB = idsToUnits(idsB);

    setSelectTeamUnits("A", unitsA);
    setSelectTeamUnits("B", unitsB);
    ctx.updateSelectUi();

    if (
      !isOnlineSpectator() &&
      typeof ctx.applyOnline2v2Action === "function"
    ) {
      ctx.applyOnline2v2Action(roomData.action);
    }

    const aReady = playerA.ready === true || idsA.length >= 2;
    const bReady = playerB.ready === true || idsB.length >= 2;

    if (
      !isOnlineSpectator() &&
      !ctx.getOnlineBattleStarted() &&
      aReady &&
      bReady &&
      unitsA.length >= 2 &&
      unitsB.length >= 2
    ) {
      ctx.saveOnlineEncounteredPlayer(roomData);
      ctx.setOnlineBattleStarted(true);
      initOnline2v2Battle(unitsA, unitsB);
    }
  }

  function enterOnline2v2Select() {
    if (ctx.getOnlineSelectEntered()) return;

    ctx.setBattleMode("online2v2");
    ctx.setSelectedUnitA(null);
    ctx.setSelectedUnitB(null);
    ctx.setTeamA({ units: [] });
    ctx.setTeamB({ units: [] });
    ctx.setSelectingPlayer(ctx.getOnlineMyPlayer() === "B" ? "B" : "A");
    ctx.setOnlineBattleStarted(false);
    ctx.setOnlineSelectEntered(true);
    ctx.showScreen("select");
    ctx.loadUnitButtons();
    ctx.updateSelectUi();
  }

  function initOnline2v2Battle(unitsA, unitsB) {
    ctx.init2v2(unitsA, unitsB);
    ctx.ensureOnlineBattleExtraUi();

    const attackLog = document.getElementById("attackLog");
    if (attackLog) {
      attackLog.textContent = "オンライン2on2バトル開始";
    }
  }

  return {
    createOnline2v2Room,
    joinOnline2v2Room,
    bootOnline2v2FromUrl,
    selectOnline2v2Unit,
    applyOnline2v2RoomData,
    enterOnline2v2Select,
    initOnline2v2Battle
  };
}
