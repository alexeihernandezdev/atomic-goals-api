import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/ports/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { CategoryNameAlreadyExistsError } from '../../domain/errors/category-name-already-exists.error';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CATEGORY_TOKENS } from '../../infrastructure/category.tokens';
import type { CreateCategoryCommand } from '../commands/create-category.command';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const userId = Uuid.from(command.userId);

    const existing = await this.categoryRepo.findByName(command.name, userId);
    if (existing) throw new CategoryNameAlreadyExistsError(command.name);

    const category = Category.create({
      userId,
      name: command.name,
      description: command.description,
      color: command.color,
      icon: command.icon,
    });

    await this.categoryRepo.save(category);
    return category;
  }
}
