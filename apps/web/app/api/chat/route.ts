import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { ragQuery } from "@/lib/rag";
import type { ChatMessage } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history: ChatMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 3. Run RAG pipeline
    const response = await ragQuery(message, history ?? []);

    // 4. Return response
    return NextResponse.json({
      answer: response.answer,
      citations: response.citations,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
