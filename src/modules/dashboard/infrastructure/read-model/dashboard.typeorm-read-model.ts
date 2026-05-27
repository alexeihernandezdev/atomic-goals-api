import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  IDashboardReadModel,
  DashboardSummaryData,
  TimelinePoint,
  CalendarEvent,
  UpcomingItem,
  CyclicInstanceRecord,
} from '../../application/ports/dashboard-read-model';

@Injectable()
export class DashboardTypeOrmReadModel implements IDashboardReadModel {
  constructor(private readonly dataSource: DataSource) {}

  async getSummaryData(userId: string): Promise<DashboardSummaryData> {
    const [goalStats, categoryStats] = await Promise.all([
      this.dataSource.query<
        { total: string; completed: string; inProgress: string }[]
      >(
        `SELECT
           COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total,
           COUNT(*) FILTER (WHERE deleted_at IS NULL AND EXISTS (
             SELECT 1 FROM goal_instances gi
             WHERE gi.goal_id = g.id AND gi.status = 'COMPLETED' AND gi.deleted_at IS NULL
           )) AS completed,
           COUNT(*) FILTER (WHERE deleted_at IS NULL AND EXISTS (
             SELECT 1 FROM goal_instances gi
             WHERE gi.goal_id = g.id AND gi.status = 'IN_PROGRESS' AND gi.deleted_at IS NULL
           )) AS "inProgress"
         FROM goals g
         WHERE g.user_id = $1`,
        [userId],
      ),
      this.dataSource.query<
        {
          categoryId: string;
          categoryName: string;
          goalCount: string;
          avgProgress: string;
        }[]
      >(
        `SELECT
           c.id AS "categoryId",
           c.name AS "categoryName",
           COUNT(g.id) AS "goalCount",
           COALESCE(AVG(gi.progress), 0) AS "avgProgress"
         FROM categories c
         LEFT JOIN goals g ON g.category_id = c.id AND g.deleted_at IS NULL
         LEFT JOIN goal_instances gi ON gi.goal_id = g.id AND gi.status = 'IN_PROGRESS' AND gi.deleted_at IS NULL
         WHERE c.user_id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id, c.name
         ORDER BY c.name`,
        [userId],
      ),
    ]);

    const stats = goalStats[0] ?? {
      total: '0',
      completed: '0',
      inProgress: '0',
    };

    return {
      totalGoals: parseInt(stats.total, 10),
      completedGoals: parseInt(stats.completed, 10),
      inProgressGoals: parseInt(stats.inProgress, 10),
      byCategory: categoryStats.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        goalCount: parseInt(row.goalCount, 10),
        avgProgress: parseFloat(row.avgProgress),
      })),
    };
  }

  async getTimeline(
    userId: string,
    range: 'week' | 'month' | 'year',
  ): Promise<TimelinePoint[]> {
    const truncUnit =
      range === 'week' ? 'day' : range === 'month' ? 'day' : 'week';
    const interval =
      range === 'week' ? '7 days' : range === 'month' ? '30 days' : '365 days';

    const rows = await this.dataSource.query<
      { date: string; avgProgress: string; completedCount: string }[]
    >(
      `SELECT
         DATE_TRUNC($1, gi.updated_at) AS date,
         AVG(gi.progress) AS "avgProgress",
         COUNT(*) FILTER (WHERE gi.status = 'COMPLETED') AS "completedCount"
       FROM goal_instances gi
       JOIN goals g ON g.id = gi.goal_id
       WHERE g.user_id = $2
         AND gi.updated_at >= NOW() - $3::interval
         AND gi.deleted_at IS NULL
       GROUP BY DATE_TRUNC($1, gi.updated_at)
       ORDER BY date ASC`,
      [truncUnit, userId, interval],
    );

    return rows.map((row) => ({
      date: row.date,
      avgProgress: parseFloat(row.avgProgress),
      completedCount: parseInt(row.completedCount, 10),
    }));
  }

  async getCalendarEvents(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarEvent[]> {
    const [goalRows, stepRows] = await Promise.all([
      this.dataSource.query<
        {
          id: string;
          name: string;
          startDate: Date | null;
          endDate: Date | null;
        }[]
      >(
        `SELECT g.id, g.name, g.start_date AS "startDate", g.end_date AS "endDate"
         FROM goals g
         WHERE g.user_id = $1
           AND g.deleted_at IS NULL
           AND (
             (g.start_date >= $2 AND g.start_date <= $3)
             OR (g.end_date >= $2 AND g.end_date <= $3)
           )`,
        [userId, from, to],
      ),
      this.dataSource.query<
        {
          id: string;
          title: string;
          startDate: Date | null;
          endDate: Date | null;
        }[]
      >(
        `SELECT s.id, s.title, s.start_date AS "startDate", s.end_date AS "endDate"
         FROM steps s
         JOIN goal_instances gi ON gi.id = s.goal_instance_id
         JOIN goals g ON g.id = gi.goal_id
         WHERE g.user_id = $1
           AND s.deleted_at IS NULL
           AND gi.deleted_at IS NULL
           AND (
             (s.start_date >= $2 AND s.start_date <= $3)
             OR (s.end_date >= $2 AND s.end_date <= $3)
           )`,
        [userId, from, to],
      ),
    ]);

    const events: CalendarEvent[] = [];

    for (const row of goalRows) {
      if (row.startDate) {
        events.push({
          entityType: 'goal',
          entityId: row.id,
          title: row.name,
          date: row.startDate,
          eventType: 'start',
        });
      }
      if (row.endDate) {
        events.push({
          entityType: 'goal',
          entityId: row.id,
          title: row.name,
          date: row.endDate,
          eventType: 'end',
        });
      }
    }

    for (const row of stepRows) {
      if (row.startDate) {
        events.push({
          entityType: 'step',
          entityId: row.id,
          title: row.title,
          date: row.startDate,
          eventType: 'start',
        });
      }
      if (row.endDate) {
        events.push({
          entityType: 'step',
          entityId: row.id,
          title: row.title,
          date: row.endDate,
          eventType: 'end',
        });
      }
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getUpcoming(userId: string, limit: number): Promise<UpcomingItem[]> {
    const now = new Date();

    const [goalRows, stepRows] = await Promise.all([
      this.dataSource.query<
        { id: string; name: string; endDate: Date; progress: string }[]
      >(
        `SELECT g.id, g.name, g.end_date AS "endDate", COALESCE(gi.progress, 0) AS progress
         FROM goals g
         LEFT JOIN goal_instances gi ON gi.goal_id = g.id AND gi.status = 'IN_PROGRESS' AND gi.deleted_at IS NULL
         WHERE g.user_id = $1
           AND g.deleted_at IS NULL
           AND g.end_date >= $2
         ORDER BY g.end_date ASC
         LIMIT $3`,
        [userId, now, limit],
      ),
      this.dataSource.query<{ id: string; title: string; endDate: Date }[]>(
        `SELECT s.id, s.title, s.end_date AS "endDate"
         FROM steps s
         JOIN goal_instances gi ON gi.id = s.goal_instance_id
         JOIN goals g ON g.id = gi.goal_id
         WHERE g.user_id = $1
           AND s.deleted_at IS NULL
           AND gi.deleted_at IS NULL
           AND s.end_date >= $2
         ORDER BY s.end_date ASC
         LIMIT $3`,
        [userId, now, limit],
      ),
    ]);

    const items: UpcomingItem[] = [
      ...goalRows.map((row) => ({
        entityType: 'goal' as const,
        entityId: row.id,
        title: row.name,
        endDate: row.endDate,
        progress: parseFloat(String(row.progress)),
      })),
      ...stepRows.map((row) => ({
        entityType: 'step' as const,
        entityId: row.id,
        title: row.title,
        endDate: row.endDate,
        progress: 0,
      })),
    ];

    return items
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      .slice(0, limit);
  }

  async getCompletedCyclicInstances(
    userId: string,
  ): Promise<CyclicInstanceRecord[]> {
    const rows = await this.dataSource.query<
      { cycleEnd: Date; status: string }[]
    >(
      `SELECT gi.cycle_end AS "cycleEnd", gi.status
       FROM goal_instances gi
       JOIN goals g ON g.id = gi.goal_id
       WHERE g.user_id = $1
         AND g.type = 'CYCLIC'
         AND gi.deleted_at IS NULL
       ORDER BY gi.cycle_end DESC`,
      [userId],
    );
    return rows;
  }
}
