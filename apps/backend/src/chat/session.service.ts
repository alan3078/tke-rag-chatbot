import { Injectable, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatSession } from "../entities/chat-session.entity";
import { ChatMessageEntity, StoredCitation } from "../entities/chat-message.entity";
import { AppException } from "../common/app-exception";
import { ErrorCode } from "../common/error-codes";

const SESSION_TITLE_MAX_LENGTH = 50;

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDetail {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations: unknown[] | null;
    createdAt: Date;
  }[];
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
  ) {}

  async listSessions(userId: number): Promise<SessionSummary[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: "DESC" },
      select: ["id", "title", "createdAt", "updatedAt"],
    });
  }

  async createSession(userId: number, title?: string): Promise<ChatSession> {
    const session = this.sessionRepo.create({
      userId,
      title: title ?? "",
    });
    return this.sessionRepo.save(session);
  }

  async getSession(userId: number, sessionId: string): Promise<SessionDetail> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
      relations: ["messages"],
      order: { messages: { createdAt: "ASC" } },
    });

    if (!session) {
      throw new AppException(ErrorCode.F0010, HttpStatus.NOT_FOUND);
    }

    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteSession(userId: number, sessionId: string): Promise<void> {
    const result = await this.sessionRepo.delete({ id: sessionId, userId });
    if (result.affected === 0) {
      throw new AppException(ErrorCode.F0010, HttpStatus.NOT_FOUND);
    }
  }

  async updateSessionTitle(userId: number, sessionId: string, title: string): Promise<void> {
    const result = await this.sessionRepo.update(
      { id: sessionId, userId },
      { title: title.slice(0, SESSION_TITLE_MAX_LENGTH) },
    );
    if (result.affected === 0) {
      throw new AppException(ErrorCode.F0010, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Auto-generate a session title from the first user message.
   */
  async autoTitle(sessionId: string, firstMessage: string): Promise<void> {
    const title = firstMessage.slice(0, SESSION_TITLE_MAX_LENGTH);
    await this.sessionRepo.update(sessionId, { title });
  }

  async saveMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    citations: StoredCitation[] | null = null,
  ): Promise<ChatMessageEntity> {
    const message = this.messageRepo.create({
      sessionId,
      role,
      content,
      citations,
    });
    const saved = await this.messageRepo.save(message);
    // Touch session updatedAt
    await this.sessionRepo.update(sessionId, { updatedAt: new Date() });
    return saved;
  }

  async getSessionHistory(sessionId: string): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: "ASC" },
      select: ["role", "content"],
    });
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }
}
