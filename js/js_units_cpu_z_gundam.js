import { z_gundam } from "./js_units_z_gundam.js";

export const cpu_z_gundam = structuredClone(z_gundam);

cpu_z_gundam.id = "cpu_z_gundam";
cpu_z_gundam.name = "Zガンダム";
cpu_z_gundam.isCpu = true;

Object.values(cpu_z_gundam.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_z_traits",
      timing: "auto",
      actionType: "auto",
      desc: "10分の1で変形する。バイオセンサー中は被ダメージを軽減し、攻撃を完全回避された時に相手の回避を0にする。"
    }
  ];
});
