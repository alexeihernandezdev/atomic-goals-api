import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  ITrashRepository,
  TrashItem,
} from '../../domain/ports/trash.repository';
import { TrashEntityType } from '../../domain/enums/trash-entity-type.enum';

@Injectable()
export class TrashTypeOrmRepository implements ITrashRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllDeletedByUser(userId: string): Promise<TrashItem[]> {
    const [categories, goals, steps] = await Promise.all([
      this.dataSource.query<{ id: string; name: string; deleted_at: Date }[]>(
        `SELECT id, name, deleted_at
         FROM categories
         WHERE user_id = $1 AND deleted_at IS NOT NULL`,
        [userId],
      ),
      this.dataSource.query<{ id: string; name: string; deleted_at: Date }[]>(
        `SELECT id, name, deleted_at
         FROM goals
         WHERE user_id = $1 AND deleted_at IS NOT NULL`,
        [userId],
      ),
      this.dataSource.query<{ id: string; title: string; deleted_at: Date }[]>(
        `SELECT s.id, s.title, s.deleted_at
         FROM steps s
         JOIN goal_instances gi ON gi.id = s.goal_instance_id
         JOIN goals g ON g.id = gi.goal_id
         WHERE g.user_id = $1 AND s.deleted_at IS NOT NULL`,
        [userId],
      ),
    ]);

    const items: TrashItem[] = [
      ...categories.map((r) => ({
        entity: TrashEntityType.CATEGORY,
        id: r.id,
        name: r.name,
        deletedAt: r.deleted_at,
      })),
      ...goals.map((r) => ({
        entity: TrashEntityType.GOAL,
        id: r.id,
        name: r.name,
        deletedAt: r.deleted_at,
      })),
      ...steps.map((r) => ({
        entity: TrashEntityType.STEP,
        id: r.id,
        name: r.title,
        deletedAt: r.deleted_at,
      })),
    ];

    return items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  }

  async findDeletedById(
    entity: TrashEntityType,
    id: string,
    userId: string,
  ): Promise<TrashItem | null> {
    let rows: { id: string; name: string; deleted_at: Date }[];

    if (entity === TrashEntityType.CATEGORY) {
      rows = await this.dataSource.query(
        `SELECT id, name, deleted_at
         FROM categories
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else if (entity === TrashEntityType.GOAL) {
      rows = await this.dataSource.query(
        `SELECT id, name, deleted_at
         FROM goals
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else {
      const stepRows = await this.dataSource.query<
        { id: string; title: string; deleted_at: Date }[]
      >(
        `SELECT s.id, s.title, s.deleted_at
         FROM steps s
         JOIN goal_instances gi ON gi.id = s.goal_instance_id
         JOIN goals g ON g.id = gi.goal_id
         WHERE s.id = $1 AND g.user_id = $2 AND s.deleted_at IS NOT NULL`,
        [id, userId],
      );
      if (stepRows.length === 0) return null;
      const r = stepRows[0];
      return {
        entity: TrashEntityType.STEP,
        id: r.id,
        name: r.title,
        deletedAt: r.deleted_at,
      };
    }

    if (rows.length === 0) return null;
    const r = rows[0];
    return { entity, id: r.id, name: r.name, deletedAt: r.deleted_at };
  }

  async restore(
    entity: TrashEntityType,
    id: string,
    userId: string,
  ): Promise<void> {
    if (entity === TrashEntityType.CATEGORY) {
      await this.dataSource.query(
        `UPDATE categories SET deleted_at = NULL
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else if (entity === TrashEntityType.GOAL) {
      await this.dataSource.query(
        `UPDATE goals SET deleted_at = NULL
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else {
      await this.dataSource.query(
        `UPDATE steps SET deleted_at = NULL
         WHERE id = $1 AND deleted_at IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM goal_instances gi
             JOIN goals g ON g.id = gi.goal_id
             WHERE gi.id = steps.goal_instance_id AND g.user_id = $2
           )`,
        [id, userId],
      );
    }
  }

  async hardDelete(
    entity: TrashEntityType,
    id: string,
    userId: string,
  ): Promise<void> {
    if (entity === TrashEntityType.CATEGORY) {
      await this.dataSource.query(
        `DELETE FROM categories
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else if (entity === TrashEntityType.GOAL) {
      await this.dataSource.query(
        `DELETE FROM goals
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL`,
        [id, userId],
      );
    } else {
      await this.dataSource.query(
        `DELETE FROM steps
         WHERE id = $1 AND deleted_at IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM goal_instances gi
             JOIN goals g ON g.id = gi.goal_id
             WHERE gi.id = steps.goal_instance_id AND g.user_id = $2
           )`,
        [id, userId],
      );
    }
  }
}
