interface InstanceRecord {
  cycleEnd: Date;
  status: string;
}

export class StreakCalculator {
  static calculate(instances: InstanceRecord[]): number {
    if (instances.length === 0) return 0;
    const sorted = [...instances].sort(
      (a, b) => b.cycleEnd.getTime() - a.cycleEnd.getTime(),
    );
    let streak = 0;
    for (const instance of sorted) {
      if (instance.status === 'COMPLETED') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
