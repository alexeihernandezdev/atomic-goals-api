import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCycleDayToSteps1748410000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "steps" ADD COLUMN IF NOT EXISTS "cycleDay" varchar;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "steps" DROP COLUMN IF EXISTS "cycleDay";
    `);
  }
}
