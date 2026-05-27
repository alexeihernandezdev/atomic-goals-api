import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListUserActivityUseCase } from './application/use-cases/list-user-activity.use-case';
import { ACTIVITY_TOKENS } from './infrastructure/activity.tokens';
import { ActivityLogOrmEntity } from './infrastructure/persistence/activity-log.typeorm-entity';
import { ActivityLogTypeOrmRepository } from './infrastructure/persistence/activity-log.typeorm.repository';
import { ActivityLoggerService } from './infrastructure/services/activity-logger.service';
import { ActivityController } from './presentation/activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogOrmEntity])],
  controllers: [ActivityController],
  providers: [
    ListUserActivityUseCase,
    {
      provide: ACTIVITY_TOKENS.ACTIVITY_LOG_REPOSITORY,
      useClass: ActivityLogTypeOrmRepository,
    },
    {
      provide: ACTIVITY_TOKENS.ACTIVITY_LOGGER,
      useClass: ActivityLoggerService,
    },
  ],
  exports: [ACTIVITY_TOKENS.ACTIVITY_LOGGER],
})
export class ActivityModule {}
