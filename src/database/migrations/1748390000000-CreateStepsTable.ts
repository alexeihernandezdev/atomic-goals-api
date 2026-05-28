import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStepsTable1748390000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "steps" (
        "id"                       uuid           NOT NULL DEFAULT gen_random_uuid(),
        "goalInstanceId"           uuid           NOT NULL,
        "type"                     varchar        NOT NULL,
        "title"                    varchar        NOT NULL,
        "description"              varchar,
        "weight"                   numeric(5,2)   NOT NULL DEFAULT 1,
        "order"                    integer        NOT NULL DEFAULT 0,
        "unit"                     varchar,
        "startDate"                TIMESTAMP WITH TIME ZONE,
        "endDate"                  TIMESTAMP WITH TIME ZONE,
        "estimatedDurationMinutes" integer,
        "current"                  numeric(10,2),
        "target"                   numeric(10,2),
        "max"                      numeric(10,2),
        "min"                      numeric(10,2),
        "done"                     boolean,
        "statuses"                 jsonb,
        "currentStatusId"          varchar,
        "createdAt"                TIMESTAMP      NOT NULL DEFAULT now(),
        "updatedAt"                TIMESTAMP      NOT NULL DEFAULT now(),
        "deletedAt"                TIMESTAMP,
        CONSTRAINT "PK_steps" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_steps_goalInstanceId" ON "steps" ("goalInstanceId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "steps"
        ADD CONSTRAINT "FK_steps_goalInstanceId"
        FOREIGN KEY ("goalInstanceId") REFERENCES "goal_instances"("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "steps" DROP CONSTRAINT "FK_steps_goalInstanceId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_steps_goalInstanceId"`);
    await queryRunner.query(`DROP TABLE "steps"`);
  }
}
