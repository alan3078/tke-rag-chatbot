import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import type { ChatSession } from "./chat-session.entity";

export interface StoredCitation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
}

@Entity("chat_messages")
export class ChatMessageEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "session_id", type: "uuid" })
  sessionId: string;

  @Column({ type: "text" })
  role: "user" | "assistant";

  @Column({ type: "text" })
  content: string;

  /** Citations returned by the RAG pipeline (only for assistant messages) */
  @Column({ type: "jsonb", nullable: true, default: null })
  citations: StoredCitation[] | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne("ChatSession", "messages", { onDelete: "CASCADE" })
  @JoinColumn({ name: "session_id" })
  session: ChatSession;
}
