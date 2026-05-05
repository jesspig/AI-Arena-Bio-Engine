import {
  CreatureState,
  WorldState,
  BehaviorMainState,
  BehaviorSubState,
  Vec2,
  FoodItem,
  Obstacle,
} from './types';
import {
  createVec2,
  sub,
  add,
  scale,
  length,
  normalize,
  distance,
  dot,
  levyFlightStep,
  clamp,
  randomRange,
  limit,
} from './math';

const FLEE_DURATION = { min: 90, max: 160 };
const REST_MIN_DURATION = 90;
const REST_MAX_DURATION = 240;
const INTERACT_MAX_DISTANCE = 200;
const EAT_DURATION = { min: 40, max: 80 };
const PLAY_DURATION = { min: 60, max: 120 };
const BURROW_DURATION = { min: 300, max: 800 };

const FOOD_SMELL_RANGE = 350;
const FAVORITE_SMELL_BONUS = 1.5;
const AVOID_FOOD_HUNGER_THRESHOLD = 80;
const OBSTACLE_LOOKAHEAD = 50;
const BOUNDARY_MARGIN = 80;
const HYSTERESIS_FRAMES = 30;

export function updateBehavior(world: WorldState, creature: CreatureState): void {
  const needs = creature.needs;
  const time = world.time;
  const mousePos = world.mousePos;
  const distToMouse = distance(creature.headPos, mousePos);

  creature.mainState = determineMainState(needs, world.isNight);

  if (creature.cooldownTimer > 0) {
    creature.cooldownTimer -= 1;
  }

  if (creature.eatTimer > 0) {
    creature.eatTimer -= 1;
  }

  if (creature.burrowTimer > 0 && creature.subState !== 'BURROWING') {
  }

  creature.stateTimer += 1;

  if (creature.subState !== 'EATING') {
    const desiredSubState = determineSubState(creature, world, time);

    if (desiredSubState !== creature.subState) {
      const hystKey = `${creature.subState}->${desiredSubState}`;
      const canSwitch = creature.cooldownTimer <= 0 || creature.stateTimer > HYSTERESIS_FRAMES;

      if (desiredSubState === 'FLEEING') {
        creature.subState = 'FLEEING';
        creature.stateTimer = 0;
        creature.cooldownTimer = 15;
      } else if (canSwitch || creature.stateTimer > 60) {
        creature.subState = desiredSubState;
        creature.stateTimer = 0;
        creature.cooldownTimer = HYSTERESIS_FRAMES;
      }
    }
  }

  if (creature.subState === 'FLEEING' && creature.stateTimer > randomRange(FLEE_DURATION.min, FLEE_DURATION.max)) {
    if (creature.needs.fear < 35) {
      creature.subState = 'WANDERING';
      creature.stateTimer = 0;
    }
  }

  if (creature.subState === 'RESTING' && creature.stateTimer > randomRange(REST_MIN_DURATION, REST_MAX_DURATION)) {
    if (creature.needs.energy > 50) {
      creature.subState = 'WANDERING';
      creature.stateTimer = 0;
    }
  }

  if (
    creature.subState === 'INTERACTING' &&
    world.interactionMode === 'NONE' &&
    distToMouse > INTERACT_MAX_DISTANCE
  ) {
    creature.subState = 'WANDERING';
    creature.stateTimer = 0;
  }

  if (creature.subState === 'EATING' && creature.eatTimer <= 0) {
    creature.subState = 'WANDERING';
    creature.stateTimer = 0;
  }

  if (creature.subState === 'PLAY' && creature.stateTimer > randomRange(PLAY_DURATION.min, PLAY_DURATION.max)) {
    creature.subState = 'WANDERING';
    creature.stateTimer = 0;
  }

  let target: Vec2;

  if (creature.subState === 'EATING') {
    target = creature.target || computeRestTarget(creature, world, time);
  } else if (creature.subState === 'BURROWING') {
    target = computeRestTarget(creature, world, time);
  } else {
    target = computeTarget(creature, world, time);
  }

  target = applyBoundaryContainment(target, world.width, world.height);
  target = applyObstacleAvoidance(creature.headPos, target, creature.config.moveSpeed, world.obstacles);

  creature.target = target;

  if (creature.subState === 'INTERACTING' && distToMouse < 50) {
    creature.interactingTarget = { x: mousePos.x, y: mousePos.y };
  } else {
    creature.interactingTarget = null;
  }

  if (world.toyPos && creature.subState === 'PLAY') {
    creature.interactingTarget = world.toyPos;
  }

  if (creature.needs.hunger < 10 && creature.targetFoodItem) {
    creature.targetFoodItem = null;
  }
}

function determineMainState(needs: { energy: number }, isNight: boolean): BehaviorMainState {
  if (needs.energy < 10 || (needs.energy < 25 && isNight)) return 'SLEEPING';
  return 'AWAKE';
}

function determineSubState(creature: CreatureState, world: WorldState, time: number): BehaviorSubState {
  const needs = creature.needs;

  if (needs.fear > 60) return 'FLEEING';

  if (creature.mainState === 'SLEEPING') return 'RESTING';

  if (creature.eatTimer > 0) return 'EATING';

  const nearestFood = findBestFood(creature.headPos, world.foodItems, needs.hunger);
  const distToFood = nearestFood ? distance(creature.headPos, nearestFood.position) : Infinity;

  if (needs.hunger > 55 && nearestFood && distToFood < FOOD_SMELL_RANGE) {
    creature.targetFoodItem = nearestFood;
    return 'HUNTING';
  }

  if (
    world.interactionMode !== 'NONE' &&
    (world.interactionMode === 'TOY' || world.interactionMode === 'PETTING')
  ) {
    creature.targetFoodItem = null;
    return 'INTERACTING';
  }

  if (world.toyPos && creature.needs.energy > 50 && creature.needs.comfort > 40) {
    creature.targetFoodItem = null;
    return 'PLAY';
  }

  if (needs.hunger > 45) {
    if (nearestFood) creature.targetFoodItem = nearestFood;
    return 'FORAGING';
  }

  if (needs.curiosity > 55) {
    creature.targetFoodItem = null;
    return 'EXPLORING';
  }

  if (needs.energy < 20) {
    creature.targetFoodItem = null;
    return 'RESTING';
  }

  if (needs.energy > 60 && needs.comfort > 50 && needs.curiosity > 40 && Math.random() < 0.03) {
    creature.targetFoodItem = null;
    return 'PLAY';
  }

  creature.targetFoodItem = null;
  return 'WANDERING';
}

function computeTarget(creature: CreatureState, world: WorldState, time: number): Vec2 {
  switch (creature.subState) {
    case 'FLEEING':
      return computeFleeTarget(creature);
    case 'HUNTING':
      return computeHuntTarget(creature, world);
    case 'INTERACTING':
      return computeInteractTarget(creature, world);
    case 'FORAGING':
      return computeForageTarget(creature, world, time);
    case 'EXPLORING':
      return computeExploreTarget(creature, world, time);
    case 'RESTING':
      return computeRestTarget(creature, world, time);
    case 'PLAY':
      return computePlayTarget(creature, world, time);
    case 'WANDERING':
    default:
      return computeWanderTarget(creature, world, time);
  }
}

function computeFleeTarget(creature: CreatureState): Vec2 {
  const threat = creature.fleeingFrom || creature.headPos;
  const awayDir = normalize(sub(creature.headPos, threat));
  return add(creature.headPos, scale(awayDir, 400));
}

function computeHuntTarget(creature: CreatureState, world: WorldState): Vec2 {
  if (creature.targetFoodItem && !creature.targetFoodItem.eaten) {
    return creature.targetFoodItem.position;
  }
  const nearest = findNearestPrey(creature.headPos, world.foodItems);
  if (!nearest) return computeWanderTarget(creature, world, world.time);
  return nearest.position;
}

function computeInteractTarget(creature: CreatureState, world: WorldState): Vec2 {
  if (world.mouseDragPos) return world.mouseDragPos;
  if (world.mouseActive) return world.mousePos;
  if (creature.interactingTarget) return creature.interactingTarget;
  return world.mousePos;
}

function computeForageTarget(creature: CreatureState, world: WorldState, time: number): Vec2 {
  const nearest = creature.targetFoodItem && !creature.targetFoodItem.eaten
    ? creature.targetFoodItem
    : findBestFood(creature.headPos, world.foodItems, creature.needs.hunger);

  if (nearest && !nearest.eaten) {
    creature.targetFoodItem = nearest;
    return nearest.position;
  }

  if (creature.foodMemory.length > 0) {
    const recent = creature.foodMemory[creature.foodMemory.length - 1];
    if (distance(creature.headPos, recent) > 80) {
      return recent;
    }
  }

  creature.targetFoodItem = null;
  return levyFlightWander(creature, world, time);
}

function computeExploreTarget(creature: CreatureState, world: WorldState, _time: number): Vec2 {
  return getLeastVisitedTarget(creature.headPos, world);
}

function computeRestTarget(creature: CreatureState, _world: WorldState, time: number): Vec2 {
  const idleX = Math.sin(time * 0.02) * 10;
  const idleY = Math.cos(time * 0.025) * 8;
  return add(creature.headPos, { x: idleX, y: idleY });
}

function computePlayTarget(creature: CreatureState, world: WorldState, _time: number): Vec2 {
  if (world.toyPos) return world.toyPos;

  const phase = creature.playPhase;
  const radius = 60 + Math.sin(phase * 0.5) * 30;
  const angle = phase * 0.7;
  return add(creature.headPos, {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle * 0.8) * radius * 0.6,
  });
}

function computeWanderTarget(creature: CreatureState, world: WorldState, time: number): Vec2 {
  const arrivalDist = 20;

  if (!creature.wanderTarget) {
    creature.wanderTarget = levyFlightWander(creature, world, time);
  }

  const dist = distance(creature.headPos, creature.wanderTarget);
  if (dist < arrivalDist) {
    creature.wanderTarget = levyFlightWander(creature, world, time);
  }

  return creature.wanderTarget;
}

function levyFlightWander(creature: CreatureState, world: WorldState, _time: number): Vec2 {
  const head = creature.headPos;
  const baseAngle = Math.random() * Math.PI * 2;
  const minStep = creature.config.segmentLength * 12;
  const stepSize = levyFlightStep(minStep, 450, 1.5);

  let tx = head.x + Math.cos(baseAngle) * stepSize;
  let ty = head.y + Math.sin(baseAngle) * stepSize;

  tx = clamp(tx, BOUNDARY_MARGIN, world.width - BOUNDARY_MARGIN);
  ty = clamp(ty, BOUNDARY_MARGIN, world.height - BOUNDARY_MARGIN);

  return { x: tx, y: ty };
}

function getLeastVisitedTarget(headPos: Vec2, world: WorldState): Vec2 {
  const { gridCols, gridRows, cellSize, visitedGrid } = world;

  if (gridCols === 0 || gridRows === 0) return headPos;

  let bestCol = 0;
  let bestRow = 0;
  let minVisits = Infinity;

  const headCol = clamp(Math.floor(headPos.x / cellSize), 0, gridCols - 1);
  const headRow = clamp(Math.floor(headPos.y / cellSize), 0, gridRows - 1);

  const searchRadius = 5;
  for (let dc = -searchRadius; dc <= searchRadius; dc++) {
    for (let dr = -searchRadius; dr <= searchRadius; dr++) {
      const col = headCol + dc;
      const row = headRow + dr;
      if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
        if (visitedGrid[col][row] < minVisits) {
          minVisits = visitedGrid[col][row];
          bestCol = col;
          bestRow = row;
        }
      }
    }
  }

  return {
    x: bestCol * cellSize + cellSize / 2,
    y: bestRow * cellSize + cellSize / 2,
  };
}

function findNearestPrey(headPos: Vec2, foods: FoodItem[]): FoodItem | null {
  let nearest: FoodItem | null = null;
  let minDist = Infinity;

  for (const food of foods) {
    if (food.eaten) continue;
    const d = distance(headPos, food.position);
    if (d < minDist && d < FOOD_SMELL_RANGE) {
      minDist = d;
      nearest = food;
    }
  }

  return nearest;
}

function findBestFood(headPos: Vec2, foods: FoodItem[], hunger: number): FoodItem | null {
  let best: FoodItem | null = null;
  let bestScore = -Infinity;

  for (const food of foods) {
    if (food.eaten) continue;

    if (food.foodType === 'AVOID' && hunger < AVOID_FOOD_HUNGER_THRESHOLD) continue;

    const d = distance(headPos, food.position);
    if (d > FOOD_SMELL_RANGE) continue;

    const rangeMultiplier = food.foodType === 'FAVORITE' ? FAVORITE_SMELL_BONUS : 1;
    if (d > FOOD_SMELL_RANGE * rangeMultiplier) continue;

    const typeScore = food.foodType === 'FAVORITE' ? 100 : food.foodType === 'NEUTRAL' ? 50 : 10;
    const distScore = 100 - (d / (FOOD_SMELL_RANGE * rangeMultiplier)) * 100;
    const hungerBonus = food.foodType === 'AVOID' ? (hunger - AVOID_FOOD_HUNGER_THRESHOLD) * 2 : 0;

    const score = typeScore + distScore * 0.5 + hungerBonus;

    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }

  return best;
}

function applyBoundaryContainment(target: Vec2, width: number, height: number): Vec2 {
  return {
    x: clamp(target.x, BOUNDARY_MARGIN, width - BOUNDARY_MARGIN),
    y: clamp(target.y, BOUNDARY_MARGIN, height - BOUNDARY_MARGIN),
  };
}

function applyObstacleAvoidance(
  head: Vec2,
  desiredTarget: Vec2,
  speed: number,
  obstacles: Obstacle[]
): Vec2 {
  const dir = normalize(sub(desiredTarget, head));
  const right = { x: -dir.y, y: dir.x };

  let steerForce = createVec2(0, 0);

  for (const obs of obstacles) {
    const toObs = sub(obs.position, head);
    const proj = dot(toObs, dir);

    if (proj > 0 && proj < OBSTACLE_LOOKAHEAD + obs.radius) {
      const lateral = dot(toObs, right);
      const penetration = Math.abs(lateral) - obs.radius;
      if (penetration < 20) {
        const avoidDir = lateral > 0 ? scale(right, speed) : scale(right, -speed);
        steerForce = add(steerForce, avoidDir);
      }
    }

    const dist = distance(head, obs.position);
    if (dist < obs.radius + 20) {
      const pushDir = normalize(sub(head, obs.position));
      steerForce = add(steerForce, scale(pushDir, speed * 2));
    }
  }

  if (length(steerForce) > 0.001) {
    return add(head, add(scale(dir, speed * 0.7), steerForce));
  }

  return desiredTarget;
}
