import { beforeEach, describe, expect, it, vi } from "vitest";

const verifySessionMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  verifySession: verifySessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("ChatPage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to /login", async () => {
    verifySessionMock.mockResolvedValue(null);

    const { default: ChatPage } = await import("@/app/chat/page");
    await ChatPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
