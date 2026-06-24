import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity } from "../entities/chat-message.entity";
import { AuthModule } from "../auth/auth.module";
import { RetrievalModule } from "../retrieval/retrieval.module";
import { EmbeddingsModule } from "../embeddings/embeddings.module";
import { LlmModule } from "../llm/llm.module";
import { ChatController } from "./chat.controller";
import { SessionController } from "./session.controller";
import { ChatService } from "./chat.service";
import { SessionService } from "./session.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessageEntity]),
    AuthModule,
    RetrievalModule,
    EmbeddingsModule,
    LlmModule,
  ],
  controllers: [ChatController, SessionController],
  providers: [ChatService, SessionService],
})
export class ChatModule {}
