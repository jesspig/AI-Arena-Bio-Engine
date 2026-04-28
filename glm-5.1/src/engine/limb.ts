import type { Vec2 } from './vec2'
import { sub, add, scale, normalize, length, dist, lerp, fromAngle, angle } from './vec2'
import type { LimbConfig, LimbState } from './types'
import type { SpineState } from './spine'
import { getSpinePoint } from './spine'

const LIFT_DISTANCE = 50
const STEP_DURATION = 12
const GROUND_OFFSET = 28

export function createLimbState(): LimbState {
  return {
    hip: { x: 0, y: 0 },
    knee: { x: 0, y: 0 },
    foot: { x: 0, y: 0 },
    footTarget: { x: 0, y: 0 },
    isPlanted: true,
    plantTimer: 0,
  }
}

export function computeHipPosition(spine: SpineState, config: LimbConfig): Vec2 {
  const lateralOffset = config.side === 'left' ? -spine.segments[config.attachSpineIndex].width : spine.segments[config.attachSpineIndex].width
  return getSpinePoint(spine, config.attachSpineIndex, lateralOffset * 0.8)
}

function solveTwoJointIK(hip: Vec2, target: Vec2, upperLen: number, lowerLen: number, bendSign: number): { knee: Vec2; foot: Vec2 } {
  const d = dist(hip, target)
  const maxReach = upperLen + lowerLen - 0.5
  const minReach = Math.abs(upperLen - lowerLen) + 0.5

  let clampedTarget = target
  if (d > maxReach) {
    const dir = normalize(sub(target, hip))
    clampedTarget = add(hip, scale(dir, maxReach))
  } else if (d < minReach) {
    const dir = normalize(sub(target, hip))
    clampedTarget = add(hip, scale(dir, minReach))
  }

  const actualDist = dist(hip, clampedTarget)
  const cosKnee = (upperLen * upperLen + lowerLen * lowerLen - actualDist * actualDist) / (2 * upperLen * lowerLen)
  Math.max(-1, Math.min(1, cosKnee))

  const cosHip = (upperLen * upperLen + actualDist * actualDist - lowerLen * lowerLen) / (2 * upperLen * actualDist)
  const clampedCosHip = Math.max(-1, Math.min(1, cosHip))
  const hipOffset = Math.acos(clampedCosHip)

  const baseAngle = angle(sub(clampedTarget, hip))
  const kneeDir = baseAngle + bendSign * hipOffset

  const knee = add(hip, scale(fromAngle(kneeDir), upperLen))

  return { knee, foot: clampedTarget }
}

export function updateLimb(
  limb: LimbState,
  config: LimbConfig,
  spine: SpineState,
  headVelocity: Vec2,
  time: number,
): void {
  const hip = computeHipPosition(spine, config)
  limb.hip = hip

  const hipToFootDist = dist(hip, limb.foot)

  if (limb.isPlanted && hipToFootDist > LIFT_DISTANCE) {
    limb.isPlanted = false
    limb.plantTimer = 0
    const velDir = normalize(headVelocity)
    const speed = length(headVelocity)
    const stepReach = Math.min(speed * 8, 40)
    const baseTarget = add(hip, scale(velDir, stepReach))
    limb.footTarget = {
      x: baseTarget.x,
      y: hip.y + GROUND_OFFSET + Math.sin(time * 0.1) * 2,
    }
  }

  if (!limb.isPlanted) {
    limb.plantTimer++
    const t = Math.min(limb.plantTimer / STEP_DURATION, 1)
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    limb.foot = lerp(limb.foot, limb.footTarget, eased)
    if (t >= 1) {
      limb.isPlanted = true
      limb.foot = { ...limb.footTarget }
    }
  }

  const bendSign = config.side === 'left' ? -1 : 1
  const result = solveTwoJointIK(limb.hip, limb.foot, config.upperLength, config.lowerLength, bendSign * config.elbowBend)
  limb.knee = result.knee
  limb.foot = result.foot
}
