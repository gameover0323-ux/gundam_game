export function createBattleOutcomeController(ctx) {
  function isUnitDefeated(unit) {
    return !unit || unit.hp <= 0;
  }

  function isSideDefeated(playerKey) {
    if (ctx.isTeamBattleMode()) {
      const team = ctx.getTeam(playerKey);
      if (!team) return true;

      if (team.mode === "unified") {
        const unified = team.unified || {};
        const unifiedHp =
          Math.max(0, Number(unified.baseHpA || 0)) +
          Math.max(0, Number(unified.baseHpB || 0)) +
          Math.max(0, Number(unified.healA || 0)) +
          Math.max(0, Number(unified.healB || 0)) -
          Math.max(0, Number(unified.totalDamage || 0));

        return unifiedHp <= 0;
      }

      const unit1Dead = isUnitDefeated(team.unit1);
      const unit2Dead = team.unit2 ? isUnitDefeated(team.unit2) : true;
      return unit1Dead && unit2Dead;
    }

    return isUnitDefeated(ctx.getPlayerStateRaw(playerKey));
  }

  function finishBattle(winnerPlayer) {
    if (ctx.handleBattleFinishOverride?.(winnerPlayer) === true) {
      return;
    }

    ctx.recordBattleResultIfNeeded(winnerPlayer).catch(error => {
      console.error("戦績保存に失敗しました", error);
    });

    const popup = document.getElementById("popup");
    if (!popup) return;

    popup.innerHTML = "";

    const message = document.createElement("div");
    message.innerHTML = `PLAYER ${winnerPlayer} の勝利！`;

    const button = document.createElement("button");
    button.textContent = "タイトルへ戻る";
    button.addEventListener("click", () => {
      popup.style.display = "none";
      popup.innerHTML = "";
      ctx.resetBattleAfterFinish();
      ctx.showTitle();
    });

    popup.appendChild(message);
    popup.appendChild(button);
    popup.style.display = "block";
  }

  function checkBattleEnd() {
    if (isSideDefeated("A")) {
      finishBattle("B");
      return true;
    }

    if (isSideDefeated("B")) {
      finishBattle("A");
      return true;
    }

    return false;
  }

  return {
    isUnitDefeated,
    isSideDefeated,
    finishBattle,
    checkBattleEnd
  };
}
