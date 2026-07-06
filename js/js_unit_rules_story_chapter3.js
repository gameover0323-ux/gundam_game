import { addEvade, reduceEvade, setForm, doubleEvadeRedCap, normalizeEvadeCapState } from "./js_unit_runtime.js";
import { createAttack } from "./js_battle_system.js";

function n(value) {
  return Math.max(0, Number(value || 0));
}

function getAttackType(attack) {
  return attack?.type || attack?.attackType || "";
}

function isBeam(attack) {
  return attack?.beam === true;
}

function isIgnoreReduction(attack) {
  return attack?.ignoreReduction === true || attack?.ignoreDefense === true;
}

function isGrazeFamily(state) {
  return [
    "story_graze",
    "story_schwalbe_graze",
    "story_graze_ritter",
    "story_graze_ein"
  ].includes(state?.unitId || state?.id);
}

function ensureChapter3State(state) {
  if (!state) return;
  if (typeof state.storyChapter3NextCannotEvade !== "boolean") state.storyChapter3NextCannotEvade = false;
  if (typeof state.storyChapter3NextShootCannotEvade !== "boolean") state.storyChapter3NextShootCannotEvade = false;
  if (typeof state.storyChapter3IaiStock !== "number") state.storyChapter3IaiStock = 0;
  if (typeof state.storyChapter3IaiPending !== "boolean") state.storyChapter3IaiPending = false;
  if (typeof state.storyChapter3IaiContextId !== "string") state.storyChapter3IaiContextId = "";
  
  if (typeof state.storyGrazeEinPileBunkerUsed !== "boolean") state.storyGrazeEinPileBunkerUsed = false;
  if (typeof state.storyGrazeEinOrganicOrbitReady !== "boolean") state.storyGrazeEinOrganicOrbitReady = false;
  if (!state.storyGrazeEinLastAttack) state.storyGrazeEinLastAttack = null;
  if (typeof state.storyDeathMasterSyncCount !== "number") state.storyDeathMasterSyncCount = 0;
  if (typeof state.storyDeathMasterDamageBonus !== "number") state.storyDeathMasterDamageBonus = 0;
}

function makeContextId(context = {}) {
  const ctxAtk = context.currentAttackContext || {};
  return [
    ctxAtk.ownerPlayer || context.attackerPlayer || "",
    ctxAtk.enemyPlayer || context.defenderPlayer || "",
    ctxAtk.slotKey || "",
    ctxAtk.slotLabel || "",
    context.attackIndex ?? ""
  ].join("|");
}

function pushReservedAction(state, action) {
  if (!state) return;
  if (!Array.isArray(state.pendingReservedActions)) state.pendingReservedActions = [];
  state.pendingReservedActions.push({
    id: action.id || `story_chapter3_reserved_${Date.now()}_${Math.random()}`,
    delay: Number(action.delay || 0),
    trigger: action.trigger || "turn_start",
    ownerPlayer: action.ownerPlayer,
    enemyPlayer: action.enemyPlayer,
    type: action.type || "attack",
    label: action.label || "予約アクション",
    attacks: Array.isArray(action.attacks) ? action.attacks : []
  });
}

function heal(state, amount) {
  if (!state) return 0;
  const value = n(amount);
  state.hp = Math.min(n(state.maxHp || state.hp), n(state.hp) + value);
  return value;
}

function getStatus(state) {
  ensureChapter3State(state);
  const status = [];
  if (state.storyChapter3NextCannotEvade) status.push("次攻撃必中");
  if (state.storyChapter3NextShootCannotEvade) status.push("次射撃必中");
  if (state.storyChapter3IaiStock > 0) status.push(`居合待ち:${state.storyChapter3IaiStock}`);

  
  if (state.storyGrazeEinOrganicOrbitReady) status.push("次ターン2回行動");
  if (state.formId === "death_master") status.push(`シンクロ+${n(state.storyDeathMasterDamageBonus)}`);
  return status;
}

export function getStoryChapter3DerivedState(state) {
  ensureChapter3State(state);
  return { name: null, slots: {}, specials: {}, status: getStatus(state) };
}

export function canUseStoryChapter3Special(state, specialKey, context = {}) {
  ensureChapter3State(state);
  const special = state?.specials?.[specialKey];
  if (!special) return { allowed: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "story_gunbarrel_deploy") {
    return {
      allowed: n(state.evade) >= 1,
      message: n(state.evade) >= 1 ? null : "回避が足りない"
    };
  }

  return { allowed: true, message: null };
}

export function executeStoryChapter3Special(state, specialKey, context = {}) {
  ensureChapter3State(state);
  const special = state?.specials?.[specialKey];
  if (!special) return { handled: true, redraw: false, message: "特殊行動データが見つからない" };

  if (special.effectType === "story_gunbarrel_deploy") {
    if (n(state.evade) < 1) return { handled: true, redraw: false, message: "回避が足りない" };
    reduceEvade(state, 1);
    return {
      handled: true,
      redraw: true,
      message: "ガンバレル展開：回避1消費、30ダメージ追撃",
      appendAttacks: createAttack(30, 1, { type: "shoot", source: "ガンバレル展開" })
    };
  }

  return { handled: false, redraw: false, message: null };
}

export function onStoryChapter3TurnEnd(state, context = {}) {
  ensureChapter3State(state);
  state.storyChapter3IaiContextId = "";
  state.storyGrazeEinPileBunkerUsed = false;

  if (state.storyGrazeEinOrganicOrbitReady) {
    state.storyGrazeEinOrganicOrbitReady = false;
    state.actionCount = Math.max(n(state.actionCount), 2);
    return { redraw: true, message: "有機軌道：次ターン2回行動" };
  }

  return { redraw: false, message: null };
}

export function onStoryChapter3BeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureChapter3State(state);

  const slot = context.slot;
  const effect = slot?.effect;
  const messages = [];

  if (state.storyChapter3NextCannotEvade && effect?.type === "attack") {
    effect.cannotEvade = true;
    effect.addedCannotEvade = true;
    state.storyChapter3NextCannotEvade = false;
    messages.push("必中付与：この攻撃が必中化");
  }

  if (
    state.storyChapter3NextShootCannotEvade &&
    effect?.type === "attack" &&
    effect.attackType === "shoot"
  ) {
    effect.cannotEvade = true;
    effect.addedCannotEvade = true;
    state.storyChapter3NextShootCannotEvade = false;
    messages.push("狙撃耐性：この射撃攻撃が必中化");
  }

  return {
    redraw: messages.length > 0,
    message: messages.join("\n") || null
  };
}


export function onStoryChapter3EnemyBeforeSlot(state, rolledSlotNumber, context = {}) {
  ensureChapter3State(state);

  if (state.storyChapter3IaiStock > 0) {
    const enemy = context.enemyState;
    const key = context.enemyRolledSlotKey;
    const slot = enemy?.slots?.[key];
    const kind = slot?.effect?.type;

    if (kind === "attack" || kind === "custom") {
      state.storyChapter3IaiPending = true;
      return { redraw: true, message: `居合待機：相手攻撃を捕捉（${state.storyChapter3IaiStock}）` };
    }

    state.storyChapter3IaiStock = 0;
    state.storyChapter3IaiPending = false;
    return { redraw: true, message: "居合不発：相手スロット行動が攻撃ではなかった" };
  }

  return { redraw: false, message: null };
}

export function onStoryChapter3AfterSlotResolved(state, slotNumber, payload = {}) {
  ensureChapter3State(state);
  const resolveResult = payload.resolveResult || payload;
  const customEffectId = resolveResult.customEffectId;
  const messages = [];

  if (customEffectId === "story_tallgeese_super_vernier") {
    doubleEvadeRedCap(state);
    return {
      redraw: true,
      message: `スーパーバーニア：回避最大値を一時的に${state.overEvadeCap}へ増加`
    };
  }

  if (customEffectId === "story_tallgeese_beam_saber") {
    const damage = n(state.evade) * 5;
    return {
      redraw: false,
      appendAttacks: createAttack(damage, 1, { type: "melee", beam: true, source: "ビームサーベル" })
    };
  }

  

  if (customEffectId === "story_next_shoot_cannot_evade") {
    state.storyChapter3NextShootCannotEvade = true;
    return { redraw: true, message: "狙撃耐性：次の射撃攻撃に必中付与" };
  }

  if (customEffectId === "story_graze_ritter_iai") {
    state.storyChapter3IaiStock += 1;
    return { redraw: true, message: `ナイトブレード居合：待機${state.storyChapter3IaiStock}` };
  }

  if (customEffectId === "story_graze_ein_organic_orbit") {
    state.storyGrazeEinOrganicOrbitReady = true;
    return { redraw: true, message: "有機軌道：次ターン2回行動予約" };
  }

  if (customEffectId === "story_graze_ein_drill_kick") {
    return {
      redraw: false,
      appendAttacks: [
        ...createAttack(90, 1, { type: "melee", source: "ドリルキック" }),
        ...createAttack(5, 6, { type: "melee", source: "ドリルキック追撃" })
      ]
    };
  }

  if (customEffectId === "story_graze_ein_combo") {
    const attacks = [];
    if (state.storyGrazeEinLastAttack) {
      attacks.push({ ...state.storyGrazeEinLastAttack, source: `${state.storyGrazeEinLastAttack.source || "前回攻撃"}・再現` });
    }
    const slotKeys = ["slot2", "slot3", "slot5"];
    const key = slotKeys[Math.floor(Math.random() * slotKeys.length)];
    const slot = state.slots?.[key];
    const effect = slot?.effect;
    if (effect?.type === "attack") {
      attacks.push(...createAttack(effect.damage, effect.count || 1, {
        type: effect.attackType || "melee",
        beam: !!effect.beam,
        ignoreReduction: !!effect.ignoreReduction,
        cannotEvade: !!effect.cannotEvade,
        source: slot.label
      }));
    }
    return { redraw: false, message: "阿頼耶識軌道・連撃", appendAttacks: attacks };
  }

  if (customEffectId === "story_death_army_evolve") {
    const forms = ["death_beast", "death_navy", "death_birdy", "death_master"];
    const next = forms[Math.floor(Math.random() * forms.length)];
    heal(state, 80);
    setForm(state, next, { preserveHp: true, preserveEvade: true });
    return { redraw: true, message: `進化：${state.name}` };
  }

  if (customEffectId === "story_death_master_sync") {
    state.storyDeathMasterSyncCount += 1;
    if (state.storyDeathMasterSyncCount >= 2) {
      state.storyDeathMasterSyncCount = 0;
      state.storyDeathMasterDamageBonus = 0;
      setForm(state, "base", { preserveHp: true, preserveEvade: true });
      return { redraw: true, message: "シンクロ2回目：デスアーミーへ戻る" };
    }
    state.storyDeathMasterDamageBonus += 10;
    return { redraw: true, message: `シンクロ：攻撃ダメージ+${state.storyDeathMasterDamageBonus}` };
  }
  if (customEffectId === "story_death_master_evade_heal") {
    addEvade(state, 2);
    heal(state, 50);
    return { redraw: true, message: "デスマスター：回避+2、HP50回復" };
  }

  if (customEffectId === "story_death_master_ranbu") {
    addEvade(state, 1);
    return {
      redraw: true,
      message: "乱舞：30ダメージ×3回、回避+1",
      appendAttacks: createAttack(30 + n(state.storyDeathMasterDamageBonus), 3, {
        type: "melee",
        source: "乱舞"
      })
    };
  }
  if (customEffectId === "story_gunbarrel_combo_rifle") {
    const damage = n(state.evade) > 0 ? 20 * n(state.evade) : 50;
    return { redraw: false, appendAttacks: createAttack(damage, 1, { type: "shoot", beam: true, source: "ガンバレルコンビネーションライフル" }) };
  }

  if (customEffectId === "story_gunbarrel_all_range") {
    const damage = n(state.evade) > 0 ? 30 * n(state.evade) : 80;
    return { redraw: false, appendAttacks: createAttack(damage, 1, { type: "shoot", beam: true, source: "ガンバレルオールレンジショット" }) };
  }

  if (resolveResult.kind === "attack" && Array.isArray(resolveResult.attacks) && resolveResult.attacks.length > 0) {
    const first = resolveResult.attacks[0];
    state.storyGrazeEinLastAttack = { ...first };
  }

  return { redraw: messages.length > 0, message: messages.join(" / ") || null };
}

export function onStoryChapter3ActionResolved(attacker, defender, context = {}) {
  ensureChapter3State(attacker);

  const messages = [];
  const hitCount = n(context.hitCount);
  const slotNumber = Number(context.slotNumber || 0);
  const attackerId = attacker?.unitId || attacker?.id || "";

  if (hitCount > 0 && defender) {
    if (
      (attackerId === "story_gyan" && slotNumber === 1) ||
      (attackerId === "story_gouf_chapter3" && slotNumber === 1)
    ) {
      defender.evade = 0;
      normalizeEvadeCapState(defender);
      messages.push("命中効果：相手の所持回避消滅");
    }

    if (attackerId === "story_gouf_chapter3" && slotNumber === 6) {
      attacker.storyChapter3NextCannotEvade = true;
      messages.push("ヒートロッド捕縛：次の攻撃が必中になる");
    }

    const attack = context.attack || {};
    if (attack.onHit === "next_attack_cannot_evade") {
      attacker.storyChapter3NextCannotEvade = true;
      messages.push("命中効果：次の攻撃が必中になる");
    }
  }

  if (
    hitCount > 0 &&
    attacker.storyGrazeEinPileBunkerUsed === false &&
    attackerId === "story_graze_ein"
  ) {
    attacker.storyGrazeEinPileBunkerUsed = true;
    return {
      redraw: true,
      message: [...messages, "パイルバンカー：50ダメージ追撃"].join(" / "),
      appendAttacks: createAttack(50, 1, { type: "melee", source: "パイルバンカー" })
    };
  }

  return {
    redraw: messages.length > 0,
    message: messages.join(" / ") || null
  };
}

export function onStoryChapter3Damaged(defender, attacker, context = {}) {
  ensureChapter3State(defender);
  return { redraw: false, message: null };
}

export function modifyStoryChapter3TakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureChapter3State(defender);
  let finalDamage = n(damage);
  const messages = [];

  if (defender.storyChapter3IaiPending) {
    const contextId = makeContextId(context);
    if (!defender.storyChapter3IaiContextId) {
      defender.storyChapter3IaiContextId = contextId;
      const count = Math.max(1, n(defender.storyChapter3IaiStock));
      defender.storyChapter3IaiStock = 0;
      defender.storyChapter3IaiPending = false;
      pushReservedAction(defender, {
        trigger: "turn_start",
        delay: 1,
        ownerPlayer: context.defenderPlayer,
        enemyPlayer: context.attackerPlayer,
        type: "attack",
        label: `ナイトブレード居合 ${count}回`,
        attacks: createAttack(50, count, { type: "melee", source: "ナイトブレード居合" })
      });
    }
    if (defender.storyChapter3IaiContextId === contextId) {
      return { damage: 0, cancelled: true, message: "ナイトブレード居合：攻撃無効" };
    }
  }

  if ((defender.unitId || defender.id) === "story_guncannon" && !isIgnoreReduction(attack)) {
    finalDamage = Math.ceil(finalDamage * 0.8);
    messages.push("重装甲：20%軽減");
  }

  if ((defender.unitId || defender.id) === "story_guntank" && !isIgnoreReduction(attack)) {
    if (getAttackType(attack) === "shoot") {
      finalDamage = Math.ceil(finalDamage / 2);
      messages.push("射撃耐性：射撃半減");
    }
    if (getAttackType(attack) === "melee") {
      finalDamage = Math.ceil(finalDamage * 1.5);
      messages.push("格闘脆弱：1.5倍");
    }
  }

  if (isGrazeFamily(defender) && isBeam(attack) && !isIgnoreReduction(attack)) {
    finalDamage = Math.ceil(finalDamage / 2);
    messages.push("ナノラミネートアーマー：ビーム半減");
  }

  if ((defender.unitId || defender.id) === "story_gunbarrel_dagger" && n(defender.evade) > 0) {
    finalDamage = Math.ceil(finalDamage * 1.5);
    messages.push("エネルギーデメリット：被ダメージ1.5倍");
  }

  if ((defender.unitId || defender.id) === "story_tallgeese" && n(defender.evade) >= 9) {
    finalDamage = Math.ceil(finalDamage * 1.25);
    messages.push("高機動負荷：被ダメージ25%上昇");
  }

  if (
    ["story_leo", "story_tallgeese"].includes(defender.unitId || defender.id) &&
    !isIgnoreReduction(attack) &&
    Math.random() < 0.2
  ) {
    finalDamage = Math.floor(finalDamage / 2);
    messages.push("簡易シールド：被ダメージ半減");
  }

  return { damage: finalDamage, message: messages.join(" / ") || null };
}

export function modifyStoryChapter3EvadeAttempt(defender, attacker, attack, context = {}) {
  ensureChapter3State(defender);
  return { handled: false };
}

export function onStoryChapter3ResolveChoice(state, pendingChoice, selectedValue, context = {}) {
  ensureChapter3State(state);
  return { handled: false, redraw: false, message: null };
}
