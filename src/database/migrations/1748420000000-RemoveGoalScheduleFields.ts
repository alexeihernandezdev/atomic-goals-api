import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGoalScheduleFields1748420000000
  implements MigrationInterface
{
  name = 'RemoveGoalScheduleFields1748420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goals" DROP COLUMN IF EXISTS "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP COLUMN IF EXISTS "endDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP COLUMN IF EXISTS "estimatedDurationMinutes"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goals" ADD "estimatedDurationMinutes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD "endDate" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" ADD "startDate" TIMESTAMP WITH TIME ZONE`,
    );
  }
}
