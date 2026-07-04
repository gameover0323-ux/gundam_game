export function getMetalChikamochiDerivedState(state) {
  const orangeCount = Number(state?.metalChikamochiOrangeCount || 0);

  return {
    name: null,
    slots: {},
    specials: {},
    status: [
      { text: "全ダメージ1化", color: "#ffcc66", bold: true },
      { text: `みかん:${orangeCount}/3`, color: orangeCount >= 3 ? "#66ff66" : "#ffcc66", bold: true }
    ]
  };
}

function ensureMetalChikamochiState(state) {
  if (!state) return;
  if (typeof state.metalChikamochiOrangeCount !== "number") state.metalChikamochiOrangeCount = 0;
  if (typeof state.metalChikamochiStretched !== "boolean") state.metalChikamochiStretched = false;
}

export function onMetalChikamochiBeforeSlot(state, slotNumber, context = {}) {
  ensureMetalChikamochiState(state);

  if (Number(slotNumber) === 4) {
    if (Math.random() < 0.3) {
      return {
        redraw: true,
        message: "メタルちかもち「にげるのだ」",
        forceBattleEnd: {
          winnerPlayer: context.enemyPlayer || "A"
        }
      };
    }

    return {
      redraw: true,
      message: "メタルちかもち「にげそこねたのだ」"
    };
  }

  if (Number(slotNumber) === 5) {
    if (!state.metalChikamochiStretched) {
      state.metalChikamochiStretched = true;
      state.maxHp = Math.max(1, Number(state.maxHp || 100) * 2);
      state.hp = Math.max(1, Number(state.hp || 0) * 2);

      return {
        redraw: true,
        message: "メタルちかもちがのびたのだ。HP最大値が倍化した。"
      };
    }

    return {
      redraw: true,
      message: "メタルちかもちはもうのびている。"
    };
  }

  if (Number(slotNumber) === 6) {
    state.metalChikamochiOrangeCount = Math.min(3, Number(state.metalChikamochiOrangeCount || 0) + 1);

    const messages = [
      "プレイヤーは、みかんを買いに行った。",
      "プレイヤーは、みかんを調達してきた。",
      "プレイヤーは、みかんを剥いてメタルちかもちにあげた。<br>メタルちかもち「うめーのだ」"
    ];

    return {
      redraw: true,
      message: messages[state.metalChikamochiOrangeCount - 1] || null
    };
  }

  return { redraw: false, message: null };
}

export function onMetalChikamochiAfterSlotResolved(state) {
  ensureMetalChikamochiState(state);

  if (state.metalChikamochiOrangeCount >= 3) {
    return {
      redraw: true,
      message: "メタルちかもちと和解できそうだ。",
      requestChoice: {
        choiceType: "buttons",
        effectType: "metal_chikamochi_peace_choice",
        title: "メタルちかもちと和解しますか？",
        choices: [
          { label: "和解する", value: "peace" }
        ]
      }
    };
  }

  return { redraw: false, message: null };
}

export function onMetalChikamochiResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  if (pendingChoice?.effectType !== "metal_chikamochi_peace_choice") {
    return { handled: false };
  }

  if (selectedValue !== "peace") {
    return { handled: true, redraw: false, message: null };
  }

  return {
    handled: true,
    redraw: true,
    message: "メタルちかもちと和解した。",
    forceBattleEnd: {
      winnerPlayer: context.enemyPlayer || "A"
    }
  };
}

export function modifyMetalChikamochiTakenDamage(defender, attacker, attack, damage) {
  const original = Math.max(0, Number(damage || 0));
  if (original <= 0) return { damage: original, message: null };

  return {
    damage: 1,
    message: "メタルちかもちの特性：受けるダメージが1になった。"
  };
}
