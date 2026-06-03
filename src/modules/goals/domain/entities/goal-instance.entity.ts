import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { GoalInstanceStatus } from '../enums/goal-instance-status.enum';

interface CreateGoalInstanceProps {
  goalId: Uuid;
  cycleStart: Date;
  cycleEnd: Date;
}

interface ReconstituteGoalInstanceProps {
  id: Uuid;
  goalId: Uuid;
  cycleStart: Date;
  cycleEnd: Date;
  status: GoalInstanceStatus;
  progress: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class GoalInstance {
  private constructor(
    private readonly _id: Uuid,
    private readonly _goalId: Uuid,
    private _cycleStart: Date,
    private _cycleEnd: Date,
    private _status: GoalInstanceStatus,
    private _progress: number,
    private _completedAt: Date | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | undefined,
  ) {}

  static create(props: CreateGoalInstanceProps): GoalInstance {
    const now = new Date();
    return new GoalInstance(
      Uuid.generate(),
      props.goalId,
      props.cycleStart,
      props.cycleEnd,
      GoalInstanceStatus.IN_PROGRESS,
      0,
      undefined,
      now,
      now,
      undefined,
    );
  }

  static reconstitute(props: ReconstituteGoalInstanceProps): GoalInstance {
    return new GoalInstance(
      props.id,
      props.goalId,
      props.cycleStart,
      props.cycleEnd,
      props.status,
      props.progress,
      props.completedAt,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  complete(): void {
    this._status = GoalInstanceStatus.COMPLETED;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  fail(): void {
    this._status = GoalInstanceStatus.FAILED;
    this._updatedAt = new Date();
  }

  archive(): void {
    this._status = GoalInstanceStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  updateProgress(progress: number): void {
    this._progress = Math.min(100, Math.max(0, progress));
    this._updatedAt = new Date();
  }

  updateCycleBounds(cycleStart: Date, cycleEnd: Date): void {
    this._cycleStart = cycleStart;
    this._cycleEnd = cycleEnd;
    this._updatedAt = new Date();
  }

  updateStatus(status: GoalInstanceStatus): void {
    this._status = status;
    if (status === GoalInstanceStatus.COMPLETED) {
      this._completedAt = new Date();
    }
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): Uuid {
    return this._id;
  }
  get goalId(): Uuid {
    return this._goalId;
  }
  get cycleStart(): Date {
    return this._cycleStart;
  }
  get cycleEnd(): Date {
    return this._cycleEnd;
  }
  get status(): GoalInstanceStatus {
    return this._status;
  }
  get progress(): number {
    return this._progress;
  }
  get completedAt(): Date | undefined {
    return this._completedAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }
}
