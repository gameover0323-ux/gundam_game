export function createOnlineSpectatorController(ctx) {
  let lastAppliedSnapshotUpdatedAt = 0;

  const spectatorSessionId =
    `spectator_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function getSpectatorName() {
    const profile = ctx.getPlayerProfile?.();
    return profile?.name || profile?.id || "観戦者";
  }

  function getUnitName(unitId) {
    if (!unitId) return "未選択";

    if (typeof ctx.getUnitNameById === "function") {
      return ctx.getUnitNameById(unitId);
    }

    return unitId;
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

    const snapshotUpdatedAt = Number(snapshot.updatedAt || 0);

    if (snapshotUpdatedAt > 0 && snapshotUpdatedAt < lastAppliedSnapshotUpdatedAt) {
      return;
    }

    if (snapshotUpdatedAt > 0) {
      lastAppliedSnapshotUpdatedAt = snapshotUpdatedAt;
    }

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
    ensureSpectatorBattleUi();
    ctx.showScreen("battle");
  }

  function ensureSpectatorBattleUi() {
    if (document.getElementById("spectatorBattleUi")) return;

    const battleScreen = document.getElementById("battle");
    if (!battleScreen) return;

    const box = document.createElement("div");
    box.id = "spectatorBattleUi";
    box.style.marginTop = "12px";
    box.style.padding = "8px";
    box.style.borderTop = "2px solid #fff";
    box.style.textAlign = "left";
    box.style.display = isOnlineSpectator() ? "" : "none";

    box.innerHTML = `
      <div id="spectatorRoomIdView" style="font-size:12px;margin-bottom:6px;"></div>
      <div id="spectatorChatView" style="min-height:24px;margin-bottom:6px;">
        [観戦者チャット]
      </div>
      <div style="display:flex;gap:4px;align-items:center;">
        <input id="spectatorChatInput" maxlength="50" placeholder="観戦チャット 50文字まで" style="flex:1;min-width:0;">
        <button id="spectatorChatSendBtn">送信</button>
        <button id="spectatorLeaveBtn">退室</button>
      </div>
    `;

    battleScreen.appendChild(box);

    document.getElementById("spectatorChatSendBtn")?.addEventListener("click", sendSpectatorChat);
    document.getElementById("spectatorLeaveBtn")?.addEventListener("click", leaveSpectatorRoom);
  }

  function renderSpectatorBattleUi(roomData) {
    ensureSpectatorBattleUi();

    const box = document.getElementById("spectatorBattleUi");
    if (box) {
      box.style.display = isOnlineSpectator() ? "" : "none";
    }

    const roomIdView = document.getElementById("spectatorRoomIdView");
    if (roomIdView) {
      roomIdView.textContent = `観戦中 部屋ID：${ctx.getOnlineState()?.roomId || ""}`;
    }

    const chatView = document.getElementById("spectatorChatView");
    if (chatView) {
      const latest = roomData?.spectatorChat?.latest || null;

      if (latest?.text) {
        chatView.textContent = `(${latest.name || "観戦者"}) ${latest.text}`;
      } else {
        chatView.textContent = "[観戦者チャット]";
      }
    }
  }

  function isSpectatableRoom(roomData) {
    if (!roomData) return false;

    const status = roomData.meta?.status || "waiting";
    const policy = roomData.spectatorSettings?.policy || "allow";
    const playerA = roomData.players?.A || {};
    const playerB = roomData.players?.B || {};

    return (
      policy !== "deny" &&
      status !== "finished" &&
      status !== "peace" &&
      playerA.joined &&
      playerB.joined &&
      playerA.ready &&
      playerB.ready &&
      playerA.unitId &&
      playerB.unitId
    );
  }

  async function sendSpectatorChat() {
    if (!isOnlineSpectator()) return;

    const roomId = ctx.getOnlineState()?.roomId;
    if (!roomId) return;

    const input = document.getElementById("spectatorChatInput");
    const text = String(input?.value || "").trim().slice(0, 50);

    if (!text) return;

    await ctx.updateRoom(roomId, {
      [`spectators/${spectatorSessionId}/name`]: getSpectatorName(),
      [`spectators/${spectatorSessionId}/lastSeen`]: Date.now(),
      "spectatorChat/latest": {
        id: spectatorSessionId,
        name: getSpectatorName(),
        text,
        updatedAt: Date.now()
      },
      "meta/updatedAt": Date.now()
    });

    if (input) input.value = "";
  }

  async function leaveSpectatorRoom() {
    const roomId = ctx.getOnlineState()?.roomId;

    if (roomId) {
      await ctx.updateRoom(roomId, {
        [`spectators/${spectatorSessionId}/left`]: true,
        [`spectators/${spectatorSessionId}/lastSeen`]: Date.now(),
        "meta/updatedAt": Date.now()
      });
    }

    ctx.setOnlineState({
      enabled: false,
      roomId: null,
      myPlayer: null,
      isHost: false,
      isSpectator: false
    });

    const spectatorUi = document.getElementById("spectatorBattleUi");
    if (spectatorUi) spectatorUi.remove();

    ctx.showScreen("title");
  }

  async function enterSpectatorRoom(roomId) {
    lastAppliedSnapshotUpdatedAt = 0;

    ctx.setOnlineState({
      enabled: true,
      roomId,
      myPlayer: null,
      isHost: false,
      isSpectator: true
    });

    await ctx.updateRoom(roomId, {
      [`spectators/${spectatorSessionId}/name`]: getSpectatorName(),
      [`spectators/${spectatorSessionId}/joinedAt`]: Date.now(),
      [`spectators/${spectatorSessionId}/lastSeen`]: Date.now(),
      [`spectators/${spectatorSessionId}/left`]: false,
      "meta/updatedAt": Date.now()
    });

    ctx.setBattleMode("online1v1");
    ctx.setOnlineSelectEntered(true);
    ctx.setOnlineBattleStarted(true);

    ctx.listenRoom(roomId, latestRoomData => {
      if (!latestRoomData) return;

      const spectatorData = latestRoomData.spectators?.[spectatorSessionId] || null;

      if (spectatorData?.kicked === true) {
        ctx.showPopup("この観戦から退出させられました");
        leaveSpectatorRoom();
        return;
      }

      if (latestRoomData.spectatorSettings?.policy === "deny") {
        ctx.showPopup("この部屋は観戦不可になりました");
        leaveSpectatorRoom();
        return;
      }

      ctx.applyOnlineRoomData(latestRoomData);
      renderSpectatorBattleUi(latestRoomData);

      if (latestRoomData.battleSnapshot) {
        applyOnlineBattleSnapshot(latestRoomData.battleSnapshot);
        renderSpectatorBattleUi(latestRoomData);
        return;
      }

      if (latestRoomData.players?.A?.unitId && latestRoomData.players?.B?.unitId) {
        ctx.showScreen("battle");
        ctx.redrawBattleBoards();
        ctx.ensureOnlineBattleExtraUi();
        ensureSpectatorBattleUi();
        renderSpectatorBattleUi(latestRoomData);
      }
    });
  }

  async function spectateRoomById(roomId) {
    const onlineRoomStatus = ctx.getOnlineRoomStatus();

    if (!roomId) {
      ctx.showPopup("観戦する部屋IDがありません");
      return;
    }

    const snapshot = await ctx.readRoom(roomId);

    if (!snapshot.exists()) {
      ctx.showPopup("部屋が見つかりません");
      return;
    }

    const roomData = snapshot.val();

    if (!isSpectatableRoom(roomData)) {
      ctx.showPopup("この部屋は現在観戦できません");
      return;
    }

    await enterSpectatorRoom(roomId);

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = `観戦中です。部屋ID：${roomId}`;
    }
  }

  async function spectateOnlineRoom() {
    await ctx.cleanupOldRooms();

    const onlineRoomIdInput = ctx.getOnlineRoomIdInput();
    const roomId = onlineRoomIdInput?.value.trim();

    await spectateRoomById(roomId);
  }

  async function showRandomSpectateRooms() {
    if (typeof ctx.readSpectatableRooms !== "function") {
      ctx.showPopup("ランダム観戦の部屋一覧取得関数が未接続です");
      return;
    }

    await ctx.cleanupOldRooms();

    const rooms = await ctx.readSpectatableRooms(20);

    if (!Array.isArray(rooms) || rooms.length === 0) {
      ctx.showPopup("現在観戦できる試合がありません");
      return;
    }

    const popup = document.getElementById("popup");
    if (!popup) {
      await spectateRoomById(rooms[0].roomId);
      return;
    }

    popup.innerHTML = "";

    const title = document.createElement("div");
    title.textContent = "観戦する試合を選んでください";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    popup.appendChild(title);

    rooms.forEach(({ roomId, roomData }) => {
      if (!isSpectatableRoom(roomData)) return;

      const playerA = roomData.players?.A || {};
      const playerB = roomData.players?.B || {};
      const spectatorCount = Object.values(roomData.spectators || {})
        .filter(s => s && !s.left && !s.kicked).length;

      const row = document.createElement("div");
      row.style.borderTop = "1px solid #888";
      row.style.padding = "6px 0";
      row.style.fontSize = "13px";

      const label = document.createElement("div");
      label.textContent =
        `${playerA.profileName || "PLAYER A"} / ${getUnitName(playerA.unitId)} VS ` +
        `${playerB.profileName || "PLAYER B"} / ${getUnitName(playerB.unitId)}`;

      const sub = document.createElement("div");
      sub.textContent = `ROOM ID：${roomId} / 観戦者 ${spectatorCount}人`;
      sub.style.fontSize = "11px";
      sub.style.opacity = "0.8";

      const btn = document.createElement("button");
      btn.textContent = "この試合を観戦";
      btn.style.marginTop = "4px";
      btn.addEventListener("click", async () => {
        popup.style.display = "none";
        popup.innerHTML = "";
        await spectateRoomById(roomId);
      });

      row.appendChild(label);
      row.appendChild(sub);
      row.appendChild(btn);
      popup.appendChild(row);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "閉じる";
    closeBtn.style.marginTop = "8px";
    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
      popup.innerHTML = "";
    });

    popup.appendChild(closeBtn);
    popup.style.display = "block";
  }

  function isOnlineSpectator() {
    return ctx.getOnlineState()?.isSpectator === true;
  }

  return {
    buildOnlineBattleSnapshot,
    applyOnlineBattleSnapshot,
    spectateOnlineRoom,
    showRandomSpectateRooms,
    isOnlineSpectator
  };
}
