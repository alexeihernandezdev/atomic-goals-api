import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: { id: string; userId: string }): Promise<void> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const category = await this.categoryRepo.findById(id, userId);
    if (!category) throw new NotFoundError('Category', command.id);

    category.softDelete();
    await this.categoryRepo.save(category);
  }
}
