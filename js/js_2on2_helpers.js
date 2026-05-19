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

  return (
    Math.max(0, Number(team.unit1?.evade || 0)) +
    Math.max(0, Number(team.unit2?.evade || 0))
  );
  }

function consumeUnifiedEvade(team, amount) {
  if (!team) return false;

  let remain = Math.max(0, Number(amount || 0));

  const total =
    Math.max(0, Number(team.unit1?.evade || 0)) +
    Math.max(0, Number(team.unit2?.evade || 0));

  if (total < remain) {
    return false;
  }

  while (remain > 0) {
    if ((team.unit1?.evade || 0) >= (team.unit2?.evade || 0)) {
      if (team.unit1.evade > 0) {
        team.unit1.evade -= 1;
        remain -= 1;
        continue;
      }
    }

    if (team.unit2?.evade > 0) {
      team.unit2.evade -= 1;
      remain -= 1;
      continue;
    }

    if (team.unit1?.evade > 0) {
      team.unit1.evade -= 1;
      remain -= 1;
      continue;
    }

    break;
  }

  return remain <= 0;
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
