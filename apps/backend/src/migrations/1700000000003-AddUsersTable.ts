import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersTable1700000000003 implements MigrationInterface {
  name = "AddUsersTable1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            SERIAL PRIMARY KEY,
        "username"      TEXT NOT NULL,
        "password_hash" TEXT NOT NULL,
        "salt"          TEXT NOT NULL,
        "role"          TEXT NOT NULL DEFAULT 'user' CHECK ("role" IN ('admin', 'user')),
        "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_username" ON "users" ("username")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_username"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
