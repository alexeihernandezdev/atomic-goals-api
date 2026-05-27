import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';

@Injectable()
export class ListUserCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: {
    userId: string;
    includeDeleted?: boolean;
  }): Promise<Category[]> {
    return this.categoryRepo.findAllByUser(
      Uuid.from(command.userId),
      command.includeDeleted ?? false,
    );
  }
}
