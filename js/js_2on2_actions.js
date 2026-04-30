import { executeUnitExtraWeaponResult } from "./js_unit_runtime.js";

export function create2v2Actions(ctx) {
  function isTeamBattleMode() {
    return ctx.isTeamBattleMode
      ? ctx.isTeamBattleMode()
      : ctx.getBattleMode() === "2v2" || ctx.getBattleMode() === "challenge2v2";
  }

  function getTeamSlotOrder(team) {
    const focusKey = team.focusUnitKey || "unit1";
    const partnerKey = focusKey === "unit1" ? "unit2" : "unit1";
    return [focusKey, partnerKey];
  }

  function processTeamUnitSlot(team, unitKey, enemyPlayer, forcedSlotKey = null) {
    const unit = team[unitKey];
    if (!unit) return false;

    ctx.ensureActionState(unit);
    if (!ctx.canConsumeAction(unit, 1)) return false;

    const rollableSlotKeys = ctx.getRollableSlotKeys(unit);
    if (!Array.isArray(rollableSlotKeys) || rollableSlotKeys.length === 0) return false;

    const slotKey = forcedSlotKey || rollableSlotKeys[
      Math.floor(Math.random() * rollableSlotKeys.length)
    ];

    const slot = ctx.getSlotByKey(unit, slotKey);
    if (!slot) return false;

    const slotNumber = ctx.getSlotNumberFromKey(slotKey);
    const defender = ctx.getCombatTargetState(enemyPlayer);
    const currentPlayer = ctx.getCurrentPlayer();

    unit.lastSlotKey = slotKey;
    ctx.consumeActionCount(unit, 1);

    const beforeResult = ctx.executeUnitBeforeSlot(unit, slotNumber, {
      ownerPlayer: currentPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender
    });

    if (beforeResult.message) {
      ctx.appendBattleNotice(beforeResult.message);
    }

    if (defender) {
      const enemyBeforeResult = ctx.executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: currentPlayer,
        enemyPlayerLabel: `PLAYER ${currentPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: unit
      });

      if (enemyBeforeResult.message) {
        ctx.appendBattleNotice(enemyBeforeResult.message);
      }
    }

    const result = ctx.resolveSlotEffect({
      slot,
      actor: unit
    });

    const actionLabel = `${unit.name} ${slotNumber}.${slot.label}`;

    if (
      result.kind === "evade" ||
      result.kind === "heal" ||
      result.kind === "none" ||
      result.kind === "custom"
    ) {
      ctx.runAfterSlotResolvedHook(unit, slotNumber, result, {
        ownerPlayer: currentPlayer,
        enemyPlayer,
        slotKey,
        slotNumber
      });

      ctx.appendBattleNotice(
        result.message
          ? `${actionLabel}<br>${result.message}`
          : `${actionLabel}<br>行動完了`
      );

      return true;
    }

    if (result.kind === "attack") {
      const groupId = `${currentPlayer}_${unitKey}_${Date.now()}_${Math.random()}`;

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
        totalCount: result.attacks.length,
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
  slot
});

if (extraResult && Array.isArray(extraResult.appendAttacks)) {
  result.attacks.push(...extraResult.appendAttacks);

  if (extraResult.message) {
    ctx.appendBattleNotice(extraResult.message);
  }

  context.totalCount = result.attacks.length;
}
      result.attacks.forEach((attack) => {
        currentAttack.push({
          ...attack,
          groupId,
          sourceLabel: actionLabel
        });
      });

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

    order.forEach((unitKey) => {
      processTeamUnitSlot(team, unitKey, enemyPlayer);
    });

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

    processTeamUnitSlot(team, unitKey, enemyPlayer);

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

    processTeamUnitSlot(team, "unit1", enemyPlayer, slotKey);
    processTeamUnitSlot(team, "unit2", enemyPlayer, slotKey);

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
