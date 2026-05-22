import { gundam_mc } from "./js_units_gundam_mc.js";

export const cpu_gundam_mc = structuredClone(gundam_mc);

cpu_gundam_mc.id = "cpu_gundam_mc";
cpu_gundam_mc.name = "ガンダム(ﾏｸﾞﾈｯﾄｺｰﾃｨﾝｸﾞ)";
cpu_gundam_mc.isCpu = true;

cpu_gundam_mc.forms.base.specials = [
  {
    name: "CPU特性",
    effectType: "cpu_gundam_traits",
    timing: "auto",
    actionType: "auto",
    desc: "3ターンに1回、追加武装を同時発動する。HP200未満で低HP補正、HP50以下でラストシューティング補正。"
  }
];
