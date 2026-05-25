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

  function applyDisplaySuffixToState(state, profile) {
    if (!state) return;

    state.displaySuffix = ctx.getUnitTrophyText(profile, state.unitId);
    delete state.displayName;
  }

  function applyBattleDisplayNames() {
    const profile = ctx.getPlayerProfile();

    applyDisplaySuffixToState(ctx.getPlayerAState(), profile);
    applyDisplaySuffixToState(ctx.getPlayerBState(), null);

    const teamA = ctx.getTeamA();
    const teamB = ctx.getTeamB();

    if (teamA) {
      applyDisplaySuffixToState(teamA.unit1, profile);
      applyDisplaySuffixToState(teamA.unit2, profile);
    }

    if (teamB) {
      applyDisplaySuffixToState(teamB.unit1, null);
      applyDisplaySuffixToState(teamB.unit2, null);
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
