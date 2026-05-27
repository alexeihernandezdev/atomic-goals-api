import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoalInstancesTable1748380000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "goal_instances" (
        "id"          uuid           NOT NULL DEFAULT gen_random_uuid(),
        "goalId"      uuid           NOT NULL,
        "cycleStart"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "cycleEnd"    TIMESTAMP WITH TIME ZONE NOT NULL,
        "status"      varchar        NOT NULL DEFAULT 'IN_PROGRESS',
        "progress"    numeric(5,2)   NOT NULL DEFAULT 0,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt"   TIMESTAMP      NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP      NOT NULL DEFAULT now(),
        "deletedAt"   TIMESTAMP,
        CONSTRAINT "PK_goal_instances" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_goal_instances_goalId" ON "goal_instances" ("goalId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "goal_instances"
        ADD CONSTRAINT "FK_goal_instances_goalId"
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "goal_instances" DROP CONSTRAINT "FK_goal_instances_goalId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_goal_instances_goalId"`);
    await queryRunner.query(`DROP TABLE "goal_instances"`);
  }
}
