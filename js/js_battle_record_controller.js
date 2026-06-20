export function createBattleRecordController(ctx) {
  function getBattleRecordModeKey() {
    const battleMode = ctx.getBattleMode();

    if (battleMode === "online1v1" || battleMode === "online2v2") return "online";
    if (battleMode === "vscpu1v1" || battleMode === "vscpu2v2") return "cpu";
    return "offline";
  }

  function getOpponentCategoryForBattle() {
    const battleMode = ctx.getBattleMode();

    if (battleMode === "challenge1v1" || battleMode === "challenge2v2") return "boss";
    if (battleMode === "vscpu1v1" || battleMode === "vscpu2v2") return "cpu";
    return "playable";
  }

  function getOpponentCategoryByMode() {
    return getOpponentCategoryForBattle();
  }

  function getBattleRecordMode() {
    if (ctx.isOnlineEnabled()) return "online";
    return "offline";
  }

  function get2v2StatsModeKey() {
    return getBattleRecordModeKey();
  }

  function getUnitIdFromState(state) {
    return state?.unitId || state?.unit?.id || state?.id || "";
  }

  function getBossGroupIdFromState(state) {
    return state?.bossGroupId || state?.unit?.bossGroupId || state?.baseUnit?.bossGroupId || "";
  }

  function getTeamUnitIds(playerKey) {
    const team = ctx.getTeam(playerKey);
    if (!team) return [];

    return [team.unit1, team.unit2]
      .filter(Boolean)
      .map(unit => getUnitIdFromState(unit))
      .filter(Boolean);
  }

  function getDefeatedTeamRecordIds(team) {
    if (!team) return [];

    const units = [team.unit1, team.unit2].filter(Boolean);
    const unitIds = units.map(getUnitIdFromState).filter(Boolean);
    const groupIds = units.map(getBossGroupIdFromState).filter(Boolean);
    const uniqueGroupIds = [...new Set(groupIds)];

    if (
      uniqueGroupIds.length === 1 &&
      groupIds.length === units.length &&
      unitIds.length >= 2
    ) {
      return [uniqueGroupIds[0], ...unitIds];
    }

    return unitIds;
  }

  function get1v1UnitId(playerKey) {
    return getUnitIdFromState(ctx.getPlayerStateRaw(playerKey));
  }

  async function recordBattleResultIfNeeded(winnerPlayer) {
    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    const opponentCategory = getOpponentCategoryForBattle();
    const recordPlayer = ctx.isOnlineEnabled() && ctx.getOnlineMyPlayer()
      ? ctx.getOnlineMyPlayer()
      : "A";

    const opponentPlayer = ctx.getOpponentPlayer(recordPlayer);
    const result = winnerPlayer === recordPlayer ? "win" : "lose";

    if (ctx.isTeamBattleMode()) {
      const playerUnitIds = getTeamUnitIds(recordPlayer);
      const opponentTeam = ctx.getTeam(opponentPlayer);

      const defeatedUnitIds =
        ctx.getBattleMode() === "challenge2v2"
          ? getDefeatedTeamRecordIds(opponentTeam)
          : getTeamUnitIds(opponentPlayer);

      if (playerUnitIds.length === 0 || defeatedUnitIds.length === 0) return;

      await ctx.record2v2BattleResult({
        modeKey: get2v2StatsModeKey(),
        playerUnitIds,
        defeatedUnitIds,
        result,
        opponentCategory
      });

      return;
    }

    const playerUnitId = get1v1UnitId(recordPlayer);
    const opponentUnitId = get1v1UnitId(opponentPlayer);

    if (!playerUnitId || !opponentUnitId) return;

    await ctx.recordBattleResult({
      mode: getBattleRecordModeKey(),
      playerUnitId,
      opponentUnitId,
      opponentPlayerId: "",
      opponentCategory,
      result
    });
  }

  async function saveOnlineEncounteredPlayer(roomData) {
    if (!ctx.isOnlineEnabled()) return;
    if (ctx.getOnlineEncounterSaved()) return;

    const profile = ctx.getPlayerProfile();
    if (!profile) return;

    const mySide = ctx.getOnlineMyPlayer();
    if (mySide !== "A" && mySide !== "B") return;

    const enemySide = mySide === "A" ? "B" : "A";
    const enemy = roomData?.players?.[enemySide];

    if (!enemy?.profileId) return;
    if (enemy.profileId === profile.id) return;

    ctx.setOnlineEncounterSaved(true);
    ctx.setCurrentOnlineOpponentPlayerId(enemy.profileId);

    if (!profile.encounteredPlayers) profile.encounteredPlayers = {};

    const old = profile.encounteredPlayers[enemy.profileId] || {};

    profile.encounteredPlayers[enemy.profileId] = {
      profileId: enemy.profileId,
      profileName: enemy.profileName || old.profileName || enemy.profileId,
      equippedTitles: Array.isArray(enemy.equippedTitles) ? enemy.equippedTitles : [],
      count: (old.count || 0) + 1,
      lastMatchedAt: new Date().toISOString()
    };

    try {
      await ctx.saveCurrentPlayerProfile();
    } catch (error) {
      console.error(error);
    }
  }

  async function saveBattleResultForCurrentPlayer(winnerPlayer) {
    return recordBattleResultIfNeeded(winnerPlayer);
  }

  return {
    getBattleRecordModeKey,
    getOpponentCategoryForBattle,
    getOpponentCategoryByMode,
    getBattleRecordMode,
    get2v2StatsModeKey,
    getUnitIdFromState,
    getTeamUnitIds,
    get1v1UnitId,
    recordBattleResultIfNeeded,
    saveOnlineEncounteredPlayer,
    saveBattleResultForCurrentPlayer
  };
}
