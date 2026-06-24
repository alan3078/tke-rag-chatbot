import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { CitationList } from "@/components/chat/citation-list";
import { renderWithProviders } from "@/test/render-with-providers";

describe("CitationList", () => {
  it("renders citation title, section, date, and external link", () => {
    renderWithProviders(
      <CitationList
        citations={[
          {
            title: "学院简介",
            url: "https://www.thss.tsinghua.edu.cn/article/101",
            section: "学院概况",
            date: "2026-06-24",
            imageUrl: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("来源：")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "学院简介" })).toHaveAttribute(
      "href",
      "https://www.thss.tsinghua.edu.cn/article/101",
    );
    expect(screen.getByText("[学院概况]")).toBeInTheDocument();
    expect(screen.getByText("2026-06-24")).toBeInTheDocument();
  });
});
