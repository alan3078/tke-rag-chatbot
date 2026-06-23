import { beforeEach, describe, expect, it, vi } from "vitest";

const verifySessionMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  verifySession: verifySessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("redirects authenticated users to /chat", async () => {
    verifySessionMock.mockResolvedValue("admin");

    const { default: LoginPage } = await import("@/app/login/page");
    await LoginPage();

    expect(redirectMock).toHaveBeenCalledWith("/chat");
  });
});
