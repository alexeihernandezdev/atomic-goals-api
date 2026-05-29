import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogsTable1748400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id"        uuid         NOT NULL DEFAULT gen_random_uuid(),
        "userId"    uuid         NOT NULL,
        "action"    varchar      NOT NULL,
        "entity"    varchar      NOT NULL,
        "entityId"  uuid         NOT NULL,
        "metadata"  jsonb        NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "activity_logs"
         ADD CONSTRAINT "FK_activity_logs_userId"
         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_userId_createdAt"
         ON "activity_logs" ("userId", "createdAt" DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_logs_userId_createdAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
  }
}
