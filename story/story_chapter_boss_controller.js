import { getStoryCreateUnit } from "./story_units.js";
import { loadStorySave, saveStorySave } from "./story_save.js";

import { gundam_mc } from "../js/js_units_gundam_mc.js";
import { story_zaku_ii_gene } from "../js/js_units_story_zaku_ii_gene.js";
import { story_zaku_ii_denim } from "../js/js_units_story_zaku_ii_denim.js";
import { story_ball } from "../js/js_units_story_ball.js";
import { story_gm } from "../js/js_units_story_gm.js";

import {
  story_guncannon,
  story_guntank,
  story_gyan,
  story_gouf_chapter3,
  story_psycho_gundam
} from "../js/js_units_story_chapter3.js";

import { CHAPTER3_ENDING_LINES } from "./story_chapter3_controller.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const STORY_COMPANION_UNIT_MAP = {
  story_zaku_ii_gene,
  story_zaku_ii_denim,
  story_ball,
  story_gm,
  story_guncannon,
  story_guntank,
  story_gyan,
  story_gouf_chapter3,
  story_psycho_gundam
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

function decorateChapterBossUnit(unit) {
  const cloned = clone(unit);
  cloned.storyChapterBoss = true;
  return cloned;
}

function getSelectedCompanionUnit(save) {
  const companionId = save.createUnits?.proto_create_gundam?.lab?.companion || "none";
  if (companionId === "none") return null;
  if (save.companionUnits?.[companionId]?.unlocked !== true) return null;

  const unit = STORY_COMPANION_UNIT_MAP[companionId];
  return unit ? clone(unit) : null;
}

function getChapter3BossStage(save) {
  const stage = Number(save.flags?.chapter3BossStage || 0);
  if (stage < 0) return 0;
  if (stage > 3) return 3;
  return stage;
}

function ensureCompanionEntry(save, unitId) {
  if (!save.companionUnits) save.companionUnits = {};
  if (!save.companionUnits[unitId]) save.companionUnits[unitId] = {};
  save.companionUnits[unitId].unlocked = true;
}

function unlockGundamBossRewards() {
  const save = loadStorySave();

  if (!save.flags) save.flags = {};
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

function unlockChapter3Stage1Rewards() {
  const save = loadStorySave();

  if (!save.flags) save.flags = {};
  save.flags.chapter3BossStage = 1;
  save.flags.chapter3LearningGuncannonGuntankUnlocked = true;

  saveStorySave(save);
}

function unlockChapter3Stage2Rewards() {
  const save = loadStorySave();

  if (!save.flags) save.flags = {};
  save.flags.chapter3BossStage = 2;
  save.flags.chapter3LearningGyanGoufUnlocked = true;

  saveStorySave(save);
}

function unlockChapter3Stage3Rewards() {
  const save = loadStorySave();

  if (!save.flags) save.flags = {};
  save.flags.chapter3BossStage = 3;
  save.flags.chapter3Cleared = true;
  save.flags.chapter3EndingViewed = true;
  save.flags.chapter3BossUnlocked = false;
  save.flags.chapter3LearningPsychoGundamUnlocked = true;

  saveStorySave(save);
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
      <div id="storyDialogueBox" style="
        width: min(720px, 96vw);
        border: 1px solid white;
        padding: 18px;
        background: rgba(0,0,0,0.9);
        font-size: 16px;
        line-height: 1.8;
        white-space: pre-wrap;
      ">
        <div id="storyDialogueText"></div>
        <button id="storyDialogueNextBtn" style="margin-top:16px;">次へ</button>
      </div>
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

  function startCurrentBoss() {
    const save = loadStorySave();

    if (save.flags?.chapter3BossUnlocked === true && save.flags?.chapter3Cleared !== true) {
      startChapter3Boss();
      return;
    }

    startGundamBoss();
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

  function startChapter3Boss() {
    const save = loadStorySave();
    const stage = getChapter3BossStage(save);

    if (stage === 0) {
      startChapter3Stage1Boss();
      return;
    }

    if (stage === 1) {
      startChapter3Stage2Boss();
      return;
    }

    if (stage === 2) {
      startChapter3Stage3Boss();
      return;
    }

    renderDialogue(["チャプター3は既に終了しています。"], () => ctx.renderStoryMainMenu?.());
  }

  function getChapterBossAllyUnits() {
    const save = loadStorySave();
    const protoUnit = getStoryCreateUnit("proto_create_gundam");
    const companionUnit = getSelectedCompanionUnit(save);
    return companionUnit ? [protoUnit, companionUnit] : [protoUnit];
  }

  function startChapter3Stage1Boss() {
    const allyUnits = getChapterBossAllyUnits();
    const enemyUnits = [
      decorateChapterBossUnit(story_guncannon),
      decorateChapterBossUnit(story_guntank)
    ];

    ctx.startStoryFreeBattle?.({
      mode: allyUnits.length >= 2 ? "2v2" : "1v2boss",
      allowModeSwitch: false,
      exitLabel: "ガンキャノン×ガンタンク戦を中断",
      allyUnits,
      enemyUnits,
      onWin: renderChapter3Stage1Victory,
      onLose: renderChapter3Stage1Defeat,
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startChapter3Stage2Boss() {
    const allyUnits = getChapterBossAllyUnits();
    const enemyUnits = [
      decorateChapterBossUnit(story_gyan),
      decorateChapterBossUnit(story_gouf_chapter3)
    ];

    ctx.startStoryFreeBattle?.({
      mode: allyUnits.length >= 2 ? "2v2" : "1v2boss",
      allowModeSwitch: false,
      exitLabel: "ギャン×グフ戦を中断",
      allyUnits,
      enemyUnits,
      onWin: renderChapter3Stage2Victory,
      onLose: renderChapter3Stage2Defeat,
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function startChapter3Stage3Boss() {
    const allyUnits = getChapterBossAllyUnits();
    const enemyUnits = [decorateChapterBossUnit(story_psycho_gundam)];

    ctx.startStoryFreeBattle?.({
      mode: allyUnits.length >= 2 ? "2v1boss" : "1v1boss",
      allowModeSwitch: false,
      exitLabel: "サイコ・ガンダム戦を中断",
      allyUnits,
      enemyUnits,
      onWin: renderChapter3Stage3Victory,
      onLose: renderChapter3Stage3Defeat,
      onCancel: () => ctx.renderStoryMainMenu?.()
    });
  }

  function renderGundamBossDefeat() {
    const root = createRoot();

    root.innerHTML = `
      <div style="white-space:pre-wrap;line-height:1.8;text-align:center;">
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
      "AI「武装や装備品はプロトクリエイトガンダムの持つものをそのまま活かせますが、例えば機体の名前を変えて〖マジ〇ガーZ〗にしたり、〖鉄〇2‪〇‬号〗にしたり、武装名を〖ロケットパ〇チ〗に変えたりすることも可能です！」",
      "AI「しかも、この機体で倒した特別な機体を、元の性能のまま扱うことが可能です！そのためのGAデータを取得しましたので、クリエイトガンダムラボから確認してください！」",
      "AI「さて、私たちの目標はもっと先ですよ！とりあえず、まだ私たちでも勝てそうな機体たちを倒して力を蓄えましょう！」",
      "チャプター2クリア"
    ], () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  function renderChapter3Stage1Defeat() {
    renderChapter3Defeat("ガンキャノン×ガンタンク", startChapter3Stage1Boss);
  }

  function renderChapter3Stage2Defeat() {
    renderChapter3Defeat("ギャン×グフ", startChapter3Stage2Boss);
  }

  function renderChapter3Stage3Defeat() {
    renderChapter3Defeat("サイコ・ガンダム", startChapter3Stage3Boss);
  }

  function renderChapter3Defeat(label, retryFn) {
    const root = createRoot();

    root.innerHTML = `
      <div style="white-space:pre-wrap;line-height:1.8;text-align:center;">
        AI「${label}、やはり手強いですね…！
        ショップと学習戦闘で準備を整えて、もう一度挑みましょう！」
      </div>
      <button id="storyChapter3BossRetryBtn">再挑戦</button>
      <button id="storyChapter3BossBackBtn">戻る</button>
    `;

    document.getElementById("storyChapter3BossRetryBtn")?.addEventListener("click", retryFn);
    document.getElementById("storyChapter3BossBackBtn")?.addEventListener("click", () => ctx.renderStoryMainMenu?.());
  }

  function renderChapter3Stage1Victory() {
    unlockChapter3Stage1Rewards();

    renderDialogue([
      "AI「ガンキャノンとガンタンク、撃破確認です！」",
      "AI「重装甲と支援砲撃のデータ、かなり使えそうですね！」",
      "ガンキャノン、ガンタンクが学習戦闘モードに追加されました。",
      "AI「次の時空刺客は、ギャンとグフです！近接寄りの妨害が厄介そうですよ！」"
    ], () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  function renderChapter3Stage2Victory() {
    unlockChapter3Stage2Rewards();

    renderDialogue([
      "AI「ギャンとグフ、撃破確認です！」",
      "AI「回避消滅や必中付与のデータを取れました。かなり嫌らしい戦術ですね！」",
      "ギャン、グフが学習戦闘モードに追加されました。",
      "AI「ですが、まだ時空の歪みは収まっていません…最後に巨大な反応があります！」",
      "AI「次はサイコ・ガンダムです。十分な準備をして挑みましょう！」"
    ], () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  function renderChapter3Stage3Victory() {
    unlockChapter3Stage3Rewards();

    renderDialogue([
      "サイコ・ガンダムを撃破しました。",
      "サイコ・ガンダムが学習戦闘モードに追加されました。",
      ...CHAPTER3_ENDING_LINES
    ], () => {
      ctx.renderStoryMainMenu?.();
    });
  }

  return {
    startGundamBoss,
    startChapter3Boss,
    startCurrentBoss
  };
}
