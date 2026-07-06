import { loadStorySave, saveStorySave } from "./story_save.js";

const CHAPTER3_OPENING_LINES = [
  "AI「さて、貴方は覇道を1歩踏み出した訳ですが…正直まだまだデータが足りないです！」",
  "AI「カレーで例えると具なしです！それも美味いかもしれませんが、まだ本家レジェンド達に太刀打ちできる機体ではないことは明白っ！」",
  "AI「先んじて、貴方の取得したデータを利用して、[リーオー]のデータを取ってきました！…破損してますが…」",
  "AI「私が取ってきたデータは[ショップ]として、在庫構えときますね！貴方の戦闘データ、つまりレベルをそのまま頂ければ、破損データを修復できるみたいなので！」",
  "AI「しかし…なんだか私たちはガンダムを倒したことで時空を歪めてしまったらしく、様々な方面から刺客を送られてきています。」",
  "AI「学習戦闘のモードに、使えそうな量産機のデータを入れておきますので、そこから戦闘準備をしましょう。次のボスは手強いかもしれません…！」",
  "チャプターボス\n[ガンキャノン×ガンタンク]\n[ギャン×グフ]\n[サイコ・ガンダム]",
  "AI「どうやら、奴らを倒せば一難は逃れられるようですね！十分な用意をしたら、たたきつぶしに行きましょう！」",
  "学習戦闘に\n[リーオー]\n[デスアーミー]\n[ガンバレルダガー]\n[グレイズ]\nが追加されました。",
  "ここでストーリーは終了。\n現在はデバッグ権限者のみ進行可能です。"
];

export const CHAPTER3_ENDING_LINES = [
  "AI「おお…！やりましたね…！」",
  "AI「プロトクリエイトガンダムもえっぐい強くなったんじゃないですか？\nそろそろ自分の機体という感覚が湧いてきましたか？」",
  "AI「そんな貴方がどう思うか分かりませんが、ひとつおしらせです！」",
  "AI「今貴方は[プロトクリエイトガンダム]を使用しておりますが、なんと、貴方の活躍で[クリエイトガンダム]が建造できそうです！！！！」",
  "AI「ドンドンパフパフ！どう凄いのかって？ご説明しましょう！[クリエイトガンダム]とは！」",
  "AI「クリエイトガンダムが正式使用になると、同行呼び出し可能数が2機になります！つまり、同行機体を戦闘中にポ〇モンの如く切り替えることが可能！もー、がち強いです！！！」",
  "AI「しかもしかも！コストはプロトクリエイトガンダムの二倍スタート！200から育てられる！\n…とはいっても、ここまで来たらプロトクリエイトガンダムもかなり迫ってるとは思いますが」",
  "AI「そんなクリエイトガンダムは、あと少しで建造できるのです！\n手伝ってくださいね！！！！」",
  "チャプター3終了"
];

export function createStoryChapter3Controller(ctx) {
  function getRoot() {
    return document.getElementById("storyModeRoot");
  }

  function renderDialogue(lines, onComplete) {
    const root = getRoot();
    if (!root) return;

    let index = 0;
    root.style.justifyContent = "center";
    root.style.overflowY = "auto";
    root.innerHTML = `
      <div id="storyDialogueText" style="white-space:pre-wrap; line-height:1.8; max-width:720px;"></div>
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

  function unlockChapter3OpeningRewards() {
    const save = loadStorySave();

    if (!save.flags) save.flags = {};
    save.flags.chapter3Started = true;
    save.flags.chapter3OpeningViewed = true;
    save.flags.chapter3ShopUnlocked = true;
    save.flags.chapter3BossUnlocked = true;
    save.flags.chapter3LearningUnlocked = true;

    saveStorySave(save);
  }

  function start() {
    const save = loadStorySave();

    if (save.flags?.chapterBossGundamCleared !== true && save.flags?.chapter2Cleared !== true) {
      ctx.showPopup?.("チャプター3はチャプター2クリア後に進行できます");
      return;
    }

    renderDialogue(CHAPTER3_OPENING_LINES, () => {
      unlockChapter3OpeningRewards();
      ctx.renderStoryMainMenu?.();
    });
  }

  function renderEnding(onComplete) {
    const save = loadStorySave();

    if (!save.flags) save.flags = {};
    save.flags.chapter3Cleared = true;
    save.flags.chapter3EndingViewed = true;
    save.flags.chapter3BossUnlocked = false;
    saveStorySave(save);

    renderDialogue(CHAPTER3_ENDING_LINES, () => {
      if (typeof onComplete === "function") {
        onComplete();
        return;
      }
      ctx.renderStoryMainMenu?.();
    });
  }

  return {
    start,
    renderEnding
  };
}
