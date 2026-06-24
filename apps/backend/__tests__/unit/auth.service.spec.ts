import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { AuthService } from "../../src/auth/auth.service";
import { User } from "../../src/entities/user.entity";
import { generateSalt, hashPassword } from "../../src/common/password";

describe("AuthService", () => {
  const VALID_SECRET = "my-super-secret-key-for-testing-32chars";
  const VALID_USERNAME = "testadmin";
  const VALID_PASSWORD = "testpass123";

  let authService: AuthService;
  let jwtService: JwtService;
  let mockUserRepo: Partial<Repository<User>>;
  let storedUser: User;

  beforeAll(() => {
    process.env.AUTH_SECRET = VALID_SECRET;

    const salt = generateSalt();
    const passwordHash = hashPassword(VALID_PASSWORD, salt);
    storedUser = {
      id: 1,
      username: VALID_USERNAME,
      salt,
      passwordHash,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockUserRepo = {
      findOne: async ({ where }: any) => {
        if (where?.username === VALID_USERNAME) return storedUser;
        return null;
      },
    };

    jwtService = new JwtService({ secret: VALID_SECRET });
    authService = new AuthService(jwtService, mockUserRepo as Repository<User>);
  });

  afterAll(() => {
    delete process.env.AUTH_SECRET;
  });

  describe("validateCredentials", () => {
    it("should return the User entity for correct credentials", async () => {
      const result = await authService.validateCredentials(VALID_USERNAME, VALID_PASSWORD);
      expect(result).not.toBeNull();
      expect(result?.username).toBe(VALID_USERNAME);
    });

    it("should return null for incorrect username", async () => {
      const result = await authService.validateCredentials("wronguser", VALID_PASSWORD);
      expect(result).toBeNull();
    });

    it("should return null for incorrect password", async () => {
      const result = await authService.validateCredentials(VALID_USERNAME, "wrongpass");
      expect(result).toBeNull();
    });

    it("should return null for empty credentials", async () => {
      const result = await authService.validateCredentials("", "");
      expect(result).toBeNull();
    });
  });

  describe("createToken", () => {
    it("should return a JWT token string", async () => {
      const token = await authService.createToken(storedUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });

    it("should embed sub, username, and role in the payload", async () => {
      const token = await authService.createToken(storedUser);
      const decoded = jwtService.decode<{ sub: number; username: string; role: string }>(token);
      expect(decoded.sub).toBe(storedUser.id);
      expect(decoded.username).toBe(storedUser.username);
      expect(decoded.role).toBe(storedUser.role);
    });
  });

  describe("verifyToken", () => {
    it("should return null for an undefined token", async () => {
      const result = await authService.verifyToken(undefined);
      expect(result).toBeNull();
    });

    it("should return SessionUser for a valid token", async () => {
      const token = await authService.createToken(storedUser);
      const sessionUser = await authService.verifyToken(token);
      expect(sessionUser).not.toBeNull();
      expect(sessionUser?.id).toBe(storedUser.id);
      expect(sessionUser?.username).toBe(storedUser.username);
      expect(sessionUser?.role).toBe(storedUser.role);
    });

    it("should return null for an invalid token", async () => {
      const result = await authService.verifyToken("invalid.token.here");
      expect(result).toBeNull();
    });
  });
});
