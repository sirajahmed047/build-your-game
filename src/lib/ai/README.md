# AI Story Generation Service

This module provides AI-powered story generation capabilities for the Interactive Story Generator platform.

## Overview

The AI Story Generation Service consists of:

1. **Supabase Edge Function** (`supabase/functions/generate-story/`) - Server-side AI integration
2. **Client-side Service** (`src/lib/ai/story-generation.ts`) - Frontend API wrapper
3. **React Hooks** (`src/lib/hooks/useStoryGeneration.ts`) - React integration
4. **Utility Functions** (`src/lib/utils/choice-utils.ts`) - Choice processing utilities

## Features

### ✅ Implemented Features

- **Genre-specific Prompt Templates**: Fantasy, Mystery, Sci-Fi with tailored prompts
- **JSON Schema Validation**: Strict validation with retry logic for AI responses
- **Fallback Content System**: Pre-written bridge segments when AI fails
- **Rate Limiting**: Per-user and global limits with premium tier support
- **Content Safety Filters**: Challenge-level appropriate content filtering
- **Choice Slug Generation**: Stable identifiers for choice statistics
- **Decision Key Hashing**: Collision prevention across different contexts
- **Token Usage Tracking**: Monitoring and cost estimation
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 🔧 Technical Implementation

#### Edge Function Architecture

```
supabase/functions/generate-story/
├── index.ts              # Main handler with CORS, auth, rate limiting
├── story-generator.ts    # Core AI generation logic with retries
├── prompt-templates.ts   # Genre-specific prompts and instructions
├── fallback-content.ts   # Pre-written content for AI failures
├── choice-utils.ts       # Choice slug generation and validation
├── content-safety.ts     # Content filtering by challenge level
├── rate-limiter.ts       # User and global rate limiting
├── usage-tracker.ts      # Token usage logging and monitoring
└── types.ts             # TypeScript interfaces and validation
```

#### Client-side Integration

```typescript
import { useStoryGeneration } from '@/lib/hooks/useStoryGeneration'

function StoryComponent() {
  const { startNewStory, isGenerating, rateLimitStatus } = useStoryGeneration({
    onSuccess: (story) => console.log('Story generated:', story),
    onError: (error) => console.error('Generation failed:', error)
  })

  const handleStart = () => {
    startNewStory({
      genre: 'fantasy',
      length: 'quick',
      challenge: 'casual'
    })
  }
}
```

## API Reference

### Story Generation Request

```typescript
interface StoryGenerationRequest {
  genre: 'fantasy' | 'mystery' | 'sci-fi'
  length: 'quick' | 'standard'
  challenge: 'casual' | 'challenging'
  userId?: string
  sessionId: string
  storyRunId?: string      // For continuing stories
  currentStep?: number     // For continuing stories
  gameState?: GameState    // For continuing stories
  previousChoice?: string  // For continuing stories
}
```

### Story Response

```typescript
interface StoryResponse {
  storyText: string
  choices: Choice[]
  gameState: GameState
  isEnding: boolean
  endingType?: EndingType
  endingTag?: string
}

interface Choice {
  id: string               // "A", "B", "C", "D"
  text: string
  slug: string            // Stable identifier like "trust_stranger"
  consequences?: string[]
  traits_impact?: Record<string, number>
}
```

## Rate Limiting

### Free Tier Limits
- **Authenticated Users**: 10 stories per day
- **Guest Users**: 3 stories per day
- **Global Limit**: 1000 requests per hour

### Premium Tier Limits
- **Premium Users**: 100 stories per day
- **Priority Processing**: Faster response times
- **Extended Features**: Longer stories, exclusive genres

## Content Safety

### Casual Challenge Level
- Strict content filtering
- Family-friendly language
- No violence or mature themes
- Positive conflict resolution

### Challenging Challenge Level
- Moderate content filtering
- More complex moral dilemmas
- Strategic decision-making
- Mature themes allowed

## Error Handling

### AI Generation Failures
1. **Primary Request**: Initial AI generation attempt
2. **Retry with Strict JSON**: If JSON parsing fails
3. **Fallback Content**: Pre-written bridge segments
4. **Graceful Degradation**: User-friendly error messages

### Rate Limiting
- Clear error messages with reset times
- Remaining request counts in headers
- Premium upgrade suggestions

### Content Safety
- Automatic content filtering
- Prohibited content detection
- Challenge-appropriate adjustments

## Database Schema

### Rate Limiting Tables
```sql
-- User rate limits (daily)
CREATE TABLE rate_limits (
  identifier VARCHAR(64),  -- userId or sessionId
  date DATE,
  requests_count INTEGER,
  is_guest BOOLEAN
);

-- Global rate limits (hourly)
CREATE TABLE global_rate_limits (
  hour VARCHAR(13),        -- YYYY-MM-DDTHH
  requests_count INTEGER
);
```

### Usage Tracking Tables
```sql
-- Token usage logs
CREATE TABLE token_usage_logs (
  user_id UUID,
  session_id VARCHAR(64),
  genre VARCHAR(50),
  tokens_used INTEGER,
  request_type VARCHAR(50)
);

-- Cost tracking
CREATE TABLE cost_tracking (
  user_id UUID,
  tokens_used INTEGER,
  estimated_cost DECIMAL(10,6),
  genre VARCHAR(50)
);
```

## Testing

### Unit Tests
- Choice utility functions
- Validation logic
- Error handling
- Rate limiting logic

### Integration Tests
- Edge Function endpoints
- Database operations
- AI service integration
- Content safety filters

### Example Test
```typescript
import { validateStoryRequest } from '../story-generation'

test('validates story request', () => {
  const request = {
    genre: 'fantasy',
    length: 'quick',
    challenge: 'casual',
    sessionId: 'test_session_123'
  }
  
  const errors = validateStoryRequest(request)
  expect(errors).toHaveLength(0)
})
```

## Environment Variables

### Required for Edge Function
```bash
OPENAI_API_KEY=sk-...           # OpenAI API key
SUPABASE_URL=https://...        # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...   # Service role key for RLS bypass
```

### Optional Configuration
```bash
STORY_GENERATION_DEBUG=true     # Enable debug logging
MAX_RETRIES=3                   # AI generation retry attempts
GLOBAL_HOURLY_LIMIT=1000        # Global rate limit per hour
```

## Deployment

### Edge Function Deployment
```bash
# Deploy the function
npx supabase functions deploy generate-story

# Set environment variables
npx supabase secrets set OPENAI_API_KEY=sk-...

# Test the function
npx supabase functions invoke generate-story --data '{"genre":"fantasy","length":"quick","challenge":"casual","sessionId":"test"}'
```

### Database Migration
```bash
# Apply the migration
npx supabase db push

# Verify tables were created
npx supabase db diff
```

## Monitoring

### Usage Metrics
- Token consumption per genre
- Request success/failure rates
- Average response times
- Rate limit hit rates

### Cost Tracking
- Daily/monthly token costs
- Cost per user/session
- Premium vs free tier usage
- ROI on AI spending

### Performance Monitoring
- Edge Function response times
- Database query performance
- AI API latency
- Error rates by type

## Future Enhancements

### Planned Features
- **Advanced Personalization**: User preference learning
- **Multi-language Support**: Internationalization
- **Voice Integration**: Text-to-speech capabilities
- **Image Generation**: AI-generated story illustrations
- **Collaborative Stories**: Multi-player story creation

### Technical Improvements
- **Caching Layer**: Redis for frequently accessed content
- **Load Balancing**: Multiple AI providers for redundancy
- **Real-time Updates**: WebSocket integration for live stories
- **Advanced Analytics**: ML-powered user behavior analysis