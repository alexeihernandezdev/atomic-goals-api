import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepType } from '../enums/step-type.enum';
import { InvalidStepConfigError } from '../errors/invalid-step-config.error';
import { WeightMustBePositiveError } from '../errors/weight-must-be-positive.error';
import { Step } from './step.entity';

interface CreateCheckStepProps {
  goalInstanceId: Uuid;
  title: string;
  description?: string;
  weight?: number;
  order: number;
  done?: boolean;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

interface ReconstituteCheckStepProps extends CreateCheckStepProps {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CheckStep extends Step {
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
    private _done: boolean,
  ) {
    super(
      _id,
      _goalInstanceId,
      StepType.CHECK,
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

  static create(props: CreateCheckStepProps): CheckStep {
    if (!props.title.trim())
      throw new InvalidStepConfigError('Step title cannot be empty');
    const weight = props.weight ?? 1;
    if (weight <= 0) throw new WeightMustBePositiveError();
    const now = new Date();
    return new CheckStep(
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
      props.done ?? false,
    );
  }

  static reconstitute(props: ReconstituteCheckStepProps): CheckStep {
    return new CheckStep(
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
      props.done ?? false,
    );
  }

  progress(): number {
    return this._done ? 100 : 0;
  }

  setDone(done: boolean): void {
    this._done = done;
    this._updatedAt = new Date();
  }

  get done(): boolean {
    return this._done;
  }
}
