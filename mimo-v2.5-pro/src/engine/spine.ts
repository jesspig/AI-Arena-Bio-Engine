import type { SpineSegment, Vec2 } from './types'
import { vec2, sub, add, scale, normalize, length, fromAngle, angleOf, distance } from './math'

export function createSpine(
  startX: number,
  startY: number,
  segmentCount: number,
  segmentLength: number,
  heading: number,
  headWidth: number,
  tailTaper: number
): SpineSegment[] {
  const segments: SpineSegment[] = []
  for (let i = 0; i < segmentCount; i++) {
    const t = i / (segmentCount - 1)
    const width = headWidth * (1 - t * tailTaper)
    const pos = {
      x: startX - Math.cos(heading) * segmentLength * i,
      y: startY - Math.sin(heading) * segmentLength * i,
    }
    segments.push({ pos, angle: heading, width })
  }
  return segments
}

export function updateSpineChain(
  segments: SpineSegment[],
  headTarget: Vec2,
  segmentLength: number,
  iterations: number = 3
): void {
  // Move head toward target
  segments[0].pos = headTarget
  segments[0].angle = angleOf(segments[0].pos, segments[1].pos)

  // Forward pass: update angles from head to tail
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const curr = segments[i]
    const dir = normalize(sub(curr.pos, prev.pos))
    curr.pos = add(prev.pos, scale(dir, segmentLength))
    curr.angle = angleOf(prev.pos, curr.pos)
  }

  // Constraint iterations: pull segments to maintain distance
  for (let iter = 0; iter < iterations; iter++) {
    // Keep head fixed
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1]
      const curr = segments[i]
      const diff = sub(curr.pos, prev.pos)
      const dist = length(diff)
      if (dist < 0.001) {
        curr.pos = add(prev.pos, fromAngle(curr.angle, segmentLength))
      } else {
        const correction = scale(normalize(diff), segmentLength)
        curr.pos = add(prev.pos, correction)
      }
    }

    // Update angles after correction
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].angle = angleOf(segments[i].pos, segments[i + 1].pos)
    }
    if (segments.length > 1) {
      segments[segments.length - 1].angle = segments[segments.length - 2].angle
    }
  }
}

export function moveHeadToward(
  segments: SpineSegment[],
  target: Vec2,
  speed: number,
  segmentLength: number
): Vec2 {
  const head = segments[0]
  const diff = sub(target, head.pos)
  const dist = length(diff)

  if (dist < speed) {
    return target
  }

  const dir = normalize(diff)
  return add(head.pos, scale(dir, speed))
}

export function getSpineDirection(segments: SpineSegment[]): Vec2 {
  if (segments.length < 2) return vec2(1, 0)
  return normalize(sub(segments[0].pos, segments[1].pos))
}

export function getSpinePointAt(
  segments: SpineSegment[],
  t: number
): Vec2 {
  const idx = t * (segments.length - 1)
  const i = Math.floor(idx)
  const frac = idx - i

  if (i >= segments.length - 1) return segments[segments.length - 1].pos

  return {
    x: segments[i].pos.x + (segments[i + 1].pos.x - segments[i].pos.x) * frac,
    y: segments[i].pos.y + (segments[i + 1].pos.y - segments[i].pos.y) * frac,
  }
}

export function getSpineNormal(segments: SpineSegment[], index: number): Vec2 {
  const i = Math.max(0, Math.min(index, segments.length - 1))
  const angle = segments[i].angle
  return { x: -Math.sin(angle), y: Math.cos(angle) }
}
