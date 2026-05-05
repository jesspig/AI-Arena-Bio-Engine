import p5 from 'p5';
import { Particle, WorldState } from '../engine/types';

export function drawParticles(p: p5, world: WorldState): void {
  p.push();

  for (const particle of world.particles) {
    const alpha = particle.life * particle.color[3] * 255;
    const size = particle.size * particle.life;

    p.noStroke();

    switch (particle.type) {
      case 'TRAIL':
        drawTrailParticle(p, particle, alpha, size);
        break;
      case 'BREATH':
        drawBreathParticle(p, particle, alpha, size);
        break;
      case 'DUST':
        drawDustParticle(p, particle, alpha, size);
        break;
      case 'SPORE':
        drawSporeParticle(p, particle, alpha, size, world);
        break;
      case 'EMOTION':
        drawEmotionParticle(p, particle, alpha, size, world);
        break;
    }
  }

  p.pop();
}

function drawTrailParticle(
  p: p5,
  particle: Particle,
  alpha: number,
  size: number,
): void {
  p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
  p.ellipse(particle.position.x, particle.position.y, size, size * 0.7);
}

function drawBreathParticle(
  p: p5,
  particle: Particle,
  alpha: number,
  size: number,
): void {
  p.fill(
    particle.color[0],
    particle.color[1],
    particle.color[2],
    alpha * 0.4,
  );
  p.ellipse(
    particle.position.x,
    particle.position.y,
    size * 2,
    size * 2,
  );
}

function drawDustParticle(
  p: p5,
  particle: Particle,
  alpha: number,
  size: number,
): void {
  p.fill(particle.color[0], particle.color[1], particle.color[2], alpha * 0.5);
  p.ellipse(particle.position.x, particle.position.y, size, size);
}

function drawSporeParticle(
  p: p5,
  particle: Particle,
  alpha: number,
  size: number,
  world: WorldState,
): void {
  const glowPulse = Math.sin(world.time * 0.1 + particle.position.x * 0.05) * 0.3 + 0.7;

  for (let g = 2; g >= 0; g--) {
    p.fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      alpha * 0.08 * (3 - g) * glowPulse,
    );
    p.ellipse(particle.position.x, particle.position.y, size + g * 3, size + g * 3);
  }

  p.fill(
    particle.color[0],
    particle.color[1],
    particle.color[2],
    alpha * 0.6 * glowPulse,
  );
  p.ellipse(particle.position.x, particle.position.y, size, size);
}

function drawEmotionParticle(
  p: p5,
  particle: Particle,
  alpha: number,
  size: number,
  _world: WorldState,
): void {
  p.fill(particle.color[0], particle.color[1], particle.color[2], alpha * 0.6);

  const sides = 4 + Math.floor(size);
  p.beginShape();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = size * (i % 2 === 0 ? 0.8 : 1.2);
    p.vertex(
      particle.position.x + Math.cos(angle) * r,
      particle.position.y + Math.sin(angle) * r,
    );
  }
  p.endShape(p.CLOSE);
}
