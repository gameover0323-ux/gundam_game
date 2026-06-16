export function createGameSetup(ctx) {
  const PLAYABLE_UNIT_DESCRIPTIONS = {
    "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)": `強さ☆☆☆
回避を消費した追加行動、
読み成功で回避数補充、
終盤の押し込みや足掻きの出来る
堅実な機体。
ポテンシャルが引き出せれば
更に上位の機体と戦える。`,

    "Zガンダム": `強さ☆☆☆
ウェイブライダー変形による回避所持数
大幅補填が可能であり、各種のスロット
強化による搦手も豊富。
また、バイオセンサー発動時の防御性能、
高い攻撃力、回避消滅効果が魅力。
運用と運次第で格上とも渡り合える。`,

    "シャイニングガンダム": `強さ☆☆☆
スーパーモードを発動するまでは貧弱。
スーパーモード中は強さが飛躍的に上がる。
さらに、条件を達成して明鏡止水を
発動すれば、その性能は☆☆☆☆をも
圧倒するほど。`,

    "ウイングガンダムゼロ": `強さ☆☆☆☆
ゼロシステム2種による強力なバフ効果、
ツインバスターライフルの決め撃ち性能、
変形、そして変形中6EXで回避を
倍加して立ち回る、☆☆☆☆の中でも
安定を求めたスタイルの機体。
ゼロシステム中は被ダメが増加し、
撃たれ弱いため、被弾しないように
立ち回る必要がある。`,

"V2ガンダム": `強さ☆☆☆☆☆
通常形態も標準的に強いものの、
各換装先もかなりの鬼畜性能。
デメリット効果もうまくうち消せば
隙のないヤバ機体である。
☆☆☆☆☆機体全般に言える事だが
☆☆☆機体以下相手にはいじめに
なるかもしれない…。`,    
    "ストライクガンダム": `強さ☆☆☆
ストライカーパックを交換しながら
状況に対応する機体。エールで覚醒、
ソードで決めに行き、ランチャーで
火力を取る。
初手ターンは生ストライクなので注意。
S.E.E.D.覚醒をどう活かすかが決め手。`,


    "フリーダムガンダム": `強さ☆☆☆☆
☆☆☆☆機体の中では最高峰。
覚醒中の性能は群を抜いており、
扱いと出目しだいでは格上の
機体に渡り合う。攻撃回数が
少なめだが、代償で回数を
増やせるため、ここぞと言う時に
狩り取れる。`,
  "ガンダムエクシア": `強さ☆☆☆
慎重に攻めるか、大胆に攻めるか。
回避を増やして相手を翻弄するか。
ハイリスクハイリターンの攻めが
得意な機体。また、心もとないが
エクシアリペアでの粘りも可能。
俺がガンダムだ。`,
    
    "ジェガンD型": `強さ☆☆☆
本当は強さ☆☆だが、しっかり考えた
運用を行えば格上と渡り合える、
自由度が高い代わりに性能が低い
玄人向け機体。
全てを熟知して扱えば☆☆☆☆にも
迫ることができる。`,

    "ユニコーンガンダム": `強さ☆☆☆☆
ビームマグナムによる回避の強制、
強力なNT-Dで立ち回る機体。普段も
そこまで貧弱ではないが、本当に
決めに行くのであれば、回避を特殊
行動で使用し、覚醒値を溜めて
NT-D覚醒を決めに行こう。`,

      "ガンダム・バルバトス(第4形態)": `強さ☆☆☆
HPがもりもり減る代わりに回避に
特化した機体。常に相手に多く
ダメージを重ねなければ苦しい
試合になるが、耐性による相性も
押し付けて試合を優位に進めよう。`,
"ガンダム・エアリアル": `強さ☆☆☆☆
非常に高い回避性能、無効化性能を
持ち、HP実数値より遥かに高い防御
性能をもつ。自動的に保護してくれる
システムが多いため、プレイヤーが
考えることも少なく、手数も火力も
高めである。`,
    
    "ヅダ": `強さ☆☆
高機動を活かした戦術を取る機体。
回避をリソースに色々なことができ、
活用次第では格上を上回る戦闘が
可能。しかし、ふとした時に加速が
高まりすぎて自爆してしまう。`,
  };

  const CPU_UNIT_DESCRIPTIONS = {
    "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)": `難易度☆☆☆☆
よく避け、よく撃ち、粘る、
とても嫌らしい相手。
必中や回避消滅などがあると
相手にしやすい。
最後のラストシューティングには
注意すべし。`,

    "Zガンダム": `難易度☆☆☆
バイオセンサーになるまでは注意すれば
そこまで驚異ではない。
しかし、バイオセンサーになった時は
選択を間違えると一気にゲームオーバー
になる可能性もある。`,

    "シャイニングガンダム": `難易度☆☆☆
非常に火力が高く、連撃性能が高い。
スーパーモードになった時は強力な
攻撃が来ても対処できるように
備えておこう。
明鏡止水になったら早めに潰さないと
強力なトドメが来るぞ。`,

    "ウイングガンダムゼロ": `難易度☆☆☆☆
よく避け、よく当てる。
しかし、ゼロシステム中はダメージが
増加するので、回避ができない状態
の時に畳かけよう。
しかし油断すると極大のダメージを
放ってくる。`,

"V2ガンダム": `難易度☆☆☆☆☆
容赦ない換装攻撃、隙のない技、
最強性能のアサルトバスター。
アサルト、バスター、キャノンは
上手くやれば対処できるが、
全装備は基本誰にも手に負えない。
何とかやり過ごし、チャンスを探ろう`,
    
    "ストライクガンダム": `難易度☆☆☆
色々な形態にランダムで切り替えながら
戦闘してくる。その時々の形態に
合わせてよく対処すればそれほど
難しい相手ではないはず。
しかし、耐久も高く、よく粘る。`,


    "フリーダムガンダム": `難易度☆☆☆☆
覚醒中を凌げばそこまで苦労は
しないかもしれないが、単発の
攻撃が重く、かつ行動回数を
増やしてくると厄介な相手。
常に相手の回避を狩り取れるように
攻撃を続けよう。`,
 "ガンダムエクシア": `難易度☆☆☆
大胆に攻めてくる機体。
しかし、上手く崩せば打たれ弱く、
競り勝つことさえ意識出来れば
早期決着が狙えるかもしれない。
守るとボコボコにされるだろう。`,
    
    "ジェガンD型": `難易度☆☆
人が使わなければこんなもの
みたいな強さをしている。
しかし、換装時のステータスをよく
知らないと、手痛い一撃が
くるかもしれない。`,

    "ユニコーンガンダム": `難易度☆☆☆☆
回避が困難かつ、非常に火力が高い。
デストロイモードの時に大量に攻撃をしかけないと、回避を保有している数だけ
強力な攻撃を放ってくる。
覚醒形態になった時は選択を
間違わないように。`,

    "ガンダム・バルバトス(第4形態)": `難易度☆☆☆
勝手にHPが減っていくので、
上手く立ち回ればダメージは
優位にたてるはず。
しかし、油断すると手痛い
反撃を受けることになる。`,
    
 "ガンダム・エアリアル": `難易度☆☆☆☆
非常に回避性能と無効化性能が高く、
攻撃を通すのは一筋縄ではいかない。
しかし、攻撃を通すことができれば
瞬殺できる数値のため、回避がない時
多くの手数を出せば勝ち目はある。
火力も高いため注意。`,
    
"ヅダ": `難易度☆☆
回避を扱って厄介な戦闘をしてくる
機体。回避を上手く消費させれば
そこまで性能の高い相手では無いが
行動回数が増えている時は注意。
運が良ければ勝手に自爆するかも？`,
    
    "ザクⅡ(一般兵)": `難易度☆
論外級に弱いザコ。
まずはこいつを相手にして、機体の
性能を知ろう。
真価を発揮する前に撃墜してしまう
可能性も高い…。`,

    "グフ": `難易度☆☆
若干火力が高く、食らうと若干ムカつく
技を放ってくるザコ。
しかし真面目に戦えばそこまで強くは
無いので、油断せずに立ち向かおう。`,

    "モビルジン": `難易度☆☆☆
いつ避けるか、いつ食らうかを判断
出来なければやられる、そんな敵。
相手はコーディネイターなので、
油断せずに戦おう。
慣れた人なら相手にならないだろう。`
  };

  const BOSS_UNIT_DESCRIPTIONS = {
    "デビルガンダム(第1形態)": `難易度 ☆☆☆☆☆
第1形態→ランタオ島形態→最終形態
に体力変動で進化するボス。
体力の回復量がとんでもなく、
火力が足りなければ削りきれない。
最終形態ではあと一歩の押し込みを
用意していなければ祈るしかない。
勝利するとボストロフィー[D]が
手に入る。`,

    "エクストリームガンダム": `難易度☆☆☆☆☆
    ランダムで強力なフェイズ換装を行う
エクバのボス。HPの量は原作準拠。
共通耐久を減らし、換装解除したタイミングで攻撃を当てて倒そう。
カルネージはダメージ軽減
タキオンは時限強化
イグニスは回避性能
ミスティックは最強性能。
勝利するとボストロフィー[EX]が
手に入る。`
  };

  function isChallengeMode() {
    return ctx.getBattleMode() === "challenge1v1" ||
      ctx.getBattleMode() === "challenge2v2" ||
      ctx.getBattleMode() === "vscpu1v1" ||
      ctx.getBattleMode() === "vscpu2v2";
  }

  function isVsCpuMode() {
    return ctx.getBattleMode() === "vscpu1v1" ||
      ctx.getBattleMode() === "vscpu2v2";
  }

  function isSelectableEnemy2v2() {
    return ctx.getBattleMode() === "challenge2v2" ||
      ctx.getBattleMode() === "vscpu2v2";
  }

  function isOnlineMode() {
    return ctx.getBattleMode && String(ctx.getBattleMode()).startsWith("online");
  }

  function isTeamSelectMode() {
    return (
      ctx.getBattleMode() === "2v2" ||
      ctx.getBattleMode() === "challenge2v2" ||
      ctx.getBattleMode() === "vscpu2v2" ||
      ctx.getBattleMode() === "online2v2"
    );
  }

  function getPendingUnit() {
    return typeof ctx.getPendingSelectedUnit === "function"
      ? ctx.getPendingSelectedUnit()
      : null;
  }

  function setPendingUnit(unit) {
    if (typeof ctx.setPendingSelectedUnit === "function") {
      ctx.setPendingSelectedUnit(unit);
    }
  }

  function getDebugUnits() {
    return Array.isArray(ctx.debugUnits) ? ctx.debugUnits : [];
  }

  function canUseDebugUnit() {
    return typeof ctx.canUseDebugUnit === "function" && ctx.canUseDebugUnit();
  }

  function getSelectList() {
    const extraUnits = typeof ctx.getExtraUnlockedUnits === "function"
      ? ctx.getExtraUnlockedUnits()
      : [];

    if (!isChallengeMode()) {
      return isOnlineMode() ? ctx.units : [...ctx.units, ...extraUnits];
    }

    if (isVsCpuMode() && ctx.getSelectingPlayer() === "B") {
      return [
        ...(ctx.cpus || []),
        ...(ctx.cpuBeginnerList || [])
      ];
    }

    if (ctx.getSelectingPlayer() === "B") {
      return ctx.bosses || [];
    }

    return ctx.units;
  }

  function getUnitDescription(unit) {
    if (!unit) return "";

    const mode = ctx.getBattleMode();
    const selectingPlayer = ctx.getSelectingPlayer();
    const name = unit.name;

    if (
      selectingPlayer === "B" &&
      (mode === "vscpu1v1" || mode === "vscpu2v2")
    ) {
      return CPU_UNIT_DESCRIPTIONS[name] || "";
    }

    if (
      selectingPlayer === "B" &&
      (mode === "challenge1v1" || mode === "challenge2v2")
    ) {
      return BOSS_UNIT_DESCRIPTIONS[name] || "";
    }

    return PLAYABLE_UNIT_DESCRIPTIONS[name] || "";
  }

  function ensureSelectDescriptionBox() {
    let box = document.getElementById("selectedUnitDescription");
    if (box) return box;

    box = document.createElement("div");
    box.id = "selectedUnitDescription";
    box.style.margin = "16px auto 0";
    box.style.maxWidth = "520px";
    box.style.padding = "12px 14px";
    box.style.border = "2px solid #777";
    box.style.borderRadius = "10px";
    box.style.background = "#111";
    box.style.color = "#fff";
    box.style.fontSize = "15px";
    box.style.lineHeight = "1.55";
    box.style.whiteSpace = "pre-line";
    box.style.textAlign = "left";
    box.style.display = "none";

    if (ctx.confirmSelectedUnitBtn && ctx.confirmSelectedUnitBtn.parentNode) {
      ctx.confirmSelectedUnitBtn.insertAdjacentElement("afterend", box);
    } else if (ctx.unitButtons && ctx.unitButtons.parentNode) {
      ctx.unitButtons.parentNode.insertBefore(box, ctx.unitButtons);
    }

    return box;
  }

  function updateSelectDescription() {
    const box = ensureSelectDescriptionBox();
    const pending = getPendingUnit();
    const description = getUnitDescription(pending);

    if (!pending || !description) {
      box.style.display = "none";
      box.textContent = "";
      return;
    }

    box.style.display = "";
    box.textContent = `${pending.name}\n${description}`;
  }

  function makeUnitButton(unit) {
    const btn = document.createElement("button");
    btn.textContent = unit.name;
    btn.addEventListener("click", () => {
      setPendingUnit(unit);
      updateSelectUi();
    });
    return btn;
  }

  function setupFixedButtons() {
    if (ctx.confirmSelectedUnitBtn) {
      ctx.confirmSelectedUnitBtn.onclick = () => {
        const unit = getPendingUnit();
        if (!unit) return;
        setPendingUnit(null);
        selectUnit(unit);
      };
    }

    if (ctx.backFromSelectBtn) {
      ctx.backFromSelectBtn.onclick = () => {
        setPendingUnit(null);
        if (typeof ctx.showTitle === "function") {
          ctx.showTitle();
        }
      };
    }
  }

  function loadUnitButtons() {
    ctx.unitButtons.innerHTML = "";

    function appendUnitSection(titleText, units, className) {
      if (!units || units.length <= 0) return;

      const section = document.createElement("div");
      section.className = className;

      const title = document.createElement("div");
      title.className = "selectSectionTitle";
      title.textContent = titleText;

      const buttonArea = document.createElement("div");
      buttonArea.className = "selectSectionButtons";

      units.forEach(unit => {
        buttonArea.appendChild(makeUnitButton(unit));
      });

      section.appendChild(title);
      section.appendChild(buttonArea);
      ctx.unitButtons.appendChild(section);
    }

    if (isVsCpuMode() && ctx.getSelectingPlayer() === "B") {
      appendUnitSection("CPU機体", ctx.cpus || [], "cpuNormalSection");
      appendUnitSection("初心者向けCPU", ctx.cpuBeginnerList || [], "cpuBeginnerSection");
    } else {
      const normalUnits = getSelectList();
      const debugUnits = canUseDebugUnit() && !isOnlineMode() ? getDebugUnits() : [];

      appendUnitSection("プレイアブル機体", normalUnits, "playableSection");

      if (debugUnits.length > 0) {
        appendUnitSection("デバッグ権限", debugUnits, "debugUnitSection");
      }
    }

    if (isSelectableEnemy2v2() && ctx.getSelectingPlayer() === "B") {
      const decideBtn = document.createElement("button");
      decideBtn.textContent = "この編成で開始";
      decideBtn.addEventListener("click", () => {
        const teamB = ctx.getTeamB();
        const enemyList = teamB?.units || [];
        if (enemyList.length < 1) return;
        startChallengePreview2v2(ctx.getTeamA().units, enemyList);
      });
      ctx.unitButtons.appendChild(decideBtn);
    }

    setupFixedButtons();
    ensureSelectDescriptionBox();
    updateSelectUi();
  }

  function updateSelectUi() {
    const pending = getPendingUnit();

    if (ctx.confirmSelectedUnitBtn) {
      ctx.confirmSelectedUnitBtn.disabled = !pending;
      ctx.confirmSelectedUnitBtn.textContent = pending ? `${pending.name} に決定` : "決定";
    }

    if (ctx.selectGuide) {
      if (ctx.getBattleMode() === "challenge1v1") {
        ctx.selectGuide.textContent = ctx.getSelectingPlayer() === "A"
          ? "PLAYER A の機体を選択"
          : "チャレンジボスを選択";
   } else if (isTeamSelectMode()) {
      ctx.selectGuide.textContent = ctx.getSelectingPlayer() === "A"
        ? "PLAYER A チームの機体を2機選択"
        : ctx.getBattleMode() === "vscpu2v2"
          ? "CPUチームの機体を選択（1体だけならこの編成で開始）"
          : ctx.getBattleMode() === "challenge2v2"
            ? "チャレンジボスを選択（1体だけならこの編成で開始）"
            : "PLAYER B チームの機体を2機選択";
      } else {
        ctx.selectGuide.textContent = ctx.getSelectingPlayer() === "A"
          ? "PLAYER A の機体を選択"
          : "PLAYER B の機体を選択";
      }
    }

    if (ctx.selectedUnitsPreview) {
      if (isTeamSelectMode()) {
        const teamA = ctx.getTeamA();
        const teamB = ctx.getTeamB();
        const aList = teamA?.units || [];
        const bList = teamB?.units || [];

        const aText = aList.length > 0
          ? `PLAYER A: ${aList.map(u => u.name).join(" / ")}`
          : "PLAYER A: 未選択";

        const bLabel = ctx.getBattleMode() === "challenge2v2"
          ? "BOSS"
          : ctx.getBattleMode() === "vscpu2v2"
            ? "CPU"
            : "PLAYER B";

        const bText = bList.length > 0
          ? `${bLabel}: ${bList.map(u => u.name).join(" / ")}`
          : `${bLabel}: 未選択`;

        const pendingText = pending ? `<br>選択中: ${pending.name}` : "";
        ctx.selectedUnitsPreview.innerHTML = `${aText}<br>${bText}${pendingText}`;
        updateSelectDescription();
        return;
      }

      const a = ctx.getSelectedUnitA();
      const b = ctx.getSelectedUnitB();

      const aText = a ? `PLAYER A: ${a.name}` : "PLAYER A: 未選択";

      const bLabel = ctx.getBattleMode() === "challenge1v1" ||
        ctx.getBattleMode() === "vscpu1v1"
        ? ctx.getBattleMode() === "vscpu1v1"
          ? "CPU"
          : "BOSS"
        : "PLAYER B";

      const bText = b ? `${bLabel}: ${b.name}` : `${bLabel}: 未選択`;
      const pendingText = pending ? `<br>選択中: ${pending.name}` : "";

      ctx.selectedUnitsPreview.innerHTML = `${aText}<br>${bText}${pendingText}`;
    }

    updateSelectDescription();
  }

  function selectUnit(unit) {
    if (ctx.onSelectUnit) {
      const handled = ctx.onSelectUnit(unit);
      if (handled) return;
    }

    const mode = ctx.getBattleMode();

    if (mode === "1v1") {
      if (ctx.getSelectingPlayer() === "A") {
        ctx.setSelectedUnitA(unit);
        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      ctx.setSelectedUnitB(unit);
      ctx.init1v1(ctx.getSelectedUnitA(), ctx.getSelectedUnitB());
      return;
    }

    if (mode === "vscpu1v1") {
      if (ctx.getSelectingPlayer() === "A") {
        ctx.setSelectedUnitA(unit);
        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      ctx.initChallenge1v1(ctx.getSelectedUnitA(), unit);
      return;
    }

    if (mode === "challenge1v1") {
      if (ctx.getSelectingPlayer() === "A") {
        ctx.setSelectedUnitA(unit);
        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      ctx.initChallenge1v1(ctx.getSelectedUnitA(), unit);
      return;
    }

    if (mode === "2v2") {
      if (!ctx.getTeamA()) ctx.setTeamA({ units: [] });
      if (!ctx.getTeamB()) ctx.setTeamB({ units: [] });

      if (ctx.getSelectingPlayer() === "A") {
        const teamA = ctx.getTeamA();
        teamA.units.push(unit);

        if (teamA.units.length < 2) {
          updateSelectUi();
          return;
        }

        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      const teamB = ctx.getTeamB();
      teamB.units.push(unit);

      if (teamB.units.length < 2) {
        updateSelectUi();
        return;
      }

      ctx.init2v2(ctx.getTeamA().units, ctx.getTeamB().units);
      return;
    }

    if (mode === "vscpu2v2") {
      if (!ctx.getTeamA()) ctx.setTeamA({ units: [] });
      if (!ctx.getTeamB()) ctx.setTeamB({ units: [] });

      if (ctx.getSelectingPlayer() === "A") {
        const teamA = ctx.getTeamA();
        teamA.units.push(unit);

        if (teamA.units.length < 2) {
          updateSelectUi();
          return;
        }

        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      const teamB = ctx.getTeamB();
      teamB.units.push(unit);

      if (teamB.units.length < 2) {
        updateSelectUi();
        return;
      }

      ctx.initChallenge2v2(ctx.getTeamA().units, ctx.getTeamB().units);
      return;
    }

    if (mode === "challenge2v2") {
      if (!ctx.getTeamA()) ctx.setTeamA({ units: [] });
      if (!ctx.getTeamB()) ctx.setTeamB({ units: [] });

      if (ctx.getSelectingPlayer() === "A") {
        const teamA = ctx.getTeamA();
        teamA.units.push(unit);

        if (teamA.units.length < 2) {
          updateSelectUi();
          return;
        }

        ctx.setSelectingPlayer("B");
        loadUnitButtons();
        return;
      }

      const teamB = ctx.getTeamB();
      teamB.units.push(unit);
      updateSelectUi();
    }
  }

  function startChallengePreview2v2(unitsA, bossUnits) {
    ctx.initChallenge2v2(unitsA, bossUnits);
  }

  return {
    loadUnitButtons,
    updateSelectUi
  };
        }
