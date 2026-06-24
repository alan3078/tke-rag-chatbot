import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatHistory1700000000004 implements MigrationInterface {
  name = "AddChatHistory1700000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_sessions" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title"      TEXT NOT NULL DEFAULT '',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_sessions_user_id" ON "chat_sessions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" UUID NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "role"       TEXT NOT NULL CHECK ("role" IN ('user', 'assistant')),
        "content"    TEXT NOT NULL,
        "citations"  JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_messages_session_id" ON "chat_messages" ("session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_messages_session_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions"`);
  }
}
