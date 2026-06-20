import { executeUnitExtraWeaponResult } from "./js_unit_runtime.js";
import { getFrostBrothersDerivedState } from "./js_unit_rules_frost_brothers.js";

export function create2v2Actions(ctx) {
  function isTeamBattleMode() {
    return ctx.isTeamBattleMode
      ? ctx.isTeamBattleMode()
      : ctx.getBattleMode() === "2v2" ||
          ctx.getBattleMode() === "challenge2v2" ||
          ctx.getBattleMode() === "vscpu2v2" ||
          ctx.getBattleMode() === "online2v2";
  }

  function getStateUnitId(state) {
    return state?.unitId || state?.unit?.id || state?.id || "";
  }

  function isUnitDefeated(unit) {
    return !unit || Number(unit.hp || 0) <= 0 || unit.isDefeated === true;
  }

  function getTeamAllSlotOrder(team) {
    const order = [];
    if (team?.unit1) order.push("unit1");
    if (team?.unit2) order.push("unit2");
    return order;
  }

  function getTeamSlotOrder(team) {
    return getTeamAllSlotOrder(team).filter((unitKey) => !isUnitDefeated(team[unitKey]));
  }

  function getUnitIndexLabel(unitKey) {
    return unitKey === "unit2" ? "2機目" : "1機目";
  }

  function pushActionSummary(options, unitKey, text) {
    if (Array.isArray(options.actionSummaries)) {
      options.actionSummaries.push(`${getUnitIndexLabel(unitKey)}：${text}`);
    }
  }

  function getActionActorKey(team) {
    if (!team) return null;
    if (!isUnitDefeated(team.unit1)) return "unit1";
    if (!isUnitDefeated(team.unit2)) return "unit2";
    return null;
  }

  function isFrostBrothersTeam(team) {
    const ids = [getStateUnitId(team?.unit1), getStateUnitId(team?.unit2)];
    return ids.includes("frost_brothers_vasago_cb") &&
      ids.includes("frost_brothers_ashtaron_hc");
  }

  function getUnifiedBossSlotConfig(team, ownerPlayer, forcedSlotKeys = {}) {
    if (!team || team.mode !== "unified") return null;

    if (isFrostBrothersTeam(team)) {
      const actorKey = getActionActorKey(team) || "unit1";
      const actor = team[actorKey];

      const derived = getFrostBrothersDerivedState(actor, {
        ownerPlayer,
        team,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      const slots = derived?.slots || {};
      const rollableSlotKeys = Array.isArray(derived?.rollableSlotOrder)
        ? derived.rollableSlotOrder
        : Object.keys(slots);

      if (rollableSlotKeys.length <= 0) return null;

      const forcedSlotKey =
        forcedSlotKeys.unified ||
        forcedSlotKeys[actorKey] ||
        null;

      const slotKey = forcedSlotKey && slots[forcedSlotKey]
        ? forcedSlotKey
        : rollableSlotKeys[Math.floor(Math.random() * rollableSlotKeys.length)];

      return {
        actorKey,
        slotKey,
        slot: slots[slotKey],
        title: "フロスト兄弟 統合型専用スロット行動"
      };
    }

    return null;
  }

  function processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKey = null, options = {}) {
    const unit = team?.[unitKey];
    if (!unit) return false;

    const currentPlayer = options.ownerPlayer || ctx.getCurrentPlayer();

    if (isUnitDefeated(unit)) {
      unit.hp = 0;
      unit.isDefeated = true;
      pushActionSummary(options, unitKey, `${unit.name} [撃墜]`);
      return false;
    }

    ctx.ensureActionState(unit);

    if (!options.skipActionCost) {
      if (!ctx.canConsumeAction(unit, 1)) {
        pushActionSummary(options, unitKey, `${unit.name} 行動権不足`);
        return false;
      }
      ctx.consumeActionCount(unit, 1);
    }

    let rollableSlotKeys = null;
    let slotKey = forcedSlotKey;
    let slot = options.slotOverride || null;

    if (!slot) {
      rollableSlotKeys = ctx.getRollableSlotKeys(unit);
      if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) {
        pushActionSummary(options, unitKey, `${unit.name} 使用可能スロットなし`);
        return false;
      }

      slotKey = forcedSlotKey || rollableSlotKeys[Math.floor(Math.random() * rollableSlotKeys.length)];
      slot = ctx.getSlotByKey(unit, slotKey);
    }

    if (!slotKey || !slot) {
      pushActionSummary(options, unitKey, `${unit.name} スロット取得失敗`);
      return false;
    }

    const slotNumber = ctx.getSlotNumberFromKey(slotKey);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    unit.lastSlotKey = slotKey;

    const actionLabel = `${unit.name} ${slotNumber}.${slot.label}`;
    pushActionSummary(options, unitKey, actionLabel);

    const hookContext = {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender,
      team,
      ownerTeam: team,
      slotKey,
      slot,
      isForcedSlotAction: !!forcedSlotKey,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    };

    const beforeResult = ctx.executeUnitBeforeSlot(unit, slotNumber, hookContext);

    if (beforeResult.message) ctx.appendBattleNotice(beforeResult.message);
    if (beforeResult.redraw) ctx.redrawBattleBoards();

    if (beforeResult.cancelSlot) {
      ctx.appendBattleNotice(beforeResult.message || `${actionLabel}\n行動不能`);
      return false;
    }

    let actualSlot = slot;

    if (typeof beforeResult.modifySlot === "function") {
      actualSlot = beforeResult.modifySlot(slot) || slot;
    }

    if (defender) {
      const enemyBeforeResult = ctx.executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: currentPlayer,
        enemyPlayerLabel: `PLAYER ${currentPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: unit,
        slotKey,
        slot: actualSlot,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (enemyBeforeResult.message) ctx.appendBattleNotice(enemyBeforeResult.message);
      if (enemyBeforeResult.redraw) ctx.redrawBattleBoards();
    }

    const result = ctx.resolveSlotEffect({
      slot: actualSlot,
      actor: unit,
      ownerPlayer: currentPlayer,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    const afterResult = ctx.runAfterSlotResolvedHook(unit, slotNumber, result, {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      team,
      ownerTeam: team,
      slotKey,
      slotNumber,
      slot: actualSlot,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    const extraResult = executeUnitExtraWeaponResult(unit, {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      team,
      ownerTeam: team,
      slotKey,
      slotNumber,
      slot: actualSlot,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (afterResult?.message) ctx.appendBattleNotice(afterResult.message);
    if (extraResult?.message) ctx.appendBattleNotice(extraResult.message);

    if (Array.isArray(extraResult?.appendMessages)) {
      extraResult.appendMessages.filter(Boolean).forEach((message) => ctx.appendBattleNotice(message));
    }

    if (afterResult?.redraw || extraResult?.redraw) {
      ctx.redrawBattleBoards();
    }

    const attacks = [
      ...(Array.isArray(result.attacks) ? result.attacks : []),
      ...(Array.isArray(afterResult?.appendAttacks) ? afterResult.appendAttacks : []),
      ...(Array.isArray(extraResult?.appendAttacks) ? extraResult.appendAttacks : [])
    ];

    if (attacks.length > 0) {
      const groupId = `${currentPlayer}_${unitKey}_${Date.now()}_${Math.random()}`;
      const currentAttackContexts = ctx.getCurrentAttackContexts();
      const currentAttack = ctx.getCurrentAttack();

      currentAttackContexts.push({
        groupId,
        ownerPlayer: currentPlayer,
        ownerUnitKey: unitKey,
        attacker: unit,
        enemyPlayer,
        slotKey,
        slotNumber,
        slotLabel: actualSlot.label,
        slotDesc: actualSlot.desc,
        actionLabel,
        totalCount: attacks.length,
        hitCount: 0,
        evadeCount: 0
      });

      attacks.forEach((attack) => {
        currentAttack.push({
          ...attack,
          groupId,
          ownerPlayer: currentPlayer,
          ownerUnitKey: unitKey,
          attacker: unit,
          slotKey,
          slotNumber,
          sourceSlotKey: slotKey,
          sourceSlotNumber: slotNumber,
          sourceLabel: actionLabel
        });
      });

      return true;
    }

    if (
      result.kind === "evade" ||
      result.kind === "heal" ||
      result.kind === "none" ||
      result.kind === "custom"
    ) {
      ctx.appendBattleNotice(
        result.message ? `${actionLabel}\n${result.message}` : `${actionLabel}\n行動完了`
      );
      return true;
    }

    return false;
  }

  function finishTeamSlotAction(currentPlayer, enemyPlayer, actionTitle, actionSummaries) {
    const summaryText = actionSummaries.length > 0 ? actionSummaries.join("\n") : "行動なし";

    ctx.setCurrentAttackContext({
      ownerPlayer: currentPlayer,
      enemyPlayer,
      totalCount: ctx.getCurrentAttack().length,
      hitCount: 0,
      evadeCount: 0
    });

    ctx.setCurrentAction(actionTitle, summaryText);
    ctx.redrawBattleBoards();

    if (ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
      return;
    }

    ctx.renderAttackLogText("行動完了");
  }

  function collectLastSlotKeys(team, order) {
    const slotKeys = {};
    order.forEach((unitKey) => {
      if (team?.[unitKey]?.lastSlotKey) {
        slotKeys[unitKey] = team[unitKey].lastSlotKey;
      }
    });
    return slotKeys;
  }

  function executeTeamSlot(options = {}) {
    if (!isTeamBattleMode()) {
      ctx.executeSlot();
      return;
    }

    if (ctx.hasPendingChoice() || ctx.getCurrentAttack().length > 0) return;

    const currentPlayer = ctx.getCurrentPlayer();
    const team = ctx.getTeam(currentPlayer);
    if (!team) return;

    const enemyPlayer = ctx.getOpponentPlayer(currentPlayer);
    const actionSummaries = [];
    const order = getTeamAllSlotOrder(team);
    const aliveOrder = getTeamSlotOrder(team);
    const forcedSlotKeys = options?.forcedSlotKeys || {};

    if (aliveOrder.length === 0) {
      ctx.showPopup("行動可能な機体がいません");
      return;
    }

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    if (team.mode === "unified") {
      const unifiedBossSlot = getUnifiedBossSlotConfig(team, currentPlayer, forcedSlotKeys);
      const actorKey = unifiedBossSlot?.actorKey || getActionActorKey(team);
      const actor = actorKey ? team[actorKey] : null;

      if (!actor || !ctx.twoVtwoAdapter) {
        ctx.showPopup("統合行動権を参照できません");
        ctx.redrawBattleBoards();
        return;
      }

      if (!ctx.twoVtwoAdapter.canConsumeAction(currentPlayer, actor, 1)) {
        ctx.showPopup("統合行動権が足りません");
        ctx.redrawBattleBoards();
        return;
      }

      if (!ctx.twoVtwoAdapter.consumeAction(currentPlayer, actor, 1)) {
        ctx.showPopup("統合行動権が足りません");
        ctx.redrawBattleBoards();
        return;
      }

      if (unifiedBossSlot) {
        processTeamUnitSlot(team, unifiedBossSlot.actorKey, enemyPlayer, unifiedBossSlot.slotKey, {
          ownerPlayer: currentPlayer,
          skipActionCost: true,
          slotOverride: unifiedBossSlot.slot,
          actionSummaries
        });

        finishTeamSlotAction(
          currentPlayer,
          enemyPlayer,
          `PLAYER ${currentPlayer} の${unifiedBossSlot.title}`,
          actionSummaries
        );

        if (!options?.suppressOnlinePublish && typeof ctx.onOnline2v2SlotAction === "function") {
          ctx.onOnline2v2SlotAction(currentPlayer, "team", null, {
            unified: unifiedBossSlot.slotKey,
            [unifiedBossSlot.actorKey]: unifiedBossSlot.slotKey
          });
        }

        return;
      }

      order.forEach((unitKey) => {
        processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKeys[unitKey] || null, {
          ownerPlayer: currentPlayer,
          skipActionCost: true,
          actionSummaries
        });
      });
    } else {
      order.forEach((unitKey) => {
        processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKeys[unitKey] || null, {
          ownerPlayer: currentPlayer,
          actionSummaries
        });
      });
    }

    finishTeamSlotAction(
      currentPlayer,
      enemyPlayer,
      team.mode === "unified"
        ? `PLAYER ${currentPlayer} の統合型スロット行動`
        : `PLAYER ${currentPlayer} の2on2スロット行動`,
      actionSummaries
    );

    if (!options?.suppressOnlinePublish && typeof ctx.onOnline2v2SlotAction === "function") {
      ctx.onOnline2v2SlotAction(currentPlayer, "team", null, collectLastSlotKeys(team, order));
    }
  }

  function executeSingleTeamSlot(unitKey, options = {}) {
    if (!isTeamBattleMode()) return;
    if (ctx.hasPendingChoice() || ctx.getCurrentAttack().length > 0) return;

    const currentPlayer = ctx.getCurrentPlayer();
    const team = ctx.getTeam(currentPlayer);
    if (!team) return;

    if (team.mode === "unified") {
      ctx.showPopup("統合型では単独スロット行動は使用できません");
      ctx.redrawBattleBoards();
      return;
    }

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    const enemyPlayer = ctx.getOpponentPlayer(currentPlayer);
    const actionSummaries = [];
    const forcedSlotKeys = options?.forcedSlotKeys || {};

    processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKeys[unitKey] || null, {
      ownerPlayer: currentPlayer,
      actionSummaries
    });

    finishTeamSlotAction(
      currentPlayer,
      enemyPlayer,
      `PLAYER ${currentPlayer} の単独スロット行動`,
      actionSummaries
    );

    if (!options?.suppressOnlinePublish && typeof ctx.onOnline2v2SlotAction === "function") {
      ctx.onOnline2v2SlotAction(currentPlayer, unitKey, unitKey, collectLastSlotKeys(team, [unitKey]));
    }
  }

  function executeUnifiedSelectedSlot(ownerPlayer, slotKey, ownerUnitKey = null, options = {}) {
    const team = ctx.getTeam(ownerPlayer);
    if (!team) return false;

    if (team.mode !== "unified") {
      ctx.showPopup("統合型専用のスロット指定行動です");
      return false;
    }

    const unifiedBossSlot = getUnifiedBossSlotConfig(team, ownerPlayer, { unified: slotKey });
    if (unifiedBossSlot) {
      const actor = team[unifiedBossSlot.actorKey];

      if (!actor) {
        ctx.showPopup("統合型スロットの使用機体を特定できません");
        ctx.redrawBattleBoards();
        return false;
      }

      if (!options.skipActionCost) {
        if (!ctx.twoVtwoAdapter?.canConsumeAction?.(ownerPlayer, actor, 1)) {
          ctx.showPopup("統合行動権が足りません");
          ctx.redrawBattleBoards();
          return false;
        }

        if (!ctx.twoVtwoAdapter.consumeAction(ownerPlayer, actor, 1)) {
          ctx.showPopup("統合行動権が足りません");
          ctx.redrawBattleBoards();
          return false;
        }
      }

      const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
      const actionSummaries = [];

      ctx.setCurrentAttack([]);
      ctx.setCurrentAttackContext(null);
      ctx.setCurrentAttackContexts([]);
      ctx.clearBattleNotice();
      ctx.clearCurrentAction();

      processTeamUnitSlot(team, unifiedBossSlot.actorKey, enemyPlayer, unifiedBossSlot.slotKey, {
        ownerPlayer,
        skipActionCost: true,
        slotOverride: unifiedBossSlot.slot,
        actionSummaries
      });

      finishTeamSlotAction(
        ownerPlayer,
        enemyPlayer,
        `PLAYER ${ownerPlayer} の統合型スロット指定行動`,
        actionSummaries
      );

      return true;
    }

    const targetUnitKey =
      ownerUnitKey === "unit2" ? "unit2" :
      ownerUnitKey === "unit1" ? "unit1" :
      team.activeUnitKey;

    const actor = team[targetUnitKey];

    if (!actor) {
      ctx.showPopup("追加武装の使用機体を特定できません");
      ctx.redrawBattleBoards();
      return false;
    }

    if (!options.skipActionCost) {
      if (!ctx.twoVtwoAdapter?.canConsumeAction?.(ownerPlayer, actor, 1)) {
        ctx.showPopup("統合行動権が足りません");
        ctx.redrawBattleBoards();
        return false;
      }

      if (!ctx.twoVtwoAdapter.consumeAction(ownerPlayer, actor, 1)) {
        ctx.showPopup("統合行動権が足りません");
        ctx.redrawBattleBoards();
        return false;
      }
    }

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);
    const actionSummaries = [];

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    processTeamUnitSlot(team, targetUnitKey, enemyPlayer, slotKey, {
      ownerPlayer,
      skipActionCost: true,
      actionSummaries
    });

    finishTeamSlotAction(
      ownerPlayer,
      enemyPlayer,
      `PLAYER ${ownerPlayer} の統合型スロット指定行動`,
      actionSummaries
    );

    return true;
  }

  return {
    getTeamSlotOrder,
    processTeamUnitSlot,
    executeTeamSlot,
    executeSingleTeamSlot,
    executeUnifiedSelectedSlot
  };
}
