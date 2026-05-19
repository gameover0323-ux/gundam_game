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

  const total =
    Math.max(0, team.unit1?.evade || 0) +
    Math.max(0, team.unit2?.evade || 0);

  return Math.floor(total / 2);
}

function consumeUnifiedEvade(team, amount) {
  if (!team) return false;

  const useCount = Math.max(0, Number(amount || 0));
  if (useCount <= 0) return true;

  const requiredTotal = useCount * 2;

  const unit1Evade = Math.max(0, team.unit1?.evade || 0);
  const unit2Evade = Math.max(0, team.unit2?.evade || 0);

  if (unit1Evade + unit2Evade < requiredTotal) {
    return false;
  }

  let remain = requiredTotal;

  const normalPay1 = Math.min(unit1Evade, useCount);
  team.unit1.evade -= normalPay1;
  remain -= normalPay1;

  const normalPay2 = Math.min(unit2Evade, useCount);
  team.unit2.evade -= normalPay2;
  remain -= normalPay2;

  if (remain > 0) {
    const extraPay1 = Math.min(Math.max(0, team.unit1.evade || 0), remain);
    team.unit1.evade -= extraPay1;
    remain -= extraPay1;
  }

  if (remain > 0) {
    const extraPay2 = Math.min(Math.max(0, team.unit2.evade || 0), remain);
    team.unit2.evade -= extraPay2;
    remain -= extraPay2;
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
