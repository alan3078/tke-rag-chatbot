import { Injectable } from "@nestjs/common";
import nodejieba from "nodejieba";

function splitChineseAndOther(text: string): string[] {
  return (
    text.match(
      /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+|[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g,
    ) ?? []
  );
}

function isChinese(segment: string): boolean {
  return /[\u4e00-\u9fff]/.test(segment);
}

@Injectable()
export class SegmentationService {
  segmentText(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) return "";

    const segments = splitChineseAndOther(trimmed);
    const result: string[] = [];

    for (const segment of segments) {
      if (isChinese(segment)) {
        const words = nodejieba.cut(segment);
        result.push(...words.filter((w) => w.trim().length > 0));
      } else {
        const tokens = segment.split(/\s+/).filter((t) => t.length > 0);
        result.push(...tokens);
      }
    }

    return result.join(" ");
  }
}
