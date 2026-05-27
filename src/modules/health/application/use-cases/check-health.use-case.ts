import { Injectable } from '@nestjs/common';
import { HealthStatus } from '../../domain/entities/health-status';

@Injectable()
export class CheckHealthUseCase {
  execute(): HealthStatus {
    return HealthStatus.ok();
  }
}
