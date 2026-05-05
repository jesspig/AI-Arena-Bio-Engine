import type { SpineSegment, Vec2, SpinePose } from './types'
import { SpinePose as SP } from './types'
import { vec2, sub, add, scale, normalize, length, fromAngle, angleOf, distance, lerp, exponentialDecay } from './math'

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
  iterations: number = 3,
  pose: SpinePose = SP.NORMAL,
  dt: number = 0.016,
  accumulatedTime: number = 0
): void {
  segments[0].pos = headTarget
  segments[0].angle = angleOf(segments[0].pos, segments[1].pos)

  const spacingFactor = pose === SP.RESTING ? 0.7 : pose === SP.CURLING ? 0.6 : 1.0
  const effectiveLength = segmentLength * spacingFactor

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const curr = segments[i]
    const dir = normalize(sub(curr.pos, prev.pos))
    curr.pos = add(prev.pos, scale(dir, effectiveLength))
    curr.angle = angleOf(prev.pos, curr.pos)
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1]
      const curr = segments[i]
      const diff = sub(curr.pos, prev.pos)
      const dist = length(diff)
      if (dist < 0.001) {
        curr.pos = add(prev.pos, fromAngle(curr.angle, effectiveLength))
      } else {
        const correction = scale(normalize(diff), effectiveLength)
        curr.pos = add(prev.pos, correction)
      }
    }

    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].angle = angleOf(segments[i].pos, segments[i + 1].pos)
    }
    if (segments.length > 1) {
      segments[segments.length - 1].angle = segments[segments.length - 2].angle
    }
  }

  applySpineWave(segments, dt, pose, accumulatedTime)
  applySpineBreathing(segments, dt, accumulatedTime)
}

function applySpineWave(segments: SpineSegment[], dt: number, pose: SpinePose, time: number): void {
  if (pose === SP.RESTING || pose === SP.CURLING) return

  const waveAmplitude = pose === SP.ALERT ? 0.3 : pose === SP.LOW ? 1.0 : 1.8
  const waveSpeed = pose === SP.ALERT ? 3 : 4

  for (let i = 2; i < segments.length; i++) {
    const t = i / (segments.length - 1)
    const wave = Math.sin(time * waveSpeed - i * 0.4) * waveAmplitude * t * dt
    const angleShift = wave * 0.02
    segments[i].angle += angleShift
  }
}

function applySpineBreathing(segments: SpineSegment[], dt: number, time: number): void {
  const breathAmt = Math.sin(time * 1.5) * 0.15

  for (let i = 0; i < segments.length; i++) {
    const t = i / (segments.length - 1)
    const widthChange = breathAmt * t * dt * 2
    segments[i].width *= (1 + widthChange)
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

export function getSpineCurvature(segments: SpineSegment[], index: number): number {
  const i = Math.max(1, Math.min(index, segments.length - 2))
  const a1 = segments[i - 1].angle
  const a2 = segments[i].angle
  const a3 = segments[i + 1].angle
  const d1 = a2 - a1
  const d2 = a3 - a2
  return Math.abs(d2 - d1)
}
