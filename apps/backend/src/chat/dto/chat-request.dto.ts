export interface Citation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
  imageUrl: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  locale?: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
}
