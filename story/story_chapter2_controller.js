import { getStoryCreateUnit } from "./story_units.js";
import { loadStorySave, saveStorySave } from "./story_save.js";

import { story_gundam } from "../js/js_units_story_gundam.js";
import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";

export function createStoryChapter2Controller(ctx) {
  function clearRoot() {
    document.getElementById("storyModeRoot")?.remove();
  }

  function createRoot() {
    clearRoot();

    const root = document.createElement("div");
    root.id = "storyModeRoot";
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.zIndex = "20000";
    root.style.background = "black";
    root.style.color = "white";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "center";
    root.style.justifyContent = "center";
    root.style.padding = "16px";
    root.style.boxSizing = "border-box";

    document.body.appendChild(root);
    return root;
  }

  function renderDialogue(lines, onComplete) {
    const root = document.getElementById("storyModeRoot") || createRoot();
    let index = 0;

    root.innerHTML = `
      <div id="storyDialogueText" style="max-width:720px; line-height:1.8; white-space:pre-wrap;"></div>
      <button id="storyDialogueNextBtn">次へ</button>
    `;

    function showLine() {
      const text = document.getElementById("storyDialogueText");
      if (text) text.textContent = lines[index] || "";
    }

    document.getElementById("storyDialogueNextBtn")?.addEventListener("click", () => {
      index += 1;

      if (index >= lines.length) {
        onComplete?.();
        return;
      }

      showLine();
    });

    showLine();
  }

  function start() {
    renderDialogue([
      "AI「さて、まずはこの機体の真骨頂のシステムを手に入れる為の第1歩を踏み出しましょうか！」",
      "AI「クリエイトガンダムの秘密の力は[敵を倒すこと] で発現します！え〜と、まずはこのへんで！」",
      "AI「ここはサイド7！あそこに、『ガンダム』がいますね！\n史実どおりなら、ここで襲われるはずです！」",
      "AI「と、話してるうちに来ました！ザクIIです！アレのデータをとるべく、ガンダムと共闘しましょう！」",
      "AI「準備している時間などありません！ほらほら早く！！」"
    ], startBattle);
  }

  function startBattle() {
    ctx.startStoryFreeBattle?.({
      mode: "2v2",
      allowModeSwitch: false,
      exitLabel: "チャプター2を中断",

      allyUnits: [
        getStoryCreateUnit("proto_create_gundam"),
        story_gundam
      ],

      enemyUnits: [
        story_zaku_ii_gene,
        story_zaku_ii_denim
      ],

      onWin: renderVictoryRoute,
      onLose: renderDefeatRoute,
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function renderDefeatRoute() {
    const root = createRoot();

    root.innerHTML = `
      <div style="max-width:720px; line-height:1.8; white-space:pre-wrap;">
AI「ありゃりゃ…負けちゃいましたか…
ガンダムをフォーカス機体にしたり、思い切って統合型にしたり、色々試してみましょう！再度挑戦しますか？」
      </div>
      <div style="display:flex; gap:8px; margin-top:16px;">
        <button id="storyChapter2RetryBtn">はい</button>
        <button id="storyChapter2TitleBtn">タイトルにもどる</button>
      </div>
    `;

    document.getElementById("storyChapter2RetryBtn")?.addEventListener("click", startBattle);
    document.getElementById("storyChapter2TitleBtn")?.addEventListener("click", () => {
      clearRoot();
      ctx.showTitle?.();
    });
  }

  function unlockVictoryRewards() {
    const save = loadStorySave();

    save.flags.chapter2Cleared = true;
    save.flags.companionSystemUnlocked = true;
    save.flags.learningBattleUnlocked = true;
    save.flags.chapterBossUnlocked = true;
    save.flags.star1LearningUnlocked = true;

    if (!save.companionUnits) save.companionUnits = {};

    save.companionUnits.story_zaku_ii_gene = {
      unlocked: true,
      cost: 5
    };

    saveStorySave(save);
  }

  function renderVictoryRoute() {
    const before = loadStorySave();
    const showGeneUnlockMessage =
      before.companionUnits?.story_zaku_ii_gene?.unlocked !== true;

    unlockVictoryRewards();

    const lines = [
      "AI「おお！見事撃破しましたね！それにしてもガンダム、初戦闘にしては凄まじい戦闘能力です…。いつかあの力を私たちのものにしましょう！」",
      "AI「今回の戦闘で、同行機体データが手に入りました！同行機体について説明しましょう！」",
      "AI「プロトクリエイトガンダムは撃破した機体のデータを集めると、そのままデータ複製して戦闘に参加させることが出来るんです！なかなかの機能ですよね！」",
      "AI「ですが、同行機体はコストを消費します！そのぶんプロトクリエイトガンダム本体に扱えるコストは少なくなるので注意が必要です！」",
      ...(showGeneUnlockMessage ? ["[ザクII(ジーン機)]が同行可能になりました。"] : []),
      "AI「あとでクリエイトガンダムラボに行って、確認してくださいね！\nそして、今回出会った機体と自由に学習戦闘が行えるようになりました！」",
      "AI「学習戦闘とは、1度会った機体をそのまま再現した機体と戦える機能です！\nプロトクリエイトガンダムのレベル上げ、そして、武器や装備、スキルの収集が行えます！」",
      "AI「それと、新たに強さ☆1機体が学習戦闘に追加されました！\n条件を満たせば同行させられますし、色々挑んでみましょう！」",
      "AI「長くなりました！これで私の解説は終わ…\nん？」",
      "AI「どうやらタダでは逃がして貰えなさそうです。このサイド7コロニーから逃げるには、やつを倒さなきゃいけないようですよ」",
      "【チャプターボス解放】\nガンダム ☆☆"
    ];

    renderDialogue(lines, () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  return {
    start
  };
}
