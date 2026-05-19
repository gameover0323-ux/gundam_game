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
function getStatusLineHtml(text) {
  if (typeof text !== "string") return "";

  if (text.startsWith("NT-D覚醒 残")) {
    return `<div style="color:#66ff99;font-weight:bold;">${text}</div>`;
  }

  if (text.startsWith("NT-D 残")) {
    return `<div style="color:#ff4444;font-weight:bold;">${text}</div>`;
  }

  return `<div style="color:#d9b3ff;">${text}</div>`;
}
function getEvadeDisplayHtml(state) {
  if (!state) return "回避:-";

  const current = typeof state.evade === "number" ? state.evade : 0;
  const baseMax = typeof state.evadeMax === "number" ? state.evadeMax : 0;
  const overCap =
    typeof state.overEvadeCap === "number"
      ? state.overEvadeCap
      : baseMax;
  const absoluteMax =
    typeof state.overEvadeAbsoluteMax === "number"
      ? state.overEvadeAbsoluteMax
      : 50;

  if (current <= baseMax) {
    return `回避:${current}/${baseMax}`;
  }

  const displayCap = Math.min(overCap, absoluteMax);

  if (displayCap >= absoluteMax) {
    const currentHtml =
      current > displayCap
        ? `<span class="evadeRedValue">${current}</span>`
        : `${current}`;

    return `回避:${currentHtml}/<span class="evadeGoldCap">${displayCap}</span>`;
  }

  return `回避:<span class="evadeRedValue">${current}</span>/<span class="evadeRedCap">${displayCap}</span>`;
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
          ${state.statusList.map((text) => getStatusLineHtml(text)).join("")}
        </div>
      `
      : "";

  const evadeHtml = `
    <div class="evadeInfo">${getEvadeDisplayHtml(state)}</div>
  `;

  container.innerHTML = `
    <h3>${label}</h3>
    <div ${nameStyle}><b>${state.displayName || state.name}</b></div>
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

  if (attack.moonlightButterfly) {
    tags.push(renderTag("[月光蝶]"));
  }

  return tags.join("");
}

export function renderPendingChoiceUI({
  title,
  choices,
  choiceType,
  currentValue,
  digits,
  onChoose
}) {
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

        renderPendingChoiceUI({
          title,
          choiceType,
          currentValue: value,
          digits,
          onChoose
        });
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
      renderPendingChoiceUI({
        title,
        choiceType,
        currentValue: "",
        digits,
        onChoose
      });
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
