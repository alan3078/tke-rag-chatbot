/**
 * seed-admin.ts
 *
 * Creates (or updates) the initial admin user in the database.
 * Usage:
 *   npx tsx apps/backend/scripts/seed-admin.ts
 *
 * Reads SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD from env (or .env).
 * Defaults: username=admin, password=tke2026  (change in production!)
 */
import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../src/entities/article.entity";
import { Chunk } from "../src/entities/chunk.entity";
import { User } from "../src/entities/user.entity";
import { generateSalt, hashPassword } from "../src/common/password";

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "tke2026";

async function main() {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Article, Chunk, User],
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
    const user = repo.create({
      username: ADMIN_USERNAME,
      salt,
      passwordHash,
      role: "admin",
    });
    await repo.save(user);
    console.log(`Created admin user '${ADMIN_USERNAME}'.`);
  }

  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
