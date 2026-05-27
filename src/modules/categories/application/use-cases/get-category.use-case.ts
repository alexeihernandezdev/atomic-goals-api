import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: { id: string; userId: string }): Promise<Category> {
    const category = await this.categoryRepo.findById(
      Uuid.from(command.id),
      Uuid.from(command.userId),
    );
    if (!category) throw new NotFoundError('Category', command.id);
    return category;
  }
}
