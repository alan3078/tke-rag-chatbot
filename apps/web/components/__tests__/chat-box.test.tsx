import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatBox } from "@/components/chat-box";
import { renderWithProviders } from "@/test/render-with-providers";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("ChatBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows the empty state before any messages are sent", () => {
    renderWithProviders(<ChatBox />);

    expect(screen.getByText("Welcome to TKE RAG Chatbot")).toBeInTheDocument();
    expect(screen.getByText("Ask any question about 清华大学软件学院")).toBeInTheDocument();
  });

  it("submits a trimmed user message and appends the assistant response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "这是回答",
        citations: [],
      }),
    });

    renderWithProviders(<ChatBox />);

    await userEvent.type(screen.getByPlaceholderText("输入您的问题..."), "  学院成立于哪一年？  ");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("学院成立于哪一年？")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/chat", expect.any(Object));
      expect(screen.getByText("这是回答")).toBeInTheDocument();
    });

    const request = fetchMock.mock.calls[0][1];
    expect(JSON.parse(request.body as string)).toEqual({
      message: "学院成立于哪一年？",
      history: [],
    });
  });

  it("shows a loading indicator and disables the composer while waiting", async () => {
    let resolveRequest:
      | ((value: { ok: boolean; json: () => Promise<{ answer: string; citations: [] }> }) => void)
      | undefined;

    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderWithProviders(<ChatBox />);

    const input = screen.getByPlaceholderText("输入您的问题...");

    await userEvent.type(input, "测试问题");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("Thinking...")).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    resolveRequest?.({
      ok: true,
      json: async () => ({
        answer: "完成",
        citations: [],
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("完成")).toBeInTheDocument();
    });
  });
});
