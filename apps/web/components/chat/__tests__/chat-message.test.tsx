import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageBubble } from "@/components/chat/chat-message";

describe("ChatMessageBubble", () => {
  it("renders assistant messages as markdown content", () => {
    render(
      <ChatMessageBubble
        message={{
          role: "assistant",
          content: "请查看 **学院简介** 与 [官网](https://www.thss.tsinghua.edu.cn/)。",
        }}
      />,
    );

    expect(screen.getByText("学院简介", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "官网" })).toHaveAttribute(
      "href",
      "https://www.thss.tsinghua.edu.cn/",
    );
  });

  it("renders user messages as plain text bubbles", () => {
    render(
      <ChatMessageBubble
        message={{
          role: "user",
          content: "**不要** 把我的问题当成 markdown",
        }}
      />,
    );

    expect(screen.queryByText("不要", { selector: "strong" })).not.toBeInTheDocument();
    expect(screen.getByText("**不要** 把我的问题当成 markdown")).toBeInTheDocument();
  });
});
