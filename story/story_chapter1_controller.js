import {
  CHAPTER1_AFTER_CUSTOMIZE_LINES,
  CHAPTER1_TUTORIAL_INTRO_LINES,
  CHAPTER1_SKIP_LINES
} from "./story_chapter1_tutorial_script.js";

import { createStoryBattleEngine } from "./story_battle_engine.js";

export function createStoryChapter1Controller(ctx) {
  const battleEngine = createStoryBattleEngine(ctx);

  let currentLineIndex = 0;
  let currentLines = [];
  let currentHighlight = null;
  let tutorialSteps = [];
  let tutorialIndex = 0;

  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function clearHighlight() {
  battleEngine.clearHighlight();
  currentHighlight = null;
}

function setHighlight(selector) {
  clearHighlight();
  if (!selector) return;
  currentHighlight = selector;
  battleEngine.setHighlight(selector);
}

  function renderMovableTalkBox() {
    document.getElementById("storyTutorialTalkBox")?.remove();

    const box = document.createElement("div");
    box.id = "storyTutorialTalkBox";
    box.style.position = "fixed";
    box.style.left = "12px";
    box.style.bottom = "80px";
    box.style.zIndex = "22000";
    box.style.width = "min(680px, 92vw)";
    box.style.border = "1px solid white";
    box.style.background = "black";
    box.style.color = "white";
    box.style.padding = "12px";
    box.style.boxSizing = "border-box";
    box.style.lineHeight = "1.7";
    box.style.touchAction = "none";

    box.innerHTML = `
      <div id="storyTutorialTalkText"></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
        <button id="storyTutorialNextTalkBtn">次へ</button>
      </div>
    `;

    document.body.appendChild(box);
    enableDrag(box);

    document.getElementById("storyTutorialNextTalkBtn").addEventListener("click", advanceTutorial);
  }

  function enableDrag(target) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;

    target.addEventListener("pointerdown", event => {
      dragging = true;
      target.setPointerCapture(event.pointerId);
      startX = event.clientX;
      startY = event.clientY;
      baseX = target.offsetLeft;
      baseY = target.offsetTop;
    });

    target.addEventListener("pointermove", event => {
      if (!dragging) return;
      target.style.left = `${Math.max(0, baseX + event.clientX - startX)}px`;
      target.style.top = `${Math.max(0, baseY + event.clientY - startY)}px`;
      target.style.bottom = "auto";
    });

    target.addEventListener("pointerup", () => {
      dragging = false;
    });

    target.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  function removeTutorialFloatingUi() {
    document.getElementById("storyTutorialTalkBox")?.remove();
    document.getElementById("storyTutorialSkipBtn")?.remove();
    clearHighlight();
    battleEngine.allow([]);
    battleEngine.clearHandlers();
  }

  function startAfterCustomize() {
    renderSimpleDialogue(CHAPTER1_AFTER_CUSTOMIZE_LINES, renderTrainingIntro);
  }

  function renderSimpleDialogue(lines, onComplete) {
    const root = getRoot();
    if (!root) return;

    currentLines = lines.map(text => ({ text }));
    currentLineIndex = 0;

    root.innerHTML = `
      <div style="width:min(720px,96vw);border:1px solid white;background:black;color:white;padding:16px;line-height:1.8;">
        <div id="storySimpleDialogueText"></div>
        <button id="storySimpleDialogueNextBtn" style="margin-top:12px;">次へ</button>
      </div>
    `;

    function show() {
      document.getElementById("storySimpleDialogueText").textContent =
        currentLines[currentLineIndex]?.text || "";
    }

    document.getElementById("storySimpleDialogueNextBtn").addEventListener("click", () => {
      currentLineIndex += 1;

      if (currentLineIndex >= currentLines.length) {
        onComplete?.();
        return;
      }

      show();
    });

    show();
  }

  function renderTrainingIntro() {
    const root = getRoot();
    if (!root) return;

    battleEngine.renderOneOnOneTraining({ root, free: false });

    battleEngine.setExtraPanel(`
      <div style="text-align:center;margin-top:16px;">
        <div style="margin-bottom:12px;">${CHAPTER1_TUTORIAL_INTRO_LINES[0]}</div>
        <button id="storyTutorialYesBtn">はい</button>
        <button id="storyTutorialNoBtn">いいえ</button>
      </div>
    `);

    document.getElementById("storyTutorialYesBtn").addEventListener("click", startTutorialCourse);
    document.getElementById("storyTutorialNoBtn").addEventListener("click", startSkipCourse);
  }

  function startSkipCourse() {
    removeTutorialFloatingUi();
    renderSimpleDialogue(CHAPTER1_SKIP_LINES, renderFreeTrainingButtons);
  }

  function startTutorialCourse() {
    battleEngine.renderOneOnOneTraining({ root: getRoot(), free: false });
    renderMovableTalkBox();

    const skipBtn = document.createElement("button");
    skipBtn.id = "storyTutorialSkipBtn";
    skipBtn.textContent = "スキップ";
    skipBtn.style.position = "fixed";
    skipBtn.style.left = "12px";
    skipBtn.style.bottom = "20px";
    skipBtn.style.zIndex = "22001";
    document.body.appendChild(skipBtn);
    skipBtn.addEventListener("click", startSkipCourse);

    tutorialSteps = createTutorialSteps();
    tutorialIndex = 0;
    showTutorialStep();
  }

  function createTutorialSteps() {
    return [
      { text: "AI「僭越ながら、チュートリアルをさせていただきます！長くなりますよ！」" },
      { text: "AI「私のセリフは、掴んで動かせるので、適宜ちょうどいいところに動かしながら聞いてくださいね！」" },
      { highlight: "#storyTutorialSkipBtn", text: "AI「ドパガキはこの、スキップボタンを押してチュートリアル強制終了出来ます！まぁクソ長いですがあとから見返せるのでいいかもしれませんが！」" },
      { highlight: "#storyPlayerA", text: "AI「見てください！これがあなたの機体のステータスです！カスタマイズしたステータスがそのまま反映されます！」" },
      { highlight: "#storyPlayerB", text: "AI「こっちが敵です！今回はよわよわトレーニングマシンですが、敵のステータスも丸見えなので、戦闘の際はじっくり解析しましょう！」" },
    { highlight: "__storyHpLines", text: "AI「ここがHPです！単純に0になった方が負けです！」" },
{ highlight: "__storyEvadeLines", text: "AI「その下が回避ストックです！左が所持数、右が最大値です！最大値以上は持てませんが、超過分はターン終了までは切り捨てられません！」" },
      { text: "AI「ただし、ストックが多い形態から少ない形態になった時は、最大値が保持されます！その場合、使用とともに減少します！」" },
     { highlight: "__storyPlayerAEnergyLines", text: "AI「これはクリエイトガンダムのみの仕様ですが、エネルギーがあります！ここが無くなるとエネルギー使用系の行動がなくなりますが、逆に上手く使うことで強く立ち回れますよ！」" },
      { highlight: ".slotArea", text: "AI「ここがスロット行動です！名称をタップすると武装の説明が見られますよ！敵機体のも見れるので、あらかじめ分析しておくとよしです！」" },
      { highlight: ".specialArea", text: "AI「ここが特殊行動と言います！スロットに左右されない任意選択の行動です！」" },
      { text: "AI「しっかり説明を読んで、ここぞと言う時に効果を発揮しましょう！」" },
      { text: "AI「リロードは、弾数制の武器を使う際に重要になります！エネルギーチャージ、エネルギー調整はエネルギー制の武器を使用する際に重要になります！」" },
      { highlight: "#storyExecuteSlotBtn,.story-action-counter", text: "AI「ここがスロット行動のボタンです！画面中央の行動の数、使えます！このゲームの基礎となる行動です！」" },
      { highlight: "#storySimulateBtn", text: "AI「このシミュレーションボタンは、押すと今出るはずだった行動が出ます！運試しや、運ずらしに使ってください！」" },
      { highlight: "#storyEndTurnBtn", text: "AI「このターン終了ボタンを押すと、相手のターンになります！わざと何もせずターンを飛ばすこともできますが、間違えて押しちゃった！ということがないよう、注意してくださいね！」" },

      {
        highlight: "#storyExecuteSlotBtn",
        text: "AI「まずはスロット行動を押して、どんな感じか試してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.forceNextPlayerSlot(4);
          battleEngine.allow(["slot"]);
          battleEngine.on("playerSlot", () => advanceTutorial());
        }
      },
      { text: "AI「結果が出ましたね！行動は4です！0ダメージですが、これは相手が回避をしたんですね！」" },
      { text: "AI「画面上部、相手回避を見てください！0/1となってますよね。これは、1回回避を消費したということです！」" },
      { text: "AI「このように、攻撃回数分回避を消費すると、攻撃を無効化出来るわけですね！」" },

      {
        highlight: "#storyEndTurnBtn",
        text: "AI「ターン終了ボタンを押してみましょう！相手からの行動が来ますよ！」",
        waitAction: true,
        setup() {
          battleEngine.forceNextEnemySlot(1);
          battleEngine.allow(["end"]);
          battleEngine.on("enemyTurn", () => advanceTutorial());
        }
      },
      { text: "AI「来ましたね！5ダメージの攻撃です！[格]は格闘属性です！まぁ今はあんま関係ないですが！」" },

      {
        highlight: ".hitBtn",
        text: "AI「とりあえず、今は被弾しておきましょう！被弾ボタンをタップしてください！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["hit"]);
          battleEngine.on("hit", () => advanceTutorial());
        }
      },
   { highlight: "__storyPlayerAHpLines", text: "AI「出ました！自分のHPを見てください！5ダメージ受けてますよね！こんなもんじゃ何発食らってもプロトクリエイトガンダムは堕ちません！」" },

      {
        highlight: "#storyEndTurnBtn",
        text: "AI「実戦では、体力と相談して被弾しましょう！それではターン終了ボタンを押しましょうか！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["endOnly"]);
          battleEngine.on("endOnly", () => advanceTutorial());
        }
      },

      {
        highlight: "#storyExecuteSlotBtn",
        text: "AI「では、スロット行動をタップしてください！」",
        waitAction: true,
        setup() {
          battleEngine.forceNextPlayerSlot(3);
          battleEngine.allow(["slot"]);
          battleEngine.on("playerSlot", () => advanceTutorial());
        }
      },
      { highlight: "#storyPlayerA .criticalBoostBtn", text: "AI「回避が出ましたね！自機の回避数を見てください！所持数がオーバーしてますよね！」" },

      {
        highlight: "#storyPlayerA .criticalBoostBtn",
        text: "AI「このままターンを終了すると、端数分が無くなってしまいます！勿体ないのでこの会心ボタンを押してください！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["critical"]);
          battleEngine.on("critical", () => advanceTutorial());
        }
      },
      { text: "AI「会心率が5%→9%になりましたね！回避1消費で、4%会心率が上がります！会心が出ると、ダメージが2倍になるんですよ！」" },

      {
        highlight: "#storyEndTurnBtn",
        text: "AI「見事、回避が無駄にならずに済みました！それでは、ターン終了を押しましょう！」",
        waitAction: true,
        setup() {
          battleEngine.forceNextEnemySlot(2);
          battleEngine.allow(["end"]);
          battleEngine.on("enemyTurn", () => advanceTutorial());
        }
      },

      {
        highlight: ".evadeBtn",
        text: "AI「出ました！今度は5ダメージの[射]、つまり射撃属性ですね！今度は回避を選んでみましょうか！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["evade"]);
          battleEngine.on("evade", () => advanceTutorial());
        }
      },
      { highlight: "#storyEndTurnBtn", text: "AI「いいですね！ダメージが無効化できましたよ！勿体ない？いえいえ、今は練習ですからね！」" },
      { text: "AI「他にも[不]は軽減不可、つまりダメージを少なくできない攻撃、[必]は回避ができない攻撃です！何となく覚えておいてくださいね！では、ターン終了を押しましょう！」" },

      {
        text: "AI「次は2on2ルールに進みます！「次へ」ボタンをタップしてください！」",
        waitAction: true,
        setup() {
          battleEngine.renderNext2v2Button();
          battleEngine.allow(["next2v2"]);
          battleEngine.on("next2v2", () => startTwoOnTwoTutorial());
        }
      }
    ];
  }

  function showTutorialStep() {
    battleEngine.clearHandlers();
  battleEngine.allow(["__tutorial_locked__"]);

    const step = tutorialSteps[tutorialIndex];
    if (!step) return;

    setHighlight(step.highlight);

    const talk = document.getElementById("storyTutorialTalkText");
    if (talk) talk.textContent = step.text || "";

    step.setup?.();

    const nextBtn = document.getElementById("storyTutorialNextTalkBtn");
    if (nextBtn) nextBtn.style.display = step.waitAction ? "none" : "";
  }

  function advanceTutorial() {
    tutorialIndex += 1;
    showTutorialStep();
  }

  function startTwoOnTwoTutorial() {
    battleEngine.renderTwoOnTwoTraining({ root: getRoot(), free: false });

    tutorialSteps = createTwoOnTwoSteps();
    tutorialIndex = 0;
    showTutorialStep();
  }

  function createTwoOnTwoSteps() {
    return [
      { text: "AI「よっこらしょ！2on2の場を精製しました！どうです？4機のステータスが見えますよね！壮観です！」" },
      { highlight: ".switchUnitBtn", text: "AI「このボタンはステータス表示のみを切り替えるボタンです！相手のものも押せるので、適宜押して見たい時に能力を見ましょう！」" },
      { highlight: ".focusUnitBtn", text: "AI「ここはフォーカスといって、現在プレイヤー機体で赤くなっているほうがフォーカスです！つまり、狙われる機体です！」" },
      { text: "AI「狙われてもいい方をフォーカス機体にしておくのが基本戦術です！」" },

      {
        highlight: "#storyTeamSlotBtn",
        text: "AI「ではスロット行動を押してみましょうか！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["teamSlot"]);
          battleEngine.on("teamSlot", () => advanceTutorial());
        }
      },
      { text: "AI「どうですか！1回で同時に連携攻撃です！これが相手のフォーカス機体に向けて打たれるわけです！」" },
      { highlight: "#storyUnit1SlotBtn,#storyUnit2SlotBtn", text: "AI「単独で行動させたい時は、それぞれの単独行動を選んでみてくださいね！」" },

      {
        highlight: "#storyEndTurnBtn",
        text: "AI「それでは次のターンに行きましょう！相手の行動が来ますよ！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["end"]);
          battleEngine.on("teamEnemyTurn", () => advanceTutorial());
        }
      },

      {
        highlight: ".evadeBtn",
        text: "AI「出たー！来ましたね！では私の言う通りに処理してみましょう！上の攻撃は回避！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["evade"]);
          battleEngine.on("teamEvade", () => advanceTutorial());
        }
      },

      { text: "AI「回避できましたね！残った方は必中属性でした。回避できません。そこで便利な機能があります。」" },

      {
        highlight: ".supportDefenseBtn",
        text: "AI「援護防御です！これは、フォーカス機体の相方、つまりパートナー機体の回避を1消費して、このダメージを半分にしてパートナーが肩代わりするコマンドです！押してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["cover"]);
          battleEngine.on("cover", () => advanceTutorial());
        }
      },
      { text: "AI「いい感じです！2on2ならではの技ですね！ピンチの時はアリかもしれません！」" },

      {
  highlight: "#storyEndTurnBtn",
  text: "AI「ターン終了を押して、反撃です！」",
  waitAction: true,
  setup() {
    battleEngine.allow(["endOnly"]);
    battleEngine.on("endOnly", () => advanceTutorial());
  }
},

      {
      highlight: "#storyPlayerA .teamModeBtn",
        text: "AI「画面上部、分散型って書いてありますよね。実は戦型がふたつあるんです。自分チームのここを押してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["style"]);
          battleEngine.on("style", () => advanceTutorial());
        }
      },
      { text: "AI「どん！これが統合型です！2機のステータスを一緒くたにして、1機として扱う戦術です！」" },
      { text: "AI「この型は非常に強力で、回避は折半、ダメージも折半、特殊行動効果がどちらにも着く、行動権利も共有するので増えると2機分と、めちゃくちゃ強力です！」" },
      { text: "AI「デメリットとしては、1番機が被弾する扱いになる、援護防御は使えない、[挑発]システムがつかえないというところですね。」" },

      {
        highlight: "#storyPlayerA .teamModeBtn",
        text: "AI「統合型は後で試してもらうとして、[挑発]、行きましょう！分散型に戻してください！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["style"]);
          battleEngine.on("style", () => advanceTutorial());
        }
      },

      {
        highlight: "#storyPlayerA .tauntSystemBtn",
        text: "AI「挑発が使えます！早速押してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["taunt"]);
          battleEngine.on("taunt", () => advanceTutorial());
        }
      },

      {
        highlight: "#storyTauntTarget2Btn",
        text: "AI「画面下部です！2機目のトレーニングマシンを指定してみましょう！」",
        waitAction: true,
        setup() {
        battleEngine.allow(["__tutorial_locked__"]);
          battleEngine.on("tauntTarget", () => advanceTutorial());
        }
      },

      { text: "AI「見てください！2番機が青くなりましたね！この状態の時は、分散型にして青くなった機体をフォーカスにしないと、ダメージが1.5倍になります！効果は5ターンです！」" },
      { text: "AI「統合型の場合も1番機が挑発されていたとしても1.5倍ダメージです！つまり分散型で、相手にその機体にフォーカスさせることを強いる行動ですね！」" },

      {
        highlight: "#storyPlayerA .tauntSystemBtn",
        text: "AI「挑発ボタンが決戦になってますよね。これを押してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["duel"]);
          battleEngine.on("duel", () => advanceTutorial());
        }
      },

      {
        highlight: "#storyDuelUnit1Btn,#storyDuelUnit2Btn",
        text: "AI「画面下部、決戦する機体を選べます！選んでください！」",
        waitAction: true,
        setup() {
          battleEngine.on("duelSelected", () => advanceTutorial());
        }
      },

      { text: "AI「ピンク色になりましたね！自分の選んだ決戦機体と、相手が選んでいるフォーカス機体が決戦状態となり、ピンク色の機体同士で2倍のダメージが入るようになります！効果は5ターン！」" },

{
        highlight: "#storyPlayerA .tauntSystemBtn",
        text: "AI「ハイリスクハイリターン！ここで押せるのが「打破」です！打破ボタンを押してみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["breakthrough"]);
          battleEngine.on("breakthrough", () => {
            battleEngine.allow(["breakthroughBet"]);
            advanceTutorial();
          });
        }
      },

      {
        highlight: ".story-bet-btn[data-bet='10']",
        text: "AI「画面下部に、0～10のボタンが出ましたね！10を選んでみましょう！」",
        waitAction: true,
        setup() {
          battleEngine.allow(["breakthroughBet"]);
          battleEngine.on("breakthroughBet", () => advanceTutorial());
        }
      },

      { text: "AI「ぶわーっと出ましたね！これが打破！10ターン分のシミュレーションを行い、与えるダメージ量が多い方の勝ちというモードになります！」" },
      { highlight: ".story-breakthrough-bonus", text: "AI「勝利すると、賭けた数に比例したボーナス行動権が手に入ります！」" },
      { text: "AI「打破賭け中に獲得した強化、回避はそのまま戦闘で使えます！あえて強化を狙うのもアリかもしれませんね！」" },
      { text: "AI「以上が挑発→決戦→打破の流れです！打破に勝利すれば最高の反撃を与えられます！」" },
      { text: "AI「長らく説明を聞いてもらってありがとうございます！それでは気が済むまでのんびりシミュレーション戦闘をお楽しみください！」", finish: true }
    ];
  }

  function showTutorialStep() {
    battleEngine.clearHandlers();
  battleEngine.allow(["__tutorial_locked__"]);

    const step = tutorialSteps[tutorialIndex];
    if (!step) return;

    if (step.finish) {
      const nextBtn = document.getElementById("storyTutorialNextTalkBtn");
      if (nextBtn) nextBtn.textContent = "終了";
    }

    setHighlight(step.highlight);

    const talk = document.getElementById("storyTutorialTalkText");
    if (talk) talk.textContent = step.text || "";

    step.setup?.();

    const nextBtn = document.getElementById("storyTutorialNextTalkBtn");
    if (nextBtn) nextBtn.style.display = step.waitAction ? "none" : "";
  }

  function advanceTutorial() {
    const step = tutorialSteps[tutorialIndex];

    if (step?.finish) {
      renderFreeModeSelect();
      return;
    }

    tutorialIndex += 1;
    showTutorialStep();
  }

  function startTwoOnTwoTutorial() {
    battleEngine.renderTwoOnTwoTraining({ root: getRoot(), free: false });

    tutorialSteps = createTwoOnTwoSteps();
    tutorialIndex = 0;
    showTutorialStep();
  }
function renderFreeModeSelect() {
    removeTutorialFloatingUi();

    const root = getRoot();
    if (!root) return;

    root.innerHTML = `
      <div style="width:min(720px,96vw);border:1px solid white;background:black;color:white;padding:16px;line-height:1.8;text-align:center;">
        <h2>チャプター1 フリー演習</h2>
        <p>実戦UIで演習します。モードを選んでください。</p>
        <button id="storyFree1v1Btn">1on1</button>
        <button id="storyFree2v2Btn">2on2</button>
        <button id="storyChapter1EndBtn">チャプター1終了</button>
      </div>
    `;

    document.getElementById("storyFree1v1Btn")?.addEventListener("click", renderFreeTrainingButtons);
    document.getElementById("storyFree2v2Btn")?.addEventListener("click", renderFreeTwoOnTwo);
    document.getElementById("storyChapter1EndBtn")?.addEventListener("click", clearChapter1);
}
  function renderFreeTrainingButtons() {
    removeTutorialFloatingUi();

    if (typeof ctx.startStoryFreeBattle === "function") {
      ctx.startStoryFreeBattle("1v1", { onEnd: clearChapter1 });
      return;
    }

    battleEngine.renderOneOnOneTraining({ root: getRoot(), free: true });
    battleEngine.setLog("フリー演習です。");
  }

  function renderFreeTwoOnTwo() {
    removeTutorialFloatingUi();

    if (typeof ctx.startStoryFreeBattle === "function") {
      ctx.startStoryFreeBattle("2v2", { onEnd: clearChapter1 });
      return;
    }

    battleEngine.renderTwoOnTwoTraining({ root: getRoot(), free: true });
    battleEngine.setLog("2on2フリー演習です。");
  }

  function clearChapter1() {
  removeTutorialFloatingUi();

  if (typeof ctx.onChapter1Clear === "function") {
    ctx.onChapter1Clear();
  }

  if (typeof ctx.closeStoryModeToTitle === "function") {
    ctx.closeStoryModeToTitle();
    return;
  }

  document.getElementById("storyModeRoot")?.remove();
  }

  return {
    startAfterCustomize
  };
}
