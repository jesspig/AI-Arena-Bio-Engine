import type { Particle, Vec2 } from '../engine/types'
import { vec2, add, scale, length, normalize, randomRange } from '../engine/math'

export function createParticle(
  pos: Vec2,
  vel: Vec2,
  life: number,
  size: number,
  color: string
): Particle {
  return {
    pos: { ...pos },
    vel: { ...vel },
    life,
    maxLife: life,
    size,
    color,
    alpha: 1,
  }
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      pos: add(p.pos, scale(p.vel, dt)),
      vel: scale(p.vel, 0.98),
      life: p.life - dt,
      alpha: Math.max(0, p.life / p.maxLife),
      size: p.size * (0.99 + 0.01 * (p.life / p.maxLife)),
    }))
    .filter(p => p.life > 0)
}

export function emitTrailParticles(
  pos: Vec2,
  velocity: Vec2,
  particles: Particle[],
  maxParticles: number = 100
): Particle[] {
  if (particles.length >= maxParticles) return particles

  const speed = length(velocity)
  if (speed < 0.5) return particles

  const dir = normalize(velocity)
  const perp = vec2(-dir.y, dir.x)
  const spread = randomRange(-3, 3)

  const particle = createParticle(
    add(pos, scale(perp, spread)),
    add(scale(dir, -speed * 0.3), vec2(randomRange(-0.5, 0.5), randomRange(-0.5, 0.5))),
    randomRange(0.5, 1.5),
    randomRange(2, 5),
    '#2dd4a0'
  )

  return [...particles, particle]
}

export function emitBreathParticles(
  headPos: Vec2,
  heading: number,
  breathPhase: number,
  particles: Particle[],
  maxParticles: number = 50
): Particle[] {
  if (particles.length >= maxParticles) return particles

  // Only emit on exhale
  if (Math.sin(breathPhase) < 0.5) return particles

  const mouthOffset = vec2(Math.cos(heading) * 12, Math.sin(heading) * 12)
  const mouthPos = add(headPos, mouthOffset)

  const particle = createParticle(
    mouthPos,
    vec2(
      Math.cos(heading) * randomRange(0.5, 1.5) + randomRange(-0.3, 0.3),
      Math.sin(heading) * randomRange(0.5, 1.5) + randomRange(-0.3, 0.3)
    ),
    randomRange(0.3, 0.8),
    randomRange(1, 3),
    '#ffffff'
  )

  return [...particles, particle]
}
