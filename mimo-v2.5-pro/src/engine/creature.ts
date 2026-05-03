import type { CreatureConfig, CreatureState, WorldBounds, Vec2 } from './types'
import { BehaviorState } from './types'
import { vec2, add, sub, scale, length, distance, randomRange } from './math'
import { createSpine, updateSpineChain, moveHeadToward, getSpineDirection } from './spine'
import { createLegState, updateLeg, getLegIKResult } from './leg'
import { updateBehavior, createDefaultBehaviorConfig } from './behavior'

export function createDefaultConfig(): CreatureConfig {
  const segCount = 18
  return {
    segmentCount: segCount,
    segmentLength: 14,
    headWidth: 16,
    tailTaper: 0.7,
    legs: [
      // Front left
      { attachIndex: 3, side: -1, upperLength: 22, lowerLength: 24, restAngle: Math.PI * 0.4 },
      // Front right
      { attachIndex: 3, side: 1, upperLength: 22, lowerLength: 24, restAngle: -Math.PI * 0.4 },
      // Mid-left
      { attachIndex: 7, side: -1, upperLength: 20, lowerLength: 22, restAngle: Math.PI * 0.45 },
      // Mid-right
      { attachIndex: 7, side: 1, upperLength: 20, lowerLength: 22, restAngle: -Math.PI * 0.45 },
      // Rear left
      { attachIndex: 12, side: -1, upperLength: 22, lowerLength: 24, restAngle: Math.PI * 0.5 },
      // Rear right
      { attachIndex: 12, side: 1, upperLength: 22, lowerLength: 24, restAngle: -Math.PI * 0.5 },
    ],
    behavior: createDefaultBehaviorConfig(),
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
  }

  return { state, config: fullConfig }
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

  // Update timers
  newState.noiseOffset += dt
  newState.stateTimer -= dt
  newState.breathPhase += dt * 2

  // Update behavior
  const behaviorResult = updateBehavior({
    currentState: state.behaviorState,
    headPos: state.spine[0].pos,
    currentTarget: state.target,
    noiseOffset: state.noiseOffset,
    stateTimer: state.stateTimer,
    mousePos,
    mouseDown,
    config: config.behavior,
    bounds,
    dt,
  })

  newState.target = behaviorResult.target

  if (behaviorResult.newState && behaviorResult.newState !== state.behaviorState) {
    newState.behaviorState = behaviorResult.newState
    newState.stateTimer = behaviorResult.newState === BehaviorState.IDLE
      ? randomRange(config.behavior.idleDuration[0], config.behavior.idleDuration[1])
      : randomRange(config.behavior.wanderDuration[0], config.behavior.wanderDuration[1])
  }

  // Move head toward target
  const speed = config.behavior.wanderSpeed * behaviorResult.speedMultiplier * dt * 60
  const newHeadPos = moveHeadToward(state.spine, newState.target, speed, config.segmentLength)

  // Update spine chain
  const spineCopy = state.spine.map(s => ({ ...s, pos: { ...s.pos } }))
  updateSpineChain(spineCopy, newHeadPos, config.segmentLength, 3)
  newState.spine = spineCopy

  // Update heading
  const dir = getSpineDirection(newState.spine)
  newState.heading = Math.atan2(dir.y, dir.x)

  // Update velocity
  newState.velocity = sub(newState.spine[0].pos, state.spine[0].pos)

  // Update legs
  const newLegs = state.legs.map((leg, i) => {
    const legState = { ...leg, footPos: { ...leg.footPos }, targetPos: { ...leg.targetPos } }
    updateLeg(legState, config.legs[i], newState.spine, behaviorResult.speedMultiplier, dt)
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
