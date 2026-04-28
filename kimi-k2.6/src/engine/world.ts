import { WorldState, Creature } from './types';
import { createCreature, updateCreature } from './creature';
import { updateParticles, spawnCreatureParticles } from './particles';
import { createVector } from './math';

export function createWorld(width: number, height: number): WorldState {
  return {
    creatures: [],
    particles: [],
    width,
    height,
    mousePosition: createVector(0, 0),
    mouseActive: false,
    time: 0,
  };
}

export function addCreature(world: WorldState, x: number, y: number): Creature {
  const hue = 200 + Math.random() * 160;
  const config = {
    segmentCount: Math.floor(18 + Math.random() * 12),
    segmentLength: 12 + Math.random() * 4,
    segmentRadius: 8 + Math.random() * 4,
    followFactor: 0.3 + Math.random() * 0.1,
    legCount: Math.floor((Math.floor(Math.random() * 3) + 3) * 2),
    legLength: 24 + Math.random() * 10,
    colorHue: hue,
    glowIntensity: 0.6 + Math.random() * 0.4,
    speed: 2 + Math.random() * 2,
    turnSpeed: 0.06 + Math.random() * 0.04,
  };

  const creature = createCreature(
    `creature-${world.creatures.length}`,
    x,
    y,
    config
  );
  world.creatures.push(creature);
  return creature;
}

export function updateWorld(world: WorldState): void {
  world.time += 1;

  for (const creature of world.creatures) {
    updateCreature(
      creature,
      world.width,
      world.height,
      world.mousePosition,
      world.mouseActive,
      world.time
    );
    spawnCreatureParticles(creature, world.particles);
  }

  updateParticles(world.particles);
}

export function setMousePosition(world: WorldState, x: number, y: number): void {
  world.mousePosition = createVector(x, y);
}

export function setMouseActive(world: WorldState, active: boolean): void {
  world.mouseActive = active;
}

export function resizeWorld(world: WorldState, width: number, height: number): void {
  world.width = width;
  world.height = height;
}
