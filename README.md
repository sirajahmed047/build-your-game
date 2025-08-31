# Interactive Story Generator

A web-based platform that creates personalized interactive narratives using AI, designed with retention-first mechanics including choice statistics, endings collection, and personality insights.

## Features

- **AI-Generated Stories**: Dynamic narratives in Fantasy, Mystery, and Sci-Fi genres
- **Choice Statistics**: Real-time global percentages showing how your choices compare to other players
- **Endings Collection**: Gallery system with rarity classifications (Common, Uncommon, Rare, Ultra-Rare)
- **Personality Insights**: Evolving profile based on decision patterns
- **Guest Support**: Play without signing up, with data migration on account creation

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI**: OpenAI GPT-4 or Anthropic Claude
- **Analytics**: PostHog
- **State Management**: TanStack Query

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials

### 3. Initialize Supabase Locally (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local development
supabase start

# Apply migrations
supabase db push
```

### 4. Run the Database Migration

Apply the database schema by running the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 5. Configure Environment Variables

Update `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 7. Test the Setup

Visit `http://localhost:3000/test` to run database connection tests.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Generate types from Supabase
npx supabase gen types typescript --local > src/types/database.ts
```

## Database Schema

The application uses the following main tables:

- `user_profiles` - Extended user data beyond Supabase Auth
- `story_runs` - Complete story sessions
- `story_steps` - Individual choice points
- `choice_aggregates` - Global choice statistics
- `ending_catalog` - Global endings metadata

## Row Level Security (RLS)

The database implements RLS policies to ensure:
- Users can only access their own data
- Guest users can access data by session ID
- Choice statistics are publicly readable (anonymized)
- Data is automatically merged when guests sign up

## Next Steps

1. Implement AI story generation service
2. Build the story reading interface
3. Add choice statistics tracking
4. Create personality profiling system
5. Build endings collection gallery

## Contributing

This project follows the spec-driven development methodology. See `.kiro/specs/interactive-story-generator/` for detailed requirements, design, and implementation tasks.