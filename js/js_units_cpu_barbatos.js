import { barbatos } from "./js_units_barbatos.js";

export const cpu_barbatos = structuredClone(barbatos);

cpu_barbatos.id = "cpu_barbatos";
cpu_barbatos.name = "ガンダム・バルバトス(第4形態)";
cpu_barbatos.isCpu = true;

Object.values(cpu_barbatos.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_barbatos_traits",
      timing: "auto",
      actionType: "auto",
      desc: "大ダメージ時にHPを削って回避を補充し、致命ダメージもHP5以下まで阿頼耶識で回避する。HP250以上ではHP50消費でスロット行動を追加する。ビームを半減し、第6形態では最初の3回まで攻撃ターンを無効化する。"
    }
  ];
});
