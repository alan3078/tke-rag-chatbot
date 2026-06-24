export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "qwen3-embedding:4b";
export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS ?? "1024", 10);
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
export const EMBEDDING_BATCH_SIZE = 32;
