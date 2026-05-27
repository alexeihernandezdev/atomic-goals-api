import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalsTable1748370000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id"                       uuid         NOT NULL DEFAULT gen_random_uuid(),
        "userId"                   uuid         NOT NULL,
        "categoryId"               uuid         NOT NULL,
        "name"                     varchar      NOT NULL,
        "description"              varchar,
        "type"                     varchar      NOT NULL,
        "cyclePeriod"              varchar,
        "customCycleDays"          integer,
        "startDate"                TIMESTAMP WITH TIME ZONE,
        "endDate"                  TIMESTAMP WITH TIME ZONE,
        "estimatedDurationMinutes" integer,
        "createdAt"                TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"                TIMESTAMP    NOT NULL DEFAULT now(),
        "deletedAt"                TIMESTAMP,
        CONSTRAINT "PK_goals" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_goals_userId" ON "goals" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_goals_categoryId" ON "goals" ("categoryId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "goals"
        ADD CONSTRAINT "FK_goals_userId"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "goals"
        ADD CONSTRAINT "FK_goals_categoryId"
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_goals_categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_goals_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_goals_categoryId"`);
    await queryRunner.query(`DROP INDEX "IDX_goals_userId"`);
    await queryRunner.query(`DROP TABLE "goals"`);
  }
}
