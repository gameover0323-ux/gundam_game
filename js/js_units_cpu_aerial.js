import { aerial } from "./js_units_aerial.js";

export const cpu_aerial = structuredClone(aerial);

cpu_aerial.id = "cpu_aerial";
cpu_aerial.name = "ガンダム・エアリアル";
cpu_aerial.isCpu = true;

Object.values(cpu_aerial.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_aerial_traits",
      timing: "auto",
      actionType: "auto",
      desc: "回避0で確率無効、回避1以上なら100以上の総合ダメージを最大3回無効化する。100ダメージごとに回避倍加し、回避割合に応じてガンビット連携を行う。スコアシックス中は赤上限時に回避を消費して強化ターンを延長する。"
    }
  ];
});
