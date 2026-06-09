export function showPopup(text) {
  const popup = document.getElementById("popup");
  popup.innerHTML = `
    <div>${text}</div>
    <button id="closePopupBtn">閉じる</button>
  `;
  popup.style.display = "block";
  document.getElementById("closePopupBtn").addEventListener("click", () => {
    popup.style.display = "none";
  });
}

export function renderSlots(slots, slotOrder, container, onSlotClick) {
  container.innerHTML = "";

  const safeSlotOrder = Array.isArray(slotOrder) ? slotOrder : [];

  safeSlotOrder.forEach((slotKey, index) => {
    const slot = slots[slotKey];
    if (!slot) return;

    const div = document.createElement("div");
    div.className = slot.gold ? "slot goldSlot" : slot.ex ? "slot exSlot" : "slot";
    div.innerHTML = `<span>${index + 1}</span> ${slot.label}`;

    div.addEventListener("click", () => {
      onSlotClick(slot);
    });

    container.appendChild(div);
  });
}

export function renderSpecialsStateToArea(state, area, handlers) {
  area.innerHTML = "";

  if (!state || Number(state.hp || 0) <= 0 || state.isDefeated === true) {
    area.innerHTML = `<div style="color:#ff6666;font-weight:bold;">[撃墜] 特殊行動不可</div>`;
    return;
  }

  state.specialOrder.forEach((specialKey) => {
    const sp = state.specials[specialKey];

    const div = document.createElement("div");
    div.className = "special";

    let title = sp.name;

    if (sp.effectType === "shield") {
      title += ` (残り:${state.shieldCount})`;
      if (state.shieldActive) title += " [展開中]";
    }

    const canExecute = handlers.canExecuteSpecial
      ? handlers.canExecuteSpecial(sp, specialKey, state)
      : false;

    const execButtonHtml =
      sp.actionType !== "auto" && canExecute
        ? `<button class="specialExecBtn">実行</button>`
        : "";

    div.innerHTML = `
      <div>${title}</div>
      <button class="specialDescBtn">説明</button>
      ${execButtonHtml}
    `;

    const descBtn = div.querySelector(".specialDescBtn");
    if (descBtn) {
      descBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handlers.onSpecialDesc(sp);
      });
    }

    const execBtn = div.querySelector(".specialExecBtn");
    if (execBtn) {
      execBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handlers.onSpecialExec(specialKey);
      });
    }

    area.appendChild(div);
  });
}

function isUnitDefeated(state) {
  return !state || Number(state.hp || 0) <= 0 || state.isDefeated === true;
}

function getStatusLineHtml(status) {
  if (!status) return "";

  if (typeof status === "object") {
    const text = typeof status.text === "string" ? status.text : "";
    if (!text) return "";

    const color = typeof status.color === "string" ? status.color : "";
    const fontWeight = status.bold ? "font-weight:bold;" : "";

    return `<div style="${color ? `color:${color};` : ""}${fontWeight}">${text}</div>`;
  }

  if (typeof status !== "string") return "";

  return `<div>${status}</div>`;
}

function getEvadeDisplayHtml(state) {
  if (!state) return "回避:-";

  const current = Math.max(0, Number(state.evade || 0));
  const baseMax = Math.max(0, Number(state.evadeMax || 0));
  const redCap = Math.max(baseMax, Number(state.overEvadeCap || baseMax));
  const absoluteMax =
    typeof state.overEvadeAbsoluteMax === "number"
      ? Math.max(0, Number(state.overEvadeAbsoluteMax))
      : 50;

  if (current <= baseMax && redCap <= baseMax) {
    return `回避:${current}/${baseMax}`;
  }

  if (current >= absoluteMax || redCap >= absoluteMax) {
    return `回避:<span style="color:#ffd700;">${current}/${absoluteMax}</span>`;
  }

  if (redCap > baseMax) {
    return `回避:<span style="color:#ff4444;">${current}/${redCap}</span>`;
  }

  return `回避:<span style="color:#ff4444;">${current}/${baseMax}</span>`;
}

function getHpLineHtml(state, unified = false) {
  if (!state) return "HP:-";
  if (unified) return "HP:[統合中]";
  if (isUnitDefeated(state)) return "HP:[撃墜]";
  return `HP:${state.hp}/${state.maxHp}`;
}

function getEvadeLineHtml(state, unified = false, handlers = null) {
  if (!state) return "回避:-";
  if (unified) return "回避:[統合中]";
  if (isUnitDefeated(state)) return "回避:[撃墜]";

  const criticalRate =
    handlers && typeof handlers.getCriticalRate === "function"
      ? handlers.getCriticalRate(state)
      : 5;

  const disabled = Number(state.evade || 0) <= 0 ? "disabled" : "";

  return `${getEvadeDisplayHtml(state)} <button class="criticalBoostBtn" ${disabled}>会心${criticalRate}%</button>`;
}

export function renderPlayerState(state, container, label, handlers) {
  const defeated = isUnitDefeated(state);

  const confuseText =
    state.isConfusedTurn && state.confuseHits > 0
      ? `<div class="stateLine">攻撃無効蓄積:${state.confuseHits}</div>`
      : "";

  const statusHtml =
    Array.isArray(state.statusList) && state.statusList.length > 0
      ? `<div class="statusList">${state.statusList.map((text) => getStatusLineHtml(text)).join("")}</div>`
      : "";

  container.innerHTML = `
    <h3>${label}</h3>
    <div class="unitName">${state.name}${state.displaySuffix || ""}${defeated ? " [撃墜]" : ""}</div>
    <div>${getHpLineHtml(state)}</div>
    <div>${getEvadeLineHtml(state, false, handlers)}</div>
    ${statusHtml}
    ${confuseText}
    <h3>スロット</h3>
    <div class="slotArea"></div>
    <h3>特殊行動</h3>
    <div class="specialArea"></div>
  `;

  const criticalBoostBtn = container.querySelector(".criticalBoostBtn");
  if (criticalBoostBtn) {
    criticalBoostBtn.addEventListener("click", () => {
      if (handlers.onCriticalBoost) handlers.onCriticalBoost(state);
    });
  }

  const slotArea = container.querySelector(".slotArea");
  const specialArea = container.querySelector(".specialArea");

  if (defeated) {
    slotArea.innerHTML = `<div>[撃墜] スロット行動不可</div>`;
  } else {
    renderSlots(state.slots, state.rollableSlotOrder, slotArea, handlers.onSlotClick);
  }

  renderSpecialsStateToArea(state, specialArea, {
    onSpecialDesc: handlers.onSpecialDesc,
    onSpecialExec: handlers.onSpecialExec,
    canExecuteSpecial: handlers.canExecuteSpecial
  });
}

export function renderPlayerState2v2(team, container, label, handlers) {
  if (!team) {
    container.innerHTML = `<h3>${label}</h3><div>チーム未設定</div>`;
    return;
  }

  const unit1Defeated = isUnitDefeated(team.unit1);
  const unit2Defeated = isUnitDefeated(team.unit2);

  if (unit1Defeated && unit2Defeated) {
    container.innerHTML = `
      <h3>${label} [全滅]</h3>
      <div style="color:#ff6666;font-weight:bold;">1. ${team.unit1?.name || "空き"} [撃墜]</div>
      <div>HP:[撃墜]</div>
      <div style="color:#ff6666;font-weight:bold;">2. ${team.unit2?.name || "空き"} [撃墜]</div>
      <div>HP:[撃墜]</div>
    `;
    return;
  }

  if (unit1Defeated && team.activeUnitKey === "unit1") team.activeUnitKey = "unit2";
  if (unit2Defeated && team.activeUnitKey === "unit2") team.activeUnitKey = "unit1";
  if (unit1Defeated && team.focusUnitKey === "unit1") team.focusUnitKey = "unit2";
  if (unit2Defeated && team.focusUnitKey === "unit2") team.focusUnitKey = "unit1";

  const activeState = team[team.activeUnitKey];
  const activeLabel = team.activeUnitKey === "unit1" ? "1" : "2";
  const focusLabel = team.focusUnitKey === "unit1" ? "1" : "2";
  const modeLabel = team.mode === "unified" ? "統合型" : "分散型";

  const unified = team.unified || {};
  const unifiedHp = Math.max(
    0,
    Math.floor(Number(unified.baseHpA || 0)) +
      Math.floor(Number(unified.baseHpB || 0)) +
      Math.floor(Number(unified.healA || 0)) +
      Math.floor(Number(unified.healB || 0)) -
      Math.floor(Number(unified.totalDamage || 0))
  );

  const unifiedMaxHp =
    Math.max(0, Number(team.unit1?.maxHp || 0)) +
    Math.max(0, Number(team.unit2?.maxHp || 0));

  const unifiedEvadeCurrent =
    Math.max(0, Number(team.unit1?.evade || 0)) +
    Math.max(0, Number(team.unit2?.evade || 0));

  const unifiedEvadeMax =
    Math.max(0, Number(team.unit1?.evadeMax || 0)) +
    Math.max(0, Number(team.unit2?.evadeMax || 0));

  const unifiedHpPercent = unifiedMaxHp > 0
    ? Math.max(0, Math.min(100, Math.floor((unifiedHp / unifiedMaxHp) * 100)))
    : 0;

  const teamStatusHtml = team.mode === "unified" ? `
<div class="unifiedHpBox">
  <div>統合HP:${unifiedHp}/${unifiedMaxHp}</div>
  <div style="width:100%;height:14px;border:1px solid #fff;background:#222;margin:4px 0;">
    <div style="height:100%;width:${unifiedHpPercent}%;background:#ff4040;"></div>
  </div>
  <div>統合回避:${unifiedEvadeCurrent}/${unifiedEvadeMax}</div>
</div>
` : "";

  const unit1Focused = team.mode === "unified" || team.focusUnitKey === "unit1";
  const unit2Focused = team.mode === "unified" || team.focusUnitKey === "unit2";

  const unit1NameStyle = unit1Defeated
    ? "color:#777;font-weight:bold;"
    : unit1Focused
      ? "color:#ff4040;font-weight:bold;"
      : "";

  const unit2NameStyle = unit2Defeated
    ? "color:#777;font-weight:bold;"
    : unit2Focused
      ? "color:#ff4040;font-weight:bold;"
      : "";

  const activeDefeated = isUnitDefeated(activeState);

  const confuseText =
    activeState.isConfusedTurn && activeState.confuseHits > 0
      ? `<div>攻撃無効蓄積:${activeState.confuseHits}</div>`
      : "";

  const nameStyle = activeState.formId === "bio"
    ? 'style="color:#bb66ff;font-weight:bold;"'
    : "";

  const statusHtml =
    Array.isArray(activeState.statusList) && activeState.statusList.length > 0
      ? `<div>${activeState.statusList.map((text) => getStatusLineHtml(text)).join("")}</div>`
      : "";

  const focusDisabledBase = handlers.canChangeFocus ? "" : "disabled";

  container.innerHTML = `
    <h3>${label} [${modeLabel}]</h3>
    <button class="teamModeBtn">${team.mode === "unified" ? "分散型へ" : "統合型へ"}</button>

    <div style="${unit1NameStyle}">1. ${team.unit1.name}${unit1Defeated ? " [撃墜]" : ""}</div>
    <div>${getHpLineHtml(team.unit1, team.mode === "unified")}</div>
    <div>${getEvadeLineHtml(team.unit1, team.mode === "unified")}</div>

    <div style="${unit2NameStyle}">2. ${team.unit2 ? team.unit2.name : "空き"}${unit2Defeated ? " [撃墜]" : ""}</div>
    <div>${team.unit2 ? getHpLineHtml(team.unit2, team.mode === "unified") : "HP:-"}</div>
    <div>${team.unit2 ? getEvadeLineHtml(team.unit2, team.mode === "unified") : "回避:-"}</div>

    <div>ステータス表示</div>
    <button class="switchUnitBtn" data-unit-key="unit1" ${unit1Defeated ? "disabled" : ""}>[1]</button>
    <button class="switchUnitBtn" data-unit-key="unit2" ${unit2Defeated ? "disabled" : ""}>[2]</button>
    <div>現在:${activeLabel}</div>

    <div>フォーカス機体</div>
    <button class="focusUnitBtn" data-unit-key="unit1" ${focusDisabledBase || unit1Defeated ? "disabled" : ""}>[1]</button>
    <button class="focusUnitBtn" data-unit-key="unit2" ${focusDisabledBase || unit2Defeated ? "disabled" : ""}>[2]</button>
    <div>現在:${focusLabel}</div>

    ${teamStatusHtml}

    <div ${nameStyle}>${activeState.name}${activeState.displaySuffix || ""}${activeDefeated ? " [撃墜]" : ""}</div>
    <div>${getHpLineHtml(activeState, team.mode === "unified")}</div>
    <div>${getEvadeLineHtml(activeState, team.mode === "unified")}</div>
    ${statusHtml}
    ${confuseText}

    <h3>スロット</h3>
    <div class="slotArea"></div>
    <h3>特殊行動</h3>
    <div class="specialArea"></div>
  `;

  const teamModeBtn = container.querySelector(".teamModeBtn");
if (teamModeBtn) {
  teamModeBtn.addEventListener("click", () => {
    if (handlers.onToggleTeamMode) handlers.onToggleTeamMode();

    const nextActiveUnitKey =
      !isUnitDefeated(team.unit1)
        ? "unit1"
        : !isUnitDefeated(team.unit2)
          ? "unit2"
          : null;

    if (nextActiveUnitKey && handlers.onSwitchActiveUnit) {
      handlers.onSwitchActiveUnit(nextActiveUnitKey);
    }
  });
}

  container.querySelectorAll(".switchUnitBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (handlers.onSwitchActiveUnit) handlers.onSwitchActiveUnit(btn.dataset.unitKey);
    });
  });

  container.querySelectorAll(".focusUnitBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (handlers.onSwitchFocusUnit) handlers.onSwitchFocusUnit(btn.dataset.unitKey);
    });
  });

  const slotArea = container.querySelector(".slotArea");
  const specialArea = container.querySelector(".specialArea");

  if (activeDefeated) {
    slotArea.innerHTML = `<div style="color:#ff6666;font-weight:bold;">[撃墜] スロット行動不可</div>`;
  } else {
    renderSlots(activeState.slots, activeState.rollableSlotOrder, slotArea, handlers.onSlotClick);
  }

  renderSpecialsStateToArea(activeState, specialArea, {
    onSpecialDesc: handlers.onSpecialDesc,
    onSpecialExec: handlers.onSpecialExec,
    canExecuteSpecial: handlers.canExecuteSpecial
  });
}

function buildAttackTags(attack) {
  const tags = [];

  const renderTag = (text, isAdded = false) => {
    if (isAdded) return `<span style="color:#ffcc00;">${text}</span>`;
    return `<span>${text}</span>`;
  };

  if (attack.type === "shoot") tags.push(renderTag("[射]"));
  if (attack.type === "melee") tags.push(renderTag("[格]"));

  if (attack.cannotEvade) tags.push(renderTag("[必]", !!attack.addedCannotEvade));
  if (attack.ignoreReduction) tags.push(renderTag("[不]", !!attack.addedIgnoreReduction));
  if (attack.beam) tags.push(renderTag("[ビ]", !!attack.addedBeam));
  if (attack.moonlightButterfly) tags.push(renderTag("[月光蝶]"));

  return tags.join("");
}

export function renderPendingChoiceUI({ title, choices, choiceType, currentValue, digits, onChoose }) {
  const attackLog = document.getElementById("attackLog");
  attackLog.innerHTML = "";

  const titleDiv = document.createElement("div");
  titleDiv.style.fontWeight = "bold";
  titleDiv.style.marginBottom = "6px";
  titleDiv.textContent = title;
  attackLog.appendChild(titleDiv);

  if (choiceType === "numberInput") {
    let value = currentValue || "";

    const display = document.createElement("div");
    display.style.fontSize = "20px";
    display.style.marginBottom = "8px";
    display.textContent = value || "0";
    attackLog.appendChild(display);

    const keypad = document.createElement("div");

    for (let i = 0; i <= 9; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.addEventListener("click", () => {
        if (value.length >= digits) return;
        value += String(i);
        renderPendingChoiceUI({ title, choiceType, currentValue: value, digits, onChoose });
      });
      keypad.appendChild(btn);
    }

    const okBtn = document.createElement("button");
    okBtn.textContent = "決定";
    okBtn.addEventListener("click", () => {
      onChoose(value);
    });

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "クリア";
    clearBtn.addEventListener("click", () => {
      renderPendingChoiceUI({ title, choiceType, currentValue: "", digits, onChoose });
    });

    attackLog.appendChild(keypad);
    attackLog.appendChild(okBtn);
    attackLog.appendChild(clearBtn);
    return;
  }

  const wrap = document.createElement("div");

  (choices || []).forEach((choice) => {
    const btn = document.createElement("button");
    btn.textContent = choice.label;
    btn.addEventListener("click", () => {
      onChoose(choice.value);
    });
    wrap.appendChild(btn);
  });

  attackLog.appendChild(wrap);
}

export function renderAttackChoicesUI({
  currentAttack,
  battleNotice,
  currentActionHeader,
  currentActionLabel,
  onHit,
  onEvade,
  onSupportDefense,
  canSupportDefense
}) {
  const attackLog = document.getElementById("attackLog");
  attackLog.innerHTML = "";

  if (battleNotice) {
    const notice = document.createElement("div");
    notice.style.color = "#ff6666";
    notice.style.fontWeight = "bold";
    notice.style.marginBottom = "4px";
    notice.innerHTML = battleNotice;
    attackLog.appendChild(notice);
  }

  if (currentActionHeader) {
    const header = document.createElement("div");
    header.style.fontWeight = "bold";
    header.textContent = currentActionHeader;
    attackLog.appendChild(header);
  }

  if (currentActionLabel) {
    const label = document.createElement("div");
    label.style.marginBottom = "4px";
    label.textContent = currentActionLabel;
    attackLog.appendChild(label);
  }

  let lastSourceLabel = null;

  currentAttack.forEach((attack, index) => {
    if (attack.sourceLabel && attack.sourceLabel !== lastSourceLabel) {
      const source = document.createElement("div");
      source.style.marginTop = "6px";
      source.style.fontWeight = "bold";
      source.textContent = attack.sourceLabel;
      attackLog.appendChild(source);
      lastSourceLabel = attack.sourceLabel;
    }

    const row = document.createElement("div");
    const tags = buildAttackTags(attack);

    const supportButtonHtml =
      canSupportDefense && typeof onSupportDefense === "function"
        ? `<button class="supportDefenseBtn">援護防御</button>`
        : "";

    row.innerHTML = `
      ${index + 1}発目：${attack.damage}ダメージ ${tags}
      <button class="hitBtn">被弾</button>
      <button class="evadeBtn">回避</button>
      ${supportButtonHtml}
    `;

    const hitBtn = row.querySelector(".hitBtn");
    if (hitBtn) {
      hitBtn.addEventListener("click", () => {
        onHit(index);
      });
    }

    const evadeBtn = row.querySelector(".evadeBtn");
    if (evadeBtn) {
      evadeBtn.addEventListener("click", () => {
        onEvade(index);
      });
    }

    const supportDefenseBtn = row.querySelector(".supportDefenseBtn");
    if (supportDefenseBtn) {
      supportDefenseBtn.addEventListener("click", () => {
        onSupportDefense(index);
      });
    }

    attackLog.appendChild(row);
  });

  if (currentAttack.length === 0 && !battleNotice && !currentActionHeader && !currentActionLabel) {
    attackLog.textContent = "攻撃解決済み";
  }
}
