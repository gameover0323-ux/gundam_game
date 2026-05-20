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

  function processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKey = null, options = {}) {
    const unit = team[unitKey];
    if (!unit) return false;

    const currentPlayer = options.ownerPlayer || ctx.getCurrentPlayer();

    ctx.ensureActionState(unit);

    if (!options.skipActionCost) {
      if (!ctx.canConsumeAction(unit, 1)) return false;
    }

    const rollableSlotKeys = ctx.getRollableSlotKeys(unit);
    if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) return false;

    const slotKey = forcedSlotKey || rollableSlotKeys[
      Math.floor(Math.random() * rollableSlotKeys.length)
    ];

    const slot = ctx.getSlotByKey(unit, slotKey);
    if (!slot) return false;

    const slotNumber = ctx.getSlotNumberFromKey(slotKey);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    unit.lastSlotKey = slotKey;

    if (!options.skipActionCost) {
      ctx.consumeActionCount(unit, 1);
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

    if (
      result.kind === "evade" ||
      result.kind === "heal" ||
      result.kind === "none" ||
      result.kind === "custom"
    ) {
      const afterResult = ctx.runAfterSlotResolvedHook(unit, slotNumber, result, {
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

      ctx.appendBattleNotice(
        result.message
          ? `${actionLabel}<br>${result.message}`
          : `${actionLabel}<br>行動完了`
      );

      return true;
    }

    if (result.kind === "attack") {
      const afterResult = ctx.runAfterSlotResolvedHook(unit, slotNumber, result, {
        ownerPlayer: currentPlayer,
        enemyPlayer,
        slotKey,
        slotNumber,
        slot,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      const groupId = `${currentPlayer}_${unitKey}_${Date.now()}_${Math.random()}`;

      const attacks = [
        ...(Array.isArray(result.attacks) ? result.attacks : []),
        ...(Array.isArray(afterResult?.appendAttacks) ? afterResult.appendAttacks : [])
      ];

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

      const currentAttackContexts = ctx.getCurrentAttackContexts();
      const currentAttack = ctx.getCurrentAttack();

      currentAttackContexts.push(context);

      const extraResult = executeUnitExtraWeaponResult(unit, {
        ownerPlayer: currentPlayer,
        enemyPlayer,
        slotKey,
        slotNumber,
        slot,
        twoVtwoAdapter: ctx.twoVtwoAdapter || null
      });

      if (extraResult?.message) {
        ctx.appendBattleNotice(extraResult.message);
      }

      if (Array.isArray(extraResult?.appendMessages)) {
        extraResult.appendMessages
          .filter(Boolean)
          .forEach((message) => ctx.appendBattleNotice(message));
      }

      if (Array.isArray(extraResult?.appendAttacks)) {
        attacks.push(...extraResult.appendAttacks);
      }

      context.totalCount = attacks.length;

      attacks.forEach((attack) => {
        currentAttack.push({
          ...attack,
          groupId,
          sourceLabel: actionLabel
        });
      });

      if (afterResult?.message) {
        ctx.appendBattleNotice(afterResult.message);
      }

      if (afterResult?.redraw || extraResult?.redraw) {
        ctx.redrawBattleBoards();
      }

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
      const actor = team[team.activeUnitKey] || team.unit1;

      if (
        !ctx.twoVtwoAdapter ||
        !ctx.twoVtwoAdapter.canConsumeAction(currentPlayer, actor, 1)
      ) {
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

    const actor = team[team.activeUnitKey] || team.unit1;

    if (
      !ctx.twoVtwoAdapter ||
      !ctx.twoVtwoAdapter.canConsumeAction(ownerPlayer, actor, 1)
    ) {
      ctx.showPopup("統合行動権が足りません");
      return false;
    }

    ctx.twoVtwoAdapter.consumeAction(ownerPlayer, actor, 1);

    processTeamUnitSlot(team, "unit1", enemyPlayer, slotKey, {
      ownerPlayer,
      skipActionCost: true
    });

    processTeamUnitSlot(team, "unit2", enemyPlayer, slotKey, {
      ownerPlayer,
      skipActionCost: true
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
