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
           COUNT(*) FILTER (WHERE g."deletedAt" IS NULL) AS total,
           COUNT(*) FILTER (WHERE g."deletedAt" IS NULL AND EXISTS (
             SELECT 1 FROM goal_instances gi
             WHERE gi."goalId" = g.id AND gi.status = 'COMPLETED' AND gi."deletedAt" IS NULL
           )) AS completed,
           COUNT(*) FILTER (WHERE g."deletedAt" IS NULL AND EXISTS (
             SELECT 1 FROM goal_instances gi
             WHERE gi."goalId" = g.id AND gi.status = 'IN_PROGRESS' AND gi."deletedAt" IS NULL
           )) AS "inProgress"
         FROM goals g
         WHERE g."userId" = $1`,
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
         LEFT JOIN goals g ON g."categoryId" = c.id AND g."deletedAt" IS NULL
         LEFT JOIN goal_instances gi ON gi."goalId" = g.id AND gi.status = 'IN_PROGRESS' AND gi."deletedAt" IS NULL
         WHERE c."userId" = $1 AND c."deletedAt" IS NULL
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
         DATE_TRUNC($1, gi."updatedAt") AS date,
         AVG(gi.progress) AS "avgProgress",
         COUNT(*) FILTER (WHERE gi.status = 'COMPLETED') AS "completedCount"
       FROM goal_instances gi
       JOIN goals g ON g.id = gi."goalId"
       WHERE g."userId" = $2
         AND gi."updatedAt" >= NOW() - $3::interval
         AND gi."deletedAt" IS NULL
       GROUP BY DATE_TRUNC($1, gi."updatedAt")
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
        `SELECT g.id, g.name,
                MIN(s."startDate") AS "startDate",
                MAX(s."endDate") AS "endDate"
         FROM goals g
         JOIN goal_instances gi ON gi."goalId" = g.id
           AND gi.status = 'IN_PROGRESS'
           AND gi."deletedAt" IS NULL
         JOIN steps s ON s."goalInstanceId" = gi.id
           AND s."deletedAt" IS NULL
         WHERE g."userId" = $1
           AND g."deletedAt" IS NULL
         GROUP BY g.id, g.name
         HAVING (
           (MIN(s."startDate") >= $2 AND MIN(s."startDate") <= $3)
           OR (MAX(s."endDate") >= $2 AND MAX(s."endDate") <= $3)
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
        `SELECT s.id, s.title, s."startDate", s."endDate"
         FROM steps s
         JOIN goal_instances gi ON gi.id = s."goalInstanceId"
           AND gi.status = 'IN_PROGRESS'
           AND gi."deletedAt" IS NULL
         JOIN goals g ON g.id = gi."goalId"
         WHERE g."userId" = $1
           AND s."deletedAt" IS NULL
           AND (
             (s."startDate" >= $2 AND s."startDate" <= $3)
             OR (s."endDate" >= $2 AND s."endDate" <= $3)
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
        `SELECT g.id, g.name, MAX(s."endDate") AS "endDate", COALESCE(gi.progress, 0) AS progress
         FROM goals g
         JOIN goal_instances gi ON gi."goalId" = g.id
           AND gi.status = 'IN_PROGRESS'
           AND gi."deletedAt" IS NULL
         JOIN steps s ON s."goalInstanceId" = gi.id
           AND s."deletedAt" IS NULL
           AND s."endDate" IS NOT NULL
         WHERE g."userId" = $1
           AND g."deletedAt" IS NULL
         GROUP BY g.id, g.name, gi.progress
         HAVING MAX(s."endDate") >= $2
         ORDER BY MAX(s."endDate") ASC
         LIMIT $3`,
        [userId, now, limit],
      ),
      this.dataSource.query<{ id: string; title: string; endDate: Date }[]>(
        `SELECT s.id, s.title, s."endDate"
         FROM steps s
         JOIN goal_instances gi ON gi.id = s."goalInstanceId"
           AND gi.status = 'IN_PROGRESS'
           AND gi."deletedAt" IS NULL
         JOIN goals g ON g.id = gi."goalId"
         WHERE g."userId" = $1
           AND s."deletedAt" IS NULL
           AND s."endDate" >= $2
         ORDER BY s."endDate" ASC
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
      `SELECT gi."cycleEnd", gi.status
       FROM goal_instances gi
       JOIN goals g ON g.id = gi."goalId"
       WHERE g."userId" = $1
         AND g.type = 'CYCLIC'
         AND gi."deletedAt" IS NULL
       ORDER BY gi."cycleEnd" DESC`,
      [userId],
    );
    return rows;
  }
}
