import type { Vec2 } from './vec2'
import { sub, add, scale, angle, fromAngle, constrainDist, rotate } from './vec2'
import type { SpineSegment } from './types'

const SEGMENT_COUNT = 24
const SEGMENT_LENGTH = 12
const MAX_BEND_ANGLE = Math.PI * 0.35
const CONSTRAINT_ITERATIONS = 4
const WIDTH_HEAD = 14
const WIDTH_MID = 18
const WIDTH_TAIL = 2

export interface SpineState {
  segments: SpineSegment[]
}

export function createSpine(startX: number, startY: number): SpineState {
  const segments: SpineSegment[] = []
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    segments.push({
      pos: { x: startX - i * SEGMENT_LENGTH, y: startY },
      angle: 0,
      width: computeWidth(i, SEGMENT_COUNT),
    })
  }
  return { segments }
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

export function updateSpine(spine: SpineState, headTarget: Vec2, headAngle: number): void {
  const { segments } = spine
  segments[0].pos = { ...headTarget }
  segments[0].angle = headAngle

  for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
    for (let i = 1; i < segments.length; i++) {
      segments[i].pos = constrainDist(segments[i].pos, segments[i - 1].pos, SEGMENT_LENGTH)
    }
  }

  for (let i = 1; i < segments.length; i++) {
    const dir = sub(segments[i].pos, segments[i - 1].pos)
    let a = angle(dir)
    const prevAngle = segments[i - 1].angle
    let diff = a - prevAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    if (Math.abs(diff) > MAX_BEND_ANGLE) {
      diff = Math.sign(diff) * MAX_BEND_ANGLE
      a = prevAngle + diff
      const dir2 = fromAngle(a)
      segments[i].pos = add(segments[i - 1].pos, scale(dir2, SEGMENT_LENGTH))
    }
    segments[i].angle = a
  }

  for (let i = 0; i < segments.length; i++) {
    segments[i].width = computeWidth(i, segments.length)
  }
}

export function getSpineNormal(spine: SpineState, index: number): Vec2 {
  const seg = spine.segments[index]
  const normal = rotate(fromAngle(seg.angle), Math.PI / 2)
  return normal
}

export function getSpinePoint(spine: SpineState, index: number, lateralOffset: number): Vec2 {
  const seg = spine.segments[index]
  const normal = getSpineNormal(spine, index)
  return add(seg.pos, scale(normal, lateralOffset))
}
