export const RRF_K = 60;

/** Top-K for the vector search arm (covers all chunk levels) */
export const VECTOR_TOP_K = 30;

/** Top-K for the keyword search arm (covers all chunk levels) */
export const KEYWORD_TOP_K = 30;

export const VECTOR_WEIGHT = parseFloat(process.env.RETRIEVAL_VECTOR_WEIGHT ?? "0.6");
export const KEYWORD_WEIGHT = parseFloat(process.env.RETRIEVAL_KEYWORD_WEIGHT ?? "0.4");

/** Final number of chunks sent to the LLM */
export const FINAL_TOP_K = parseInt(process.env.RETRIEVAL_TOP_K ?? "5", 10);
