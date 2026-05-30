export function createRandomMatchController(ctx) {
  const randomMatchState = {
    enabled: false,
    ticketId: null,
    sessionId: null,
    playerSide: null,
    waitingUnsubscribe: null,
    sessionUnsubscribe: null,
    enteringRoom: false
  };

  let randomMatchAnnouncementUnsubscribe = null;
  let lastSeenRandomMatchAnnouncementId = "";
  let randomMatchInviteShowing = false;

  function getRandomMatchState() {
    return randomMatchState;
  }

  function getRandomMatchNotifySettings() {
    const notify = ctx.getPlayerProfile()?.randomMatchNotify || {};
    return {
      title: notify.title === true,
      vsCpu: notify.vsCpu === true,
      vsBoss: notify.vsBoss === true
    };
  }

  function getCurrentRandomMatchNotifyScene() {
    const screens = ctx.getScreens();
    const visibleTitle = screens.title && screens.title.style.display !== "none";
    const visibleBattle = screens.battle && screens.battle.style.display !== "none";

    if (visibleTitle) return "title";

    if (visibleBattle) {
      const battleMode = ctx.getBattleMode();
      if (battleMode === "vscpu1v1" || battleMode === "vscpu2v2") return "vsCpu";
      if (battleMode === "challenge1v1" || battleMode === "challenge2v2") return "vsBoss";
    }

    return "";
  }

  function canReceiveRandomMatchAnnouncement(data) {
    const profile = ctx.getPlayerProfile();

    if (!profile) return false;
    if (!data || !data.id) return false;
    if (data.profileId && data.profileId === profile.id) return false;
    if (data.id === lastSeenRandomMatchAnnouncementId) return false;
    if (randomMatchInviteShowing) return false;
    if (ctx.isOnlineEnabled() || randomMatchState.enabled) return false;

    const scene = getCurrentRandomMatchNotifyScene();
    if (!scene) return false;

    const settings = getRandomMatchNotifySettings();
    return settings[scene] === true;
  }

  function listenRandomMatchAnnouncementsOnceReady() {
    if (randomMatchAnnouncementUnsubscribe) return;

    randomMatchAnnouncementUnsubscribe = ctx.listenRandomMatchAnnouncement(data => {
      if (!canReceiveRandomMatchAnnouncement(data)) return;

      lastSeenRandomMatchAnnouncementId = data.id;
      showRandomMatchInvitePopup(data);
    });
  }

  function showRandomMatchInvitePopup(data) {
    const popup = document.getElementById("popup");
    if (!popup) return;

    randomMatchInviteShowing = true;

    popup.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px;">
        誰かがランダムマッチを募集しました。
      </div>
      <div style="margin-bottom:10px;">
        今すぐ駆けつけますか？
      </div>
      <div style="font-size:12px; opacity:0.8; margin-bottom:10px;">
        募集者：${data.profileName || "プレイヤー"}
      </div>
      <button id="acceptRandomMatchInviteBtn">はい</button>
      <button id="declineRandomMatchInviteBtn">いいえ</button>
    `;

    popup.style.display = "block";

    document.getElementById("acceptRandomMatchInviteBtn")?.addEventListener("click", () => {
      randomMatchInviteShowing = false;
      popup.style.display = "none";
      popup.innerHTML = "";
      jumpToRandomMatchFromAnnouncement();
    });

    document.getElementById("declineRandomMatchInviteBtn")?.addEventListener("click", () => {
      randomMatchInviteShowing = false;
      popup.style.display = "none";
      popup.innerHTML = "";
    });
  }

  function jumpToRandomMatchFromAnnouncement() {
    ctx.abortCurrentBattleWithoutRecordForRandomMatch();

    ctx.setBattleMode("online1v1");
    ctx.showScreen("onlineRoom");

    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    if (onlineRoomStatus) {
      onlineRoomStatus.textContent = "ランダムマッチへ駆けつけています…";
    }

    ensureRandomMatchUi();
    startRandomMatch();
  }

  function getRandomMatchProfileData() {
    const profile = ctx.getPlayerProfile();

    return {
      profileId: profile?.id || null,
      profileName: profile?.name || profile?.id || "ゲスト",
      equippedTitles: Array.isArray(profile?.equippedTitles)
        ? profile.equippedTitles
        : []
    };
  }

  function cleanupRandomMatchListeners() {
    if (typeof randomMatchState.waitingUnsubscribe === "function") {
      randomMatchState.waitingUnsubscribe();
    }

    if (typeof randomMatchState.sessionUnsubscribe === "function") {
      randomMatchState.sessionUnsubscribe();
    }

    randomMatchState.waitingUnsubscribe = null;
    randomMatchState.sessionUnsubscribe = null;
  }

  function resetRandomMatchState() {
    cleanupRandomMatchListeners();

    randomMatchState.enabled = false;
    randomMatchState.ticketId = null;
    randomMatchState.sessionId = null;
    randomMatchState.playerSide = null;
    randomMatchState.enteringRoom = false;

    const panel = document.getElementById("randomMatchPanel");
    if (panel) {
      panel.style.display = "none";
      panel.innerHTML = "";
    }
  }

  function ensureRandomMatchUi() {
    if (!ctx.getPlayerProfile()) {
      return;
    }

    if (document.getElementById("randomMatchBtn")) return;

    const btn = document.createElement("button");
    btn.id = "randomMatchBtn";
    btn.textContent = "ランダムマッチ";
    btn.style.margin = "8px";

    const panel = document.createElement("div");
    panel.id = "randomMatchPanel";
    panel.style.display = "none";
    panel.style.margin = "12px 0";
    panel.style.padding = "8px";
    panel.style.border = "2px solid #fff";

    const onlineRoomStatus = ctx.getOnlineRoomStatus();
    const createOnlineRoomBtn = ctx.getCreateOnlineRoomBtn();
    const screens = ctx.getScreens();

    const parent = onlineRoomStatus?.parentNode || screens.onlineRoom;
    if (!parent) return;

    if (createOnlineRoomBtn?.parentNode) {
      createOnlineRoomBtn.parentNode.insertBefore(btn, createOnlineRoomBtn.nextSibling);
    } else {
      parent.appendChild(btn);
    }

    parent.appendChild(panel);

    btn.addEventListener("click", startRandomMatch);
  }

  function renderRandomMatchSearching() {
    const panel = document.getElementById("randomMatchPanel");
    if (!panel) return;

    panel.style.display = "";
    panel.innerHTML = `
      <h3>ランダムマッチ</h3>
      <div id="randomMatchStatus">マッチング相手を探しています...</div>
      <button id="randomMatchCancelBtn">キャンセル</button>
    `;

    document.getElementById("randomMatchCancelBtn")?.addEventListener("click", cancelRandomMatch);
  }

  function getRandomMatchTitleText(playerData) {
    const titleIds = Array.isArray(playerData?.equippedTitles)
      ? playerData.equippedTitles
      : [];

    if (titleIds.length === 0) {
      return "称号なし";
    }

    return titleIds.map(id => `[${ctx.getTitleName(id)}]`).join("");
  }

  function getRandomMatchPlayerLabel(playerData) {
    return `
      <div>${getRandomMatchTitleText(playerData)}</div>
      <div>${playerData?.profileName || "ゲスト"}</div>
    `;
  }

  function renderRandomMatchSession(sessionData) {
    const panel = document.getElementById("randomMatchPanel");
    if (!panel || !sessionData) return;

    const side = randomMatchState.playerSide;
    const enemySide = side === "A" ? "B" : "A";
    const myData = sessionData.players?.[side] || {};
    const enemyData = sessionData.players?.[enemySide] || {};
    const myReady = !!myData.ready;
    const enemyReady = !!enemyData.ready;
    const myChat = sessionData.chat?.[side]?.text || "";
    const enemyChat = sessionData.chat?.[enemySide]?.text || "";

    panel.style.display = "";
    panel.innerHTML = `
      <h3>ランダムマッチ成立</h3>

      <div style="margin-bottom:8px;">
        <div>あなた</div>
        ${getRandomMatchPlayerLabel(myData)}
      </div>

      <div style="margin-bottom:8px;">
        <div>対戦相手</div>
        ${getRandomMatchPlayerLabel(enemyData)}
      </div>

      <div style="border-top:1px solid #fff;border-bottom:1px solid #fff;padding:6px;margin:8px 0;text-align:left;">
        <div>[あなた] ${myChat}</div>
        <div>[相手] ${enemyChat}</div>
      </div>

      <div>
        <input id="randomMatchChatInput" maxlength="50" placeholder="生存確認チャット 50文字まで">
        <button id="randomMatchChatSendBtn">送信</button>
      </div>

      <div id="randomMatchReadyStatus" style="margin:8px 0;">
        ${myReady ? "相手からの返答待ちです" : "準備OKを押してください"}
        ${enemyReady ? "<br>相手は準備OKです" : ""}
      </div>

      <button id="randomMatchReadyBtn" ${myReady ? "disabled" : ""}>準備OK</button>
      <button id="randomMatchRerollBtn">再抽選</button>
    `;

    document.getElementById("randomMatchChatSendBtn")?.addEventListener("click", sendRandomMatchChat);
    document.getElementById("randomMatchReadyBtn")?.addEventListener("click", readyRandomMatch);
    document.getElementById("randomMatchRerollBtn")?.addEventListener("click", rerollRandomMatch);
  }

  async function startRandomMatch() {
    try {
      await ctx.cleanupOldRandomMatch();

      resetRandomMatchState();

      randomMatchState.enabled = true;
      renderRandomMatchSearching();

      const profile = ctx.getPlayerProfile();
      if (!profile) {
        ctx.showPopup("ランダムマッチはプレイヤー登録・ログイン中のみ利用できます");
        resetRandomMatchState();
        return;
      }

      const myTicketId = ctx.createRoomId() + "_" + Date.now();
      const myProfile = getRandomMatchProfileData();
      const now = Date.now();

      await ctx.writeRandomMatchAnnouncement({
        id: myTicketId,
        profileId: profile.id,
        profileName: profile.name || profile.id || "プレイヤー",
        createdAt: now,
        updatedAt: now
      });

      randomMatchState.ticketId = myTicketId;

      const waitingSnapshot = await ctx.readRandomMatchWaiting();

      let opponentTicket = null;
      let opponentTicketId = null;

      if (waitingSnapshot.exists()) {
        waitingSnapshot.forEach(childSnap => {
          if (opponentTicket) return;

          const data = childSnap.val();
          if (!data) return;
          if (childSnap.key === myTicketId) return;
          if (data.status !== "waiting") return;

          opponentTicket = data;
          opponentTicketId = childSnap.key;
        });
      }

      if (opponentTicket && opponentTicketId) {
        await createRandomMatchSessionFromTickets({
          opponentTicketId,
          opponentTicket,
          myTicketId,
          myProfile
        });
        return;
      }

      await ctx.writeRandomMatchWaiting(myTicketId, {
        ticketId: myTicketId,
        status: "waiting",
        sessionId: null,
        createdAt: now,
        updatedAt: now,
        ...myProfile
      });

      randomMatchState.waitingUnsubscribe = ctx.listenRandomMatchWaiting(myTicketId, data => {
        if (!data) return;

        if (data.status === "matched" && data.sessionId) {
          cleanupRandomMatchListeners();

          randomMatchState.sessionId = data.sessionId;
          randomMatchState.playerSide = "A";

          listenRandomMatchSessionById(data.sessionId);
        }
      });
    } catch (error) {
      console.error(error);
      ctx.showPopup(`ランダムマッチ開始エラー：${error.message}`);
      resetRandomMatchState();
    }
  }

  async function createRandomMatchSessionFromTickets({
    opponentTicketId,
    opponentTicket,
    myTicketId,
    myProfile
  }) {
    const sessionId = ctx.createRoomId() + "_" + Date.now();
    const now = Date.now();

    randomMatchState.sessionId = sessionId;
    randomMatchState.playerSide = "B";

    await ctx.writeRandomMatchSession(sessionId, {
      sessionId,
      status: "confirming",
      roomId: null,
      rerollBy: null,
      createdAt: now,
      updatedAt: now,
      players: {
        A: {
          profileId: opponentTicket.profileId || null,
          profileName: opponentTicket.profileName || "ゲスト",
          equippedTitles: Array.isArray(opponentTicket.equippedTitles)
            ? opponentTicket.equippedTitles
            : [],
          ready: false
        },
        B: {
          ...myProfile,
          ready: false
        }
      },
      chat: {
        A: {
          text: "",
          updatedAt: 0
        },
        B: {
          text: "",
          updatedAt: 0
        }
      }
    });

    await ctx.updateRandomMatchWaiting(opponentTicketId, {
      status: "matched",
      sessionId,
      updatedAt: now
    });

    await ctx.removeRandomMatchWaiting(myTicketId).catch(() => {});

    listenRandomMatchSessionById(sessionId);
  }

  function listenRandomMatchSessionById(sessionId) {
    cleanupRandomMatchListeners();

    randomMatchState.sessionUnsubscribe = ctx.listenRandomMatchSession(sessionId, sessionData => {
      if (!sessionData) {
        if (randomMatchState.enabled && !randomMatchState.enteringRoom) {
          ctx.showPopup("マッチングが解除されました");
          resetRandomMatchState();
        }
        return;
      }

      handleRandomMatchSessionUpdate(sessionData);
    });
  }

  function handleRandomMatchSessionUpdate(sessionData) {
    if (!randomMatchState.enabled) return;

    if (sessionData.status === "reroll") {
      const rerollBy = sessionData.rerollBy;
      if (rerollBy && rerollBy !== randomMatchState.playerSide) {
        ctx.showPopup("再抽選が選択されました");
      }

      const oldSessionId = randomMatchState.sessionId;

      resetRandomMatchState();

      setTimeout(() => {
        if (oldSessionId) {
          ctx.removeRandomMatchSession(oldSessionId).catch(() => {});
        }
        startRandomMatch();
      }, 700);

      return;
    }

    if (sessionData.status === "completed" && sessionData.roomId) {
      enterRandomMatchedRoom(sessionData.roomId);
      return;
    }

    renderRandomMatchSession(sessionData);

    const playerAReady = !!sessionData.players?.A?.ready;
    const playerBReady = !!sessionData.players?.B?.ready;

    if (
      sessionData.status === "confirming" &&
      playerAReady &&
      playerBReady &&
      randomMatchState.playerSide === "A" &&
      !randomMatchState.enteringRoom
    ) {
      createRoomFromRandomMatchSession(sessionData);
    }
  }

  async function sendRandomMatchChat() {
    if (!randomMatchState.sessionId || !randomMatchState.playerSide) return;

    const input = document.getElementById("randomMatchChatInput");
    const text = String(input?.value || "").trim().slice(0, 50);

    await ctx.updateRandomMatchSession(randomMatchState.sessionId, {
      [`chat/${randomMatchState.playerSide}/text`]: text,
      [`chat/${randomMatchState.playerSide}/updatedAt`]: Date.now(),
      updatedAt: Date.now()
    });

    if (input) {
      input.value = "";
    }
  }

  async function readyRandomMatch() {
    if (!randomMatchState.sessionId || !randomMatchState.playerSide) return;

    await ctx.updateRandomMatchSession(randomMatchState.sessionId, {
      [`players/${randomMatchState.playerSide}/ready`]: true,
      updatedAt: Date.now()
    });

    const status = document.getElementById("randomMatchReadyStatus");
    if (status) {
      status.textContent = "相手からの返答待ちです";
    }
  }

  async function rerollRandomMatch() {
    if (!randomMatchState.sessionId || !randomMatchState.playerSide) {
      resetRandomMatchState();
      startRandomMatch();
      return;
    }

    await ctx.updateRandomMatchSession(randomMatchState.sessionId, {
      status: "reroll",
      rerollBy: randomMatchState.playerSide,
      updatedAt: Date.now()
    });

    ctx.showPopup("再抽選します");
  }

  async function cancelRandomMatch() {
    const ticketId = randomMatchState.ticketId;
    const sessionId = randomMatchState.sessionId;

    resetRandomMatchState();

    if (ticketId) {
      await ctx.removeRandomMatchWaiting(ticketId).catch(() => {});
    }

    if (sessionId) {
      await ctx.updateRandomMatchSession(sessionId, {
        status: "reroll",
        rerollBy: null,
        updatedAt: Date.now()
      }).catch(() => {});
    }
  }

  async function createRoomFromRandomMatchSession(sessionData) {
    if (randomMatchState.enteringRoom) return;
    randomMatchState.enteringRoom = true;

    const roomId = ctx.createRoomId();
    const now = Date.now();

    const initialRoomData = ctx.buildInitialRoomData({ mode: "online1v1" });

    initialRoomData.players.A = {
      ...initialRoomData.players.A,
      joined: true,
      ready: false,
      unitId: null,
      left: false,
      lastSeen: now,
      profileId: sessionData.players?.A?.profileId || null,
      profileName: sessionData.players?.A?.profileName || "ゲスト",
      equippedTitles: Array.isArray(sessionData.players?.A?.equippedTitles)
        ? sessionData.players.A.equippedTitles
        : []
    };

    initialRoomData.players.B = {
      ...initialRoomData.players.B,
      joined: true,
      ready: false,
      unitId: null,
      left: false,
      lastSeen: now,
      profileId: sessionData.players?.B?.profileId || null,
      profileName: sessionData.players?.B?.profileName || "ゲスト",
      equippedTitles: Array.isArray(sessionData.players?.B?.equippedTitles)
        ? sessionData.players.B.equippedTitles
        : []
    };

    initialRoomData.meta.status = "selecting";
    initialRoomData.meta.updatedAt = now;

    await ctx.writeRoom(roomId, initialRoomData);

    await ctx.updateRandomMatchSession(randomMatchState.sessionId, {
      status: "completed",
      roomId,
      updatedAt: Date.now()
    });

    enterRandomMatchedRoom(roomId);
  }

  function enterRandomMatchedRoom(roomId) {
    if (!randomMatchState.enabled) return;

    const playerSide = randomMatchState.playerSide;
    if (playerSide !== "A" && playerSide !== "B") return;

    randomMatchState.enteringRoom = true;

    cleanupRandomMatchListeners();

    ctx.enterRandomMatchedRoom({
      roomId,
      playerSide
    });

    const panel = document.getElementById("randomMatchPanel");
    if (panel) {
      panel.style.display = "none";
      panel.innerHTML = "";
    }
  }

  return {
    getRandomMatchState,
    resetRandomMatchState,
    ensureRandomMatchUi,
    listenRandomMatchAnnouncementsOnceReady,
    startRandomMatch
  };
      }
