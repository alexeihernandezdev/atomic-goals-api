export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  goalCount: number;
  avgProgress: number;
}

export interface DashboardSummaryData {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  byCategory: CategoryStat[];
}

export interface TimelinePoint {
  date: string;
  avgProgress: number;
  completedCount: number;
}

export interface CalendarEvent {
  entityType: 'goal' | 'step';
  entityId: string;
  title: string;
  date: Date;
  eventType: 'start' | 'end';
}

export interface UpcomingItem {
  entityType: 'goal' | 'step';
  entityId: string;
  title: string;
  endDate: Date;
  progress: number;
}

export interface CyclicInstanceRecord {
  cycleEnd: Date;
  status: string;
}

export interface IDashboardReadModel {
  getSummaryData(userId: string): Promise<DashboardSummaryData>;
  getTimeline(
    userId: string,
    range: 'week' | 'month' | 'year',
  ): Promise<TimelinePoint[]>;
  getCalendarEvents(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarEvent[]>;
  getUpcoming(userId: string, limit: number): Promise<UpcomingItem[]>;
  getCompletedCyclicInstances(userId: string): Promise<CyclicInstanceRecord[]>;
}
