# Core Data Models and Validation

This directory contains the core data models, validation schemas, and database operations for the Interactive Story Generator.

## Overview

The system implements a robust data layer with:
- TypeScript interfaces for type safety
- Zod schemas for runtime validation
- CRUD operations for database entities
- Validation with graceful error handling and retry logic
- Utilities for session management and data integrity

## Key Components

### 1. Type Definitions (`/types/`)

**Story Types** (`src/types/story.ts`):
- `StoryRun`: Complete story session entity
- `StoryStep`: Individual choice points in a story
- `Choice`: User choice options with personality impacts
- `GameState`: Current story state (flags, inventory, relationships)
- `PersonalityTraits`: User personality scoring system

**Database Types** (`src/types/database.ts`):
- Auto-generated from Supabase schema
- Provides type safety for all database operations

### 2. Validation Schemas (`/validation/schemas.ts`)

Zod schemas for runtime validation:
```typescript
import { StoryResponseSchema, validateStoryResponse } from '@/lib/validation/schemas'

// Validate AI-generated story content
const result = validateStoryResponse(aiResponse)
if (result.success) {
  // Use validated data
  console.log(result.data.storyText)
}
```

### 3. Database Operations (`/supabase/queries.ts`)

Type-safe CRUD operations:
```typescript
import { StoryRunQueries, StoryStepQueries } from '@/lib/supabase/queries'

// Create a new story run
const storyRun = await StoryRunQueries.create({
  genre: 'fantasy',
  length: 'quick',
  challenge: 'casual',
  session_id: sessionId
})

// Add a story step
const step = await StoryStepQueries.create({
  story_run_id: storyRun.id,
  step_number: 1,
  story_text: 'Your adventure begins...',
  choices: validatedChoices,
  game_state: currentGameState
})
```

### 4. Validation with Retry Logic (`/validation/story-validator.ts`)

Handles AI response validation with automatic retry:
```typescript
import { StoryValidator, validateWithRetry } from '@/lib/validation/story-validator'

// Validate with retry logic
const result = await validateWithRetry(
  () => callAIService(),
  StoryValidator.validateStoryResponse,
  { maxRetries: 3, retryDelay: 1000 }
)
```

### 5. React Hook for Validation (`/hooks/useStoryValidation.ts`)

React hook for component-level validation:
```typescript
import { useStoryValidation } from '@/lib/hooks/useStoryValidation'

function StoryComponent() {
  const { validateStoryResponse, isValidating, validationErrors } = useStoryValidation({
    onValidationError: (errors) => console.error('Validation failed:', errors)
  })

  const generateStory = async () => {
    const result = await validateStoryResponse(() => callAI())
    if (result.success) {
      setStory(result.data)
    }
  }
}
```

## Data Flow

1. **Story Generation Request**: User selects preferences → validated with `StoryGenerationRequestSchema`
2. **AI Response**: AI generates story → validated with `StoryResponseSchema` + retry logic
3. **Database Storage**: Validated data stored via `StoryRunQueries` and `StoryStepQueries`
4. **Choice Tracking**: User choices recorded with `ChoiceStatsQueries` for analytics
5. **Error Handling**: Invalid responses trigger retry with fallback content

## Validation Features

### Automatic Repair
The validator attempts to repair common AI response issues:
- Missing or malformed choice IDs → generates stable IDs (A, B, C, D)
- Invalid game state → provides sensible defaults
- Malformed personality traits → resets to neutral values (50)

### Retry Logic
- Configurable retry attempts (default: 3)
- Exponential backoff delays
- Distinguishes between retryable and fatal errors
- Fallback to pre-generated content on final failure

### Error Reporting
- Detailed validation error messages
- User-friendly error handling in UI components
- Non-blocking analytics (choice statistics don't fail user experience)

## Database Schema Integration

The validation schemas align with the PostgreSQL schema:
- Row Level Security (RLS) policies for data isolation
- Generated columns for fast personality analytics
- Materialized views for choice statistics performance
- Proper indexing for common query patterns

## Usage Examples

### Basic Story Generation
```typescript
import { StoryRunQueries, validateStoryResponse } from '@/lib'

// Create story run
const run = await StoryRunQueries.create({
  genre: 'fantasy',
  length: 'quick',
  challenge: 'casual',
  session_id: generateSessionId()
})

// Validate AI response
const validation = validateStoryResponse(aiResponse)
if (validation.success) {
  // Store validated story step
  await StoryStepQueries.create({
    story_run_id: run.id,
    step_number: 1,
    story_text: validation.data.storyText,
    choices: validation.data.choices,
    game_state: validation.data.gameState
  })
}
```

### Choice Statistics Tracking
```typescript
import { ChoiceStatsQueries } from '@/lib'

// Track choice impression (when displayed)
await ChoiceStatsQueries.incrementImpressions('trust_stranger', 'A', 'fantasy')

// Track choice selection (when clicked)
await ChoiceStatsQueries.incrementSelections('trust_stranger', 'A', 'fantasy')

// Get statistics for display
const stats = await ChoiceStatsQueries.getChoiceStatistics('trust_stranger', 'fantasy')
```

## Testing

Run validation tests:
```bash
npm test
```

The test suite covers:
- Valid data validation
- Invalid data rejection
- Automatic repair functionality
- Edge cases and error conditions

## Scripts

- `npm run db:types` - Regenerate database types from Supabase
- `npm test` - Run validation tests
- `npm run type-check` - TypeScript type checking