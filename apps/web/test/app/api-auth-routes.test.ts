import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const validateCredentialsMock = vi.fn();
const createSessionMock = vi.fn();
const destroySessionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  validateCredentials: validateCredentialsMock,
  createSession: createSessionMock,
  destroySession: destroySessionMock,
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
  });

  it("returns 401 for invalid credentials", async () => {
    validateCredentialsMock.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "wrong" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials" });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("creates a session and returns success for valid credentials", async () => {
    validateCredentialsMock.mockReturnValue(true);
    createSessionMock.mockResolvedValue("token");

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "tke2026" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(createSessionMock).toHaveBeenCalledWith("admin");
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
  });

  it("destroys the session and redirects to /login", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST();

    expect(destroySessionMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
