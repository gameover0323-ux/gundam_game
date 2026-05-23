import { wing_zero } from "./js_units_wing_zero.js";

export const cpu_wing_zero = structuredClone(wing_zero);

cpu_wing_zero.id = "cpu_wing_zero";
cpu_wing_zero.name = "ウイングガンダムゼロ";
cpu_wing_zero.isCpu = true;

Object.values(cpu_wing_zero.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_wing_zero_traits",
      timing: "auto",
      actionType: "auto",
desc: "ゼロシステムを切り替えながら戦う。命中補正中は相手の回避を崩し、条件が揃うと追撃や変形を行う。HPが減るとゼロシステムが暴走する。"    }
  ];
});
