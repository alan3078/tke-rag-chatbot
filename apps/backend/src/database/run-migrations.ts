import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../entities/article.entity";
import { Chunk } from "../entities/chunk.entity";
import { User } from "../entities/user.entity";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity } from "../entities/chat-message.entity";
import { InitialSchema1700000000000 } from "../migrations/1700000000000-InitialSchema";
import { AddImageUrls1700000000001 } from "../migrations/1700000000001-AddImageUrls";
import { AddChunkLevel1700000000002 } from "../migrations/1700000000002-AddChunkLevel";
import { AddUsersTable1700000000003 } from "../migrations/1700000000003-AddUsersTable";
import { AddChatHistory1700000000004 } from "../migrations/1700000000004-AddChatHistory";

async function main() {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Article, Chunk, User, ChatSession, ChatMessageEntity],
    migrations: [
      InitialSchema1700000000000,
      AddImageUrls1700000000001,
      AddChunkLevel1700000000002,
      AddUsersTable1700000000003,
      AddChatHistory1700000000004,
    ],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log("Running migrations...");
  await dataSource.runMigrations();
  console.log("Migrations complete.");
  await dataSource.destroy();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
