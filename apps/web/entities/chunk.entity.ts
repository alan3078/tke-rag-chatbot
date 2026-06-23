import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import type { Article } from "./article.entity";

@Entity("chunks")
export class Chunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", name: "article_id" })
  articleId: number;

  @Column({ type: "int", name: "chunk_index" })
  chunkIndex: number;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", nullable: true, name: "content_segmented" })
  contentSegmented: string | null;

  // pgvector column — 1024 dims for BGE-M3 (SiliconFlow / Ollama)
  // TypeORM 0.3.27+ has built-in vector support
  @Column({ type: "vector", length: 1024, nullable: true })
  embedding: number[] | null;

  @Column({ type: "int", nullable: true, name: "token_count" })
  tokenCount: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne("Article", "chunks", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "article_id" })
  article: Article;
}
