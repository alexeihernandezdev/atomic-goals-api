import { Module } from '@nestjs/common';
import { ListTrashUseCase } from './application/use-cases/list-trash.use-case';
import { RestoreEntityUseCase } from './application/use-cases/restore-entity.use-case';
import { PermanentlyDeleteEntityUseCase } from './application/use-cases/permanently-delete-entity.use-case';
import { TRASH_TOKENS } from './infrastructure/trash.tokens';
import { TrashTypeOrmRepository } from './infrastructure/persistence/trash.typeorm.repository';
import { TrashController } from './presentation/trash.controller';

@Module({
  controllers: [TrashController],
  providers: [
    ListTrashUseCase,
    RestoreEntityUseCase,
    PermanentlyDeleteEntityUseCase,
    {
      provide: TRASH_TOKENS.TRASH_REPOSITORY,
      useClass: TrashTypeOrmRepository,
    },
  ],
})
export class TrashModule {}
