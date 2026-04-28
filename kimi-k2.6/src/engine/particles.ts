import { Particle, Vector2, Creature } from './types';
import { createVector, randomRange } from './math';

export function spawnTrailParticle(
  particles: Particle[],
  position: Vector2,
  hue: number,
  intensity: number
): void {
  if (Math.random() > intensity * 0.4) return;

  const angle = randomRange(0, Math.PI * 2);
  const speed = randomRange(0.2, 1.2);

  particles.push({
    position: createVector(
      position.x + randomRange(-3, 3),
      position.y + randomRange(-3, 3)
    ),
    velocity: createVector(Math.cos(angle) * speed, Math.sin(angle) * speed),
    life: 1,
    maxLife: randomRange(20, 50),
    size: randomRange(1, 3.5),
    hue: hue + randomRange(-20, 20),
  });
}

export function spawnGlowParticle(
  particles: Particle[],
  position: Vector2,
  hue: number
): void {
  if (Math.random() > 0.15) return;

  particles.push({
    position: createVector(
      position.x + randomRange(-5, 5),
      position.y + randomRange(-5, 5)
    ),
    velocity: createVector(
      randomRange(-0.3, 0.3),
      randomRange(-0.5, -0.1)
    ),
    life: 1,
    maxLife: randomRange(15, 35),
    size: randomRange(0.5, 2),
    hue: hue + randomRange(-15, 15),
  });
}

export function updateParticles(particles: Particle[]): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.life -= 1 / p.maxLife;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function spawnCreatureParticles(creature: Creature, particles: Particle[]): void {
  const tail = creature.segments[creature.segments.length - 1];
  spawnTrailParticle(particles, tail.position, creature.config.colorHue, creature.config.glowIntensity);

  for (let i = 0; i < creature.segments.length; i += 4) {
    if (Math.random() > 0.3) continue;
    const seg = creature.segments[i];
    const brightness = 1 - i / creature.segments.length;
    spawnGlowParticle(particles, seg.position, creature.config.colorHue + brightness * 40);
  }
}
