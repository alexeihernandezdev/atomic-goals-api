import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1748350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"               uuid         NOT NULL DEFAULT gen_random_uuid(),
        "email"            varchar      NOT NULL,
        "passwordHash"     varchar      NOT NULL,
        "name"             varchar      NOT NULL,
        "refreshTokenHash" varchar,
        "createdAt"        TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP    NOT NULL DEFAULT now(),
        "deletedAt"        TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
