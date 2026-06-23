# ADR-0005: i18n Strategy — Frontend Localization (zh-CN + en)

> **Status**: Accepted
> **Date**: 2026-06-23
> **Deciders**: Alan, Agent
> **Scope**: Frontend UI, content display

---

## Context and Problem Statement

The chatbot serves a bilingual audience (Chinese + English). Currently, UI strings are hardcoded across 6 files in an inconsistent mix of Chinese and English (~14 strings total). The challenge requires bilingual content support, and the LLM already responds in the user's language. We need a lightweight i18n solution for the frontend without over-engineering.

**Crawled data is NOT translated** — articles are in their original language (entirely Chinese). The site (e.g., `www.thss.tsinghua.edu.cn/info/1023/2687.htm`) has no English article pages. i18n applies only to the UI chrome (buttons, labels, headings), not to the RAG corpus.

**"Bilingual" in the challenge means**: users can ask questions in either Chinese or English. The embedding model (qwen3-embedding:4b, 100+ languages) maps English queries close to semantically similar Chinese content. The LLM responds in the user's query language. The crawler does NOT translate content.

## Decision Drivers

- 14 hardcoded strings in 6 files, inconsistent language mix
- Challenge requires bilingual support (Chinese + English)
- Evaluators may use either language
- Must work with Next.js App Router (server + client components)
- Must not add significant complexity — this is a secondary feature (UX = 10% of grade)

## Blast Radius

### Files to Modify

| File | Change | Hardcoded Strings |
|------|--------|-------------------|
| `apps/web/app/layout.tsx` | Add i18n provider, dynamic `lang` attribute | 1 |
| `apps/web/app/chat/page.tsx` | Replace 3 hardcoded strings | 3 |
| `apps/web/app/login/page.tsx` | Replace 2 hardcoded strings | 2 |
| `apps/web/components/chat-box.tsx` | Replace 6 hardcoded strings | 6 |
| `apps/web/components/citation-list.tsx` | Replace 1 hardcoded string | 1 |
| `apps/web/components/login-form.tsx` | Replace 4 hardcoded strings | 4 |

### New Files

| File | Purpose |
|------|---------|
| `apps/web/lib/i18n.ts` | Translation dictionaries + helper |
| `apps/web/components/language-switcher.tsx` | Toggle zh-CN / en |

### UNAFFECTED

| Component | Reason |
|-----------|--------|
| All `apps/web/lib/*` (except i18n) | Backend logic, no UI strings |
| All `apps/web/entities/*` | Database layer |
| All `apps/web/app/api/*` | API responses are data, not UI |
| `scripts/*` | CLI tools, developer-facing only |
| Crawled/indexed content | Stays in original language |

## Considered Options

### Option A: No i18n (hardcoded Chinese)
- **Pro**: Zero effort
- **Con**: English-speaking evaluators can't read UI, violates bilingual requirement
- **Verdict**: Inadequate

### Option B: next-intl (full i18n framework)
- **Pro**: Route-based locale detection, server component support, mature
- **Con**: Adds routing complexity (e.g., `/en/chat`, `/zh/chat`), heavier setup, overkill for 14 strings
- **Verdict**: Over-engineering for this project's scale

### Option C: Simple dictionary + context provider (Chosen)
- **Pro**: ~50 lines of code, no new routing, no external dependency, works with App Router
- **Con**: No URL-based locale, no automatic locale detection, no pluralization
- **Verdict**: Perfect for 14 strings across 6 files

### Option D: react-i18next
- **Pro**: Battle-tested, large ecosystem
- **Con**: Complex setup with Next.js App Router, requires namespace management, overkill
- **Verdict**: Too heavy for this use case

## Decision Outcome

**Chosen: Option C — Simple dictionary + React context**

### Implementation

```typescript
// apps/web/lib/i18n.ts
export const dictionaries = {
  "zh-CN": {
    "app.title": "清华大学软件学院",
    "app.subtitle": "RAG 知识问答系统",
    "chat.welcome": "欢迎使用 RAG 知识问答系统",
    "chat.placeholder": "输入您的问题...",
    "chat.send": "发送",
    "chat.thinking": "思考中...",
    "chat.error": "抱歉，发生了错误，请稍后再试。",
    "chat.askAbout": "向软件学院知识库提问",
    "chat.sources": "来源：",
    "chat.logout": "退出登录",
    "login.username": "用户名",
    "login.password": "密码",
    "login.submit": "登录",
    "login.submitting": "登录中...",
    "login.error": "网络错误，请重试。",
  },
  en: {
    "app.title": "Tsinghua School of Software",
    "app.subtitle": "RAG Knowledge Q&A System",
    "chat.welcome": "Welcome to RAG Knowledge Q&A",
    "chat.placeholder": "Type your question...",
    "chat.send": "Send",
    "chat.thinking": "Thinking...",
    "chat.error": "Sorry, an error occurred. Please try again.",
    "chat.askAbout": "Ask about the School of Software",
    "chat.sources": "Sources:",
    "chat.logout": "Logout",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Login",
    "login.submitting": "Logging in...",
    "login.error": "Network error. Please try again.",
  },
} as const;

export type Locale = keyof typeof dictionaries;
export type TranslationKey = keyof typeof dictionaries["zh-CN"];
```

### Language Switcher

Simple toggle button in the chat header. Locale stored in:
1. Cookie (`locale=zh-CN`) — persists across sessions
2. React context — for client-side reactivity

Default locale: `zh-CN` (primary audience is Chinese).

### What is NOT Translated

| Content | Language | Reason |
|---------|----------|--------|
| Crawled article text | Original (Chinese) | Corpus is in Chinese; translation would be inaccurate |
| LLM responses | Auto (matches user query language) | LLM system prompt handles this |
| Citation titles | Original | Article titles shouldn't be translated |
| Console/log messages | English | Developer-facing only |

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Correct Approach |
|-------------|-----|-----------------|
| URL-based routing for locale | Overkill for 14 strings, adds routing complexity | Cookie + context provider |
| Translating crawled content | Inaccurate, not required by challenge | Keep in original language |
| Using template literals for translations | Not type-safe, no autocomplete | Typed dictionary keys |
| Translating error messages from API | Backend errors are for debugging, not display | Show generic user-facing error from dictionary |

### Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Locale cookie tampering | Validate against known locale list; fallback to zh-CN |
| XSS via translation strings | Strings are hardcoded in code, not user-input |

## Consequences

### Positive
- All UI text consistently bilingual
- Evaluators can switch to English if needed
- Zero external dependencies for i18n
- Type-safe translation keys with autocomplete
- Simple enough for AI agents to maintain

### Negative
- No automatic locale detection from browser
- No pluralization support (not needed for current strings)
- Must manually add keys when adding new UI strings

### Neutral
- Default language is zh-CN (matches the primary corpus language)
- LLM response language is independent of UI locale (determined by user's query language)

## Confirmation

- [ ] `apps/web/lib/i18n.ts` created with both dictionaries
- [ ] Language switcher component in chat header
- [ ] All 14 hardcoded strings replaced with translation keys
- [ ] Locale persists in cookie across page refreshes
- [ ] Default locale is zh-CN
- [ ] English UI renders correctly
