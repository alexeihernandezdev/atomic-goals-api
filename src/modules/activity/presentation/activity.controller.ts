import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type JwtPayload,
} from '../../auth/presentation/decorators/current-user.decorator';
import { ListUserActivityUseCase } from '../application/use-cases/list-user-activity.use-case';

@ApiTags('activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly listUseCase: ListUserActivityUseCase) {}

  @Get()
  @ApiOperation({
    summary:
      'List recent activity for the authenticated user (cursor pagination)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const { items, nextCursor } = await this.listUseCase.execute({
      userId: user.userId,
      limit: limit ? parseInt(limit, 10) : 20,
      cursor,
    });

    return {
      items: items.map((log) => ({
        id: log.id.value,
        userId: log.userId.value,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId.value,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      nextCursor,
    };
  }
}
