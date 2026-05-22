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

    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = `観戦中です。部屋ID：${roomId}`;
    }

    ctx.listenRoom(roomId, latestRoomData => {
      if (!latestRoomData) return;

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
