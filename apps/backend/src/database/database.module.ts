import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Article } from "../entities/article.entity";
import { Chunk } from "../entities/chunk.entity";
import { User } from "../entities/user.entity";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity } from "../entities/chat-message.entity";

const ALL_ENTITIES = [Article, Chunk, User, ChatSession, ChatMessageEntity];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres" as const,
        url: process.env.DATABASE_URL,
        entities: ALL_ENTITIES,
        synchronize: false,
        logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
        },
      }),
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
