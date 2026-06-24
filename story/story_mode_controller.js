export function createStoryModeController(ctx) {
  const DEBUG_ROLES = new Set(["debug", "Ciel_debugger"]);

  let activeScene = null;
  let lineIndex = 0;
  let locked = false;

  function getCurrentRole() {
    const profileRole = ctx.getPlayerProfile?.()?.role;
    if (profileRole) return profileRole;

    const summaryText = document.getElementById("playerCardSummary")?.textContent || "";
    if (summaryText.includes("権限：debug")) return "debug";
    if (summaryText.includes("権限：Ciel_debugger")) return "Ciel_debugger";

    return "";
  }

  function canUseStoryMode() {
    return DEBUG_ROLES.has(getCurrentRole());
  }

  function updateStartButtonVisibility() {
    const btn = document.getElementById("startStoryModeBtn");
    if (!btn) return;
    btn.style.display = canUseStoryMode() ? "" : "none";
  }

  function clearStoryScreen() {
    const old = document.getElementById("storyModeRoot");
    if (old) old.remove();
  }

  function createRoot() {
    clearStoryScreen();

    const root = document.createElement("div");
    root.id = "storyModeRoot";
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "20000";
    root.style.background = "black";
    root.style.color = "white";
    root.style.opacity = "0";
    root.style.transition = "opacity 3s";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "center";
    root.style.justifyContent = "center";
    root.style.padding = "16px";
    root.style.boxSizing = "border-box";

    document.body.appendChild(root);
    requestAnimationFrame(() => {
      root.style.opacity = "1";
    });

    return root;
  }

  function renderDialogue(lines, onComplete) {
    const root = document.getElementById("storyModeRoot") || createRoot();
    activeScene = { lines, onComplete };
    lineIndex = 0;

    root.innerHTML = `
      <div id="storyDialogueBox" style="
        width: min(720px, 96vw);
        border: 1px solid white;
        padding: 18px;
        background: rgba(0,0,0,0.9);
        font-size: 16px;
        line-height: 1.8;
      ">
        <div id="storyDialogueText"></div>
        <button id="storyDialogueNextBtn" style="margin-top:16px;">次へ</button>
      </div>
    `;

    const nextBtn = document.getElementById("storyDialogueNextBtn");
    nextBtn.addEventListener("click", nextDialogue);
    showCurrentLine();
  }

  function showCurrentLine() {
    const text = document.getElementById("storyDialogueText");
    if (!text || !activeScene) return;
    text.textContent = activeScene.lines[lineIndex] || "";
  }

  function nextDialogue() {
    if (!activeScene || locked) return;

    lineIndex += 1;
    if (lineIndex < activeScene.lines.length) {
      showCurrentLine();
      return;
    }

    const done = activeScene.onComplete;
    activeScene = null;
    if (typeof done === "function") done();
  }

  function start() {
    if (!canUseStoryMode()) {
      ctx.showPopup?.("ストーリーモードは現在デバッグ権限者のみ使用できます");
      return;
    }

    createRoot();

    setTimeout(() => {
      if (ctx.getPlayerProfile?.()) {
        startNormalRoute();
      } else {
        startGuestRoute();
      }
    }, 3100);
  }

  function startGuestRoute() {
    renderDialogue([
      "AI「…あっ！？新しいプレイヤーさん！？」",
      "AI「このモードは、プレイヤー登録をしないとまともに遊べませんよ！遊んだ内容が記録されて楽しいですよ！プレイヤー登録しますか？」"
    ], renderGuestChoice);
  }

  function renderGuestChoice() {
    const root = document.getElementById("storyModeRoot");
    root.innerHTML = `
      <div style="text-align:center;">
        <p>プレイヤー登録しますか？</p>
        <button id="storyRegisterYesBtn">はい</button>
        <button id="storyRegisterNoBtn">いいえ</button>
      </div>
    `;

    document.getElementById("storyRegisterYesBtn").addEventListener("click", async () => {
      await ctx.playerAccountUi?.handleRegister?.();
      renderDialogue([
        "AI「ふむふむ。いい名前ですね！これからよろしくお願いしますね！」"
      ], startNormalRoute);
    });

    document.getElementById("storyRegisterNoBtn").addEventListener("click", () => {
      renderDialogue([
        "AI「なんと…！まさかこのモードをノーセーブで不眠不休でクリアまで持っていく気ですか！」",
        "AI「それもまたよし！見届けますよ！私も！」"
      ], startNormalRoute);
    });
  }

  function startNormalRoute() {
    renderDialogue([
      "AI「申し遅れました！私はひとり寂しくこのゲームに設置されたナビゲーターAIです！」",
      "AI「このモードは、私と一緒に色々なデータを集め、貴方が最強のガンダムを作り上げるモードです！」",
      "AI「そのベースこそ、この機体です！」",
      "AI「その名も、プロトクリエイトガンダム！」",
      "AI「この機体はまだなんのデータもないよわよわロボットです！あなたはこの機体で駆け回り、最強になるためにデータを集めるのです！」",
      "AI「プロトクリエイトガンダムはあなたのカスタマイズで千変万化の能力を持つ機体です！早速カスタマイズ画面に行きましょう！」"
    ], renderLabTutorial);
  }

  function renderLabTutorial() {
    const root = document.getElementById("storyModeRoot");
    root.innerHTML = `
      <h2>クリエイトガンダムラボ</h2>
      <button id="storyCustomizeBtn" disabled>カスタマイズ</button>
      <button id="storyLabExitBtn" disabled>退室</button>
      <div id="storyLabTalk" style="margin-top:20px; max-width:720px; line-height:1.8;"></div>
    `;

    const talk = document.getElementById("storyLabTalk");
    talk.textContent = "AI「クリエイトガンダムラボへ来ました！この画面でプロトクリエイトガンダムをカスタムすることができますよ！まずはカスタマイズを押してみましょう！」";

    setTimeout(() => {
      document.getElementById("storyCustomizeBtn").disabled = false;
    }, 800);

    document.getElementById("storyCustomizeBtn").addEventListener("click", renderCustomizeTutorial);
  }

  function setHighlight(selector, enabled) {
    document.querySelectorAll(selector).forEach(el => {
      el.style.color = enabled ? "red" : "";
      el.style.borderColor = enabled ? "red" : "";
      el.style.boxShadow = enabled ? "0 0 8px red" : "";
    });
  }

  function renderCustomizeTutorial() {
    const root = document.getElementById("storyModeRoot");
    root.style.justifyContent = "flex-start";
    root.style.overflowY = "auto";

    root.innerHTML = `
      <h2 style="text-align:center;">プロトクリエイトガンダム</h2>

      <div id="storyCustomizePanel" style="
        width:min(720px,96vw);
        line-height:1.6;
        margin:0 auto;
      ">
        <div class="story-level" style="text-align:center;">レベル0</div>
        <div class="story-cost" style="text-align:center;margin-bottom:12px;">コスト 100 [残40]</div>

        <div class="story-row">
          <span class="story-label">HP 200</span>
          <span class="story-cost-text">[コスト0]</span>
          <span class="story-buttons"><button class="story-inject">注入</button><button class="story-release">解除</button></span>
        </div>

        <div class="story-row">
          <span class="story-label">回避ストック 1</span>
          <span class="story-cost-text">[コスト0]</span>
          <span class="story-buttons"><button class="story-inject">注入</button><button class="story-release">解除</button></span>
        </div>

        <div class="story-row">
          <span class="story-label">エネルギー 100</span>
          <span class="story-cost-text">[コスト0]</span>
          <span class="story-buttons"><button class="story-inject">注入</button><button class="story-release">解除</button></span>
        </div>

        <hr>

        <div class="story-row story-slot">
          <span class="story-label">1.汎用マシンガン</span>
          <span class="story-cost-text">[コスト5]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-slot">
          <span class="story-label">2.回復 30</span>
          <span class="story-cost-text">[コスト5]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-slot">
          <span class="story-label">3.回避 1</span>
          <span class="story-cost-text">[コスト5]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-slot">
          <span class="story-label">4.ビームガン</span>
          <span class="story-cost-text">[コスト5]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-slot">
          <span class="story-label">5.バズーカ</span>
          <span class="story-cost-text">[コスト20]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-slot">
          <span class="story-label">6.心中蹴り</span>
          <span class="story-cost-text">[コスト20]</span>
          <span class="story-buttons"><button>詳細</button><button class="story-swap">入替</button></span>
        </div>

        <hr>

        <div class="story-row story-equipment">
          <span class="story-label">装備品1 なし</span>
          <span class="story-cost-text"></span>
          <span class="story-buttons"><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-equipment">
          <span class="story-label">装備品2 なし</span>
          <span class="story-cost-text"></span>
          <span class="story-buttons"><button class="story-swap">入替</button></span>
        </div>

        <div class="story-row story-skill">
          <span class="story-label">スキル なし</span>
          <span class="story-cost-text"></span>
          <span class="story-buttons"><button class="story-swap">入替</button></span>
        </div>

        <div style="text-align:center;margin-top:16px;">
          <button id="storyReadyBtn" disabled>準備完了</button>
        </div>
      </div>

      <style>
        #storyCustomizePanel .story-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin: 8px 0;
        }

        #storyCustomizePanel .story-label {
          text-align: left;
          white-space: nowrap;
        }

        #storyCustomizePanel .story-cost-text {
          text-align: left;
          white-space: nowrap;
        }

        #storyCustomizePanel .story-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          white-space: nowrap;
        }

        #storyCustomizePanel button {
          min-width: 54px;
        }

        @media (max-width: 520px) {
          #storyCustomizePanel .story-row {
            grid-template-columns: 1fr auto;
          }

          #storyCustomizePanel .story-cost-text {
            grid-column: 1;
          }

          #storyCustomizePanel .story-buttons {
            grid-column: 2;
            grid-row: 1 / span 2;
          }
        }
      </style>

      <div id="storyTutorialTalk" style="
        width:min(780px,96vw);
        margin-top:16px;
        border:1px solid white;
        padding:12px;
        background:rgba(0,0,0,0.9);
      "></div>
      <button id="storyTutorialNextBtn">次へ</button>
    `;

    const steps = [
      {
        text: "AI「カスタマイズ画面です！すいませんこんな弱くて…！」"
      },
      {
        text: "AI「でも大丈夫です！そのためのカスタマイズですから！説明していきますね。」"
      },
      {
        selector: ".story-level",
        text: "AI「ここがレベルです！今は0ですが、経験を積むとレベルが上がります！レベルが上がると、コストや様々な能力が上がります！プレイあるのみです！」"
      },
      {
        selector: ".story-cost",
        text: "AI「ここがコストです！今は100までしかありませんが、レベルが上がれば増えますよ！どうやらまだ40ポイント余っているようですね！この後振り分けしてみましょうか！」"
      },
      {
        selector: ".story-inject",
        text: "AI「このボタンでコストを注入出来ます！項目しだいで1注入コストは変わりますが、詳しくはかったるいので説明しません！色々触ってみてくださいね！」"
      },
      {
        selector: ".story-release",
        text: "AI「このボタンでコストを抜き取れます！一気には抜けないです！大変なんですよ抜くの！ボタンを押すと私がコスト無料で抜いてあげるんですからそれで勘弁してください！」"
      },
      {
        selector: ".story-swap",
        text: "AI「このボタンでその項目の装備を入れ替えられます！対応した入れ替え先のものを所持していれば入れ替えられます！無くすことはできません！」"
      },
      {
        selector: ".story-slot",
        text: "AI「スロットで選ばれるアクションです！戦闘の基本となるので、ここの噛み合わせが悪かったりすると弱くなりがちです！」"
      },
      {
        selector: ".story-equipment",
        text: "AI「この機体に後付けする装備品です！今はシールドしか持ってませんが、ここに装備したものはスロット行動に関係なく特殊行動で効果を発揮できます！とりあえずあとでシールドをつけてみましょう！」"
      },
      {
        selector: ".story-skill",
        text: "AI「あなたが持っている特殊技能です！おお！？どうやら何か持っているようですね…？これもコストがかかりますが、セットしたればセットしてください！」"
      },
      {
        text: "AI「さぁ早速カスタマイズしてみましょう！色々いじってみてください！」",
        finish: true
      }
    ];

    let stepIndex = 0;
    let lastSelector = null;

    function showStep() {
      if (lastSelector) setHighlight(lastSelector, false);

      const step = steps[stepIndex];
      if (!step) return;

      lastSelector = step.selector || null;
      if (lastSelector) setHighlight(lastSelector, true);

      document.getElementById("storyTutorialTalk").textContent = step.text;

      if (step.finish) {
        document.getElementById("storyTutorialNextBtn").style.display = "none";
        document.getElementById("storyReadyBtn").disabled = false;
      }
    }

    document.getElementById("storyTutorialNextBtn").addEventListener("click", () => {
      stepIndex += 1;
      showStep();
    });

    showStep();
  }

  return {
    start,
    updateStartButtonVisibility
  };
}
