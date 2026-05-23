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
  desc: "一定ターンごとに追加武装で追撃する。HPが減ると回復行動を行い、瀕死時にはラストシューティングで反撃する。"
  }
];
