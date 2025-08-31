# Story Flow and Game State Management

This module implements the core story flow and game state management system for the Interactive Story Generator. It provides a complete solution for creating, managing, and progressing through interactive narratives with personality tracking and choice analytics.

## Overview

The story flow system consists of several key components:

- **StoryFlowService**: Core service for managing story sessions and progression
- **useStorySession**: React hook for story session management in components
- **Game State Utilities**: Helper functions for managing game state immutably
- **Personality Tracking**: System for tracking and updating user personality traits

## Key Features

### Story Session Management
- Create new story sessions with AI-generated content
- Load and resume existing story sessions
- Track story progress and completion status
- Handle both authenticated and anonymous users

### Game State Tracking
- **Flags**: Track story events and conditions
- **Relationships**: Manage character relationships (-100 to +100)
- **Inventory**: Track items collected during the story
- **Acts**: Progress through story acts (1-5)
- **Personality Traits**: Track 5 core personality dimensions

### Choice Handling
- Record choice selections with analytics tracking
- Apply choice consequences to game state
- Update personality traits based on choice impact
- Progress story based on player decisions

### Ending Detection
- Automatic story completion detection
- Ending classification (heroic, tragic, mysterious, etc.)
- Rarity calculation based on game state complexity
- Ending cataloging for collection mechanics

## Usage

### Basic Story Session

```typescript
import { useStorySession } from '@/lib/hooks/useStorySession'

function StoryComponent() {
  const {
    currentSession,
    startNewStory,
    selectChoice,
    canMakeChoice,
    availableChoices,
    isProcessing
  } = useStorySession({
    onStoryProgression: (result) => {
      console.log('Story progressed:', result)
    },
    onStoryCompleted: (session) => {
      console.log('Story completed:', session)
    }
  })

  const handleStartStory = () => {
    startNewStory({
      genre: 'fantasy',
      length: 'standard',
      challenge: 'casual'
    })
  }

  const handleChoiceSelect = (choice) => {
    selectChoice(choice.id, choice.slug)
  }

  // Render story UI...
}
```

### Direct Service Usage

```typescript
import { StoryFlowService } from '@/lib/story/story-flow'

// Create a new story session
const session = await StoryFlowService.createStorySession({
  genre: 'mystery',
  length: 'quick',
  challenge: 'challenging',
  sessionId: 'session_123',
  userId: 'user_456'
}, 'user_456')

// Load existing session
const existingSession = await StoryFlowService.loadStorySession('story-run-id')

// Select a choice and progress the story
const result = await StoryFlowService.selectChoice(
  'story-run-id',
  'step-id',
  'A',
  'trust_stranger'
)
```

### Game State Management

```typescript
import {
  addFlag,
  setRelationship,
  addItem,
  applyConsequences,
  updatePersonalityTraits
} from '@/lib/utils/game-state'

// Immutable game state updates
const newState = addFlag(gameState, 'met_wizard')
const withRelationship = setRelationship(newState, 'wizard', 75)
const withItem = addItem(withRelationship, 'magic_sword')

// Apply multiple consequences
const consequences = [
  'add_flag:quest_complete',
  'modify_relationship:wizard:25',
  'add_item:reward'
]
const updatedState = applyConsequences(gameState, consequences)

// Update personality traits
const newTraits = updatePersonalityTraits(currentTraits, {
  riskTaking: 10,
  empathy: -5
})
```

## Data Models

### StorySession
```typescript
interface StorySession {
  storyRun: StoryRun           // Database record
  currentStep: StoryStep | null // Current story step
  gameState: GameState         // Current game state
  personalityTraits: PersonalityTraits // Current traits
  isCompleted: boolean         // Completion status
}
```

### GameState
```typescript
interface GameState {
  act: number                           // Current story act (1-5)
  flags: string[]                       // Story event flags
  relationships: Record<string, number> // Character relationships
  inventory: string[]                   // Items collected
  personalityTraits: PersonalityTraits  // Current personality state
}
```

### PersonalityTraits
```typescript
interface PersonalityTraits {
  riskTaking: number  // 0-100: Cautious to Bold
  empathy: number     // 0-100: Detached to Compassionate
  pragmatism: number  // 0-100: Idealistic to Results-oriented
  creativity: number  // 0-100: Conventional to Innovative
  leadership: number  // 0-100: Follower to Leader
}
```

## Choice Consequences

The system supports various consequence types that modify game state:

- `add_flag:flag_name` - Add a story flag
- `remove_flag:flag_name` - Remove a story flag
- `set_relationship:character:value` - Set relationship to specific value
- `modify_relationship:character:change` - Modify relationship by amount
- `add_item:item_name` - Add item to inventory
- `remove_item:item_name` - Remove item from inventory
- `increment_act` - Progress to next story act

Example choice with consequences:
```typescript
{
  id: 'A',
  text: 'Trust the mysterious stranger',
  slug: 'trust_stranger',
  consequences: [
    'add_flag:trusted_stranger',
    'modify_relationship:stranger:25',
    'add_item:mysterious_key'
  ],
  traits_impact: {
    riskTaking: 10,
    empathy: 5
  }
}
```

## Personality System

The personality system tracks 5 core traits that evolve based on player choices:

### Trait Descriptions
- **Risk Taking**: Measures willingness to take chances vs. cautious approach
- **Empathy**: Measures concern for others vs. self-focused decisions
- **Pragmatism**: Measures practical vs. idealistic decision-making
- **Creativity**: Measures innovative vs. conventional problem-solving
- **Leadership**: Measures tendency to lead vs. follow others

### Trait Levels
- **0-32**: Low (e.g., "Cautious and careful")
- **33-66**: Medium (e.g., "Balanced risk assessment")
- **67-100**: High (e.g., "Bold and adventurous")

## Ending System

### Ending Types
- **Heroic**: Positive outcomes with noble choices
- **Tragic**: Sacrifice or loss for greater good
- **Mysterious**: Secrets revealed or puzzles solved
- **Triumphant**: Complete victory and success
- **Bittersweet**: Mixed outcomes with costs

### Rarity Calculation
Ending rarity is calculated based on game state complexity:
- **Common**: Basic story completion (0-9 points)
- **Uncommon**: Some complexity (10-19 points)
- **Rare**: High complexity (20-29 points)
- **Ultra-Rare**: Maximum complexity (30+ points)

Complexity factors:
- Number of story flags (2 points each)
- Number of relationships (3 points each)
- Number of inventory items (2 points each)
- Story act reached (5 points each)

## Error Handling

The system includes comprehensive error handling:

- **Story Creation Failures**: Graceful fallback to retry or error state
- **AI Generation Errors**: Fallback content system with bridge segments
- **Database Errors**: Proper error propagation with user-friendly messages
- **Validation Errors**: Input validation with detailed error messages

## Testing

The system includes comprehensive test coverage:

```bash
# Run story flow tests
npm test -- src/lib/story/__tests__/story-flow.test.ts

# Run game state utility tests
npm test -- src/lib/utils/__tests__/game-state.test.ts
```

## Performance Considerations

- **Immutable Updates**: All game state updates are immutable for predictable behavior
- **Efficient Queries**: Database queries are optimized with proper indexing
- **Caching**: TanStack Query provides automatic caching for story sessions
- **Analytics**: Choice statistics are tracked asynchronously to avoid blocking

## Security

- **Row Level Security**: Database policies ensure users can only access their own data
- **Input Validation**: All inputs are validated before processing
- **Session Management**: Secure session handling for both authenticated and anonymous users
- **Data Sanitization**: Game state is sanitized before storage to prevent corruption

## Future Enhancements

- **Branching Narratives**: Support for complex story branching
- **Dynamic Difficulty**: Adjust story complexity based on player preferences
- **Social Features**: Compare personality profiles with friends
- **Achievement System**: Unlock achievements based on story completion patterns
- **Story Templates**: Pre-built story templates for faster generation