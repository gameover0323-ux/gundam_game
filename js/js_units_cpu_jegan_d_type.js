import { jegan_d_type } from "./js_units_jegan_d_type.js";

export const cpu_jegan_d_type = structuredClone(jegan_d_type);

cpu_jegan_d_type.id = "cpu_jegan_d_type";
cpu_jegan_d_type.name = "ジェガンD型";
cpu_jegan_d_type.isCpu = true;

Object.values(cpu_jegan_d_type.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_jegan_traits",
      timing: "auto",
      actionType: "auto",
      desc: "状況に応じてEWAC・スターク・エスコート装備を使い分ける。リミッター解除や援護射撃、シールド、防御バリアで粘り強く戦う。"
    }
  ];
});
