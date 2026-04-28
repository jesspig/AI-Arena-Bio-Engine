import type { Vec2 } from './vec2'
import { add, scale, fromAngle, dist, normalize, sub } from './vec2'
import type { BehaviorData, BehaviorState } from './types'

const WANDER_SPEED = 1.2
const HUNT_SPEED = 2.5
const STARTLE_SPEED = 4.0
const REST_SPEED = 0.3

const WANDER_DURATION_MIN = 120
const WANDER_DURATION_MAX = 300
const HUNT_DURATION = 600
const STARTLE_DURATION = 60
const REST_DURATION_MIN = 180
const REST_DURATION_MAX = 400

const STARTLE_DISTANCE = 80

export function createBehavior(startPos: Vec2): BehaviorData {
  return {
    state: 'wander',
    target: add(startPos, { x: 100, y: 0 }),
    stateTimer: 200,
    wanderAngle: 0,
    speed: WANDER_SPEED,
  }
}

export function updateBehavior(
  behavior: BehaviorData,
  headPos: Vec2,
  mousePos: Vec2 | null,
  canvasWidth: number,
  canvasHeight: number,
): Vec2 {
  behavior.stateTimer--

  const mouseDist = mousePos ? dist(headPos, mousePos) : Infinity

  if (behavior.state !== 'startle' && mousePos && mouseDist < STARTLE_DISTANCE) {
    transitionTo(behavior, 'startle', headPos, mousePos)
  }

  if (behavior.stateTimer <= 0) {
    switch (behavior.state) {
      case 'wander':
        if (mousePos && mouseDist < 300) {
          transitionTo(behavior, 'hunt', headPos, mousePos)
        } else if (Math.random() < 0.15) {
          transitionTo(behavior, 'rest', headPos, mousePos)
        } else {
          transitionTo(behavior, 'wander', headPos, mousePos)
        }
        break
      case 'hunt':
        transitionTo(behavior, 'wander', headPos, mousePos)
        break
      case 'startle':
        transitionTo(behavior, 'wander', headPos, mousePos)
        break
      case 'rest':
        transitionTo(behavior, 'wander', headPos, mousePos)
        break
    }
  }

  if (behavior.state === 'hunt' && mousePos) {
    behavior.target = { ...mousePos }
  }

  const margin = 80
  if (behavior.target.x < margin) behavior.target.x = margin
  if (behavior.target.x > canvasWidth - margin) behavior.target.x = canvasWidth - margin
  if (behavior.target.y < margin) behavior.target.y = margin
  if (behavior.target.y > canvasHeight - margin) behavior.target.y = canvasHeight - margin

  const dir = normalize(sub(behavior.target, headPos))
  return scale(dir, behavior.speed)
}

function transitionTo(behavior: BehaviorData, newState: BehaviorState, headPos: Vec2, mousePos: Vec2 | null): void {
  behavior.state = newState

  switch (newState) {
    case 'wander':
      behavior.speed = WANDER_SPEED
      behavior.stateTimer = WANDER_DURATION_MIN + Math.random() * (WANDER_DURATION_MAX - WANDER_DURATION_MIN)
      behavior.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.8
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 150 + Math.random() * 100))
      break
    case 'hunt':
      behavior.speed = HUNT_SPEED
      behavior.stateTimer = HUNT_DURATION
      if (mousePos) behavior.target = { ...mousePos }
      break
    case 'startle':
      behavior.speed = STARTLE_SPEED
      behavior.stateTimer = STARTLE_DURATION
      if (mousePos) {
        const fleeDir = normalize(sub(headPos, mousePos))
        behavior.target = add(headPos, scale(fleeDir, 200))
      }
      break
    case 'rest':
      behavior.speed = REST_SPEED
      behavior.stateTimer = REST_DURATION_MIN + Math.random() * (REST_DURATION_MAX - REST_DURATION_MIN)
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 30))
      break
  }
}
