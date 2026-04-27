import {
  getGundamMcDerivedState,
  executeGundamMcSpecial,
  onGundamMcTurnEnd,
  onGundamMcBeforeSlot,
  onGundamMcEnemyBeforeSlot,
  onGundamMcAfterSlotResolved,
  onGundamMcActionResolved,
  onGundamMcDamaged,
  modifyGundamMcTakenDamage,
  onGundamMcResolveChoice
} from "./js_unit_rules_gundam_mc.js";

import {
  getZGundamDerivedState,
  executeZGundamSpecial,
  onZGundamTurnEnd,
  onZGundamBeforeSlot,
  onZGundamEnemyBeforeSlot,
  onZGundamAfterSlotResolved,
  onZGundamActionResolved,
  onZGundamDamaged,
  modifyZGundamTakenDamage
} from "./js_unit_rules_z_gundam.js";

import {
  getShiningDerivedState,
  canUseShiningSpecial,
  executeShiningSpecial,
  onShiningTurnEnd,
  onShiningBeforeSlot,
  onShiningEnemyBeforeSlot,
  onShiningAfterSlotResolved,
  onShiningActionResolved,
  onShiningDamaged,
  modifyShiningTakenDamage,
  onShiningResolveChoice
} from "./js_rules_shining_gundam.js";

import {
  getWingZeroDerivedState,
  canUseWingZeroSpecial,
  executeWingZeroSpecial,
  onWingZeroTurnEnd,
  onWingZeroBeforeSlot,
  onWingZeroEnemyBeforeSlot,
  onWingZeroDamaged,
  onWingZeroAfterSlotResolved,
  onWingZeroActionResolved,
  modifyWingZeroTakenDamage,
  modifyWingZeroEvadeAttempt,
  onWingZeroResolveChoice
} from "./js_unit_rules_wing_zero.js";

export const unitRulesMap = {
  gundam_mc: {
    getDerivedState: getGundamMcDerivedState,
    executeSpecial: executeGundamMcSpecial,
    onTurnEnd: onGundamMcTurnEnd,
    onBeforeSlot: onGundamMcBeforeSlot,
    onEnemyBeforeSlot: onGundamMcEnemyBeforeSlot,
    onAfterSlotResolved: onGundamMcAfterSlotResolved,
    onActionResolved: onGundamMcActionResolved,
    onDamaged: onGundamMcDamaged,
    modifyTakenDamage: modifyGundamMcTakenDamage,
    onResolveChoice: onGundamMcResolveChoice
  },

  z_gundam: {
    getDerivedState: getZGundamDerivedState,
    executeSpecial: executeZGundamSpecial,
    onTurnEnd: onZGundamTurnEnd,
    onBeforeSlot: onZGundamBeforeSlot,
    onEnemyBeforeSlot: onZGundamEnemyBeforeSlot,
    onAfterSlotResolved: onZGundamAfterSlotResolved,
    onActionResolved: onZGundamActionResolved,
    onDamaged: onZGundamDamaged,
    modifyTakenDamage: modifyZGundamTakenDamage
  },
  
  shining_gundam: {
    getDerivedState: getShiningDerivedState,
    canUseSpecial: canUseShiningSpecial,
    executeSpecial: executeShiningSpecial,
    onTurnEnd: onShiningTurnEnd,
    onBeforeSlot: onShiningBeforeSlot,
    onEnemyBeforeSlot: onShiningEnemyBeforeSlot,
    onAfterSlotResolved: onShiningAfterSlotResolved,
    onActionResolved: onShiningActionResolved,
    onDamaged: onShiningDamaged,
    modifyTakenDamage: modifyShiningTakenDamage,
    onResolveChoice: onShiningResolveChoice
  },

  wing_zero: {
    getDerivedState: getWingZeroDerivedState,
    canUseSpecial: canUseWingZeroSpecial,
    executeSpecial: executeWingZeroSpecial,
    onTurnEnd: onWingZeroTurnEnd,
    onBeforeSlot: onWingZeroBeforeSlot,
    onEnemyBeforeSlot: onWingZeroEnemyBeforeSlot,
    onDamaged: onWingZeroDamaged,
    onAfterSlotResolved: onWingZeroAfterSlotResolved,
    onActionResolved: onWingZeroActionResolved,
    modifyTakenDamage: modifyWingZeroTakenDamage,
    modifyEvadeAttempt: modifyWingZeroEvadeAttempt,
    onResolveChoice: onWingZeroResolveChoice
  }
};
