import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1748360000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
        "userId"      uuid         NOT NULL,
        "name"        varchar      NOT NULL,
        "description" varchar,
        "color"       varchar(7),
        "icon"        varchar(50),
        "createdAt"   TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP    NOT NULL DEFAULT now(),
        "deletedAt"   TIMESTAMP,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_userId" ON "categories" ("userId")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_categories_userId_name_active"
      ON "categories" ("userId", "name")
      WHERE "deletedAt" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_userId"
       FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_userId"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_categories_userId_name_active"`);
    await queryRunner.query(`DROP INDEX "IDX_categories_userId"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
