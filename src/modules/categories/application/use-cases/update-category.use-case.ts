import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { CategoryNameAlreadyExistsError } from '../../domain/errors/category-name-already-exists.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';
import type { UpdateCategoryCommand } from '../commands/update-category.command';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    const id = Uuid.from(command.id);
    const userId = Uuid.from(command.userId);

    const category = await this.categoryRepo.findById(id, userId);
    if (!category) throw new NotFoundError('Category', command.id);

    if (command.name !== undefined && command.name !== category.name) {
      const conflict = await this.categoryRepo.findByName(command.name, userId);
      if (conflict && !conflict.id.equals(id)) {
        throw new CategoryNameAlreadyExistsError(command.name);
      }
    }

    category.update(
      command.name,
      command.description,
      command.color,
      command.icon,
    );

    await this.categoryRepo.save(category);
    return category;
  }
}
