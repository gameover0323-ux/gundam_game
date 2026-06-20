import {
  INITIAL_TITLE_IDS,
  BETA_TITLE_IDS,
  DEFEAT_TITLE_RULES,
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

  if (!profile.equippedTrophies) profile.equippedTrophies = {};
  if (!profile.equippedTrophies.byUnit) profile.equippedTrophies.byUnit = {};

  if (!profile.stats) profile.stats = {};
  if (!profile.stats.defeated) profile.stats.defeated = {};
}

function unlockTitle(profile, titleId) {
  ensureProfileAchievementState(profile);
  if (!titleId) return false;
  if (profile.titles.unlocked[titleId]) return false;
  profile.titles.unlocked[titleId] = true;
  return true;
}

function unlockFlag(profile, flag) {
  ensureProfileAchievementState(profile);
  if (!flag) return false;
  if (profile.unlocks[flag]) return false;
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

function migrateOldEquippedTrophies(profile) {
  ensureProfileAchievementState(profile);

  let changed = false;

  Object.keys(profile.trophies.byUnit || {}).forEach(unitId => {
    const oldList = profile.trophies.byUnit[unitId];

    if (!Array.isArray(oldList) || oldList.length === 0) return;

    if (!Array.isArray(profile.equippedTrophies.byUnit[unitId])) {
      profile.equippedTrophies.byUnit[unitId] = [...oldList];
      changed = true;
    }
  });

  return changed;
}

function stopAutoBossTrophyGrant(profile) {
  ensureProfileAchievementState(profile);

  /*
    ボストロフィーは勝利時に自動装備しない。

    解放済み判定：
      stats から都度計算

    装備中表示：
      profile.equippedTrophies.byUnit のみ参照

    旧 profile.trophies.byUnit は過去データ互換用として残すが、
    ここでは絶対に追加・復活させない。
  */
  return migrateOldEquippedTrophies(profile);
}

export function updatePlayerAchievements(profile) {
  if (!profile) return { changed: false };

  ensureProfileAchievementState(profile);

  let changed = false;

  if (ensureDefaultTitles(profile)) changed = true;
  if (applyDefeatTitleRules(profile)) changed = true;
  if (applyUnlockRules(profile)) changed = true;
  if (stopAutoBossTrophyGrant(profile)) changed = true;

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

  const current = profile.equippedTrophies.byUnit[unitId] || [];
  const reordered = trophyIds.filter(id => current.includes(id));
  const rest = current.filter(id => !reordered.includes(id));

  profile.equippedTrophies.byUnit[unitId] = [...reordered, ...rest];

  return { ok: true };
}
