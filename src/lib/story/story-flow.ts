import { supabase } from '../supabase/client'
import { StoryRunQueries, StoryStepQueries, UserProfileQueries, ChoiceStatsQueries } from '../supabase/queries'
import { generateStory } from '../ai/story-generation'
import { detectEnding, type EndingClassification } from '../endings/ending-detection'
import { EndingCollectionQueries } from '../endings/ending-queries'
import { 
  safeGetGameState, 
  safeGetPersonalityTraits, 
  safeParseJson,
  isDatabaseRow,
  toJson
} from '../utils/type-safety'
import type { Json } from '../../types/database'
import type { 
  StoryRun, 
  StoryStep, 
  StoryGenerationRequest, 
  StoryResponse, 
  GameState, 
  PersonalityTraits, 
  Choice,
  EndingType,
  EndingRarity
} from '../../types/story'

export interface StorySession {
  storyRun: StoryRun
  currentStep: StoryStep | null
  gameState: GameState
  personalityTraits: PersonalityTraits
  isCompleted: boolean
}

export interface StoryProgressionResult {
  session: StorySession
  newStep: StoryStep
  isEnding: boolean
  endingData?: {
    title: string
    rarity: string
    tag: string
    type: EndingType
  }
}

export interface ChoiceSelectionResult {
  updatedStep: StoryStep
  progressionResult?: StoryProgressionResult
}

/**
 * Core story flow management service
 */
export class StoryFlowService {
  /**
   * Create a new story session
   */
  static async createStorySession(
    request: StoryGenerationRequest
  ): Promise<StorySession> {
    try {
      // Create the story run record
      const storyRun = await StoryRunQueries.create({
        user_id: request.userId || null,
        session_id: request.sessionId,
        genre: request.genre,
        length: request.length,
        challenge: request.challenge
      })

      if (!storyRun) {
        throw new Error('Failed to create story run')
      }

      // Generate the initial story content
      const storyResult = await generateStory(request)
      
      // Initialize game state and personality traits
      const initialGameState: GameState = storyResult.story.gameState || {
        act: 1,
        flags: ['story_started'],
        relationships: {},
        inventory: [],
        personalityTraits: {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      const initialTraits: PersonalityTraits = {
        riskTaking: initialGameState.personalityTraits.riskTaking || 50,
        empathy: initialGameState.personalityTraits.empathy || 50,
        pragmatism: initialGameState.personalityTraits.pragmatism || 50,
        creativity: initialGameState.personalityTraits.creativity || 50,
        leadership: initialGameState.personalityTraits.leadership || 50
      }

      // Create the first story step
      const firstStep = await StoryStepQueries.create({
        story_run_id: storyRun.id,
        step_number: 1,
        story_text: storyResult.story.storyText,
        choices: storyResult.story.choices,
        game_state: initialGameState,
        traits_snapshot: initialTraits,
        choice_slug: this.generateStepChoiceSlug(storyResult.story.choices),
        decision_key_hash: this.generateDecisionKeyHash(storyRun.id, 1, storyResult.story.choices)
      })

      if (!firstStep) {
        throw new Error('Failed to create initial story step')
      }

      // Track choice impressions for all options
      await this.trackChoiceImpressions(storyResult.story.choices, request.genre)

      return {
        storyRun,
        currentStep: firstStep,
        gameState: initialGameState,
        personalityTraits: initialTraits,
        isCompleted: false
      }
    } catch (error) {
      console.error('Error creating story session:', error)
      throw new Error(`Failed to create story session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load an existing story session
   */
  static async loadStorySession(storyRunId: string): Promise<StorySession | null> {
    try {
      const storyRun = await StoryRunQueries.getById(storyRunId)
      if (!storyRun) {
        return null
      }

      const currentStep = await StoryStepQueries.getLatestStep(storyRunId)
      
      const defaultGameState: GameState = {
        act: 1,
        flags: [],
        relationships: {},
        inventory: [],
        personalityTraits: {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      const gameState: GameState = currentStep?.game_state 
        ? safeGetGameState(currentStep.game_state as unknown as Json)
        : defaultGameState

      const personalityTraits: PersonalityTraits = currentStep?.traits_snapshot 
        ? safeGetPersonalityTraits(currentStep.traits_snapshot as unknown as Json)
        : gameState.personalityTraits as unknown as PersonalityTraits

      return {
        storyRun,
        currentStep,
        gameState,
        personalityTraits,
        isCompleted: storyRun.completed || false
      }
    } catch (error) {
      console.error('Error loading story session:', error)
      throw new Error(`Failed to load story session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handle choice selection and update game state
   */
  static async selectChoice(
    storyRunId: string,
    stepId: string,
    choiceId: string,
    choiceSlug: string
  ): Promise<ChoiceSelectionResult> {
    try {
      // Get current session
      const session = await this.loadStorySession(storyRunId)
      if (!session || !session.currentStep) {
        throw new Error('Story session not found')
      }

      // Find the selected choice - safely parse choices array
      const choicesData = session.currentStep.choices
      const choices: Choice[] = Array.isArray(choicesData) ? choicesData : []
      const selectedChoice = choices.find(c => c && typeof c === 'object' && 'id' in c && c.id === choiceId)
      if (!selectedChoice) {
        throw new Error('Selected choice not found')
      }

      // Update the step with the selected choice
      const updatedStep = await StoryStepQueries.recordChoice(stepId, choiceId, choiceSlug)
      if (!updatedStep) {
        throw new Error('Failed to record choice selection')
      }

      // Track choice selection statistics
      await ChoiceStatsQueries.incrementSelections(choiceSlug, choiceId, session.storyRun.genre)

      // Update personality traits based on choice impact
      const updatedTraits = this.updatePersonalityTraits(
        session.personalityTraits,
        selectedChoice.traits_impact || {}
      )

      // Update user profile for authenticated users only
      if (session.storyRun.user_id) {
        await UserProfileQueries.updatePersonalityTraits(session.storyRun.user_id, toJson(updatedTraits))
        await UserProfileQueries.incrementChoiceCount(session.storyRun.user_id)
      }

      // Check if we should continue the story
      const shouldContinue = !session.isCompleted && session.currentStep.step_number < this.getMaxStepsForLength(session.storyRun.length)

      let progressionResult: StoryProgressionResult | undefined

      if (shouldContinue) {
        progressionResult = await this.progressStory(session, selectedChoice, updatedTraits)
      }

      return {
        updatedStep,
        progressionResult
      }
    } catch (error) {
      console.error('Error selecting choice:', error)
      throw new Error(`Failed to select choice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Progress the story to the next step
   */
  static async progressStory(
    session: StorySession,
    selectedChoice: Choice,
    updatedTraits: PersonalityTraits
  ): Promise<StoryProgressionResult> {
    try {
      // Update game state based on choice consequences
      const updatedGameState = this.updateGameState(session.gameState, selectedChoice, updatedTraits)

      // Generate next story content
      const nextStepNumber = (session.currentStep?.step_number || 0) + 1
      const storyRequest: StoryGenerationRequest = {
        genre: session.storyRun.genre as 'fantasy' | 'mystery' | 'sci-fi',
        length: session.storyRun.length as 'quick' | 'standard',
        challenge: session.storyRun.challenge as 'casual' | 'challenging',
        sessionId: `${session.storyRun.id}_${nextStepNumber}`,
        userId: session.storyRun.user_id || ''
      }

      // Add context for story continuation
      const continueRequest = {
        ...storyRequest,
        storyRunId: session.storyRun.id,
        currentStep: nextStepNumber,
        gameState: updatedGameState,
        previousChoice: selectedChoice.text
      }

      const storyResult = await generateStory(continueRequest)

      // Use the new ending detection system
      const endingDetection = detectEnding(
        storyResult.story.storyText,
        updatedGameState,
        updatedTraits,
        session.storyRun.genre,
        session.storyRun.length
      )

      const isEnding = endingDetection.isEnding || 
                      nextStepNumber >= this.getMaxStepsForLength(session.storyRun.length)

      let endingData: StoryProgressionResult['endingData']

      if (isEnding && endingDetection.classification) {
        const classification = endingDetection.classification
        
        endingData = {
          title: classification.title,
          rarity: classification.rarity,
          tag: classification.endingTag,
          type: this.mapCategoryToEndingType(classification.category)
        }
        
        // Mark story as completed
        await StoryRunQueries.markCompleted(session.storyRun.id, {
          ending_title: endingData.title,
          ending_rarity: endingData.rarity,
          ending_tag: endingData.tag
        })

        // Record ending discovery
        try {
          if (session.storyRun.user_id) {
            await EndingCollectionQueries.recordEndingDiscovery(
              session.storyRun.user_id,
              session.storyRun.id,
              endingData.tag,
              endingData.title,
              endingData.rarity as EndingRarity,
              session.storyRun.genre
            )
          }
        } catch (error) {
          console.error('Error recording ending discovery:', error)
          // Don't throw - this is non-critical for story flow
        }
      }

      // Create the next story step
      const newStep = await StoryStepQueries.create({
        story_run_id: session.storyRun.id,
        step_number: nextStepNumber,
        story_text: storyResult.story.storyText,
        choices: isEnding ? [] : storyResult.story.choices,
        game_state: updatedGameState,
        traits_snapshot: updatedTraits,
        choice_slug: isEnding ? undefined : this.generateStepChoiceSlug(storyResult.story.choices),
        decision_key_hash: isEnding ? undefined : this.generateDecisionKeyHash(session.storyRun.id, nextStepNumber, storyResult.story.choices)
      })

      if (!newStep) {
        throw new Error('Failed to create next story step')
      }

      // Track choice impressions for new choices (if not ending)
      if (!isEnding && storyResult.story.choices.length > 0) {
        await this.trackChoiceImpressions(storyResult.story.choices, session.storyRun.genre)
      }

      // Update session
      const updatedSession: StorySession = {
        ...session,
        currentStep: newStep,
        gameState: updatedGameState,
        personalityTraits: updatedTraits,
        isCompleted: isEnding
      }

      return {
        session: updatedSession,
        newStep,
        isEnding,
        endingData
      }
    } catch (error) {
      console.error('Error progressing story:', error)
      throw new Error(`Failed to progress story: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update game state based on choice consequences
   */
  private static updateGameState(
    currentState: GameState,
    selectedChoice: Choice,
    updatedTraits: PersonalityTraits
  ): GameState {
    const newState: GameState = {
      ...currentState,
      personalityTraits: updatedTraits as unknown as Record<string, number>
    }

    // Process choice consequences
    if (selectedChoice.consequences) {
      for (const consequence of selectedChoice.consequences) {
        this.applyConsequence(newState, consequence)
      }
    }

    // Increment act if certain conditions are met
    if (this.shouldIncrementAct(newState, selectedChoice)) {
      newState.act += 1
    }

    return newState
  }

  /**
   * Apply a single consequence to game state
   */
  private static applyConsequence(gameState: GameState, consequence: string): void {
    // Parse consequence string and apply changes
    // Format examples: "add_flag:met_wizard", "set_relationship:wizard:10", "add_item:magic_sword"
    
    const [action, ...params] = consequence.split(':')
    
    switch (action) {
      case 'add_flag':
        if (params[0] && !gameState.flags.includes(params[0])) {
          gameState.flags.push(params[0])
        }
        break
        
      case 'remove_flag':
        if (params[0]) {
          gameState.flags = gameState.flags.filter(flag => flag !== params[0])
        }
        break
        
      case 'set_relationship':
        if (params[0] && params[1]) {
          gameState.relationships[params[0]] = parseInt(params[1], 10) || 0
        }
        break
        
      case 'modify_relationship':
        if (params[0] && params[1]) {
          const current = gameState.relationships[params[0]] || 0
          const change = parseInt(params[1], 10) || 0
          gameState.relationships[params[0]] = Math.max(-100, Math.min(100, current + change))
        }
        break
        
      case 'add_item':
        if (params[0] && !gameState.inventory.includes(params[0])) {
          gameState.inventory.push(params[0])
        }
        break
        
      case 'remove_item':
        if (params[0]) {
          gameState.inventory = gameState.inventory.filter(item => item !== params[0])
        }
        break
    }
  }

  /**
   * Update personality traits based on choice impact
   */
  private static updatePersonalityTraits(
    currentTraits: PersonalityTraits,
    impact: Record<string, number>
  ): PersonalityTraits {
    const updated = { ...currentTraits }
    
    for (const [trait, change] of Object.entries(impact)) {
      if (trait in updated) {
        const current = updated[trait as keyof PersonalityTraits]
        updated[trait as keyof PersonalityTraits] = Math.max(0, Math.min(100, current + change))
      }
    }
    
    return updated
  }

  /**
   * Check if act should be incremented
   */
  private static shouldIncrementAct(gameState: GameState, selectedChoice: Choice): boolean {
    // Increment act based on story flags or major story beats
    const majorFlags = ['completed_first_quest', 'reached_midpoint', 'final_confrontation']
    return majorFlags.some(flag => gameState.flags.includes(flag))
  }

  /**
   * Detect if story should end based on game state
   */
  private static detectStoryEnding(gameState: GameState, storyResponse: StoryResponse): boolean {
    // Check for ending flags
    const endingFlags = ['story_complete', 'hero_dies', 'villain_defeated', 'mystery_solved']
    const hasEndingFlag = endingFlags.some(flag => gameState.flags.includes(flag))
    
    // Check if explicitly marked as ending in AI response
    const isAIEnding = storyResponse.isEnding
    
    // Check if we've reached final act
    const isFinalAct = gameState.act >= 3
    
    return hasEndingFlag || isAIEnding || isFinalAct
  }

  /**
   * Generate ending data based on game state and story
   */
  private static generateEndingData(
    gameState: GameState,
    storyResponse: StoryResponse
  ): NonNullable<StoryProgressionResult['endingData']> {
    // Use AI-provided ending data if available
    if (storyResponse.endingType && 'endingTag' in storyResponse && storyResponse.endingTag) {
      return {
        title: this.generateEndingTitle(gameState, storyResponse.endingType),
        rarity: this.calculateEndingRarity(gameState),
        tag: storyResponse.endingTag as string,
        type: storyResponse.endingType
      }
    }
    
    // Generate ending based on game state
    const endingType = this.determineEndingType(gameState)
    const endingTag = this.generateEndingTag(gameState, endingType)
    
    return {
      title: this.generateEndingTitle(gameState, endingType),
      rarity: this.calculateEndingRarity(gameState),
      tag: endingTag,
      type: endingType
    }
  }

  /**
   * Determine ending type based on game state
   */
  private static determineEndingType(gameState: GameState): EndingType {
    const { flags, relationships } = gameState
    
    if (flags.includes('hero_dies') || flags.includes('tragic_sacrifice')) {
      return 'tragic'
    }
    
    if (flags.includes('villain_defeated') && flags.includes('peace_restored')) {
      return 'triumphant'
    }
    
    if (flags.includes('mystery_solved') || flags.includes('truth_revealed')) {
      return 'mysterious'
    }
    
    const avgRelationship = Object.values(relationships).reduce((sum, val) => sum + val, 0) / Object.keys(relationships).length
    
    if (avgRelationship > 50) {
      return 'heroic'
    }
    
    return 'bittersweet'
  }

  /**
   * Generate ending tag for cataloging
   */
  private static generateEndingTag(gameState: GameState, endingType: EndingType): string {
    const keyFlags = gameState.flags.filter(flag => 
      ['villain_defeated', 'hero_dies', 'mystery_solved', 'peace_restored', 'tragic_sacrifice'].includes(flag)
    )
    
    if (keyFlags.length > 0) {
      return `${endingType}_${keyFlags[0]}`
    }
    
    return `${endingType}_default`
  }

  /**
   * Generate human-readable ending title
   */
  private static generateEndingTitle(gameState: GameState, endingType: EndingType): string {
    const titles = {
      heroic: ['The Hero\'s Victory', 'Triumph of Good', 'Light Conquers Darkness'],
      tragic: ['The Ultimate Sacrifice', 'A Hero\'s End', 'Darkness Falls'],
      mysterious: ['The Truth Revealed', 'Secrets Unveiled', 'The Final Mystery'],
      triumphant: ['Victory Complete', 'Peace Restored', 'The Golden Ending'],
      bittersweet: ['A Pyrrhic Victory', 'The Price of Success', 'What Was Lost']
    }
    
    const typeOptions = titles[endingType] || titles.bittersweet
    return typeOptions[Math.floor(Math.random() * typeOptions.length)]
  }

  /**
   * Calculate ending rarity based on game state complexity
   */
  private static calculateEndingRarity(gameState: GameState): string {
    let rarityScore = 0
    
    // More flags = rarer ending
    rarityScore += gameState.flags.length * 2
    
    // More relationships = rarer ending
    rarityScore += Object.keys(gameState.relationships).length * 3
    
    // More items = rarer ending
    rarityScore += gameState.inventory.length * 2
    
    // Higher act = rarer ending
    rarityScore += gameState.act * 5
    
    if (rarityScore >= 30) return 'ultra-rare'
    if (rarityScore >= 20) return 'rare'
    if (rarityScore >= 10) return 'uncommon'
    return 'common'
  }

  /**
   * Get maximum steps for story length
   */
  private static getMaxStepsForLength(length: string): number {
    switch (length) {
      case 'quick': return 6
      case 'standard': return 10
      default: return 8
    }
  }

  /**
   * Generate choice slug for step identification
   */
  private static generateStepChoiceSlug(choices: Choice[]): string {
    if (choices.length === 0) return 'no_choices'
    return choices[0].slug || 'unknown_choice'
  }

  /**
   * Generate decision key hash for collision prevention
   */
  private static generateDecisionKeyHash(storyRunId: string, stepNumber: number, choices: Choice[]): string {
    const choiceTexts = choices.map(c => c.text).join('|')
    const hashInput = `${storyRunId}_${stepNumber}_${choiceTexts}`
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16)
  }

  /**
   * Track choice impressions for analytics
   */
  private static async trackChoiceImpressions(choices: Choice[], genre: string): Promise<void> {
    try {
      for (const choice of choices) {
        await ChoiceStatsQueries.incrementImpressions(choice.slug, choice.id, genre)
      }
    } catch (error) {
      console.error('Error tracking choice impressions:', error)
      // Don't throw - this is non-critical
    }
  }

  /**
   * Map ending category to EndingType
   */
  private static mapCategoryToEndingType(category: EndingClassification['category']): EndingType {
    switch (category) {
      case 'heroic':
        return 'heroic'
      case 'tragic':
        return 'tragic'
      case 'mysterious':
        return 'mysterious'
      case 'triumphant':
        return 'triumphant'
      case 'bittersweet':
        return 'bittersweet'
      default:
        return 'bittersweet'
    }
  }
}