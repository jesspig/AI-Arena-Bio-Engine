import {
  Creature,
  CreatureConfig,
  CreatureState,
  EmotionalState,
  Segment,
  Leg,
  Vector2,
  Memory,
  Antenna,
  BehaviorIntent,
} from './types';
import {
  createVector,
  addVectors,
  subtractVectors,
  multiplyVector,
  normalizeVector,
  vectorMagnitude,
  distanceBetween,
  lerpVectors,
  angleBetweenVectors,
  clampValue,
  randomRange,
  rotateVector,
  copyVector,
} from './math';

const STATE_DURATIONS: Record<CreatureState, { min: number; max: number }> = {
  idle: { min: 90, max: 180 },
  roam: { min: 200, max: 400 },
  chase: { min: 120, max: 240 },
  flee: { min: 100, max: 200 },
  rest: { min: 300, max: 600 },
  eat: { min: 120, max: 250 },
  social: { min: 150, max: 300 },
  curious: { min: 100, max: 200 },
  play: { min: 150, max: 350 },
  sleep: { min: 500, max: 800 },
  hunt: { min: 150, max: 300 },
};

const FLEE_DISTANCE = 140;
const CHASE_DISTANCE = 250;
const FLEE_TARGET_DISTANCE = 300;
const IDLE_WANDER_FACTOR = 0.015;
const IDLE_NOISE_INCREMENT = 0.04;
const VELOCITY_LERP_FACTOR = 0.08;
const HEAD_MARGIN = 60;
const PULSE_PHASE_INCREMENT = 0.025;
const BREATH_PHASE_INCREMENT = 0.04;
const SPEED_MULTIPLIER_FLEE = 2.2;
const SPEED_MULTIPLIER_CHASE = 1.4;
const SPEED_MULTIPLIER_IDLE = 0.2;
const SPEED_MULTIPLIER_REST = 0.03;
const SPEED_MULTIPLIER_EAT = 0.25;
const SPEED_MULTIPLIER_SOCIAL = 0.7;
const SPEED_MULTIPLIER_CURIOUS = 1.1;
const SPEED_MULTIPLIER_PLAY = 1.8;
const SPEED_MULTIPLIER_SLEEP = 0.01;
const SPEED_MULTIPLIER_HUNT = 1.5;
const TARGET_REACHED_THRESHOLD = 25;
const TARGET_PERSIST_CHANCE = 0.005;
const LEG_STEP_THRESHOLD_MULTIPLIER = 0.55;
const LEG_STEP_SPEED = 0.12;
const LEG_ARC_HEIGHT_MULTIPLIER = 0.35;
const LEG_FORWARD_OFFSET_MULTIPLIER = 0.25;
const LEG_IDEAL_OFFSET_MULTIPLIER = 1.1;
const LEG_REACH_SAFETY_FACTOR = 0.98;
const LEG_KNEE_HALF_FACTOR = 0.5;
const SPINE_FOLLOW_FACTOR = 0.3;
const MEMORY_DECAY_RATE = 0.0015;
const MEMORY_DANGER_INTENSITY = 1.0;
const PERCEPTION_CHECK_INTERVAL = 4;
const NEEDS_DECAY_ENERGY = 0.00025;
const NEEDS_DECAY_HUNGER = 0.0004;
const NEEDS_DECAY_CURIOSITY = 0.00015;
const NEEDS_DECAY_SOCIAL = 0.00012;
const NEEDS_DECAY_COMFORT = 0.00008;
const NEEDS_DECAY_FUN = 0.0002;
const NEEDS_REPLENISH_REST_ENERGY = 0.0025;
const NEEDS_REPLENISH_REST_COMFORT = 0.0015;
const NEEDS_REPLENISH_EAT_HUNGER = 0.006;
const NEEDS_REPLENISH_SOCIAL = 0.003;
const NEEDS_REPLENISH_CURIOSITY = 0.004;
const NEEDS_REPLENISH_PLAY_FUN = 0.008;
const NEEDS_REPLENISH_SLEEP_ENERGY = 0.004;
const ANTENNA_SWAY_SPEED = 0.06;
const ANTENNA_LENGTH_BASE = 16;
const FOOD_DETECTION_RADIUS = 140;
const SOCIAL_DETECTION_RADIUS = 140;
const FOOTPRINT_SPAWN_DISTANCE = 22;
const FOOTPRINT_LIFETIME = 100;
const GROWTH_RATE = 0.00008;
const BOUNDARY_MARGIN = 120;
const BOUNDARY_REPULSION_STRENGTH = 3.5;
const STATE_COOLDOWN_DURATION = 60;
const MIN_STATE_DURATION = 45;
const SATIATION_DURATION = 300;
const HUNGER_THRESHOLD_EAT = 0.35;
const ENERGY_THRESHOLD_REST = 0.2;
const ENERGY_THRESHOLD_SLEEP = 0.08;
const FUN_THRESHOLD_PLAY = 0.3;
const SLEEP_RECOVERY_THRESHOLD = 0.85;

export function createDefaultConfig(): CreatureConfig {
  const hue = 200 + Math.random() * 160;
  return {
    segmentCount: 20 + Math.floor(Math.random() * 8),
    segmentLength: 12 + Math.random() * 3,
    segmentRadius: 8 + Math.random() * 4,
    followFactor: SPINE_FOLLOW_FACTOR,
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

function createDefaultNeeds() {
  return {
    energy: 0.6 + Math.random() * 0.4,
    hunger: 0.5 + Math.random() * 0.5,
    curiosity: 0.5 + Math.random() * 0.5,
    social: 0.3 + Math.random() * 0.7,
    comfort: 0.6 + Math.random() * 0.4,
    fun: 0.4 + Math.random() * 0.6,
  };
}

function createDefaultPersonality() {
  return {
    boldness: 0.3 + Math.random() * 0.7,
    curiosity: 0.2 + Math.random() * 0.8,
    sociability: 0.2 + Math.random() * 0.8,
    laziness: 0.1 + Math.random() * 0.6,
    playfulness: 0.2 + Math.random() * 0.8,
    pickiness: 0.1 + Math.random() * 0.5,
  };
}

function createAntennas(): Antenna[] {
  return [
    { angle: -0.35, length: ANTENNA_LENGTH_BASE, tipPosition: createVector(0, 0), swayPhase: Math.random() * Math.PI * 2 },
    { angle: 0.35, length: ANTENNA_LENGTH_BASE * 0.85, tipPosition: createVector(0, 0), swayPhase: Math.random() * Math.PI * 2 },
  ];
}

function createDefaultIntent(): BehaviorIntent {
  return {
    targetPosition: null,
    desiredSpeed: 0,
    desiredHeading: 0,
    urgency: 0,
  };
}

export function createCreature(
  id: string,
  x: number,
  y: number,
  config: CreatureConfig = createDefaultConfig()
): Creature {
  const segments: Segment[] = [];
  for (let i = 0; i < config.segmentCount; i++) {
    segments.push({
      position: createVector(x - i * config.segmentLength, y),
      previousPosition: createVector(x - i * config.segmentLength, y),
      angle: 0,
    });
  }

  const legs: Leg[] = [];
  const legsPerSide = Math.floor(config.legCount / 2);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < legsPerSide; i++) {
      const rootIndex = Math.floor(3 + (i / legsPerSide) * (config.segmentCount - 6));
      legs.push({
        rootIndex,
        side,
        segments: [createVector(0, 0), createVector(0, 0)],
        footPosition: createVector(x, y),
        targetPosition: createVector(x, y),
        isGrounded: true,
        stepProgress: 0,
      });
    }
  }

  return {
    id,
    segments,
    legs,
    state: 'roam',
    emotionalState: 'calm',
    targetPosition: null,
    velocity: createVector(0, 0),
    heading: 0,
    stateTimer: 0,
    noiseOffset: Math.random() * 1000,
    config,
    pulsePhase: Math.random() * Math.PI * 2,
    breathPhase: Math.random() * Math.PI * 2,
    needs: createDefaultNeeds(),
    memories: [],
    perception: {
      mouseVisible: false,
      mouseDistance: Infinity,
      mouseAngle: 0,
      nearbyCreatures: [],
      nearbyFood: [],
      threats: [],
    },
    antennas: createAntennas(),
    lastStateChange: 0,
    stateHistory: ['roam'],
    personality: createDefaultPersonality(),
    footprints: [],
    age: 0,
    growthStage: 0.5 + Math.random() * 0.5,
    intent: createDefaultIntent(),
    stateCooldown: 0,
    lastEatTime: 0,
    lastRestTime: 0,
    lastPlayTime: 0,
    isSatiated: false,
    satiationTimer: 0,
  };
}

function computeStateDuration(state: CreatureState): number {
  const range = STATE_DURATIONS[state];
  return randomRange(range.min, range.max);
}

function canChangeState(creature: Creature): boolean {
  if (creature.stateCooldown > 0) return false;
  if (creature.stateTimer < MIN_STATE_DURATION && creature.state !== 'flee') return false;
  return true;
}

function setState(creature: Creature, newState: CreatureState): void {
  if (creature.state === newState) return;

  creature.state = newState;
  creature.stateHistory.push(newState);
  if (creature.stateHistory.length > 5) {
    creature.stateHistory.shift();
  }
  creature.lastStateChange = creature.age;
  creature.stateTimer = computeStateDuration(newState);
  creature.stateCooldown = STATE_COOLDOWN_DURATION;
  creature.targetPosition = null;

  if (newState === 'eat') creature.lastEatTime = creature.age;
  if (newState === 'rest' || newState === 'sleep') creature.lastRestTime = creature.age;
  if (newState === 'play') creature.lastPlayTime = creature.age;
}

function evaluateStatePriority(creature: Creature): { state: CreatureState; priority: number }[] {
  const needs = creature.needs;
  const personality = creature.personality;
  const priorities: { state: CreatureState; priority: number }[] = [];

  if (needs.energy < ENERGY_THRESHOLD_SLEEP && personality.laziness > 0.2) {
    priorities.push({ state: 'sleep', priority: 10 + (1 - needs.energy) * 5 });
  } else if (needs.energy < ENERGY_THRESHOLD_REST && personality.laziness > 0.3) {
    priorities.push({ state: 'rest', priority: 7 + (1 - needs.energy) * 3 });
  }

  if (!creature.isSatiated && needs.hunger < HUNGER_THRESHOLD_EAT) {
    const hasFood = creature.perception.nearbyFood.length > 0;
    priorities.push({ state: 'eat', priority: hasFood ? 8 : 5 + (1 - needs.hunger) * 2 });
  }

  if (needs.fun < FUN_THRESHOLD_PLAY && personality.playfulness > 0.5) {
    priorities.push({ state: 'play', priority: 4 + (1 - needs.fun) * 2 });
  }

  if (needs.curiosity > 0.6 && personality.curiosity > 0.4) {
    priorities.push({ state: 'curious', priority: 3 + needs.curiosity * 2 });
  }

  if (needs.social > 0.5 && personality.sociability > 0.4 && creature.perception.nearbyCreatures.length > 0) {
    priorities.push({ state: 'social', priority: 3 + needs.social * 1.5 });
  }

  if (needs.comfort < 0.25) {
    priorities.push({ state: 'idle', priority: 2 + (1 - needs.comfort) });
  }

  priorities.push({ state: 'roam', priority: 1 });
  priorities.push({ state: 'idle', priority: 0.5 });

  return priorities.sort((a, b) => b.priority - a.priority);
}

function selectNextState(creature: Creature): CreatureState {
  const priorities = evaluateStatePriority(creature);

  if (priorities.length === 0) return 'roam';

  const topPriority = priorities[0];
  if (topPriority.priority >= 6) {
    return topPriority.state;
  }

  const weightedStates = priorities.flatMap((p) =>
    Array(Math.max(1, Math.floor(p.priority * 2))).fill(p.state)
  );

  return weightedStates[Math.floor(Math.random() * weightedStates.length)];
}

function updatePerception(
  creature: Creature,
  mousePos: Vector2,
  mouseActive: boolean,
  allCreatures: Creature[],
  foodSources: { position: Vector2; amount: number; type: string; hue: number }[]
): void {
  const headPos = creature.segments[0].position;

  creature.perception.mouseVisible = mouseActive;
  creature.perception.mouseDistance = mouseActive ? distanceBetween(headPos, mousePos) : Infinity;
  creature.perception.mouseAngle = mouseActive ? angleBetweenVectors(headPos, mousePos) : 0;

  creature.perception.nearbyCreatures = [];
  for (const other of allCreatures) {
    if (other.id === creature.id) continue;
    const dist = distanceBetween(headPos, other.segments[0].position);
    if (dist < SOCIAL_DETECTION_RADIUS) {
      creature.perception.nearbyCreatures.push({
        creature: other,
        distance: dist,
        angle: angleBetweenVectors(headPos, other.segments[0].position),
      });
    }
  }

  creature.perception.nearbyFood = [];
  for (const food of foodSources) {
    if (food.amount <= 0) continue;
    const dist = distanceBetween(headPos, food.position);
    if (dist < FOOD_DETECTION_RADIUS) {
      const hueDiff = Math.abs(food.hue - creature.config.favoriteFoodHue);
      const preference = hueDiff < 30 ? 1.5 : hueDiff > 120 ? 0.3 : 1.0;
      creature.perception.nearbyFood.push({
        position: food.position,
        distance: dist,
        type: food.type as 'favorite' | 'normal' | 'disliked',
        preference,
      });
    }
  }

  creature.perception.threats = [];
  if (mouseActive && creature.perception.mouseDistance < creature.config.perceptionRadius) {
    const intensity = 1 - creature.perception.mouseDistance / creature.config.perceptionRadius;
    creature.perception.threats.push({
      position: mousePos,
      distance: creature.perception.mouseDistance,
      intensity: intensity * (1.5 - creature.personality.boldness),
    });
  }
}

function addMemory(creature: Creature, type: Memory['type'], position: Vector2, intensity: number): void {
  const existingIndex = creature.memories.findIndex(
    (m) => m.type === type && distanceBetween(m.position, position) < 60
  );

  if (existingIndex >= 0) {
    creature.memories[existingIndex].timestamp = creature.age;
    creature.memories[existingIndex].intensity = Math.min(1, creature.memories[existingIndex].intensity + intensity * 0.2);
  } else {
    creature.memories.push({
      position: copyVector(position),
      type,
      timestamp: creature.age,
      intensity,
    });

    if (creature.memories.length > creature.config.memoryCapacity) {
      creature.memories.sort((a, b) => a.intensity - b.intensity);
      creature.memories.shift();
    }
  }
}

function decayMemories(creature: Creature): void {
  for (let i = creature.memories.length - 1; i >= 0; i--) {
    const memory = creature.memories[i];
    const age = creature.age - memory.timestamp;
    memory.intensity -= MEMORY_DECAY_RATE * (1 + age * 0.001);
    if (memory.intensity <= 0) {
      creature.memories.splice(i, 1);
    }
  }
}

function updateNeeds(creature: Creature): void {
  const isResting = creature.state === 'rest';
  const isSleeping = creature.state === 'sleep';
  const isEating = creature.state === 'eat';
  const isSocial = creature.state === 'social';
  const isCurious = creature.state === 'curious';
  const isPlaying = creature.state === 'play';
  const isMoving = creature.state === 'roam' || creature.state === 'chase' || creature.state === 'flee' || creature.state === 'play';

  creature.needs.energy -= isMoving ? NEEDS_DECAY_ENERGY * 2.5 : isSleeping ? NEEDS_DECAY_ENERGY * 0.1 : NEEDS_DECAY_ENERGY;
  creature.needs.hunger -= isEating ? 0 : NEEDS_DECAY_HUNGER;
  creature.needs.curiosity -= isCurious ? 0 : NEEDS_DECAY_CURIOSITY;
  creature.needs.social -= isSocial ? 0 : NEEDS_DECAY_SOCIAL;
  creature.needs.comfort -= NEEDS_DECAY_COMFORT;
  creature.needs.fun -= isPlaying ? 0 : NEEDS_DECAY_FUN;

  if (isSleeping) {
    creature.needs.energy += NEEDS_REPLENISH_SLEEP_ENERGY;
    creature.needs.comfort += NEEDS_REPLENISH_REST_COMFORT * 1.5;
  } else if (isResting) {
    creature.needs.energy += NEEDS_REPLENISH_REST_ENERGY;
    creature.needs.comfort += NEEDS_REPLENISH_REST_COMFORT;
  }

  if (isEating) {
    creature.needs.hunger += NEEDS_REPLENISH_EAT_HUNGER;
  }

  if (isSocial) {
    creature.needs.social += NEEDS_REPLENISH_SOCIAL;
    creature.needs.fun += NEEDS_REPLENISH_SOCIAL * 0.5;
  }

  if (isCurious) {
    creature.needs.curiosity += NEEDS_REPLENISH_CURIOSITY;
    creature.needs.fun += NEEDS_REPLENISH_CURIOSITY * 0.3;
  }

  if (isPlaying) {
    creature.needs.fun += NEEDS_REPLENISH_PLAY_FUN;
    creature.needs.social += NEEDS_REPLENISH_PLAY_FUN * 0.3;
  }

  creature.needs.energy = clampValue(creature.needs.energy, 0, 1);
  creature.needs.hunger = clampValue(creature.needs.hunger, 0, 1);
  creature.needs.curiosity = clampValue(creature.needs.curiosity, 0, 1);
  creature.needs.social = clampValue(creature.needs.social, 0, 1);
  creature.needs.comfort = clampValue(creature.needs.comfort, 0, 1);
  creature.needs.fun = clampValue(creature.needs.fun, 0, 1);

  if (creature.isSatiated) {
    creature.satiationTimer--;
    if (creature.satiationTimer <= 0) {
      creature.isSatiated = false;
    }
  }

  if (creature.needs.hunger > 0.8 && !creature.isSatiated) {
    creature.isSatiated = true;
    creature.satiationTimer = SATIATION_DURATION;
  }
}

function determineEmotionalState(creature: Creature): EmotionalState {
  const needs = creature.needs;
  const threats = creature.perception.threats;
  const state = creature.state;

  if (threats.length > 0 && threats[0].intensity > 0.5) {
    return 'scared';
  }
  if (threats.length > 0 && threats[0].intensity > 0.25) {
    return 'anxious';
  }

  if (needs.energy < ENERGY_THRESHOLD_SLEEP) {
    return 'sleepy';
  }
  if (needs.energy < ENERGY_THRESHOLD_REST && state !== 'rest' && state !== 'sleep') {
    return 'tired';
  }

  if (needs.hunger < 0.25 && !creature.isSatiated) {
    return 'hungry';
  }

  if (needs.fun < 0.3 && personalityWantsToPlay(creature)) {
    return 'playful';
  }

  if (state === 'sleep' || state === 'rest') {
    return needs.energy > 0.7 ? 'content' : 'calm';
  }

  if (state === 'eat' && needs.hunger > 0.7) {
    return 'content';
  }

  if (state === 'play' || (needs.fun > 0.7 && needs.energy > 0.5)) {
    return 'playful';
  }

  if (state === 'social' && needs.social > 0.6) {
    return 'happy';
  }

  if (needs.hunger > 0.8 && needs.energy > 0.5 && needs.social > 0.5 && needs.fun > 0.5) {
    return 'happy';
  }

  if (state === 'curious' || needs.curiosity > 0.75) {
    return 'excited';
  }

  return 'calm';
}

function personalityWantsToPlay(creature: Creature): boolean {
  return creature.personality.playfulness > 0.4 && creature.needs.energy > 0.3;
}

function updateEmotionalState(creature: Creature): void {
  const targetEmotion = determineEmotionalState(creature);
  if (targetEmotion !== creature.emotionalState) {
    creature.emotionalState = targetEmotion;
  }
}

function updateStateTimer(creature: Creature, mousePos: Vector2, mouseActive: boolean): void {
  creature.stateTimer--;
  creature.stateCooldown = Math.max(0, creature.stateCooldown - 1);

  const distToMouse = creature.perception.mouseDistance;

  if (mouseActive) {
    if (distToMouse < FLEE_DISTANCE && creature.personality.boldness < 0.6) {
      if (creature.state !== 'flee') {
        setState(creature, 'flee');
        addMemory(creature, 'danger', mousePos, MEMORY_DANGER_INTENSITY);
      }
      return;
    }

    if (distToMouse < CHASE_DISTANCE && creature.personality.curiosity > 0.3 && creature.personality.boldness > 0.2 && creature.state !== 'flee') {
      if (creature.state !== 'chase') {
        setState(creature, 'chase');
      }
      return;
    }
  }

  if (creature.stateTimer <= 0 && canChangeState(creature)) {
    const nextState = selectNextState(creature);
    setState(creature, nextState);
  }

  if (creature.state === 'sleep' && creature.needs.energy >= SLEEP_RECOVERY_THRESHOLD) {
    setState(creature, 'idle');
  }

  if (!creature.isSatiated && creature.needs.hunger < 0.2 && creature.perception.nearbyFood.length > 0 && creature.state !== 'eat' && canChangeState(creature)) {
    const bestFood = creature.perception.nearbyFood.reduce((best, current) =>
      current.preference > best.preference ? current : best
    );
    if (bestFood.preference >= 0.5) {
      setState(creature, 'eat');
      creature.targetPosition = copyVector(bestFood.position);
    }
  }

  if (creature.state === 'eat' && creature.needs.hunger >= 0.9) {
    creature.isSatiated = true;
    creature.satiationTimer = SATIATION_DURATION;
    if (canChangeState(creature)) {
      setState(creature, 'idle');
    }
  }
}

function computeSpeedForState(creature: Creature): number {
  const baseSpeed = creature.config.speed * creature.growthStage;
  const energyFactor = 0.4 + creature.needs.energy * 0.6;

  switch (creature.state) {
    case 'flee':
      return baseSpeed * SPEED_MULTIPLIER_FLEE * energyFactor;
    case 'chase':
      return baseSpeed * SPEED_MULTIPLIER_CHASE * energyFactor;
    case 'roam':
      return baseSpeed * energyFactor;
    case 'idle':
      return baseSpeed * SPEED_MULTIPLIER_IDLE;
    case 'rest':
      return baseSpeed * SPEED_MULTIPLIER_REST;
    case 'eat':
      return baseSpeed * SPEED_MULTIPLIER_EAT;
    case 'social':
      return baseSpeed * SPEED_MULTIPLIER_SOCIAL * energyFactor;
    case 'curious':
      return baseSpeed * SPEED_MULTIPLIER_CURIOUS * energyFactor;
    case 'play':
      return baseSpeed * SPEED_MULTIPLIER_PLAY * energyFactor;
    case 'sleep':
      return baseSpeed * SPEED_MULTIPLIER_SLEEP;
    case 'hunt':
      return baseSpeed * SPEED_MULTIPLIER_HUNT * energyFactor;
    default:
      return baseSpeed * energyFactor;
  }
}

function computeFleeTarget(creature: Creature, mousePos: Vector2): Vector2 {
  const headPos = creature.segments[0].position;
  const dx = headPos.x - mousePos.x;
  const dy = headPos.y - mousePos.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  const jitterAngle = Math.sin(creature.age * 0.08) * 0.4;
  const jitteredDx = dx * Math.cos(jitterAngle) - dy * Math.sin(jitterAngle);
  const jitteredDy = dx * Math.sin(jitterAngle) + dy * Math.cos(jitterAngle);

  return createVector(
    headPos.x + (jitteredDx / len) * FLEE_TARGET_DISTANCE,
    headPos.y + (jitteredDy / len) * FLEE_TARGET_DISTANCE
  );
}

function pickTargetPosition(
  creature: Creature,
  worldWidth: number,
  worldHeight: number,
  mousePos: Vector2,
  mouseActive: boolean
): Vector2 | null {
  if (creature.state === 'idle' || creature.state === 'rest' || creature.state === 'sleep') {
    return null;
  }

  if (creature.targetPosition && Math.random() > TARGET_PERSIST_CHANCE) {
    const distToTarget = distanceBetween(creature.segments[0].position, creature.targetPosition);
    if (distToTarget > TARGET_REACHED_THRESHOLD) {
      return creature.targetPosition;
    }
  }

  if (creature.state === 'chase' && mouseActive) {
    return copyVector(mousePos);
  }

  if (creature.state === 'flee' && mouseActive) {
    return computeFleeTarget(creature, mousePos);
  }

  if (creature.state === 'eat' && creature.perception.nearbyFood.length > 0) {
    const bestFood = creature.perception.nearbyFood.reduce((best, current) =>
      current.preference > best.preference ? current : best
    );
    return copyVector(bestFood.position);
  }

  if (creature.state === 'social' && creature.perception.nearbyCreatures.length > 0) {
    const nearestCreature = creature.perception.nearbyCreatures.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    );
    const offset = creature.config.socialRadius * 0.4;
    return createVector(
      nearestCreature.creature.segments[0].position.x + randomRange(-offset, offset),
      nearestCreature.creature.segments[0].position.y + randomRange(-offset, offset)
    );
  }

  if (creature.state === 'play' && creature.perception.nearbyCreatures.length > 0) {
    const playfulCreature = creature.perception.nearbyCreatures.find(
      (nc) => nc.creature.personality.playfulness > 0.4 && nc.distance < creature.config.socialRadius
    );
    if (playfulCreature) {
      const offset = 30;
      return createVector(
        playfulCreature.creature.segments[0].position.x + randomRange(-offset, offset),
        playfulCreature.creature.segments[0].position.y + randomRange(-offset, offset)
      );
    }
  }

  if (creature.state === 'curious') {
    const interestingMemories = creature.memories.filter((m) => m.type === 'interesting' || m.type === 'food');
    if (interestingMemories.length > 0 && Math.random() < 0.35) {
      const memory = interestingMemories[Math.floor(Math.random() * interestingMemories.length)];
      return copyVector(memory.position);
    }
  }

  const margin = BOUNDARY_MARGIN + 40;
  const targetX = randomRange(margin, worldWidth - margin);
  const targetY = randomRange(margin, worldHeight - margin);
  return createVector(targetX, targetY);
}

function computeBoundaryForce(position: Vector2, worldWidth: number, worldHeight: number): Vector2 {
  let fx = 0;
  let fy = 0;

  if (position.x < BOUNDARY_MARGIN) {
    fx += BOUNDARY_REPULSION_STRENGTH * (1 - position.x / BOUNDARY_MARGIN);
  }
  if (position.x > worldWidth - BOUNDARY_MARGIN) {
    fx -= BOUNDARY_REPULSION_STRENGTH * (1 - (worldWidth - position.x) / BOUNDARY_MARGIN);
  }
  if (position.y < BOUNDARY_MARGIN) {
    fy += BOUNDARY_REPULSION_STRENGTH * (1 - position.y / BOUNDARY_MARGIN);
  }
  if (position.y > worldHeight - BOUNDARY_MARGIN) {
    fy -= BOUNDARY_REPULSION_STRENGTH * (1 - (worldHeight - position.y) / BOUNDARY_MARGIN);
  }

  return createVector(fx, fy);
}

function normalizeAngleDifference(angleDiff: number): number {
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  return angleDiff;
}

function computeDesiredHeading(creature: Creature, _worldWidth: number, _worldHeight: number): number {
  if (creature.targetPosition) {
    const desiredAngle = angleBetweenVectors(creature.segments[0].position, creature.targetPosition);
    const angleDiff = normalizeAngleDifference(desiredAngle - creature.heading);
    const maxTurn = creature.config.turnSpeed * (creature.needs.energy * 0.5 + 0.5);
    return creature.heading + clampValue(angleDiff, -maxTurn, maxTurn);
  }

  if (creature.state === 'idle' || creature.state === 'rest' || creature.state === 'sleep') {
    return creature.heading + Math.sin(creature.noiseOffset) * IDLE_WANDER_FACTOR * 0.3;
  }

  return creature.heading;
}

function updateHeadMovement(creature: Creature, worldWidth: number, worldHeight: number): void {
  const head = creature.segments[0];
  const speed = computeSpeedForState(creature);

  creature.heading = computeDesiredHeading(creature, worldWidth, worldHeight);

  if (creature.state === 'idle' || creature.state === 'rest' || creature.state === 'sleep') {
    creature.noiseOffset += IDLE_NOISE_INCREMENT * 0.3;
  }

  const moveDir = createVector(Math.cos(creature.heading), Math.sin(creature.heading));
  const targetVelocity = multiplyVector(moveDir, speed);

  const boundaryForce = computeBoundaryForce(head.position, worldWidth, worldHeight);
  const adjustedVelocity = addVectors(targetVelocity, boundaryForce);

  creature.velocity = lerpVectors(creature.velocity, adjustedVelocity, VELOCITY_LERP_FACTOR);

  head.previousPosition = copyVector(head.position);
  head.position = addVectors(head.position, creature.velocity);
  head.angle = creature.heading;

  const margin = HEAD_MARGIN;
  if (head.position.x < -margin) head.position.x = -margin;
  if (head.position.x > worldWidth + margin) head.position.x = worldWidth + margin;
  if (head.position.y < -margin) head.position.y = -margin;
  if (head.position.y > worldHeight + margin) head.position.y = worldHeight + margin;
}

function updateSpine(creature: Creature): void {
  const { segmentLength, followFactor } = creature.config;

  for (let i = 1; i < creature.segments.length; i++) {
    const prev = creature.segments[i - 1];
    const curr = creature.segments[i];

    curr.previousPosition = copyVector(curr.position);

    const dir = subtractVectors(prev.position, curr.position);
    const dist = vectorMagnitude(dir);

    if (dist > 0) {
      const targetPos = subtractVectors(prev.position, multiplyVector(normalizeVector(dir), segmentLength));
      curr.position = lerpVectors(curr.position, targetPos, followFactor);
    }

    curr.angle = angleBetweenVectors(curr.position, prev.position);
  }
}

function solveLegIK(leg: Leg, rootPos: Vector2, targetPos: Vector2, legLength: number): void {
  const halfLen = legLength * LEG_KNEE_HALF_FACTOR;
  const dist = distanceBetween(rootPos, targetPos);
  const reach = Math.min(dist, legLength * LEG_REACH_SAFETY_FACTOR);

  const angleToTarget = angleBetweenVectors(rootPos, targetPos);
  const midX = rootPos.x + Math.cos(angleToTarget) * reach * LEG_KNEE_HALF_FACTOR;
  const midY = rootPos.y + Math.sin(angleToTarget) * reach * LEG_KNEE_HALF_FACTOR;

  const perpAngle = angleToTarget + Math.PI / 2;
  const offset = Math.sqrt(Math.max(0, halfLen * halfLen - (reach * LEG_KNEE_HALF_FACTOR) * (reach * LEG_KNEE_HALF_FACTOR)));

  const kneeX = midX + Math.cos(perpAngle) * offset * leg.side;
  const kneeY = midY + Math.sin(perpAngle) * offset * leg.side;

  leg.segments[0] = createVector(kneeX, kneeY);
  leg.footPosition = targetPos;
}

function computeIdealFootPosition(leg: Leg, creature: Creature): Vector2 {
  const rootPos = creature.segments[leg.rootIndex].position;
  const bodyDir = creature.segments[leg.rootIndex].angle;
  const idealOffset = rotateVector(
    createVector(0, leg.side * creature.config.segmentLength * LEG_IDEAL_OFFSET_MULTIPLIER),
    bodyDir
  );
  return addVectors(rootPos, idealOffset);
}

function startLegStep(leg: Leg, idealFootPos: Vector2, bodyDir: number, legLength: number): void {
  leg.isGrounded = false;
  leg.stepProgress = 0;
  leg.targetPosition = {
    x: idealFootPos.x + Math.cos(bodyDir) * legLength * LEG_FORWARD_OFFSET_MULTIPLIER,
    y: idealFootPos.y + Math.sin(bodyDir) * legLength * LEG_FORWARD_OFFSET_MULTIPLIER,
  };
}

function updateSteppingLeg(leg: Leg, legLength: number): void {
  leg.stepProgress += LEG_STEP_SPEED;
  if (leg.stepProgress >= 1) {
    leg.stepProgress = 0;
    leg.isGrounded = true;
    leg.footPosition = copyVector(leg.targetPosition);
  } else {
    const t = leg.stepProgress;
    const arcHeight = legLength * LEG_ARC_HEIGHT_MULTIPLIER * Math.sin(t * Math.PI);
    const groundPos = lerpVectors(leg.footPosition, leg.targetPosition, t);
    leg.footPosition = createVector(groundPos.x, groundPos.y - arcHeight);
  }
}

function updateLegs(creature: Creature): void {
  const { legLength } = creature.config;
  const stepThreshold = legLength * LEG_STEP_THRESHOLD_MULTIPLIER;

  for (const leg of creature.legs) {
    const rootPos = creature.segments[leg.rootIndex].position;
    const bodyDir = creature.segments[leg.rootIndex].angle;
    const idealFootPos = computeIdealFootPosition(leg, creature);
    const distToIdeal = distanceBetween(leg.footPosition, idealFootPos);

    if (leg.isGrounded && distToIdeal > stepThreshold && leg.stepProgress <= 0) {
      startLegStep(leg, idealFootPos, bodyDir, legLength);
    }

    if (!leg.isGrounded) {
      updateSteppingLeg(leg, legLength);
    }

    solveLegIK(leg, rootPos, leg.footPosition, legLength);
  }
}

function updateAntennas(creature: Creature): void {
  const head = creature.segments[0];
  const emotionalSway = creature.emotionalState === 'excited' ? 2.5 : creature.emotionalState === 'scared' ? 3.5 : creature.emotionalState === 'playful' ? 2 : 1;

  for (const antenna of creature.antennas) {
    antenna.swayPhase += ANTENNA_SWAY_SPEED * emotionalSway;
    const swayAngle = Math.sin(antenna.swayPhase) * 0.25 + Math.sin(antenna.swayPhase * 1.5) * 0.12;
    const absoluteAngle = head.angle + antenna.angle + swayAngle;

    antenna.tipPosition = createVector(
      head.position.x + Math.cos(absoluteAngle) * antenna.length,
      head.position.y + Math.sin(absoluteAngle) * antenna.length
    );
  }
}

function updateFootprints(creature: Creature): void {
  for (let i = creature.footprints.length - 1; i >= 0; i--) {
    creature.footprints[i].life--;
    if (creature.footprints[i].life <= 0) {
      creature.footprints.splice(i, 1);
    }
  }

  const isMoving = creature.state !== 'idle' && creature.state !== 'rest' && creature.state !== 'sleep';
  if (!isMoving || creature.legs.length === 0) return;

  for (const leg of creature.legs) {
    if (!leg.isGrounded || leg.stepProgress > 0) continue;

    const lastFootprint = creature.footprints.find((f) => f.side === leg.side);
    if (lastFootprint && distanceBetween(lastFootprint.position, leg.footPosition) < FOOTPRINT_SPAWN_DISTANCE) {
      continue;
    }

    creature.footprints.push({
      position: copyVector(leg.footPosition),
      angle: creature.segments[leg.rootIndex].angle,
      life: FOOTPRINT_LIFETIME,
      maxLife: FOOTPRINT_LIFETIME,
      side: leg.side,
    });

    if (creature.footprints.length > 16) {
      creature.footprints.shift();
    }
  }
}

export function updateCreature(
  creature: Creature,
  worldWidth: number,
  worldHeight: number,
  mousePos: Vector2,
  mouseActive: boolean,
  time: number,
  allCreatures: Creature[],
  foodSources: { position: Vector2; amount: number; type: string; hue: number }[]
): void {
  creature.age += 1;
  creature.growthStage = Math.min(1, creature.growthStage + GROWTH_RATE);

  if (time % PERCEPTION_CHECK_INTERVAL === 0) {
    updatePerception(creature, mousePos, mouseActive, allCreatures, foodSources);
  }

  updateNeeds(creature);
  decayMemories(creature);
  updateStateTimer(creature, mousePos, mouseActive);
  updateEmotionalState(creature);

  creature.targetPosition = pickTargetPosition(creature, worldWidth, worldHeight, mousePos, mouseActive);
  updateHeadMovement(creature, worldWidth, worldHeight);
  updateSpine(creature);
  updateLegs(creature);
  updateAntennas(creature);
  updateFootprints(creature);

  creature.pulsePhase += PULSE_PHASE_INCREMENT;
  creature.breathPhase += BREATH_PHASE_INCREMENT;

  if (mouseActive && creature.perception.mouseDistance < creature.config.curiosityRadius) {
    addMemory(creature, 'interesting', mousePos, 0.25);
  }
}
