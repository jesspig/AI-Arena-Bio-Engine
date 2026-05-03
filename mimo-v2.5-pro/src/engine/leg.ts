import type { LegConfig, LegState, SpineSegment, Vec2 } from './types'
import { vec2, add, sub, scale, length, normalize, distance, fromAngle, angleOf, lerp, clamp } from './math'
import { getSpineNormal } from './spine'

export function createLegState(
  config: LegConfig,
  spine: SpineSegment[],
  kneeSide: -1 | 1
): LegState {
  const attachPt = spine[config.attachIndex]
  const normal = getSpineNormal(spine, config.attachIndex)
  const sideOffset = scale(normal, config.side * 20)
  const footPos = add(add(attachPt.pos, sideOffset), vec2(0, config.upperLength + config.lowerLength))
  return {
    footPos: { ...footPos },
    targetPos: { ...footPos },
    isPlanted: true,
    liftPhase: 0,
    kneeSide,
  }
}

export function solveIK2Joint(
  origin: Vec2,
  target: Vec2,
  upperLen: number,
  lowerLen: number,
  kneeSide: -1 | 1
): { hip: Vec2; knee: Vec2; foot: Vec2 } {
  const diff = sub(target, origin)
  const dist = length(diff)
  const totalLen = upperLen + lowerLen

  // Target unreachable - stretch toward it
  if (dist >= totalLen) {
    const dir = normalize(diff)
    return {
      hip: origin,
      knee: add(origin, scale(dir, upperLen)),
      foot: add(origin, scale(dir, totalLen)),
    }
  }

  // Target too close
  if (dist < Math.abs(upperLen - lowerLen) + 0.01) {
    const dir = normalize(diff)
    return {
      hip: origin,
      knee: add(origin, scale(dir, upperLen)),
      foot: add(origin, scale(dir, upperLen + lowerLen * 0.1)),
    }
  }

  // Law of cosines for the knee angle
  const a = upperLen
  const b = lowerLen
  const c = dist

  const cosAngleA = (a * a + c * c - b * b) / (2 * a * c)
  const angleA = Math.acos(clamp(cosAngleA, -1, 1))

  const baseAngle = angleOf(origin, target)
  const kneeAngle = baseAngle + kneeSide * angleA

  const knee = add(origin, fromAngle(kneeAngle, upperLen))

  return {
    hip: origin,
    knee,
    foot: target,
  }
}

export function updateLeg(
  leg: LegState,
  config: LegConfig,
  spine: SpineSegment[],
  speed: number,
  dt: number
): void {
  const attachPt = spine[config.attachIndex]
  const normal = getSpineNormal(spine, config.attachIndex)
  const sideOffset = scale(normal, config.side * 15)

  // The natural foot position moves with the body
  const restOffset = fromAngle(attachPt.angle + config.restAngle, config.upperLength + config.lowerLength)
  const naturalFootPos = add(add(attachPt.pos, sideOffset), restOffset)

  if (leg.isPlanted) {
    // Check if foot is too far from natural position
    const dist = distance(leg.footPos, naturalFootPos)
    const maxReach = (config.upperLength + config.lowerLength) * 0.7

    if (dist > maxReach) {
      // Start lifting foot
      leg.isPlanted = false
      leg.liftPhase = 0
      leg.targetPos = naturalFootPos
    }
  }

  if (!leg.isPlanted) {
    // Animate foot lift and move to new position
    leg.liftPhase += speed * dt * 3

    if (leg.liftPhase >= 1) {
      // Plant foot
      leg.footPos = { ...naturalFootPos }
      leg.isPlanted = true
      leg.liftPhase = 0
    } else {
      // Arc movement
      const t = leg.liftPhase
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      const midPoint = {
        x: lerp(leg.footPos.x, naturalFootPos.x, easedT),
        y: lerp(leg.footPos.y, naturalFootPos.y, easedT) - 20 * Math.sin(t * Math.PI),
      }

      leg.targetPos = midPoint
    }
  } else {
    leg.targetPos = { ...leg.footPos }
  }
}

export function getLegIKResult(
  leg: LegState,
  config: LegConfig,
  spine: SpineSegment[]
): { hip: Vec2; knee: Vec2; foot: Vec2 } {
  const attachPt = spine[config.attachIndex]
  const normal = getSpineNormal(spine, config.attachIndex)
  const sideOffset = scale(normal, config.side * 10)
  const hipPos = add(attachPt.pos, sideOffset)

  return solveIK2Joint(
    hipPos,
    leg.isPlanted ? leg.footPos : leg.targetPos,
    config.upperLength,
    config.lowerLength,
    leg.kneeSide
  )
}
