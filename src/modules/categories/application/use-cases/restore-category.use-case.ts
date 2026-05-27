import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { CategoryNameAlreadyExistsError } from '../../domain/errors/category-name-already-exists.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';

@Injectable()
export class RestoreCategoryUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: { id: string; userId: string }): Promise<Category> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const category = await this.categoryRepo.findByIdWithDeleted(id, userId);
    if (!category) throw new NotFoundError('Category', command.id);

    const conflict = await this.categoryRepo.findByName(category.name, userId);
    if (conflict) throw new CategoryNameAlreadyExistsError(category.name);

    category.restore();
    await this.categoryRepo.save(category);
    return category;
  }
}
