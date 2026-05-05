import type { Vec2, Needs, Personality, Memory, Perception, CircadianState, FoodItem, Obstacle, BehaviorState, WorldBounds, EmotionBubble, EnvironmentStimulus } from './types'
import { BehaviorState as BS, TimeOfDay, MIN_DWELL_TIME } from './types'
import { distance, clamp, vec2, add, sub, scale, normalize, randomRange } from './math'
import { evaluateBehaviorUtilities, selectBehavior } from './ai'

export interface BehaviorUpdate {
  target: Vec2
  speedMultiplier: number
  newState?: BehaviorState
  emotionBubble?: EmotionBubble['type']
}

export interface BehaviorContext {
  currentState: BehaviorState
  headPos: Vec2
  currentTarget: Vec2 | null
  noiseOffset: number
  stateTimer: number
  needs: Needs
  personality: Personality
  memory: Memory
  perception: Perception
  circadian: CircadianState
  mousePos: Vec2 | null
  mouseDown: boolean
  foodItems: FoodItem[]
  obstacles: Obstacle[]
  envStimuli: EnvironmentStimulus[]
  bounds: WorldBounds
  dt: number
  stateCooldown: number
  accumulatedTime: number
}

function clampToBounds(pos: Vec2, bounds: WorldBounds): Vec2 {
  const margin = 50
  return {
    x: Math.max(margin, Math.min(bounds.width - margin, pos.x)),
    y: Math.max(margin, Math.min(bounds.height - margin, pos.y)),
  }
}

export function updateBehavior(ctx: BehaviorContext): BehaviorUpdate {
  const {
    currentState, headPos, currentTarget, noiseOffset, stateTimer,
    needs, personality, memory, perception, circadian,
    mousePos, mouseDown, foodItems, obstacles, envStimuli, bounds, dt,
    stateCooldown, accumulatedTime,
  } = ctx

  const utilities = evaluateBehaviorUtilities(
    currentState, headPos, needs, personality, memory, perception,
    circadian, stateTimer, noiseOffset, mousePos, mouseDown, foodItems, envStimuli, bounds,
    accumulatedTime,
  )

  const selected = selectBehavior(utilities, currentState)

  const isEmergency = selected.state === BS.FLEEING
  const minDwell = MIN_DWELL_TIME[currentState] || 1.0
  const dwellSatisfied = stateTimer <= (minDwell * 0.3)

  const canTransition = selected.state !== currentState && (
    isEmergency ||
    (dwellSatisfied && stateCooldown <= 0)
  )

  const newState = canTransition ? selected.state : undefined
  const target = selected.target || currentTarget || headPos

  let emotionBubble: EmotionBubble['type'] | undefined
  if (newState) {
    switch (newState) {
      case BS.CURIOUS: emotionBubble = 'question'; break
      case BS.FLEEING: emotionBubble = 'sweat'; break
      case BS.EATING: emotionBubble = 'hunger'; break
      case BS.SLEEPING: emotionBubble = 'zzz'; break
      case BS.PLAYING: emotionBubble = 'play'; break
      case BS.SOCIALIZING: emotionBubble = 'social'; break
    }
  }

  if (needs.hunger > 0.85 && Math.random() < 0.003) emotionBubble = 'hunger'
  if (needs.mood > 0.88 && Math.random() < 0.002) emotionBubble = 'heart'

  return {
    target: clampToBounds(target, bounds),
    speedMultiplier: selected.speedMultiplier,
    newState,
    emotionBubble,
  }
}
