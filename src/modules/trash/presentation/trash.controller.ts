import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { ListTrashUseCase } from '../application/use-cases/list-trash.use-case';
import { RestoreEntityUseCase } from '../application/use-cases/restore-entity.use-case';
import { PermanentlyDeleteEntityUseCase } from '../application/use-cases/permanently-delete-entity.use-case';
import { TrashEntityType } from '../domain/enums/trash-entity-type.enum';

function parseEntity(raw: string): TrashEntityType {
  const valid = Object.values(TrashEntityType) as string[];
  if (!valid.includes(raw)) {
    throw new BadRequestException(
      `Invalid entity type "${raw}". Must be one of: ${valid.join(', ')}`,
    );
  }
  return raw as TrashEntityType;
}

@ApiTags('trash')
@ApiBearerAuth()
@Controller('trash')
export class TrashController {
  constructor(
    private readonly listUseCase: ListTrashUseCase,
    private readonly restoreUseCase: RestoreEntityUseCase,
    private readonly permanentlyDeleteUseCase: PermanentlyDeleteEntityUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all soft-deleted items for the authenticated user',
  })
  async list(@CurrentUser() user: JwtPayload) {
    return this.listUseCase.execute({ userId: user.userId });
  }

  @Post('restore/:entity/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted entity from trash' })
  @ApiParam({ name: 'entity', enum: TrashEntityType })
  @ApiParam({ name: 'id', type: String })
  async restore(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.restoreUseCase.execute({
      entity: parseEntity(entity),
      id,
      userId: user.userId,
    });
  }

  @Delete(':entity/:id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete a soft-deleted entity (irreversible)',
  })
  @ApiParam({ name: 'entity', enum: TrashEntityType })
  @ApiParam({ name: 'id', type: String })
  async permanentDelete(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.permanentlyDeleteUseCase.execute({
      entity: parseEntity(entity),
      id,
      userId: user.userId,
    });
  }
}
