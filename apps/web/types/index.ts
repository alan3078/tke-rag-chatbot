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

export interface DisplayMessage extends ChatMessage {
  citations?: Citation[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  accessToken: string;
  user: { id: number; username: string; role: string };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  locale?: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  sessionId: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations: Citation[] | null;
    createdAt: string;
  }[];
}
