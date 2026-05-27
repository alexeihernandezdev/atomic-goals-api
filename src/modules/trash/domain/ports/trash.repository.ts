import type { TrashEntityType } from '../enums/trash-entity-type.enum';

export interface TrashItem {
  entity: TrashEntityType;
  id: string;
  name: string;
  deletedAt: Date;
}

export interface ITrashRepository {
  findAllDeletedByUser(userId: string): Promise<TrashItem[]>;
  findDeletedById(
    entity: TrashEntityType,
    id: string,
    userId: string,
  ): Promise<TrashItem | null>;
  restore(entity: TrashEntityType, id: string, userId: string): Promise<void>;
  hardDelete(
    entity: TrashEntityType,
    id: string,
    userId: string,
  ): Promise<void>;
}
