import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCycleGroupIdToSteps1748430000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "steps" ADD COLUMN IF NOT EXISTS "cycleGroupId" varchar;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "steps" DROP COLUMN IF EXISTS "cycleGroupId";
    `);
  }
}
