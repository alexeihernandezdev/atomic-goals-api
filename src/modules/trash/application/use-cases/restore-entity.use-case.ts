import { Inject, Injectable } from '@nestjs/common';
import type { ITrashRepository } from '../../domain/ports/trash.repository';
import type { TrashEntityType } from '../../domain/enums/trash-entity-type.enum';
import { TrashEntityNotFoundError } from '../../domain/errors/trash-entity-not-found.error';
import { TRASH_TOKENS } from '../../infrastructure/trash.tokens';

@Injectable()
export class RestoreEntityUseCase {
  constructor(
    @Inject(TRASH_TOKENS.TRASH_REPOSITORY)
    private readonly repo: ITrashRepository,
  ) {}

  async execute(command: {
    entity: TrashEntityType;
    id: string;
    userId: string;
  }): Promise<void> {
    const item = await this.repo.findDeletedById(
      command.entity,
      command.id,
      command.userId,
    );
    if (!item) throw new TrashEntityNotFoundError(command.entity, command.id);
    await this.repo.restore(command.entity, command.id, command.userId);
  }
}
