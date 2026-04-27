export function create2v2Helpers({
  getBattleMode,
  getTeam
}) {
  function isUnifiedTeam(playerKey) {
    const team = getTeam(playerKey);
    return getBattleMode() === "2v2" && team && team.mode === "unified";
  }

  function getUnifiedEvade(team) {
    if (!team) return 0;
    return Math.max(0, team.unit1?.evade || 0) + Math.max(0, team.unit2?.evade || 0);
  }

  function consumeUnifiedEvade(team, amount) {
    if (!team) return false;

    let need = Math.max(0, Number(amount || 0));
    if (need <= 0) return true;
    if (getUnifiedEvade(team) < need) return false;

    for (const unit of [team.unit1, team.unit2]) {
      if (!unit || need <= 0) continue;

      const pay = Math.min(unit.evade || 0, need);
      unit.evade -= pay;
      need -= pay;
    }

    return need <= 0;
  }

  function withUnifiedEvadeForCheck(playerKey, actor, callback) {
    if (!isUnifiedTeam(playerKey) || !actor) {
      return callback();
    }

    const team = getTeam(playerKey);
    const backup = actor.evade;

    actor.evade = getUnifiedEvade(team);
    const result = callback();
    actor.evade = backup;

    return result;
  }

  return {
    isUnifiedTeam,
    getUnifiedEvade,
    consumeUnifiedEvade,
    withUnifiedEvadeForCheck
  };
}
