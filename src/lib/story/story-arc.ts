import type { GameState, PersonalityTraits } from '../../types/story'

export interface StoryArc {
  act: number
  phase: 'setup' | 'rising_action' | 'climax' | 'resolution'
  plotThreads: PlotThread[]
  requiredElements: string[]
  suggestedChoiceTypes: ChoiceType[]
}

export interface PlotThread {
  id: string
  name: string
  description: string
  introduced: boolean
  developed: boolean
  resolved: boolean
  importance: 'main' | 'subplot' | 'minor'
}

export interface ChoiceType {
  type: 'character_development' | 'plot_advancement' | 'relationship' | 'moral_dilemma' | 'action'
  description: string
  weight: number
}

/**
 * Manages story progression according to proper narrative structure
 */
export class StoryArcManager {
  /**
   * Determine the current story phase based on step number and length
   */
  static getCurrentArc(stepNumber: number, storyLength: string, gameState: GameState): StoryArc {
    const maxSteps = storyLength === 'quick' ? 8 : 12
    const progressRatio = stepNumber / maxSteps

    let phase: StoryArc['phase']
    let act: number
    let requiredElements: string[]
    let suggestedChoiceTypes: ChoiceType[]

    if (progressRatio <= 0.25) {
      // First quarter - Setup
      phase = 'setup'
      act = 1
      requiredElements = [
        'Establish world and character',
        'Introduce main conflict or mystery',
        'Create initial relationships',
        'Set up key plot threads'
      ]
      suggestedChoiceTypes = [
        { type: 'character_development', description: 'Establish personality traits', weight: 0.4 },
        { type: 'plot_advancement', description: 'Introduce main story elements', weight: 0.3 },
        { type: 'relationship', description: 'Meet key characters', weight: 0.3 }
      ]
    } else if (progressRatio <= 0.7) {
      // Middle portion - Rising Action
      phase = 'rising_action'
      act = progressRatio <= 0.5 ? 2 : 3
      requiredElements = [
        'Develop introduced plot threads',
        'Escalate conflicts and stakes',
        'Character growth through challenges',
        'Build towards climactic moment'
      ]
      suggestedChoiceTypes = [
        { type: 'moral_dilemma', description: 'Force difficult decisions', weight: 0.3 },
        { type: 'plot_advancement', description: 'Advance main storyline', weight: 0.4 },
        { type: 'action', description: 'Create tension and excitement', weight: 0.3 }
      ]
    } else if (progressRatio <= 0.9) {
      // Near end - Climax
      phase = 'climax'
      act = 3
      requiredElements = [
        'Reach story climax',
        'Character faces ultimate test',
        'Major plot threads converge',
        'Highest stakes and tension'
      ]
      suggestedChoiceTypes = [
        { type: 'action', description: 'Climactic confrontation', weight: 0.5 },
        { type: 'character_development', description: 'Character shows growth', weight: 0.3 },
        { type: 'moral_dilemma', description: 'Ultimate moral choice', weight: 0.2 }
      ]
    } else {
      // Final portion - Resolution
      phase = 'resolution'
      act = 3
      requiredElements = [
        'Resolve main plot threads',
        'Show character transformation',
        'Provide satisfying conclusion',
        'Tie up loose ends'
      ]
      suggestedChoiceTypes = [
        { type: 'character_development', description: 'Show final character state', weight: 0.4 },
        { type: 'plot_advancement', description: 'Conclude storylines', weight: 0.6 }
      ]
    }

    const plotThreads = this.getActiveThreads(gameState, phase)

    return {
      act,
      phase,
      plotThreads,
      requiredElements,
      suggestedChoiceTypes
    }
  }

  /**
   * Get active plot threads based on game state and story phase
   */
  private static getActiveThreads(gameState: GameState, phase: StoryArc['phase']): PlotThread[] {
    const threads: PlotThread[] = []

    // Analyze flags to identify plot threads
    const flags = gameState.flags || []
    
    // Main quest thread
    const hasMainQuest = flags.some(f => f.includes('quest') || f.includes('mission') || f.includes('objective'))
    if (hasMainQuest || phase === 'setup') {
      threads.push({
        id: 'main_quest',
        name: 'Main Quest',
        description: 'The primary storyline and objective',
        introduced: hasMainQuest,
        developed: flags.filter(f => f.includes('quest') || f.includes('progress')).length > 1,
        resolved: flags.includes('quest_complete'),
        importance: 'main'
      })
    }

    // Relationship threads
    const relationships = Object.keys(gameState.relationships || {})
    relationships.forEach(character => {
      const relationshipValue = gameState.relationships![character]
      threads.push({
        id: `relationship_${character}`,
        name: `Relationship with ${character}`,
        description: `Bond and interactions with ${character}`,
        introduced: true,
        developed: Math.abs(relationshipValue) > 20,
        resolved: phase === 'resolution',
        importance: Math.abs(relationshipValue) > 50 ? 'main' : 'subplot'
      })
    })

    // Mystery/conflict threads
    const hasMystery = flags.some(f => f.includes('mystery') || f.includes('secret') || f.includes('unknown'))
    if (hasMystery) {
      threads.push({
        id: 'mystery',
        name: 'Central Mystery',
        description: 'The main puzzle or unknown element',
        introduced: true,
        developed: flags.filter(f => f.includes('clue') || f.includes('discovery')).length > 0,
        resolved: flags.includes('mystery_solved'),
        importance: 'main'
      })
    }

    return threads
  }

  /**
   * Generate story guidance based on current arc
   */
  static generateStoryGuidance(arc: StoryArc, previousChoices: string[]): string {
    const unresolvedThreads = arc.plotThreads.filter(t => !t.resolved && t.importance !== 'minor')
    const choiceTypeWeights = arc.suggestedChoiceTypes
      .map(ct => `${ct.type} (${ct.description})`)
      .join(', ')

    return `
STORY ARC GUIDANCE (Phase: ${arc.phase.toUpperCase()}):

Current Requirements:
${arc.requiredElements.map(req => `- ${req}`).join('\n')}

Active Plot Threads to Address:
${unresolvedThreads.map(thread => 
  `- ${thread.name}: ${thread.resolved ? 'RESOLVED' : thread.developed ? 'DEVELOPING' : 'NEEDS DEVELOPMENT'}`
).join('\n')}

Suggested Choice Types: ${choiceTypeWeights}

Phase-Specific Instructions:
${this.getPhaseInstructions(arc.phase)}
`
  }

  private static getPhaseInstructions(phase: StoryArc['phase']): string {
    switch (phase) {
      case 'setup':
        return `- Focus on world-building and character establishment
- Introduce compelling hooks and mysteries
- Create meaningful first impressions
- Set up plot threads that will pay off later`
      
      case 'rising_action':
        return `- Escalate existing conflicts and introduce new complications
- Develop character relationships and growth
- Build tension and stakes progressively
- Advance plot threads meaningfully`
      
      case 'climax':
        return `- Bring major conflicts to a head
- Force characters to make their most important decisions
- Converge multiple plot threads
- Create maximum tension and drama`
      
      case 'resolution':
        return `- Resolve all major plot threads satisfyingly
- Show character growth and transformation
- Provide emotional closure
- Tie up loose ends meaningfully`
      
      default:
        return ''
    }
  }
}
