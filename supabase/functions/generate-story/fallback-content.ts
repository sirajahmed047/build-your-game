import { StoryGenerationRequest, StoryResponse } from './types.ts'
import { generateChoiceSlug } from './choice-utils.ts'

export async function getFallbackContent(
  request: StoryGenerationRequest,
  supabase: any
): Promise<StoryResponse> {
  // Get fallback content based on genre and current state
  if (request.currentStep && request.gameState) {
    return getBridgeSegment(request)
  } else {
    return getOpeningFallback(request)
  }
}

function getOpeningFallback(request: StoryGenerationRequest): StoryResponse {
  const openings = {
    fantasy: {
      storyText: "You stand at the crossroads of destiny, where ancient magic still whispers through the wind. A mysterious figure approaches, their cloak billowing in the ethereal breeze. In their outstretched hand lies an artifact that pulses with otherworldly energy.",
      choices: [
        {
          id: "A",
          text: "Accept the mysterious artifact",
          slug: "accept_artifact",
          traits_impact: { riskTaking: 1, creativity: 1 }
        },
        {
          id: "B", 
          text: "Question the stranger's motives",
          slug: "question_stranger",
          traits_impact: { pragmatism: 1, empathy: 0 }
        },
        {
          id: "C",
          text: "Politely decline and walk away",
          slug: "decline_artifact",
          traits_impact: { pragmatism: 1, riskTaking: -1 }
        }
      ]
    },
    mystery: {
      storyText: "The old mansion creaks ominously as you step through its threshold. Rain pounds against the windows while shadows dance in the flickering candlelight. A scream echoes from somewhere upstairs, followed by an unsettling silence.",
      choices: [
        {
          id: "A",
          text: "Rush upstairs toward the scream",
          slug: "rush_upstairs",
          traits_impact: { riskTaking: 1, empathy: 1 }
        },
        {
          id: "B",
          text: "Search the ground floor first",
          slug: "search_ground_floor", 
          traits_impact: { pragmatism: 1, leadership: 0 }
        },
        {
          id: "C",
          text: "Call out to see if anyone responds",
          slug: "call_out",
          traits_impact: { empathy: 1, riskTaking: 0 }
        }
      ]
    },
    'sci-fi': {
      storyText: "The space station's alarms blare as you float through the zero-gravity corridor. Emergency lights cast eerie red shadows on the metallic walls. Through the viewport, you see an unknown vessel approaching, its design unlike anything in the galactic database.",
      choices: [
        {
          id: "A",
          text: "Attempt to communicate with the vessel",
          slug: "communicate_vessel",
          traits_impact: { empathy: 1, creativity: 1 }
        },
        {
          id: "B",
          text: "Prepare the station's defenses",
          slug: "prepare_defenses",
          traits_impact: { pragmatism: 1, leadership: 1 }
        },
        {
          id: "C",
          text: "Gather more data before acting",
          slug: "gather_data",
          traits_impact: { pragmatism: 1, riskTaking: -1 }
        }
      ]
    }
  }

  const content = openings[request.genre as keyof typeof openings]
  
  return {
    storyText: content.storyText,
    choices: content.choices,
    gameState: {
      act: 1,
      flags: ['story_started'],
      relationships: {},
      inventory: [],
      personalityTraits: {
        riskTaking: 0,
        empathy: 0,
        pragmatism: 0,
        creativity: 0,
        leadership: 0
      }
    },
    isEnding: false
  }
}

function getBridgeSegment(request: StoryGenerationRequest): StoryResponse {
  // Generic bridge segments that can connect any story flow
  const bridges = [
    {
      storyText: "Time passes as you contemplate your next move. The situation has grown more complex, and new opportunities present themselves. You must decide how to proceed.",
      choices: [
        {
          id: "A",
          text: "Take bold action",
          slug: "take_bold_action",
          traits_impact: { riskTaking: 1, leadership: 1 }
        },
        {
          id: "B",
          text: "Seek more information",
          slug: "seek_information", 
          traits_impact: { pragmatism: 1, creativity: 0 }
        },
        {
          id: "C",
          text: "Try to find allies",
          slug: "find_allies",
          traits_impact: { empathy: 1, leadership: 0 }
        }
      ]
    },
    {
      storyText: "The path ahead splits into multiple directions, each offering its own challenges and rewards. You pause to consider which route aligns best with your goals.",
      choices: [
        {
          id: "A",
          text: "Choose the direct path",
          slug: "direct_path",
          traits_impact: { riskTaking: 1, pragmatism: 0 }
        },
        {
          id: "B",
          text: "Take the safer route",
          slug: "safer_route",
          traits_impact: { pragmatism: 1, riskTaking: -1 }
        },
        {
          id: "C",
          text: "Look for a creative alternative",
          slug: "creative_alternative",
          traits_impact: { creativity: 1, empathy: 0 }
        }
      ]
    }
  ]

  // Select a random bridge segment
  const bridge = bridges[Math.floor(Math.random() * bridges.length)]
  
  // Preserve existing game state but increment act if needed
  const gameState = { ...request.gameState! }
  if (request.currentStep! > 3 && gameState.act === 1) {
    gameState.act = 2
  } else if (request.currentStep! > 6 && gameState.act === 2) {
    gameState.act = 3
  }

  // Add bridge flag
  gameState.flags = [...gameState.flags, 'bridge_segment']

  return {
    storyText: bridge.storyText,
    choices: bridge.choices,
    gameState,
    isEnding: false
  }
}