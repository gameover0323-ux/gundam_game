import { strike_gundam } from "./js_units_strike_gundam.js";

export const cpu_strike_gundam = structuredClone(strike_gundam);

cpu_strike_gundam.id = "cpu_strike_gundam";
cpu_strike_gundam.name = "ストライクガンダム";
cpu_strike_gundam.isCpu = true;

Object.values(cpu_strike_gundam.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_strike_traits",
      timing: "auto",
      actionType: "auto",
      desc: "戦況に応じてストライカーパックを換装する。エールは回避と回復、ソードは連続行動、ランチャーは高火力射撃を狙う。PS装甲で実弾や格闘に強い。"
    }
  ];
});
