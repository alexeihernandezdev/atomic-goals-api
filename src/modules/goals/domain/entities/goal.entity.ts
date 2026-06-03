import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { ValidationError } from '../../../../shared/domain/errors';
import { CyclePeriod } from '../enums/cycle-period.enum';
import { GoalType } from '../enums/goal-type.enum';

interface CreateGoalProps {
  userId: Uuid;
  categoryId: Uuid;
  name: string;
  description?: string;
  type: GoalType;
  cyclePeriod?: CyclePeriod;
  customCycleDays?: number;
}

interface ReconstituteGoalProps extends CreateGoalProps {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface UpdateGoalProps {
  name?: string;
  description?: string;
  categoryId?: Uuid;
  cyclePeriod?: CyclePeriod;
  customCycleDays?: number;
}

export class Goal {
  private constructor(
    private readonly _id: Uuid,
    private readonly _userId: Uuid,
    private _categoryId: Uuid,
    private _name: string,
    private _description: string | undefined,
    private readonly _type: GoalType,
    private _cyclePeriod: CyclePeriod | undefined,
    private _customCycleDays: number | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | undefined,
  ) {}

  static create(props: CreateGoalProps): Goal {
    if (!props.name.trim()) {
      throw new ValidationError('Goal name cannot be empty');
    }
    if (props.type === GoalType.CYCLIC && !props.cyclePeriod) {
      throw new ValidationError('Cyclic goals must have a cyclePeriod');
    }
    if (props.type === GoalType.CONCLUSIVE && props.cyclePeriod) {
      throw new ValidationError('Conclusive goals cannot have a cyclePeriod');
    }
    if (
      props.cyclePeriod === CyclePeriod.CUSTOM_DAYS &&
      (!props.customCycleDays || props.customCycleDays < 1)
    ) {
      throw new ValidationError(
        'CUSTOM_DAYS period requires customCycleDays >= 1',
      );
    }
    const now = new Date();
    return new Goal(
      Uuid.generate(),
      props.userId,
      props.categoryId,
      props.name.trim(),
      props.description,
      props.type,
      props.cyclePeriod,
      props.customCycleDays,
      now,
      now,
      undefined,
    );
  }

  static reconstitute(props: ReconstituteGoalProps): Goal {
    return new Goal(
      props.id,
      props.userId,
      props.categoryId,
      props.name,
      props.description,
      props.type,
      props.cyclePeriod,
      props.customCycleDays,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  update(props: UpdateGoalProps): void {
    if (props.name !== undefined) {
      if (!props.name.trim())
        throw new ValidationError('Goal name cannot be empty');
      this._name = props.name.trim();
    }
    if (props.description !== undefined) this._description = props.description;
    if (props.categoryId !== undefined) this._categoryId = props.categoryId;
    if (props.cyclePeriod !== undefined) {
      if (this._type === GoalType.CONCLUSIVE) {
        throw new ValidationError('Conclusive goals cannot have a cyclePeriod');
      }
      this._cyclePeriod = props.cyclePeriod;
    }
    if (props.customCycleDays !== undefined) {
      this._customCycleDays = props.customCycleDays;
    }
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  restore(): void {
    this._deletedAt = undefined;
    this._updatedAt = new Date();
  }

  shouldCloseCurrentCycle(instanceCycleEnd: Date, now: Date): boolean {
    if (this._type !== GoalType.CYCLIC) return false;
    return now >= instanceCycleEnd;
  }

  nextCycleEnd(fromDate: Date): Date {
    const d = new Date(fromDate);
    switch (this._cyclePeriod) {
      case CyclePeriod.DAILY:
        d.setDate(d.getDate() + 1);
        break;
      case CyclePeriod.WEEKLY:
        d.setDate(d.getDate() + 7);
        break;
      case CyclePeriod.MONTHLY:
        d.setMonth(d.getMonth() + 1);
        break;
      case CyclePeriod.YEARLY:
        d.setFullYear(d.getFullYear() + 1);
        break;
      case CyclePeriod.CUSTOM_DAYS:
        d.setDate(d.getDate() + (this._customCycleDays ?? 1));
        break;
    }
    return d;
  }

  get id(): Uuid {
    return this._id;
  }
  get userId(): Uuid {
    return this._userId;
  }
  get categoryId(): Uuid {
    return this._categoryId;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | undefined {
    return this._description;
  }
  get type(): GoalType {
    return this._type;
  }
  get cyclePeriod(): CyclePeriod | undefined {
    return this._cyclePeriod;
  }
  get customCycleDays(): number | undefined {
    return this._customCycleDays;
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
