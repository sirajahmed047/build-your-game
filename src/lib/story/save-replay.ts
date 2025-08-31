import { supabase } from '../supabase/client'
import { StoryRunQueries, StoryStepQueries } from '../supabase/queries'
import { StoryFlowService } from './story-flow'
import type { 
  StoryRun, 
  StoryStep, 
  StoryGenerationRequest,
  StorySession,
  GameState,
  PersonalityTraits
} from '../../types/story'

export interface SavePoint {
  id: string
  storyRunId: string
  stepNumber: number
  gameState: GameState
  personalityTraits: PersonalityTraits
  storyText: string
  availableChoices: any[]
  timestamp: string
  description: string // Human-readable description like "After meeting the wizard"
}

export interface ReplayTemplate {
  originalStoryRunId: string
  genre: string
  length: string
  challenge: string
  initialGameState: GameState
  storySteps: StoryStep[]
  endingTitle?: string
  endingRarity?: string
}

export interface ReplayOptions {
  fromStep?: number // Start replay from specific step (default: 1)
  withDifferentChoices?: boolean // Whether to suggest different choices
  preservePersonality?: boolean // Keep original personality traits
}

/**
 * Service for managing story save states and replay functionality
 */
export class SaveReplayService {
  /**
   * Automatically save progress at each decision point (Requirement 6.1)
   */
  static async saveProgress(
    storyRunId: string,
    stepNumber: number,
    gameState: GameState,
    personalityTraits: PersonalityTraits,
    storyText: string,
    availableChoices: any[],
    description?: string
  ): Promise<SavePoint> {
    try {
      // Create a save point record in the database
      // We'll use the story_steps table as our save points since it already tracks progress
      const savePoint: SavePoint = {
        id: `${storyRunId}_step_${stepNumber}`,
        storyRunId,
        stepNumber,
        gameState,
        personalityTraits,
        storyText,
        availableChoices,
        timestamp: new Date().toISOString(),
        description: description || `Step ${stepNumber}`
      }

      // Store save point metadata in localStorage for quick access
      const savePoints = this.getSavePointsFromStorage(storyRunId)
      savePoints[stepNumber] = savePoint
      this.storeSavePoints(storyRunId, savePoints)

      return savePoint
    } catch (error) {
      console.error('Error saving progress:', error)
      throw new Error(`Failed to save progress: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all save points for a story run
   */
  static async getSavePoints(storyRunId: string): Promise<SavePoint[]> {
    try {
      // Get all story steps for this run
      const steps = await StoryStepQueries.getByStoryRunId(storyRunId)
      
      const savePoints: SavePoint[] = steps.map(step => ({
        id: `${storyRunId}_step_${step.step_number}`,
        storyRunId,
        stepNumber: step.step_number,
        gameState: step.game_state as GameState,
        personalityTraits: step.traits_snapshot as PersonalityTraits,
        storyText: step.story_text,
        availableChoices: Array.isArray(step.choices) ? step.choices : [],
        timestamp: step.created_at || new Date().toISOString(),
        description: this.generateSavePointDescription(step)
      }))

      return savePoints.sort((a, b) => a.stepNumber - b.stepNumber)
    } catch (error) {
      console.error('Error getting save points:', error)
      throw new Error(`Failed to get save points: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Restore progress from a specific save point (Requirement 6.5)
   */
  static async restoreProgress(storyRunId: string, stepNumber?: number): Promise<StorySession | null> {
    try {
      const storyRun = await StoryRunQueries.getById(storyRunId)
      if (!storyRun) {
        return null
      }

      // If no step specified, get the latest step
      let targetStep: StoryStep | null
      if (stepNumber) {
        const steps = await StoryStepQueries.getByStoryRunId(storyRunId)
        targetStep = steps.find(step => step.step_number === stepNumber) || null
      } else {
        targetStep = await StoryStepQueries.getLatestStep(storyRunId)
      }

      if (!targetStep) {
        return null
      }

      // Restore the session state
      const session: StorySession = {
        storyRun,
        currentStep: targetStep,
        gameState: targetStep.game_state as GameState,
        personalityTraits: targetStep.traits_snapshot as PersonalityTraits,
        isCompleted: storyRun.completed || false
      }

      return session
    } catch (error) {
      console.error('Error restoring progress:', error)
      throw new Error(`Failed to restore progress: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a replay template from a completed story (Requirement 6.2, 6.3)
   */
  static async createReplayTemplate(storyRunId: string): Promise<ReplayTemplate> {
    try {
      const storyRun = await StoryRunQueries.getById(storyRunId)
      if (!storyRun) {
        throw new Error('Story run not found')
      }

      const storySteps = await StoryStepQueries.getByStoryRunId(storyRunId)
      if (storySteps.length === 0) {
        throw new Error('No story steps found')
      }

      // Get initial game state from first step
      const firstStep = storySteps[0]
      const initialGameState = firstStep.game_state as GameState

      const template: ReplayTemplate = {
        originalStoryRunId: storyRunId,
        genre: storyRun.genre,
        length: storyRun.length,
        challenge: storyRun.challenge,
        initialGameState,
        storySteps,
        endingTitle: storyRun.ending_title || undefined,
        endingRarity: storyRun.ending_rarity || undefined
      }

      return template
    } catch (error) {
      console.error('Error creating replay template:', error)
      throw new Error(`Failed to create replay template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Start a replay from a template (Requirement 6.2, 6.3, 6.4)
   */
  static async startReplay(
    template: ReplayTemplate,
    userId?: string,
    sessionId?: string,
    options: ReplayOptions = {}
  ): Promise<StorySession> {
    try {
      const {
        fromStep = 1,
        withDifferentChoices = true,
        preservePersonality = false
      } = options

      // Create a new story run for the replay
      const replayRun = await StoryRunQueries.create({
        user_id: userId || null,
        session_id: sessionId || `replay_${Date.now()}`,
        genre: template.genre,
        length: template.length,
        challenge: template.challenge
      })

      if (!replayRun) {
        throw new Error('Failed to create replay story run')
      }

      // Find the step to start from
      const startStep = template.storySteps.find(step => step.step_number === fromStep)
      if (!startStep) {
        throw new Error(`Step ${fromStep} not found in template`)
      }

      // Initialize game state and personality traits
      let gameState = template.initialGameState
      let personalityTraits = startStep.traits_snapshot as PersonalityTraits

      if (!preservePersonality) {
        // Reset personality traits to defaults for fresh experience
        personalityTraits = {
          riskTaking: 50,
          empathy: 50,
          pragmatism: 50,
          creativity: 50,
          leadership: 50
        }
      }

      // If starting from a later step, apply all previous choices to game state
      if (fromStep > 1) {
        gameState = this.reconstructGameState(template.storySteps, fromStep - 1)
      }

      // Create the initial step for the replay
      const replayStep = await StoryStepQueries.create({
        story_run_id: replayRun.id,
        step_number: 1, // Always start replay steps from 1
        story_text: startStep.story_text,
        choices: this.prepareReplayChoices(startStep.choices as any[], withDifferentChoices),
        game_state: gameState,
        traits_snapshot: personalityTraits,
        choice_slug: startStep.choice_slug || undefined,
        decision_key_hash: `replay_${replayRun.id}_1`
      })

      if (!replayStep) {
        throw new Error('Failed to create replay step')
      }

      // Create the session
      const session: StorySession = {
        storyRun: replayRun,
        currentStep: replayStep,
        gameState,
        personalityTraits,
        isCompleted: false
      }

      // Save progress immediately
      await this.saveProgress(
        replayRun.id,
        1,
        gameState,
        personalityTraits,
        startStep.story_text,
        replayStep.choices as any[],
        `Replay started from step ${fromStep}`
      )

      return session
    } catch (error) {
      console.error('Error starting replay:', error)
      throw new Error(`Failed to start replay: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get replay options for a completed story (Requirement 6.4)
   */
  static async getReplayOptions(storyRunId: string): Promise<{
    canReplay: boolean
    template?: ReplayTemplate
    suggestedStartPoints: Array<{
      stepNumber: number
      description: string
      differentChoicesAvailable: boolean
    }>
  }> {
    try {
      const storyRun = await StoryRunQueries.getById(storyRunId)
      if (!storyRun || !storyRun.completed) {
        return { canReplay: false, suggestedStartPoints: [] }
      }

      const template = await this.createReplayTemplate(storyRunId)
      const steps = template.storySteps

      // Identify interesting replay points
      const suggestedStartPoints = steps
        .filter(step => {
          const choices = Array.isArray(step.choices) ? step.choices : []
          return choices.length > 1 // Only steps with multiple choices
        })
        .map(step => ({
          stepNumber: step.step_number,
          description: this.generateSavePointDescription(step),
          differentChoicesAvailable: true
        }))
        .slice(0, 5) // Limit to 5 suggestions

      return {
        canReplay: true,
        template,
        suggestedStartPoints
      }
    } catch (error) {
      console.error('Error getting replay options:', error)
      return { canReplay: false, suggestedStartPoints: [] }
    }
  }

  /**
   * Get user's story history with replay status
   */
  static async getStoryHistory(userId?: string, sessionId?: string): Promise<Array<{
    storyRun: StoryRun
    canReplay: boolean
    savePoints: number
    lastPlayedAt: string
  }>> {
    try {
      let storyRuns: StoryRun[] = []
      
      if (userId) {
        storyRuns = await StoryRunQueries.getByUserId(userId)
      } else if (sessionId) {
        storyRuns = await StoryRunQueries.getBySessionId(sessionId)
      }

      const history = await Promise.all(
        storyRuns.map(async (storyRun) => {
          const steps = await StoryStepQueries.getByStoryRunId(storyRun.id)
          const lastStep = steps[steps.length - 1]
          
          return {
            storyRun,
            canReplay: storyRun.completed || false,
            savePoints: steps.length,
            lastPlayedAt: lastStep?.created_at || storyRun.created_at || new Date().toISOString()
          }
        })
      )

      return history.sort((a, b) => 
        new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
      )
    } catch (error) {
      console.error('Error getting story history:', error)
      throw new Error(`Failed to get story history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Quick restart with different choices (Requirement 6.4)
   */
  static async quickRestart(
    storyRunId: string,
    userId?: string,
    sessionId?: string
  ): Promise<StorySession> {
    try {
      const template = await this.createReplayTemplate(storyRunId)
      
      return this.startReplay(template, userId, sessionId, {
        fromStep: 1,
        withDifferentChoices: true,
        preservePersonality: false
      })
    } catch (error) {
      console.error('Error quick restarting:', error)
      throw new Error(`Failed to quick restart: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Private helper methods

  private static getSavePointsFromStorage(storyRunId: string): Record<number, SavePoint> {
    try {
      const stored = localStorage.getItem(`savePoints_${storyRunId}`)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  private static storeSavePoints(storyRunId: string, savePoints: Record<number, SavePoint>): void {
    try {
      localStorage.setItem(`savePoints_${storyRunId}`, JSON.stringify(savePoints))
    } catch (error) {
      console.warn('Failed to store save points in localStorage:', error)
    }
  }

  private static generateSavePointDescription(step: StoryStep): string {
    // Generate a human-readable description based on step content
    const text = step.story_text
    if (text.length > 100) {
      return text.substring(0, 97) + '...'
    }
    return text
  }

  private static reconstructGameState(steps: StoryStep[], upToStep: number): GameState {
    // Reconstruct game state by applying all choices up to the specified step
    let gameState = steps[0].game_state as GameState
    
    for (let i = 1; i < Math.min(upToStep, steps.length); i++) {
      const step = steps[i]
      if (step.game_state) {
        gameState = step.game_state as GameState
      }
    }
    
    return gameState
  }

  private static prepareReplayChoices(originalChoices: any[], withDifferentChoices: boolean): any[] {
    if (!Array.isArray(originalChoices)) {
      return []
    }

    if (!withDifferentChoices) {
      return originalChoices
    }

    // Shuffle choices to encourage different selections
    const shuffled = [...originalChoices]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }
}