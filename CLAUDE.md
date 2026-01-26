# CLAUDE.md - BADM554 Survey Bot

Pre-course survey bot for BADM554 Enterprise Database Management (Spring 2026).

## Quick Start

```bash
npm install
npm run dev  # Usually runs on port 3000, may use 3001/3002 if occupied
```

## Stack

- **Frontend**: Next.js 14, React, CSS-in-JS
- **AI**: OpenAI GPT-4o via LangChain
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Key Files

| File | Purpose |
|------|---------|
| `lib/orchestration/interview.ts` | Survey questions, AI prompts, analysis |
| `app/page.tsx` | Main UI (Illinois branding) |
| `app/api/interview/` | API routes for survey flow |
| `supabase/schema.sql` | Database schema |

## Supabase

- **Project**: `badm554` (ref: `kpuiqhrdbwdxqnukvsfl`)
- **Region**: East US (Ohio)
- Push schema changes: `supabase db push --linked`

## Survey Flow

1. Student clicks "Start Survey"
2. Bot asks ~13 questions about database background, skills, goals
3. After 8+ exchanges or 10 min, wrap-up prompt appears
4. Analysis generates student profile with skill assessment

## Instructor Queries

```sql
-- Get all completed surveys
SELECT id, created_at,
  analysis->'summary' as summary,
  analysis->'technicalSkillLevel' as skill_level
FROM sessions WHERE status = 'completed';
```

---

## Current Focus

Deployment to Vercel for Spring 2026 launch.

## Roadmap

- [x] Clone and customize from claude-interviewer-clone
- [x] Illinois branding (blue/orange)
- [x] BADM554 survey questions
- [x] Supabase integration
- [ ] Deploy to Vercel
- [ ] Test with pilot students
- [ ] Add class-wide analytics dashboard

## Session Log

| Date | Summary |
|------|---------|
| 2025-01-26 | Initial setup, Supabase linked, schema pushed |
