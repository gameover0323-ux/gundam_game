import { executeUnitExtraWeaponResult } from "./js_unit_runtime.js";

export function create2v2Actions(ctx) {
  function isTeamBattleMode() {
    return ctx.isTeamBattleMode
      ? ctx.isTeamBattleMode()
      : ctx.getBattleMode() === "2v2" || ctx.getBattleMode() === "challenge2v2";
  }

  function getTeamSlotOrder(team) {
    if (!team) return [];

    const order = [];

    if (team.unit1) order.push("unit1");
    if (team.unit2) order.push("unit2");

    return order;
  }

  function getActionActor(team) {
    if (!team) return null;
    return team[team.activeUnitKey] || team.unit1 || team.unit2 || null;
  }

  function canConsumeTeamAction(ownerPlayer, team, actor, amount = 1) {
    if (team?.mode === "unified" && ctx.twoVtwoAdapter) {
      return ctx.twoVtwoAdapter.canConsumeAction(ownerPlayer, actor, amount);
    }

    return ctx.canConsumeAction(actor, amount);
  }

  function consumeTeamAction(ownerPlayer, team, actor, amount = 1) {
    if (team?.mode === "unified" && ctx.twoVtwoAdapter) {
      return ctx.twoVtwoAdapter.consumeAction(ownerPlayer, actor, amount);
    }

    ctx.consumeActionCount(actor, amount);
    return true;
  }

  function pushAttackGroup({
    currentPlayer,
    enemyPlayer,
    unitKey,
    unit,
    slotKey,
    slotNumber,
    slot,
    actionLabel,
    attacks
  }) {
    if (!Array.isArray(attacks) || attacks.length === 0) {
      return false;
    }

    const groupId = `${currentPlayer}_${unitKey}_${Date.now()}_${Math.random()}`;
    const currentAttackContexts = ctx.getCurrentAttackContexts();
    const currentAttack = ctx.getCurrentAttack();

    const context = {
      groupId,
      ownerPlayer: currentPlayer,
      ownerUnitKey: unitKey,
      attacker: unit,
      enemyPlayer,
      slotKey,
      slotNumber,
      slotLabel: slot.label,
      slotDesc: slot.desc,
      actionLabel,
      totalCount: attacks.length,
      hitCount: 0,
      evadeCount: 0
    };

    currentAttackContexts.push(context);

    attacks.forEach((attack) => {
      currentAttack.push({
        ...attack,
        groupId,
        sourceLabel: actionLabel
      });
    });

    return true;
  }

  function processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKey = null, options = {}) {
    const unit = team?.[unitKey];
    if (!unit) return false;

    const currentPlayer = options.ownerPlayer || ctx.getCurrentPlayer();

    ctx.ensureActionState(unit);

    if (!options.skipActionCost) {
      if (!canConsumeTeamAction(currentPlayer, team, unit, 1)) {
        return false;
      }
    }

    const rollableSlotKeys = ctx.getRollableSlotKeys(unit);
    if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) {
      return false;
    }

    const slotKey = forcedSlotKey || rollableSlotKeys[
      Math.floor(Math.random() * rollableSlotKeys.length)
    ];

    const slot = ctx.getSlotByKey(unit, slotKey);
    if (!slot) return false;

    const slotNumber = ctx.getSlotNumberFromKey(slotKey);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    unit.lastSlotKey = slotKey;

    if (!options.skipActionCost) {
      consumeTeamAction(currentPlayer, team, unit, 1);
    }

    const hookContext = {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender,
      slotKey,
      slot,
      isForcedSlotAction: !!forcedSlotKey,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    };

    const beforeResult = ctx.executeUnitBeforeSlot(unit, slotNumber, hookContext);

    if (beforeResult.message) {
      ctx.appendBattleNotice(beforeResult.message);
    }

    if (beforeResult.redraw) {
      ctx.redrawBattleBoards();
    }

    if (beforeResult.cancelSlot) {
      ctx.appendBattleNotice(beforeResult.message || `${unit.name}：行動不能`);
      return false;
    }

    if (defender) {
      const enemyBeforeResult = ctx.executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: currentPlayer,
        enemyPlayerLabel: `PLAYER ${currentPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: unit,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (enemyBeforeResult.message) {
        ctx.appendBattleNotice(enemyBeforeResult.message);
      }

      if (enemyBeforeResult.redraw) {
        ctx.redrawBattleBoards();
      }
    }

    const result = ctx.resolveSlotEffect({
      slot,
      actor: unit,
      ownerPlayer: currentPlayer,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    const actionLabel = `${unit.name} ${slotNumber}.${slot.label}`;

    const afterResult = ctx.runAfterSlotResolvedHook(unit, slotNumber, result, {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      slotKey,
      slotNumber,
      slot,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    const extraResult = executeUnitExtraWeaponResult(unit, {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      slotKey,
      slotNumber,
      slot,
      twoVtwoAdapter: ctx.twoVtwoAdapter || null
    });

    if (afterResult?.message) {
      ctx.appendBattleNotice(afterResult.message);
    }

    if (extraResult?.message) {
      ctx.appendBattleNotice(extraResult.message);
    }

    if (Array.isArray(extraResult?.appendMessages)) {
      extraResult.appendMessages
        .filter(Boolean)
        .forEach((message) => ctx.appendBattleNotice(message));
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
      pushAttackGroup({
        currentPlayer,
        enemyPlayer,
        unitKey,
        unit,
        slotKey,
        slotNumber,
        slot,
        actionLabel,
        attacks
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
        result.message
          ? `${actionLabel}\n${result.message}`
          : `${actionLabel}\n行動完了`
      );
      return true;
    }

    return false;
  }

  function executeTeamSlot() {
    if (!isTeamBattleMode()) {
      ctx.executeSlot();
      return;
    }

    if (ctx.hasPendingChoice() || ctx.getCurrentAttack().length > 0) return;

    const currentPlayer = ctx.getCurrentPlayer();
    const team = ctx.getTeam(currentPlayer);
    if (!team) return;

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    const enemyPlayer = ctx.getOpponentPlayer(currentPlayer);
    const order = getTeamSlotOrder(team);

    if (team.mode === "unified") {
      const actor = getActionActor(team);

      if (!ctx.twoVtwoAdapter || !ctx.twoVtwoAdapter.canConsumeAction(currentPlayer, actor, 1)) {
        ctx.showPopup("統合行動権が足りません");
        return;
      }

      ctx.twoVtwoAdapter.consumeAction(currentPlayer, actor, 1);

      order.forEach((unitKey) => {
        processTeamUnitSlot(team, unitKey, enemyPlayer, null, {
          ownerPlayer: currentPlayer,
          skipActionCost: true
        });
      });
    } else {
      order.forEach((unitKey) => {
        processTeamUnitSlot(team, unitKey, enemyPlayer, null, {
          ownerPlayer: currentPlayer
        });
      });
    }

    ctx.setCurrentAttackContext({
      ownerPlayer: currentPlayer,
      enemyPlayer,
      totalCount: ctx.getCurrentAttack().length,
      hitCount: 0,
      evadeCount: 0
    });

    ctx.setCurrentAction(
      team.mode === "unified"
        ? `PLAYER ${currentPlayer} の統合型スロット行動`
        : `PLAYER ${currentPlayer} の2on2スロット行動`,
      ""
    );

    ctx.redrawBattleBoards();

    if (ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
      return;
    }

    ctx.renderAttackLogText("行動完了");
  }

  function executeSingleTeamSlot(unitKey) {
    if (!isTeamBattleMode()) return;
    if (ctx.hasPendingChoice() || ctx.getCurrentAttack().length > 0) return;

    const currentPlayer = ctx.getCurrentPlayer();
    const team = ctx.getTeam(currentPlayer);
    if (!team) return;

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    const enemyPlayer = ctx.getOpponentPlayer(currentPlayer);

    processTeamUnitSlot(team, unitKey, enemyPlayer, null, {
      ownerPlayer: currentPlayer
    });

    ctx.setCurrentAttackContext({
      ownerPlayer: currentPlayer,
      enemyPlayer,
      totalCount: ctx.getCurrentAttack().length,
      hitCount: 0,
      evadeCount: 0
    });

    ctx.setCurrentAction(`PLAYER ${currentPlayer} の単独スロット行動`, "");
    ctx.redrawBattleBoards();

    if (ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
      return;
    }

    ctx.renderAttackLogText("行動完了");
  }

  function executeUnifiedSelectedSlot(ownerPlayer, slotKey) {
    const team = ctx.getTeam(ownerPlayer);
    if (!team) return false;

    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);

    ctx.setCurrentAttack([]);
    ctx.setCurrentAttackContext(null);
    ctx.setCurrentAttackContexts([]);
    ctx.clearBattleNotice();
    ctx.clearCurrentAction();

    const actor = getActionActor(team);

    if (!ctx.twoVtwoAdapter || !ctx.twoVtwoAdapter.canConsumeAction(ownerPlayer, actor, 1)) {
      ctx.showPopup("統合行動権が足りません");
      return false;
    }

    ctx.twoVtwoAdapter.consumeAction(ownerPlayer, actor, 1);

    getTeamSlotOrder(team).forEach((unitKey) => {
      processTeamUnitSlot(team, unitKey, enemyPlayer, slotKey, {
        ownerPlayer,
        skipActionCost: true
      });
    });

    ctx.setCurrentAttackContext({
      ownerPlayer,
      enemyPlayer,
      totalCount: ctx.getCurrentAttack().length,
      hitCount: 0,
      evadeCount: 0
    });

    ctx.setCurrentAction(`PLAYER ${ownerPlayer} の統合型スロット指定行動`, "");
    ctx.redrawBattleBoards();

    if (ctx.getCurrentAttack().length > 0) {
      ctx.renderAttackChoices();
    } else {
      ctx.renderAttackLogText("行動完了");
    }

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
