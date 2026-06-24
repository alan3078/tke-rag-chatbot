export const enum ErrorCode {
  F0001 = "F0001", // Missing or invalid credentials
  F0002 = "F0002", // No valid session / session expired
  F0003 = "F0003", // Validation failed (DTO)
  F0004 = "F0004", // Missing request body or required field
  F0005 = "F0005", // No relevant results found in index
  F0006 = "F0006", // LLM generation failure
  F0007 = "F0007", // Internal server error
  F0008 = "F0008", // Embedding service unavailable
  F0009 = "F0009", // Too many requests
  F0010 = "F0010", // Chat session not found
}
