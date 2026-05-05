import type { Particle, Vec2 } from '../engine/types'
import { ParticleType } from '../engine/types'
import { vec2, add, scale, length, normalize, randomRange } from '../engine/math'

export function createParticle(
  pos: Vec2,
  vel: Vec2,
  life: number,
  size: number,
  color: string,
  type: ParticleType = ParticleType.TRAIL
): Particle {
  return {
    pos: { ...pos },
    vel: { ...vel },
    life,
    maxLife: life,
    size,
    color,
    alpha: 1,
    type,
  }
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      pos: add(p.pos, scale(p.vel, dt)),
      vel: scale(p.vel, p.type === ParticleType.FIREFLY ? 0.995 : 0.98),
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
    '#2dd4a0',
    ParticleType.TRAIL
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
    '#ffffff',
    ParticleType.BREATH
  )

  return [...particles, particle]
}

export function emitEmotionParticles(
  pos: Vec2,
  particles: Particle[],
  maxParticles: number = 60
): Particle[] {
  if (particles.length >= maxParticles) return particles

  const angle = Math.random() * Math.PI * 2
  const speed = randomRange(0.5, 2)
  const colors = ['#ffdd57', '#ff6b9d', '#2dd4a0', '#ffffff']
  const color = colors[Math.floor(Math.random() * colors.length)]

  const particle = createParticle(
    { x: pos.x + randomRange(-8, 8), y: pos.y - 10 },
    vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 1),
    randomRange(0.5, 1.2),
    randomRange(2, 4),
    color,
    ParticleType.EMOTION
  )

  return [...particles, particle]
}

export function emitFootprintParticles(
  footPos: Vec2,
  particles: Particle[],
  maxParticles: number = 80
): Particle[] {
  if (particles.length >= maxParticles) return particles

  const particle = createParticle(
    { ...footPos },
    vec2(0, 0),
    randomRange(1, 2),
    randomRange(3, 5),
    '#ffffff',
    ParticleType.FOOTPRINT
  )
  particle.alpha = 0.3

  return [...particles, particle]
}

export function emitPettingParticles(
  pos: Vec2,
  particles: Particle[],
  maxParticles: number = 40
): Particle[] {
  if (particles.length >= maxParticles) return particles

  const angle = Math.random() * Math.PI * 2
  const particle = createParticle(
    { x: pos.x + randomRange(-15, 15), y: pos.y + randomRange(-15, 15) },
    vec2(Math.cos(angle) * randomRange(1, 3), Math.sin(angle) * randomRange(1, 3) - 2),
    randomRange(0.5, 1.0),
    randomRange(2, 5),
    '#ffdd57',
    ParticleType.PETTING
  )

  return [...particles, particle]
}

export function emitFireflyParticles(
  bounds: { width: number; height: number },
  particles: Particle[],
  maxParticles: number = 20
): Particle[] {
  if (particles.length >= maxParticles) return particles
  if (Math.random() > 0.02) return particles

  const particle = createParticle(
    vec2(randomRange(50, bounds.width - 50), randomRange(50, bounds.height - 50)),
    vec2(randomRange(-0.3, 0.3), randomRange(-0.3, 0.3)),
    randomRange(3, 8),
    randomRange(2, 4),
    '#c8ff64',
    ParticleType.FIREFLY
  )

  return [...particles, particle]
}
