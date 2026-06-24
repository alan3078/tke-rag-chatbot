/**
 * seed-admin.ts — compiled into dist/database/seed-admin.js by nest build
 * Called via: node dist/database/seed-admin.js  (or npm run seed)
 */
import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../entities/article.entity";
import { Chunk } from "../entities/chunk.entity";
import { User } from "../entities/user.entity";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity } from "../entities/chat-message.entity";
import { generateSalt, hashPassword } from "../common/password";

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "tke2026";

async function main() {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Article, Chunk, User, ChatSession, ChatMessageEntity],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(User);
  const existing = await repo.findOne({ where: { username: ADMIN_USERNAME } });

  const salt = generateSalt();
  const passwordHash = hashPassword(ADMIN_PASSWORD, salt);

  if (existing) {
    await repo.update(existing.id, { salt, passwordHash, role: "admin" });
    console.log(`Updated existing user '${ADMIN_USERNAME}' with fresh password hash.`);
  } else {
    const user = repo.create({ username: ADMIN_USERNAME, salt, passwordHash, role: "admin" });
    await repo.save(user);
    console.log(`Created admin user '${ADMIN_USERNAME}'.`);
  }

  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
