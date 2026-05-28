export function createFeedbackForm(ctx) {
  function getProfileLabel() {
    const profile = ctx.getPlayerProfile();
    if (!profile) {
      return {
        playerId: null,
        playerName: "匿名",
        label: "ゲスト参戦中：匿名でも送信できます。登録するとプレイヤーID付きで送信できます。"
      };
    }

    return {
      playerId: profile.id || null,
      playerName: profile.name || profile.id || "名無し",
      label: `送信者：${profile.name || profile.id} / ID：${profile.id}`
    };
  }

  function openFeedbackForm() {
    const info = getProfileLabel();

    document.getElementById("title").innerHTML = `
      <h1>意見・要望フォーム</h1>
      <div class="titleModeBlock">
        <div style="margin-bottom:8px;">${info.label}</div>
        <textarea id="feedbackTextInput" style="width:90%;height:220px;" placeholder="意見・要望・不具合報告などを自由に書いてください"></textarea>
        <br><br>
        <button id="submitFeedbackBtn">送信</button>
        <button id="cancelFeedbackBtn">タイトルに戻る</button>
      </div>
    `;

    document.getElementById("submitFeedbackBtn").addEventListener("click", async () => {
      const text = String(document.getElementById("feedbackTextInput")?.value || "").trim();

      if (!text) {
        ctx.showPopup("内容を入力してください");
        return;
      }

      await ctx.submitFeedback({
        text,
        playerId: info.playerId,
        playerName: info.playerName,
        createdAt: Date.now(),
        status: "open"
      });

      document.getElementById("title").innerHTML = `
        <h1>ありがとうございました</h1>
        <div class="titleModeBlock">
          <p>送信しました。</p>
          <button id="backTitleAfterFeedbackBtn">タイトルに戻る</button>
        </div>
      `;

      document.getElementById("backTitleAfterFeedbackBtn").addEventListener("click", () => {
        location.reload();
      });
    });

    document.getElementById("cancelFeedbackBtn").addEventListener("click", () => {
      location.reload();
    });
  }

  async function renderFeedbackViewer() {
    const list = await ctx.readFeedbackList();

    const html = list.length
      ? list.map(item => `
        <div style="border:1px solid #fff;padding:8px;margin:8px 0;text-align:left;">
          <div><b>${new Date(Number(item.createdAt || 0)).toLocaleString()}</b></div>
          <div>送信者：${item.playerName || "匿名"} / ID：${item.playerId || "匿名"}</div>
          <pre style="white-space:pre-wrap;">${String(item.text || "")}</pre>
          <button data-feedback-delete="${item.id}">削除</button>
        </div>
      `).join("")
      : "<p>要望はありません。</p>";

    document.getElementById("playerStatsContent").innerHTML = `
      <h2>意見・要望一覧</h2>
      ${html}
      <button id="backFromFeedbackViewerBtn">戻る</button>
    `;

    document.querySelectorAll("[data-feedback-delete]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("この要望を削除しますか？")) return;
        await ctx.deleteFeedback(btn.dataset.feedbackDelete);
        renderFeedbackViewer();
      });
    });

    document.getElementById("backFromFeedbackViewerBtn").addEventListener("click", ctx.renderAccountListPanel);
  }

  function ensureFeedbackButton() {
    const title = document.getElementById("title");
    if (!title || document.getElementById("openFeedbackBtn")) return;

    const btn = document.createElement("button");
    btn.id = "openFeedbackBtn";
    btn.textContent = "意見・要望フォーム";
    btn.style.marginTop = "12px";
    btn.addEventListener("click", openFeedbackForm);

    title.appendChild(btn);
  }

  return {
    ensureFeedbackButton,
    renderFeedbackViewer
  };
}
