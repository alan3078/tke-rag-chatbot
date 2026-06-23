import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import type { Article } from "./article.entity";
import { ChunkLevel } from "../lib/constants";

@Entity("chunks")
export class Chunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", name: "article_id" })
  articleId: number;

  @Column({ type: "int", name: "chunk_index" })
  chunkIndex: number;

  /** Chunk level: Article (1) = full article, Section (2) = paragraph group */
  @Column({ type: "smallint", default: ChunkLevel.Article })
  level: ChunkLevel;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "text", nullable: true, name: "content_segmented" })
  contentSegmented: string | null;

  /** pgvector column — 1024 dims for qwen3-embedding:4b (Ollama local) */
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
