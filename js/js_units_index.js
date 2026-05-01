import { gundam_mc } from "./js_units_gundam_mc.js";
import { z_gundam } from "./js_units_z_gundam.js";
import { shining_gundam } from "./js_units_shining_gundam.js";
import { wing_zero } from "./js_units_wing_zero.js";
import { strike_gundam } from "./js_units_strike_gundam.js";

//ボス機体//
import { devil_gundam } from "./js_units_devil_gundam.js";


//CPU専用機体//
import { cpu_gundam_mc } from "./js_units_cpu_gundam_mc.js";
import { cpu_z_gundam } from "./js_units_cpu_z_gundam.js";


export const unitList = [
  gundam_mc,
  z_gundam,
  shining_gundam,
  wing_zero,
  strike_gundam
];

export const bossList = [
  devil_gundam
];

export const cpuList = [
  cpu_gundam_mc,
  cpu_z_gundam
];
