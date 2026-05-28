import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepType } from '../enums/step-type.enum';
import { InvalidStepConfigError } from '../errors/invalid-step-config.error';
import { WeightMustBePositiveError } from '../errors/weight-must-be-positive.error';
import { Step } from './step.entity';

interface CreateProgressBarStepProps {
  goalInstanceId: Uuid;
  title: string;
  description?: string;
  weight?: number;
  order: number;
  target: number;
  current?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

interface ReconstituteProgressBarStepProps extends CreateProgressBarStepProps {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ProgressBarStep extends Step {
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
    private _target: number,
    private _unit: string | undefined,
  ) {
    super(
      _id,
      _goalInstanceId,
      StepType.PROGRESS_BAR,
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

  static create(props: CreateProgressBarStepProps): ProgressBarStep {
    if (!props.title.trim())
      throw new InvalidStepConfigError('Step title cannot be empty');
    if (props.target <= 0)
      throw new InvalidStepConfigError('Target must be greater than 0');
    const weight = props.weight ?? 1;
    if (weight <= 0) throw new WeightMustBePositiveError();
    const now = new Date();
    return new ProgressBarStep(
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
      props.current ?? 0,
      props.target,
      props.unit,
    );
  }

  static reconstitute(
    props: ReconstituteProgressBarStepProps,
  ): ProgressBarStep {
    return new ProgressBarStep(
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
      props.current ?? 0,
      props.target,
      props.unit,
    );
  }

  progress(): number {
    if (this._target === 0) return 0;
    return Math.min(100, Math.max(0, (this._current / this._target) * 100));
  }

  updateProgress(current: number): void {
    if (current < 0)
      throw new InvalidStepConfigError('Current cannot be negative');
    this._current = current;
    this._updatedAt = new Date();
  }

  get current(): number {
    return this._current;
  }
  get target(): number {
    return this._target;
  }
  get unit(): string | undefined {
    return this._unit;
  }
}
