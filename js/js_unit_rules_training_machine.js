export function getTrainingMachineDerivedState(state) {
  return {
    name: null,
    slots: {},
    specials: {},
    status: [
      {
        text: "会心率0%",
        color: "#aaa",
        bold: true
      }
    ]
  };
}

export function executeTrainingMachineSpecial() {
  return {
    handled: true,
    redraw: false,
    message: "トレーニングマシンの特性です"
  };
}

export function onTrainingMachineTurnEnd() {
  return {
    redraw: false,
    message: null
  };
}

export function onTrainingMachineBeforeSlot(state, rolledSlotNumber) {
  if (Number(rolledSlotNumber) === 5) {
    return {
      redraw: true,
      message: "確定会心攻撃"
    };
  }

  return {
    redraw: false,
    message: null
  };
}

export function onTrainingMachineEnemyBeforeSlot() {
  return {
    redraw: false,
    message: null
  };
}

export function onTrainingMachineAfterSlotResolved() {
  return {
    redraw: false,
    message: null
  };
}

export function onTrainingMachineActionResolved() {
  return {
    redraw: false,
    message: null
  };
}

export function onTrainingMachineDamaged() {
  return {
    redraw: false,
    message: null
  };
}

export function modifyTrainingMachineTakenDamage(defender, attacker, attack, damage) {
  return {
    damage,
    message: null
  };
}

export function modifyTrainingMachineEvadeAttempt(state, attack, canEvade) {
  return {
    canEvade,
    message: null
  };
}
