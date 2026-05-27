import { Injectable } from '@nestjs/common';
import type { IClock } from '../../domain/ports/clock';

@Injectable()
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
