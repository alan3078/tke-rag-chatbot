import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const jwtVerifyMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("jose", async () => {
  const actual = await vi.importActual<typeof import("jose")>("jose");

  return {
    ...actual,
    jwtVerify: jwtVerifyMock,
  };
});

describe("auth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AUTH_USERNAME = "admin";
    process.env.AUTH_PASSWORD = "tke2026";
    process.env.AUTH_SECRET = "12345678901234567890123456789012";
  });

  it("validateCredentials returns true only for matching env credentials", async () => {
    const { validateCredentials } = await import("@/lib/auth");

    expect(validateCredentials("admin", "tke2026")).toBe(true);
    expect(validateCredentials("admin", "wrong")).toBe(false);
    expect(validateCredentials("wrong", "tke2026")).toBe(false);
  });

  it("verifySession returns the username for a valid session cookie", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "signed-token" }),
    });
    jwtVerifyMock.mockResolvedValue({
      payload: { username: "admin" },
    });

    const { verifySession } = await import("@/lib/auth");
    await expect(verifySession()).resolves.toBe("admin");
    expect(jwtVerifyMock).toHaveBeenCalledTimes(1);
  });

  it("verifySession returns null when the cookie is missing", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const { verifySession } = await import("@/lib/auth");
    await expect(verifySession()).resolves.toBeNull();
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  it("verifySession returns null when token verification fails", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "bad-token" }),
    });
    jwtVerifyMock.mockRejectedValue(new Error("invalid token"));

    const { verifySession } = await import("@/lib/auth");
    await expect(verifySession()).resolves.toBeNull();
  });
});
