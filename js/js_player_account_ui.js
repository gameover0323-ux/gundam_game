import { saveCurrentPlayerProfile } from "./js_player_profile.js";

const TERM_DICTIONARY_ENABLED_KEY = "gbs_term_dictionary_enabled";

async function sha256(text) {
  const data = new TextEncoder().encode(String(text));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map(v => v.toString(16).padStart(2, "0"))
    .join("");
}

function isHalfWidthAlnum(value) {
  return /^[A-Za-z0-9]+$/.test(String(value || ""));
}

function isTermDictionaryEnabled() {
  return localStorage.getItem(TERM_DICTIONARY_ENABLED_KEY) !== "false";
}

function setTermDictionaryEnabled(enabled) {
  localStorage.setItem(TERM_DICTIONARY_ENABLED_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("gbs:termDictionarySettingChanged"));
}

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
  const trophies = profile?.equippedTrophies?.byUnit?.[unitId] || [];
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

      const settingsBtn = document.getElementById("playerSettingsBtn");
      if (settingsBtn) settingsBtn.style.display = "none";

      const accountListBtn = document.getElementById("accountListBtn");
      if (accountListBtn) accountListBtn.style.display = "none";

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

    ensureSettingsButton();
    ensureAccountListButton();
  }

  function ensureSettingsButton() {
    const statsBtn = document.getElementById("playerStatsBtn");
    if (!statsBtn) return null;

    let btn = document.getElementById("playerSettingsBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "playerSettingsBtn";
      btn.type = "button";
      btn.textContent = "設定";
      statsBtn.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", renderSettingsPanel);
    }

    btn.style.display = ctx.getPlayerProfile() ? "" : "none";
    return btn;
  }

  function ensureAccountListButton() {
    const settingsBtn = ensureSettingsButton();
    const statsBtn = document.getElementById("playerStatsBtn");
    const baseBtn = settingsBtn || statsBtn;
    if (!baseBtn) return null;

    let btn = document.getElementById("accountListBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "accountListBtn";
      btn.textContent = "アカウントリスト";
      baseBtn.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", ctx.renderAccountListPanel);
    }

    const role = ctx.getPlayerProfile()?.role;
    btn.style.display =
      role === "debug" || role === "Ciel_debugger" || role === "account_viewer"
        ? ""
        : "none";

    return btn;
  }

  function closeSettingsPanel() {
    const panel = document.getElementById("playerSettingsPanel");
    if (panel) panel.remove();
  }

  function renderSettingsPanel() {
    closeSettingsPanel();

    const profile = ctx.getPlayerProfile();
    if (!profile) {
      ctx.showPopup("ログイン中のみ設定できます");
      return;
    }

    const panel = document.createElement("div");
    panel.id = "playerSettingsPanel";
    panel.style.position = "fixed";
    panel.style.inset = "0";
    panel.style.zIndex = "10000";
    panel.style.background = "rgba(0,0,0,0.86)";
    panel.style.color = "white";
    panel.style.padding = "16px";
    panel.style.overflowY = "auto";

    panel.innerHTML = `
      <div style="max-width:520px;margin:0 auto;border:1px solid white;border-radius:10px;padding:14px;background:#050505;text-align:center;">
        <h2>プレイヤー設定</h2>

        <div style="border-top:1px solid #777;margin-top:12px;padding-top:12px;">
          <h3>用語辞典</h3>
          <button id="termDictionaryToggleBtn" type="button"></button>
        </div>

        <div style="border-top:1px solid #777;margin-top:12px;padding-top:12px;">
          <h3>パスワード変更</h3>
          <button id="changePasswordBtn" type="button">パスワード変更</button>
        </div>

        <div style="margin-top:16px;">
          <button id="playerSettingsCloseBtn" type="button">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    const toggleBtn = panel.querySelector("#termDictionaryToggleBtn");

    function refreshToggle() {
      toggleBtn.textContent = isTermDictionaryEnabled()
        ? "用語辞典：ON"
        : "用語辞典：OFF";
    }

    toggleBtn.addEventListener("click", () => {
      setTermDictionaryEnabled(!isTermDictionaryEnabled());
      refreshToggle();
    });

    panel.querySelector("#changePasswordBtn").addEventListener("click", handleChangePassword);
    panel.querySelector("#playerSettingsCloseBtn").addEventListener("click", closeSettingsPanel);

    panel.addEventListener("click", event => {
      if (event.target === panel) closeSettingsPanel();
    });

    refreshToggle();
  }

  async function handleChangePassword() {
    const profile = ctx.getPlayerProfile();
    if (!profile) {
      ctx.showPopup("ログイン中のみ変更できます");
      return;
    }

    const currentPassword = prompt("現在のパスワードを入力してください");
    if (!currentPassword) return;

    if (!isHalfWidthAlnum(currentPassword.trim())) {
      ctx.showPopup("パスワードは半角英数字のみです");
      return;
    }

    const currentHash = await sha256(currentPassword.trim());
    if (currentHash !== profile.passwordHash) {
      ctx.showPopup("現在のパスワードが違います");
      return;
    }

    const nextPassword = prompt("新しいパスワードを入力してください");
    if (!nextPassword) return;

    if (!isHalfWidthAlnum(nextPassword.trim())) {
      ctx.showPopup("新しいパスワードは半角英数字のみです");
      return;
    }

    const confirmPassword = prompt("確認のため、新しいパスワードをもう一度入力してください");
    if (!confirmPassword) return;

    if (nextPassword.trim() !== confirmPassword.trim()) {
      ctx.showPopup("新しいパスワードが一致しません");
      return;
    }

    profile.passwordHash = await sha256(nextPassword.trim());

    const result = await saveCurrentPlayerProfile();
    if (!result.ok) {
      ctx.showPopup("パスワード変更に失敗しました");
      return;
    }

    ctx.showPopup("パスワードを変更しました");
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
    closeSettingsPanel();
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
    ensureSettingsButton,
    renderSettingsPanel,
    handleLogin,
    handleRegister,
    handleLogout
  };
}
