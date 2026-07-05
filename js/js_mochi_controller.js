import { loadStorySave } from "../story/story_save.js";

const MOCHI_STORAGE_KEY = "gbs_mochi_state_v1";
const MOCHI_BASE_PATH = "assets/mochi/";
const MOCHI_FRAME_MS = 1000 / 60;

const MOCHI_SIZE = 72;
const HOLD_MS = 420;
const FOLLOW_HOLD_MS = 1000;
const FOLLOW_MOVE_CANCEL_DISTANCE = 12;
const STEP_DISTANCE = MOCHI_SIZE / 3;
const ARRIVE_DISTANCE = STEP_DISTANCE;

const MOCHI_TAP_TEXTS = ["なんなのだ？", "みかんほしーのだ", "よーちゃんどこなのだ？", "ひまなのだ", "のだ〜"];
const MOCHI_IDLE_TEXTS = ["さんぽするのだ", "みかんどこなのだ", "のだ〜", "ひとやすみなのだ", "あそぶのだ"];

const MOCHI_FOLLOW_TEXTS = [
  "まつのだ",
  "うおーなのだ",
  "エデンはそこにあるのだ",
  "いまいくのだー",
  "はしるのだ"
];

const MOCHI_ARRIVE_TEXTS = [
  "ゴールなのだ",
  "やったのだ",
  "ちかのかちなのだ",
  "みかんくれるのだ？",
  "よっしゃーなのだ"
];

const MOCHI_ANIMS = {
  idleBlink: [
    { file: "mochi_idol1.png", frames: 4 },
    { file: "mochi_idol2.png", frames: 4 },
    { file: "mochi_idol1.png", frames: 4 },
    { file: "mochi_nomal.png", frames: 1 }
  ],

  idleJump: [
    { file: "mochi_up1.png", frames: 3 },
    { file: "mochi_up2.png", frames: 3 },
    { file: "mochi_up3.png", frames: 3 },
    { file: "mochi_up4.png", frames: 4 },
    { file: "mochi_up5.png", frames: 5 },
    { file: "mochi_up4.png", frames: 4 },
    { file: "mochi_up3.png", frames: 3 },
    { file: "mochi_up2.png", frames: 3 },
    { file: "mochi_up1.png", frames: 3 },
    { file: "mochi_nomal.png", frames: 2 }
  ],

  tap: [
    { file: "mochi_tap1.png", frames: 4 },
    { file: "mochi_tap2.png", frames: 4 },
    { file: "mochi_tap3.png", frames: 120, text: true },
    { file: "mochi_tap2.png", frames: 4 },
    { file: "mochi_tap1.png", frames: 4 },
    { file: "mochi_nomal.png", frames: 1 }
  ],

  lift: [
    { file: "mochi_up1.png", frames: 1 },
    { file: "mochi_up2.png", frames: 1 },
    { file: "mochi_up3.png", frames: 1 },
    { file: "mochi_up4.png", frames: 1 },
    { file: "mochi_up5.png", frames: 1 }
  ],

  land: [
    { file: "mochi_up5.png", frames: 3 },
    { file: "mochi_up4.png", frames: 3 },
    { file: "mochi_up3.png", frames: 3 },
    { file: "mochi_up2.png", frames: 3, click: true },
    { file: "mochi_up1.png", frames: 3 },
    { file: "mochi_nomal.png", frames: 1 }
  ]
};

const DIR_DATA = {
  down: { normal: "sita_nomal.png" },
  downRight: { normal: "msita_nomal.png" },
  downLeft: { normal: "hsita_nomal.png" },
  left: { normal: "hidari_nomal.png" },
  right: { normal: "migi_nomal.png" },
  upRight: { normal: "mue_nomal.png" },
  upLeft: { normal: "hue_nomal.png" },
  up: { normal: "ue_nomal.png" }
};

const TURN_FROM_NORMAL = {
  down: [{ file: "sita_nomal.png", frames: 30 }],
  downRight: [{ file: "msita_nomal.png", frames: 30 }],
  downLeft: [{ file: "hsita_nomal.png", frames: 30 }],
  left: [
    { file: "hsita_nomal.png", frames: 3 },
    { file: "hidari_nomal.png", frames: 30 }
  ],
  right: [
    { file: "msita_nomal.png", frames: 3 },
    { file: "migi_nomal.png", frames: 30 }
  ],
  upRight: [
    { file: "msita_nomal.png", frames: 3 },
    { file: "migi_nomal.png", frames: 3 },
    { file: "mue_nomal.png", frames: 30 }
  ],
  upLeft: [
    { file: "hsita_nomal.png", frames: 3 },
    { file: "hidari_nomal.png", frames: 3 },
    { file: "hue_nomal.png", frames: 30 }
  ],
  up: () => {
    if (Math.random() < 0.5) {
      return [
        { file: "msita_nomal.png", frames: 3 },
        { file: "migi_nomal.png", frames: 3 },
        { file: "mue_nomal.png", frames: 3 },
        { file: "ue_nomal.png", frames: 30 }
      ];
    }

    return [
      { file: "hsita_nomal.png", frames: 3 },
      { file: "hidari_nomal.png", frames: 3 },
      { file: "hue_nomal.png", frames: 3 },
      { file: "ue_nomal.png", frames: 30 }
    ];
  }
};

const WALK_ANIMS = {
  down: [
    { file: "sita_1.png", frames: 6 },
    { file: "sita_2.png", frames: 6, move: true },
    { file: "sita_3.png", frames: 6, move: true },
    { file: "sita_1.png", frames: 6 },
    { file: "sita_nomal.png", frames: 10 }
  ],
  downRight: [
    { file: "msita_1.png", frames: 6 },
    { file: "msita_2.png", frames: 6 },
    { file: "msita_3.png", frames: 6, move: true },
    { file: "msita_4.png", frames: 6, move: true },
    { file: "msita_2.png", frames: 6 },
    { file: "msita_1.png", frames: 6 },
    { file: "msita_nomal.png", frames: 10 }
  ],
  downLeft: [
    { file: "hsita_1.png", frames: 6 },
    { file: "hsita_4.png", frames: 6 },
    { file: "hsita_2.png", frames: 6, move: true },
    { file: "hsita_3.png", frames: 6, move: true },
    { file: "hsita_4.png", frames: 6 },
    { file: "hsita_1.png", frames: 6 },
    { file: "hsita_nomal.png", frames: 10 }
  ],
  left: [
    { file: "hidari_1.png", frames: 6 },
    { file: "hidari_2.png", frames: 6 },
    { file: "hidari_3.png", frames: 8, move: true },
    { file: "hidari_2.png", frames: 4, move: true },
    { file: "hidari_2.png", frames: 6 },
    { file: "hidari_1.png", frames: 6 },
    { file: "hidari_nomal.png", frames: 10 }
  ],
  right: [
    { file: "migi_1.png", frames: 6 },
    { file: "migi_2.png", frames: 6 },
    { file: "migi_3.png", frames: 8, move: true },
    { file: "migi_2.png", frames: 4, move: true },
    { file: "migi_2.png", frames: 6 },
    { file: "migi_1.png", frames: 6 },
    { file: "migi_nomal.png", frames: 10 }
  ],
  upRight: [
    { file: "mue_1.png", frames: 6 },
    { file: "mue_2.png", frames: 6 },
    { file: "mue_3.png", frames: 8, move: true },
    { file: "mue_2.png", frames: 4, move: true },
    { file: "mue_2.png", frames: 6 },
    { file: "mue_1.png", frames: 6 },
    { file: "mue_nomal.png", frames: 10 }
  ],
  upLeft: [
    { file: "hue_1.png", frames: 6 },
    { file: "hue_2.png", frames: 6 },
    { file: "hue_3.png", frames: 8, move: true },
    { file: "hue_2.png", frames: 4, move: true },
    { file: "hue_2.png", frames: 6 },
    { file: "hue_1.png", frames: 6 },
    { file: "hue_nomal.png", frames: 10 }
  ],
  up: [
    { file: "ue_1.png", frames: 6 },
    { file: "ue_2.png", frames: 6 },
    { file: "ue_3.png", frames: 8, move: true },
    { file: "ue_2.png", frames: 4, move: true },
    { file: "ue_2.png", frames: 6 },
    { file: "ue_1.png", frames: 6 },
    { file: "ue_nomal.png", frames: 10 }
  ]
};

let state = loadState();
let root = null;
let img = null;
let bubble = null;
let followLayer = null;
let enabled = state.enabled === true;
let mode = "idle";
let currentDir = "normal";

let frameTimer = null;
let holdTimer = null;
let idleMotionTimer = null;
let idleTextTimer = null;
let followHoldTimer = null;
let followTalkTimer = null;
let arriveJumpTimer = null;

let dragging = false;
let lifted = false;
let canTap = true;
let idleJumpLooped = false;
let isFollowing = false;
let isWalking = false;
let arrived = false;
let arriveMessageShown = false;
let followTarget = null;
let pointerOffset = { x: 0, y: 0 };
let lastActiveScreenId = getActiveScreenId();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(MOCHI_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(MOCHI_STORAGE_KEY, JSON.stringify(state));
}

function getActiveScreenId() {
  return document.querySelector(".screen.active")?.id || "";
}

function getDefaultPosition() {
  return {
    x: window.scrollX + Math.floor(window.innerWidth / 2 - MOCHI_SIZE / 2),
    y: window.scrollY + Math.floor(window.innerHeight / 2 - MOCHI_SIZE / 2)
  };
}

function getCenter() {
  return {
    x: Number(state.x || 0) + MOCHI_SIZE / 2,
    y: Number(state.y || 0) + MOCHI_SIZE / 2
  };
}

function isMochiInViewport() {
  if (!root) return false;

  const rect = root.getBoundingClientRect();
  return (
    rect.right > 0 &&
    rect.left < window.innerWidth &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight
  );
}

function respawnCenter() {
  const pos = getDefaultPosition();
  state.x = pos.x;
  state.y = pos.y;
  applyPosition();
  saveState();
}

function applyPosition() {
  if (!root) return;
  root.style.left = `${Number(state.x || 0)}px`;
  root.style.top = `${Number(state.y || 0)}px`;
}

function setFrameFile(file) {
  if (!img) return;
  img.src = MOCHI_BASE_PATH + file;
}

function clearMotionTimers() {
  clearInterval(frameTimer);
  frameTimer = null;
}

function stopIdleTimers() {
  clearInterval(idleMotionTimer);
  idleMotionTimer = null;
  clearInterval(idleTextTimer);
  idleTextTimer = null;
}

function stopFollowTimers() {
  clearTimeout(followHoldTimer);
  followHoldTimer = null;
  clearInterval(followTalkTimer);
  followTalkTimer = null;
  clearInterval(arriveJumpTimer);
  arriveJumpTimer = null;
}

function showNormal() {
  clearMotionTimers();
  mode = "idle";
  currentDir = "normal";
  setFrameFile("mochi_nomal.png");
}

function playSteps(steps, onStep, onEnd) {
  clearMotionTimers();

  if (!Array.isArray(steps) || steps.length <= 0) {
    if (typeof onEnd === "function") onEnd();
    return;
  }

  let stepIndex = 0;
  let frameRemain = Number(steps[0].frames || 1);

  setFrameFile(steps[0].file);
  if (typeof onStep === "function") onStep(steps[0], stepIndex);

  frameTimer = setInterval(() => {
    frameRemain--;

    if (frameRemain > 0) return;

    stepIndex++;

    if (stepIndex >= steps.length) {
      clearMotionTimers();
      if (typeof onEnd === "function") onEnd();
      return;
    }

    const step = steps[stepIndex];
    frameRemain = Number(step.frames || 1);
    setFrameFile(step.file);

    if (typeof onStep === "function") onStep(step, stepIndex);
  }, MOCHI_FRAME_MS);
}

function playAnim(animName, onStep, onEnd) {
  playSteps(MOCHI_ANIMS[animName], onStep, onEnd);
}

function startIdleMode() {
  if (!root || isFollowing) return;

  canTap = true;
  idleJumpLooped = false;
  arrived = false;
  arriveMessageShown = false;
  showNormal();
  stopIdleTimers();

  idleMotionTimer = setInterval(() => {
    if (!root || dragging || lifted || isFollowing || mode !== "idle") return;

    const r = Math.random();

    if (r < 0.3) {
      canTap = false;
      playAnim("idleBlink", null, () => {
        canTap = true;
        showNormal();
      });
      return;
    }

    if (r < 0.6) {
      canTap = false;
      playIdleJumpSequence(false);
    }
  }, 5000);

  idleTextTimer = setInterval(() => {
    if (!root || dragging || lifted || isFollowing || mode !== "idle") return;

    if (Math.random() < 0.3) {
      showRandomText(MOCHI_IDLE_TEXTS, 2000);
    }
  }, 10000);
}

function playIdleJumpSequence(singleLoop = false) {
  playAnim("idleJump", null, () => {
    if (singleLoop) {
      const normal = currentDir !== "normal" ? DIR_DATA[currentDir]?.normal : "mochi_nomal.png";
      setFrameFile(normal || "mochi_nomal.png");
      return;
    }

    if (!idleJumpLooped && Math.random() < 0.5) {
      idleJumpLooped = true;
      playIdleJumpSequence(false);
      return;
    }

    idleJumpLooped = false;
    canTap = true;
    showNormal();
  });
}

function showRandomText(textList = MOCHI_TAP_TEXTS, durationMs = 2000) {
  if (!bubble || !Array.isArray(textList) || textList.length <= 0) return;

  bubble.textContent = textList[Math.floor(Math.random() * textList.length)];
  bubble.classList.add("show");

  setTimeout(() => {
    if (bubble) bubble.classList.remove("show");
  }, durationMs);
}

function chooseDirectionToTarget() {
  if (!followTarget) return "down";

  const center = getCenter();
  const dx = followTarget.x - center.x;
  const dy = followTarget.y - center.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < 8 && dy < 0) return "up";
  if (absX < 8 && dy > 0) return "down";
  if (absY < 8 && dx < 0) return "left";
  if (absY < 8 && dx > 0) return "right";

  if (dx > 0 && dy > 0) return "downRight";
  if (dx < 0 && dy > 0) return "downLeft";
  if (dx > 0 && dy < 0) return "upRight";
  if (dx < 0 && dy < 0) return "upLeft";

  return "down";
}

function getTurnSteps(nextDir) {
  if (currentDir === nextDir) return [];

  if (currentDir === "up") {
    if (nextDir === "upRight") return [{ file: "mue_nomal.png", frames: 3 }];
    if (nextDir === "upLeft") return [{ file: "hue_nomal.png", frames: 3 }];
  }

  if (currentDir === "upRight" && nextDir === "up") {
    return [{ file: "ue_nomal.png", frames: 3 }];
  }

  if (currentDir === "upLeft" && nextDir === "up") {
    return [{ file: "ue_nomal.png", frames: 3 }];
  }

  if (currentDir === "normal") {
    const path = TURN_FROM_NORMAL[nextDir];
    return typeof path === "function" ? path() : (path || []);
  }

  const currentNormal = DIR_DATA[currentDir]?.normal;
  const nextNormal = DIR_DATA[nextDir]?.normal;

  if (currentNormal && nextNormal) {
    return [
      { file: currentNormal, frames: 3 },
      { file: nextNormal, frames: 3 }
    ];
  }

  const path = TURN_FROM_NORMAL[nextDir];
  return typeof path === "function" ? path() : (path || []);
}

function moveOneStep() {
  if (!followTarget) return;

  const center = getCenter();
  let dx = followTarget.x - center.x;
  let dy = followTarget.y - center.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= ARRIVE_DISTANCE) {
    arriveAtTarget();
    return;
  }

  const amount = Math.min(STEP_DISTANCE, dist);
  dx /= dist;
  dy /= dist;

  state.x = Number(state.x || 0) + dx * amount;
  state.y = Number(state.y || 0) + dy * amount;
  applyPosition();
  saveState();
}

function walkTowardTarget() {
  if (!isFollowing || isWalking || !followTarget || arrived) return;

  const center = getCenter();
  const dist = Math.hypot(followTarget.x - center.x, followTarget.y - center.y);

  if (dist <= ARRIVE_DISTANCE) {
    arriveAtTarget();
    return;
  }

  isWalking = true;
  mode = "walk";

  const dir = chooseDirectionToTarget();
  const turnSteps = getTurnSteps(dir);
  const walkSteps = WALK_ANIMS[dir] || [];
  const fullSteps = [...turnSteps, ...walkSteps];

  currentDir = dir;

  playSteps(fullSteps, (step) => {
    if (step.move === true && !arrived) {
      moveOneStep();
    }
  }, () => {
    isWalking = false;

    if (isFollowing && !arrived) {
      walkTowardTarget();
    } else if (!isFollowing) {
      returnToNormalFromCurrentDir();
    }
  });
}

function arriveAtTarget() {
  if (arrived) return;

  arrived = true;
  isWalking = false;
  clearMotionTimers();

  if (!arriveMessageShown) {
    arriveMessageShown = true;
    showRandomText(MOCHI_ARRIVE_TEXTS, 2500);
  }

  clearInterval(arriveJumpTimer);
  arriveJumpTimer = setInterval(() => {
    if (!isFollowing || !arrived || dragging || lifted) return;
    playIdleJumpSequence(true);
  }, 2000);
}

function returnToNormalFromCurrentDir() {
  clearMotionTimers();

  const normalFile = currentDir !== "normal"
    ? DIR_DATA[currentDir]?.normal
    : "mochi_nomal.png";

  const steps = normalFile && normalFile !== "mochi_nomal.png"
    ? [
        { file: normalFile, frames: 3 },
        { file: "mochi_nomal.png", frames: 3 }
      ]
    : [{ file: "mochi_nomal.png", frames: 1 }];

  playSteps(steps, null, () => {
    currentDir = "normal";
    startIdleMode();
  });
}

function createFollowLayer() {
  if (followLayer) return;

  followLayer = document.createElement("div");
  followLayer.id = "mochiFollowLayer";
  followLayer.className = "mochi-follow-layer";
  document.body.appendChild(followLayer);

  followLayer.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  followLayer.addEventListener("pointermove", (event) => {
    if (!isFollowing || !followTarget) return;

    event.preventDefault();

       followTarget.x = window.scrollX + event.clientX;
    followTarget.y = window.scrollY + event.clientY;

    notifyBonusMochiTargetMoved();

    if (arrived) {
  arrived = false;
  clearInterval(arriveJumpTimer);
  arriveJumpTimer = null;
  walkTowardTarget();
}
  });

  followLayer.addEventListener("pointerup", (event) => {
    event.preventDefault();
    stopFollowing();
  });

  followLayer.addEventListener("pointercancel", (event) => {
    event.preventDefault();
    stopFollowing();
  });
}

function removeFollowLayer() {
  if (!followLayer) return;
  followLayer.remove();
  followLayer = null;
}

function startFollowing(clientX, clientY) {
  if (!enabled || !root || dragging || lifted) return;

  stopIdleTimers();
  stopFollowTimers();
  clearMotionTimers();

  isFollowing = true;
  isWalking = false;
  arrived = false;
  arriveMessageShown = false;
  canTap = false;
  followTarget = {
    x: window.scrollX + clientX,
    y: window.scrollY + clientY
  };

  createFollowLayer();

  followTalkTimer = setInterval(() => {
    if (isFollowing && !arrived) {
      showRandomText(MOCHI_FOLLOW_TEXTS, 2000);
    }
  }, 5000);

    startBonusMochiFollowingAll();
  walkTowardTarget();
}

function stopFollowing() {
  clearTimeout(followHoldTimer);
  followHoldTimer = null;

  if (!isFollowing) {
    removeFollowLayer();
    return;
  }

  isFollowing = false;
  followTarget = null;
  arrived = false;
  arriveMessageShown = false;
    stopFollowTimers();
  stopBonusMochiFollowingAll();
  removeFollowLayer();

  if (!dragging && !lifted) {
    returnToNormalFromCurrentDir();
  }
}

function createMochi() {
  if (root) return;

  root = document.createElement("div");
  root.id = "mochiRoot";
  root.className = "mochi-root";

  img = document.createElement("img");
  img.className = "mochi-img";
  img.draggable = false;

  bubble = document.createElement("div");
  bubble.className = "mochi-bubble";

  root.appendChild(bubble);
  root.appendChild(img);
  document.body.appendChild(root);

  if (typeof state.x !== "number" || typeof state.y !== "number") {
    const pos = getDefaultPosition();
    state.x = pos.x;
    state.y = pos.y;
    saveState();
  }

  applyPosition();
  bindMochiEvents();
  bindWorldFollowEvents();
  startIdleMode();
}

function removeMochi() {
  clearMotionTimers();
  clearTimeout(holdTimer);
  holdTimer = null;
  stopIdleTimers();
  stopFollowTimers();
  removeFollowLayer();

    if (root) root.remove();
  clearBonusMochi();

  root = null;
  img = null;
  bubble = null;
  dragging = false;
  lifted = false;
  canTap = true;
  isFollowing = false;
  isWalking = false;
  arrived = false;
  arriveMessageShown = false;
}

function setEnabled(value) {
  enabled = value === true;
  state.enabled = enabled;
  saveState();

  if (enabled) {
    createMochi();
    if (!isMochiInViewport()) respawnCenter();
  } else {
    removeMochi();
  }

  updateMochiButtons();
}

function bindMochiEvents() {
  root.addEventListener("pointerdown", (event) => {
    if (!canTap && mode !== "idle") return;

    event.preventDefault();
    event.stopPropagation();
    root.setPointerCapture(event.pointerId);

    const rect = root.getBoundingClientRect();
    pointerOffset.x = event.clientX - rect.left;
    pointerOffset.y = event.clientY - rect.top;

    holdTimer = setTimeout(() => {
      stopIdleTimers();
      stopFollowTimers();
      clearMotionTimers();
      removeFollowLayer();

      canTap = false;
      lifted = true;
      dragging = true;
      isFollowing = false;
      arrived = false;
      arriveMessageShown = false;

      playAnim("lift", null, () => {
        setFrameFile("mochi_up5.png");
      });
    }, HOLD_MS);
  });

  root.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    state.x = window.scrollX + event.clientX - pointerOffset.x;
    state.y = window.scrollY + event.clientY - pointerOffset.y;
    applyPosition();
  });

  root.addEventListener("pointerup", () => {
    clearTimeout(holdTimer);

    if (dragging || lifted) {
      dragging = false;
      lifted = false;
      saveState();

      playAnim("land", (step) => {
        if (step.click === true) {
          clickElementUnderMochiFoot();
        }
      }, () => {
        startIdleMode();
      });

      return;
    }

    if (!canTap) return;

    stopIdleTimers();
    canTap = false;

    let textShown = false;

    playAnim("tap", (step) => {
      if (step.text === true && !textShown) {
        textShown = true;
        showRandomText(MOCHI_TAP_TEXTS, 4000);
      }
    }, () => {
      showNormal();

      setTimeout(() => {
        startIdleMode();
      }, 2000);
    });
  });

  root.addEventListener("pointercancel", () => {
    clearTimeout(holdTimer);

    if (dragging || lifted) {
      dragging = false;
      lifted = false;
      startIdleMode();
    }
  });
}

function bindWorldFollowEvents() {
  let pressing = false;
  let pressPointerId = null;
  let startX = 0;
  let startY = 0;
  let latestX = 0;
  let latestY = 0;
  let moved = false;
  let preLayerTimer = null;

  const PRE_LAYER_MS = 180;

  document.addEventListener("contextmenu", (event) => {
    if (pressing || isFollowing || followLayer) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (!enabled || !root) return;
    if (root.contains(event.target)) return;
    if (event.target?.closest?.("button, a, summary, input, textarea, select, label")) return;

    pressing = true;
    moved = false;
    pressPointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    latestX = event.clientX;
    latestY = event.clientY;

    clearTimeout(followHoldTimer);
    clearTimeout(preLayerTimer);

    preLayerTimer = setTimeout(() => {
      if (!pressing || moved || isFollowing) return;
      createFollowLayer();
    }, PRE_LAYER_MS);

    followHoldTimer = setTimeout(() => {
      if (!pressing || moved) return;
      startFollowing(latestX, latestY);
    }, FOLLOW_HOLD_MS);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!pressing) return;
    if (pressPointerId !== null && event.pointerId !== pressPointerId) return;

    latestX = event.clientX;
    latestY = event.clientY;

    const dx = latestX - startX;
    const dy = latestY - startY;
    const dist = Math.hypot(dx, dy);

    if (!followLayer && !isFollowing && dist > FOLLOW_MOVE_CANCEL_DISTANCE) {
      moved = true;
      pressing = false;
      clearTimeout(preLayerTimer);
      clearTimeout(followHoldTimer);
      preLayerTimer = null;
      followHoldTimer = null;
      return;
    }

    if (followLayer || isFollowing) {
      event.preventDefault();
    }

    if (!isFollowing || !followTarget) return;

        followTarget.x = window.scrollX + latestX;
    followTarget.y = window.scrollY + latestY;

    notifyBonusMochiTargetMoved();

    if (arrived) {
      arrived = false;
      clearInterval(arriveJumpTimer);
      arriveJumpTimer = null;
      walkTowardTarget();
    }
  }, { capture: true, passive: false });

  document.addEventListener("pointerup", (event) => {
    if (pressPointerId !== null && event.pointerId !== pressPointerId) return;

    pressing = false;
    pressPointerId = null;

    clearTimeout(preLayerTimer);
    clearTimeout(followHoldTimer);
    preLayerTimer = null;
    followHoldTimer = null;

    stopFollowing();
    removeFollowLayer();
  }, true);

  document.addEventListener("pointercancel", (event) => {
    if (pressPointerId !== null && event.pointerId !== pressPointerId) return;

    pressing = false;
    pressPointerId = null;

    clearTimeout(preLayerTimer);
    clearTimeout(followHoldTimer);
    preLayerTimer = null;
    followHoldTimer = null;

    stopFollowing();
    removeFollowLayer();
  }, true);
}
function clickElementUnderMochiFoot() {
  if (!root) return;

  const rect = root.getBoundingClientRect();

  const points = [
    [rect.left + rect.width * 0.5, rect.top + rect.height * 0.55],
    [rect.left + rect.width * 0.35, rect.top + rect.height * 0.7],
    [rect.left + rect.width * 0.65, rect.top + rect.height * 0.7],
    [rect.left + rect.width * 0.5, rect.bottom - 6]
  ];

  root.style.pointerEvents = "none";

  for (const [x, y] of points) {
    const target = document.elementFromPoint(x, y);
    const clickable = target?.closest?.("button, a, summary, input, textarea, select");

    if (clickable && clickable !== root && !root.contains(clickable)) {
      root.style.pointerEvents = "";
      clickable.click();
      return;
    }
  }

  root.style.pointerEvents = "";
}

function ensureMochiPanelButton() {
  const content = document.getElementById("playerStatsContent");
  if (!content) return;

  const heading = content.querySelector("h3")?.textContent || "";
  const isCustomizePanel =
    heading.includes("称号カスタム") || heading.includes("トロフィーカスタム");

  if (!isCustomizePanel) return;
  if (document.getElementById("mochiFeatureToggleBtn")) return;

  const hr = document.createElement("hr");

  const btn = document.createElement("button");
  btn.id = "mochiFeatureToggleBtn";
  btn.type = "button";
  btn.addEventListener("click", () => setEnabled(!enabled));

  content.appendChild(hr);
  content.appendChild(btn);
  updateMochiButtons();
}

function updateMochiButtons() {
  document.querySelectorAll("#mochiFeatureToggleBtn").forEach(btn => {
    btn.textContent = enabled ? "もち機能：ON" : "もち機能：OFF";
  });
}

function watchCustomizePanel() {
  const content = document.getElementById("playerStatsContent");
  if (!content) return;

  const observer = new MutationObserver(() => {
    ensureMochiPanelButton();
  });

  observer.observe(content, { childList: true, subtree: true });
  ensureMochiPanelButton();
}

function watchScreenChange() {
  document.addEventListener("click", () => {
    setTimeout(() => {
      const current = getActiveScreenId();

      if (current !== lastActiveScreenId) {
        lastActiveScreenId = current;

        if (enabled && root && !isMochiInViewport()) {
          respawnCenter();
        }
      }
    }, 0);
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  watchCustomizePanel();
  watchScreenChange();

  if (enabled) {
    createMochi();
  }
});

const MOCHI_BONUS_PREFIX = "mochi_bonus_";

let bonusMochiItems = [];
let bonusMochiCheckTimer = null;

function startBonusMochiFollowingAll() {
  bonusMochiItems.forEach(item => item.startFollowing?.());
}

function stopBonusMochiFollowingAll() {
  bonusMochiItems.forEach(item => item.stopFollowing?.());
}

function notifyBonusMochiTargetMoved() {
  bonusMochiItems.forEach(item => item.onTargetMoved?.());
}

function getStoryMochiBonusCount() {
  let save = null;

  try {
    save = loadStorySave();
  } catch {
    return 0;
  }

  const lab = save?.createUnits?.proto_create_gundam?.lab;
  if (!lab) return 0;

  let count = 0;

  Object.values(lab.selectedSlots || {}).forEach(slotId => {
    if (String(slotId || "").startsWith(MOCHI_BONUS_PREFIX)) count += 1;
  });

  Object.values(lab.equipment || {}).forEach(equipmentId => {
    if (String(equipmentId || "").startsWith(MOCHI_BONUS_PREFIX)) count += 1;
  });

  if (String(lab.skill || "").startsWith(MOCHI_BONUS_PREFIX)) count += 1;

  return count;
}

function getRandomBonusMochiPosition(index) {
  const margin = 12;
  const maxX = Math.max(margin, window.innerWidth - MOCHI_SIZE - margin);
  const maxY = Math.max(margin, window.innerHeight - MOCHI_SIZE - margin);

  const seedX = (index * 97 + Math.floor(Math.random() * 160)) % Math.max(1, maxX);
  const seedY = (index * 131 + Math.floor(Math.random() * 220)) % Math.max(1, maxY);

  return {
    x: window.scrollX + margin + seedX,
    y: window.scrollY + margin + seedY
  };
}

function createBonusMochi(index) {
  const bonusRoot = document.createElement("div");
  bonusRoot.className = "mochi-root mochi-bonus-root";
  bonusRoot.dataset.bonusMochiIndex = String(index);
  bonusRoot.style.position = "absolute";
  bonusRoot.style.zIndex = "19999";
  bonusRoot.style.touchAction = "none";

  const bonusBubble = document.createElement("div");
  bonusBubble.className = "mochi-bubble";

  const bonusImg = document.createElement("img");
  bonusImg.className = "mochi-img";
  bonusImg.draggable = false;
  bonusImg.src = MOCHI_BASE_PATH + "mochi_nomal.png";

  bonusRoot.appendChild(bonusBubble);
  bonusRoot.appendChild(bonusImg);
  document.body.appendChild(bonusRoot);

  const pos = getRandomBonusMochiPosition(index);
  let x = pos.x;
  let y = pos.y;

  let holdTimerLocal = null;
  let frameTimerLocal = null;
  let followTalkTimerLocal = null;
  let arriveJumpTimerLocal = null;

  let draggingLocal = false;
  let liftedLocal = false;
  let isFollowingLocal = false;
  let isWalkingLocal = false;
  let arrivedLocal = false;
  let arriveMessageShownLocal = false;
  let currentDirLocal = "normal";
  let pointerOffsetLocal = { x: 0, y: 0 };

  function applyBonusPosition() {
    bonusRoot.style.left = `${x}px`;
    bonusRoot.style.top = `${y}px`;
  }

  function setBonusFrame(file) {
    bonusImg.src = MOCHI_BASE_PATH + file;
  }

  function getBonusCenter() {
    return {
      x: x + MOCHI_SIZE / 2,
      y: y + MOCHI_SIZE / 2
    };
  }

  function clearBonusMotionTimers() {
    clearInterval(frameTimerLocal);
    frameTimerLocal = null;
  }

  function stopBonusFollowTimers() {
    clearInterval(followTalkTimerLocal);
    followTalkTimerLocal = null;
    clearInterval(arriveJumpTimerLocal);
    arriveJumpTimerLocal = null;
  }

  function showBonusText(textList = MOCHI_TAP_TEXTS, durationMs = 2000) {
    const text = Array.isArray(textList)
      ? textList[Math.floor(Math.random() * textList.length)]
      : String(textList || "のだ〜");

    bonusBubble.textContent = text;
    bonusBubble.classList.add("show");

    setTimeout(() => {
      bonusBubble.classList.remove("show");
    }, durationMs);
  }

  function playBonusSteps(steps, onStep, onEnd) {
    clearBonusMotionTimers();

    if (!Array.isArray(steps) || steps.length <= 0) {
      onEnd?.();
      return;
    }

    let stepIndex = 0;
    let frameRemain = Number(steps[0].frames || 1);

    setBonusFrame(steps[0].file);
    onStep?.(steps[0], stepIndex);

    frameTimerLocal = setInterval(() => {
      frameRemain--;

      if (frameRemain > 0) return;

      stepIndex++;

      if (stepIndex >= steps.length) {
        clearBonusMotionTimers();
        onEnd?.();
        return;
      }

      const step = steps[stepIndex];
      frameRemain = Number(step.frames || 1);
      setBonusFrame(step.file);
      onStep?.(step, stepIndex);
    }, MOCHI_FRAME_MS);
  }

  function playBonusAnim(animName, onStep, onEnd) {
    playBonusSteps(MOCHI_ANIMS[animName], onStep, onEnd);
  }

  function chooseBonusDirectionToTarget() {
    if (!followTarget) return "down";

    const center = getBonusCenter();
    const dx = followTarget.x - center.x;
    const dy = followTarget.y - center.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 8 && dy < 0) return "up";
    if (absX < 8 && dy > 0) return "down";
    if (absY < 8 && dx < 0) return "left";
    if (absY < 8 && dx > 0) return "right";

    if (dx > 0 && dy > 0) return "downRight";
    if (dx < 0 && dy > 0) return "downLeft";
    if (dx > 0 && dy < 0) return "upRight";
    if (dx < 0 && dy < 0) return "upLeft";

    return "down";
  }

  function getBonusTurnSteps(nextDir) {
    if (currentDirLocal === nextDir) return [];

    if (currentDirLocal === "up") {
      if (nextDir === "upRight") return [{ file: "mue_nomal.png", frames: 3 }];
      if (nextDir === "upLeft") return [{ file: "hue_nomal.png", frames: 3 }];
    }

    if (currentDirLocal === "upRight" && nextDir === "up") {
      return [{ file: "ue_nomal.png", frames: 3 }];
    }

    if (currentDirLocal === "upLeft" && nextDir === "up") {
      return [{ file: "ue_nomal.png", frames: 3 }];
    }

    if (currentDirLocal === "normal") {
      const path = TURN_FROM_NORMAL[nextDir];
      return typeof path === "function" ? path() : (path || []);
    }

    const currentNormal = DIR_DATA[currentDirLocal]?.normal;
    const nextNormal = DIR_DATA[nextDir]?.normal;

    if (currentNormal && nextNormal) {
      return [
        { file: currentNormal, frames: 3 },
        { file: nextNormal, frames: 3 }
      ];
    }

    const path = TURN_FROM_NORMAL[nextDir];
    return typeof path === "function" ? path() : (path || []);
  }

  function moveBonusOneStep() {
    if (!followTarget) return;

    const center = getBonusCenter();
    let dx = followTarget.x - center.x;
    let dy = followTarget.y - center.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= ARRIVE_DISTANCE) {
      arriveBonusAtTarget();
      return;
    }

    const amount = Math.min(STEP_DISTANCE, dist);
    dx /= dist;
    dy /= dist;

    x += dx * amount;
    y += dy * amount;
    applyBonusPosition();
  }

  function walkBonusTowardTarget() {
    if (!isFollowingLocal || isWalkingLocal || !followTarget || arrivedLocal) return;

    const center = getBonusCenter();
    const dist = Math.hypot(followTarget.x - center.x, followTarget.y - center.y);

    if (dist <= ARRIVE_DISTANCE) {
      arriveBonusAtTarget();
      return;
    }

    isWalkingLocal = true;

    const dir = chooseBonusDirectionToTarget();
    const turnSteps = getBonusTurnSteps(dir);
    const walkSteps = WALK_ANIMS[dir] || [];
    const fullSteps = [...turnSteps, ...walkSteps];

    currentDirLocal = dir;

    playBonusSteps(fullSteps, step => {
      if (step.move === true && !arrivedLocal) {
        moveBonusOneStep();
      }
    }, () => {
      isWalkingLocal = false;

      if (isFollowingLocal && !arrivedLocal) {
        walkBonusTowardTarget();
      } else if (!isFollowingLocal) {
        returnBonusToNormalFromCurrentDir();
      }
    });
  }

  function arriveBonusAtTarget() {
    if (arrivedLocal) return;

    arrivedLocal = true;
    isWalkingLocal = false;
    clearBonusMotionTimers();

    if (!arriveMessageShownLocal) {
      arriveMessageShownLocal = true;
      showBonusText(MOCHI_ARRIVE_TEXTS, 2500);
    }

    clearInterval(arriveJumpTimerLocal);
    arriveJumpTimerLocal = setInterval(() => {
      if (!isFollowingLocal || !arrivedLocal || draggingLocal || liftedLocal) return;
      playBonusAnim("idleJump", null, () => {
        const normal = currentDirLocal !== "normal"
          ? DIR_DATA[currentDirLocal]?.normal
          : "mochi_nomal.png";

        setBonusFrame(normal || "mochi_nomal.png");
      });
    }, 2000);
  }

  function returnBonusToNormalFromCurrentDir() {
    clearBonusMotionTimers();

    const normalFile = currentDirLocal !== "normal"
      ? DIR_DATA[currentDirLocal]?.normal
      : "mochi_nomal.png";

    const steps = normalFile && normalFile !== "mochi_nomal.png"
      ? [
          { file: normalFile, frames: 3 },
          { file: "mochi_nomal.png", frames: 3 }
        ]
      : [{ file: "mochi_nomal.png", frames: 1 }];

    playBonusSteps(steps, null, () => {
      currentDirLocal = "normal";
      setBonusFrame("mochi_nomal.png");
    });
  }

  function startBonusFollowing() {
    if (!enabled || draggingLocal || liftedLocal || !followTarget) return;

    stopBonusFollowTimers();
    clearBonusMotionTimers();

    isFollowingLocal = true;
    isWalkingLocal = false;
    arrivedLocal = false;
    arriveMessageShownLocal = false;

    followTalkTimerLocal = setInterval(() => {
      if (isFollowingLocal && !arrivedLocal) {
        showBonusText(MOCHI_FOLLOW_TEXTS, 2000);
      }
    }, 5000);

    walkBonusTowardTarget();
  }

  function stopBonusFollowing() {
    if (!isFollowingLocal) return;

    isFollowingLocal = false;
    arrivedLocal = false;
    arriveMessageShownLocal = false;
    stopBonusFollowTimers();

    if (!draggingLocal && !liftedLocal) {
      returnBonusToNormalFromCurrentDir();
    }
  }

  function onBonusTargetMoved() {
    if (!isFollowingLocal || !followTarget) return;

    if (arrivedLocal) {
      arrivedLocal = false;
      clearInterval(arriveJumpTimerLocal);
      arriveJumpTimerLocal = null;
      walkBonusTowardTarget();
    }
  }

  bonusRoot.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();

    bonusRoot.setPointerCapture(event.pointerId);

    const rect = bonusRoot.getBoundingClientRect();
    pointerOffsetLocal.x = event.clientX - rect.left;
    pointerOffsetLocal.y = event.clientY - rect.top;

    holdTimerLocal = setTimeout(() => {
      stopBonusFollowing();
      clearBonusMotionTimers();

      draggingLocal = true;
      liftedLocal = true;

      playBonusAnim("lift", null, () => {
        setBonusFrame("mochi_up5.png");
      });
    }, HOLD_MS);
  });

  bonusRoot.addEventListener("pointermove", event => {
    if (!draggingLocal) return;

    event.preventDefault();
    event.stopPropagation();

    x = window.scrollX + event.clientX - pointerOffsetLocal.x;
    y = window.scrollY + event.clientY - pointerOffsetLocal.y;
    applyBonusPosition();
  });

  bonusRoot.addEventListener("pointerup", event => {
    event.preventDefault();
    event.stopPropagation();

    clearTimeout(holdTimerLocal);
    holdTimerLocal = null;

    if (draggingLocal || liftedLocal) {
      draggingLocal = false;
      liftedLocal = false;

      playBonusAnim("land", null, () => {
        setBonusFrame("mochi_nomal.png");
        currentDirLocal = "normal";
      });
      return;
    }

    showBonusText("のだ〜？");
  });

  bonusRoot.addEventListener("pointercancel", event => {
    event.preventDefault();
    event.stopPropagation();

    clearTimeout(holdTimerLocal);
    holdTimerLocal = null;
    draggingLocal = false;
    liftedLocal = false;
    stopBonusFollowing();
    setBonusFrame("mochi_nomal.png");
  });

  applyBonusPosition();

  return {
    root: bonusRoot,
    startFollowing: startBonusFollowing,
    stopFollowing: stopBonusFollowing,
    onTargetMoved: onBonusTargetMoved,
    remove() {
      clearTimeout(holdTimerLocal);
      clearBonusMotionTimers();
      stopBonusFollowTimers();
      bonusRoot.remove();
    }
  };
}

function clearBonusMochi() {
  bonusMochiItems.forEach(item => item.remove?.());
  bonusMochiItems = [];
}

function syncBonusMochi() {
  if (!enabled) {
    clearBonusMochi();
    return;
  }

  const targetCount = getStoryMochiBonusCount();

    while (bonusMochiItems.length > targetCount) {
    const itemToRemove = bonusMochiItems.pop();
    itemToRemove?.remove?.();
  }

  while (bonusMochiItems.length < targetCount) {
    bonusMochiItems.push(createBonusMochi(bonusMochiItems.length));
  }
}

function startBonusMochiWatcher() {
  if (bonusMochiCheckTimer) return;

  bonusMochiCheckTimer = setInterval(() => {
    syncBonusMochi();
  }, 1500);

  syncBonusMochi();
}

document.addEventListener("DOMContentLoaded", () => {
  startBonusMochiWatcher();
});
