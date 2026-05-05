import {
  Particle,
  ParticleType,
  Vec2,
  CreatureState,
  WorldState,
  BodySegment,
} from './types';
import {
  createVec2,
  add,
  scale,
  normalize,
  length,
  randomRange,
  perlinOffset,
  clamp,
} from './math';

const MAX_PARTICLES = 300;
const TRAIL_SPAWN_RATE = 0.6;
const SPORE_SPAWN_RATE = 0.02;
const DUST_SPAWN_CHANCE = 0.4;

export function updateParticles(particles: Particle[]): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.life -= 1 / p.maxLife;
    p.size *= 0.995;

    if (p.life <= 0 || p.size < 0.3) {
      particles.splice(i, 1);
    }
  }
}

export function spawnCreatureParticles(
  creature: CreatureState,
  world: WorldState,
): void {
  if (world.particles.length >= MAX_PARTICLES) {
    world.particles.splice(0, Math.floor(world.particles.length * 0.1));
  }

  spawnTrailParticles(creature, world);
  spawnBreathParticles(creature, world);
  spawnDustParticles(creature, world);
  spawnSporeParticles(creature, world);
}

function spawnTrailParticles(creature: CreatureState, world: WorldState): void {
  if (creature.segments.length === 0) return;
  if (Math.random() > TRAIL_SPAWN_RATE) return;

  const tail = creature.segments[creature.segments.length - 1];
  const count = creature.currentSpeed > 20 ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const color = getMoodParticleColor(creature.needs.mood, 'TRAIL');
    world.particles.push({
      position: {
        x: tail.position.x + randomRange(-4, 4),
        y: tail.position.y + randomRange(-3, 3),
      },
      velocity: {
        x: randomRange(-0.4, 0.4),
        y: randomRange(-0.8, -0.1),
      },
      life: 1,
      maxLife: randomRange(15, 35),
      size: randomRange(1, 3),
      color,
      type: 'TRAIL',
    });
  }
}

function spawnBreathParticles(creature: CreatureState, world: WorldState): void {
  const breathPhase = creature.breathPhase;
  if (Math.sin(breathPhase) < 0.3) return;

  const head = creature.segments[0];
  const angle = creature.headAngle;
  const mouthOffset: Vec2 = {
    x: head.position.x + Math.cos(angle) * 14,
    y: head.position.y + Math.sin(angle) * 14,
  };

  world.particles.push({
    position: { x: mouthOffset.x, y: mouthOffset.y },
    velocity: {
      x: Math.cos(angle) * randomRange(0.3, 1.2) + randomRange(-0.3, 0.3),
      y: Math.sin(angle) * randomRange(0.3, 1.2) + randomRange(-0.3, 0.3),
    },
    life: 1,
    maxLife: randomRange(10, 25),
    size: randomRange(0.8, 2),
    color: [100, 220, 180, 0.4],
    type: 'BREATH',
  });
}

function spawnDustParticles(creature: CreatureState, world: WorldState): void {
  if (creature.currentSpeed < 15) return;

  for (let i = 0; i < creature.segments.length; i += 4) {
    const seg = creature.segments[i];
    const legR = seg.legRight;
    const legL = seg.legLeft;

    if (!legR.planted && Math.random() < DUST_SPAWN_CHANCE) {
      world.particles.push({
        position: {
          x: legR.joints.foot.x + randomRange(-2, 2),
          y: legR.joints.foot.y + randomRange(-1, 1),
        },
        velocity: {
          x: randomRange(-0.6, 0.6),
          y: randomRange(-1.5, -0.3),
        },
        life: 1,
        maxLife: randomRange(8, 18),
        size: randomRange(0.5, 1.8),
        color: [60, 50, 40, 0.3],
        type: 'DUST',
      });
    }

    if (!legL.planted && Math.random() < DUST_SPAWN_CHANCE) {
      world.particles.push({
        position: {
          x: legL.joints.foot.x + randomRange(-2, 2),
          y: legL.joints.foot.y + randomRange(-1, 1),
        },
        velocity: {
          x: randomRange(-0.6, 0.6),
          y: randomRange(-1.5, -0.3),
        },
        life: 1,
        maxLife: randomRange(8, 18),
        size: randomRange(0.5, 1.8),
        color: [60, 50, 40, 0.3],
        type: 'DUST',
      });
    }
  }
}

function spawnSporeParticles(creature: CreatureState, world: WorldState): void {
  if (Math.random() > SPORE_SPAWN_RATE) return;
  if (creature.segments.length === 0) return;

  const spotInterval = Math.max(
    1,
    Math.floor(creature.segments.length / creature.config.bioluminescentSpots),
  );

  for (let i = spotInterval; i < creature.segments.length; i += spotInterval) {
    const seg = creature.segments[i];
    if (Math.random() > 0.3) continue;

    const alpha = world.isNight ? 0.7 : 0.2;
    world.particles.push({
      position: {
        x: seg.position.x + randomRange(-4, 4),
        y: seg.position.y + randomRange(-3, 3),
      },
      velocity: {
        x: randomRange(-0.2, 0.2),
        y: randomRange(-0.8, 0.0),
      },
      life: 1,
      maxLife: randomRange(20, 50),
      size: randomRange(0.5, 1.5),
      color: [80, 240, 200, alpha],
      type: 'SPORE',
    });
  }
}

export function spawnEmotionParticles(
  creature: CreatureState,
  world: WorldState,
  position: Vec2,
): void {
  const mood = creature.needs.mood;
  const count = mood === 'EXCITED' ? 4 : mood === 'SCARED' ? 3 : 2;

  for (let i = 0; i < count; i++) {
    const color = getMoodParticleColor(mood, 'EMOTION');
    world.particles.push({
      position: { x: position.x, y: position.y },
      velocity: {
        x: randomRange(-1.5, 1.5),
        y: randomRange(-2.0, -0.5),
      },
      life: 1,
      maxLife: randomRange(15, 30),
      size: randomRange(1.5, 3.5),
      color,
      type: 'EMOTION',
    });
  }
}

function getMoodParticleColor(
  mood: string,
  _type: ParticleType,
): [number, number, number, number] {
  switch (mood) {
    case 'EXCITED':
      return [255, 220, 60, 0.8];
    case 'CURIOUS':
      return [100, 230, 180, 0.6];
    case 'NERVOUS':
      return [180, 180, 80, 0.5];
    case 'SCARED':
      return [160, 100, 100, 0.7];
    case 'CONTENT':
    default:
      return [80, 200, 160, 0.5];
  }
}
