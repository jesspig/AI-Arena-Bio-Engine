import {
  CreatureState,
  CreatureConfig,
  DEFAULT_CONFIG,
  Vec2,
  WorldState,
  FoodItem,
} from './types';
import { createSpine, updateSpine } from './spine';
import { updateLegs } from './leg';
import { updateBehavior } from './behavior';
import { updateNeeds, getMoodColor, getMoodGlowIntensity } from './needs';
import { updateParticles, spawnCreatureParticles, spawnEmotionParticles } from './particles';
import { createVec2, randomRange, distance, clamp, add, sub, length, normalize, scale } from './math';

export function createCreature(
  config: Partial<CreatureConfig> = {},
  startPos: Vec2,
): CreatureState {
  const fullConfig: CreatureConfig = { ...DEFAULT_CONFIG, ...config };
  const angle = Math.random() * Math.PI * 2;
  const segments = createSpine(fullConfig, startPos, angle);
  const margin = 80;

  const creature: CreatureState = {
    segments,
    headPos: { ...startPos },
    headAngle: angle,
    headVelocity: createVec2(0, 0),
    headAcceleration: createVec2(0, 0),
    target: null,
    mainState: 'AWAKE',
    subState: 'WANDERING',
    stateTimer: 0,
    needs: {
      hunger: 10,
      energy: 80,
      curiosity: 40,
      fear: 0,
      comfort: 60,
      mood: 'CONTENT',
    },
    config: fullConfig,
    wanderTarget: {
      x: randomRange(margin, 800 - margin),
      y: randomRange(margin, 600 - margin),
    },
    fleeingFrom: null,
    interactingTarget: null,
    currentSpeed: 0,
    breathPhase: 0,
    moodTimer: 120,
    lastPetTime: 0,
    fedTimer: 0,
    hysteresisTimers: {},
    cooldownTimer: 0,
    eatTimer: 0,
    burrowTimer: 0,
    curlAmount: 0,
    isBurrowed: false,
    archAmount: 0,
    playPhase: 0,
    lastEatPos: null,
    lastEatType: null,
    foodMemory: [],
    targetFoodItem: null,
  };

  return creature;
}

export function updateCreature(world: WorldState, dt: number): void {
  const creature = world.creature;
  if (!creature || creature.segments.length === 0) return;

  const safeDt = Math.min(dt, 0.05);

  updateBehavior(world, creature);

  updateCurling(creature, safeDt);

  if (creature.subState === 'EATING') {
    updateEating(creature, world, safeDt);
    return;
  }

  if (creature.subState === 'PLAY') {
    creature.playPhase += safeDt * 3;
  } else {
    creature.playPhase = 0;
  }

  if (creature.archAmount > 0) {
    creature.archAmount = Math.max(0, creature.archAmount - safeDt * 2);
  }

  if (creature.mainState === 'SLEEPING') {
    creature.currentSpeed = 0;
    creature.breathPhase += safeDt * 0.5;
    updateLegs(creature.segments, safeDt, creature.config, world.time, { x: 0, y: 0 }, creature.curlAmount);
    return;
  }

  const maxSpeed = getEffectiveMaxSpeed(creature);
  const headTarget = creature.target || creature.headPos;

  const spineResult = updateSpine(
    creature.segments,
    headTarget,
    safeDt,
    creature.config,
    world.time,
    creature.headVelocity,
    creature.headAcceleration,
    maxSpeed,
    creature.config.maxForce,
    world.width,
    world.height,
    creature.curlAmount,
  );

  creature.headVelocity = spineResult.headVelocity;
  creature.headAcceleration = spineResult.headAcceleration;
  creature.currentSpeed = spineResult.currentSpeed;

  const head = creature.segments[0];
  creature.headPos = { x: head.position.x, y: head.position.y };

  if (creature.segments.length > 1) {
    const next = creature.segments[1];
    creature.headAngle = Math.atan2(
      next.position.y - head.position.y,
      next.position.x - head.position.x,
    );
  }

  updateLegs(
    creature.segments,
    safeDt,
    creature.config,
    world.time,
    creature.headVelocity,
    creature.curlAmount,
  );

  creature.breathPhase += safeDt * 2.5;

  const subState = creature.subState;

  const isMoving = creature.currentSpeed > 8;
  const isResting = subState === 'RESTING' || (creature as { subState: string }).subState === 'EATING';
  const isExploring = subState === 'EXPLORING';
  const isInteracting = subState === 'INTERACTING' || (creature as { subState: string }).subState === 'PLAY';

  const nearFood = world.foodItems.some((f) => {
    if (f.eaten) return false;
    return distance(creature.headPos, f.position) < 100;
  });

  let petsPerSecond = 0;
  if (world.interactionMode === 'PETTING') {
    petsPerSecond = 2;
    creature.lastPetTime = world.time;
    creature.archAmount = Math.min(1, creature.archAmount + safeDt * 3);
  }

  let threatLevel = 0;
  if (world.interactionMode === 'POKING') {
    threatLevel = 1;
  }

  const { needs, moodTimer } = updateNeeds(
    creature.needs,
    creature.config,
    safeDt,
    isMoving,
    isResting,
    isExploring,
    isInteracting,
    nearFood,
    petsPerSecond,
    threatLevel,
    creature.moodTimer,
  );

  creature.needs = needs;
  creature.moodTimer = moodTimer;

  spawnCreatureParticles(creature, world);

  if (needs.mood !== creature.needs.mood) {
    spawnEmotionParticles(creature, world, creature.headPos);
  }

  updateParticles(world.particles);

  if (world.interactionMode === 'TOY' && !world.toyPos) {
    world.toyPos = { x: world.mousePos.x, y: world.mousePos.y };
  }
  if (world.interactionMode !== 'TOY') {
    world.toyPos = null;
  }
}

function updateCurling(creature: CreatureState, dt: number): void {
  const targetCurl = creature.needs.fear > 40
    ? clamp((creature.needs.fear - 40) / 60, 0, 1)
    : 0;

  if (creature.curlAmount < targetCurl) {
    creature.curlAmount = Math.min(targetCurl, creature.curlAmount + dt * creature.config.curlingSpeed);
  } else if (creature.curlAmount > targetCurl) {
    creature.curlAmount = Math.max(targetCurl, creature.curlAmount - dt * creature.config.curlingSpeed * 0.5);
  }
}

function updateEating(creature: CreatureState, world: WorldState, dt: number): void {
  creature.breathPhase += dt * 4;
  creature.currentSpeed = 0;

  creature.headPos = { x: creature.segments[0].position.x, y: creature.segments[0].position.y };

  updateLegs(creature.segments, dt, creature.config, world.time, { x: 0, y: 0 }, creature.curlAmount);
  updateParticles(world.particles);

  const nearFood = world.foodItems.some((f) => {
    if (f.eaten) return false;
    return distance(creature.headPos, f.position) < 20;
  });

  if (!nearFood && creature.eatTimer > 0) {
    creature.eatTimer = 0;
  }
}

function getEffectiveMaxSpeed(creature: CreatureState): number {
  const baseSpeed = creature.config.moveSpeed;
  const needs = creature.needs;

  let multiplier = 1.0;

  if (creature.subState === 'FLEEING') multiplier = 1.4;
  if (creature.subState === 'HUNTING') multiplier = 1.2;
  if (creature.subState === 'INTERACTING') multiplier = 0.85;
  if (creature.subState === 'FORAGING') multiplier = 0.7;
  if (creature.subState === 'PLAY') multiplier = 1.3;

  if (needs.energy < 20) multiplier *= 0.5;
  if (needs.energy < 10) multiplier *= 0.3;

  if (needs.fear > 50) multiplier *= 1.2;

  multiplier *= (1 - creature.curlAmount * 0.6);

  return baseSpeed * Math.max(multiplier, 0.1);
}
