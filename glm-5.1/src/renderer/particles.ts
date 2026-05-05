import type { Vec2 } from '../engine/vec2'
import { add } from '../engine/vec2'
import type { ParticleData, FoodCategory } from '../engine/types'

const MAX_PARTICLES = 350
const SPAWN_RATE = 2

export class ParticleSystem {
  particles: ParticleData[] = []

  spawn(pos: Vec2, hue: number, count: number, type: ParticleData['type'] = 'trail'): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break
      const angle = Math.random() * Math.PI * 2
      const speed = type === 'eat' || type === 'happy' ? 1 + Math.random() * 2
        : type === 'dislike' ? 0.5 + Math.random() * 1
        : type === 'bubble' ? 0.1 + Math.random() * 0.3
        : 0.2 + Math.random() * 0.8
      const life = type === 'bubble' ? 100 + Math.random() * 80
        : type === 'happy' ? 40 + Math.random() * 30
        : type === 'dislike' ? 30 + Math.random() * 20
        : type === 'sleep' ? 60 + Math.random() * 40
        : 40 + Math.random() * 60
      const size = type === 'eat' ? 2 + Math.random() * 3
        : type === 'happy' ? 2 + Math.random() * 2
        : type === 'bubble' ? 2 + Math.random() * 3
        : type === 'sleep' ? 3 + Math.random() * 2
        : 1.5 + Math.random() * 2.5
      this.particles.push({
        pos: { x: pos.x + (Math.random() - 0.5) * 6, y: pos.y + (Math.random() - 0.5) * 6 },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - (type === 'bubble' || type === 'sleep' ? 0.3 : 0) },
        life,
        maxLife: life,
        size,
        hue: hue + (Math.random() - 0.5) * 20,
        type,
      })
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.pos = add(p.pos, p.vel)
      const drag = p.type === 'bubble' ? 0.99 : p.type === 'sleep' ? 0.995 : 0.98
      p.vel = { x: p.vel.x * drag, y: p.vel.y * drag + (p.type === 'bubble' || p.type === 'sleep' ? -0.01 : 0) }
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }
}

export function spawnAmbientParticles(system: ParticleSystem, canvasWidth: number, canvasHeight: number, time: number): void {
  for (let i = 0; i < SPAWN_RATE; i++) {
    if (system.particles.length >= MAX_PARTICLES) break
    const angle = Math.random() * Math.PI * 2
    const speed = 0.05 + Math.random() * 0.15
    const life = 80 + Math.random() * 120
    system.particles.push({
      pos: { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life,
      maxLife: life,
      size: 1 + Math.random() * 2,
      hue: 180 + Math.sin(time * 0.01) * 30,
      type: 'ambient',
    })
  }
}

export function spawnBubbles(system: ParticleSystem, pos: Vec2, count: number): void {
  system.spawn(pos, 190, count, 'bubble')
}

export function spawnEatParticles(system: ParticleSystem, pos: Vec2, category: FoodCategory): void {
  const hue = category === 'favorite' ? 45 : category === 'normal' ? 120 : 280
  const type = category === 'favorite' ? 'happy' : category === 'dislike' ? 'dislike' : 'eat'
  system.spawn(pos, hue, category === 'favorite' ? 10 : category === 'dislike' ? 5 : 8, type)
}

export function spawnStartleParticles(system: ParticleSystem, pos: Vec2): void {
  system.spawn(pos, 20, 3, 'startle')
}

export function spawnGlowParticles(system: ParticleSystem, pos: Vec2, hue: number): void {
  system.spawn(pos, hue, 1, 'glow')
}

export function spawnSleepParticles(system: ParticleSystem, pos: Vec2): void {
  system.spawn(pos, 220, 1, 'sleep')
}

export function spawnHappyParticles(system: ParticleSystem, pos: Vec2): void {
  system.spawn(pos, 45, 3, 'happy')
}
