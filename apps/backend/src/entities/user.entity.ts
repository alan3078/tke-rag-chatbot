import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserRole } from "../common/constants";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "text" })
  username: string;

  /** PBKDF2-SHA256 hex digest */
  @Column({ name: "password_hash", type: "text" })
  passwordHash: string;

  /** Random hex salt (32 bytes) */
  @Column({ type: "text" })
  salt: string;

  @Column({
    type: "text",
    enum: ["admin", "user"],
    default: "user",
  })
  role: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
