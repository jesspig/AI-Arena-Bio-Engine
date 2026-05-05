import type {
  CreatureConfig, CreatureState, WorldBounds, Vec2,
  FoodItem, Obstacle, EmotionBubble, GaitMode, SpinePose, EnvironmentStimulus,
} from './types'
import { BehaviorState, GaitMode as GM, SpinePose as SP, MIN_DWELL_TIME, FOOD_PREFERENCES } from './types'
import { vec2, add, sub, scale, length, distance, randomRange, clamp } from './math'
import { createSpine, updateSpineChain, getSpineDirection } from './spine'
import { createLegState, updateLeg, getLegIKResult } from './leg'
import { updateBehavior } from './behavior'
import { createDefaultNeeds, updateNeeds } from './needs'
import { createMemory, updateMemory, addInterestPoint } from './memory'
import {
  createDefaultPersonality, createPerception, updatePerception,
  createCircadianState, updateCircadian,
} from './ai'
import { createPhysicsState, computeSteering, computeFleeSteering, updatePhysics, clampToWorldBounds } from './physics'
import {
  updateFoodItems, checkFoodEating, updateEmotionBubbles,
  createEmotionBubble, checkObstacleCollision,
  spawnFoodAuto, updateEnvStimuli, spawnEnvStimulusAuto,
} from './interaction'

export function createDefaultConfig(): CreatureConfig {
  const segCount = 18
  return {
    segmentCount: segCount,
    segmentLength: 14,
    headWidth: 16,
    tailTaper: 0.7,
    legs: [
      { attachIndex: 3, side: -1, upperLength: 22, lowerLength: 24, restAngle: Math.PI * 0.4 },
      { attachIndex: 3, side: 1, upperLength: 22, lowerLength: 24, restAngle: -Math.PI * 0.4 },
      { attachIndex: 7, side: -1, upperLength: 20, lowerLength: 22, restAngle: Math.PI * 0.45 },
      { attachIndex: 7, side: 1, upperLength: 20, lowerLength: 22, restAngle: -Math.PI * 0.45 },
      { attachIndex: 12, side: -1, upperLength: 22, lowerLength: 24, restAngle: Math.PI * 0.5 },
      { attachIndex: 12, side: 1, upperLength: 22, lowerLength: 24, restAngle: -Math.PI * 0.5 },
    ],
    behavior: {
      wanderSpeed: 1.2,
      curiousSpeed: 2.0,
      fleeSpeed: 3.5,
      turnRate: 0.03,
      curiosityRadius: 200,
      fleeRadius: 80,
      idleDuration: [1, 3],
      wanderDuration: [3, 8],
    },
    color: {
      head: '#2dd4a0',
      body: '#1a9e6f',
      tail: '#0d5e3a',
      eye: '#ffdd57',
      glow: '#2dd4a066',
    },
  }
}

export function createCreature(
  startX: number,
  startY: number,
  config?: Partial<CreatureConfig>
): { state: CreatureState; config: CreatureConfig } {
  const fullConfig = { ...createDefaultConfig(), ...config }
  const heading = Math.random() * Math.PI * 2

  const spine = createSpine(
    startX, startY,
    fullConfig.segmentCount,
    fullConfig.segmentLength,
    heading,
    fullConfig.headWidth,
    fullConfig.tailTaper
  )

  const legs = fullConfig.legs.map((legCfg, i) =>
    createLegState(legCfg, spine, i % 2 === 0 ? -1 : 1)
  )

  const personality = { ...createDefaultPersonality(), ...fullConfig.personality }

  const state: CreatureState = {
    spine,
    legs,
    behaviorState: BehaviorState.WANDERING,
    target: null,
    velocity: vec2(0, 0),
    heading,
    noiseOffset: Math.random() * 1000,
    stateTimer: randomRange(3, 8),
    breathPhase: 0,
    needs: createDefaultNeeds(),
    personality,
    memory: createMemory(vec2(startX, startY)),
    perception: createPerception(),
    physics: createPhysicsState(vec2(startX, startY)),
    gaitMode: GM.WALK,
    spinePose: SP.NORMAL,
    circadian: createCircadianState(),
    emotionBubbles: [],
    foodItems: [],
    obstacles: [],
    envStimuli: [],
    interactionCooldown: 0,
    lookAt: null,
    accumulatedTime: 0,
    stateCooldown: 0,
    lastFoodSpawnTime: 0,
    playChaseAngle: 0,
  }

  return { state, config: fullConfig }
}

function determineGaitMode(behaviorState: BehaviorState, speedMultiplier: number): GaitMode {
  if (behaviorState === BehaviorState.FLEEING) return GM.RUN
  if (behaviorState === BehaviorState.PLAYING) return GM.RUN
  if (behaviorState === BehaviorState.EXPLORING || behaviorState === BehaviorState.CURIOUS) return GM.STALK
  if (speedMultiplier > 2) return GM.RUN
  return GM.WALK
}

function determineSpinePose(behaviorState: BehaviorState): SpinePose {
  switch (behaviorState) {
    case BehaviorState.RESTING:
    case BehaviorState.SLEEPING:
      return SP.RESTING
    case BehaviorState.CURIOUS:
    case BehaviorState.EXPLORING:
      return SP.ALERT
    case BehaviorState.FLEEING:
      return SP.LOW
    case BehaviorState.GROOMING:
      return SP.CURLING
    default:
      return SP.NORMAL
  }
}

export function updateCreature(
  state: CreatureState,
  config: CreatureConfig,
  mousePos: Vec2 | null,
  mouseDown: boolean,
  bounds: WorldBounds,
  dt: number
): CreatureState {
  const newState = { ...state }

  newState.noiseOffset += dt
  newState.stateTimer -= dt
  newState.breathPhase += dt * 2
  newState.interactionCooldown = Math.max(0, state.interactionCooldown - dt)
  newState.stateCooldown = Math.max(0, state.stateCooldown - dt)
  newState.accumulatedTime += dt
  newState.playChaseAngle += dt * 3

  // Circadian
  newState.circadian = updateCircadian(state.circadian, dt)

  // Auto-spawn food
  const foodSpawnResult = spawnFoodAuto(
    state.foodItems, bounds, newState.accumulatedTime, state.lastFoodSpawnTime
  )
  newState.foodItems = foodSpawnResult.foods
  newState.lastFoodSpawnTime = foodSpawnResult.lastSpawnTime

  // Update env stimuli
  newState.envStimuli = updateEnvStimuli(state.envStimuli, dt)
  newState.envStimuli = spawnEnvStimulusAuto(newState.envStimuli, bounds, dt, newState.accumulatedTime)

  // Perception
  const headPos = state.spine[0].pos
  const headingVec = getSpineDirection(state.spine)
  newState.perception = updatePerception(
    state.perception, headPos, headingVec,
    mousePos, mouseDown, state.foodItems, state.obstacles, state.envStimuli, dt
  )

  // Update food items
  newState.foodItems = updateFoodItems(state.foodItems, dt)

  // Food eating - only in valid states
  const canEat = state.behaviorState === BehaviorState.EATING ||
    state.behaviorState === BehaviorState.CURIOUS ||
    state.behaviorState === BehaviorState.WANDERING ||
    state.behaviorState === BehaviorState.IDLE

  if (canEat) {
    const foodEaten = checkFoodEating(headPos, newState.foodItems)
    if (foodEaten) {
      const pref = FOOD_PREFERENCES[foodEaten.eaten.foodType]
      newState.needs = {
        ...newState.needs,
        hunger: clamp(newState.needs.hunger - foodEaten.eaten.nutrition, 0, 1),
        mood: clamp(newState.needs.mood + pref.moodEffect, 0, 1),
      }
      newState.memory = addInterestPoint(newState.memory, foodEaten.eaten.pos, 'food', 0.8)
      newState.foodItems = newState.foodItems.filter((_, i) => i !== foodEaten.index)
      newState.emotionBubbles = [...newState.emotionBubbles, createEmotionBubble('happy', headPos)]
    }
  }

  // Near user
  const isNearUser = mousePos ? distance(headPos, mousePos) < 150 : false

  // Update needs
  const isMoving = length(state.velocity) > 0.5
  const isEating = state.behaviorState === BehaviorState.EATING
  const isSleeping = state.behaviorState === BehaviorState.SLEEPING
  newState.needs = updateNeeds(
    state.needs, state.personality, isMoving, isNearUser, isEating, isSleeping,
    newState.circadian.daylight, dt
  )

  // Update memory
  newState.memory = updateMemory(state.memory, dt)
  if (isNearUser && mousePos) {
    newState.memory = addInterestPoint(newState.memory, mousePos, 'user', 0.6)
  }

  // Behavior
  const behaviorResult = updateBehavior({
    currentState: state.behaviorState,
    headPos: state.spine[0].pos,
    currentTarget: state.target,
    noiseOffset: state.noiseOffset,
    stateTimer: state.stateTimer,
    needs: newState.needs,
    personality: state.personality,
    memory: newState.memory,
    perception: newState.perception,
    circadian: newState.circadian,
    mousePos,
    mouseDown,
    foodItems: newState.foodItems,
    obstacles: state.obstacles,
    envStimuli: newState.envStimuli,
    bounds,
    dt,
    stateCooldown: state.stateCooldown,
    accumulatedTime: newState.accumulatedTime,
  })

  newState.target = behaviorResult.target

  if (behaviorResult.newState && behaviorResult.newState !== state.behaviorState) {
    newState.behaviorState = behaviorResult.newState
    const minDwell = MIN_DWELL_TIME[behaviorResult.newState] || 1.0
    newState.stateTimer = randomRange(minDwell, minDwell + 3)
    newState.stateCooldown = 0.8
  }

  // Emotion bubbles
  if (behaviorResult.emotionBubble) {
    newState.emotionBubbles = [
      ...newState.emotionBubbles,
      createEmotionBubble(behaviorResult.emotionBubble, headPos),
    ]
  }
  newState.emotionBubbles = updateEmotionBubbles(newState.emotionBubbles, dt)

  // Gait and pose
  newState.gaitMode = determineGaitMode(newState.behaviorState, behaviorResult.speedMultiplier)
  newState.spinePose = determineSpinePose(newState.behaviorState)

  // Steering
  let steeringForce = vec2(0, 0)
  if (newState.behaviorState === BehaviorState.FLEEING && mousePos && distance(headPos, mousePos) < 200) {
    steeringForce = computeFleeSteering(
      state.physics.position, mousePos,
      state.physics.maxSpeed, state.physics.maxForce,
      bounds, state.obstacles
    )
  } else {
    steeringForce = computeSteering({
      position: state.physics.position,
      velocity: state.physics.velocity,
      target: newState.target,
      maxSpeed: state.physics.maxSpeed * behaviorResult.speedMultiplier,
      maxForce: state.physics.maxForce,
      obstacles: state.obstacles,
      bounds,
      noiseOffset: state.noiseOffset,
      dt,
    })
  }

  // Physics with hard boundary
  newState.physics = updatePhysics(state.physics, steeringForce, dt, bounds)

  // Obstacle collision
  const collisionPush = checkObstacleCollision(newState.physics.position, state.obstacles)
  if (collisionPush) {
    newState.physics = { ...newState.physics, position: collisionPush }
  }

  // Spine
  const headTarget = newState.physics.position
  const spineCopy = state.spine.map(s => ({ ...s, pos: { ...s.pos } }))
  updateSpineChain(spineCopy, headTarget, config.segmentLength, 3, newState.spinePose, dt, newState.accumulatedTime)
  newState.spine = spineCopy

  // Heading and velocity
  const dir = getSpineDirection(newState.spine)
  newState.heading = Math.atan2(dir.y, dir.x)
  newState.velocity = sub(newState.spine[0].pos, state.spine[0].pos)

  // Look-at
  if (mousePos && distance(headPos, mousePos) < 300) {
    newState.lookAt = mousePos
  } else if (newState.target) {
    newState.lookAt = newState.target
  } else {
    newState.lookAt = null
  }

  // Legs
  const newLegs = state.legs.map((leg, i) => {
    const legState = { ...leg, footPos: { ...leg.footPos }, targetPos: { ...leg.targetPos } }
    updateLeg(legState, config.legs[i], newState.spine, behaviorResult.speedMultiplier, newState.gaitMode, i, dt, newState.accumulatedTime)
    return legState
  })
  newState.legs = newLegs

  return newState
}

export function getCreatureLegIKResults(
  state: CreatureState,
  config: CreatureConfig
): Array<{ hip: Vec2; knee: Vec2; foot: Vec2 }> {
  return state.legs.map((leg, i) =>
    getLegIKResult(leg, config.legs[i], state.spine)
  )
}
