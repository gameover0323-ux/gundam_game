export function createUnitLookupController(ctx) {
  function getUnitNameById(unitId) {
    const unit = ctx.getAllUnits().find(u => u.id === unitId);
    return unit ? unit.name : unitId;
  }

  function getUnitById(unitId) {
    return ctx.getAllUnits().find(unit => unit.id === unitId) || null;
  }

  function getUnitDisplayNameWithTrophy(unit, profile) {
    if (!unit) return "";
    return `${unit.name}${ctx.getUnitTrophyText(profile, unit.id)}`;
  }

  function applyBattleDisplayNames() {
    const profile = ctx.getPlayerProfile();

    const playerAState = ctx.getPlayerAState();
    const playerBState = ctx.getPlayerBState();
    const teamA = ctx.getTeamA();
    const teamB = ctx.getTeamB();

    if (playerAState) {
      playerAState.displayName = getUnitDisplayNameWithTrophy(playerAState, profile);
    }

    if (playerBState) {
      playerBState.displayName = getUnitDisplayNameWithTrophy(playerBState, null);
    }

    if (teamA) {
      if (teamA.unit1) teamA.unit1.displayName = getUnitDisplayNameWithTrophy(teamA.unit1, profile);
      if (teamA.unit2) teamA.unit2.displayName = getUnitDisplayNameWithTrophy(teamA.unit2, profile);
    }

    if (teamB) {
      if (teamB.unit1) teamB.unit1.displayName = getUnitDisplayNameWithTrophy(teamB.unit1, null);
      if (teamB.unit2) teamB.unit2.displayName = getUnitDisplayNameWithTrophy(teamB.unit2, null);
    }
  }

  function syncExtraUnlockedUnitsFromProfile() {
    const profile = ctx.getPlayerProfile();

    if (!profile?.unlocks) {
      ctx.setExtraUnlockedUnits([]);
      return;
    }

    const extraUnlockedUnits = Object.entries(profile.unlocks)
      .filter(([, unlocked]) => unlocked)
      .map(([unlockKey]) => ctx.getUnlockableUnitMap()[unlockKey])
      .filter(Boolean)
      .map(unitId => getUnitById(unitId))
      .filter(Boolean);

    ctx.setExtraUnlockedUnits(extraUnlockedUnits);
  }

  return {
    getUnitNameById,
    getUnitById,
    getUnitDisplayNameWithTrophy,
    applyBattleDisplayNames,
    syncExtraUnlockedUnitsFromProfile
  };
}
