import {
  getSlotByKey,
  getSlotNumberFromKey,
  executeUnitSpecial,
  executeUnitCanUseSpecial,
  executeUnitResolveChoice,
  executeUnitBeforeSlot,
  executeUnitEnemyBeforeSlot,
  executeUnitAfterSlotResolved
} from "./js_unit_runtime.js";

import { resolveSlotEffect } from "./js_slot_effects.js";
import { executeCommonSpecial } from "./js_special_actions.js";

export function createActionLayer(ctx) {
  function runAfterSlotResolvedHook(actor, slotNumber, resolveResult, slotMeta = {}) {
    const afterResult = executeUnitAfterSlotResolved(actor, slotNumber, {
      ...slotMeta,
      resolveResult
    });

    if (afterResult.redraw) {
      ctx.redrawBattleBoards();
    }

    if (afterResult.message) {
      ctx.appendBattleNotice(afterResult.message);
    }
  }

  function startSlotAction(ownerPlayer, slotKey, slotOverride = null) {
    const enemyPlayer = ctx.getOpponentPlayer(ownerPlayer);

    const actor = ctx.getPlayerState(ownerPlayer);
    const defender = ctx.getCombatTargetState(enemyPlayer);

    if (!actor) return false;

    const slot = slotOverride || getSlotByKey(actor, slotKey);
    if (!slot) return false;

    const slotNumber = getSlotNumberFromKey(slotKey);

    actor.lastSlotKey = slotKey;

const beforeResult = executeUnitBeforeSlot(actor, slotNumber, {
      ownerPlayer,
      enemyPlayer,
      enemyPlayerLabel: `PLAYER ${enemyPlayer}`,
      enemyState: defender,
      slotKey,
      slot,
      isForcedSlotAction: !!slotOverride
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
    

    if (defender) {
      const enemyBeforeResult = executeUnitEnemyBeforeSlot(defender, slotNumber, {
        ownerPlayer: enemyPlayer,
        enemyPlayer: ownerPlayer,
        enemyPlayerLabel: `PLAYER ${ownerPlayer}`,
        enemyRolledSlotKey: slotKey,
        enemyState: actor
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

  function resolveSlot(slot, slotMeta = {}) {
    ctx.setCurrentAttack([]);

    const actor = ctx.getPlayerState(ctx.getCurrentPlayer());
    const result = resolveSlotEffect({
      slot,
      actor
    });

    if (
      result.kind === "evade" ||
      result.kind === "heal" ||
      result.kind === "none" ||
      result.kind === "custom"
    ) {
      runAfterSlotResolvedHook(actor, slotMeta.slotNumber, result, slotMeta);
      ctx.redrawBattleBoards();

      if (result.message) {
        ctx.renderAttackLogText(result.message);
        if (ctx.getBattleMode() === "2v2") {
          executeNextQueuedSlot();
        }
        return;
      }

      ctx.renderAttackLogText("行動完了");
      if (ctx.getBattleMode() === "2v2") {
        executeNextQueuedSlot();
      }
      return;
    }

    if (result.kind === "attack") {
      ctx.setCurrentAttack(result.attacks);
      ctx.setCurrentAttackContext({
        ownerPlayer: slotMeta.ownerPlayer,
        enemyPlayer: slotMeta.enemyPlayer,
        slotKey: slotMeta.slotKey,
        slotNumber: slotMeta.slotNumber,
        slotLabel: slot.label,
        slotDesc: slot.desc,
        totalCount: result.attacks.length,
        hitCount: 0,
        evadeCount: 0
      });

      ctx.redrawBattleBoards();
      ctx.renderAttackChoices();
      return;
    }

    ctx.renderAttackLogText("この行動はまだ未対応");
  }

  function executeSpecial(ownerPlayer, specialKey) {
    const actor = ctx.getPlayerState(ownerPlayer);
    const special = actor?.specials?.[specialKey];

    if (!actor || !special) {
      ctx.showPopup("特殊行動データが見つからない");
      return;
    }

    const availability = executeUnitCanUseSpecial(actor, specialKey, {
      ownerPlayer,
      enemyPlayer: ctx.getOpponentPlayer(ownerPlayer),
      currentAttackContext: ctx.getCurrentAttackContext(),
      currentAttack: ctx.getCurrentAttack()
    });

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

    if (ctx.isUnifiedTeam(ownerPlayer)) {
      const team = ctx.getTeam(ownerPlayer);
      const totalEvade = ctx.getUnifiedEvade(team);

      const backup = actor.evade;
      actor.evade = totalEvade;

      const preview = executeUnitCanUseSpecial(actor, specialKey, {
        ownerPlayer,
        enemyPlayer: ctx.getOpponentPlayer(ownerPlayer),
        currentAttackContext: ctx.getCurrentAttackContext(),
        currentAttack: ctx.getCurrentAttack()
      });

      actor.evade = backup;

      if (preview.allowed !== false && preview.costEvade) {
        ctx.consumeUnifiedEvade(team, preview.costEvade);
      }
    }

    const currentAttack = ctx.getCurrentAttack();
    const currentAttackContext = ctx.getCurrentAttackContext();

    const unitResult = executeUnitSpecial(actor, specialKey, {
      ownerPlayer,
      enemyPlayer: ctx.getOpponentPlayer(ownerPlayer),
      enemyState: ctx.getPlayerState(ctx.getOpponentPlayer(ownerPlayer)),
      currentAttackContext,
      currentAttack
    });

    if (unitResult.handled) {
      if (unitResult.requestChoice) {
        ctx.handleChoiceRequest(unitResult.requestChoice);
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
        currentAttack.push(...unitResult.appendAttacks);

        if (currentAttackContext) {
          currentAttackContext.totalCount += unitResult.appendAttacks.length;
        }

        ctx.setCurrentAttack(currentAttack);
        ctx.setCurrentAttackContext(currentAttackContext);

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

    const actor = ctx.getPlayerState(ownerPlayer);
    const defender = ctx.getPlayerState(enemyPlayer);

    if (!actor) {
      ctx.clearPendingChoice();
      return;
    }

    const result = executeUnitResolveChoice(actor, choice, selectedValue, {
      ownerPlayer,
      enemyPlayer,
      enemyState: defender,
      currentAttackContext: ctx.getCurrentAttackContext(),
      currentAttack: ctx.getCurrentAttack()
    });

    ctx.clearPendingChoice();

    if (!result.handled) {
      ctx.redrawBattleBoards();
      ctx.renderAttackLogText("選択完了");
      return;
    }

    if (result.requestChoice) {
      ctx.handleChoiceRequest(result.requestChoice);
      return;
    }

    if (result.startSlotAction) {
      if (ctx.isUnifiedTeam(ownerPlayer)) {
        ctx.executeUnifiedSelectedSlot(
          ownerPlayer,
          result.startSlotAction.slotKey
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

    ctx.redrawBattleBoards();
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
    executeNextQueuedSlot
  };
}
