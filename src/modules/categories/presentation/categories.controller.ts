import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from '../application/use-cases/get-category.use-case';
import { ListUserCategoriesUseCase } from '../application/use-cases/list-user-categories.use-case';
import { RestoreCategoryUseCase } from '../application/use-cases/restore-category.use-case';
import { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case';
import type { Category } from '../domain/entities/category.entity';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function toCategoryResponse(cat: Category) {
  return {
    id: cat.id.value,
    userId: cat.userId.value,
    name: cat.name,
    description: cat.description,
    color: cat.color,
    icon: cat.icon,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
    deletedAt: cat.deletedAt,
  };
}

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly restoreCategoryUseCase: RestoreCategoryUseCase,
    private readonly listUserCategoriesUseCase: ListUserCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a category' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const category = await this.createCategoryUseCase.execute({
      userId: user.userId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
    });
    return toCategoryResponse(category);
  }

  @Get()
  @ApiOperation({ summary: 'List categories for the authenticated user' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const categories = await this.listUserCategoriesUseCase.execute({
      userId: user.userId,
      includeDeleted: includeDeleted === 'true',
    });
    return categories.map(toCategoryResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const category = await this.getCategoryUseCase.execute({
      id,
      userId: user.userId,
    });
    return toCategoryResponse(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const category = await this.updateCategoryUseCase.execute({
      id,
      userId: user.userId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
    });
    return toCategoryResponse(category);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a category' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.deleteCategoryUseCase.execute({ id, userId: user.userId });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted category' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const category = await this.restoreCategoryUseCase.execute({
      id,
      userId: user.userId,
    });
    return toCategoryResponse(category);
  }
}
