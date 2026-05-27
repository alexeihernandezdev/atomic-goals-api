import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { StepType } from '../enums/step-type.enum';
import { InvalidStepConfigError } from '../errors/invalid-step-config.error';
import { WeightMustBePositiveError } from '../errors/weight-must-be-positive.error';
import type { StatusOption } from '../value-objects/status-option.vo';
import { Step } from './step.entity';

interface CreateStatusStepProps {
  goalInstanceId: Uuid;
  title: string;
  description?: string;
  weight?: number;
  order: number;
  statuses: StatusOption[];
  currentStatusId: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDurationMinutes?: number;
}

interface ReconstituteStatusStepProps extends CreateStatusStepProps {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class StatusStep extends Step {
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
    private _statuses: StatusOption[],
    private _currentStatusId: string,
  ) {
    super(
      _id,
      _goalInstanceId,
      StepType.STATUS,
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

  private static validate(
    statuses: StatusOption[],
    currentStatusId: string,
  ): void {
    if (statuses.length === 0)
      throw new InvalidStepConfigError(
        'Status step must have at least one status',
      );
    const exists = statuses.some((s) => s.id === currentStatusId);
    if (!exists)
      throw new InvalidStepConfigError(
        `Status "${currentStatusId}" not found in statuses`,
      );
    for (const s of statuses) {
      if (s.percentage < 0 || s.percentage > 100) {
        throw new InvalidStepConfigError(
          'Status percentage must be between 0 and 100',
        );
      }
    }
  }

  static create(props: CreateStatusStepProps): StatusStep {
    if (!props.title.trim())
      throw new InvalidStepConfigError('Step title cannot be empty');
    const weight = props.weight ?? 1;
    if (weight <= 0) throw new WeightMustBePositiveError();
    StatusStep.validate(props.statuses, props.currentStatusId);
    const now = new Date();
    return new StatusStep(
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
      props.statuses,
      props.currentStatusId,
    );
  }

  static reconstitute(props: ReconstituteStatusStepProps): StatusStep {
    return new StatusStep(
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
      props.statuses,
      props.currentStatusId,
    );
  }

  progress(): number {
    const current = this._statuses.find((s) => s.id === this._currentStatusId);
    return current?.percentage ?? 0;
  }

  setCurrentStatus(statusId: string): void {
    const exists = this._statuses.some((s) => s.id === statusId);
    if (!exists)
      throw new InvalidStepConfigError(`Status "${statusId}" not found`);
    this._currentStatusId = statusId;
    this._updatedAt = new Date();
  }

  get statuses(): StatusOption[] {
    return this._statuses;
  }
  get currentStatusId(): string {
    return this._currentStatusId;
  }
}
