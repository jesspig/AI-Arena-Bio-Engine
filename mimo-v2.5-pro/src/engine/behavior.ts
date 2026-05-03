import type { BehaviorConfig, Vec2, WorldBounds } from './types'
import { BehaviorState } from './types'
import { vec2, add, sub, scale, normalize, distance, noise2D } from './math'

export interface BehaviorUpdate {
  target: Vec2
  speedMultiplier: number
  newState?: BehaviorState
}

export interface BehaviorContext {
  currentState: BehaviorState
  headPos: Vec2
  currentTarget: Vec2 | null
  noiseOffset: number
  stateTimer: number
  mousePos: Vec2 | null
  mouseDown: boolean
  config: BehaviorConfig
  bounds: WorldBounds
  dt: number
}

export function createDefaultBehaviorConfig(): BehaviorConfig {
  return {
    wanderSpeed: 1.2,
    curiousSpeed: 2.0,
    fleeSpeed: 3.5,
    turnRate: 0.03,
    curiosityRadius: 200,
    fleeRadius: 80,
    idleDuration: [1, 3],
    wanderDuration: [3, 8],
  }
}

export function updateBehavior(ctx: BehaviorContext): BehaviorUpdate {
  const { currentState, headPos, currentTarget, noiseOffset, stateTimer, mousePos, mouseDown, config, bounds, dt } = ctx
  const time = noiseOffset + dt

  // Check for mouse interaction
  if (mousePos) {
    const distToMouse = distance(headPos, mousePos)

    if (mouseDown && distToMouse < config.curiosityRadius) {
      // Mouse is pressing nearby - flee!
      if (currentState !== BehaviorState.FLEEING) {
        const fleeDir = normalize(sub(headPos, mousePos))
        const fleeTarget = add(headPos, scale(fleeDir, 200))
        return {
          target: clampToBounds(fleeTarget, bounds),
          speedMultiplier: config.fleeSpeed,
          newState: BehaviorState.FLEEING,
        }
      }
    }

    if (!mouseDown && distToMouse < config.curiosityRadius) {
      // Mouse is nearby but not pressing - be curious
      if (currentState !== BehaviorState.CURIOUS) {
        return {
          target: mousePos,
          speedMultiplier: config.curiousSpeed,
          newState: BehaviorState.CURIOUS,
        }
      }
    }
  }

  // State transitions based on timer
  switch (currentState) {
    case BehaviorState.IDLE: {
      if (stateTimer <= 0) {
        return {
          target: generateWanderTarget(headPos, noiseOffset, bounds),
          speedMultiplier: config.wanderSpeed,
          newState: BehaviorState.WANDERING,
        }
      }
      return {
        target: currentTarget || headPos,
        speedMultiplier: 0,
      }
    }

    case BehaviorState.WANDERING: {
      if (stateTimer <= 0) {
        // Sometimes transition to idle, sometimes keep wandering
        const roll = Math.random()
        if (roll < 0.3) {
          return {
            target: currentTarget || headPos,
            speedMultiplier: 0,
            newState: BehaviorState.IDLE,
          }
        }
      }

      // Smooth noise-based direction changes
      const noiseX = noise2D(noiseOffset * 0.3, 0) * 2 - 1
      const noiseY = noise2D(0, noiseOffset * 0.3) * 2 - 1
      const currentDir = currentTarget ? normalize(sub(currentTarget, headPos)) : vec2(1, 0)
      const noiseDir = normalize(vec2(
        currentDir.x + noiseX * config.turnRate,
        currentDir.y + noiseY * config.turnRate
      ))

      const lookAhead = scale(noiseDir, 100)
      const target = add(headPos, lookAhead)

      return {
        target: clampToBounds(target, bounds),
        speedMultiplier: config.wanderSpeed,
      }
    }

    case BehaviorState.CURIOUS: {
      if (mousePos && distance(headPos, mousePos) < 30) {
        // Close enough to investigate
        return {
          target: mousePos,
          speedMultiplier: config.wanderSpeed * 0.5,
          newState: BehaviorState.IDLE,
        }
      }

      if (!mousePos || distance(headPos, mousePos) > config.curiosityRadius * 1.5) {
        // Lost interest
        return {
          target: generateWanderTarget(headPos, noiseOffset, bounds),
          speedMultiplier: config.wanderSpeed,
          newState: BehaviorState.WANDERING,
        }
      }

      return {
        target: mousePos,
        speedMultiplier: config.curiousSpeed,
      }
    }

    case BehaviorState.FLEEING: {
      if (stateTimer <= 0) {
        return {
          target: generateWanderTarget(headPos, noiseOffset, bounds),
          speedMultiplier: config.wanderSpeed,
          newState: BehaviorState.WANDERING,
        }
      }

      // Keep fleeing in current direction
      const fleeDir = currentTarget
        ? normalize(sub(currentTarget, headPos))
        : normalize(vec2(Math.random() - 0.5, Math.random() - 0.5))

      return {
        target: clampToBounds(add(headPos, scale(fleeDir, 150)), bounds),
        speedMultiplier: config.fleeSpeed,
      }
    }
  }

  return {
    target: currentTarget || headPos,
    speedMultiplier: config.wanderSpeed,
  }
}

function generateWanderTarget(pos: Vec2, noiseOffset: number, bounds: WorldBounds): Vec2 {
  const angle = noise2D(noiseOffset * 0.5, 100) * Math.PI * 2
  const dist = 80 + noise2D(noiseOffset * 0.5, 200) * 120
  const target = {
    x: pos.x + Math.cos(angle) * dist,
    y: pos.y + Math.sin(angle) * dist,
  }
  return clampToBounds(target, bounds)
}

function clampToBounds(pos: Vec2, bounds: WorldBounds): Vec2 {
  const margin = 50
  return {
    x: Math.max(margin, Math.min(bounds.width - margin, pos.x)),
    y: Math.max(margin, Math.min(bounds.height - margin, pos.y)),
  }
}
