import type { Vec2 } from '../engine/vec2'
import { add } from '../engine/vec2'
import type { ParticleData } from '../engine/types'

const MAX_PARTICLES = 200
const SPAWN_RATE = 3
const PARTICLE_LIFE_MIN = 40
const PARTICLE_LIFE_MAX = 100
const PARTICLE_SIZE_MIN = 1.5
const PARTICLE_SIZE_MAX = 4

export class ParticleSystem {
  particles: ParticleData[] = []

  spawn(pos: Vec2, hue: number, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break
      const angle = Math.random() * Math.PI * 2
      const speed = 0.2 + Math.random() * 0.8
      const life = PARTICLE_LIFE_MIN + Math.random() * (PARTICLE_LIFE_MAX - PARTICLE_LIFE_MIN)
      this.particles.push({
        pos: { x: pos.x + (Math.random() - 0.5) * 6, y: pos.y + (Math.random() - 0.5) * 6 },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life,
        maxLife: life,
        size: PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN),
        hue: hue + (Math.random() - 0.5) * 20,
      })
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.pos = add(p.pos, p.vel)
      p.vel = { x: p.vel.x * 0.98, y: p.vel.y * 0.98 }
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
    })
  }
}
