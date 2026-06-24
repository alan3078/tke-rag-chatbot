# TKE RAG Chatbot

A production-grade Retrieval-Augmented Generation (RAG) chatbot that answers questions about the [Tsinghua School of Software](https://www.thss.tsinghua.edu.cn) website corpus (~850 pages).

## Architecture

```
User → Nginx (HTTPS :8443) → Next.js (:3000)
                                  ├── /login → session cookie
                                  ├── /chat → Chat UI (React)
                                  └── /api/chat → RAG pipeline
                                        ├── Query rewrite
                                        ├── Embedding generation
                                        ├── Hybrid retrieval (vector + keyword + RRF)
                                        ├── Chunk ranking & selection
                                        ├── LLM answer generation
                                        └── Response with citations
                                  PostgreSQL + pgvector (:5432)
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) — monorepo with `apps/web`
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16 + pgvector
- **ORM**: TypeORM (with raw SQL for vector ops)
- **Crawler**: Cheerio + node fetch
- **Embeddings**: OpenAI-compatible API
- **LLM**: OpenAI-compatible API (GPT-4o-mini)
- **Auth**: Session-cookie auth (jose JWT)
- **Deployment**: Docker Compose + Nginx
- **CSS**: Tailwind CSS 4

## Project Structure

```
tke-rag-chatbot/
├── apps/
│   └── web/                  # Next.js 15 (frontend + API backend)
│       ├── app/              # App Router: pages + API routes
│       ├── components/       # React UI components
│       ├── lib/              # Server-side logic (auth, RAG, DB)
│       ├── entities/         # TypeORM entity definitions
│       └── migrations/       # TypeORM migrations (manual SQL)
├── scripts/                  # CLI: crawl, ingest, check-coverage
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- An OpenAI-compatible API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/alan3078/tke-rag-chatbot.git
cd tke-rag-chatbot

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Install dependencies
npm install

# 4. Start PostgreSQL with pgvector
docker compose up -d postgres

# 5. Run TypeORM migrations
npm run migration:run

# 6. Crawl the website (~15-20 min with polite rate limiting)
npm run crawl

# 7. Ingest: chunk, embed, and store (~10-15 min)
npm run ingest

# 8. Start the dev server
npm run dev

# 9. Open http://localhost:3000
#    Login: admin / tke2026
```

### Production Deployment

```bash
# Generate self-signed SSL cert
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key -out certs/server.crt \
  -subj "/CN=<SERVER_HOST>"

# Build and deploy
docker compose up -d --build

# Accessible at https://<SERVER_HOST>:8443
```

## Key Design Decisions

1. **Hybrid retrieval** (vector + keyword with RRF) — pure vector search misses exact Chinese names/dates
2. **Chinese-aware chunking** — paragraph-first splitting with metadata prepended to each chunk
3. **TypeORM + raw SQL** — TypeORM for entity management, raw SQL for pgvector operations
4. **Section-aware crawling** — structured crawl by site sections, not random recursive
5. **Monorepo layout** — `apps/web` for the Next.js app, `scripts/` for CLI tools
6. **No LangChain** — custom RAG pipeline for full control and code quality visibility

## Credentials

- **Username**: `admin`
- **Password**: `tke2026`

## License

MIT
