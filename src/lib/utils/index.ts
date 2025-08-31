export { cn } from './cn'

// Choice utilities
export { generateChoiceSlug as generateChoiceSlugClient } from './choice-utils'

// Crypto utilities  
export { 
  generateChoiceSlug as generateChoiceSlugCrypto,
  generateDecisionKeyHash,
  generateSessionId 
} from './crypto'

// Game state utilities
export { 
  createInitialGameState,
  getDominantTraits,
  getTraitDescription,
  isValidGameState as isValidGameStateUtil
} from './game-state'

// Session utilities
export { getOrCreateSessionId } from './session'

// Type safety utilities
export { 
  safeGetPersonalityTraits, 
  safeGetGameState,
  isValidGameState as isValidGameStateGuard
} from './type-safety'