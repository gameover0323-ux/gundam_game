export function createBattleRuntimeAccessors(ctx) {
  return {
    getPendingChoice: () => ctx.getPendingChoice(),

    getCurrentAttack: () => ctx.getCurrentAttack(),
    getCurrentAttackContext: () => ctx.getCurrentAttackContext(),
    getCurrentAttackContexts: () => ctx.getCurrentAttackContexts(),

    setCurrentAttack: (value) => ctx.setCurrentAttack(value),
    setCurrentAttackContext: (value) => ctx.setCurrentAttackContext(value),
    setCurrentAttackContexts: (value) => ctx.setCurrentAttackContexts(value)
  };
}
