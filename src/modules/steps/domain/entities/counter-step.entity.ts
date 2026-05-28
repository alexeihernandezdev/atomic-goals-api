import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepType } from '../enums/step-type.enum';
import { InvalidStepConfigError } from '../errors/invalid-step-config.error';
import { WeightMustBePositiveError } from '../errors/weight-must-be-positive.error';
import { Step } from './step.entity';

interface CreateCounterStepProps {
  goalInstanceId: Uuid;
  title: string;
  description?: string;
  weight?: number;
  order: number;
  max: number;
  min?: number;
  current?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

interface ReconstituteCounterStepProps extends CreateCounterStepProps {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CounterStep extends Step {
  private constructor(
    _id: Uuid,
    _goalInstanceId: Uuid,
    _title: string,
    _description: string | undefined,
    _weight: number,
    _order: number,
    _startDate: Date | undefined,
    _endDate: Date | undefined,
    _estimatedDurationMinutes: number | undefined,
    _createdAt: Date,
    _updatedAt: Date,
    _deletedAt: Date | undefined,
    private _current: number,
    private _max: number,
    private _min: number,
    private _unit: string | undefined,
  ) {
    super(
      _id,
      _goalInstanceId,
      StepType.COUNTER,
      _title,
      _description,
      _weight,
      _order,
      _startDate,
      _endDate,
      _estimatedDurationMinutes,
      _createdAt,
      _updatedAt,
      _deletedAt,
    );
  }

  static create(props: CreateCounterStepProps): CounterStep {
    if (!props.title.trim())
      throw new InvalidStepConfigError('Step title cannot be empty');
    const weight = props.weight ?? 1;
    if (weight <= 0) throw new WeightMustBePositiveError();
    const min = props.min ?? 0;
    if (props.max <= min)
      throw new InvalidStepConfigError('max must be greater than min');
    const current = props.current ?? min;
    const now = new Date();
    return new CounterStep(
      Uuid.generate(),
      props.goalInstanceId,
      props.title.trim(),
      props.description,
      weight,
      props.order,
      props.startDate,
      props.endDate,
      props.estimatedDurationMinutes,
      now,
      now,
      undefined,
      current,
      props.max,
      min,
      props.unit,
    );
  }

  static reconstitute(props: ReconstituteCounterStepProps): CounterStep {
    const min = props.min ?? 0;
    return new CounterStep(
      props.id,
      props.goalInstanceId,
      props.title,
      props.description,
      props.weight ?? 1,
      props.order,
      props.startDate,
      props.endDate,
      props.estimatedDurationMinutes,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
      props.current ?? min,
      props.max,
      min,
      props.unit,
    );
  }

  progress(): number {
    const range = this._max - this._min;
    if (range === 0) return 0;
    return Math.min(
      100,
      Math.max(0, ((this._current - this._min) / range) * 100),
    );
  }

  updateCurrent(current: number): void {
    if (current < this._min)
      throw new InvalidStepConfigError('Current cannot be less than min');
    if (current > this._max)
      throw new InvalidStepConfigError('Current cannot exceed max');
    this._current = current;
    this._updatedAt = new Date();
  }

  get current(): number {
    return this._current;
  }
  get max(): number {
    return this._max;
  }
  get min(): number {
    return this._min;
  }
  get unit(): string | undefined {
    return this._unit;
  }
}
