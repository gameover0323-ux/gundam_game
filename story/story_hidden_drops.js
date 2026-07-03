import { training_machine } from "../js/js_units_training_machine.js";

export const STORY_SKILL_DESTROYER_DROP = {
  id: "create_skill_destroyer",
  label: "破壊者",
  cost: 50,
  detail: "ゲーム中3回、任意のスロット行動を選択して行動権無消費の追加行動ができる。",
  data: {
    kind: "create_skill",
    skillType: "destroyer",
    uses: 3
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildChapter1TrainingMachineEnemy(name = null) {
  const unit = clone(training_machine);

  if (name) {
    unit.name = name;
    const formId = unit.defaultFormId || "normal";
    if (unit.forms?.[formId]) unit.forms[formId].name = name;
  }

  unit.storyDrops = {
    ...(unit.storyDrops || {}),
    initial: [
      ...(Array.isArray(unit.storyDrops?.initial) ? unit.storyDrops.initial : []),
      STORY_SKILL_DESTROYER_DROP
    ]
  };

  return unit;
}

export function getStoryHiddenDropOptions(kind = "slot") {
  if (kind !== "skill") return [];

  return [
    {
      ...STORY_SKILL_DESTROYER_DROP,
      sourceUnitId: "training_machine",
      sourceUnitName: "トレーニングマシン"
    }
  ];
}
