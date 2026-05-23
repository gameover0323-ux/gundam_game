export function createOnlineRoomController(ctx) {
  let roomIdMatchActiveRoomId = null;

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
      roomIdMatchActiveRoomId = roomId;

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
        onlineRoomStatus.textContent = `部屋作成中...\n部屋ID：${roomId}`;
      }

      const initialRoomData = ctx.buildInitialRoomData({
        mode: "online1v1"
      });

      const profile = ctx.getPlayerProfile();

      Object.assign(initialRoomData.players.A, {
        joined: true,
        roomReady: false,
        profileId: profile?.id || null,
        profileName: profile?.name || profile?.id || "ゲスト",
        equippedTitles: Array.isArray(profile?.equippedTitles)
          ? profile.equippedTitles
          : [],
        lastSeen: Date.now()
      });

      if (!initialRoomData.players.B) {
        initialRoomData.players.B = {};
      }

      Object.assign(initialRoomData.players.B, {
        roomReady: false
      });

      initialRoomData.chat = {
        A: { text: "", updatedAt: 0 },
        B: { text: "", updatedAt: 0 }
      };

      if (!initialRoomData.meta) {
        initialRoomData.meta = {};
      }

      initialRoomData.meta.status = "waiting";
      initialRoomData.meta.updatedAt = Date.now();

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

        if (roomData.meta?.status === "selecting") {
          if (status) {
            status.textContent = `部屋IDマッチ成立。マッチルートへ移動します。部屋ID：${roomId}`;
          }

          hideRoomIdMatchPanel();
          enterRoomIdMatchedRoom(roomId);
          return;
        }

        if (playerBJoined) {
          if (status) {
            status.textContent = `PLAYER B が参加しました。部屋ID：${roomId}`;
          }

          renderRoomIdMatchPanel(roomData);
        } else if (status) {
          status.textContent = `PLAYER B の参加待ちです。部屋ID：${roomId}`;
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

    roomIdMatchActiveRoomId = roomId;

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
      "players/B/left": false,
      "players/B/roomReady": false,
      "players/B/lastSeen": Date.now(),
      ...getOnlineProfilePatch("B"),
      "chat/B/text": "",
      "chat/B/updatedAt": 0,
      "meta/status": "waiting",
      "meta/updatedAt": Date.now()
    });

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = "部屋に参加しました。あなたはPLAYER Bです。";
    }

    ctx.listenRoom(roomId, roomData => {
      if (!roomData) return;

      const status = ctx.getOnlineRoomStatus();

      if (roomData.meta?.status === "selecting") {
        if (status) {
          status.textContent = "部屋IDマッチ成立。ランダムマッチ同等ルートへ移動します。";
        }

        hideRoomIdMatchPanel();
        enterRoomIdMatchedRoom(roomId);
        return;
      }

      if (status) {
        status.textContent = "部屋IDマッチ成立。チャット確認中です。";
      }

      renderRoomIdMatchPanel(roomData);
      ctx.applyOnlineRoomData(roomData);
    });
  }

  function enterRoomIdMatchedRoom(roomId) {
    if (!roomId) return;

    ctx.enterRandomMatchedRoom({
      roomId,
      playerSide: ctx.getOnlineMyPlayer()
    });
  }

  function hideRoomIdMatchPanel() {
    const panel = document.getElementById("roomIdMatchPanel");

    if (panel) {
      panel.style.display = "none";
    }
  }

  function renderRoomIdMatchPanel(roomData) {
    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    const parent = onlineRoomStatus?.parentNode || ctx.getScreens?.()?.onlineRoom;

    if (!parent) return;

    const mySide = ctx.getOnlineMyPlayer();

    if (mySide !== "A" && mySide !== "B") return;

    const enemySide = mySide === "A" ? "B" : "A";

    const myData = roomData.players?.[mySide] || {};
    const enemyData = roomData.players?.[enemySide] || {};
    const myChat = roomData.chat?.[mySide]?.text || "";
    const enemyChat = roomData.chat?.[enemySide]?.text || "";

    let panel = document.getElementById("roomIdMatchPanel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "roomIdMatchPanel";
      panel.style.margin = "12px 0";
      panel.style.padding = "8px";
      panel.style.border = "2px solid #fff";
      panel.style.textAlign = "left";
      parent.appendChild(panel);
    }

    panel.style.display = "";
    panel.innerHTML = `
      <h3>部屋IDマッチ成立</h3>
      <div>あなた：${escapeHtml(myData.profileName || "ゲスト")} ${myData.roomReady ? "【準備OK】" : ""}</div>
      <div>相手：${escapeHtml(enemyData.profileName || "ゲスト")} ${enemyData.roomReady ? "【準備OK】" : ""}</div>
      <div style="border-top:1px solid #fff;border-bottom:1px solid #fff;padding:6px;margin:8px 0;">
        <div>[あなた] ${escapeHtml(myChat)}</div>
        <div>[相手] ${escapeHtml(enemyChat)}</div>
      </div>
      <input id="roomIdMatchChatInput" maxlength="50" placeholder="生存確認チャット 50文字まで">
      <button id="roomIdMatchChatSendBtn" type="button">送信</button>
      <div style="margin-top:8px;">
        <button id="roomIdMatchReadyBtn" type="button">${myData.roomReady ? "準備OK済み" : "準備OK"}</button>
      </div>
    `;

    const chatButton = document.getElementById("roomIdMatchChatSendBtn");
    const readyButton = document.getElementById("roomIdMatchReadyBtn");

    if (chatButton) {
      chatButton.onclick = sendRoomIdMatchChat;
    }

    if (readyButton) {
      readyButton.onclick = readyRoomIdMatch;
      readyButton.disabled = !!myData.roomReady;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function sendRoomIdMatchChat() {
    const roomId = roomIdMatchActiveRoomId;
    const mySide = ctx.getOnlineMyPlayer();

    if (!roomId || (mySide !== "A" && mySide !== "B")) return;

    const input = document.getElementById("roomIdMatchChatInput");
    const text = String(input?.value || "").trim().slice(0, 50);

    await ctx.updateRoom(roomId, {
      [`chat/${mySide}/text`]: text,
      [`chat/${mySide}/updatedAt`]: Date.now(),
      [`players/${mySide}/lastSeen`]: Date.now(),
      "meta/updatedAt": Date.now()
    });

    if (input) {
      input.value = "";
    }
  }

  async function readyRoomIdMatch() {
    const roomId = roomIdMatchActiveRoomId;
    const mySide = ctx.getOnlineMyPlayer();

    if (!roomId || (mySide !== "A" && mySide !== "B")) return;

    await ctx.updateRoom(roomId, {
      [`players/${mySide}/roomReady`]: true,
      [`players/${mySide}/lastSeen`]: Date.now(),
      "meta/updatedAt": Date.now()
    });

    const snapshot = await ctx.readRoom(roomId);
    const roomData = snapshot.val();

    const aReady = !!roomData?.players?.A?.roomReady;
    const bReady = !!roomData?.players?.B?.roomReady;

    if (aReady && bReady && mySide === "A") {
      await ctx.updateRoom(roomId, {
        "meta/status": "selecting",
        "meta/updatedAt": Date.now()
      });
    }
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
      onlineRoomStatus.textContent = "招待URLから部屋IDを読み込みました。「部屋に入る」を押してください。";
    }
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
    applyOnlineRoomData,
    enterOnlineSelect,
    initOnline1v1Battle
  };
}
