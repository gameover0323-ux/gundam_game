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
  getV2DerivedState,
  canUseV2Special,
  executeV2Special,
  onV2TurnEnd,
  onV2BeforeSlot,
  onV2EnemyBeforeSlot,
  onV2AfterSlotResolved,
  onV2ActionResolved,
  onV2Damaged,
  modifyV2TakenDamage,
  modifyV2EvadeAttempt,
  onV2ResolveChoice
} from "./js_unit_rules_v2_gundam.js";


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
  getFreedomDerivedState,
  canUseFreedomSpecial,
  executeFreedomSpecial,
  onFreedomBeforeSlot,
  onFreedomEnemyBeforeSlot,
  onFreedomAfterSlotResolved,
  onFreedomActionResolved,
  onFreedomDamaged,
  onFreedomTurnEnd,
  modifyFreedomTakenDamage,
  modifyFreedomEvadeAttempt,
  onFreedomResolveChoice
} from "./js_unit_rules_freedom_gundam.js";

import {
  getExiaDerivedState,
  canUseExiaSpecial,
  executeExiaSpecial,
  onExiaTurnEnd,
  onExiaBeforeSlot,
  onExiaAfterSlotResolved,
  onExiaActionResolved,
  onExiaDamaged,
  modifyExiaTakenDamage,
  modifyExiaEvadeAttempt,
  onExiaResolveChoice
} from "./js_unit_rules_exia.js";
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

import { getGSelfDerivedState, 
        canUseGSelfSpecial, 
        executeGSelfSpecial, 
        onGSelfTurnEnd, 
        onGSelfBeforeSlot, 
        onGSelfEnemyBeforeSlot,
        onGSelfAfterSlotResolved,
        onGSelfActionResolved,
        onGSelfDamaged, 
        modifyGSelfTakenDamage, 
        modifyGSelfEvadeAttempt,
        onGSelfResolveChoice
       } from "./js_unit_rules_g_self.js";

import {
  getBarbatosDerivedState,
  canUseBarbatosSpecial,
  executeBarbatosSpecial,
  onBarbatosTurnEnd,
  onBarbatosBeforeSlot,
  onBarbatosEnemyBeforeSlot,
  onBarbatosAfterSlotResolved,
  onBarbatosActionResolved,
  onBarbatosDamaged,
  modifyBarbatosTakenDamage,
  modifyBarbatosEvadeAttempt,
  onBarbatosResolveChoice
} from "./js_unit_rules_barbatos.js";
import {
  getAerialDerivedState,
  canUseAerialSpecial,
  executeAerialSpecial,
  onAerialTurnEnd,
  onAerialBeforeSlot,
  onAerialEnemyBeforeSlot,
  onAerialAfterSlotResolved,
  onAerialActionResolved,
  onAerialDamaged,
  modifyAerialTakenDamage,
  modifyAerialEvadeAttempt,
  onAerialResolveChoice
} from "./js_unit_rules_aerial.js";

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
  getCpuV2DerivedState,
  onCpuV2BeforeSlot,
  onCpuV2EnemyBeforeSlot,
  onCpuV2AfterSlotResolved,
  onCpuV2ActionResolved,
  onCpuV2Damaged,
  onCpuV2TurnEnd,
  modifyCpuV2TakenDamage,
  modifyCpuV2EvadeAttempt
} from "./js_unit_rules_cpu_v2_gundam.js";

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
  getCpuFreedomDerivedState,
  executeCpuFreedomSpecial,
  onCpuFreedomBeforeSlot,
  onCpuFreedomEnemyBeforeSlot,
  onCpuFreedomAfterSlotResolved,
  onCpuFreedomActionResolved,
  onCpuFreedomDamaged,
  onCpuFreedomTurnEnd,
  modifyCpuFreedomTakenDamage,
  modifyCpuFreedomEvadeAttempt,
  onCpuFreedomResolveChoice,
  getCpuFreedomExtraWeaponResult
} from "./js_unit_rules_cpu_freedom_gundam.js";

import {
  getCpuExiaDerivedState,
  onCpuExiaBeforeSlot,
  onCpuExiaEnemyBeforeSlot,
  onCpuExiaAfterSlotResolved,
  onCpuExiaActionResolved,
  onCpuExiaDamaged,
  onCpuExiaTurnEnd,
  modifyCpuExiaTakenDamage,
  modifyCpuExiaEvadeAttempt,
  onCpuExiaResolveChoice
} from "./js_unit_rules_cpu_exia.js";
import {
  getCpuUnicornDerivedState,
  onCpuUnicornBeforeSlot,
  onCpuUnicornAfterSlotResolved,
  onCpuUnicornActionResolved,
  onCpuUnicornTurnEnd,
  modifyCpuUnicornTakenDamage,
  modifyCpuUnicornEvadeAttempt
} from "./js_unit_rules_cpu_unicorn_gundam.js";

import { getCpuGSelfDerivedState,
        canUseCpuGSelfSpecial, 
        executeCpuGSelfSpecial, 
        onCpuGSelfTurnEnd, 
        onCpuGSelfBeforeSlot,
        onCpuGSelfEnemyBeforeSlot, 
        onCpuGSelfAfterSlotResolved, 
        onCpuGSelfActionResolved, 
        onCpuGSelfDamaged,
        modifyCpuGSelfTakenDamage,
        modifyCpuGSelfEvadeAttempt,
        onCpuGSelfResolveChoice 
       } from "./js_unit_rules_cpu_g_self.js";


import {
  getCpuBarbatosDerivedState,
  onCpuBarbatosBeforeSlot,
  onCpuBarbatosEnemyBeforeSlot,
  onCpuBarbatosAfterSlotResolved,
  onCpuBarbatosActionResolved,
  onCpuBarbatosDamaged,
  onCpuBarbatosTurnEnd,
  modifyCpuBarbatosTakenDamage,
  modifyCpuBarbatosEvadeAttempt,
  onCpuBarbatosResolveChoice
} from "./js_unit_rules_cpu_barbatos.js";
import {
  getCpuAerialDerivedState,
  onCpuAerialBeforeSlot,
  onCpuAerialEnemyBeforeSlot,
  onCpuAerialAfterSlotResolved,
  onCpuAerialActionResolved,
  onCpuAerialDamaged,
  onCpuAerialTurnEnd,
  modifyCpuAerialTakenDamage,
  modifyCpuAerialEvadeAttempt,
  getCpuAerialExtraWeaponResult,
  onCpuAerialResolveChoice
} from "./js_unit_rules_cpu_aerial.js";

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
  getCpuZudahDerivedState,
  onCpuZudahBeforeSlot,
  onCpuZudahEnemyBeforeSlot,
  onCpuZudahAfterSlotResolved,
  onCpuZudahActionResolved,
  onCpuZudahDamaged,
  onCpuZudahTurnEnd,
  modifyCpuZudahTakenDamage,
  modifyCpuZudahEvadeAttempt,
  onCpuZudahResolveChoice
} from "./js_unit_rules_cpu_zudah.js";

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

v2_gundam: {
  getDerivedState: getV2DerivedState,
  canUseSpecial: canUseV2Special,
  executeSpecial: executeV2Special,
  onTurnEnd: onV2TurnEnd,
  onBeforeSlot: onV2BeforeSlot,
  onEnemyBeforeSlot: onV2EnemyBeforeSlot,
  onAfterSlotResolved: onV2AfterSlotResolved,
  onActionResolved: onV2ActionResolved,
  onDamaged: onV2Damaged,
  modifyTakenDamage: modifyV2TakenDamage,
  modifyEvadeAttempt: modifyV2EvadeAttempt,
  onResolveChoice: onV2ResolveChoice
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


  freedom_gundam: {
  getDerivedState: getFreedomDerivedState,
  canUseSpecial: canUseFreedomSpecial,
  executeSpecial: executeFreedomSpecial,
  onTurnEnd: onFreedomTurnEnd,
  onBeforeSlot: onFreedomBeforeSlot,
  onEnemyBeforeSlot: onFreedomEnemyBeforeSlot,
  onAfterSlotResolved: onFreedomAfterSlotResolved,
  onActionResolved: onFreedomActionResolved,
  onDamaged: onFreedomDamaged,
  modifyTakenDamage: modifyFreedomTakenDamage,
  modifyEvadeAttempt: modifyFreedomEvadeAttempt,
  onResolveChoice: onFreedomResolveChoice
},
  exia: {
  getDerivedState: getExiaDerivedState,
  canUseSpecial: canUseExiaSpecial,
  executeSpecial: executeExiaSpecial,
  onTurnEnd: onExiaTurnEnd,
  onBeforeSlot: onExiaBeforeSlot,
  onAfterSlotResolved: onExiaAfterSlotResolved,
  onActionResolved: onExiaActionResolved,
  onDamaged: onExiaDamaged,
  modifyTakenDamage: modifyExiaTakenDamage,
  modifyEvadeAttempt: modifyExiaEvadeAttempt,
  onResolveChoice: onExiaResolveChoice
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

g_self: {
  getDerivedState: getGSelfDerivedState,
  canUseSpecial: canUseGSelfSpecial,
  executeSpecial: executeGSelfSpecial,
  onTurnEnd: onGSelfTurnEnd,
  onBeforeSlot: onGSelfBeforeSlot,
  onEnemyBeforeSlot: onGSelfEnemyBeforeSlot,
  onAfterSlotResolved: onGSelfAfterSlotResolved,
  onActionResolved: onGSelfActionResolved,
  onDamaged: onGSelfDamaged,
  modifyTakenDamage: modifyGSelfTakenDamage,
  modifyEvadeAttempt: modifyGSelfEvadeAttempt,
  onResolveChoice: onGSelfResolveChoice
},
  
barbatos: {
  getDerivedState: getBarbatosDerivedState,
  canUseSpecial: canUseBarbatosSpecial,
  executeSpecial: executeBarbatosSpecial,
  onTurnEnd: onBarbatosTurnEnd,
  onBeforeSlot: onBarbatosBeforeSlot,
  onEnemyBeforeSlot: onBarbatosEnemyBeforeSlot,
  onAfterSlotResolved: onBarbatosAfterSlotResolved,
  onActionResolved: onBarbatosActionResolved,
  onDamaged: onBarbatosDamaged,
  modifyTakenDamage: modifyBarbatosTakenDamage,
  modifyEvadeAttempt: modifyBarbatosEvadeAttempt,
  onResolveChoice: onBarbatosResolveChoice
},
  
aerial: {
  getDerivedState: getAerialDerivedState,
  canUseSpecial: canUseAerialSpecial,
  executeSpecial: executeAerialSpecial,
  onTurnEnd: onAerialTurnEnd,
  onBeforeSlot: onAerialBeforeSlot,
  onEnemyBeforeSlot: onAerialEnemyBeforeSlot,
  onAfterSlotResolved: onAerialAfterSlotResolved,
  onActionResolved: onAerialActionResolved,
  onDamaged: onAerialDamaged,
  modifyTakenDamage: modifyAerialTakenDamage,
  modifyEvadeAttempt: modifyAerialEvadeAttempt,
  onResolveChoice: onAerialResolveChoice
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


cpu_v2_gundam: {
  getDerivedState: getCpuV2DerivedState,
  onBeforeSlot: onCpuV2BeforeSlot,
  onEnemyBeforeSlot: onCpuV2EnemyBeforeSlot,
  onAfterSlotResolved: onCpuV2AfterSlotResolved,
  onActionResolved: onCpuV2ActionResolved,
  onDamaged: onCpuV2Damaged,
  onTurnEnd: onCpuV2TurnEnd,
  modifyTakenDamage: modifyCpuV2TakenDamage,
  modifyEvadeAttempt: modifyCpuV2EvadeAttempt
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

  cpu_freedom_gundam: {
  getDerivedState: getCpuFreedomDerivedState,
  executeSpecial: executeCpuFreedomSpecial,
  onTurnEnd: onCpuFreedomTurnEnd,
  onBeforeSlot: onCpuFreedomBeforeSlot,
  onEnemyBeforeSlot: onCpuFreedomEnemyBeforeSlot,
  onAfterSlotResolved: onCpuFreedomAfterSlotResolved,
  onActionResolved: onCpuFreedomActionResolved,
  onDamaged: onCpuFreedomDamaged,
  modifyTakenDamage: modifyCpuFreedomTakenDamage,
  modifyEvadeAttempt: modifyCpuFreedomEvadeAttempt,
  onResolveChoice: onCpuFreedomResolveChoice,
  getExtraWeaponResult: getCpuFreedomExtraWeaponResult
},
  
  cpu_exia: {
  getDerivedState: getCpuExiaDerivedState,
  onBeforeSlot: onCpuExiaBeforeSlot,
  onEnemyBeforeSlot: onCpuExiaEnemyBeforeSlot,
  onAfterSlotResolved: onCpuExiaAfterSlotResolved,
  onActionResolved: onCpuExiaActionResolved,
  onDamaged: onCpuExiaDamaged,
  onTurnEnd: onCpuExiaTurnEnd,
  modifyTakenDamage: modifyCpuExiaTakenDamage,
  modifyEvadeAttempt: modifyCpuExiaEvadeAttempt,
  onResolveChoice: onCpuExiaResolveChoice
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

cpu_g_self: {
  getDerivedState: getCpuGSelfDerivedState,
  canUseSpecial: canUseCpuGSelfSpecial,
  executeSpecial: executeCpuGSelfSpecial,
  onTurnEnd: onCpuGSelfTurnEnd,
  onBeforeSlot: onCpuGSelfBeforeSlot,
  onEnemyBeforeSlot: onCpuGSelfEnemyBeforeSlot,
  onAfterSlotResolved: onCpuGSelfAfterSlotResolved,
  onActionResolved: onCpuGSelfActionResolved,
  onDamaged: onCpuGSelfDamaged,
  modifyTakenDamage: modifyCpuGSelfTakenDamage,
  modifyEvadeAttempt: modifyCpuGSelfEvadeAttempt,
  onResolveChoice: onCpuGSelfResolveChoice
},
  
cpu_barbatos: {
  getDerivedState: getCpuBarbatosDerivedState,
  onBeforeSlot: onCpuBarbatosBeforeSlot,
  onEnemyBeforeSlot: onCpuBarbatosEnemyBeforeSlot,
  onAfterSlotResolved: onCpuBarbatosAfterSlotResolved,
  onActionResolved: onCpuBarbatosActionResolved,
  onDamaged: onCpuBarbatosDamaged,
  onTurnEnd: onCpuBarbatosTurnEnd,
  modifyTakenDamage: modifyCpuBarbatosTakenDamage,
  modifyEvadeAttempt: modifyCpuBarbatosEvadeAttempt,
  onResolveChoice: onCpuBarbatosResolveChoice
},
  
cpu_aerial: {
  getDerivedState: getCpuAerialDerivedState,
  onBeforeSlot: onCpuAerialBeforeSlot,
  onEnemyBeforeSlot: onCpuAerialEnemyBeforeSlot,
  onAfterSlotResolved: onCpuAerialAfterSlotResolved,
  onActionResolved: onCpuAerialActionResolved,
  onDamaged: onCpuAerialDamaged,
  onTurnEnd: onCpuAerialTurnEnd,
  modifyTakenDamage: modifyCpuAerialTakenDamage,
  modifyEvadeAttempt: modifyCpuAerialEvadeAttempt,
  onResolveChoice: onCpuAerialResolveChoice,
  getExtraWeaponResult: getCpuAerialExtraWeaponResult
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
cpu_zudah: {
  getDerivedState: getCpuZudahDerivedState,
  onBeforeSlot: onCpuZudahBeforeSlot,
  onEnemyBeforeSlot: onCpuZudahEnemyBeforeSlot,
  onAfterSlotResolved: onCpuZudahAfterSlotResolved,
  onActionResolved: onCpuZudahActionResolved,
  onDamaged: onCpuZudahDamaged,
  onTurnEnd: onCpuZudahTurnEnd,
  modifyTakenDamage: modifyCpuZudahTakenDamage,
  modifyEvadeAttempt: modifyCpuZudahEvadeAttempt,
  onResolveChoice: onCpuZudahResolveChoice
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
