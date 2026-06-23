import { describe, it, expect } from "vitest";
import { segmentText } from "@/lib/segmentation";

describe("segmentText", () => {
  it("AC-6: segments Chinese text into space-separated words", () => {
    const input = "清华大学软件学院举办学术论坛";
    const result = segmentText(input);

    // Should be space-separated
    expect(result).toContain(" ");

    // Should contain key words as substrings
    expect(result).toContain("清华大学");
    expect(result).toContain("软件");
    expect(result).toContain("学院");
  });

  it("preserves English words in mixed content", () => {
    const input = "刘云浩教授当选ACM Fellow";
    const result = segmentText(input);

    expect(result).toContain("ACM");
    expect(result).toContain("Fellow");
  });

  it("handles empty string", () => {
    const result = segmentText("");
    expect(result).toBe("");
  });

  it("handles pure whitespace", () => {
    const result = segmentText("   ");
    expect(result).toBe("");
  });

  it("handles text with newlines", () => {
    const input = "第一段内容\n\n第二段内容";
    const result = segmentText(input);

    expect(result).toContain("第一");
    expect(result).toContain("第二");
  });
});
