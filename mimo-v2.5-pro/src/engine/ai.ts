import type {
  Vec2, Needs, Personality, Memory, Perception, Stimulus,
  BehaviorState, CircadianState, WorldBounds, FoodItem, EnvironmentStimulus,
} from './types'
import { BehaviorState as BS, TimeOfDay, MIN_DWELL_TIME } from './types'
import { distance, clamp, noise2D, randomRange } from './math'
import { findMostInterestingPoint, findNearestPointOfType } from './memory'

export function createCircadianState(): CircadianState {
  return {
    timeOfDay: TimeOfDay.DAY,
    cycle: Math.random(),
    daylight: 0.8,
  }
}

export function updateCircadian(circadian: CircadianState, dt: number): CircadianState {
  const newCirc = { ...circadian }
  newCirc.cycle += dt * 0.005
  if (newCirc.cycle > 1) newCirc.cycle -= 1

  const sunAngle = newCirc.cycle * Math.PI * 2
  newCirc.daylight = clamp((Math.sin(sunAngle) + 0.3) / 1.3, 0.15, 1.0)

  if (newCirc.cycle < 0.15) newCirc.timeOfDay = TimeOfDay.DAWN
  else if (newCirc.cycle < 0.45) newCirc.timeOfDay = TimeOfDay.DAY
  else if (newCirc.cycle < 0.55) newCirc.timeOfDay = TimeOfDay.DUSK
  else newCirc.timeOfDay = TimeOfDay.NIGHT

  return newCirc
}

export function createDefaultPersonality(): Personality {
  return {
    boldness: 0.4 + Math.random() * 0.4,
    activity: 0.3 + Math.random() * 0.5,
    sociability: 0.3 + Math.random() * 0.5,
    curiosity: 0.4 + Math.random() * 0.4,
  }
}

export function createPerception(): Perception {
  return {
    visionAngle: Math.PI * 0.8,
    visionRange: 250,
    stimuli: [],
  }
}

export function updatePerception(
  perception: Perception,
  headPos: Vec2,
  heading: Vec2,
  mousePos: Vec2 | null,
  mouseDown: boolean,
  foodItems: FoodItem[],
  obstacles: Array<{ pos: Vec2; radius: number }>,
  envStimuli: EnvironmentStimulus[],
  dt: number
): Perception {
  const newPer = { ...perception, stimuli: [] as Stimulus[] }

  if (mousePos) {
    const dist = distance(headPos, mousePos)
    if (dist < newPer.visionRange) {
      newPer.stimuli.push({
        pos: mousePos,
        type: mouseDown ? 'danger' : 'user',
        intensity: 1 - dist / newPer.visionRange,
      })
    }
  }

  for (const food of foodItems) {
    const dist = distance(headPos, food.pos)
    if (dist < newPer.visionRange) {
      newPer.stimuli.push({
        pos: food.pos,
        type: 'food',
        intensity: (1 - dist / newPer.visionRange) * food.remaining,
      })
    }
  }

  for (const env of envStimuli) {
    const dist = distance(headPos, env.pos)
    if (dist < newPer.visionRange + env.radius) {
      if (env.type === 'toy') {
        newPer.stimuli.push({
          pos: env.pos,
          type: 'toy',
          intensity: (1 - dist / newPer.visionRange) * (env.life / env.maxLife),
        })
      } else if (env.type === 'danger_zone') {
        newPer.stimuli.push({
          pos: env.pos,
          type: 'danger',
          intensity: (1 - dist / newPer.visionRange) * 0.8,
        })
      } else if (env.type === 'comfort_zone') {
        newPer.stimuli.push({
          pos: env.pos,
          type: 'comfort',
          intensity: (1 - dist / newPer.visionRange) * 0.5,
        })
      }
    }
  }

  return newPer
}

export interface BehaviorUtility {
  state: BehaviorState
  utility: number
  target?: Vec2
  speedMultiplier: number
}

export function evaluateBehaviorUtilities(
  currentState: BehaviorState,
  headPos: Vec2,
  needs: Needs,
  personality: Personality,
  memory: Memory,
  perception: Perception,
  circadian: CircadianState,
  stateTimer: number,
  noiseOffset: number,
  mousePos: Vec2 | null,
  mouseDown: boolean,
  foodItems: FoodItem[],
  envStimuli: EnvironmentStimulus[],
  bounds: WorldBounds,
  accumulatedTime: number,
): BehaviorUtility[] {
  const utilities: BehaviorUtility[] = []
  const timeFactor = circadian.daylight

  const dangerStim = perception.stimuli.find(s => s.type === 'danger')
  const userStim = perception.stimuli.find(s => s.type === 'user')
  const foodStim = perception.stimuli.find(s => s.type === 'food')
  const toyStim = perception.stimuli.find(s => s.type === 'toy')
  const comfortStim = perception.stimuli.find(s => s.type === 'comfort')

  // ── FLEEING ──
  let fleeUtility = 0
  let fleeTarget: Vec2 | undefined
  if (dangerStim) {
    fleeUtility = dangerStim.intensity * 1.5 * (1 - personality.boldness * 0.5)
    const dx = headPos.x - dangerStim.pos.x
    const dy = headPos.y - dangerStim.pos.y
    fleeTarget = {
      x: clamp(headPos.x + dx * 1.5, 50, bounds.width - 50),
      y: clamp(headPos.y + dy * 1.5, 50, bounds.height - 50),
    }
  }
  if (mouseDown && mousePos && distance(headPos, mousePos) < 100) {
    const dx = headPos.x - mousePos.x
    const dy = headPos.y - mousePos.y
    const fU = 1.2 * (1 - personality.boldness * 0.3)
    if (fU > fleeUtility) {
      fleeUtility = fU
      fleeTarget = {
        x: clamp(headPos.x + dx * 1.5, 50, bounds.width - 50),
        y: clamp(headPos.y + dy * 1.5, 50, bounds.height - 50),
      }
    }
  }
  utilities.push({ state: BS.FLEEING, utility: fleeUtility, target: fleeTarget, speedMultiplier: 3.5 })

  // ── SLEEPING ──
  let sleepUtility = 0
  if (needs.energy < 0.15 && circadian.timeOfDay === TimeOfDay.NIGHT) {
    sleepUtility = (1 - needs.energy) * 1.3
  } else if (needs.energy < 0.08) {
    sleepUtility = 1.6
  } else if (circadian.timeOfDay === TimeOfDay.NIGHT && needs.energy < 0.4) {
    sleepUtility = 0.3 + (1 - needs.energy) * 0.2
  }
  utilities.push({ state: BS.SLEEPING, utility: sleepUtility, speedMultiplier: 0 })

  // ── EATING ──
  let eatUtility = 0
  let eatTarget: Vec2 | undefined
  if (foodItems.length > 0) {
    if (needs.hunger > 0.3) {
      eatUtility = needs.hunger * 0.9
      if (foodStim) {
        eatUtility += foodStim.intensity * 0.6
        eatTarget = foodStim.pos
      } else {
        const foodMem = findNearestPointOfType(memory, headPos, 'food', 300)
        if (foodMem) {
          eatUtility += 0.2
          eatTarget = foodMem.pos
        }
      }
    } else if (needs.hunger > 0.15) {
      eatUtility = needs.hunger * 0.3
      if (foodStim && foodStim.intensity > 0.5) {
        eatUtility += 0.15
        eatTarget = foodStim.pos
      }
    }
  }
  utilities.push({ state: BS.EATING, utility: eatUtility, target: eatTarget, speedMultiplier: 1.5 })

  // ── RESTING ──
  let restUtility = 0
  if (needs.energy < 0.3 && circadian.timeOfDay !== TimeOfDay.NIGHT) {
    restUtility = (1 - needs.energy) * 0.5
  }
  if (circadian.timeOfDay === TimeOfDay.DUSK) {
    restUtility += 0.15
  }
  utilities.push({ state: BS.RESTING, utility: restUtility, speedMultiplier: 0 })

  // ── PLAYING ──
  let playUtility = 0
  let playTarget: Vec2 | undefined
  if (needs.energy > 0.6 && needs.curiosity > 0.4 && needs.mood > 0.5 && circadian.timeOfDay === TimeOfDay.DAY) {
    playUtility = (needs.energy + needs.curiosity + needs.mood) / 3 * personality.activity * 0.5
    if (toyStim) {
      playUtility += toyStim.intensity * 0.4
      playTarget = toyStim.pos
    } else {
      const tailAngle = accumulatedTime * 2
      const tailDist = 40
      playTarget = {
        x: headPos.x + Math.cos(tailAngle) * tailDist,
        y: headPos.y + Math.sin(tailAngle) * tailDist,
      }
    }
  }
  utilities.push({ state: BS.PLAYING, utility: playUtility, target: playTarget, speedMultiplier: 1.6 })

  // ── SOCIALIZING ──
  let socialUtility = 0
  let socialTarget: Vec2 | undefined
  if (userStim && !mouseDown && needs.social < 0.5) {
    socialUtility = (1 - needs.social) * personality.sociability * 0.8 + userStim.intensity * 0.3
    socialTarget = userStim.pos
  }
  utilities.push({ state: BS.SOCIALIZING, utility: socialUtility, target: socialTarget, speedMultiplier: 1.0 })

  // ── CURIOUS ──
  let curiousUtility = 0
  let curiousTarget: Vec2 | undefined
  if (userStim && !mouseDown && needs.social > 0.3) {
    curiousUtility = userStim.intensity * personality.sociability * 0.8 + needs.social * 0.2
    curiousTarget = userStim.pos
  }
  if (needs.curiosity > 0.55) {
    const cU = needs.curiosity * personality.curiosity * 0.6
    if (cU > curiousUtility) {
      curiousUtility = cU
      const angle = noise2D(noiseOffset * 0.5, 50) * Math.PI * 2
      curiousTarget = curiousTarget || {
        x: clamp(headPos.x + Math.cos(angle) * 200, 50, bounds.width - 50),
        y: clamp(headPos.y + Math.sin(angle) * 200, 50, bounds.height - 50),
      }
    }
  }
  utilities.push({ state: BS.CURIOUS, utility: curiousUtility, target: curiousTarget, speedMultiplier: 2.0 })

  // ── EXPLORING ──
  let exploreUtility = 0
  let exploreTarget: Vec2 | undefined
  if (needs.curiosity > 0.35 && circadian.timeOfDay !== TimeOfDay.NIGHT) {
    exploreUtility = needs.curiosity * personality.curiosity * 0.45 * timeFactor
    const interestPoint = findMostInterestingPoint(memory, headPos, 'explore')
    if (interestPoint && interestPoint.lastVisit > 20) {
      exploreUtility += 0.15
      exploreTarget = interestPoint.pos
    } else {
      const angle = noise2D(noiseOffset * 0.3, 200) * Math.PI * 2
      const dist = 100 + noise2D(noiseOffset * 0.3, 300) * 200
      exploreTarget = {
        x: clamp(headPos.x + Math.cos(angle) * dist, 50, bounds.width - 50),
        y: clamp(headPos.y + Math.sin(angle) * dist, 50, bounds.height - 50),
      }
    }
  }
  utilities.push({ state: BS.EXPLORING, utility: exploreUtility, target: exploreTarget, speedMultiplier: 1.8 })

  // ── PATROLLING ──
  let patrolUtility = 0
  let patrolTarget: Vec2 | undefined
  if (circadian.timeOfDay === TimeOfDay.DAY && needs.energy > 0.4 && needs.hunger < 0.6) {
    patrolUtility = 0.2 * personality.activity * timeFactor
    const points = memory.interestPoints.filter(p => p.type !== 'rest')
    if (points.length > 0) {
      const idx = Math.floor(accumulatedTime / 15) % points.length
      patrolTarget = points[idx].pos
    } else {
      const homeDist = 150
      const angle = (accumulatedTime * 0.1) % (Math.PI * 2)
      patrolTarget = {
        x: clamp(memory.homePos.x + Math.cos(angle) * homeDist, 50, bounds.width - 50),
        y: clamp(memory.homePos.y + Math.sin(angle) * homeDist, 50, bounds.height - 50),
      }
    }
  }
  utilities.push({ state: BS.PATROLLING, utility: patrolUtility, target: patrolTarget, speedMultiplier: 1.0 })

  // ── GROOMING ──
  let groomUtility = 0
  if (currentState === BS.IDLE && stateTimer < 0.5) {
    groomUtility = 0.25 + personality.activity * 0.15
  }
  if (needs.mood > 0.7 && needs.energy > 0.5 && currentState === BS.RESTING) {
    groomUtility = Math.max(groomUtility, 0.2)
  }
  utilities.push({ state: BS.GROOMING, utility: groomUtility, speedMultiplier: 0 })

  // ── WANDERING ──
  let wanderUtility = 0.25 * personality.activity * timeFactor
  if (circadian.timeOfDay === TimeOfDay.DAWN) wanderUtility += 0.15
  if (needs.hunger < 0.4 && needs.energy > 0.35) wanderUtility += 0.1
  const wAngle = noise2D(noiseOffset * 0.3, 0) * Math.PI * 2
  const wDist = 80 + noise2D(noiseOffset * 0.3, 100) * 120
  const wanderTarget = {
    x: clamp(headPos.x + Math.cos(wAngle) * wDist, 50, bounds.width - 50),
    y: clamp(headPos.y + Math.sin(wAngle) * wDist, 50, bounds.height - 50),
  }
  utilities.push({ state: BS.WANDERING, utility: wanderUtility, target: wanderTarget, speedMultiplier: 1.2 })

  // ── IDLE ──
  utilities.push({ state: BS.IDLE, utility: 0.12, speedMultiplier: 0 })

  // ── Comfort zone attraction ──
  if (comfortStim) {
    for (const u of utilities) {
      if (u.state === BS.WANDERING || u.state === BS.RESTING || u.state === BS.IDLE) {
        u.utility += comfortStim.intensity * 0.15
        if (!u.target) u.target = comfortStim.pos
      }
    }
  }

  // ── Behavior inertia ──
  const dwellTime = MIN_DWELL_TIME[currentState] || 1.0
  const dwellRatio = stateTimer > 0 ? Math.min(1, (dwellTime - stateTimer) / dwellTime) : 0
  const inertiaBonus = 0.35 + dwellRatio * 0.15
  for (const u of utilities) {
    if (u.state === currentState) {
      u.utility += inertiaBonus
    }
  }

  return utilities
}

export function selectBehavior(utilities: BehaviorUtility[], currentState: BehaviorState): BehaviorUtility {
  const sorted = [...utilities].sort((a, b) => b.utility - a.utility)

  if (sorted[0].state === BS.FLEEING && sorted[0].utility > 0.3) {
    return sorted[0]
  }

  const topTwo = sorted.slice(0, 3)
  const diff = topTwo[0].utility - topTwo[1].utility

  if (diff > 0.2) {
    return topTwo[0]
  }

  const temperature = 0.3
  const maxU = topTwo[0].utility
  const weights = topTwo.map(u => Math.exp((u.utility - maxU) / temperature))
  const total = weights.reduce((s, w) => s + w, 0)

  let roll = Math.random() * total
  for (let i = 0; i < topTwo.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return topTwo[i]
  }

  return topTwo[0]
}
