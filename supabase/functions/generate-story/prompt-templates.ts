import { StoryGenerationRequest } from './types.ts'

export interface PromptTemplate {
  systemPrompt: string
  userPrompt: string
}

export function getPromptTemplate(request: StoryGenerationRequest, attempt: number): PromptTemplate {
  const baseSystemPrompt = getBaseSystemPrompt(request.genre, request.challenge)
  const strictJsonInstructions = attempt > 1 ? getStrictJsonInstructions() : ''
  
  return {
    systemPrompt: baseSystemPrompt + strictJsonInstructions,
    userPrompt: getUserPrompt(request)
  }
}

function getBaseSystemPrompt(genre: string, challenge: string): string {
  const genrePrompts = {
    fantasy: `You are a master storyteller creating immersive fantasy adventures. Your stories feature:
- Rich magical worlds with detailed lore
- Compelling characters with clear motivations
- Meaningful choices that impact relationships and story outcomes
- Vivid descriptions that bring the world to life
- ${challenge === 'challenging' ? 'Complex moral dilemmas and strategic decisions' : 'Clear heroic choices and straightforward conflicts'}`,

    mystery: `You are a skilled mystery writer crafting engaging detective stories. Your stories feature:
- Intriguing puzzles and clues for the reader to discover
- Suspicious characters with hidden motives
- Red herrings and plot twists that surprise but make sense
- Atmospheric settings that enhance the mystery
- ${challenge === 'challenging' ? 'Complex investigations requiring careful deduction' : 'Clear clues and logical progression'}`,

    'sci-fi': `You are a visionary science fiction author creating thought-provoking futures. Your stories feature:
- Innovative technology and its impact on society
- Exploration of human nature in extraordinary circumstances
- Ethical dilemmas posed by scientific advancement
- Vivid alien worlds or futuristic settings
- ${challenge === 'challenging' ? 'Complex philosophical questions and hard choices' : 'Clear conflicts between progress and humanity'}`,

    horror: `You are a master of psychological horror creating spine-chilling narratives. Your stories feature:
- Building tension and atmospheric dread
- Psychological elements that unsettle the reader
- Supernatural or unexplained phenomena
- Characters facing their deepest fears
- ${challenge === 'challenging' ? 'Complex psychological horror and moral ambiguity' : 'Classic horror tropes with clear threats'}`,

    romance: `You are a skilled romance writer creating emotionally engaging love stories. Your stories feature:
- Deep emotional connections between characters
- Relationship development and romantic tension
- Personal growth through love and connection
- Meaningful relationship choices and consequences
- ${challenge === 'challenging' ? 'Complex relationship dynamics and emotional dilemmas' : 'Clear romantic progression and heartwarming moments'}`,

    thriller: `You are an expert thriller writer creating high-stakes suspense stories. Your stories feature:
- Fast-paced action and mounting tension
- Dangerous situations and time pressure
- Conspiracy, betrayal, and hidden agendas
- Characters under extreme pressure
- ${challenge === 'challenging' ? 'Complex conspiracies and morally ambiguous choices' : 'Clear threats and heroic action sequences'}`
  }

  return `${genrePrompts[genre as keyof typeof genrePrompts]}

CRITICAL REQUIREMENTS:
1. Always respond with valid JSON matching this exact schema:
{
  "story_text": "string (200-400 words)",
  "choices": [
    {
      "id": "A",
      "text": "string (10-50 words)",
      "slug": "string (snake_case identifier like 'trust_stranger')",
      "consequences": ["string array (optional)"],
      "traits_impact": {"trait_name": number} (optional, -2 to +2)
    }
  ],
  "game_state": {
    "act": number (1-3),
    "flags": ["string array"],
    "relationships": {"character_name": number},
    "inventory": ["string array"],
    "personality_traits": {"riskTaking": number, "empathy": number, "pragmatism": number, "creativity": number, "leadership": number}
  },
  "is_ending": boolean,
  "ending_type": "string (if is_ending is true)",
  "ending_tag": "string (if is_ending is true, snake_case like 'heroic_sacrifice')"
}

2. Provide exactly 3 choices (A, B, C) unless it's an ending
3. Each choice must have a unique, descriptive slug in snake_case
4. Personality traits range from -5 to +5, with 0 being neutral
5. Story text should be engaging and advance the plot meaningfully
6. Choices should lead to meaningfully different outcomes`
}

function getStrictJsonInstructions(): string {
  return `

STRICT JSON FORMATTING (Previous attempt failed):
- Use double quotes for all strings
- No trailing commas
- No comments in JSON
- Ensure all required fields are present
- Validate JSON structure before responding
- If unsure, use simpler values but maintain the exact schema`
}

function getUserPrompt(request: StoryGenerationRequest): string {
  if (request.currentStep && request.gameState) {
    // Continuing an existing story
    return `Continue this ${request.genre} story (${request.length} length, ${request.challenge} difficulty).

Current game state: ${JSON.stringify(request.gameState)}
Current step: ${request.currentStep}
Previous choice: ${request.previousChoice || 'None'}

Generate the next story segment that:
1. Acknowledges the previous choice's consequences
2. Advances the plot meaningfully
3. Maintains consistency with established game state
4. Provides 3 compelling new choices
5. ${request.length === 'quick' ? 'Moves toward conclusion (aim for 4-6 total steps)' : 
     request.length === 'extended' ? 'Develops the story with rich detail (aim for 12-18 total steps)' : 
     'Develops the story further (aim for 8-12 total steps)'}

Remember to update game_state appropriately and set is_ending=true if this should be the final segment.`
  } else {
    // Starting a new story
    return `Create the opening of a ${request.genre} interactive story (${request.length} length, ${request.challenge} difficulty).

Requirements:
1. Engaging opening that immediately draws the reader in
2. Clear setting and initial situation
3. Introduce the main character (use "you" perspective)
4. Present 3 meaningful choices that set different story directions
5. Initialize game_state with appropriate starting values
6. ${request.length === 'quick' ? 'Set up for a 4-6 step story' : 
     request.length === 'extended' ? 'Set up for a 12-18 step immersive story' : 
     'Set up for an 8-12 step story'}

The story should start with immediate action or an intriguing situation that demands a choice.`
  }
}