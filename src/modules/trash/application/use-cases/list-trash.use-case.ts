import { Inject, Injectable } from '@nestjs/common';
import type {
  ITrashRepository,
  TrashItem,
} from '../../domain/ports/trash.repository';
import { TRASH_TOKENS } from '../../infrastructure/trash.tokens';

@Injectable()
export class ListTrashUseCase {
  constructor(
    @Inject(TRASH_TOKENS.TRASH_REPOSITORY)
    private readonly repo: ITrashRepository,
  ) {}

  async execute(query: { userId: string }): Promise<TrashItem[]> {
    return this.repo.findAllDeletedByUser(query.userId);
  }
}
