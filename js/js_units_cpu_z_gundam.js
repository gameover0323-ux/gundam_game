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
  desc: "戦闘中にZガンダム形態とウェイブライダー形態を切り替えることがある。バイオセンサー発動中は防御性能が上がり、攻撃を完全回避されると相手の回避を0にする。"
    }
  ];
});
