import { getStoryCreateUnit } from "./story_units.js";
import { loadStorySave, saveStorySave } from "./story_save.js";
import { gundam_mc } from "../js/js_units_gundam_mc.js";

import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";
import { story_ball } from "../js/js_units_story_ball.js";
import { story_gm } from "../js/js_units_story_gm.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const STORY_COMPANION_UNIT_MAP = {
  story_zaku_ii_gene,
  story_zaku_ii_denim,
  story_ball,
  story_gm
};

function createCpuGundamBossUnit() {
  const unit = clone(gundam_mc);

  unit.id = "cpu_gundam_mc";
  unit.name = "ガンダム";
  unit.exp = 30;
  unit.storyChapterBoss = true;

  Object.values(unit.forms || {}).forEach(form => {
    form.name = "ガンダム";
  });

  return unit;
}

function getSelectedCompanionUnit(save) {
  const companionId = save.createUnits?.proto_create_gundam?.lab?.companion || "none";
  if (companionId === "none") return null;
  if (save.companionUnits?.[companionId]?.unlocked !== true) return null;

  const unit = STORY_COMPANION_UNIT_MAP[companionId];
  return unit ? clone(unit) : null;
}

export function createStoryChapterBossController(ctx) {
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
      <div id="storyDialogueText" style="white-space:pre-wrap;line-height:1.8;max-width:720px;"></div>
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

  function unlockGundamBossRewards() {
    const save = loadStorySave();

    save.flags.chapterBossUnlocked = false;
    save.flags.chapterBossGundamCleared = true;
    save.flags.chapter2Cleared = true;
    save.flags.learningBattleUnlocked = true;
    save.flags.gaBattleUnlocked = true;
    save.flags.createGundamLiberalUnlocked = true;
    save.flags.createGundamLiberalLabUnlocked = true;

    if (!save.liberal) {
      save.liberal = {
        unlocked: false,
        activeGaUnitId: "none",
        customName: "クリエイトガンダムリベラル",
        customLabels: { slot: {}, equipment: {}, skill: {} },
        gaUnits: {}
      };
    }

    save.liberal.unlocked = true;
    if (!save.liberal.gaUnits) save.liberal.gaUnits = {};
    save.liberal.gaUnits.cpu_gundam_mc = {
      unlocked: true,
      sourceUnitId: "cpu_gundam_mc",
      displayName: "ガンダム"
    };

    saveStorySave(save);
  }

    function startGundamBoss() {
    const save = loadStorySave();
    const bossUnit = createCpuGundamBossUnit();
    const protoUnit = getStoryCreateUnit("proto_create_gundam");
    const companionUnit = getSelectedCompanionUnit(save);

    const allyUnits = companionUnit ? [protoUnit, companionUnit] : [protoUnit];

    ctx.startStoryFreeBattle?.({
      mode: companionUnit ? "2v1boss" : "1v1boss",
      allowModeSwitch: false,
      exitLabel: "チャプターボスを中断",
      allyUnits,
      enemyUnits: [bossUnit],
      onWin: renderGundamBossVictory,
      onLose: renderGundamBossDefeat,
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
    }

  function renderGundamBossDefeat() {
    const root = createRoot();

    root.innerHTML = `
      <div style="white-space:pre-wrap;line-height:1.8;max-width:720px;">
AI「うう…さすがガンダム、簡単には勝たせてくれませんね…。
準備を整えて、もう一度挑みましょう！」
      </div>
      <button id="storyGundamBossRetryBtn">再挑戦</button>
      <button id="storyGundamBossBackBtn">戻る</button>
    `;

    document.getElementById("storyGundamBossRetryBtn")?.addEventListener("click", startGundamBoss);
    document.getElementById("storyGundamBossBackBtn")?.addEventListener("click", () => ctx.renderStoryMainMenu?.());
  }

  function renderGundamBossVictory() {
    unlockGundamBossRewards();

    renderDialogue([
      "AI「…やりましたね！ガンダムを倒しました！」",
      "AI「これで私たちはガンダムのデータを手に入れることができました！\nその甲斐があり、まだ不完全ですが、新しい機能を手に入れましたよ！」",
      "[クリエイトガンダムリベラル]が解禁されました。",
      "AI「その名も[クリエイトガンダムリベラル]！\nしかし、その名も、武器も、装備品も、姿形を変えて運用可能な機体なのです！」",
      "AI「武装や装備品はプロトクリエイトガンダムの持つものをそのまま活かせますが、例えば機体の名前を変えて【マジ〇ガーZ】にしたり、【鉄〇2‪〇‬号】にしたり、武装名を【ロケットパ〇チ】に変えたりすることも可能です！」",
      "AI「しかも、この機体で倒した特別な機体を、元の性能のまま扱うことが可能です！そのためのGAデータを取得しましたので、クリエイトガンダムラボから確認してください！」",
      "AI「さて、私たちの目標はもっと先ですよ！とりあえず、まだ私たちでも勝てそうな機体たちを倒して力を蓄えましょう！」",
      "チャプター2クリア"
    ], () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  return {
    startGundamBoss
  };
}
