export function createPlayerAccountUi(ctx) {
  function formatPlayerComment(text) {
    const raw = String(text || "")
      .replace(/\s+/g, "")
      .slice(0, 20);

    if (!raw) return "";

    const lines = [];
    for (let i = 0; i < raw.length; i += 10) {
      lines.push(raw.slice(i, i + 10));
    }
    return lines.join("<br>");
  }

  function getUnitTrophyText(profile, unitId) {
    const trophies = profile?.trophies?.byUnit?.[unitId] || [];
    if (!trophies.length) return "";
    return trophies.join("");
  }

  function getFavoriteUnitIds(profile) {
    if (Array.isArray(profile?.favoriteUnitIds)) {
      return profile.favoriteUnitIds.filter(Boolean).slice(0, 3);
    }

    if (profile?.favoriteUnitId) {
      return [profile.favoriteUnitId];
    }

    return [];
  }

  function updatePlayerCardUi() {
    const summary = document.getElementById("playerCardSummary");
    const loginBtn = document.getElementById("playerLoginBtn");
    const registerBtn = document.getElementById("playerRegisterBtn");
    const logoutBtn = document.getElementById("playerLogoutBtn");
    const statsBtn = document.getElementById("playerStatsBtn");

    if (!summary || !loginBtn || !registerBtn || !logoutBtn || !statsBtn) return;

    const profile = ctx.getPlayerProfile();

    if (!profile) {
      summary.innerHTML = "ゲスト参戦中<br>戦績は保存されません";
      loginBtn.style.display = "";
      registerBtn.style.display = "";
      logoutBtn.style.display = "none";
      statsBtn.style.display = "none";
      return;
    }

    const titleText = Array.isArray(profile.equippedTitles) && profile.equippedTitles.length > 0
      ? profile.equippedTitles
          .map(id => `[${ctx.getTitleName(id)}]`)
          .join("")
      : "称号なし";

    const favoriteUnitText = getFavoriteUnitIds(profile)
      .map(unitId => `${ctx.getUnitNameById(unitId)}${getUnitTrophyText(profile, unitId)}`)
      .join("<br>") || "未設定";

    const commentHtml = formatPlayerComment(profile.comment) || "未設定";

    summary.innerHTML = `
ID：${profile.id}<br>
名前：${profile.name}<br>
登録日：${profile.registeredAt}<br>
権限：${profile.role}<br>
一言：<br>${commentHtml}<br>
お気に入り機体：<br>${favoriteUnitText}<br>
称号：${titleText}
`;

    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "";
    statsBtn.style.display = "";
    ensureAccountListButton();
  }

  function ensureAccountListButton() {
    const statsBtn = document.getElementById("playerStatsBtn");
    if (!statsBtn) return null;

    let btn = document.getElementById("accountListBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "accountListBtn";
      btn.textContent = "アカウントリスト";
      statsBtn.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", ctx.renderAccountListPanel);
    }

    const role = ctx.getPlayerProfile()?.role;
    btn.style.display =
      role === "debug" || role === "Ciel_debugger" || role === "account_viewer"
        ? ""
        : "none";

    return btn;
  }

  async function handleLogin() {
    const id = prompt("プレイヤーIDを入力してください");
    if (!id) return;

    const password = prompt("パスワードを入力してください");
    if (!password) return;

    const result = await ctx.loginPlayer(id.trim(), password.trim());

    if (!result.ok) {
      ctx.showPopup(result.message || "ログインに失敗しました");
      return;
    }

    ctx.syncExtraUnlockedUnitsFromProfile();
    updatePlayerCardUi();
    ctx.updateDebugButtonVisibility();
    ctx.ensureRandomMatchUi();
    ctx.listenRandomMatchAnnouncementsOnceReady();
    ctx.showPopup("ログインしました");
  }

  async function handleRegister() {
    const id = prompt("登録するプレイヤーIDを半角英数字で入力してください");
    if (!id) return;

    const password = prompt("設定するパスワードを半角英数字で入力してください");
    if (!password) return;

    const name = prompt("プレイヤー名を入力してください") || id;

    const result = await ctx.registerPlayer({
      id: id.trim(),
      password: password.trim(),
      name: name.trim()
    });

    if (!result.ok) {
      ctx.showPopup(result.message || "登録に失敗しました");
      return;
    }

    ctx.syncExtraUnlockedUnitsFromProfile();
    updatePlayerCardUi();
    ctx.updateDebugButtonVisibility();
    ctx.ensureRandomMatchUi();
    ctx.listenRandomMatchAnnouncementsOnceReady();
    ctx.showPopup("プレイヤー登録しました");
  }

  function handleLogout() {
    ctx.logoutPlayer();
    ctx.clearExtraUnlockedUnits();
    ctx.setTestMode(false);
    updatePlayerCardUi();
    ctx.updateDebugButtonVisibility();
    ctx.showPopup("ログアウトしました");
  }

  return {
    formatPlayerComment,
    getUnitTrophyText,
    getFavoriteUnitIds,
    updatePlayerCardUi,
    ensureAccountListButton,
    handleLogin,
    handleRegister,
    handleLogout
  };
}
