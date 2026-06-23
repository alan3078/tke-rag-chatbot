// Smoke test: verify Ollama embedding pipeline works before full ingest
import "dotenv/config";
import { generateQueryEmbedding } from "../apps/web/lib/embeddings";
import { EMBEDDING_DIMENSIONS } from "../apps/web/lib/constants";

async function main() {
  console.log("Smoke testing Ollama embedding...");
  console.log(`  Model: ${process.env.EMBEDDING_MODEL ?? "qwen3-embedding:4b"}`);
  console.log(`  URL: ${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}`);
  console.log(`  Expected dims: ${EMBEDDING_DIMENSIONS}\n`);

  const embedding = await generateQueryEmbedding("清华大学软件学院");

  console.log(`  Got dims:       ${embedding.length}`);
  console.log(`  First 5 values: [${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}]`);

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`);
  }

  console.log("\nPASS: Ollama embedding is working correctly.");
}

main().catch((err) => {
  console.error("\nFAIL:", err.message);
  process.exit(1);
});
