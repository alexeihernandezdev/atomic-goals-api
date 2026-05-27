export const STEP_TOKENS = {
  STEP_REPOSITORY: Symbol('IStepRepository'),
  GOAL_INSTANCE_REPOSITORY: Symbol('IGoalInstanceRepository_Steps'),
  UNIT_OF_WORK: Symbol('IUnitOfWork_Steps'),
} as const;
