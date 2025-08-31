import type { StoryRun, GameState, PersonalityTraits } from '@/types/story'
import { EndingRarity } from '@/types/story'

export interface EndingClassification {
  endingTag: string
  title: string
  description: string
  rarity: EndingRarity
  category: 'heroic' | 'tragic' | 'mysterious' | 'triumphant' | 'bittersweet'
}

export interface EndingDetectionResult {
  isEnding: boolean
  classification?: EndingClassification
}

/**
 * Detects if a story has reached an ending and classifies it
 */
export function detectEnding(
  storyText: string,
  gameState: GameState,
  personalityTraits: PersonalityTraits,
  genre: string,
  storyLength: string
): EndingDetectionResult {
  // Check for explicit ending indicators in story text
  const endingKeywords = [
    'the end', 'finally', 'at last', 'years later', 'epilogue',
    'concluded', 'finished', 'completed', 'resolution', 'farewell'
  ]
  
  const hasEndingKeywords = endingKeywords.some(keyword => 
    storyText.toLowerCase().includes(keyword)
  )

  // Check story length - if we've reached expected conclusion points
  const isLongEnough = gameState.act >= 3 || (storyLength === 'quick' && gameState.act >= 2)
  
  // Check for resolution flags in game state
  const hasResolutionFlags = gameState.flags.some(flag => 
    flag.includes('resolved') || flag.includes('concluded') || flag.includes('ended') ||
    flag.includes('complete') || flag.includes('defeated') || flag.includes('solved')
  )

  // Determine if this is an ending
  const isEnding = hasEndingKeywords || (isLongEnough && hasResolutionFlags)

  if (!isEnding) {
    return { isEnding: false }
  }

  // Classify the ending
  const classification = classifyEnding(storyText, gameState, personalityTraits, genre)
  
  return {
    isEnding: true,
    classification
  }
}

/**
 * Classifies an ending based on story context and player choices
 */
function classifyEnding(
  storyText: string,
  gameState: GameState,
  personalityTraits: PersonalityTraits,
  genre: string
): EndingClassification {
  const text = storyText.toLowerCase()
  
  // Analyze story tone and outcomes
  const positiveWords = ['victory', 'triumph', 'success', 'joy', 'happiness', 'peace', 'saved', 'rescued']
  const negativeWords = ['defeat', 'death', 'loss', 'tragedy', 'sorrow', 'failed', 'destroyed', 'betrayed']
  const mysteriousWords = ['mystery', 'unknown', 'vanished', 'disappeared', 'enigma', 'puzzle', 'secret']
  
  const positiveScore = positiveWords.reduce((score, word) => 
    score + (text.includes(word) ? 1 : 0), 0)
  const negativeScore = negativeWords.reduce((score, word) => 
    score + (text.includes(word) ? 1 : 0), 0)
  const mysteriousScore = mysteriousWords.reduce((score, word) => 
    score + (text.includes(word) ? 1 : 0), 0)

  // Analyze personality traits for ending classification
  const isRiskTaker = personalityTraits.riskTaking > 70
  const isEmpathetic = personalityTraits.empathy > 70
  const isPragmatic = personalityTraits.pragmatism > 70
  const isCreative = personalityTraits.creativity > 70
  const isLeader = personalityTraits.leadership > 70

  // Analyze game state for unique conditions
  const hasRareFlags = gameState.flags.filter(flag => 
    flag.includes('rare') || flag.includes('secret') || flag.includes('hidden')
  ).length
  
  const relationshipCount = Object.keys(gameState.relationships).length
  const highRelationships = Object.values(gameState.relationships).filter(val => val > 80).length
  const lowRelationships = Object.values(gameState.relationships).filter(val => val < 20).length

  // Generate ending tag based on conditions
  let endingTag = generateEndingTag(gameState, personalityTraits, genre)
  
  // Determine category
  let category: EndingClassification['category']
  if (positiveScore > negativeScore && positiveScore > mysteriousScore) {
    category = isLeader && highRelationships > 2 ? 'triumphant' : 'heroic'
  } else if (negativeScore > positiveScore) {
    category = 'tragic'
  } else if (mysteriousScore > 0 || genre === 'mystery') {
    category = 'mysterious'
  } else {
    category = 'bittersweet'
  }

  // Determine rarity based on unique conditions
  let rarity: EndingRarity
  if (hasRareFlags > 2 || (isRiskTaker && isCreative && highRelationships > 3)) {
    rarity = EndingRarity.ULTRA_RARE
  } else if (hasRareFlags > 0 || highRelationships > 2 || lowRelationships > 2) {
    rarity = EndingRarity.RARE
  } else if (relationshipCount > 3 || Object.values(personalityTraits).some(val => val > 80)) {
    rarity = EndingRarity.UNCOMMON
  } else {
    rarity = EndingRarity.COMMON
  }

  // Generate title and description
  const { title, description } = generateEndingContent(category, endingTag, gameState, personalityTraits, genre)

  return {
    endingTag,
    title,
    description,
    rarity,
    category
  }
}

/**
 * Generates a unique ending tag based on game conditions
 */
function generateEndingTag(
  gameState: GameState,
  personalityTraits: PersonalityTraits,
  genre: string
): string {
  const dominantTrait = Object.entries(personalityTraits)
    .sort(([,a], [,b]) => b - a)[0][0]
  
  const hasBetrayal = gameState.flags.some(flag => flag.includes('betrayed'))
  const hasAlliance = gameState.flags.some(flag => flag.includes('alliance'))
  const hasSecrets = gameState.flags.some(flag => flag.includes('secret'))
  const hasSacrifice = gameState.flags.some(flag => flag.includes('sacrifice'))
  
  // Generate tag based on conditions
  let tag = `${genre}_`
  
  if (hasSacrifice) {
    tag += 'noble_sacrifice'
  } else if (hasBetrayal) {
    tag += 'betrayed_trust'
  } else if (hasAlliance) {
    tag += 'united_front'
  } else if (hasSecrets) {
    tag += 'hidden_truth'
  } else {
    tag += `${dominantTrait}_path`
  }
  
  return tag
}

/**
 * Generates ending title and description
 */
function generateEndingContent(
  category: EndingClassification['category'],
  endingTag: string,
  gameState: GameState,
  personalityTraits: PersonalityTraits,
  genre: string
): { title: string; description: string } {
  const templates = getEndingTemplates(genre, category)
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  // Replace placeholders with actual game data
  const dominantTrait = Object.entries(personalityTraits)
    .sort(([,a], [,b]) => b - a)[0][0]
  
  const title = template.title
    .replace('{trait}', formatTrait(dominantTrait))
    .replace('{genre}', genre)
  
  const description = template.description
    .replace('{trait}', formatTrait(dominantTrait))
    .replace('{relationships}', Object.keys(gameState.relationships).length.toString())
    .replace('{flags}', gameState.flags.length.toString())
  
  return { title, description }
}

/**
 * Gets ending templates for different genres and categories
 */
function getEndingTemplates(genre: string, category: EndingClassification['category']) {
  const templates = {
    fantasy: {
      heroic: [
        { title: "The {trait} Champion", description: "Your {trait} nature led you to become a legendary hero." },
        { title: "Savior of the Realm", description: "Through courage and wisdom, you saved the kingdom." }
      ],
      tragic: [
        { title: "The Fallen Hero", description: "Despite your best efforts, darkness prevailed." },
        { title: "Noble Sacrifice", description: "Your sacrifice saved others, though at great cost." }
      ],
      triumphant: [
        { title: "Master of Destiny", description: "You shaped the fate of the realm through your choices." },
        { title: "The Crowned Victor", description: "Your leadership united all under your banner." }
      ],
      mysterious: [
        { title: "The Enigmatic Path", description: "Your journey ended in mystery, leaving questions unanswered." },
        { title: "Keeper of Secrets", description: "You discovered truths that changed everything." }
      ],
      bittersweet: [
        { title: "The Price of Victory", description: "You won, but at a cost that will haunt you." },
        { title: "Pyrrhic Triumph", description: "Success came with unexpected consequences." }
      ]
    },
    mystery: {
      heroic: [
        { title: "The Truth Seeker", description: "Your {trait} approach uncovered the truth." },
        { title: "Detective's Vindication", description: "Justice was served through your investigation." }
      ],
      tragic: [
        { title: "The Unsolved Case", description: "Some mysteries are too dark to fully unravel." },
        { title: "Truth's Heavy Price", description: "The truth you sought came at a terrible cost." }
      ],
      triumphant: [
        { title: "Master Detective", description: "You solved the impossible case through brilliant deduction." },
        { title: "Justice Served", description: "Your investigation brought criminals to justice." }
      ],
      mysterious: [
        { title: "The Deeper Mystery", description: "Solving one mystery only revealed a greater enigma." },
        { title: "Questions Remain", description: "Some answers only lead to more questions." }
      ],
      bittersweet: [
        { title: "Hollow Victory", description: "You solved the case, but lost something precious." },
        { title: "The Cost of Truth", description: "Knowledge came with a price you didn't expect." }
      ]
    },
    'sci-fi': {
      heroic: [
        { title: "Savior of Worlds", description: "Your {trait} choices saved countless lives." },
        { title: "The New Pioneer", description: "You opened new frontiers for humanity." }
      ],
      tragic: [
        { title: "The Last Stand", description: "You fought bravely, but the future remains uncertain." },
        { title: "Sacrifice for Tomorrow", description: "Your sacrifice ensured humanity's survival." }
      ],
      triumphant: [
        { title: "Architect of the Future", description: "You shaped humanity's destiny among the stars." },
        { title: "The Unified Galaxy", description: "Your leadership brought peace to the cosmos." }
      ],
      mysterious: [
        { title: "Beyond Understanding", description: "You encountered something beyond human comprehension." },
        { title: "The Unknown Variable", description: "Your journey revealed mysteries science cannot explain." }
      ],
      bittersweet: [
        { title: "Progress's Price", description: "Advancement came with unexpected consequences." },
        { title: "The Human Cost", description: "Technology's promise carried a hidden price." }
      ]
    }
  }
  
  return templates[genre as keyof typeof templates]?.[category] || templates.fantasy.heroic
}

/**
 * Formats trait names for display
 */
function formatTrait(trait: string): string {
  const traitNames: Record<string, string> = {
    riskTaking: 'Bold',
    empathy: 'Compassionate',
    pragmatism: 'Practical',
    creativity: 'Innovative',
    leadership: 'Commanding'
  }
  
  return traitNames[trait] || 'Determined'
}

/**
 * Calculates ending rarity based on global statistics
 */
export function calculateEndingRarity(
  endingTag: string,
  totalCompletions: number,
  endingCompletions: number
): EndingRarity {
  if (totalCompletions === 0) return EndingRarity.COMMON
  
  const percentage = (endingCompletions / totalCompletions) * 100
  
  if (percentage < 2) return EndingRarity.ULTRA_RARE
  if (percentage < 10) return EndingRarity.RARE
  if (percentage < 25) return EndingRarity.UNCOMMON
  return EndingRarity.COMMON
}