export function createOnlineBattleUi(ctx) {
  function isSpectator() {
    return ctx.isOnlineSpectator && ctx.isOnlineSpectator();
  }

 function ensureOnlineBattleExtraUi() {
    ensureOnlineBattleRoomIdHeader();
    ensureOnlineTopPlayerHud();

    if (!document.getElementById("onlineBattleExtraArea")) {
      const area = document.createElement("div");
      area.id = "onlineBattleExtraArea";
      area.style.margin = "12px 0";
      area.style.padding = "8px";
      area.style.borderTop = "2px solid #fff";
      area.style.borderBottom = "2px solid #fff";
      area.style.display = ctx.isOnlineEnabled() ? "" : "none";

      area.innerHTML = `
        <div id="onlinePeaceStatusArea" style="font-size:14px;margin-bottom:8px;"></div>
        <div id="onlineSpectatorControlArea" style="font-size:13px;margin-bottom:8px;"></div>
        <div id="onlineChatFixedArea" style="text-align:left;margin-bottom:8px;">
          <div id="onlineChatA">[PLAYER Aチャット]</div>
          <div id="onlineChatB">[PLAYER Bチャット]</div>
        </div>
      `;

      const attackLog = document.getElementById("attackLog");
      if (attackLog?.parentNode) {
        attackLog.parentNode.insertBefore(area, attackLog);
      }
    }

    ensureOnlineCenterButtons();
  }

  function ensureOnlineBattleRoomIdHeader() {
    let header = document.getElementById("onlineBattleRoomIdHeader");

    if (!header) {
      const battleScreen = document.getElementById("battle");
      if (!battleScreen) return;

      header = document.createElement("div");
      header.id = "onlineBattleRoomIdHeader";
      header.style.fontSize = "14px";
      header.style.fontWeight = "bold";
      header.style.textAlign = "center";
      header.style.margin = "0 0 4px 0";
      header.style.opacity = "0.85";
      header.style.display = ctx.isOnlineEnabled() && ctx.getOnlineRoomId() ? "" : "none";

      battleScreen.prepend(header);
    }

    const roomId = ctx.getOnlineRoomId();
    header.textContent = roomId ? `ROOM ID：${roomId}` : "";
    header.style.display = ctx.isOnlineEnabled() && roomId ? "" : "none";
  }

  function ensureOnlineTopPlayerHud() {
    if (document.getElementById("onlineTopPlayerHud")) return;

    const battleScreen = document.getElementById("battle");
    if (!battleScreen) return;

    battleScreen.style.position = "relative";

    const hud = document.createElement("div");
    hud.id = "onlineTopPlayerHud";
    hud.style.display = ctx.isOnlineEnabled() ? "grid" : "none";
    hud.style.position = "absolute";
    hud.style.top = "8px";
    hud.style.left = "14px";
    hud.style.right = "14px";
    hud.style.zIndex = "5";
    hud.style.gridTemplateColumns = "minmax(0, 1fr) 120px minmax(0, 1fr)";
    hud.style.gap = "8px";
    hud.style.alignItems = "start";
    hud.style.pointerEvents = "none";

    hud.innerHTML = `
      <div id="onlineTopPlayerA" style="text-align:center;pointer-events:auto;min-width:0;">
        <div style="display:flex;gap:4px;justify-content:center;align-items:center;min-width:0;">
          <input id="onlineChatInputA" maxlength="50" placeholder="50文字まで" style="width:100%;min-width:0;max-width:210px;">
          <button id="onlineChatSendBtnA" style="width:54px;min-width:54px;">送信</button>
        </div>
        <div id="onlinePlayerInfoA" style="font-size:14px;margin-top:8px;line-height:1.4;word-break:break-word;"></div>
      </div>

      <div></div>

      <div id="onlineTopPlayerB" style="text-align:center;pointer-events:auto;min-width:0;">
        <div style="display:flex;gap:4px;justify-content:center;align-items:center;min-width:0;">
          <input id="onlineChatInputB" maxlength="50" placeholder="50文字まで" style="width:100%;min-width:0;max-width:210px;">
          <button id="onlineChatSendBtnB" style="width:54px;min-width:54px;">送信</button>
        </div>
        <div id="onlinePlayerInfoB" style="font-size:14px;margin-top:8px;line-height:1.4;word-break:break-word;"></div>
      </div>
    `;

    battleScreen.prepend(hud);

    document.getElementById("onlineChatSendBtnA")?.addEventListener("click", () => sendOnlineChat("A"));
    document.getElementById("onlineChatSendBtnB")?.addEventListener("click", () => sendOnlineChat("B"));
  }

  function ensureOnlineCenterButtons() {
    if (!ctx.isOnlineEnabled()) return;

    if (isSpectator()) {
      const existingBox = document.getElementById("onlinePeaceSurrenderBox");
      if (existingBox) existingBox.style.display = "none";
      return;
    }

    if (document.getElementById("onlinePeaceSurrenderBox")) return;

    const actionCounterValue = document.getElementById("actionCounterValue");
    const actionBox = actionCounterValue?.parentNode;
    if (!actionBox?.parentNode) return;

    const wrap = document.createElement("div");
    wrap.id = "onlinePeaceSurrenderBox";
    wrap.style.marginTop = "4px";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.alignItems = "center";
    wrap.style.gap = "4px";

    wrap.innerHTML = `
      <button id="onlinePeaceBtn" style="width:33px;height:33px;font-size:12px;padding:0;">
        和平
      </button>

      <button id="onlineSurrenderBtn" style="width:33px;height:33px;font-size:12px;padding:0;">
        降伏
      </button>
    `;

    actionBox.parentNode.appendChild(wrap);

    document.getElementById("onlinePeaceBtn")?.addEventListener("click", requestOnlinePeace);
    document.getElementById("onlineSurrenderBtn")?.addEventListener("click", requestOnlineSurrender);
  }

  async function sendOnlineChat(playerKey) {
    if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId()) return;

    if (isSpectator()) {
      ctx.showPopup("観戦中はPLAYERチャットを送信できません");
      return;
    }

    if (playerKey !== ctx.getOnlineMyPlayer()) {
      ctx.showPopup("自分側のチャット欄だけ送信できます");
      return;
    }

    const input = document.getElementById(`onlineChatInput${playerKey}`);
    const text = String(input?.value || "").trim().slice(0, 50);

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      [`chat/${playerKey}/text`]: text,
      [`chat/${playerKey}/updatedAt`]: Date.now(),
      [`players/${playerKey}/lastSeen`]: Date.now(),
      "meta/updatedAt": Date.now()
    });

    if (input) input.value = "";
  }

  function renderOnlineExtraUi(roomData) {
    ensureOnlineBattleExtraUi();
    ensureOnlineBattleRoomIdHeader();

    const area = document.getElementById("onlineBattleExtraArea");
    if (area) {
      area.style.display = ctx.isOnlineEnabled() ? "" : "none";
    }

    if (!ctx.isOnlineEnabled() || !roomData) return;

    const playerA = roomData.players?.A || {};
    const playerB = roomData.players?.B || {};
    const chatA = roomData.chat?.A?.text || "";
    const chatB = roomData.chat?.B?.text || "";

    const topHud = document.getElementById("onlineTopPlayerHud");
    if (topHud) {
      topHud.style.display = ctx.isOnlineEnabled() ? "grid" : "none";
    }

    const inputA = document.getElementById("onlineChatInputA");
    const inputB = document.getElementById("onlineChatInputB");
    const sendA = document.getElementById("onlineChatSendBtnA");
    const sendB = document.getElementById("onlineChatSendBtnB");
    const spectator = isSpectator();

    if (inputA) inputA.disabled = spectator || ctx.getOnlineMyPlayer() !== "A";
    if (inputB) inputB.disabled = spectator || ctx.getOnlineMyPlayer() !== "B";
    if (sendA) sendA.disabled = spectator || ctx.getOnlineMyPlayer() !== "A";
    if (sendB) sendB.disabled = spectator || ctx.getOnlineMyPlayer() !== "B";

    const infoA = document.getElementById("onlinePlayerInfoA");
    const infoB = document.getElementById("onlinePlayerInfoB");

    if (infoA) {
      infoA.innerHTML = `<div>${playerA.profileName || "ゲスト"}</div>`;
    }

    if (infoB) {
      infoB.innerHTML = `<div>${playerB.profileName || "ゲスト"}</div>`;
    }

    const chatADiv = document.getElementById("onlineChatA");
    const chatBDiv = document.getElementById("onlineChatB");

    if (chatADiv) {
      chatADiv.textContent = `[PLAYER Aチャット] ${chatA}`;
    }

    if (chatBDiv) {
      chatBDiv.textContent = `[PLAYER Bチャット] ${chatB}`;
    }

    const peaceArea = document.getElementById("onlinePeaceStatusArea");
    if (peaceArea) {
      const peace = roomData.peace || {};
      if (peace.status === "requested") {
        peaceArea.textContent = `和平交渉中：PLAYER ${peace.requestedBy}`;
      } else if (peace.status === "accepted") {
        peaceArea.textContent = "和平成立";
      } else if (peace.status === "rejected") {
        peaceArea.textContent = "和平拒否";
      } else {
        peaceArea.textContent = "";
      }
    }

    renderSpectatorControlArea(roomData);

    const peaceBox = document.getElementById("onlinePeaceSurrenderBox");
    if (peaceBox) {
      peaceBox.style.display = spectator ? "none" : "flex";
    }
  }

  async function requestOnlinePeace() {
    if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId()) return;

    if (isSpectator()) {
      ctx.showPopup("観戦中は和平交渉できません");
      return;
    }

    const ok = confirm("和平交渉しますか？");
    if (!ok) return;

    const myPlayer = ctx.getOnlineMyPlayer();

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      "peace/requestedBy": myPlayer,
      "peace/status": "requested",
      "peace/updatedAt": Date.now(),
      "meta/notice": `PLAYER ${myPlayer} が和平交渉を申し込みました`,
      "meta/updatedAt": Date.now()
    });

    ctx.showPopup("相手に和平交渉中です");
  }

  async function respondOnlinePeace(accept) {
    if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId()) return;

    if (isSpectator()) {
      ctx.showPopup("観戦中は和平に応答できません");
      return;
    }

    if (accept) {
      await ctx.updateRoom(ctx.getOnlineRoomId(), {
        "peace/status": "accepted",
        "peace/updatedAt": Date.now(),
        "meta/status": "peace",
        "meta/result": {
          type: "peace",
          reason: "peace",
          finishedAt: Date.now()
        },
        "meta/notice": "和平成立しました",
        "meta/updatedAt": Date.now()
      });

      ctx.setOnlineBattleFinished(true);
      showOnlinePeaceFinishedPopup();
      return;
    }

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      "peace/status": "rejected",
      "peace/updatedAt": Date.now(),
      "meta/notice": `PLAYER ${ctx.getOnlineMyPlayer()} が和平を拒否しました`,
      "meta/updatedAt": Date.now()
    });

    ctx.showPopup("和平を拒否しました");
  }

  function showOnlinePeaceRequestPopup() {
    if (isSpectator()) return;

    const popup = document.getElementById("popup");
    if (!popup) return;

    popup.innerHTML = "";

    const msg = document.createElement("div");
    msg.innerHTML = `
      <div>和平交渉が来ました。</div>
      <div>和平するとこの戦闘の戦績はなかったことになります。</div>
    `;

    const yes = document.createElement("button");
    yes.textContent = "和平する";
    yes.addEventListener("click", () => {
      popup.style.display = "none";
      respondOnlinePeace(true);
    });

    const no = document.createElement("button");
    no.textContent = "和平しない";
    no.addEventListener("click", () => {
      popup.style.display = "none";
      respondOnlinePeace(false);
    });

    popup.appendChild(msg);
    popup.appendChild(yes);
    popup.appendChild(no);
    popup.style.display = "block";
  }

  function showOnlinePeaceFinishedPopup() {
    const popup = document.getElementById("popup");
    if (!popup) return;

    popup.innerHTML = "";

    const msg = document.createElement("div");
    msg.textContent = "和平成立した！";

    const btn = document.createElement("button");
    btn.textContent = "タイトルにもどる";
    btn.addEventListener("click", () => {
      popup.style.display = "none";
      popup.innerHTML = "";
      ctx.cleanupOnlineBattleUi();
      ctx.resetOnlineStateForLocalBattle();
      ctx.resetLocalSelectionAndBattleState();
      ctx.showScreen("title");
    });

    popup.appendChild(msg);
    popup.appendChild(btn);
    popup.style.display = "block";
  }

  async function requestOnlineSurrender() {
    if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId() || !ctx.getOnlineMyPlayer()) return;

    if (isSpectator()) {
      ctx.showPopup("観戦中は降伏できません");
      return;
    }

    const ok = confirm("降伏しますか？");
    if (!ok) return;

    const loser = ctx.getOnlineMyPlayer();
    const winner = loser === "A" ? "B" : "A";

    await ctx.updateRoom(ctx.getOnlineRoomId(), {
      "meta/status": "finished",
      "meta/result": {
        type: "surrender",
        winner,
        loser,
        reason: "surrender",
        finishedAt: Date.now()
      },
      "meta/notice": `PLAYER ${loser} が降伏しました`,
      "meta/updatedAt": Date.now()
    });

    ctx.finishBattle(winner);
  }

  function applyOnlineMetaResult(roomData) {
    const result = roomData?.meta?.result;
    if (!result) return;

    if (result.type === "peace") {
      if (ctx.getOnlineBattleFinished()) return;
      ctx.setOnlineBattleFinished(true);
      showOnlinePeaceFinishedPopup();
      return;
    }

    if (result.type === "surrender" || result.type === "leave") {
      if (ctx.getOnlineBattleFinished()) return;
      ctx.finishBattle(result.winner);
    }
  }

function renderSpectatorControlArea(roomData) {
    const area = document.getElementById("onlineSpectatorControlArea");
    if (!area) return;

    if (isSpectator()) {
      const count = Object.values(roomData?.spectators || {})
        .filter(s => s && !s.left && !s.kicked).length;

      area.textContent = `観戦者：${count}人`;
      return;
    }

    const myPlayer = ctx.getOnlineMyPlayer();
    if (myPlayer !== "A" && myPlayer !== "B") {
      area.textContent = "";
      return;
    }

    const policy = roomData?.spectatorSettings?.policy || "allow";
    const spectators = Object.entries(roomData?.spectators || {})
      .filter(([, data]) => data && !data.left && !data.kicked);

    area.innerHTML = "";

    const policyBtn = document.createElement("button");
    policyBtn.textContent = policy === "deny" ? "観戦許可にする" : "観戦お断りにする";
    policyBtn.style.marginRight = "6px";
    policyBtn.addEventListener("click", () => {
      const nextPolicy = policy === "deny" ? "allow" : "deny";

      ctx.updateRoom(ctx.getOnlineRoomId(), {
        "spectatorSettings/policy": nextPolicy,
        "spectatorSettings/updatedAt": Date.now(),
        "meta/updatedAt": Date.now()
      });
    });

    const title = document.createElement("span");
    title.textContent = `観戦者：${spectators.length}人 `;

    area.appendChild(title);
    area.appendChild(policyBtn);

    spectators.forEach(([spectatorId, data]) => {
      const row = document.createElement("div");
      row.style.marginTop = "4px";

      const name = document.createElement("span");
      name.textContent = `(${data.name || "観戦者"}) `;

      const kickBtn = document.createElement("button");
      kickBtn.textContent = "キック";
      kickBtn.addEventListener("click", () => {
        ctx.updateRoom(ctx.getOnlineRoomId(), {
          [`spectators/${spectatorId}/kicked`]: true,
          [`spectators/${spectatorId}/left`]: true,
          [`spectators/${spectatorId}/lastSeen`]: Date.now(),
          "meta/updatedAt": Date.now()
        });
      });

      row.appendChild(name);
      row.appendChild(kickBtn);
      area.appendChild(row);
    });
  }

  function applyOnlinePeaceRequest(roomData) {
    if (isSpectator()) return;

    const peace = roomData?.peace;
    if (!peace) return;
    if (peace.status !== "requested") return;
    if (!peace.requestedBy) return;
    if (peace.requestedBy === ctx.getOnlineMyPlayer()) return;

    const popup = document.getElementById("popup");
    if (popup && popup.style.display === "block") return;

    showOnlinePeaceRequestPopup();
  }

  async function markOnlinePlayerLeft() {
    if (ctx.getOnlineBattleFinished()) return;
    if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId() || !ctx.getOnlineMyPlayer()) return;
    if (isSpectator()) return;

    const leaver = ctx.getOnlineMyPlayer();
    const winner = leaver === "A" ? "B" : "A";

    try {
      await ctx.updateRoom(ctx.getOnlineRoomId(), {
        [`players/${leaver}/left`]: true,
        [`players/${leaver}/lastSeen`]: Date.now(),
        "meta/status": "finished",
        "meta/result": {
          type: "leave",
          winner,
          loser: leaver,
          reason: "leave",
          finishedAt: Date.now()
        },
        "meta/notice": `PLAYER ${leaver} が退室しました`,
        "meta/updatedAt": Date.now()
      });
    } catch (error) {
      console.error(error);
    }
  }

  function bindBeforeUnloadLeaveHandler() {
    window.addEventListener("beforeunload", () => {
      if (ctx.getOnlineBattleFinished()) return;
      if (!ctx.getOnlineBattleStarted()) return;
      if (!ctx.isOnlineEnabled() || !ctx.getOnlineRoomId() || !ctx.getOnlineMyPlayer()) return;
      if (isSpectator()) return;

      const leaver = ctx.getOnlineMyPlayer();
      const winner = leaver === "A" ? "B" : "A";

      ctx.updateRoom(ctx.getOnlineRoomId(), {
        [`players/${leaver}/left`]: true,
        [`players/${leaver}/lastSeen`]: Date.now(),
        "meta/status": "finished",
        "meta/result": {
          type: "leave",
          winner,
          loser: leaver,
          reason: "leave",
          finishedAt: Date.now()
        },
        "meta/notice": `PLAYER ${leaver} が退室しました`,
        "meta/updatedAt": Date.now()
      });
    });
  }

  return {
    ensureOnlineBattleExtraUi,
    ensureOnlineBattleRoomIdHeader,
    ensureOnlineTopPlayerHud,
    ensureOnlineCenterButtons,
    sendOnlineChat,
    renderOnlineExtraUi,
    requestOnlinePeace,
    respondOnlinePeace,
    showOnlinePeaceRequestPopup,
    showOnlinePeaceFinishedPopup,
    requestOnlineSurrender,
    applyOnlineMetaResult,
    applyOnlinePeaceRequest,
    bindBeforeUnloadLeaveHandler,
    markOnlinePlayerLeft
  };
}
