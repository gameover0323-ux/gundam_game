const MOCHI_STORAGE_KEY = "gbs_mochi_state_v1";
const MOCHI_BASE_PATH = "assets/mochi/";
const MOCHI_FRAME_MS = 1000 / 60;

const MOCHI_ANIMS = {
  normal: [{ file: "mochi_nomal.png", frames: 1 }],

  idleBlink: [
    { file: "mochi_idol1.png", frames: 3 },
    { file: "mochi_idol2.png", frames: 3 },
    { file: "mochi_idol1.png", frames: 3 },
    { file: "mochi_nomal.png", frames: 1 }
  ],

  idleJump: [
    { file: "mochi_up1.png", frames: 3 },
    { file: "mochi_up2.png", frames: 3 },
    { file: "mochi_up3.png", frames: 3 },
    { file: "mochi_up4.png", frames: 3 },
    { file: "mochi_up5.png", frames: 3 },
    { file: "mochi_up4.png", frames: 3 },
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

const MOCHI_TAP_TEXTS = ["なんなのだ？", "みかんほしーのだ", "よーちゃんどこなのだ？", "ひまなのだ", "のだ〜"];
const MOCHI_IDLE_TEXTS = ["さんぽするのだ", "みかんどこなのだ", "のだ〜", "ひとやすみなのだ", "あそぶのだ"];

const MOCHI_SIZE = 72;
const HOLD_MS = 420;

let state = loadState();
let root = null;
let img = null;
let bubble = null;
let enabled = state.enabled === true;
let mode = "idle";
let frameTimer = null;
let holdTimer = null;
let idleMotionTimer = null;
let idleTextTimer = null;
let dragging = false;
let lifted = false;
let canTap = true;
let idleJumpLooped = false;
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
  startIdleMode();
}

function removeMochi() {
  clearMotionTimers();
  clearTimeout(holdTimer);
  holdTimer = null;
  stopIdleTimers();

  if (root) root.remove();

  root = null;
  img = null;
  bubble = null;
  dragging = false;
  lifted = false;
  canTap = true;
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

function showNormal() {
  clearMotionTimers();
  mode = "idle";
  setFrameFile("mochi_nomal.png");
}

function playAnim(animName, onStep, onEnd) {
  clearMotionTimers();

  const anim = MOCHI_ANIMS[animName];
  if (!anim) return;

  mode = animName;

  let stepIndex = 0;
  let frameRemain = Number(anim[0].frames || 1);

  setFrameFile(anim[0].file);
  if (typeof onStep === "function") onStep(anim[0], stepIndex);

  frameTimer = setInterval(() => {
    frameRemain--;

    if (frameRemain > 0) return;

    stepIndex++;

    if (stepIndex >= anim.length) {
      clearMotionTimers();
      if (typeof onEnd === "function") onEnd();
      return;
    }

    const step = anim[stepIndex];
    frameRemain = Number(step.frames || 1);
    setFrameFile(step.file);

    if (typeof onStep === "function") onStep(step, stepIndex);
  }, MOCHI_FRAME_MS);
}

function startIdleMode() {
  canTap = true;
  idleJumpLooped = false;
  showNormal();
  stopIdleTimers();

  idleMotionTimer = setInterval(() => {
    if (!root || dragging || lifted || mode !== "idle") return;

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
      playIdleJumpSequence();
    }
  }, 5000);

  idleTextTimer = setInterval(() => {
    if (!root || dragging || lifted || mode !== "idle") return;

    if (Math.random() < 0.3) {
      showRandomText(MOCHI_IDLE_TEXTS, 2000);
    }
  }, 10000);
}

function playIdleJumpSequence() {
  playAnim("idleJump", null, () => {
    if (!idleJumpLooped && Math.random() < 0.5) {
      idleJumpLooped = true;
      playIdleJumpSequence();
      return;
    }

    idleJumpLooped = false;
    canTap = true;
    showNormal();
  });
}

function showRandomText(textList = MOCHI_TAP_TEXTS, durationMs = 2000) {
  if (!bubble) return;

  bubble.textContent = textList[Math.floor(Math.random() * textList.length)];
  bubble.classList.add("show");

  setTimeout(() => {
    if (bubble) bubble.classList.remove("show");
  }, durationMs);
}

function bindMochiEvents() {
  root.addEventListener("pointerdown", (event) => {
    if (!canTap && mode !== "idle") return;

    event.preventDefault();
    root.setPointerCapture(event.pointerId);

    const rect = root.getBoundingClientRect();
    pointerOffset.x = event.clientX - rect.left;
    pointerOffset.y = event.clientY - rect.top;

    holdTimer = setTimeout(() => {
      stopIdleTimers();
      canTap = false;
      lifted = true;
      dragging = true;

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
