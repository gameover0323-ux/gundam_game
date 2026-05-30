import { freedom_gundam } from "./js_units_freedom_gundam.js";

export const cpu_freedom_gundam = structuredClone(freedom_gundam);
cpu_freedom_gundam.id = "cpu_freedom_gundam";
cpu_freedom_gundam.name = "フリーダムガンダム";
cpu_freedom_gundam.isCpu = true;

Object.values(cpu_freedom_gundam.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_freedom_traits",
      timing: "auto",
      actionType: "auto",
      desc: "10%で1ターンダメージ半減。S.E.E.D.中は回避使用率100%。条件成立時に追加行動・覚醒キャンセルを自動抽選する。"
    }
  ];
});
