export function executeCommonSpecial(state, specialKey) {
  const special = state.specials[specialKey];

  if (!special) {
    return {
      handled: true,
      redraw: false,
      message: "特殊行動データが見つからない"
    };
  }

  if (special.effectType === "shield") {
    if (state.shieldCount <= 0) {
      return {
        handled: true,
        redraw: false,
        message: "シールドはもう使えない"
      };
    }

    if (state.shieldActive) {
      return {
        handled: true,
        redraw: false,
        message: "シールドは既に展開中"
      };
    }

    state.shieldActive = true;
    state.shieldCount--;

    return {
      handled: true,
      redraw: true,
      message: `${state.name} シールド展開。このターンの被ダメージ半減`
    };
  }

  return {
    handled: false,
    redraw: false,
    message: null
  };
}
