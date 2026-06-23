# ADR-0002: Frontend Stack — shadcn/ui + TanStack Query + Tailwind CSS

> **Status**: Accepted
> **Date**: 2026-06-23
> **Deciders**: Alan, Agent
> **Scope**: Frontend UI layer (`apps/web/components/`, `apps/web/app/`)

---

## Context and Problem Statement

The current frontend uses raw HTML elements styled with Tailwind CSS. There is no component library, no data-fetching abstraction, and no shared design tokens. As we add features (chat history, i18n, markdown rendering), the UI code will become harder to maintain and inconsistent in appearance. We need a component library and data-fetching layer that scales without adding unnecessary complexity.

## Decision Drivers

- Current UI: 4 components using raw `<div>`, `<input>`, `<button>` with Tailwind classes
- No data-fetching library — raw `fetch()` with manual `useState` for loading/error
- UX & Deployment is 10% of evaluation grade — UI must look polished
- Need to add: chat history, markdown rendering, i18n, loading states
- Must stay with Next.js App Router (server components by default)

## Blast Radius

### Components that MUST change

| File | Lines | Change Required |
|------|-------|-----------------|
| `apps/web/components/chat-box.tsx` | 124 | Replace raw fetch with TanStack Mutation, replace raw HTML with shadcn components |
| `apps/web/components/chat-message.tsx` | 24 | Use shadcn Card/Typography, add react-markdown rendering |
| `apps/web/components/citation-list.tsx` | 42 | Use shadcn Badge/Link components |
| `apps/web/components/login-form.tsx` | 85 | Use shadcn Input/Button/Label/Card, replace raw fetch with TanStack Mutation |
| `apps/web/app/layout.tsx` | 20 | Add QueryClientProvider, ThemeProvider |
| `apps/web/app/globals.css` | 1 | Add shadcn CSS variables and theme config |
| `apps/web/app/chat/page.tsx` | 33 | May use shadcn layout components |
| `apps/web/app/login/page.tsx` | 25 | May use shadcn Card for centered layout |
| `apps/web/package.json` | — | Add new dependencies |

### Components UNAFFECTED

| File | Reason |
|------|--------|
| `apps/web/lib/*` | Backend logic — no UI changes |
| `apps/web/entities/*` | Database layer — no UI changes |
| `apps/web/app/api/*` | API routes — no UI changes |
| `scripts/*` | CLI scripts — no UI changes |

## Considered Options

### Option A: Keep raw HTML + Tailwind (current)
- **Pro**: Zero dependencies, fully custom
- **Con**: Inconsistent styling, no accessible components, reinventing form controls, no loading/error patterns
- **Verdict**: Doesn't scale for chat history, i18n, markdown features

### Option B: Material UI (MUI)
- **Pro**: Complete component library, well-documented
- **Con**: Heavy bundle size (~200KB+), opinionated styling fights Tailwind, CSS-in-JS overhead
- **Verdict**: Too heavy for this project

### Option C: shadcn/ui + TanStack Query + Tailwind CSS (Chosen)
- **Pro**: Copy-paste components (own the code), Radix primitives (accessible), Tailwind-native, tree-shakeable, TanStack Query for data fetching with caching/mutation/error states
- **Con**: Initial setup time, need to install components individually
- **Verdict**: Best balance of quality, bundle size, and maintainability

### Option D: Headless UI + SWR
- **Pro**: Lightweight, Tailwind Labs product
- **Con**: Fewer components than shadcn/Radix, SWR less powerful than TanStack Query for mutations
- **Verdict**: Good but shadcn has better component coverage

## Decision Outcome

**Chosen: Option C — shadcn/ui + TanStack Query + Tailwind CSS**

### New Dependencies

| Package | Purpose | Bundle Impact |
|---------|---------|--------------|
| `@tanstack/react-query` | Data fetching, mutations, caching | ~13KB gzipped |
| `tailwind-merge` | Conditional class merging (shadcn dependency) | ~3KB |
| `class-variance-authority` | Variant-based component styling (shadcn) | ~2KB |
| `clsx` | Conditional classnames | ~1KB |
| `lucide-react` | Icon set (shadcn default icons) | Tree-shakeable |
| `@radix-ui/*` | Accessible primitives (per-component install) | Per-component |

### shadcn Components to Install

Priority components needed for chat + auth UI:

| Component | Used In |
|-----------|---------|
| `button` | Login form, chat send, logout |
| `input` | Login form, chat input |
| `label` | Login form |
| `card` | Login card, message bubbles |
| `badge` | Citation tags |
| `scroll-area` | Chat message list |
| `skeleton` | Loading states |
| `alert` | Error messages |
| `avatar` | User/assistant message bubbles |
| `separator` | Visual dividers |
| `dropdown-menu` | Chat settings (future) |

### Data Fetching Pattern

```typescript
// Before: raw fetch with manual state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const res = await fetch("/api/chat", { ... });

// After: TanStack Query mutation
const chatMutation = useMutation({
  mutationFn: (message: string) =>
    fetch("/api/chat", { method: "POST", body: JSON.stringify({ message }) })
      .then(res => res.json()),
  onSuccess: (data) => { /* append message */ },
  onError: (error) => { /* show error */ },
});
// chatMutation.isPending, chatMutation.error — automatic
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Correct Approach |
|-------------|-----|-----------------|
| Importing all shadcn components upfront | Bundle bloat | Install only needed components via `npx shadcn@latest add <component>` |
| Using shadcn server-side without 'use client' | Radix primitives need client-side JS | Mark interactive components with `'use client'` |
| Mixing raw HTML and shadcn for same patterns | Inconsistent UI | Convert all UI to shadcn components systematically |
| Creating QueryClient inside component | New instance per render | Create once in a provider component |

## Consequences

### Positive
- Consistent, accessible UI with Radix primitives
- Automatic loading/error/success states via TanStack Query
- Shadcn components are owned code (in `components/ui/`) — fully customizable
- Tailwind-native — no style conflicts
- Tree-shakeable — only ship what we use

### Negative
- Initial migration effort: all 4 components + 2 pages need updating
- Learning curve for TanStack Query mutation patterns
- shadcn setup requires a `components.json` config and utility function (`cn()`)

### Neutral
- `react-markdown` (already installed) will be activated for LLM output rendering
- Shared types (Citation, Message) should be extracted to a shared types file

## Confirmation

- [ ] shadcn/ui initialized with `npx shadcn@latest init`
- [ ] TanStack Query installed and QueryClientProvider added to layout
- [ ] All 4 components migrated to shadcn UI primitives
- [ ] All raw `fetch()` calls migrated to TanStack Query mutations
- [ ] Visual regression check: login + chat pages look correct
