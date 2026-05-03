import { WorldState, Creature } from './types';
import { createCreature } from './creature';
import { updateParticles, spawnCreatureParticles } from './particles';
import { updateCreature } from './creature';
import { createVector } from './math';

const DEFAULT_HUE_MIN = 200;
const DEFAULT_HUE_RANGE = 160;
const DEFAULT_SEGMENT_COUNT_MIN = 18;
const DEFAULT_SEGMENT_COUNT_RANGE = 12;
const DEFAULT_SEGMENT_LENGTH_MIN = 12;
const DEFAULT_SEGMENT_LENGTH_RANGE = 4;
const DEFAULT_SEGMENT_RADIUS_MIN = 8;
const DEFAULT_SEGMENT_RADIUS_RANGE = 4;
const DEFAULT_FOLLOW_FACTOR_MIN = 0.3;
const DEFAULT_FOLLOW_FACTOR_RANGE = 0.1;
const DEFAULT_LEG_GROUP_MIN = 3;
const DEFAULT_LEG_GROUP_RANGE = 3;
const DEFAULT_LEG_LENGTH_MIN = 24;
const DEFAULT_LEG_LENGTH_RANGE = 10;
const DEFAULT_GLOW_INTENSITY_MIN = 0.6;
const DEFAULT_GLOW_INTENSITY_RANGE = 0.4;
const DEFAULT_SPEED_MIN = 2;
const DEFAULT_SPEED_RANGE = 2;
const DEFAULT_TURN_SPEED_MIN = 0.06;
const DEFAULT_TURN_SPEED_RANGE = 0.04;

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
  const hue = DEFAULT_HUE_MIN + Math.random() * DEFAULT_HUE_RANGE;
  const config = {
    segmentCount: Math.floor(DEFAULT_SEGMENT_COUNT_MIN + Math.random() * DEFAULT_SEGMENT_COUNT_RANGE),
    segmentLength: DEFAULT_SEGMENT_LENGTH_MIN + Math.random() * DEFAULT_SEGMENT_LENGTH_RANGE,
    segmentRadius: DEFAULT_SEGMENT_RADIUS_MIN + Math.random() * DEFAULT_SEGMENT_RADIUS_RANGE,
    followFactor: DEFAULT_FOLLOW_FACTOR_MIN + Math.random() * DEFAULT_FOLLOW_FACTOR_RANGE,
    legCount: Math.floor((Math.floor(Math.random() * DEFAULT_LEG_GROUP_RANGE) + DEFAULT_LEG_GROUP_MIN) * 2),
    legLength: DEFAULT_LEG_LENGTH_MIN + Math.random() * DEFAULT_LEG_LENGTH_RANGE,
    colorHue: hue,
    glowIntensity: DEFAULT_GLOW_INTENSITY_MIN + Math.random() * DEFAULT_GLOW_INTENSITY_RANGE,
    speed: DEFAULT_SPEED_MIN + Math.random() * DEFAULT_SPEED_RANGE,
    turnSpeed: DEFAULT_TURN_SPEED_MIN + Math.random() * DEFAULT_TURN_SPEED_RANGE,
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
