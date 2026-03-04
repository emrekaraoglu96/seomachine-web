# SEO Machine Web

## Project Path
`/Users/melek/seomachine-web/`

## Tech Stack
- Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- AI: Anthropic Claude (via Vercel AI SDK) for research/writing, OpenAI Whisper for voice transcription
- DB: Supabase (PostgreSQL)
- Auth: Supabase Auth

## Commands
```bash
npm run dev    # Dev server (localhost:3001)
npm run build  # Production build
npm run lint   # ESLint
```

## Environment Variables (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `ANTHROPIC_API_KEY` — Claude API for research + article writing
- `OPENAI_API_KEY` — Whisper API for voice transcription

## Architecture

### Article Creation Pipeline
1. **Topic input** + optional **voice description** (mic → MediaRecorder → Whisper transcription)
2. **Research** (`/api/research`) — Claude generates SEO content brief (keyword, outline, competitors)
3. **Write** (`/api/write`) — Claude writes full article using brand context + research brief + author's voice
4. **Score** (`/api/score`) — SEO scoring with breakdown
5. Save to Supabase `articles` table

### Key Files
| File | Purpose |
|------|---------|
| `src/app/(app)/articles/new/page.tsx` | Article creation pipeline UI |
| `src/app/api/research/route.ts` | Research API (Claude Sonnet) |
| `src/app/api/write/route.ts` | Article writing API (Claude Sonnet) |
| `src/app/api/transcribe/route.ts` | Voice transcription API (OpenAI Whisper) |
| `src/app/api/score/route.ts` | SEO scoring API |
| `src/lib/prompts/research-system.ts` | Research system prompt |
| `src/lib/prompts/write-system.ts` | Writing system prompt (brand context, author voice, SEO rules) |
| `src/lib/types.ts` | TypeScript interfaces (Project, Article, ResearchBrief, etc.) |
| `src/components/voice-input.tsx` | Voice recording component (MediaRecorder + Whisper) |

### Voice Input Component
- Uses **MediaRecorder API** (browser built-in) — NOT Web Speech API (unreliable, depends on Google servers)
- Records audio → sends to `/api/transcribe` → Whisper transcribes → appends to textarea
- Whisper auto-detects language (English, Turkish, etc.)
- States: idle → recording (red pulse + timer) → transcribing (spinner) → done

### Write System Prompt — Author's Voice
When user provides voice transcript, it's injected as "Author's Voice Sample" section in the write prompt (between Brand Context and Content Brief). This makes the article match the user's natural style, vocabulary, and perspective.

## DB Schema Notes
- `articles` table has `voice_transcript` column (text, nullable) — stores raw voice transcript for re-generation
- Migration: `ALTER TABLE public.articles ADD COLUMN voice_transcript text;`

## Patterns
- All AI routes use Vercel AI SDK `streamText()` with streaming responses
- UI components from shadcn/ui (`src/components/ui/`)
- Toast notifications via Sonner
- Project-scoped data (each article belongs to a project with brand settings)
