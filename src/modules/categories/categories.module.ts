import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { ListUserCategoriesUseCase } from './application/use-cases/list-user-categories.use-case';
import { RestoreCategoryUseCase } from './application/use-cases/restore-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { CATEGORY_TOKENS } from './infrastructure/category.tokens';
import { CategoryOrmEntity } from './infrastructure/persistence/category.typeorm-entity';
import { CategoryTypeOrmRepository } from './infrastructure/persistence/category.typeorm.repository';
import { CategoriesController } from './presentation/categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoriesController],
  providers: [
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    RestoreCategoryUseCase,
    ListUserCategoriesUseCase,
    GetCategoryUseCase,
    {
      provide: CATEGORY_TOKENS.CATEGORY_REPOSITORY,
      useClass: CategoryTypeOrmRepository,
    },
  ],
})
export class CategoriesModule {}
