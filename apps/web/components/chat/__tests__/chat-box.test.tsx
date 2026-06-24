import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatBox } from "@/components/chat/chat-box";
import { renderWithProviders } from "@/test/render-with-providers";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("ChatBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows the empty state before any messages are sent", () => {
    const noop = vi.fn();
    renderWithProviders(<ChatBox sessionId={null} onSessionCreated={noop} />);
    expect(screen.getByText("欢迎使用 RAG 知识问答系统")).toBeInTheDocument();
    expect(screen.getByText("向软件学院知识库提问")).toBeInTheDocument();
  });

  it("submits a trimmed user message and appends the assistant response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "这是回答", citations: [], sessionId: "test-id" }),
    });

    const noop = vi.fn();
    renderWithProviders(<ChatBox sessionId={null} onSessionCreated={noop} />);

    await userEvent.type(screen.getByPlaceholderText("输入您的问题..."), "  学院成立于哪一年？  ");
    await userEvent.click(screen.getByRole("button", { name: /发送/i }));

    expect(screen.getByText("学院成立于哪一年？")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/chat", expect.any(Object));
      expect(screen.getByText("这是回答")).toBeInTheDocument();
    });
  });

  it("shows a loading indicator and disables the composer while waiting", async () => {
    let resolveRequest: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | undefined;
    fetchMock.mockReturnValue(
      new Promise((resolve) => { resolveRequest = resolve; }),
    );

    const noop = vi.fn();
    renderWithProviders(<ChatBox sessionId={null} onSessionCreated={noop} />);

    const input = screen.getByPlaceholderText("输入您的问题...");
    await userEvent.type(input, "测试问题");
    await userEvent.click(screen.getByRole("button", { name: /发送/i }));

    expect(screen.getByText("思考中...")).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: /发送/i })).toBeDisabled();

    resolveRequest?.({ ok: true, json: async () => ({ answer: "完成", citations: [], sessionId: "test-id" }) });

    await waitFor(() => {
      expect(screen.getByText("完成")).toBeInTheDocument();
    });
  });
});
