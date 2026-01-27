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

## Vercel Deployment

**Production URL**: https://badm554-survey-bot.vercel.app

### Environment Variables (Vercel Dashboard)
- `OPENAI_API_KEY` - Required
- `NEXT_PUBLIC_SUPABASE_URL` - Public, okay to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key, okay to expose
- `OPENAI_MODEL` - Optional, defaults to `gpt-4o`

### Deployment Notes
- Always test locally before deploying: `npm run dev` then `curl` the API
- Use `vercel --prod --yes` to deploy
- Use `vercel --prod --yes --force` to skip build cache if changes aren't reflected
- Env vars must be set BEFORE deployment to take effect

---

## Current Focus

Deployed. Ready for pilot testing.

## Roadmap

- [x] Clone and customize from claude-interviewer-clone
- [x] Illinois branding (blue/orange)
- [x] BADM554 survey questions
- [x] Supabase integration
- [x] Deploy to Vercel
- [x] Improve conversational prompts (probe vague answers)
- [ ] Test with pilot students
- [ ] Add class-wide analytics dashboard

## Lessons Learned

| Issue | Solution |
|-------|----------|
| Bot resets to start screen on API error | Check `response.ok` before using `data.session` in frontend |
| Model-specific params (e.g., temperature) | Some models don't support custom temperature; remove or make conditional |
| Vercel env vars not applied | Must redeploy after adding env vars; use `--force` if cached |
| Generic "Failed to process" error | Check local server logs for actual error message |

## Session Log

| Date | Summary |
|------|---------|
| 2025-01-26 | Initial setup, Supabase linked, schema pushed |
| 2026-01-26 | Deployed to Vercel, fixed API error handling, improved prompts |
| 2026-01-27 | Exported survey data (68 sessions, 677 messages) to `data/` |
