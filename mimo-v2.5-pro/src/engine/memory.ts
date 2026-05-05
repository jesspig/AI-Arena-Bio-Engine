import type { Memory, InterestPoint, Vec2, WorldBounds } from './types'
import { distance, clamp, randomRange } from './math'

const MAX_INTEREST_POINTS = 8
const MEMORY_DECAY_RATE = 0.003
const VISIT_REFRESH = 0.5

export function createMemory(startPos: Vec2): Memory {
  return {
    interestPoints: [
      { pos: { ...startPos }, type: 'rest', strength: 0.8, lastVisit: 0 },
    ],
    homePos: { ...startPos },
    lastAteTime: 0,
    lastSleptTime: 0,
    totalInteractions: 0,
  }
}

export function addInterestPoint(
  memory: Memory,
  pos: Vec2,
  type: InterestPoint['type'],
  strength: number = 0.5
): Memory {
  const newMemory = { ...memory }

  const existing = newMemory.interestPoints.find(
    p => distance(p.pos, pos) < 50 && p.type === type
  )

  if (existing) {
    newMemory.interestPoints = newMemory.interestPoints.map(p =>
      p === existing
        ? { ...p, strength: clamp(p.strength + VISIT_REFRESH, 0, 1), lastVisit: 0 }
        : p
    )
  } else {
    const newPoint: InterestPoint = { pos: { ...pos }, type, strength, lastVisit: 0 }
    newMemory.interestPoints = [...newMemory.interestPoints, newPoint]

    if (newMemory.interestPoints.length > MAX_INTEREST_POINTS) {
      const weakest = newMemory.interestPoints
        .filter(p => p.type !== 'rest')
        .reduce((min, p) => p.strength < min.strength ? p : min, newMemory.interestPoints[0])
      newMemory.interestPoints = newMemory.interestPoints.filter(p => p !== weakest)
    }
  }

  return newMemory
}

export function updateMemory(memory: Memory, dt: number): Memory {
  const newMemory = { ...memory }
  newMemory.interestPoints = newMemory.interestPoints
    .map(p => ({
      ...p,
      strength: p.strength - MEMORY_DECAY_RATE * dt,
      lastVisit: p.lastVisit + dt,
    }))
    .filter(p => p.strength > 0.05)
  return newMemory
}

export function findMostInterestingPoint(
  memory: Memory,
  currentPos: Vec2,
  preferType?: InterestPoint['type']
): InterestPoint | null {
  if (memory.interestPoints.length === 0) return null

  const scored = memory.interestPoints.map(p => {
    const dist = distance(currentPos, p.pos)
    const distScore = Math.max(0, 1 - dist / 500)
    const typeBonus = preferType && p.type === preferType ? 0.3 : 0
    return {
      point: p,
      score: p.strength * 0.6 + distScore * 0.3 + typeBonus + (p.lastVisit > 30 ? 0.2 : 0),
    }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].point
}

export function findNearestPointOfType(
  memory: Memory,
  pos: Vec2,
  type: InterestPoint['type'],
  maxDist: number = 400
): InterestPoint | null {
  let best: InterestPoint | null = null
  let bestDist = maxDist

  for (const p of memory.interestPoints) {
    if (p.type !== type) continue
    const d = distance(pos, p.pos)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }

  return best
}
