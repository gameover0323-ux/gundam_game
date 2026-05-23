import { shining_gundam } from "./js_units_shining_gundam.js";

export const cpu_shining_gundam = structuredClone(shining_gundam);

cpu_shining_gundam.id = "cpu_shining_gundam";
cpu_shining_gundam.name = "シャイニングガンダム";
cpu_shining_gundam.isCpu = true;

Object.values(cpu_shining_gundam.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_shining_traits",
      timing: "auto",
      actionType: "auto",
      desc: "回避を消費して追加行動する。HPが減ると明鏡止水スーパーモードを狙い、強化状態を維持しながら攻めてくる。"    }
  ];
});
