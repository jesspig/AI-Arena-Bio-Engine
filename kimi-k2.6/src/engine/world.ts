import { WorldState, Creature, FoodSource, Obstacle } from './types';
import { createCreature } from './creature';
import { updateParticles, spawnCreatureParticles } from './particles';
import { updateCreature } from './creature';
import { createVector, randomRange, distanceBetween } from './math';

const FOOD_SPAWN_CHANCE = 0.003;
const MAX_FOOD_SOURCES = 6;
const FOOD_HUE_FAVORITE_BASE = 120;
const FOOD_HUE_FAVORITE_RANGE = 40;
const FOOD_HUE_NORMAL_BASE = 60;
const FOOD_HUE_NORMAL_RANGE = 30;
const FOOD_HUE_DISLIKED_BASE = 0;
const FOOD_HUE_DISLIKED_RANGE = 20;
const FOOD_RADIUS_BASE = 12;
const FOOD_RADIUS_RANGE = 6;
const FOOD_AMOUNT_BASE = 40;
const FOOD_AMOUNT_RANGE = 20;
const OBSTACLE_COUNT = 5;
const OBSTACLE_RADIUS_MIN = 20;
const OBSTACLE_RADIUS_RANGE = 30;

function determineFoodType(): 'favorite' | 'normal' | 'disliked' {
  const roll = Math.random();
  if (roll < 0.25) return 'favorite';
  if (roll < 0.7) return 'normal';
  return 'disliked';
}

function createFoodSource(world: WorldState): FoodSource | null {
  if (world.foodSources.length >= MAX_FOOD_SOURCES) return null;
  if (Math.random() > FOOD_SPAWN_CHANCE) return null;

  const margin = 100;
  const type = determineFoodType();
  let hue: number;
  let nutritionValue: number;

  switch (type) {
    case 'favorite':
      hue = FOOD_HUE_FAVORITE_BASE + Math.random() * FOOD_HUE_FAVORITE_RANGE;
      nutritionValue = 1.5;
      break;
    case 'normal':
      hue = FOOD_HUE_NORMAL_BASE + Math.random() * FOOD_HUE_NORMAL_RANGE;
      nutritionValue = 1.0;
      break;
    case 'disliked':
      hue = FOOD_HUE_DISLIKED_BASE + Math.random() * FOOD_HUE_DISLIKED_RANGE;
      nutritionValue = 0.4;
      break;
  }

  return {
    position: createVector(
      randomRange(margin, world.width - margin),
      randomRange(margin, world.height - margin)
    ),
    amount: FOOD_AMOUNT_BASE + Math.random() * FOOD_AMOUNT_RANGE,
    maxAmount: FOOD_AMOUNT_BASE + FOOD_AMOUNT_RANGE,
    radius: FOOD_RADIUS_BASE + Math.random() * FOOD_RADIUS_RANGE,
    hue,
    pulsePhase: Math.random() * Math.PI * 2,
    type,
    nutritionValue,
  };
}

function createObstacles(world: WorldState): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const margin = 150;

  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const types: Obstacle['type'][] = ['rock', 'plant', 'water'];
    obstacles.push({
      position: createVector(
        randomRange(margin, world.width - margin),
        randomRange(margin, world.height - margin)
      ),
      radius: OBSTACLE_RADIUS_MIN + Math.random() * OBSTACLE_RADIUS_RANGE,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  return obstacles;
}

export function createWorld(width: number, height: number): WorldState {
  return {
    creatures: [],
    particles: [],
    foodSources: [],
    footprints: [],
    obstacles: createObstacles({ width, height } as WorldState),
    width,
    height,
    mousePosition: createVector(0, 0),
    mouseActive: false,
    time: 0,
    weather: {
      windDirection: Math.random() * Math.PI * 2,
      windStrength: 0.5 + Math.random() * 0.5,
      lightLevel: 0.7 + Math.random() * 0.3,
    },
    selectedCreatureIds: new Set(),
  };
}

export function addCreature(world: WorldState, x: number, y: number): Creature {
  const config = createCreatureConfig();
  const creature = createCreature(
    `creature-${world.creatures.length}-${Date.now()}`,
    x,
    y,
    config
  );
  world.creatures.push(creature);
  return creature;
}

function createCreatureConfig() {
  const hue = 200 + Math.random() * 160;
  return {
    segmentCount: 20 + Math.floor(Math.random() * 8),
    segmentLength: 12 + Math.random() * 3,
    segmentRadius: 8 + Math.random() * 4,
    followFactor: 0.3,
    legCount: 8,
    legLength: 24 + Math.random() * 8,
    colorHue: hue,
    glowIntensity: 0.6 + Math.random() * 0.3,
    speed: 2 + Math.random() * 1.5,
    turnSpeed: 0.05 + Math.random() * 0.04,
    perceptionRadius: 160 + Math.random() * 80,
    memoryCapacity: 6 + Math.floor(Math.random() * 5),
    metabolismRate: 0.8 + Math.random() * 0.4,
    socialRadius: 100 + Math.random() * 60,
    curiosityRadius: 120 + Math.random() * 80,
    favoriteFoodHue: (hue + 120 + Math.random() * 60) % 360,
    dislikedFoodHue: (hue + 60 + Math.random() * 60) % 360,
  };
}

function updateFoodSources(world: WorldState): void {
  const newFood = createFoodSource(world);
  if (newFood) {
    world.foodSources.push(newFood);
  }

  for (let i = world.foodSources.length - 1; i >= 0; i--) {
    const food = world.foodSources[i];
    food.pulsePhase += 0.025;

    for (const creature of world.creatures) {
      if (creature.state === 'eat') {
        const dist = distanceBetween(creature.segments[0].position, food.position);
        if (dist < food.radius + 20) {
          const eatAmount = 0.5 * food.nutritionValue;
          food.amount -= eatAmount;
          creature.needs.hunger = Math.min(1, creature.needs.hunger + eatAmount * 0.03);

          if (food.type === 'favorite') {
            creature.needs.fun = Math.min(1, creature.needs.fun + 0.01);
          } else if (food.type === 'disliked') {
            creature.needs.comfort -= 0.005;
          }
        }
      }
    }

    if (food.amount <= 0) {
      world.foodSources.splice(i, 1);
    }
  }
}

function updateWorldFootprints(world: WorldState): void {
  for (const creature of world.creatures) {
    for (const footprint of creature.footprints) {
      if (!world.footprints.includes(footprint)) {
        world.footprints.push(footprint);
      }
    }
  }

  for (let i = world.footprints.length - 1; i >= 0; i--) {
    world.footprints[i].life--;
    if (world.footprints[i].life <= 0) {
      world.footprints.splice(i, 1);
    }
  }

  if (world.footprints.length > 150) {
    world.footprints.sort((a, b) => a.life - b.life);
    world.footprints.splice(0, world.footprints.length - 150);
  }
}

function updateWeather(world: WorldState): void {
  world.weather.windDirection += Math.sin(world.time * 0.01) * 0.002;
  world.weather.windStrength = 0.3 + Math.sin(world.time * 0.005) * 0.3 + 0.2;
  world.weather.lightLevel = 0.5 + Math.sin(world.time * 0.003) * 0.3 + 0.2;
}

export function updateWorld(world: WorldState): void {
  world.time += 1;

  updateWeather(world);

  for (const creature of world.creatures) {
    updateCreature(
      creature,
      world.width,
      world.height,
      world.mousePosition,
      world.mouseActive,
      world.time,
      world.creatures,
      world.foodSources
    );
    spawnCreatureParticles(creature, world.particles);
  }

  updateFoodSources(world);
  updateWorldFootprints(world);
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
