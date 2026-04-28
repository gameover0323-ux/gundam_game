import { createAttack } from "./js_battle_system.js";

function parseSpecial(desc) {
  if (desc.includes("軽減不可")) return "ignoreDefense";
  if (desc.includes("コンフューズ")) return "confuse";
  return null;
}

function parseAttributes(desc) {
  return {
    melee: desc.includes("格闘"),
    shoot: desc.includes("射撃"),
    beam: desc.includes("ビーム"),
    ignoreReduction: desc.includes("軽減不可"),
    evade: /^回避/.test(desc),
    heal: desc.includes("回復")
  };
}

function resolveStructuredEffect({ slot, actor }) {
  const effect = slot?.effect;

  if (!effect || !effect.type) {
    return null;
  }

  if (effect.type === "evade") {
    const amount = Number(effect.amount || 0);
    actor.evade += amount;

    return {
      kind: "evade",
      attacks: [],
      message: `${actor.name} の回避が ${amount} 増加`
    };
  }

  if (effect.type === "heal") {
    const amount = Number(effect.amount || 0);
    actor.hp = Math.min(actor.maxHp, actor.hp + amount);

    return {
      kind: "heal",
      attacks: [],
      message: `${actor.name} が ${amount} 回復`
    };
  }

  if (effect.type === "attack") {
  const damage = Number(effect.damage || 0);

  let count = Number(effect.count || 1);
  if (typeof effect.randomCountMax === "number") {
    const min = Number(effect.randomCountMin || 1);
    const max = Number(effect.randomCountMax);
    count = Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const attacks = createAttack(damage, count, {
      type: effect.attackType || "shoot",
      beam: !!effect.beam,
      cannotEvade: !!effect.cannotEvade,
      ignoreReduction: !!effect.ignoreReduction,
      ignoreDefense: !!effect.ignoreDefense,

      addedBeam: !!effect.addedBeam,
      addedCannotEvade: !!effect.addedCannotEvade,
      addedIgnoreReduction: !!effect.addedIgnoreReduction,

      special: effect.special || null,
      source: effect.source || slot?.key || null,
      onHit: effect.onHit || null
    });

    return {
      kind: "attack",
      attacks,
      message: ""
    };
  }

  if (effect.type === "custom") {
    return {
      kind: "custom",
      attacks: [],
      message: "",
      customEffectId: effect.effectId || null
    };
  }

  return {
    kind: "none",
    attacks: [],
    message: ""
  };
}

function resolveLegacyDesc({ desc, actor }) {
  const result = {
    kind: "none",
    attacks: [],
    message: ""
  };

  if (/^回避/.test(desc)) {
    const ev = parseInt(desc.match(/(\d+)/)[1], 10);
    actor.evade += ev;

    result.kind = "evade";
    result.message = `${actor.name} の回避が ${ev} 増加`;
    return result;
  }

  const attr = parseAttributes(desc);

  if (attr.heal) {
    const heal = parseInt(desc.match(/(\d+)/)[1], 10);
    actor.hp = Math.min(actor.maxHp, actor.hp + heal);

    result.kind = "heal";
    result.message = `${actor.name} が ${heal} 回復`;
    return result;
  }

  if (attr.evade) {
    const ev = parseInt(desc.match(/(\d+)/)[1], 10);
    actor.evade += ev;

    result.kind = "evade";
    result.message = `${actor.name} の回避が ${ev} 増加`;
    return result;
  }

  const attacks = [];
  const multi = /(\d+)ダメージ[×x](\d+)/g;
  const single = /(\d+)ダメージ(?![×x\d])/g;

  for (const m of desc.matchAll(multi)) {
    const dmg = parseInt(m[1], 10);
    const count = parseInt(m[2], 10);

    const made = createAttack(dmg, count, {
      beam: attr.beam,
      type: attr.melee ? "melee" : "shoot",
      ignoreReduction: attr.ignoreReduction,
      cannotEvade: desc.includes("必中"),
      special: null,
      source: desc
    });

    if (parseSpecial(desc) === "confuse") {
      made.forEach(a => {
        a.special = "confuse";
      });
    }

    attacks.push(...made);
  }

  for (const m of desc.matchAll(single)) {
    const dmg = parseInt(m[1], 10);

    const made = createAttack(dmg, 1, {
      beam: attr.beam,
      type: attr.melee ? "melee" : "shoot",
      ignoreReduction: attr.ignoreReduction,
      cannotEvade: desc.includes("必中"),
      special: parseSpecial(desc),
      source: desc,
      onHit: null
    });

    attacks.push(...made);
  }

  if (attacks.length === 0) {
    result.kind = "none";
    result.attacks = [];
    result.message = "";
    return result;
  }

  result.kind = "attack";
  result.attacks = attacks;
  result.message = "";
  return result;
}

export function resolveSlotEffect({ slot, actor }) {
  const structured = resolveStructuredEffect({ slot, actor });
  if (structured) {
    return structured;
  }

  return resolveLegacyDesc({
    desc: slot?.desc || "",
    actor
  });
      }
