import { createAttack } from "./js_battle_system.js";
import {
  getSlotByKey,
  getSlotNumberFromKey,
  executeUnitSpecial,
  executeUnitCanUseSpecial,
  executeUnitResolveChoice,
  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,
  executeUnitAfterSlotResolved,
  executeUnitExtraWeaponResult
} from "./js_unit_runtime.js";
import { resolveSlotEffect } from "./js_slot_effects.js";
import { executeCommonSpecial } from "./js_special_actions.js";

export function createActionLayer(ctx) {
  function ensureReservedActions(state) {
    if (!state) return [];

    if (!Array.isArray(state.pendingReservedActions)) {
      state.pendingReservedActions = [];
    }

    return state.pendingReservedActions;
  }

  function reserveAction(state, action) {
    const list = ensureReservedActions(state);

    list.push({
      id: action.id || `reserved_${Date.now()}_${Math.random()}`,
      delay: Number(action.delay || 0),
      trigger: action.trigger || "turn_start",
      ownerPlayer: action.ownerPlayer,
      enemyPlayer: action.enemyPlayer,
      type: action.type || "attack",
      label: action.label || "予約アクション",
      attacks: Array.isArray(action.attacks) ? action.attacks : [],
      specialKey: action.specialKey || null,
      payload: action.payload || null
    });
  }

  function processReservedActionsForTrigger(ownerPlayer, trigger) {
    const actor = ctx.getPlayerState(ownerPlayer);
    if (!actor) return false;

    const list = ensureReservedActions(actor);
    if (list.length === 0) return false;

    list.forEach((action) => {
      if (action.trigger === trigger) {
        action.delay -= 1;
      }
    });

    const readyActions = list.filter(action =>
      action.trigger === trigger && action.delay <= 0
    );

    if (readyActions.length === 0) return false;

    readyActions.forEach(action => {
      const index = list.indexOf(action);
      if (index >= 0) {
        list.splice(index, 1);
      }
      startReservedAction(action);
    });

    return true;
  }

  function getActorUnitKey(ownerPlayer, actor) {
    const team = ctx.getTeam?.(ownerPlayer);
    if (!team || !actor) return null;

    if (team.unit1 === actor) return "unit1";
    if (team.unit2 === actor) return "unit2";

    return null;
  }

  function getUnifiedSpecialAttackScope(ownerPlayer, actor) {
    const ownerUnitKey = getActorUnitKey(ownerPlayer, actor);

    const contexts =
      typeof ctx.getCurrentAttackContexts === "function"
        ? ctx.getCurrentAttackContexts()
        : [];

    const matchedContext = Array.isArray(contexts)
      ? contexts.find(context =>
          context &&
          context.ownerPlayer === ownerPlayer &&
          (
            context.attacker === actor ||
            (ownerUnitKey && context.ownerUnitKey === ownerUnitKey)
          )
        )
      : null;

    if (!matchedContext?.groupId) return null;

    const allAttacks = Array.isArray(ctx.getCurrentAttack?.())
      ? ctx.getCurrentAttack()
      : [];

    const attacks = allAttacks.filter(attack => attack.groupId === matchedContext.groupId);
    if (attacks.length <= 0) return null;

    return {
      ownerUnitKey: matchedContext.ownerUnitKey || ownerUnitKey || null,
      groupId: matchedContext.groupId,
      currentAttackContext: matchedContext,
      currentAttack: attacks
    };
  }

  function startReservedAction(action) {
    if (!action) return false;

    const ownerPlayer = action.ownerPlayer || ctx.getCurrentPlayer();
    const enemyPlayer = action.enemyPlayer || ctx.getOpponentPlayer(ownerPlayer);

    if (action.type === "attack") {
      ctx.setCurrentAction(
        `PLAYER ${ownerPlayer} の予約アクション`,
        action.label
      );

      ctx.setCurrentAttack(action.attacks);

      ctx.setCurrentAttackContext({
        ownerPlayer,
        enemyPlayer,
        slotKey: null,
        slotNumber: null,
        slotLabel: action.label,
        slotDesc: action.label,
        reservedActionId: action.id,
        reservedActionLabel: action.label,
        totalCount: action.attacks.length,
        hitCount: 0,
        evadeCount: 0
      });

      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return true;
    }

    if (action.type === "special" && action.specialKey) {
      executeSpecial(ownerPlayer, action.specialKey);
      return true;
    }

    ctx.renderAttackLogText(`${action.label}：未対応の予約アクション`);
    return true;
  }

  function resolveCommonPendingChoice(actor, choice, selectedValue, context = {}) {
    if (!choice || !choice.effectType) {
      return { handled: false };
    }

    if (choice.effectType === "hp_cost_damage_bonus") {
      const hpCost = parseInt(selectedValue, 10);

      if (!hpCost || hpCost <= 0) {
        return { handled: true, redraw: false, message: null };
      }

      if (context.twoVtwoAdapter) {
        const paid = context.twoVtwoAdapter.consumeHp(context.ownerPlayer, actor, hpCost);
        if (!paid) {
          return { handled: true, redraw: false, message: "HPが足りません" };
        }
      } else {
        if (hpCost >= actor.hp) {
          return { handled: true, redraw: false, message: "HPが足りません" };
        }
        actor.hp -= hpCost;
      }

      if (choice.params?.setFlag) {
        actor[choice.params.setFlag] = true;
      }

      if (choice.params?.zeroEvade) {
        if (context.twoVtwoAdapter && context.ownerPlayer) {
          const currentEvade = context.twoVtwoAdapter.getEvade(context.ownerPlayer, actor);
          context.twoVtwoAdapter.consumeEvade(context.ownerPlayer, actor, currentEvade);
        } else {
          actor.evade = 0;
        }
      }

      const rate =
        typeof choice.params?.damageRate === "number"
          ? choice.params.damageRate
          : 0.5;

      const bonus = Math.floor(hpCost * rate);

      if (Array.isArray(context.currentAttack)) {
        context.currentAttack.forEach((attack) => {
          attack.damage += bonus;
        });
      }

      return {
        handled: true,
        redraw: true,
        message: `${choice.params?.messagePrefix || "出力解放"}: ${bonus}ダメージ加算`
      };
    }

    if (choice.effectType === "hp_cost_append_attack") {
      const hpCost = parseInt(selectedValue, 10);

      if (!hpCost || hpCost <= 0) {
        return { handled: true, redraw: false, message: null };
      }

      if (context.twoVtwoAdapter) {
        const paid = context.twoVtwoAdapter.consumeHp(context.ownerPlayer, actor, hpCost);
        if (!paid) {
          return { handled: true, redraw: false, message: "HPが足りません" };
        }
      } else {
        if (hpCost >= actor.hp) {
          return { handled: true, redraw: false, message: "HPが足りません" };
        }
        actor.hp -= hpCost;
      }

      if (choice.params?.setFlag) {
        actor[choice.params.setFlag] = true;
      }

      if (choice.params?.zeroEvade) {
        if (context.twoVtwoAdapter && context.ownerPlayer) {
          const currentEvade = context.twoVtwoAdapter.getEvade(context.ownerPlayer, actor);
          context.twoVtwoAdapter.consumeEvade(context.ownerPlayer, actor, currentEvade);
        } else {
          actor.evade = 0;
        }
      }

      const rate =
        typeof choice.params?.damageRate === "number"
          ? choice.params.damageRate
          : 0.5;

      const damage = Math.floor(hpCost * rate);

      const appendAttacks = createAttack(damage, choice.params?.count || 1, {
        type: choice.params?.attackType || "shoot",
        beam: !!choice.params?.beam,
        cannotEvade: !!choice.params?.cannotEvade,
        ignoreReduction: !!choice.params?.ignoreReduction,
        ignoreDefense: !!choice.params?.ignoreDefense,
        special: choice.params?.special || null,
        source: choice.params?.sourceLabel || "追加攻撃"
      });

      return {
        handled: true,
        redraw: true,
        message: choice.params?.message || null,
        appendAttacks
      };
    }

    return { handled: false };
  }

  function runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta = {}) {
    const enemyPlayer = slotMeta.enemyPlayer || ctx.getOpponentPlayer(slotMeta.ownerPlayer);
    const enemyState = ctx.getPlayerState(enemyPlayer);

    const afterResult = executeUnitAfterSlotResolved(actor, slotNumber, {
      ...slotMeta,
      enemyPlayer,
      enemyState,
      resolveResult,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    }) || {};

    if (afterResult.redraw) {
      ctx.redrawBattleBoards();
    }

    if (afterResult.message) {
      ctx.appendBattleNotice(afterResult.message);
    }

    if (afterResult.reserveAction) {
      reserveAction(actor, afterResult.reserveAction);
    }

    if (Array.isArray(afterResult.reserveActions)) {
      afterResult.reserveActions.forEach(action => {
        reserveAction(actor, action);
      });
    }

    return afterResult;
  }

  function startSlotAction(ownerPlayer, slotKey, slotOverride = null) {
    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const actor = ctx.getPlayerState(ownerPlayer);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    if (!actor) return false;

    let slot = slotOverride || getSlotByKey(actor, slotKey);
    if (!slot) return false;

    let slotNumber = getSlotNumberFromKey(slotKey);

    actor.lastSlotKey = slotKey;

    const beforeResult = executeUnitBeforeSlot(actor, slotNumber, {
      ownerPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender,
      slotKey,
      slot,
      isForcedSlotAction: !!slotOverride,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (beforeResult.redraw) {
      ctx.redrawBattleBoards();
    }

    if (beforeResult.message) {
      ctx.appendBattleNotice(beforeResult.message);
    }

    if (beforeResult.cancelSlot) {
      ctx.redrawBattleBoards();
      ctx.renderAttackLogText(beforeResult.message || "行動不能");
      return false;
    }

    if (beforeResult.replaceSlotAction) {
      slotKey = beforeResult.replaceSlotAction.slotKey || slotKey;
      slot = beforeResult.replaceSlotAction.slotData || slot;
      slotNumber = getSlotNumberFromKey(slotKey);
    }

    if (defender) {
      const enemyBeforeResult = executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: ownerPlayer,
        enemyPlayerLabel: `PLAYER ${ownerPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: actor,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (enemyBeforeResult.redraw) {
        ctx.redrawBattleBoards();
      }

      if (enemyBeforeResult.message) {
        ctx.appendBattleNotice(enemyBeforeResult.message);
      }
    }

    ctx.setCurrentAction(
      `${actor.name} の行動`,
      `${slotNumber}.${slot.label}`
    );

    ctx.redrawBattleBoards();

    resolveSlot(slot, {
      ownerPlayer,
      enemyPlayer,
      slotKey,
      slotNumber
    });

    return true;
  }

  function collectCpuSlotAction(ownerPlayer, slotKey, slotOverride = null, actionIndex = 1) {
    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const actor = ctx.getPlayerState(ownerPlayer);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    if (!actor) return null;

    let slot = slotOverride || getSlotByKey(actor, slotKey);
    if (!slot) return null;

    let slotNumber = getSlotNumberFromKey(slotKey);
    const sourceLabel = `${actionIndex}回目スロット行動：${slotNumber}.${slot.label}`;

    actor.lastSlotKey = slotKey;

    const notices = [];

    const beforeResult = executeUnitBeforeSlot(actor, slotNumber, {
      ownerPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender,
      slotKey,
      slot,
      isForcedSlotAction: !!slotOverride,
      isCpuBatchSlotAction: true,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (beforeResult.message) {
      notices.push(beforeResult.message);
    }

    if (beforeResult.redraw) {
      ctx.redrawBattleBoards();
    }

    if (beforeResult.cancelSlot) {
      return {
        ok: false,
        attacks: [],
        notices,
        message: beforeResult.message || `${sourceLabel}：行動不能`
      };
    }

    if (beforeResult.replaceSlotAction) {
      slotKey = beforeResult.replaceSlotAction.slotKey || slotKey;
      slot = beforeResult.replaceSlotAction.slotData || slot;
      slotNumber = getSlotNumberFromKey(slotKey);
    }

    if (defender) {
      const enemyBeforeResult = executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: ownerPlayer,
        enemyPlayerLabel: `PLAYER ${ownerPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: actor,
        isCpuBatchSlotAction: true,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (enemyBeforeResult.message) {
        notices.push(enemyBeforeResult.message);
      }

      if (enemyBeforeResult.redraw) {
        ctx.redrawBattleBoards();
      }
    }

    const result = resolveSlotEffect({
      slot,
      actor,
      ownerPlayer,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    const afterResult = runAfterSlotResolvedHook(actor, slotNumber, result, {
      ownerPlayer,
      enemyPlayer,
      slotKey,
      slotNumber,
      slot,
      isCpuBatchSlotAction: true
    });

    if (afterResult?.message) {
      notices.push(afterResult.message);
    }

    const extraResult = executeUnitExtraWeaponResult(actor, {
      ownerPlayer,
      enemyPlayer,
      slotKey,
      slotNumber,
      slot,
      isCpuBatchSlotAction: true,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (extraResult?.message) {
      notices.push(extraResult.message);
    }

    if (Array.isArray(extraResult?.appendMessages)) {
      notices.push(...extraResult.appendMessages.filter(Boolean));
    }

    if (extraResult?.redraw || afterResult?.redraw) {
      ctx.redrawBattleBoards();
    }

    const attacks = [
      ...(Array.isArray(result.attacks) ? result.attacks : []),
      ...(Array.isArray(afterResult?.appendAttacks) ? afterResult.appendAttacks : []),
      ...(Array.isArray(extraResult?.appendAttacks) ? extraResult.appendAttacks : [])
    ].map((attack) => ({
      ...attack,
      sourceLabel
    }));

    if (result.message && attacks.length === 0) {
      notices.push(`${sourceLabel}：${result.message}`);
    }

    return {
      ok: true,
      attacks,
      notices,
      sourceLabel,
      slotNumber,
      slotLabel: slot.label,
      slotDesc: slot.desc
    };
  }

  function executeCpuAutoSlotBatch(ownerPlayer) {
    const actor = ctx.getPlayerState(ownerPlayer);
    if (!actor) return false;

    if (typeof ctx.ensureActionState === "function") {
      ctx.ensureActionState(actor);
    }

    const adapter = ctx.twoVtwoAdapter || null;

    const getActionCount = () => {
      if (adapter) {
        return adapter.getActionCount(ownerPlayer, actor);
      }

      return Math.max(0, Number(actor.actionCount || 0));
    };

    const canConsumeAction = () => {
      if (adapter) {
        return adapter.canConsumeAction(ownerPlayer, actor, 1);
      }

      if (typeof ctx.canConsumeAction === "function") {
        return ctx.canConsumeAction(actor, 1);
      }

      return Number(actor.actionCount || 0) >= 1;
    };

    const consumeAction = () => {
      if (adapter) {
        return adapter.consumeAction(ownerPlayer, actor, 1);
      }

      if (typeof ctx.consumeActionCount === "function") {
        ctx.consumeActionCount(actor, 1);
        return true;
      }

      actor.actionCount = Math.max(0, Number(actor.actionCount || 0) - 1);
      return true;
    };

    const maxLoop = Math.max(1, Number(getActionCount() || 0));
    const allAttacks = [];
    const notices = [];
    const labels = [];
    let usedCount = 0;

    for (let i = 1; i <= maxLoop; i += 1) {
      if (!canConsumeAction()) {
        break;
      }

      const rollableSlotKeys = ctx.getRollableSlotKeys(actor);
      if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) {
        notices.push(`${actor.name}：使用可能なスロットがない`);
        break;
      }

      const slotKey = rollableSlotKeys[Math.floor(Math.random() * rollableSlotKeys.length)];
      const part = collectCpuSlotAction(ownerPlayer, slotKey, null, i);

      if (!part) {
        break;
      }

      const consumed = consumeAction();
      if (!consumed) {
        break;
      }

      usedCount += 1;

      if (part.message) {
        notices.push(part.message);
      }

      if (Array.isArray(part.notices)) {
        notices.push(...part.notices.filter(Boolean));
      }

      if (part.sourceLabel) {
        labels.push(part.sourceLabel);
      }

      if (Array.isArray(part.attacks) && part.attacks.length > 0) {
        allAttacks.push(...part.attacks);
      }

      if (ctx.getPendingChoice && ctx.getPendingChoice()) {
        break;
      }

      if (ctx.getCurrentAttack && ctx.getCurrentAttack().length > 0) {
        break;
      }
    }

    ctx.redrawBattleBoards();

    if (notices.length > 0) {
      notices.forEach((text) => ctx.appendBattleNotice(text));
    }

    if (allAttacks.length > 0) {
      const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);

      ctx.setCurrentAction(
        `${actor.name} の連続行動`,
        labels.join(" + ")
      );

      ctx.setCurrentAttack(allAttacks);

      ctx.setCurrentAttackContext({
        ownerPlayer,
        enemyPlayer,
        slotKey: null,
        slotNumber: null,
        slotLabel: "連続スロット行動",
        slotDesc: labels.join(" / "),
        totalCount: allAttacks.length,
        hitCount: 0,
        evadeCount: 0,
        cpuBatchAction: true,
        usedActionCount: usedCount
      });

      ctx.renderAttackChoices();
      return true;
    }

    ctx.renderAttackLogText(
      notices.length > 0
        ? notices.join("\n")
        : `${actor.name} は行動を完了`
    );

    return usedCount > 0;
  }

 function resolveSlot(slot, slotMeta = {}) {
  ctx.setCurrentAttack([]);

  const ownerPlayer = slotMeta.ownerPlayer || ctx.getCurrentPlayer();
  const enemyPlayer = slotMeta.enemyPlayer || ctx.getOpponentPlayer(ownerPlayer);
  const actor = ctx.getPlayerState(ownerPlayer);

  if (!actor || !slot) {
    ctx.renderAttackLogText("スロット処理に失敗しました");
    return;
  }

  const result = resolveSlotEffect({
    slot,
    actor,
    ownerPlayer,
    twoVtwoAdapter: ctx.twoVtwoAdapter || null
  }) || { kind: "none", attacks: [], message: "" };

  function mergeExtraResult() {
    const merged = {
      attacks: [],
      messages: [],
      redraw: false
    };

    const extraResult = executeUnitExtraWeaponResult(actor, {
      ownerPlayer,
      enemyPlayer,
      slotKey: slotMeta.slotKey,
      slotNumber: slotMeta.slotNumber,
      slot,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (!extraResult) return merged;

    if (Array.isArray(extraResult.appendAttacks)) {
      merged.attacks.push(...extraResult.appendAttacks);
    }

    if (Array.isArray(extraResult.appendMessages)) {
      merged.messages.push(...extraResult.appendMessages.filter(Boolean));
    }

    if (extraResult.message) {
      merged.messages.push(extraResult.message);
    }

    if (extraResult.redraw) {
      merged.redraw = true;
    }

    return merged;
  }

  function startAttackQte(attacks, extraContext = {}) {
    const safeAttacks = Array.isArray(attacks) ? attacks.filter(Boolean) : [];

    if (safeAttacks.length <= 0) {
      ctx.redrawBattleBoards();
      ctx.renderAttackLogText(result.message || "攻撃データがありません");
      return;
    }

    ctx.setCurrentAttack(safeAttacks);

    ctx.setCurrentAttackContext({
      ownerPlayer,
      enemyPlayer,
      slotKey: slotMeta.slotKey,
      slotNumber: slotMeta.slotNumber,
      slotLabel: extraContext.slotLabel || slot.label,
      slotDesc: extraContext.slotDesc || slot.desc || "",
      totalCount: safeAttacks.length,
      hitCount: 0,
      evadeCount: 0,
      ...extraContext
    });

    ctx.redrawBattleBoards();
    ctx.renderAttackChoices();
  }

  const afterResult = runAfterSlotResolvedHook(actor, slotMeta.slotNumber, result, {
    ...slotMeta,
    ownerPlayer,
    enemyPlayer,
    slot
  }) || {};

  const extra = mergeExtraResult();

  extra.messages.forEach((message) => {
    ctx.appendBattleNotice(message);
  });

  if (extra.redraw || afterResult.redraw) {
    ctx.redrawBattleBoards();
  }

  const attacks = [
    ...(Array.isArray(result.attacks) ? result.attacks : []),
    ...(Array.isArray(afterResult.appendAttacks) ? afterResult.appendAttacks : []),
    ...extra.attacks
  ];

  if (attacks.length > 0) {
    startAttackQte(attacks, {
      appendedOnly: result.kind !== "attack",
      sourceLabel:
        attacks[0]?.source ||
        afterResult.appendAttackLabel ||
        slot.label,
      slotLabel:
        afterResult.appendSlotLabel ||
        afterResult.appendAttackLabel ||
        slot.label,
      slotDesc:
        afterResult.appendSlotDesc ||
        slot.desc ||
        ""
    });
    return;
  }

  ctx.redrawBattleBoards();

  if (result.message) {
    ctx.renderAttackLogText(result.message);
  } else {
    ctx.renderAttackLogText("行動完了");
  }

  if (ctx.getBattleMode() === "2v2") {
    executeNextQueuedSlot();
  }
}

  function executeSpecial(ownerPlayer, specialKey) {
    const actor = ctx.getPlayerState(ownerPlayer);
    const special = actor?.specials?.[specialKey];

    if (!actor || !special) {
      ctx.showPopup("特殊行動データが見つからない");
      return;
    }

    const unifiedScope = getUnifiedSpecialAttackScope(ownerPlayer, actor);
    const scopedCurrentAttack = unifiedScope?.currentAttack || ctx.getCurrentAttack();
    const scopedCurrentAttackContext = unifiedScope?.currentAttackContext || ctx.getCurrentAttackContext();
    const scopedOwnerUnitKey = unifiedScope?.ownerUnitKey || getActorUnitKey(ownerPlayer, actor);

    const specialContextBase = {
      ownerPlayer,
      enemyPlayer: ctx.getOpponentPlayer(ownerPlayer),
      ownerUnitKey: scopedOwnerUnitKey,
      currentAttackContext: scopedCurrentAttackContext,
      currentAttack: scopedCurrentAttack,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    };

    const availability = executeUnitCanUseSpecial(actor, specialKey, specialContextBase);

    if (availability.allowed === false) {
      ctx.showPopup(availability.message || "このタイミングでは実行できない");
      return;
    }

    if (!ctx.canExecuteSpecialForPlayer(ownerPlayer, special)) {
      ctx.showPopup("このタイミングでは実行できない");
      return;
    }

    const commonResult = executeCommonSpecial(actor, specialKey);

    if (commonResult.handled) {
      if (commonResult.redraw) {
        ctx.redrawBattleBoards();
      }

      if (commonResult.message) {
        ctx.showPopup(commonResult.message);
      }

      return;
    }

    if (
      ctx.twoVtwoAdapter &&
      ctx.twoVtwoAdapter.isUnifiedOwner(ownerPlayer) &&
      availability.allowed !== false &&
      availability.costEvade
    ) {
      ctx.twoVtwoAdapter.consumeEvade(ownerPlayer, actor, availability.costEvade);
    }

    const currentAttack = scopedCurrentAttack;
    const currentAttackContext = scopedCurrentAttackContext;

    const unitResult = executeUnitSpecial(actor, specialKey, {
      ...specialContextBase,
      enemyState: ctx.getPlayerState(ctx.getOpponentPlayer(ownerPlayer)),
      currentAttackContext,
      currentAttack
    });

    if (unitResult.handled) {
      if (unitResult.requestChoice) {
        ctx.handleChoiceRequest({
          ...unitResult.requestChoice,
          ownerUnitKey: unitResult.requestChoice.ownerUnitKey || scopedOwnerUnitKey
        });
        return;
      }

      if (unitResult.reserveAction) {
        reserveAction(actor, unitResult.reserveAction);

        if (unitResult.redraw) {
          ctx.redrawBattleBoards();
        }

        if (unitResult.message) {
          ctx.showPopup(unitResult.message);
        }

        return;
      }

      if (Array.isArray(unitResult.reserveActions)) {
        unitResult.reserveActions.forEach(action => {
          reserveAction(actor, action);
        });

        if (unitResult.redraw) {
          ctx.redrawBattleBoards();
        }

        if (unitResult.message) {
          ctx.showPopup(unitResult.message);
        }

        return;
      }

      if (unitResult.startSlotAction) {
        startSlotAction(
          ownerPlayer,
          unitResult.startSlotAction.slotKey,
          unitResult.startSlotAction.slotData || null
        );
        return;
      }

      if (unitResult.appendAttacks && unitResult.appendAttacks.length > 0) {
        const hasActiveAttack =
          Array.isArray(currentAttack) &&
          currentAttack.length > 0 &&
          currentAttackContext;

        if (hasActiveAttack) {
          const allCurrentAttack = ctx.getCurrentAttack();
          const targetContext = currentAttackContext;

          const appendAttacks = unitResult.appendAttacks.map((attack) => ({
            ...attack,
            groupId: targetContext?.groupId || attack.groupId,
            sourceLabel: targetContext?.actionLabel || attack.sourceLabel
          }));

          allCurrentAttack.push(...appendAttacks);

          if (ctx.getCurrentAttackContext()) {
            ctx.getCurrentAttackContext().totalCount += appendAttacks.length;
          }

          if (targetContext && targetContext !== ctx.getCurrentAttackContext()) {
            targetContext.totalCount = Number(targetContext.totalCount || 0) + appendAttacks.length;
          }

          ctx.setCurrentAttack(allCurrentAttack);
          ctx.setCurrentAttackContext(ctx.getCurrentAttackContext());
          ctx.redrawBattleBoards();

          if (unitResult.message) {
            ctx.appendBattleNotice(unitResult.message);
          }

          ctx.renderAttackChoices();
          return;
        }

        const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);

        ctx.setCurrentAction(
          `${actor.name} の特殊追撃`,
          unitResult.appendAttackLabel || unitResult.message || special.name
        );

        ctx.setCurrentAttack(unitResult.appendAttacks);

        ctx.setCurrentAttackContext({
          ownerPlayer,
          enemyPlayer,
          slotKey: null,
          slotNumber: null,
          slotLabel: unitResult.appendAttackLabel || special.name,
          slotDesc: unitResult.appendSlotDesc || special.desc || "",
          totalCount: unitResult.appendAttacks.length,
          hitCount: 0,
          evadeCount: 0,
          appendedFromSpecial: special.name
        });

        ctx.redrawBattleBoards();

        if (unitResult.message) {
          ctx.appendBattleNotice(unitResult.message);
        }

        ctx.renderAttackChoices();
        return;
      }

      if (unitResult.forcedSlotDesc) {
        ctx.setCurrentAttack([]);

        ctx.setCurrentAction(
          `PLAYER ${ownerPlayer} の行動`,
          unitResult.forcedSlotLabel || special.name
        );

        resolveSlot(
          {
            label: unitResult.forcedSlotLabel || special.name,
            desc: unitResult.forcedSlotDesc
          },
          {
            ownerPlayer,
            enemyPlayer: ctx.getOpponentPlayer(ownerPlayer),
            slotKey: null,
            slotNumber: null
          }
        );

        return;
      }

      if (unitResult.redraw) {
        ctx.redrawBattleBoards();
      }

      if (unitResult.message) {
        ctx.showPopup(unitResult.message);
      }

      return;
    }
  }

  function resolvePendingChoice(selectedValue) {
    const pendingChoice = ctx.getPendingChoice();
    if (!pendingChoice) return;

    const choice = pendingChoice;
    const ownerPlayer = choice.ownerPlayer;
    const enemyPlayer = choice.enemyPlayer || ctx.getOpponentPlayer(ownerPlayer);

    const actor =
      choice.ownerUnitKey && ctx.getTeam?.(ownerPlayer)
        ? ctx.getTeam(ownerPlayer)?.[choice.ownerUnitKey]
        : ctx.getPlayerState(ownerPlayer);

    const defender = ctx.getPlayerState(enemyPlayer);

    if (!actor) {
      ctx.clearPendingChoice();
      return;
    }

    const unifiedScope = getUnifiedSpecialAttackScope(ownerPlayer, actor);

    const choiceContext = {
      ownerPlayer,
      enemyPlayer,
      enemyState: defender,
      currentAttackContext: unifiedScope?.currentAttackContext || ctx.getCurrentAttackContext(),
      currentAttack: unifiedScope?.currentAttack || ctx.getCurrentAttack(),
      ownerUnitKey: unifiedScope?.ownerUnitKey || choice.ownerUnitKey || null,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    };

    let result = resolveCommonPendingChoice(actor, choice, selectedValue, choiceContext);

    if (!result.handled) {
      result = executeUnitResolveChoice(actor, choice, selectedValue, choiceContext);
    }

    ctx.clearPendingChoice();

    if (!result.handled) {
      ctx.redrawBattleBoards();
      ctx.renderAttackLogText("選択完了");
      return;
    }

    if (result.requestChoice) {
      ctx.handleChoiceRequest({
        ...result.requestChoice,
        ownerUnitKey: result.requestChoice.ownerUnitKey || choiceContext.ownerUnitKey || choice.ownerUnitKey || null
      });
      return;
    }

    if (result.startSlotAction) {
      if (result.message) {
        ctx.appendBattleNotice(result.message);
      }

      if (ctx.isUnifiedTeam(ownerPlayer)) {
        ctx.executeUnifiedSelectedSlot(
          ownerPlayer,
          result.startSlotAction.slotKey,
          result.startSlotAction.ownerUnitKey || choice.ownerUnitKey || null,
          { skipActionCost: true }
        );
        return;
      }

      startSlotAction(
        ownerPlayer,
        result.startSlotAction.slotKey,
        result.startSlotAction.slotData || null
      );
      return;
    }

    if (Array.isArray(result.appendAttacks) && result.appendAttacks.length > 0) {
      const currentAttack = ctx.getCurrentAttack();
      const currentAttackContext = ctx.getCurrentAttackContext();
      const targetContext = choiceContext.currentAttackContext;

      const appendAttacks = result.appendAttacks.map((attack) => ({
        ...attack,
        groupId: targetContext?.groupId || attack.groupId,
        sourceLabel: targetContext?.actionLabel || attack.sourceLabel
      }));

      currentAttack.push(...appendAttacks);

      if (currentAttackContext) {
        currentAttackContext.totalCount += appendAttacks.length;
      }

      if (targetContext && targetContext !== currentAttackContext) {
        targetContext.totalCount = Number(targetContext.totalCount || 0) + appendAttacks.length;
      }

      ctx.setCurrentAttack(currentAttack);
      ctx.setCurrentAttackContext(currentAttackContext);
    }

    ctx.redrawBattleBoards();

    if (result.message) {
      ctx.appendBattleNotice(result.message);
    }

    if (ctx.getCurrentAttack() && ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
      return;
    }

    ctx.renderAttackLogText(result.message || "選択完了");
  }

  function executeNextQueuedSlot() {
    const team = ctx.getTeam(ctx.getCurrentPlayer());

    if (!team || !team._slotQueue || team._slotQueue.length === 0) {
      ctx.redrawBattleBoards();
      return;
    }

    const next = team._slotQueue.shift();

    ctx.setActiveUnit(ctx.getCurrentPlayer(), next.unitKey);
    startSlotAction(ctx.getCurrentPlayer(), next.slotKey);
  }

  return {
    startSlotAction,
    resolveSlot,
    runAfterSlotResolvedHook,
    executeSpecial,
    resolvePendingChoice,
    reserveAction,
    processReservedActionsForTrigger,
    executeNextQueuedSlot,
    executeCpuAutoSlotBatch
  };
}
