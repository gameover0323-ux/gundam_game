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

    wrap.  function takeHit(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackTakeHit(i);
    ctx.checkBattleEnd();

    ctx.publishOnlineQteAction("hit", i);

    return result;
  }

  function evadeAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackEvadeAttack(i);

    ctx.publishOnlineQteAction("evade", i);

    return result;
  }

  function supportDefenseAttack(i) {
    if (!canOperateQteDefender()) {
      ctx.showPopup("防御側プレイヤーのみ操作できます");
      return;
    }

    const result = ctx.attackSupportDefenseAttack(i);
    ctx.checkBattleEnd();

    ctx.publishOnlineQteAction("supportDefense", i);

    return result;
  }

  function finishCurrentAttackResolution() {
    return ctx.finishCurrentAttackResolutionRaw();
  }

  return {
    canOperateQteDefender,
    renderAttackChoices,
    takeHit,
    evadeAttack,
    supportDefenseAttack,
    finishCurrentAttackResolution
  };
}
