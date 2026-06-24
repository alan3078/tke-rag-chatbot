import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { RetrievalModule } from "./retrieval/retrieval.module";
import { EmbeddingsModule } from "./embeddings/embeddings.module";
import { LlmModule } from "./llm/llm.module";
import { SegmentationModule } from "./segmentation/segmentation.module";
import { ChunkingModule } from "./chunking/chunking.module";
import { HealthController } from "./health.controller";

/** Rate limit: 30 requests per 60 seconds per IP */
const THROTTLE_TTL_MS = 60_000;
const THROTTLE_LIMIT = 30;

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }]),
    DatabaseModule,
    AuthModule,
    ChatModule,
    RetrievalModule,
    EmbeddingsModule,
    LlmModule,
    SegmentationModule,
    ChunkingModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
