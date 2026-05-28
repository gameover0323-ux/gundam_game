export function createPlayerStatsUi(ctx) {
  function formatWinLose(record) {
    const win = record?.win || 0;
    const lose = record?.lose || 0;
    const total = win + lose;
    const rate = total > 0 ? Math.round((win / total) * 100) : 0;
    return `Win ${win} Lose ${lose} 勝率${rate}%`;
  }

  function renderDefeatedList(defeated = {}) {
    const entries = Object.entries(defeated);

    if (entries.length === 0) {
      return `<div class="player-stats-line">記録なし</div>`;
    }

    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([unitId, count]) => {
        return `
          <div class="player-stats-line">
            ${ctx.getUnitNameById(unitId)}：${count}撃破
          </div>
        `;
      })
      .join("");
  }

  function renderVsList(vs = {}) {
    const entries = Object.entries(vs);

    if (entries.length === 0) {
      return `<div class="player-stats-line">記録なし</div>`;
    }

    return entries
      .map(([unitId, record]) => {
        return `<div class="player-stats-line">vs ${ctx.getUnitNameById(unitId)}：${formatWinLose(record)}</div>`;
      })
      .join("");
  }

  function renderEncounteredPlayerList(encounteredPlayers = {}) {
    const entries = Object.entries(encounteredPlayers);

    if (entries.length === 0) {
      return `<div class="player-stats-line">記録なし</div>`;
    }

    return entries
      .sort((a, b) => {
        const aTime = new Date(a[1]?.lastMatchedAt || 0).getTime();
        const bTime = new Date(b[1]?.lastMatchedAt || 0).getTime();
        return bTime - aTime;
      })
      .map(([profileId, data]) => {
        const titles = Array.isArray(data.equippedTitles) && data.equippedTitles.length > 0
          ? data.equippedTitles.map(id => `[${ctx.getTitleName(id)}]`).join("")
          : "称号なし";

        return `
          <button class="encountered-player-btn" data-profile-id="${profileId}">
            ${titles}<br>
            ${data.profileName || profileId}<br>
            対戦回数：${data.count || 1}
          </button>
        `;
      })
      .join("");
  }

  function showEncounteredPlayerCard(profileId) {
    const profile = ctx.getPlayerProfile();
    const data = profile?.encounteredPlayers?.[profileId];
    if (!data) return;

    const titles = Array.isArray(data.equippedTitles) && data.equippedTitles.length > 0
      ? data.equippedTitles.map(id => `[${ctx.getTitleName(id)}]`).join("")
      : "称号なし";

    ctx.showPopup(
      `プレイヤーカード<br>` +
      `ID：${data.profileId}<br>` +
      `名前：${data.profileName || data.profileId}<br>` +
      `称号：${titles}<br>` +
      `対戦回数：${data.count || 1}<br>` +
      `最終遭遇：${data.lastMatchedAt || "不明"}`
    );
  }

  async function refreshPlayerAchievementsNow() {
    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    const result = ctx.updatePlayerAchievements(profile);

    if (result?.changed) {
      await ctx.saveCurrentPlayerProfile();
    }

    ctx.updatePlayerCardUi();
  }

  async function renderPlayerStatsPanel() {
    await refreshPlayerAchievementsNow();

    const panel = document.getElementById("playerStatsPanel");
    const content = document.getElementById("playerStatsContent");

    if (!panel || !content) return;

    const profile = ctx.getPlayerProfile();
    if (!profile) {
      ctx.showPopup("ログインしていません");
      return;
    }

    const stats = profile.stats || {};
    const unitsStats = stats.units || {};
    const defeated = stats.defeated || {};

    const unitSections = Object.entries(unitsStats).map(([unitId, unitStats]) => {
      return `
        <details>
          <summary>
            ${ctx.getUnitNameById(unitId)}
            ${ctx.getUnitTrophyText(profile, unitId)}
            使用回数 ${unitStats.used || 0}
          </summary>

          <div class="player-stats-line">総合：${formatWinLose(unitStats.total)}</div>
          <div class="player-stats-line">オフライン：${formatWinLose(unitStats.offline)}</div>
          <div class="player-stats-line">オンライン：${formatWinLose(unitStats.online)}</div>
          <div class="player-stats-line">CPU：${formatWinLose(unitStats.cpu?.total)}</div>

          <details>
            <summary>CPU個別戦績</summary>
            ${renderVsList(unitStats.cpu?.vs)}
          </details>

          <details>
            <summary>オフライン対プレイアブル戦績</summary>
            ${renderVsList(unitStats.vsPlayable)}
          </details>

          <details>
            <summary>オンライン対プレイヤーID戦績</summary>
            ${renderVsList(unitStats.vsOnlinePlayer)}
          </details>

          <details>
            <summary>2v2戦績</summary>
            <div class="player-stats-line">通常2v2：${formatWinLose(unitStats.twoVtwo?.offline?.total)}</div>
            ${renderDefeatedList(unitStats.twoVtwo?.offline?.defeated)}

            <div class="player-stats-line">CPU2v2：${formatWinLose(unitStats.twoVtwo?.cpu?.total)}</div>
            ${renderDefeatedList(unitStats.twoVtwo?.cpu?.defeated)}

            <div class="player-stats-line">オンライン2v2：${formatWinLose(unitStats.twoVtwo?.online?.total)}</div>
            ${renderDefeatedList(unitStats.twoVtwo?.online?.defeated)}
          </details>
        </details>
      `;
    }).join("");

    content.innerHTML = `
      <div class="player-stats-line">ID：${profile.id}</div>
      <div class="player-stats-line">名前：${profile.name}</div>
      <div class="player-stats-line">登録日：${profile.registeredAt}</div>

      <details open>
        <summary>機体別使用戦績</summary>
        ${unitSections || `<div class="player-stats-line">まだ戦績がありません</div>`}
      </details>

      <details>
        <summary>総合CPU撃破数</summary>
        ${renderDefeatedList(defeated.cpu)}
      </details>

      <details>
        <summary>総合プレイアブル撃破数</summary>
        ${renderDefeatedList(defeated.playable)}
      </details>

      <details>
        <summary>総合ボス撃破数</summary>
        ${renderDefeatedList(defeated.boss)}
      </details>

      <details>
        <summary>総合オンライン撃破数</summary>
        ${renderDefeatedList(defeated.onlinePlayer)}
      </details>

      <details>
        <summary>出会ったプレイヤー一覧</summary>
        ${renderEncounteredPlayerList(profile.encounteredPlayers)}
      </details>

      <button id="openTitleCustomizeBtn">プレイヤーカスタム・通知設定</button>
    `;

    document.getElementById("openTitleCustomizeBtn")?.addEventListener("click", renderTitleCustomizePanel);

    content.querySelectorAll(".encountered-player-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const profileId = btn.dataset.profileId;
        if (!profileId) return;
        showEncounteredPlayerCard(profileId);
      });
    });

    panel.style.display = "";
  }

  function getUnlockedTitleMap(profile) {
    return profile?.titles?.unlocked || {};
  }

  function renderTitleButtons(titleIds, profile, { hideLocked = false, clickable = true } = {}) {
    const unlocked = getUnlockedTitleMap(profile);

    return titleIds.map(titleId => {
      const isUnlocked = !!unlocked[titleId];
      if (hideLocked && !isUnlocked) return "";

      const label = isUnlocked ? ctx.getTitleName(titleId) : "？？？";
      const disabled = clickable && isUnlocked ? "" : "disabled";

      return `
        <button class="title-chip" data-title-id="${titleId}" ${disabled}>
          [${label}]
        </button>
      `;
    }).join("");
  }

  async function savePlayerCustomizeState() {
    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    try {
      await ctx.saveCurrentPlayerProfile();
      ctx.updatePlayerCardUi();
    } catch (error) {
      console.error(error);
      ctx.showPopup("保存に失敗しました");
    }
  }

  function getUnlockedBossTrophiesForUnit(profile, unitId) {
    const vs = profile?.stats?.units?.[unitId]?.cpu?.vs || {};

    return ctx.getBossTrophyRules()
      .filter(rule => Number(vs?.[rule.bossId]?.win || 0) >= Number(rule.unlockAt || 1))
      .map(rule => rule.trophyId);
  }

  function sanitizeEquippedBossTrophies(profile) {
    if (!profile?.trophies?.byUnit) return false;

    let changed = false;

    Object.keys(profile.trophies.byUnit).forEach(unitId => {
      const unlocked = getUnlockedBossTrophiesForUnit(profile, unitId);
      const current = profile.trophies.byUnit[unitId] || [];
      const filtered = current.filter(trophyId => unlocked.includes(trophyId));

      if (filtered.length !== current.length) {
        profile.trophies.byUnit[unitId] = filtered;
        changed = true;
      }
    });

    return changed;
  }

  function getBossTrophyLabel(trophyId) {
    const rule = ctx.getBossTrophyRules().find(rule => rule.trophyId === trophyId);
    return rule?.label || trophyId;
  }

  async function renderTitleCustomizePanel() {
    await refreshPlayerAchievementsNow();

    const profile = ctx.getPlayerProfile();
    if (!profile) {
      ctx.showPopup("ログインしていません");
      return;
    }

    const panel = document.getElementById("playerStatsPanel");
    const content = document.getElementById("playerStatsContent");
    if (!panel || !content) return;

    const unlocked = Object.keys(getUnlockedTitleMap(profile));
    const equipped = Array.isArray(profile.equippedTitles)
      ? profile.equippedTitles
      : [];

    content.innerHTML = `
      <h3>称号カスタム</h3>
      <div class="player-stats-line">装備中：最大10個</div>

      <div class="title-equipped-area">
        ${equipped.length
          ? equipped.map(id => `
              <button class="title-chip equipped-title" data-title-id="${id}">
                [${ctx.getTitleName(id)}] ✕
              </button>
            `).join("")
          : `<div class="player-stats-line">称号なし</div>`
        }
      </div>

      <h4>取得済み称号</h4>
      <div class="title-list-area">
        ${unlocked.map(id => `
          <button class="title-chip owned-title" data-title-id="${id}">
            [${ctx.getTitleName(id)}]
          </button>
        `).join("")}
      </div>

      <hr>

      <div>
        <h3>ランダムマッチ募集通知</h3>
        <div style="font-size:13px; margin-bottom:6px;">
          誰かがランダムマッチを募集した時に通知する場面を選びます。
        </div>

        <label style="display:block;">
          <input type="checkbox" id="notifyRandomMatchTitle">
          タイトル画面
        </label>

        <label style="display:block;">
          <input type="checkbox" id="notifyRandomMatchVsCpu">
          vsCPU中
        </label>

        <label style="display:block;">
          <input type="checkbox" id="notifyRandomMatchVsBoss">
          vsボス中
        </label>
      </div>

      <hr>

      <div>
        <h3>プレイヤーカード設定</h3>
        <div>一言コメント（最大20文字・10文字で自動改行）</div>
        <input id="playerCommentInput" maxlength="20">
        <button id="savePlayerCommentBtn">コメント保存</button>

        <div style="margin-top:8px;">お気に入り機体（最大3機）</div>
        <div id="favoriteUnitCustomizeArea"></div>
      </div>

      <button id="openTitleListBtn">称号一覧</button>
      <button id="openTrophyCustomizeBtn">トロフィーカスタム</button>
      <button id="backToStatsBtn">戦績に戻る</button>
    `;

    const notify = profile.randomMatchNotify || {
      title: false,
      vsCpu: false,
      vsBoss: false
    };

    const notifyTitle = document.getElementById("notifyRandomMatchTitle");
    const notifyVsCpu = document.getElementById("notifyRandomMatchVsCpu");
    const notifyVsBoss = document.getElementById("notifyRandomMatchVsBoss");

    if (notifyTitle) notifyTitle.checked = notify.title === true;
    if (notifyVsCpu) notifyVsCpu.checked = notify.vsCpu === true;
    if (notifyVsBoss) notifyVsBoss.checked = notify.vsBoss === true;

    [notifyTitle, notifyVsCpu, notifyVsBoss].forEach(input => {
      input?.addEventListener("change", async () => {
        profile.randomMatchNotify = {
          title: notifyTitle?.checked === true,
          vsCpu: notifyVsCpu?.checked === true,
          vsBoss: notifyVsBoss?.checked === true
        };

        await savePlayerCustomizeState();
      });
    });

    const commentInput = document.getElementById("playerCommentInput");
    if (commentInput) {
      commentInput.value = String(profile.comment || "").replace(/\s+/g, "").slice(0, 20);
    }

    document.getElementById("savePlayerCommentBtn")?.addEventListener("click", async () => {
      profile.comment = String(commentInput?.value || "")
        .replace(/\s+/g, "")
        .slice(0, 20);

      await savePlayerCustomizeState();
      renderTitleCustomizePanel();
    });

    const favoriteArea = document.getElementById("favoriteUnitCustomizeArea");
    if (favoriteArea) {
      const selected = ctx.getFavoriteUnitIds(profile);

      favoriteArea.innerHTML = ctx.getUnitList().map(unit => {
        const checked = selected.includes(unit.id) ? "checked" : "";
        return `
          <label style="display:block;">
            <input type="checkbox" class="favorite-unit-check" value="${unit.id}" ${checked}>
            ${unit.name}${ctx.getUnitTrophyText(profile, unit.id)}
          </label>
        `;
      }).join("");

      favoriteArea.querySelectorAll(".favorite-unit-check").forEach(check => {
        check.addEventListener("change", async () => {
          const ids = Array.from(favoriteArea.querySelectorAll(".favorite-unit-check:checked"))
            .map(input => input.value)
            .slice(0, 3);

          profile.favoriteUnitIds = ids;

          favoriteArea.querySelectorAll(".favorite-unit-check").forEach(input => {
            input.checked = ids.includes(input.value);
          });

          await savePlayerCustomizeState();
          ctx.updatePlayerCardUi();
        });
      });
    }

    content.querySelectorAll(".owned-title").forEach(btn => {
      btn.addEventListener("click", async () => {
        const titleId = btn.dataset.titleId;
        if (!titleId) return;

        if (!profile.equippedTitles) profile.equippedTitles = [];

        if (profile.equippedTitles.includes(titleId)) {
          return;
        }

        if (profile.equippedTitles.length >= 10) {
          ctx.showPopup("装備できる称号は10個までです");
          return;
        }

        profile.equippedTitles.push(titleId);

        await savePlayerCustomizeState();
        renderTitleCustomizePanel();
      });
    });

    content.querySelectorAll(".equipped-title").forEach(btn => {
      btn.addEventListener("click", async () => {
        const titleId = btn.dataset.titleId;

        profile.equippedTitles = profile.equippedTitles.filter(id => id !== titleId);

        await savePlayerCustomizeState();
        renderTitleCustomizePanel();
      });
    });

    document.getElementById("openTitleListBtn")?.addEventListener("click", renderTitleListPanel);
    document.getElementById("openTrophyCustomizeBtn")?.addEventListener("click", renderTrophyCustomizePanel);
    document.getElementById("backToStatsBtn")?.addEventListener("click", renderPlayerStatsPanel);

    ctx.updatePlayerCardUi();
    panel.style.display = "";
  }

  async function renderTitleListPanel() {
    await refreshPlayerAchievementsNow();

    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    const panel = document.getElementById("playerStatsPanel");
    const content = document.getElementById("playerStatsContent");
    if (!panel || !content) return;

    content.innerHTML = `
      <h3>称号一覧</h3>

      ${ctx.getTitleGroups().map(group => `
        <details>
          <summary>${group.label}</summary>
          <div class="title-list-area">
            ${renderTitleButtons(group.titleIds, profile, { clickable: true })}
          </div>
        </details>
      `).join("")}

      <button id="backToTitleCustomizeBtn">称号カスタムに戻る</button>
    `;

    content.querySelectorAll(".title-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const titleId = btn.dataset.titleId;
        if (!titleId) return;

        const unlocked = getUnlockedTitleMap(profile);
        if (!unlocked[titleId]) return;

        ctx.showPopup(ctx.getTitleConditionText(titleId));
      });
    });

    document.getElementById("backToTitleCustomizeBtn")?.addEventListener("click", renderTitleCustomizePanel);

    panel.style.display = "";
  }

  function renderTrophyCustomizePanel() {
    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    const panel = document.getElementById("playerStatsPanel");
    const content = document.getElementById("playerStatsContent");
    if (!panel || !content) return;

    if (sanitizeEquippedBossTrophies(profile)) {
      savePlayerCustomizeState();
    }

    const unitStats = profile.stats?.units || {};

    const unitSections = Object.keys(unitStats)
      .map(unitId => {
        const unlockedTrophies = getUnlockedBossTrophiesForUnit(profile, unitId);
        const equippedTrophies = profile.trophies?.byUnit?.[unitId] || [];

        if (unlockedTrophies.length === 0) {
          return "";
        }

        return `
          <details>
            <summary>${ctx.getUnitNameById(unitId)} ${equippedTrophies.join("")}</summary>
            <div class="trophy-button-area">
              ${unlockedTrophies.map(trophyId => {
                const owned = equippedTrophies.includes(trophyId);
                return `
                  <button class="trophy-toggle-btn" data-unit-id="${unitId}" data-trophy-id="${trophyId}">
                    ${owned ? `[${getBossTrophyLabel(trophyId)}] ON` : `[${getBossTrophyLabel(trophyId)}] OFF`}
                  </button>
                `;
              }).join("")}

              <button class="trophy-clear-btn" data-unit-id="${unitId}">
                全部外す
              </button>
            </div>
          </details>
        `;
      })
      .join("");

    content.innerHTML = `
      <h3>トロフィーカスタム</h3>
      <div class="player-stats-line">実際にその機体で撃破したボスのトロフィーだけ装備できます</div>

      ${unitSections || `<div class="player-stats-line">装備可能なボストロフィーがありません</div>`}

      <button id="backToTitleCustomizeBtn">称号カスタムに戻る</button>
    `;

    content.querySelectorAll(".trophy-toggle-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const unitId = btn.dataset.unitId;
        const trophyId = btn.dataset.trophyId;

        if (!unitId || !trophyId) return;

        const unlockedTrophies = getUnlockedBossTrophiesForUnit(profile, unitId);
        if (!unlockedTrophies.includes(trophyId)) {
          ctx.showPopup("この機体ではまだ装備できないトロフィーです");
          return;
        }

        if (!profile.trophies) profile.trophies = {};
        if (!profile.trophies.byUnit) profile.trophies.byUnit = {};
        if (!profile.trophies.byUnit[unitId]) profile.trophies.byUnit[unitId] = [];

        const trophies = profile.trophies.byUnit[unitId];

        if (trophies.includes(trophyId)) {
          profile.trophies.byUnit[unitId] = trophies.filter(id => id !== trophyId);
        } else {
          trophies.push(trophyId);
        }

        await savePlayerCustomizeState();
        renderTrophyCustomizePanel();
      });
    });

    content.querySelectorAll(".trophy-clear-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const unitId = btn.dataset.unitId;
        if (!unitId) return;

        if (!profile.trophies) profile.trophies = {};
        if (!profile.trophies.byUnit) profile.trophies.byUnit = {};

        profile.trophies.byUnit[unitId] = [];

        await savePlayerCustomizeState();
        renderTrophyCustomizePanel();
      });
    });

    document.getElementById("backToTitleCustomizeBtn")?.addEventListener("click", renderTitleCustomizePanel);

    panel.style.display = "";
  }

  async function renderAccountListPanel() {
    const panel = document.getElementById("playerStatsPanel");
    const content = document.getElementById("playerStatsContent");
    if (!panel || !content) return;

    const result = await ctx.readAccountListForViewer();
    if (!result.ok) {
      ctx.showPopup(result.message);
      return;
    }

    const rows = result.list.map(profile => `
      <tr>
        <td>${profile.id}</td>
        <td>${profile.name}</td>
        <td>${profile.role}</td>
        <td>${profile.registeredAt}</td>
        <td>${profile.usedTotal}</td>
        <td>${profile.favoriteUnitId || "-"}</td>
        <td>${profile.comment || ""}</td>
      </tr>
    `).join("");

    content.innerHTML = `
      <h3>アカウントリスト</h3>
      <div class="player-stats-line">登録数：${result.list.length}</div>
      <table class="account-list-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>権限</th>
            <th>登録日</th>
            <th>使用回数</th>
            <th>お気に入り</th>
            <th>コメント</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="7">登録アカウントなし</td></tr>`}
        </tbody>
      </table>
    <button id="openFeedbackViewerBtn">意見・要望一覧</button>
      <button id="backToStatsFromAccountListBtn">戦績に戻る</button>
    `;

    document.getElementById("openFeedbackViewerBtn")
      ?.addEventListener("click", () => {
        if (ctx.renderFeedbackViewer) {
          ctx.renderFeedbackViewer();
        }
      });

    document.getElementById("backToStatsFromAccountListBtn")
      ?.addEventListener("click", renderPlayerStatsPanel);

    panel.style.display = "";
  }

  return {
    renderPlayerStatsPanel,
    renderTitleCustomizePanel,
    renderTitleListPanel,
    renderTrophyCustomizePanel,
    renderAccountListPanel,
    refreshPlayerAchievementsNow
  };
}
