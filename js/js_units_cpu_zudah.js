import { zudah } from "./js_units_zudah.js";

export const cpu_zudah = structuredClone(zudah);

cpu_zudah.id = "cpu_zudah";
cpu_zudah.name = "ヅダ";
cpu_zudah.isCpu = true;

Object.values(cpu_zudah.forms || {}).forEach(form => {
  form.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_zudah_traits",
      timing: "auto",
      actionType: "auto",
      desc: "加速状態では高確率でエンジンカットを行う。確率でダメージを半減し、回避が多い時は回避を消費して追加スロット行動を行う。行動権が余って回避が無い時は翻弄で回避を補充し、必中攻撃も回避2消費で回避できる。"
    }
  ];
});
