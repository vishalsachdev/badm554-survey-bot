# BADM554 Course Survey Bot

A conversational pre-course survey for BADM554 Enterprise Database Management (Spring 2026). This AI-powered survey bot collects information about incoming students' backgrounds, technical skills, and learning goals to help tailor the course.

## Features

- **Conversational Survey**: Natural dialogue-based questions instead of static forms
- **Adaptive Follow-ups**: AI asks contextual follow-up questions based on responses
- **Student Profile Generation**: Automated analysis creates a profile summary including:
  - Technical skill level assessment
  - Prior experience profile
  - Areas needing support
  - Topics of interest
  - Recommendations for instructor support
- **Illinois Branding**: University of Illinois color scheme (blue and orange)

## Survey Topics

The bot explores:
1. Academic background and current program
2. Work experience with data/databases
3. Prior database coursework
4. Data modeling and ER diagram experience
5. SQL and relational database skills
6. NoSQL experience
7. ETL and data pipeline experience
8. Cloud platform familiarity (AWS, GCP, Azure)
9. Tool proficiency (Jupyter, KNIME, database clients)
10. Learning objectives and goals
11. Anticipated challenges

## Privacy & Data Protection

- **No login required**: This application does not collect any personally identifiable information (PII)
- **No user accounts**: All surveys are session-based
- **Please do not share personal information**: While we don't require PII, we strongly advise users not to share sensitive or confidential information
- **Cloud storage**: Survey responses are stored in Supabase (PostgreSQL)

## Tech Stack

- **Frontend**: Next.js 14 with React
- **AI**: OpenAI or Google Gemini via LangChain (multi-vendor support)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS-in-JS with Illinois brand colors

## Setup

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- AI API key (choose one):
  - **Google Gemini** (recommended for free usage)
  - **OpenAI** (paid)

### Getting an API Key

#### Option 1: Google Gemini (Free)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" → "Create API key"
4. Copy the key

Gemini is **free** within generous quota limits (perfect for classroom use).

#### Option 2: OpenAI (Paid)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and add billing
3. Go to API Keys → Create new secret key
4. Copy the key

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Choose ONE of these (Gemini takes priority if both are set):
GOOGLE_API_KEY=your_google_api_key    # Free option
OPENAI_API_KEY=your_openai_api_key    # Paid option

# Optional: override the default model
LLM_MODEL=gemini-2.0-flash  # or gpt-4o, gemini-1.5-pro, etc.

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: If `GOOGLE_API_KEY` is set, the app uses Gemini. Otherwise, it uses OpenAI.

### Database Setup

1. Create a new Supabase project
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to use the survey.

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel --prod
```

Set these environment variables in your Vercel project settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | One of these | Google Gemini API key (free) |
| `OPENAI_API_KEY` | One of these | OpenAI API key (paid) |
| `LLM_MODEL` | No | Override default model |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

## Usage

1. Students visit the survey URL
2. Click "Start Survey" to begin
3. Answer questions conversationally (about 10 minutes)
4. Click "Complete" when finished
5. View personalized profile summary

## For Instructors

Survey responses are stored in Supabase. To analyze class-wide data:

1. Access your Supabase dashboard
2. Query the `sessions` table for completed surveys
3. The `analysis` JSONB column contains structured profile data

Example query:
```sql
SELECT
  id,
  created_at,
  analysis->'summary' as summary,
  analysis->'technicalSkillLevel' as skill_level,
  analysis->'topicsOfInterest' as interests,
  analysis->'areasNeedingSupport' as support_areas
FROM sessions
WHERE status = 'completed'
ORDER BY created_at DESC;
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── interview/     # Survey endpoints
│   ├── page.tsx           # Main survey interface
│   └── layout.tsx         # Root layout
├── lib/                   # Core logic
│   ├── db/               # Database layer (Supabase)
│   └── orchestration/    # LangChain workflows
├── supabase/             # Database schema
│   └── schema.sql        # SQL to set up tables
└── types/                # TypeScript types
```

## License

MIT
