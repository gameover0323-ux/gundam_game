function ensureFrostState(state) {
  if (!state) return;
  if (typeof state.frostVasagoMegaSonicExCount !== "number") state.frostVasagoMegaSonicExCount = 0;
  if (typeof state.frostNextAttackCannotEvade !== "boolean") state.frostNextAttackCannotEvade = false;
}

function isAlive(unit) {
  return unit && Number(unit.hp || 0) > 0 && unit.isDefeated !== true;
}

function getPartner(state, context = {}) {
  const team = context.twoVtwoAdapter?.getOwnerTeam?.(context.ownerPlayer) || null;
  if (!team) return null;
  if (state?.id === "frost_brothers_vasago_cb") return team.unit2;
  if (state?.id === "frost_brothers_ashtaron_hc") return team.unit1;
  return null;
}

function getUnifiedSlots() {
  return {
    slot1: { label: "突貫格闘連携", desc: "50ダメージ×5回。格闘、軽減不可", effect: { type: "attack", damage: 50, count: 5, attackType: "melee", ignoreReduction: true } },
    slot2: { label: "捕縛格闘", desc: "70ダメージ。格闘。被弾時、次の攻撃に必中付与。命中時、行動権+1", effect: { type: "attack", damage: 70, count: 1, attackType: "melee", effectId: "frost_unified_bind" } },
    slot3: { label: "連携射撃", desc: "30ダメージ×7回。射撃、ビーム", effect: { type: "attack", damage: 30, count: 7, attackType: "shoot", beam: true } },
    slot4: { label: "回復", desc: "HP160回復", effect: { type: "heal", amount: 160 } },
    slot5: { label: "収束火線砲", desc: "250ダメージ。射撃", effect: { type: "attack", damage: 250, count: 1, attackType: "shoot" } },
    slot6: { label: "サテライトランチャー", desc: "600ダメージ。射撃、ビーム、軽減不可", effect: { type: "attack", damage: 600, count: 1, attackType: "shoot", beam: true, ignoreReduction: true } }
  };
}

export function getFrostBrothersDerivedState(state, context = {}) {
  ensureFrostState(state);

  const partner = getPartner(state, context);
  const isUnified = context.twoVtwoAdapter?.isUnifiedOwner?.(context.ownerPlayer);

  if (isUnified && isAlive(partner)) {
    return {
      name: "フロスト兄弟",
      status: [
        "統合型専用スロット",
        "攻撃を30%で自動回避",
        "被ダメージ30%軽減"
      ],
      slots: getUnifiedSlots(),
      slotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"],
      rollableSlotOrder: ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"]
    };
  }

  if (state.id === "frost_brothers_vasago_cb") {
    const slots = {};

    if (state.frostVasagoMegaSonicExCount > 0) {
      slots.slot6 = {
        label: "6EX メガソニック砲",
        desc: "100ダメージ。射撃、ビーム、軽減不可。3回使用で通常6へ戻る",
        ex: true,
        effect: {
          type: "attack",
          damage: 100,
          count: 1,
          attackType: "shoot",
          beam: true,
          ignoreReduction: true,
          effectId: "frost_vasago_mega_sonic_ex"
        }
      };
    }

    const status = [];
    if (isAlive(partner)) status.push("アシュタロン健在：30%で攻撃を自動回避");
    if (state.frostNextAttackCannotEvade) status.push("次の攻撃に必中付与");

    return { status, slots };
  }

  if (state.id === "frost_brothers_ashtaron_hc") {
    const slots = {};
    if (!isAlive(partner)) {
      slots.slot3 = {
        label: "3EX ギガンティックシザース格闘",
        desc: "100ダメージ。格闘",
        ex: true,
        effect: { type: "attack", damage: 100, count: 1, attackType: "melee" }
      };
    }

    const status = [];
    if (isAlive(partner)) status.push("ヴァサーゴ健在：自身の被ダメージ30%軽減");

    return { status, slots };
  }

  return { status: [] };
}

export function onFrostBrothersBeforeSlot(state, slotNumber, context = {}) {
  ensureFrostState(state);

  const team = context.twoVtwoAdapter?.getOwnerTeam?.(context.ownerPlayer);
  const partner = getPartner(state, context);

  if (
    team &&
    team.mode === "unified" &&
    (!isAlive(team.unit1) || !isAlive(team.unit2))
  ) {
    if (typeof context.twoVtwoAdapter?.exitUnified === "function") {
      context.twoVtwoAdapter.exitUnified(team);
    }
    team.mode = "split";
    return { redraw: true, message: "片方が撃墜されたため統合型を解除" };
  }

  if (state.frostNextAttackCannotEvade) {
    state.frostNextAttackCannotEvade = false;
    return {
      redraw: true,
      message: `${state.name} の次攻撃に必中付与`,
      modifySlot: (slot) => {
        if (!slot?.effect || slot.effect.type !== "attack") return slot;
        return {
          ...slot,
          effect: {
            ...slot.effect,
            cannotEvade: true,
            addedCannotEvade: true
          }
        };
      }
    };
  }

  return { redraw: false, message: null };
}

export function onFrostBrothersAfterSlotResolved(state, slotNumber, payload = {}) {
  ensureFrostState(state);

  const resolveResult = payload.resolveResult || payload;
  const context = payload.context || payload;
  const slotKey = context.slotKey || `slot${slotNumber}`;
  const slot = state.slots?.[slotKey] || null;
  const effectId = resolveResult.customEffectId || slot?.effect?.effectId || null;

  if (effectId === "frost_vasago_triple_mega_sonic") {
    state.frostVasagoMegaSonicExCount = 1;
    return { redraw: true, message: "トリプルメガソニック砲使用：6EXへ変化" };
  }

  if (effectId === "frost_vasago_mega_sonic_ex") {
    state.frostVasagoMegaSonicExCount += 1;
    if (state.frostVasagoMegaSonicExCount >= 4) {
      state.frostVasagoMegaSonicExCount = 0;
      return { redraw: true, message: "メガソニック砲3回使用：通常6へ戻る" };
    }
    return { redraw: true, message: `メガソニック砲使用：${state.frostVasagoMegaSonicExCount - 1}/3` };
  }

  if (
    effectId === "frost_ashtaron_bind" &&
    Number(resolveResult.hitCount || context.hitCount || 0) > 0
  ) {
    const partner = getPartner(state, context);
    if (partner) {
      ensureFrostState(partner);
      partner.frostNextAttackCannotEvade = true;
    }
    return { redraw: true, message: "シザース捕縛：ヴァサーゴの次攻撃に必中付与" };
  }

  if (
    effectId === "frost_unified_bind" &&
    Number(resolveResult.hitCount || context.hitCount || 0) > 0
  ) {
    state.frostNextAttackCannotEvade = true;
    context.twoVtwoAdapter?.addActionCount?.(context.ownerPlayer, state, 1);
    return { redraw: true, message: "捕縛格闘命中：次攻撃に必中付与 / 行動権+1" };
  }

  return { redraw: false, message: null };
}

export function modifyFrostBrothersTakenDamage(defender, attacker, attack, damage, context = {}) {
  ensureFrostState(defender);

  const partner = getPartner(defender, context);
  const isUnified = context.twoVtwoAdapter?.isUnifiedOwner?.(context.ownerPlayer);

  if (isUnified) {
    return {
      damage: Math.floor(Number(damage || 0) * 0.7),
      message: "フロスト兄弟特性：被ダメージ30%軽減"
    };
  }

  if (defender.id === "frost_brothers_ashtaron_hc" && isAlive(partner)) {
    return {
      damage: Math.floor(Number(damage || 0) * 0.7),
      message: "アシュタロン特性：被ダメージ30%軽減"
    };
  }

  return { damage, message: null };
}

export function modifyFrostBrothersEvadeAttempt(defender, attacker, attack, context = {}) {
  ensureFrostState(defender);

  if (attack?.cannotEvade) return { handled: false };

  const partner = getPartner(defender, context);
  const isUnified = context.twoVtwoAdapter?.isUnifiedOwner?.(context.ownerPlayer);

  if (isUnified || (defender.id === "frost_brothers_vasago_cb" && isAlive(partner))) {
    if (Math.random() < 0.3) {
      return { handled: true, ok: true, consumeEvade: 0, message: "フロスト兄弟特性：自動回避" };
    }
  }

  return { handled: false };
}
