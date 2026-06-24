import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from "typeorm";
import type { Chunk } from "./chunk.entity";

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "text" })
  url: string;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text", nullable: true })
  section: string | null;

  @Column({ type: "date", nullable: true, name: "published_date" })
  publishedDate: Date | null;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @Column({ type: "text" })
  body: string;

  /** Absolute URLs of images found in the article body */
  @Column({ type: "jsonb", nullable: true, name: "image_urls", default: "[]" })
  imageUrls: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany("Chunk", "article")
  chunks: Chunk[];
}
