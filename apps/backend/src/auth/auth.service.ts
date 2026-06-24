import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { UserRole } from "../common/constants";
import { verifyPassword } from "../common/password";

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Validates username + password against the users table.
   * Returns the matched User entity on success, null on failure.
   */
  async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) return null;
    const valid = verifyPassword(password, user.salt, user.passwordHash);
    return valid ? user : null;
  }

  /**
   * Creates a signed JWT access token for the given user.
   */
  async createToken(user: User): Promise<string> {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET environment variable is not set");

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload, { secret, expiresIn: "24h" });
  }

  /**
   * Verifies a JWT token and returns the session user, or null if invalid.
   */
  async verifyToken(token: string | undefined): Promise<SessionUser | null> {
    if (!token) return null;
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET environment variable is not set");

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
}
