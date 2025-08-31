// @ts-ignore: Deno ESM import
import { StoryGenerationRequest, StoryResponse, StoryGenerationResult, validateStoryResponse, AIStoryResponse } from './types.ts'
import { getPromptTemplate } from './prompt-templates.ts'
import { getFallbackContent } from './fallback-content.ts'
import { generateChoiceSlug, generateDecisionKeyHash } from './choice-utils.ts'
import { applyContentSafetyFilter } from './content-safety.ts'

// @ts-ignore: Deno global
const GEMINI_API_KEY = Deno.env.get('OPENAI_API_KEY') // Using same env var for compatibility
const MAX_RETRIES = 3

export async function generateStoryContent(
  request: StoryGenerationRequest,
  supabase: any
): Promise<StoryGenerationResult> {
  let lastError: Error | null = null

  // Try AI generation with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptAIGeneration(request, attempt)

      // Apply content safety filters
      const filteredResult = await applyContentSafetyFilter(result.story, request.challenge)

      return {
        story: filteredResult,
        tokensUsed: result.tokensUsed
      }
    } catch (error) {
      console.warn(`AI generation attempt ${attempt} failed:`, error.message)
      lastError = error

      // If this is the last attempt, fall back to pre-generated content
      if (attempt === MAX_RETRIES) {
        console.log('All AI attempts failed, using fallback content')
        const fallbackStory = await getFallbackContent(request, supabase)
        return {
          story: fallbackStory,
          tokensUsed: 0 // No tokens used for fallback
        }
      }
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('Story generation failed')
}

async function attemptAIGeneration(
  request: StoryGenerationRequest,
  attempt: number
): Promise<StoryGenerationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const prompt = getPromptTemplate(request, attempt)

  // Combine system and user prompts for Gemini
  const combinedPrompt = `${prompt.systemPrompt}\n\n${prompt.userPrompt}\n\nPlease respond with valid JSON only.`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: combinedPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1500,
        topP: 0.8,
        topK: 10
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content received from Gemini')
  }

  // Extract JSON from response (Gemini might wrap it in markdown)
  let jsonContent = content
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    jsonContent = jsonMatch[1]
  }

  // Parse and validate JSON response
  let parsedResponse: any
  try {
    parsedResponse = JSON.parse(jsonContent)
  } catch (error) {
    throw new Error(`Invalid JSON response: ${error.message}`)
  }

  // Validate response structure
  const validatedResponse = validateStoryResponse(parsedResponse)

  // Transform to our internal format
  const story = transformAIResponse(validatedResponse, request)

  return {
    story,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0
  }
}

function transformAIResponse(aiResponse: AIStoryResponse, request: StoryGenerationRequest): StoryResponse {
  // Generate choice slugs and ensure proper IDs
  const choices = aiResponse.choices.map((choice, index) => ({
    id: choice.id || ['A', 'B', 'C', 'D'][index],
    text: choice.text,
    slug: choice.slug || generateChoiceSlug(choice.text),
    consequences: choice.consequences,
    traits_impact: choice.traits_impact || {}
  }))

  // Transform game state
  const gameState = {
    act: aiResponse.game_state.act,
    flags: aiResponse.game_state.flags,
    relationships: aiResponse.game_state.relationships,
    inventory: aiResponse.game_state.inventory,
    personalityTraits: aiResponse.game_state.personality_traits
  }

  // Safely cast ending_type to EndingType
  const validEndingTypes = ['heroic', 'tragic', 'mysterious', 'triumphant', 'bittersweet']
  const endingType = aiResponse.ending_type && validEndingTypes.includes(aiResponse.ending_type)
    ? aiResponse.ending_type as any
    : undefined

  return {
    storyText: aiResponse.story_text,
    choices,
    gameState,
    isEnding: aiResponse.is_ending,
    endingType,
    endingTag: aiResponse.ending_tag
  }
}