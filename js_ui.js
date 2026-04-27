export function showPopup(text) {
  const popup = document.getElementById("popup");
  popup.innerHTML = `
    ${text}
    <br><br>
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
    if (slot.gold) {
  div.className = "slot goldSlot";
} else {
  div.className = slot.ex ? "slot exSlot" : "slot";
}
    div.innerHTML = `
      <span style="color:gray;font-size:10px;">${index + 1}</span>
      ${slot.label}
    `;

    div.addEventListener("click", () => {
      onSlotClick(slot);
    });

    container.appendChild(div);
  });
}

export function renderSpecialsStateToArea(state, area, handlers) {
  area.innerHTML = "";

  state.specialOrder.forEach((specialKey) => {
    const sp = state.specials[specialKey];

    const div = document.createElement("div");
    div.className = "special";

    let title = sp.name;
    if (sp.effectType === "shield") {
      title += ` (残り:${state.shieldCount})`;
      if (state.shieldActive) {
        title += " [展開中]";
      }
    }

    const canExecute = handlers.canExecuteSpecial
      ? handlers.canExecuteSpecial(sp, specialKey)
      : false;

    let execButtonHtml = "";
    if (sp.actionType !== "auto" && canExecute) {
      execButtonHtml = `<button class="specialExecBtn">実行</button>`;
    }

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

export function renderPlayerState(state, container, label, handlers) {
  const confuseText =
    state.isConfusedTurn && state.confuseHits > 0
      ? `<div>攻撃無効蓄積:${state.confuseHits}</div>`
      : "";

  const nameStyle =
    state.formId === "bio"
      ? 'style="color:#bb66ff;font-weight:bold;"'
      : "";

  const statusHtml =
    Array.isArray(state.statusList) && state.statusList.length > 0
      ? `
        <div style="margin-top:6px;">
          ${state.statusList.map((text) => `<div style="color:#d9b3ff;">${text}</div>`).join("")}
        </div>
      `
      : "";

  const evadeHtml = state.overEvadeMode
    ? `<div style="color:#ff4d4d;font-weight:bold;">回避:${state.evade}/${state.overEvadeCap}<span style="color:white;font-weight:normal;">(${state.evadeMax})</span></div>`
    : `<div>回避:${state.evade}/${state.evadeMax}</div>`;

  container.innerHTML = `
    <h3>${label}</h3>
    <div ${nameStyle}><b>${state.name}</b></div>
    <div>HP:${state.hp}/${state.maxHp}</div>
    <div class="hpbar">
      <div class="hpfill" style="width:${Math.max(0, state.hp / state.maxHp * 100)}%"></div>
    </div>
    ${evadeHtml}
    ${statusHtml}
    ${confuseText}
    <br>
    <b>スロット</b>
    <div class="slotArea"></div>
    <br>
    <b>特殊行動</b>
    <div class="specialArea"></div>
  `;

  const slotArea = container.querySelector(".slotArea");
  const specialArea = container.querySelector(".specialArea");

  renderSlots(state.slots, state.rollableSlotOrder, slotArea, handlers.onSlotClick);
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

  const activeState = team[team.activeUnitKey];
  if (!activeState) {
    container.innerHTML = `<h3>${label}</h3><div>現在表示中の機体がありません</div>`;
    return;
  }

  const activeLabel = team.activeUnitKey === "unit1" ? "1" : "2";
  const focusLabel = team.focusUnitKey === "unit1" ? "1" : "2";
  const modeLabel = team.mode === "unified" ? "統合型" : "分散型";

  const confuseText =
    activeState.isConfusedTurn && activeState.confuseHits > 0
      ? `<div>攻撃無効蓄積:${activeState.confuseHits}</div>`
      : "";

  const nameStyle =
    activeState.formId === "bio"
      ? 'style="color:#bb66ff;font-weight:bold;"'
      : "";

  const statusHtml =
    Array.isArray(activeState.statusList) && activeState.statusList.length > 0
      ? `
        <div style="margin-top:6px;">
          ${activeState.statusList.map((text) => `<div style="color:#d9b3ff;">${text}</div>`).join("")}
        </div>
      `
      : "";

  const evadeHtml = activeState.overEvadeMode
    ? `<div style="color:#ff4d4d;font-weight:bold;">回避:${activeState.evade}/${activeState.overEvadeCap}<span style="color:white;font-weight:normal;">(${activeState.evadeMax})</span></div>`
    : `<div>回避:${activeState.evade}/${activeState.evadeMax}</div>`;

  const focusDisabled = handlers.canChangeFocus ? "" : "disabled";

  container.innerHTML = `
    <h3>${label}</h3>

    <div style="margin-bottom:8px;">
      <button class="teamModeBtn">[${modeLabel}]</button>
    </div>

    <div style="margin-bottom:8px; text-align:left;">
      <div style="margin-bottom:4px;">
        <b>1. ${team.unit1.name}</b>
        <div>HP:${team.unit1.hp}/${team.unit1.maxHp}</div>
        <div>回避:${team.unit1.evade}/${team.unit1.evadeMax}</div>
      </div>

      <div>
        <b>2. ${team.unit2.name}</b>
        <div>HP:${team.unit2.hp}/${team.unit2.maxHp}</div>
        <div>回避:${team.unit2.evade}/${team.unit2.evadeMax}</div>
      </div>
    </div>

    <div style="margin-bottom:6px;">
      <div style="font-size:12px;">ステータス表示</div>
      <button class="switchUnitBtn compact2v2Btn" data-unit-key="unit1">[1]</button>
      <button class="switchUnitBtn compact2v2Btn" data-unit-key="unit2">[2]</button>
      <div style="font-size:11px;">現在:${activeLabel}</div>
    </div>

    <div style="margin-bottom:8px;">
      <div style="font-size:12px;">フォーカス機体</div>
      <button class="focusUnitBtn compact2v2Btn" data-unit-key="unit1" ${focusDisabled}>[1]</button>
      <button class="focusUnitBtn compact2v2Btn" data-unit-key="unit2" ${focusDisabled}>[2]</button>
      <div style="font-size:11px;">現在:${focusLabel}</div>
    </div>

    <div ${nameStyle}><b>${activeState.name}</b></div>
    <div>HP:${activeState.hp}/${activeState.maxHp}</div>
    <div class="hpbar">
      <div class="hpfill" style="width:${Math.max(0, activeState.hp / activeState.maxHp * 100)}%"></div>
    </div>
    ${evadeHtml}
    ${statusHtml}
    ${confuseText}

    <br>
    <b>スロット</b>
    <div class="slotArea"></div>

    <br>
    <b>特殊行動</b>
    <div class="specialArea"></div>
  `;

  const teamModeBtn = container.querySelector(".teamModeBtn");
  if (teamModeBtn) {
    teamModeBtn.addEventListener("click", () => {
      if (handlers.onToggleTeamMode) {
        handlers.onToggleTeamMode();
      }
    });
  }

  container.querySelectorAll(".switchUnitBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (handlers.onSwitchActiveUnit) {
        handlers.onSwitchActiveUnit(btn.dataset.unitKey);
      }
    });
  });

  container.querySelectorAll(".focusUnitBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (handlers.onSwitchFocusUnit) {
        handlers.onSwitchFocusUnit(btn.dataset.unitKey);
      }
    });
  });

  const slotArea = container.querySelector(".slotArea");
  const specialArea = container.querySelector(".specialArea");

  renderSlots(
    activeState.slots,
    activeState.rollableSlotOrder,
    slotArea,
    handlers.onSlotClick
  );

  renderSpecialsStateToArea(activeState, specialArea, {
    onSpecialDesc: handlers.onSpecialDesc,
    onSpecialExec: handlers.onSpecialExec,
    canExecuteSpecial: handlers.canExecuteSpecial
  });
}

function buildAttackTags(attack) {
  const tags = [];

  const renderTag = (text, isAdded = false) => {
    if (isAdded) {
      return `<span style="color:#ffd966;font-weight:bold;">${text}</span>`;
    }
    return `<span>${text}</span>`;
  };

  if (attack.type === "shoot") tags.push(renderTag("[射]"));
  if (attack.type === "melee") tags.push(renderTag("[格]"));

  if (attack.cannotEvade) {
    tags.push(renderTag("[必]", !!attack.addedCannotEvade));
  }

  if (attack.ignoreReduction) {
    tags.push(renderTag("[不]", !!attack.addedIgnoreReduction));
  }

  if (attack.beam) {
    tags.push(renderTag("[ビ]", !!attack.addedBeam));
  }

  return tags.join("");
}

export function renderPendingChoiceUI({
  title,
  choices,
  onChoose
}) {
  const attackLog = document.getElementById("attackLog");
  attackLog.innerHTML = "";

  const titleDiv = document.createElement("div");
  titleDiv.style.fontWeight = "bold";
  titleDiv.style.marginBottom = "6px";
  titleDiv.textContent = title;
  attackLog.appendChild(titleDiv);

  const wrap = document.createElement("div");

  choices.forEach((choice) => {
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
