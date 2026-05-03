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
} from "./js_unit_rules_shining_gundam.js";

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

import {
  getStrikeDerivedState,
  canUseStrikeSpecial,
  executeStrikeSpecial,
  onStrikeTurnEnd,
  onStrikeBeforeSlot,
  onStrikeEnemyBeforeSlot,
  onStrikeAfterSlotResolved,
  onStrikeActionResolved,
  onStrikeDamaged,
  modifyStrikeTakenDamage,
  modifyStrikeEvadeAttempt,
  onStrikeResolveChoice
} from "./js_unit_rules_strike_gundam.js";

//ボス機体//
import { devilGundamRules } from "./js_unit_rules_devil_gundam.js";

//CPU専用機体//
import {
  getCpuGundamMcDerivedState,
  onCpuGundamMcBeforeSlot,
  onCpuGundamMcAfterSlotResolved,
  onCpuGundamMcActionResolved,
  onCpuGundamMcTurnEnd,
  modifyCpuGundamMcTakenDamage,
  modifyCpuGundamMcEvadeAttempt,
  getCpuGundamMcExtraWeaponResult
} from "./js_unit_rules_cpu_gundam_mc.js";

import {
  getCpuZGundamDerivedState,
  onCpuZGundamTurnEnd,
  onCpuZGundamBeforeSlot,
  onCpuZGundamAfterSlotResolved,
  onCpuZGundamActionResolved,
  modifyCpuZGundamTakenDamage,
  modifyCpuZGundamEvadeAttempt
} from "./js_unit_rules_cpu_z_gundam.js";

import {
  getCpuShiningDerivedState,
  onCpuShiningBeforeSlot,
  onCpuShiningAfterSlotResolved,
  onCpuShiningActionResolved,
  onCpuShiningTurnEnd,
  modifyCpuShiningTakenDamage,
  modifyCpuShiningEvadeAttempt,
  getCpuShiningExtraWeaponResult,
  onCpuShiningDamaged
} from "./js_unit_rules_cpu_shining_gundam.js";

import {
  getCpuWingZeroDerivedState,
  onCpuWingZeroBeforeSlot,
  onCpuWingZeroAfterSlotResolved,
  onCpuWingZeroActionResolved,
  onCpuWingZeroTurnEnd,
  modifyCpuWingZeroTakenDamage,
  modifyCpuWingZeroEvadeAttempt,
  getCpuWingZeroExtraWeaponResult,
  onCpuWingZeroDamaged
} from "./js_unit_rules_cpu_wing_zero.js";

import {
  getCpuStrikeDerivedState,
  onCpuStrikeBeforeSlot,
  onCpuStrikeAfterSlotResolved,
  onCpuStrikeActionResolved,
  onCpuStrikeTurnEnd,
  modifyCpuStrikeTakenDamage,
  modifyCpuStrikeEvadeAttempt,
  getCpuStrikeExtraWeaponResult
} from "./js_unit_rules_cpu_strike_gundam.js";


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
  },
  
  strike_gundam: {
    getDerivedState: getStrikeDerivedState,
    canUseSpecial: canUseStrikeSpecial,
    executeSpecial: executeStrikeSpecial,
    onTurnEnd: onStrikeTurnEnd,
    onBeforeSlot: onStrikeBeforeSlot,
    onEnemyBeforeSlot: onStrikeEnemyBeforeSlot,
    onAfterSlotResolved: onStrikeAfterSlotResolved,
    onActionResolved: onStrikeActionResolved,
    onDamaged: onStrikeDamaged,
    modifyTakenDamage: modifyStrikeTakenDamage,
    modifyEvadeAttempt: modifyStrikeEvadeAttempt,
    onResolveChoice: onStrikeResolveChoice
  },
  
//CPU専用機体//
cpu_gundam_mc: {
  getDerivedState: getCpuGundamMcDerivedState,
  onBeforeSlot: onCpuGundamMcBeforeSlot,
  onAfterSlotResolved: onCpuGundamMcAfterSlotResolved,
  onActionResolved: onCpuGundamMcActionResolved,
  onTurnEnd: onCpuGundamMcTurnEnd,
  modifyTakenDamage: modifyCpuGundamMcTakenDamage,
  modifyEvadeAttempt: modifyCpuGundamMcEvadeAttempt,
  getExtraWeaponResult: getCpuGundamMcExtraWeaponResult
},
  
  cpu_z_gundam: {
  getDerivedState: getCpuZGundamDerivedState,
  onTurnEnd: onCpuZGundamTurnEnd,
  onBeforeSlot: onCpuZGundamBeforeSlot,
  onAfterSlotResolved: onCpuZGundamAfterSlotResolved,
  onActionResolved: onCpuZGundamActionResolved,
  modifyTakenDamage: modifyCpuZGundamTakenDamage,
  modifyEvadeAttempt: modifyCpuZGundamEvadeAttempt
},
  
  cpu_shining_gundam: {
  getDerivedState: getCpuShiningDerivedState,
  onBeforeSlot: onCpuShiningBeforeSlot,
  onAfterSlotResolved: onCpuShiningAfterSlotResolved,
  onActionResolved: onCpuShiningActionResolved,
  onTurnEnd: onCpuShiningTurnEnd,
  onDamaged: onCpuShiningDamaged,
  modifyTakenDamage: modifyCpuShiningTakenDamage,
  modifyEvadeAttempt: modifyCpuShiningEvadeAttempt,
  getExtraWeaponResult: getCpuShiningExtraWeaponResult
},
  cpu_wing_zero: {
  getDerivedState: getCpuWingZeroDerivedState,
  onBeforeSlot: onCpuWingZeroBeforeSlot,
  onAfterSlotResolved: onCpuWingZeroAfterSlotResolved,
  onActionResolved: onCpuWingZeroActionResolved,
  onTurnEnd: onCpuWingZeroTurnEnd,
  onDamaged: onCpuWingZeroDamaged,
  modifyTakenDamage: modifyCpuWingZeroTakenDamage,
  modifyEvadeAttempt: modifyCpuWingZeroEvadeAttempt,
  getExtraWeaponResult: getCpuWingZeroExtraWeaponResult
},

cpu_strike_gundam: {
  getDerivedState: getCpuStrikeDerivedState,
  onBeforeSlot: onCpuStrikeBeforeSlot,
  onAfterSlotResolved: onCpuStrikeAfterSlotResolved,
  onActionResolved: onCpuStrikeActionResolved,
  onTurnEnd: onCpuStrikeTurnEnd,
  modifyTakenDamage: modifyCpuStrikeTakenDamage,
  modifyEvadeAttempt: modifyCpuStrikeEvadeAttempt,
  getExtraWeaponResult: getCpuStrikeExtraWeaponResult
},
  
  //ボス機体//
devil_gundam: devilGundamRules,
};


