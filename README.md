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
- **AI**: OpenAI GPT-4o via LangChain
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS-in-JS with Illinois brand colors

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o  # optional, defaults to gpt-4o
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
vercel
```

Set the environment variables in your Vercel project settings.

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
