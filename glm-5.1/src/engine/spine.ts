import type { Vec2 } from './vec2'
import { sub, add, scale, angle, fromAngle, constrainDist, rotate, normalize, length as vecLen } from './vec2'
import type { SpineSegment } from './types'

const SEGMENT_COUNT = 24
const SEGMENT_LENGTH = 12
const MAX_BEND_ANGLE = Math.PI * 0.12
const NECK_ALIGN_SEGMENTS = 6
const CONSTRAINT_ITERATIONS = 8
const WIDTH_HEAD = 14
const WIDTH_MID = 18
const WIDTH_TAIL = 2

const BREATH_AMPLITUDE = 0.04
const BREATH_FREQUENCY = 0.03
const WAVE_AMPLITUDE = 0.06
const WAVE_FREQUENCY = 0.12
const WAVE_DECAY = 0.88

export interface SpineState {
  segments: SpineSegment[]
  wavePhase: number
  breathPhase: number
}

function getNeckMaxBend(segmentIndex: number): number {
  if (segmentIndex >= NECK_ALIGN_SEGMENTS) return MAX_BEND_ANGLE
  const t = segmentIndex / NECK_ALIGN_SEGMENTS
  return MAX_BEND_ANGLE * (0.1 + t * 0.9)
}

export function createSpine(startX: number, startY: number): SpineState {
  const segments: SpineSegment[] = []
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    segments.push({
      pos: { x: startX - i * SEGMENT_LENGTH, y: startY },
      angle: 0,
      width: computeWidth(i, SEGMENT_COUNT),
      breathOffset: 0,
    })
  }
  return { segments, wavePhase: 0, breathPhase: 0 }
}

function computeWidth(index: number, total: number): number {
  const t = index / (total - 1)
  if (t < 0.15) {
    const s = t / 0.15
    return WIDTH_HEAD + (WIDTH_MID - WIDTH_HEAD) * s
  }
  if (t < 0.5) {
    return WIDTH_MID
  }
  const s = (t - 0.5) / 0.5
  return WIDTH_MID + (WIDTH_TAIL - WIDTH_MID) * s * s
}

export function updateSpine(
  spine: SpineState,
  headTarget: Vec2,
  headAngle: number,
  speed: number,
  time: number,
  isStartled: boolean,
): void {
  const { segments } = spine
  segments[0].pos = { ...headTarget }
  segments[0].angle = headAngle

  spine.wavePhase += WAVE_FREQUENCY * (1 + speed * 0.3)
  spine.breathPhase += BREATH_FREQUENCY

  for (let i = 1; i <= NECK_ALIGN_SEGMENTS && i < segments.length; i++) {
    segments[i].pos = add(segments[i - 1].pos, scale(fromAngle(headAngle + Math.PI), SEGMENT_LENGTH))
    segments[i].angle = headAngle + Math.PI
  }

  const breathScale = 1 + Math.sin(spine.breathPhase) * BREATH_AMPLITUDE

  for (let i = NECK_ALIGN_SEGMENTS + 1; i < segments.length; i++) {
    const prevAngle = segments[i - 1].angle
    const prevPos = segments[i - 1].pos

    const currentDir = sub(segments[i].pos, prevPos)
    let currentAngle = vecLen(currentDir) > 1e-6 ? angle(currentDir) : prevAngle

    let diff = currentAngle - prevAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2

    const t = i / (segments.length - 1)

    const neckDamping = i < NECK_ALIGN_SEGMENTS + 3 ? 1 - (NECK_ALIGN_SEGMENTS + 3 - i) / (NECK_ALIGN_SEGMENTS + 3) * 0.5 : 1
    const waveStrength = WAVE_AMPLITUDE * Math.pow(WAVE_DECAY, i) * (1 + speed * 0.3) * neckDamping
    const waveOffset = Math.sin(spine.wavePhase + i * 0.4) * waveStrength

    if (isStartled && t > 0.6) {
      const tailWhip = Math.sin(time * 0.3 + i * 0.8) * 0.15 * (t - 0.6) / 0.4
      diff += tailWhip
    }

    diff += waveOffset

    const maxBend = getNeckMaxBend(i)
    if (Math.abs(diff) > maxBend) {
      diff = Math.sign(diff) * maxBend
    }

    const segAngle = prevAngle + diff
    const segDir = fromAngle(segAngle)
    segments[i].pos = add(prevPos, scale(segDir, SEGMENT_LENGTH))
    segments[i].angle = segAngle
  }

  for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
    for (let i = 1; i < segments.length; i++) {
      const constrained = constrainDist(segments[i].pos, segments[i - 1].pos, SEGMENT_LENGTH)
      segments[i].pos = constrained
    }
  }

  for (let i = 1; i < segments.length; i++) {
    const dir = sub(segments[i].pos, segments[i - 1].pos)
    if (vecLen(dir) > 1e-6) {
      segments[i].angle = angle(dir)
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const t = i / (segments.length - 1)
    const breathFactor = Math.sin(spine.breathPhase + i * 0.15) * breathScale
    segments[i].breathOffset = breathFactor
    segments[i].width = computeWidth(i, segments.length) * (1 + (breathFactor - 1) * 0.3 * (1 - t * 0.5))
  }
}

export function getSpineNormal(spine: SpineState, index: number): Vec2 {
  const seg = spine.segments[index]
  return rotate(fromAngle(seg.angle), Math.PI / 2)
}

export function getSpinePoint(spine: SpineState, index: number, lateralOffset: number): Vec2 {
  const seg = spine.segments[index]
  const normal = getSpineNormal(spine, index)
  return add(seg.pos, scale(normal, lateralOffset))
}

export function getSpineDirection(spine: SpineState, index: number): Vec2 {
  if (index < spine.segments.length - 1) {
    return normalize(sub(spine.segments[index + 1].pos, spine.segments[index].pos))
  }
  return normalize(sub(spine.segments[index].pos, spine.segments[index - 1].pos))
}
