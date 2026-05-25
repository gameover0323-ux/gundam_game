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
import {
  getUnicornDerivedState,
  canUseUnicornSpecial,
  executeUnicornSpecial,
  onUnicornAfterSlotResolved,
  onUnicornActionResolved,
  onUnicornTurnEnd,
  modifyUnicornTakenDamage,
  onUnicornDispelBoostState
} from "./js_unit_rules_unicorn_gundam.js";
import {
  getJeganDerivedState,
  canUseJeganSpecial,
  executeJeganSpecial,
  onJeganTurnEnd,
  onJeganBeforeSlot,
  onJeganEnemyBeforeSlot,
  onJeganAfterSlotResolved,
  onJeganActionResolved,
  onJeganDamaged,
  modifyJeganTakenDamage,
  modifyJeganEvadeAttempt,
  onJeganResolveChoice
} from "./js_unit_rules_jegan_d_type.js";
import {
  getZudahDerivedState,
  canUseZudahSpecial,
  executeZudahSpecial,
  onZudahTurnEnd,
  onZudahBeforeSlot,
  onZudahEnemyBeforeSlot,
  onZudahAfterSlotResolved,
  onZudahActionResolved,
  onZudahDamaged,
  modifyZudahTakenDamage,
  modifyZudahEvadeAttempt,
  onZudahResolveChoice
} from "./js_unit_rules_zudah.js";

//ボス機体//
import { devilGundamRules } from "./js_unit_rules_devil_gundam.js";
import {
  getExtremeGundamDerivedState,
  onExtremeGundamTurnEnd,
  onExtremeGundamBeforeSlot,
  onExtremeGundamEnemyBeforeSlot,
  onExtremeGundamAfterSlotResolved,
  onExtremeGundamActionResolved,
  onExtremeGundamDamaged,
  modifyExtremeGundamTakenDamage,
  modifyExtremeGundamEvadeAttempt
} from "./js_unit_rules_extreme_gundam.js";
//初心者向け//
import {
  getCpuZakuIiSoldierDerivedState,
  onCpuZakuIiSoldierBeforeSlot,
  onCpuZakuIiSoldierAfterSlotResolved,
  onCpuZakuIiSoldierActionResolved
} from "./js_unit_rules_cpu_zaku_ii_soldier.js";
import {
  getCpuGoufDerivedState,
  onCpuGoufBeforeSlot,
  onCpuGoufEnemyBeforeSlot,
  onCpuGoufActionResolved,
  getCpuGoufExtraWeaponResult
} from "./js_unit_rules_cpu_gouf.js";

import {
  getCpuMobileGinnDerivedState,
  onCpuMobileGinnBeforeSlot,
  onCpuMobileGinnAfterSlotResolved,
  onCpuMobileGinnActionResolved,
  getCpuMobileGinnExtraWeaponResult
} from "./js_unit_rules_cpu_mobile_ginn.js";

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
import {
  getCpuUnicornDerivedState,
  onCpuUnicornBeforeSlot,
  onCpuUnicornAfterSlotResolved,
  onCpuUnicornActionResolved,
  onCpuUnicornTurnEnd,
  modifyCpuUnicornTakenDamage,
  modifyCpuUnicornEvadeAttempt
} from "./js_unit_rules_cpu_unicorn_gundam.js";
import {
  getCpuJeganDerivedState,
  onCpuJeganBeforeSlot,
  onCpuJeganEnemyBeforeSlot,
  onCpuJeganAfterSlotResolved,
  onCpuJeganActionResolved,
  onCpuJeganDamaged,
  onCpuJeganTurnEnd,
  modifyCpuJeganTakenDamage,
  modifyCpuJeganEvadeAttempt,
  onCpuJeganResolveChoice
} from "./js_unit_rules_cpu_jegan_d_type.js";
import {
  getDaisyDerivedState,
  canUseDaisySpecial,
  executeDaisySpecial,
  onDaisyTurnEnd,
  onDaisyBeforeSlot,
  onDaisyAfterSlotResolved,
  onDaisyActionResolved,
  modifyDaisyTakenDamage,
  modifyDaisyEvadeAttempt,
  onDaisyResolveChoice
} from "./js_unit_rules_daisy_ogre_ciel.js";


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
  unicorn_gundam: {
  getDerivedState: getUnicornDerivedState,
  canUseSpecial: canUseUnicornSpecial,
  executeSpecial: executeUnicornSpecial,
  onAfterSlotResolved: onUnicornAfterSlotResolved,
  onActionResolved: onUnicornActionResolved,
  onTurnEnd: onUnicornTurnEnd,
  modifyTakenDamage: modifyUnicornTakenDamage,
  onDispelBoostState: onUnicornDispelBoostState
},
  zudah: {
  getDerivedState: getZudahDerivedState,
  canUseSpecial: canUseZudahSpecial,
  executeSpecial: executeZudahSpecial,
  onTurnEnd: onZudahTurnEnd,
  onBeforeSlot: onZudahBeforeSlot,
  onEnemyBeforeSlot: onZudahEnemyBeforeSlot,
  onAfterSlotResolved: onZudahAfterSlotResolved,
  onActionResolved: onZudahActionResolved,
  onDamaged: onZudahDamaged,
  modifyTakenDamage: modifyZudahTakenDamage,
  modifyEvadeAttempt: modifyZudahEvadeAttempt,
  onResolveChoice: onZudahResolveChoice
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
cpu_unicorn_gundam: {
  getDerivedState: getCpuUnicornDerivedState,
  onBeforeSlot: onCpuUnicornBeforeSlot,
  onAfterSlotResolved: onCpuUnicornAfterSlotResolved,
  onActionResolved: onCpuUnicornActionResolved,
  onTurnEnd: onCpuUnicornTurnEnd,
  modifyTakenDamage: modifyCpuUnicornTakenDamage,
  modifyEvadeAttempt: modifyCpuUnicornEvadeAttempt
},
cpu_jegan_d_type: {
    getDerivedState: getCpuJeganDerivedState,
    onBeforeSlot: onCpuJeganBeforeSlot,
    onEnemyBeforeSlot: onCpuJeganEnemyBeforeSlot,
    onAfterSlotResolved: onCpuJeganAfterSlotResolved,
    onActionResolved: onCpuJeganActionResolved,
    onDamaged: onCpuJeganDamaged,
    onTurnEnd: onCpuJeganTurnEnd,
    modifyTakenDamage: modifyCpuJeganTakenDamage,
    modifyEvadeAttempt: modifyCpuJeganEvadeAttempt,
    onResolveChoice: onCpuJeganResolveChoice
  },
  
jegan_d_type: {
  getDerivedState: getJeganDerivedState,
  canUseSpecial: canUseJeganSpecial,
  executeSpecial: executeJeganSpecial,
  onTurnEnd: onJeganTurnEnd,
  onBeforeSlot: onJeganBeforeSlot,
  onEnemyBeforeSlot: onJeganEnemyBeforeSlot,
  onAfterSlotResolved: onJeganAfterSlotResolved,
  onActionResolved: onJeganActionResolved,
  onDamaged: onJeganDamaged,
  modifyTakenDamage: modifyJeganTakenDamage,
  modifyEvadeAttempt: modifyJeganEvadeAttempt,
  onResolveChoice: onJeganResolveChoice
},
  
//初心者向け//
cpu_zaku_ii_soldier: {
  getDerivedState: getCpuZakuIiSoldierDerivedState,
  onBeforeSlot: onCpuZakuIiSoldierBeforeSlot,
  onAfterSlotResolved: onCpuZakuIiSoldierAfterSlotResolved,
  onActionResolved: onCpuZakuIiSoldierActionResolved
},
cpu_gouf: {
  getDerivedState: getCpuGoufDerivedState,
  onBeforeSlot: onCpuGoufBeforeSlot,
  onEnemyBeforeSlot: onCpuGoufEnemyBeforeSlot,
  onActionResolved: onCpuGoufActionResolved,
  getExtraWeaponResult: getCpuGoufExtraWeaponResult
},
  cpu_mobile_ginn: {
  getDerivedState: getCpuMobileGinnDerivedState,
  onBeforeSlot: onCpuMobileGinnBeforeSlot,
  onAfterSlotResolved: onCpuMobileGinnAfterSlotResolved,
  onActionResolved: onCpuMobileGinnActionResolved,
  getExtraWeaponResult: getCpuMobileGinnExtraWeaponResult
},
//デバッグ権限//
  daisy_ogre_ciel: {
  getDerivedState: getDaisyDerivedState,
  canUseSpecial: canUseDaisySpecial,
  executeSpecial: executeDaisySpecial,
  onTurnEnd: onDaisyTurnEnd,
  onBeforeSlot: onDaisyBeforeSlot,
  onAfterSlotResolved: onDaisyAfterSlotResolved,
  onActionResolved: onDaisyActionResolved,
  modifyTakenDamage: modifyDaisyTakenDamage,
  modifyEvadeAttempt: modifyDaisyEvadeAttempt,
  onResolveChoice: onDaisyResolveChoice
  },
//ボス機体//
devil_gundam: devilGundamRules,

extreme_gundam: {
  getDerivedState: getExtremeGundamDerivedState,
  onTurnEnd: onExtremeGundamTurnEnd,
  onBeforeSlot: onExtremeGundamBeforeSlot,
  onEnemyBeforeSlot: onExtremeGundamEnemyBeforeSlot,
  onAfterSlotResolved: onExtremeGundamAfterSlotResolved,
  onActionResolved: onExtremeGundamActionResolved,
  onDamaged: onExtremeGundamDamaged,
  modifyTakenDamage: modifyExtremeGundamTakenDamage,
  modifyEvadeAttempt: modifyExtremeGundamEvadeAttempt
}

};
