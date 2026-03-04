# SEO — Project Tracker

> AI-powered SEO content platform for B2B marketing teams.
> Path: `~/seomachine-web/` | Repo: `emrekaraoglu96/seomachine-web` (private)

## Tech Stack
- Next.js 16 + App Router + React 19 + Tailwind 4 + shadcn/ui
- Anthropic Claude API via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) — streaming
- Supabase Auth (magic link + Google) + PostgreSQL + RLS
- Vercel deployment

## Status: MVP Beta — Pre-Launch

---

## Completed

### Day 1: Foundation + Auth + Landing
- [x] Next.js project setup + all dependencies
- [x] Supabase project created (EU region, planica org)
- [x] DB migration run (3 tables: projects, articles, waitlist + RLS policies)
- [x] Supabase client/server/middleware utilities
- [x] `middleware.ts` — auth token refresh + route protection
- [x] Login page (magic link + Google OAuth)
- [x] Auth callback route (`/auth/callback`)
- [x] Landing page — hero, features (3 cards), how it works, CTA, footer
- [x] Waitlist API route (`/api/waitlist`)
- [x] `.env.local` configured with real Supabase + Anthropic keys

### Day 2: App Shell + Onboarding + Dashboard
- [x] App layout with sidebar (Dashboard, New Article, Settings)
- [x] `AppShell` component — sidebar + topbar + user dropdown
- [x] Onboarding 4-step wizard (company, audience, tone, examples)
- [x] Tone options with example sentences (`tone-options.ts`)
- [x] Dashboard — article list grid with status/score/word count
- [x] `use-project` hook (redirects to onboarding if no project)
- [x] Settings page (edit project, same tone preview as onboarding)

### Day 3: Core Pipeline
- [x] 3 system prompts (research, write, optimize)
- [x] Research API — streaming keyword research via Claude
- [x] Write API — streaming article generation (maxDuration=120, 8192 tokens)
- [x] SEO scorer — deterministic TypeScript (6 categories, 100 points)
- [x] Score API route
- [x] New article page — state machine (topic → research → write → score → done)
- [x] Research refinement — user can give feedback before writing
- [x] Markdown rendering (react-markdown + remark-gfm + @tailwindcss/typography)

### Day 4: Article Viewer + Optimization
- [x] Article detail page — two-column (content + sidebar)
- [x] SEO score ring (SVG, animated, color-coded)
- [x] Score breakdown bars (6 categories)
- [x] Meta tags display
- [x] Article actions (copy markdown, copy HTML, download .md)
- [x] Optimize API — AI suggestions as JSON
- [x] Apply suggestions API — AI rewrites article + re-scores
- [x] Per-suggestion "Apply" + "Apply All" buttons

### Day 5: Deploy Prep
- [x] `robots.txt` — blocks /dashboard, /articles, /api
- [x] `sitemap.ts` — static for / and /login
- [x] SEO metadata in layout
- [x] Product renamed from "SEO Machine" to "SEO"
- [x] GitHub repo created + code pushed (private)

---

## In Progress

### Vercel Deployment
- [ ] Import repo on vercel.com/new
- [ ] Add env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY)
- [ ] Deploy + get production URL
- [ ] Add Vercel URL to Supabase redirect URLs (Authentication > URL Configuration)
- [ ] Test full auth flow on production

### Magic Link Email
- [ ] Customize email template in Supabase dashboard (Authentication > Email Templates)
- [ ] Brand it with "SEO" name + clean design

---

## Next Up (Post-Deploy)

### Polish & UX
- [ ] Loading skeleton states (dashboard, article page)
- [ ] Error boundaries for API failures
- [ ] Empty state for dashboard (first-time user)
- [ ] Mobile responsive check (sidebar → hamburger?)
- [ ] Dark mode support

### Google OAuth
- [ ] Create Google Cloud OAuth credentials
- [ ] Add to Supabase Auth providers
- [ ] Test Google login flow

### Content Quality
- [ ] Test article output quality across 5+ different topics
- [ ] Tune write prompt for better hook formulas
- [ ] Verify SEO scorer accuracy against manual checks
- [ ] Test optimization apply flow end-to-end

### Analytics & Tracking
- [ ] Vercel Analytics (free tier)
- [ ] Basic event tracking (article created, waitlist signup)

### Landing Page
- [ ] OG image for social sharing
- [ ] Product screenshots / demo GIF
- [ ] Testimonials section (after beta feedback)
- [ ] Proper product name + domain

---

## NOT in MVP (v2 Backlog)
- [ ] GA4 / Google Search Console integration
- [ ] DataForSEO API for real keyword data
- [ ] WordPress direct publishing
- [ ] Stripe payments + usage limits
- [ ] Team / multi-user workspaces
- [ ] Article editing (inline markdown editor)
- [ ] Article versioning / history
- [ ] Bulk article generation
- [ ] Custom SEO scorer weights
- [ ] API access for programmatic use

---

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/prompts/write-system.ts` | Core write prompt — article quality |
| `src/lib/prompts/research-system.ts` | Keyword research prompt |
| `src/lib/prompts/optimize-system.ts` | Optimization suggestions prompt |
| `src/lib/seo-scorer.ts` | Deterministic SEO scoring (6 categories) |
| `src/app/(app)/articles/new/page.tsx` | Main pipeline UI (state machine) |
| `src/app/(app)/articles/[id]/page.tsx` | Article viewer + optimization |
| `src/components/app-shell.tsx` | App layout (sidebar + topbar) |
| `src/hooks/use-project.ts` | Project fetch + onboarding redirect |
| `middleware.ts` | Auth guard + token refresh |
| `supabase/migration.sql` | DB schema (3 tables + RLS) |

## Supabase
- **URL**: `https://pdydcruhhtenwqqttubi.supabase.co`
- **Region**: EU (Frankfurt)
- **Tables**: projects, articles, waitlist
- **Auth**: Magic link enabled, Google OAuth pending

## Cost
- ~$0.04-0.06 per article (Claude Sonnet)
- Supabase free tier
- Vercel free tier
