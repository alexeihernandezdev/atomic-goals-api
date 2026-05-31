import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepType } from '../enums/step-type.enum';
import { InvalidStepConfigError } from '../errors/invalid-step-config.error';
import { WeightMustBePositiveError } from '../errors/weight-must-be-positive.error';

export interface UpdateStepMetadataProps {
  title?: string;
  description?: string;
  weight?: number;
  order?: number;
  startDate?: Date;
  endDate?: Date;
  cycleDay?: string;
  estimatedDurationMinutes?: number;
}

export abstract class Step {
  protected constructor(
    protected readonly _id: Uuid,
    protected readonly _goalInstanceId: Uuid,
    protected readonly _type: StepType,
    protected _title: string,
    protected _description: string | undefined,
    protected _weight: number,
    protected _order: number,
    protected _startDate: Date | undefined,
    protected _endDate: Date | undefined,
    protected _estimatedDurationMinutes: number | undefined,
    protected _cycleDay: string | undefined,
    protected readonly _createdAt: Date,
    protected _updatedAt: Date,
    protected _deletedAt: Date | undefined,
  ) {}

  abstract progress(): number;

  updateMetadata(props: UpdateStepMetadataProps): void {
    if (props.title !== undefined) {
      if (!props.title.trim())
        throw new InvalidStepConfigError('Step title cannot be empty');
      this._title = props.title.trim();
    }
    if (props.description !== undefined) this._description = props.description;
    if (props.weight !== undefined) {
      if (props.weight <= 0) throw new WeightMustBePositiveError();
      this._weight = props.weight;
    }
    if (props.order !== undefined) this._order = props.order;
    if (props.startDate !== undefined) this._startDate = props.startDate;
    if (props.endDate !== undefined) this._endDate = props.endDate;
    if (props.estimatedDurationMinutes !== undefined) {
      this._estimatedDurationMinutes = props.estimatedDurationMinutes;
    }
    if (props.cycleDay !== undefined) this._cycleDay = props.cycleDay || undefined;
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

  get id(): Uuid {
    return this._id;
  }
  get goalInstanceId(): Uuid {
    return this._goalInstanceId;
  }
  get type(): StepType {
    return this._type;
  }
  get title(): string {
    return this._title;
  }
  get description(): string | undefined {
    return this._description;
  }
  get weight(): number {
    return this._weight;
  }
  get order(): number {
    return this._order;
  }
  get startDate(): Date | undefined {
    return this._startDate;
  }
  get endDate(): Date | undefined {
    return this._endDate;
  }
  get estimatedDurationMinutes(): number | undefined {
    return this._estimatedDurationMinutes;
  }
  get cycleDay(): string | undefined {
    return this._cycleDay;
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
