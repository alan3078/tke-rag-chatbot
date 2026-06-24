import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Article } from "../entities/article.entity";
import { Chunk } from "../entities/chunk.entity";
import { User } from "../entities/user.entity";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity } from "../entities/chat-message.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Article, Chunk, User, ChatSession, ChatMessageEntity],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
  },
});
