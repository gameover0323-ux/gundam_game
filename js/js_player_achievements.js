import {
  INITIAL_TITLE_IDS,
  BETA_TITLE_IDS,
  DEFEAT_TITLE_RULES,
  BOSS_TROPHY_RULES,
  UNLOCK_RULES
} from "./js_player_titles.js";

function ensureProfileAchievementState(profile) {
  if (!profile) return;

  if (!profile.titles) profile.titles = {};
  if (!profile.titles.unlocked) profile.titles.unlocked = {};
  if (!Array.isArray(profile.equippedTitles)) profile.equippedTitles = [];

  if (!profile.unlocks) profile.unlocks = {};

  if (!profile.trophies) profile.trophies = {};
  if (!profile.trophies.byUnit) profile.trophies.byUnit = {};

  if (!profile.stats) profile.stats = {};
  if (!profile.stats.defeated) profile.stats.defeated = {};
}

function unlockTitle(profile, titleId) {
  ensureProfileAchievementState(profile);

  if (!titleId) return false;

  if (profile.titles.unlocked[titleId]) {
    return false;
  }

  profile.titles.unlocked[titleId] = true;
  return true;
}

function unlockFlag(profile, flag) {
  ensureProfileAchievementState(profile);

  if (!flag) return false;

  if (profile.unlocks[flag]) {
    return false;
  }

  profile.unlocks[flag] = true;
  return true;
}

function getDefeatedCount(profile, category, targetId) {
  const defeated = profile?.stats?.defeated || {};
  const categoryBucket = defeated[category] || {};
  return Number(categoryBucket[targetId] || 0);
}
function getUnitUsedCount(profile, unitId) {
  const units = profile?.stats?.units || {};
  const unitStats = units[unitId] || {};
  return Number(unitStats.used || 0);
}

function getTitleRuleProgress(profile, rule) {
  if (rule.category === "playable") {
    return getUnitUsedCount(profile, rule.targetId);
  }

  return getDefeatedCount(profile, rule.category, rule.targetId);
}
function ensureDefaultTitles(profile) {
  let changed = false;

  [...INITIAL_TITLE_IDS, ...BETA_TITLE_IDS].forEach(titleId => {
    if (unlockTitle(profile, titleId)) {
      changed = true;
    }
  });

  if (profile.equippedTitles.length === 0) {
    profile.equippedTitles = [
      "initial_civilian",
      "particle_no",
      "beta_test"
    ].filter(titleId => profile.titles.unlocked[titleId]);

    changed = true;
  }

  profile.equippedTitles = profile.equippedTitles
    .filter(titleId => profile.titles.unlocked[titleId])
    .slice(0, 10);

  return changed;
}


function applyDefeatTitleRules(profile) {
  let changed = false;

  DEFEAT_TITLE_RULES.forEach(rule => {
    const count = getTitleRuleProgress(profile, rule);

    if (count >= rule.count) {
      if (unlockTitle(profile, rule.id)) {
        changed = true;
      }
    }
  });

  return changed;
}

function applyUnlockRules(profile) {
  let changed = false;

  UNLOCK_RULES.forEach(rule => {
    const count = getDefeatedCount(profile, rule.category, rule.targetId);

    if (count >= rule.count) {
      if (unlockFlag(profile, rule.unlockFlag)) {
        changed = true;
      }
    }
  });

  return changed;
}

function applyBossTrophyRules(profile) {
  let changed = false;

  const unitStats = profile?.stats?.units || {};

  BOSS_TROPHY_RULES.forEach(rule => {
    Object.entries(unitStats).forEach(([playerUnitId, stats]) => {
      if (!profile.trophies.byUnit[playerUnitId]) {
        profile.trophies.byUnit[playerUnitId] = [];
      }

      const trophies = profile.trophies.byUnit[playerUnitId];

      if (Array.isArray(rule.twoVtwoTrophies)) {
        const twoVtwoCpu = stats?.twoVtwo?.cpu;
        const byPosition = twoVtwoCpu?.defeatedByPosition?.[rule.bossId] || {};

        rule.twoVtwoTrophies.forEach((trophyId, index) => {
          const win = Number(byPosition[String(index)] || 0);
          if (win < rule.unlockAt) return;

          if (!trophies.includes(trophyId)) {
            trophies.push(trophyId);
            changed = true;
          }
        });

        return;
      }

      const vsBoss = stats?.cpu?.vs?.[rule.bossId];
      const win = Number(vsBoss?.win || 0);

      if (win < rule.unlockAt) return;

      if (!trophies.includes(rule.trophyId)) {
        trophies.push(rule.trophyId);
        changed = true;
      }
    });
  });

  return changed;
}

export function updatePlayerAchievements(profile) {
  if (!profile) return { changed: false };

  ensureProfileAchievementState(profile);

  let changed = false;

  if (ensureDefaultTitles(profile)) changed = true;
  if (applyDefeatTitleRules(profile)) changed = true;
  if (applyUnlockRules(profile)) changed = true;
  if (applyBossTrophyRules(profile)) changed = true;

  return { changed };
}

export function setEquippedTitles(profile, titleIds) {
  ensureProfileAchievementState(profile);

  if (!Array.isArray(titleIds)) {
    return { ok: false, message: "称号リストが不正です" };
  }

  const validTitleIds = titleIds
    .filter(titleId => profile.titles.unlocked[titleId])
    .slice(0, 10);

  profile.equippedTitles = validTitleIds;

  return { ok: true };
}

export function reorderUnitTrophies(profile, unitId, trophyIds) {
  ensureProfileAchievementState(profile);

  if (!unitId || !Array.isArray(trophyIds)) {
    return { ok: false };
  }

  const current = profile.trophies.byUnit[unitId] || [];

  const reordered = trophyIds.filter(id => current.includes(id));
  const rest = current.filter(id => !reordered.includes(id));

  profile.trophies.byUnit[unitId] = [...reordered, ...rest];

  return { ok: true };
}
