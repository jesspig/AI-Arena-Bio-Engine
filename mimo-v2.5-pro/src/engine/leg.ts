import type { LegConfig, LegState, SpineSegment, Vec2, GaitMode } from './types'
import { GaitMode as GM } from './types'
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

  if (dist >= totalLen) {
    const dir = normalize(diff)
    return {
      hip: origin,
      knee: add(origin, scale(dir, upperLen)),
      foot: add(origin, scale(dir, totalLen)),
    }
  }

  if (dist < Math.abs(upperLen - lowerLen) + 0.01) {
    const dir = normalize(diff)
    return {
      hip: origin,
      knee: add(origin, scale(dir, upperLen)),
      foot: add(origin, scale(dir, upperLen + lowerLen * 0.1)),
    }
  }

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

interface GaitParams {
  liftThreshold: number
  liftSpeed: number
  liftHeight: number
  stagger: number
}

function getGaitParams(mode: GaitMode, speedMultiplier: number): GaitParams {
  switch (mode) {
    case GM.RUN:
      return {
        liftThreshold: 0.5,
        liftSpeed: speedMultiplier * 4.5,
        liftHeight: 28,
        stagger: 0,
      }
    case GM.STALK:
      return {
        liftThreshold: 0.8,
        liftSpeed: speedMultiplier * 1.5,
        liftHeight: 10,
        stagger: 0.3,
      }
    case GM.WALK:
    default:
      return {
        liftThreshold: 0.7,
        liftSpeed: speedMultiplier * 3,
        liftHeight: 20,
        stagger: 0,
      }
  }
}

export function updateLeg(
  leg: LegState,
  config: LegConfig,
  spine: SpineSegment[],
  speedMultiplier: number,
  gaitMode: GaitMode,
  legIndex: number,
  dt: number,
  _accumulatedTime: number = 0
): void {
  const attachPt = spine[config.attachIndex]
  const normal = getSpineNormal(spine, config.attachIndex)
  const sideOffset = scale(normal, config.side * 15)

  const restOffset = fromAngle(attachPt.angle + config.restAngle, config.upperLength + config.lowerLength)
  const naturalFootPos = add(add(attachPt.pos, sideOffset), restOffset)

  const gait = getGaitParams(gaitMode, speedMultiplier)

  const pairPhase = (legIndex % 2 === 0) ? 0 : Math.PI
  const groupPhase = Math.floor(legIndex / 2) * (Math.PI / 3)
  const phaseOffset = pairPhase + groupPhase + gait.stagger * legIndex

  if (leg.isPlanted) {
    const dist = distance(leg.footPos, naturalFootPos)
    const dynamicThreshold = (config.upperLength + config.lowerLength) * gait.liftThreshold

    if (dist > dynamicThreshold) {
      leg.isPlanted = false
      leg.liftPhase = 0
      leg.targetPos = naturalFootPos
    }
  }

  if (!leg.isPlanted) {
    leg.liftPhase += gait.liftSpeed * dt

    if (leg.liftPhase >= 1) {
      leg.footPos = { ...naturalFootPos }
      leg.isPlanted = true
      leg.liftPhase = 0
    } else {
      const t = leg.liftPhase
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      const midPoint = {
        x: lerp(leg.footPos.x, naturalFootPos.x, easedT),
        y: lerp(leg.footPos.y, naturalFootPos.y, easedT) - gait.liftHeight * Math.sin(t * Math.PI),
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
