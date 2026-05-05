import type { Vec2, PhysicsState, WorldBounds } from './types'
import { vec2, add, sub, scale, length, normalize, distance, clamp } from './math'

export function createPhysicsState(
  pos: Vec2,
  mass: number = 1,
  maxSpeed: number = 120,
  maxForce: number = 200
): PhysicsState {
  return {
    position: { ...pos },
    velocity: vec2(0, 0),
    acceleration: vec2(0, 0),
    mass,
    maxSpeed,
    maxForce,
  }
}

function truncate(v: Vec2, maxLen: number): Vec2 {
  const len = length(v)
  if (len <= maxLen) return v
  return scale(normalize(v), maxLen)
}

function seek(pos: Vec2, target: Vec2, maxSpeed: number): Vec2 {
  const desired = sub(target, pos)
  const dist = length(desired)
  if (dist < 1) return vec2(0, 0)

  let speed = maxSpeed
  if (dist < 100) {
    speed = maxSpeed * (dist / 100)
  }
  const desiredNorm = scale(desired, 1 / dist)
  return scale(desiredNorm, speed)
}

function flee(pos: Vec2, threat: Vec2, maxSpeed: number, panicRadius: number = 150): Vec2 {
  const dist = distance(pos, threat)
  if (dist > panicRadius) return vec2(0, 0)

  const desired = sub(pos, threat)
  const desiredNorm = normalize(desired)
  const strength = 1 - (dist / panicRadius)
  return scale(desiredNorm, maxSpeed * strength * 2)
}

function arrive(pos: Vec2, target: Vec2, maxSpeed: number, slowRadius: number = 100): Vec2 {
  const desired = sub(target, pos)
  const dist = length(desired)
  if (dist < 1) return vec2(0, 0)

  let speed = maxSpeed
  if (dist < slowRadius) {
    speed = maxSpeed * (dist / slowRadius)
  }
  const desiredNorm = scale(desired, 1 / dist)
  return scale(desiredNorm, speed)
}

function wander(
  pos: Vec2,
  vel: Vec2,
  noiseOffset: number,
  maxSpeed: number,
  wanderRadius: number = 40,
  wanderDist: number = 60
): Vec2 {
  const velLen = length(vel)
  const dir = velLen > 0.1 ? normalize(vel) : vec2(Math.cos(noiseOffset), Math.sin(noiseOffset))

  const circleCenter = add(pos, scale(dir, wanderDist))
  const angle = noiseOffset * 2.5
  const offset = vec2(
    Math.cos(angle) * wanderRadius,
    Math.sin(angle) * wanderRadius
  )
  const target = add(circleCenter, offset)
  return seek(pos, target, maxSpeed * 0.6)
}

function obstacleAvoidance(
  pos: Vec2,
  vel: Vec2,
  obstacles: Array<{ pos: Vec2; radius: number }>,
  maxSpeed: number,
  lookAhead: number = 80
): Vec2 {
  const velLen = length(vel)
  if (velLen < 0.1) return vec2(0, 0)

  const dir = normalize(vel)
  let avoidForce = vec2(0, 0)

  for (const obs of obstacles) {
    const toObs = sub(obs.pos, pos)
    const dist = length(toObs)
    const threatDist = obs.radius + lookAhead

    if (dist > threatDist) continue

    const dotProduct = dir.x * toObs.x + dir.y * toObs.y
    if (dotProduct < 0) continue

    const projLen = dotProduct / velLen
    if (projLen > lookAhead) continue

    const projPoint = add(pos, scale(dir, projLen))
    const lateralDist = distance(projPoint, obs.pos)

    if (lateralDist < obs.radius + 20) {
      const perpDir = vec2(-dir.y, dir.x)
      const side = (toObs.x * perpDir.x + toObs.y * perpDir.y) > 0 ? -1 : 1
      const strength = (1 - dist / threatDist) * maxSpeed * 1.5
      avoidForce = add(avoidForce, scale(perpDir, side * strength))
    }
  }

  return truncate(avoidForce, maxSpeed * 2)
}

function boundaryForce(
  pos: Vec2,
  bounds: WorldBounds,
  margin: number = 80,
  maxSpeed: number = 120
): Vec2 {
  let fx = 0
  let fy = 0

  if (pos.x < margin) {
    const t = (margin - pos.x) / margin
    fx = t * t * maxSpeed * 2
  } else if (pos.x > bounds.width - margin) {
    const t = (pos.x - (bounds.width - margin)) / margin
    fx = -(t * t * maxSpeed * 2)
  }

  if (pos.y < margin) {
    const t = (margin - pos.y) / margin
    fy = t * t * maxSpeed * 2
  } else if (pos.y > bounds.height - margin) {
    const t = (pos.y - (bounds.height - margin)) / margin
    fy = -(t * t * maxSpeed * 2)
  }

  return vec2(fx, fy)
}

export function clampToWorldBounds(pos: Vec2, bounds: WorldBounds, margin: number = 15): Vec2 {
  return {
    x: clamp(pos.x, margin, bounds.width - margin),
    y: clamp(pos.y, margin, bounds.height - margin),
  }
}

export interface SteeringContext {
  position: Vec2
  velocity: Vec2
  target: Vec2 | null
  maxSpeed: number
  maxForce: number
  obstacles: Array<{ pos: Vec2; radius: number }>
  bounds: WorldBounds
  noiseOffset: number
  dt: number
}

export function computeSteering(ctx: SteeringContext): Vec2 {
  const { position, velocity, target, maxSpeed, maxForce, obstacles, bounds, noiseOffset } = ctx

  let steering = vec2(0, 0)

  if (target) {
    const dist = distance(position, target)
    if (dist > 5) {
      const seekForce = arrive(position, target, maxSpeed)
      steering = add(steering, seekForce)
    }
  }

  const wanderForce = wander(position, velocity, noiseOffset, maxSpeed)
  steering = add(steering, scale(wanderForce, 0.3))

  const avoidForce = obstacleAvoidance(position, velocity, obstacles, maxSpeed)
  steering = add(steering, avoidForce)

  const boundForce = boundaryForce(position, bounds, 80, maxSpeed)
  steering = add(steering, boundForce)

  return truncate(steering, maxForce)
}

export function computeFleeSteering(
  position: Vec2,
  threat: Vec2,
  maxSpeed: number,
  maxForce: number,
  bounds: WorldBounds,
  obstacles: Array<{ pos: Vec2; radius: number }>
): Vec2 {
  const clampedThreat = clampToWorldBounds(threat, bounds, 50)
  let steering = flee(position, clampedThreat, maxSpeed)

  const avoidForce = obstacleAvoidance(position, sub(position, clampedThreat), obstacles, maxSpeed)
  steering = add(steering, avoidForce)

  const boundForce = boundaryForce(position, bounds, 60, maxSpeed * 1.5)
  steering = add(steering, boundForce)

  return truncate(steering, maxForce * 1.5)
}

export function updatePhysics(
  physics: PhysicsState,
  steeringForce: Vec2,
  dt: number,
  bounds?: WorldBounds
): PhysicsState {
  const acc = scale(steeringForce, 1 / physics.mass)
  let newVel = add(physics.velocity, scale(acc, dt))
  newVel = truncate(newVel, physics.maxSpeed)
  newVel = scale(newVel, 0.97)

  let newPos = add(physics.position, scale(newVel, dt))

  if (bounds) {
    newPos = clampToWorldBounds(newPos, bounds, 10)
  }

  return {
    ...physics,
    position: newPos,
    velocity: newVel,
    acceleration: acc,
  }
}
