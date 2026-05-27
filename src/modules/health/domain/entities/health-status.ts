export class HealthStatus {
  readonly status: 'ok' | 'error';
  readonly timestamp: Date;
  readonly uptime: number;

  private constructor(status: 'ok' | 'error', timestamp: Date, uptime: number) {
    this.status = status;
    this.timestamp = timestamp;
    this.uptime = uptime;
  }

  static ok(): HealthStatus {
    return new HealthStatus('ok', new Date(), process.uptime());
  }
}
