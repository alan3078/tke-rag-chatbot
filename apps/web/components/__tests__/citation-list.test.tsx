import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CitationList } from "@/components/citation-list";

describe("CitationList", () => {
  it("renders citation title, section, date, and external link", () => {
    render(
      <CitationList
        citations={[
          {
            title: "学院简介",
            url: "https://www.thss.tsinghua.edu.cn/article/101",
            section: "学院概况",
            date: "2026-06-24",
          },
        ]}
      />,
    );

    expect(screen.getByText("Sources:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "学院简介" })).toHaveAttribute(
      "href",
      "https://www.thss.tsinghua.edu.cn/article/101",
    );
    expect(screen.getByText("[学院概况]")).toBeInTheDocument();
    expect(screen.getByText("2026-06-24")).toBeInTheDocument();
  });
});
