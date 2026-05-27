export const GOAL_TOKENS = {
  GOAL_REPOSITORY: Symbol('IGoalRepository'),
  GOAL_INSTANCE_REPOSITORY: Symbol('IGoalInstanceRepository'),
  CLOCK: Symbol('IClock'),
  UNIT_OF_WORK: Symbol('IUnitOfWork'),
} as const;
