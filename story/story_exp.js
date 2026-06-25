export function getStoryExpToNextLevel(level) {
  const lv = Math.max(0, Math.floor(Number(level || 0)));

  if (lv === 0) return 10;
  if (lv < 10) return 25;
  if (lv < 20) return 50;
  if (lv < 30) return 100;
  if (lv < 40) return 150;
  if (lv < 50) return 200;
  if (lv < 60) return 300;
  if (lv < 70) return 500;
  if (lv < 80) return 700;
  if (lv < 90) return 900;
  if (lv < 100) return 1000;
  return 1500;
}

export function calculateStoryLevel(totalExp) {
  let exp = Math.max(0, Math.floor(Number(totalExp || 0)));
  let level = 0;

  while (exp >= getStoryExpToNextLevel(level)) {
    exp -= getStoryExpToNextLevel(level);
    level += 1;
  }

  return {
    level,
    currentExp: exp,
    nextExp: getStoryExpToNextLevel(level),
    remainingExp: getStoryExpToNextLevel(level) - exp
  };
}

export function formatStoryLevelText(totalExp) {
  const info = calculateStoryLevel(totalExp);

  return [
    `Lv${info.level}`,
    `${info.currentExp} / ${info.nextExp} Exp`,
    `次Lvまで${info.remainingExp}`
  ].join("<br>");
}

export function getCreateUnitMaxCostByLevel(level, baseCost = 100) {
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  return Number(baseCost || 0) + safeLevel * 5;
}
