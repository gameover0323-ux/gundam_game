import { unicorn_gundam } from "./js_units_unicorn_gundam.js";

export const cpu_unicorn_gundam = structuredClone(unicorn_gundam);

cpu_unicorn_gundam.id = "cpu_unicorn_gundam";
cpu_unicorn_gundam.name = "ユニコーンガンダム";
cpu_unicorn_gundam.isCpu = true;

Object.values(cpu_unicorn_gundam.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_unicorn_traits",
      timing: "auto",
      actionType: "auto",
      desc: "相手の強化に反応してNT-Dや覚醒を狙う。回避を消費して覚醒保持を増やし、デストロイモードや覚醒状態で攻撃性能と防御性能が上がる。"
    }
  ];
});
