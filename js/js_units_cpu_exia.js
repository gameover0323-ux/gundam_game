import { exia } from "./js_units_exia.js";

export const cpu_exia = structuredClone(exia);

cpu_exia.id = "cpu_exia";
cpu_exia.name = "ガンダムエクシア";
cpu_exia.isCpu = true;

if (cpu_exia.forms?.base) {
  cpu_exia.forms.base.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_exia_traits",
      timing: "auto",
      actionType: "auto",
      desc: "回避が多い時、確率でセブンソードコンビネーションを発動する。確率でダメージを半減し、TRANS-AMやアヴァランチ換装も行う。通常形態でHP0になるとエクシアリペアになる。"
    }
  ];
}

if (cpu_exia.forms?.trans_am) {
  cpu_exia.forms.trans_am.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_exia_trans_am_traits",
      timing: "auto",
      actionType: "auto",
      desc: "行動前にHP50減少するが、自壊では撃墜されない。HP25消費で行動回数を増やし、最大4回分のスロット行動を行う。確率でダメージ半減や回復を行い、HPが低い時は通常エクシアに戻る。"
    }
  ];
}

if (cpu_exia.forms?.avalanche) {
  cpu_exia.forms.avalanche.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_exia_avalanche_traits",
      timing: "auto",
      actionType: "auto",
      desc: "確率で通常エクシアへ解除、またはアヴァランチTRANS-AMへ移行する。確率でダメージを半減し、回避が最大値を超えている時は必中攻撃を通常回避できる。致命ダメージ時は離脱解除でダメージを無効化する。"
    }
  ];
}

if (cpu_exia.forms?.avalanche_trans_am) {
  cpu_exia.forms.avalanche_trans_am.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_exia_avalanche_trans_am_traits",
      timing: "auto",
      actionType: "auto",
      desc: "行動前にHP50減少するが、自壊では撃墜されない。回避3消費ごとに行動回数を増やし、最大4回分のスロット行動を行う。確率でダメージを半減し、必中攻撃も通常回避できる。"
    }
  ];
}

if (cpu_exia.forms?.repair) {
  cpu_exia.forms.repair.specials = [
    {
      name: "CPU特性",
      effectType: "cpu_exia_repair_traits",
      timing: "auto",
      actionType: "auto",
      desc: "変形時HP100。この形態で致命的なダメージを受けた時、1度だけHP1で耐える。さらに3回まで1ターンに受けるダメージを半減する。"
    }
  ];
}
