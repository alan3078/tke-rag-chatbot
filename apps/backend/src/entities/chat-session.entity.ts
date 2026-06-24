import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import type { User } from "./user.entity";
import type { ChatMessageEntity } from "./chat-message.entity";

@Entity("chat_sessions")
export class ChatSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "int" })
  userId: number;

  @Column({ type: "text", default: "" })
  title: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany("ChatMessageEntity", "session")
  messages: ChatMessageEntity[];
}
