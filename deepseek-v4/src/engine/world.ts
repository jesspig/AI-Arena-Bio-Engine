import { WorldState, CreatureState, FoodItem, Obstacle, Vec2, FoodType } from './types';
import {
  createVec2,
  clamp,
  randomRange,
} from './math';
import { createNeeds } from './needs';

const DAY_LENGTH = 3600;
const FOOD_MAX_AGE = 600;
const GRID_CELL_SIZE = 60;

export function createWorld(canvasWidth: number, canvasHeight: number): WorldState {
  const gridCols = Math.ceil(canvasWidth / GRID_CELL_SIZE);
  const gridRows = Math.ceil(canvasHeight / GRID_CELL_SIZE);
  const visitedGrid: number[][] = [];

  for (let c = 0; c < gridCols; c++) {
    visitedGrid[c] = [];
    for (let r = 0; r < gridRows; r++) {
      visitedGrid[c][r] = 0;
    }
  }

  return {
    width: canvasWidth,
    height: canvasHeight,
    time: 0,
    timeOfDay: 0.25,
    dayLength: DAY_LENGTH,
    isNight: false,
    foodItems: [],
    obstacles: [],
    scentMarkers: [],
    moistureZones: [],
    creature: null as unknown as CreatureState,
    particles: [],
    mousePos: createVec2(0, 0),
    mouseActive: false,
    mousePressed: false,
    mouseDragPos: null,
    mousePrevPos: createVec2(0, 0),
    interactionMode: 'NONE',
    visitedGrid,
    gridCols,
    gridRows,
    cellSize: GRID_CELL_SIZE,
    positiveMemories: [],
    ambientLight: 1.0,
    showHUD: true,
    showControls: true,
    showScent: false,
    toyPos: null,
  };
}

export function updateWorld(world: WorldState): void {
  world.time += 1;

  const rawTimeOfDay = (world.time % world.dayLength) / world.dayLength;
  world.timeOfDay = rawTimeOfDay;
  world.isNight = rawTimeOfDay > 0.6 || rawTimeOfDay < 0.2;

  const dayProgress = Math.sin(rawTimeOfDay * Math.PI * 2);
  world.ambientLight = Math.max(0.2, 0.5 + dayProgress * 0.5);

  updateFoodItems(world);
  updateSpatialMemory(world);
}

function updateFoodItems(world: WorldState): void {
  for (let i = world.foodItems.length - 1; i >= 0; i--) {
    const food = world.foodItems[i];
    food.age += 1;
    if (food.eaten || food.age > food.maxAge) {
      world.foodItems.splice(i, 1);
    }
  }

  const naturalFoodCount = world.foodItems.filter(f => !f.eaten).length;
  const spawnThreshold = world.isNight ? 8 : 5;

  if (naturalFoodCount < spawnThreshold && Math.random() < 0.008) {
    spawnNaturalFood(world);
  }
}

function spawnNaturalFood(world: WorldState): void {
  const margin = 60;
  for (let i = 0; i < randomRange(2, 4); i++) {
    const typeRoll = Math.random();
    const foodType: FoodType = typeRoll < 0.15 ? 'AVOID' : typeRoll < 0.85 ? 'NEUTRAL' : 'FAVORITE';
    const nutritionMap: Record<FoodType, [number, number]> = {
      FAVORITE: [25, 35],
      NEUTRAL: [15, 25],
      AVOID: [5, 10],
    };
    const [nMin, nMax] = nutritionMap[foodType];

    world.foodItems.push({
      position: createVec2(
        randomRange(margin, world.width - margin),
        randomRange(margin, world.height - margin),
      ),
      nutrition: randomRange(nMin, nMax),
      age: 0,
      maxAge: FOOD_MAX_AGE,
      eaten: false,
      foodType,
    });
  }
}

export function addFood(world: WorldState, x: number, y: number, foodType: FoodType = 'NEUTRAL'): void {
  const nutritionMap: Record<FoodType, [number, number]> = {
    FAVORITE: [25, 35],
    NEUTRAL: [15, 25],
    AVOID: [5, 10],
  };
  const [nMin, nMax] = nutritionMap[foodType];

  world.foodItems.push({
    position: createVec2(x, y),
    nutrition: randomRange(nMin, nMax),
    age: 0,
    maxAge: FOOD_MAX_AGE,
    eaten: false,
    foodType,
  });
}

export function addObstacle(world: WorldState, x: number, y: number): void {
  world.obstacles.push({
    position: createVec2(x, y),
    radius: randomRange(20, 40),
    type: 'ROCK',
  });
}

export function removeObstacles(world: WorldState): void {
  world.obstacles = [];
}

function updateSpatialMemory(world: WorldState): void {
  if (!world.creature || !world.creature.segments) return;

  const head = world.creature.headPos;
  const col = clamp(
    Math.floor(head.x / world.cellSize),
    0,
    world.gridCols - 1,
  );
  const row = clamp(
    Math.floor(head.y / world.cellSize),
    0,
    world.gridRows - 1,
  );

  if (world.visitedGrid[col] && world.visitedGrid[col][row] !== undefined) {
    world.visitedGrid[col][row] += 1;
  }
}

export function checkFoodConsumption(world: WorldState): void {
  if (!world.creature || !world.creature.segments) return;

  const head = world.creature.headPos;
  const eatRadius = 22;

  for (const food of world.foodItems) {
    if (food.eaten) continue;
    const dx = head.x - food.position.x;
    const dy = head.y - food.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < eatRadius && world.creature.eatTimer <= 0 && world.creature.needs.hunger > 15) {
      world.creature.eatTimer = randomRange(40, 80);
      world.creature.targetFoodItem = food;
      world.creature.lastEatPos = { x: food.position.x, y: food.position.y };
      world.creature.lastEatType = food.foodType;
      world.creature.subState = 'EATING';
      world.creature.stateTimer = 0;
    }

    if (food === world.creature.targetFoodItem && world.creature.eatTimer <= 0 && dist < eatRadius) {
      food.eaten = true;
      const nutritionMultiplier = food.foodType === 'FAVORITE' ? 1.5 : food.foodType === 'NEUTRAL' ? 1.0 : 0.5;
      const hungerReduction = food.nutrition * nutritionMultiplier;
      world.creature.needs.hunger = Math.max(0, world.creature.needs.hunger - hungerReduction);
      world.creature.needs.comfort = Math.min(100, world.creature.needs.comfort + (food.foodType === 'FAVORITE' ? 10 : food.foodType === 'NEUTRAL' ? 5 : 0));

      world.positiveMemories.push({ x: food.position.x, y: food.position.y });
      if (world.positiveMemories.length > 20) {
        world.positiveMemories.shift();
      }

      if (world.creature.foodMemory.length > 10) {
        world.creature.foodMemory.shift();
      }
      world.creature.foodMemory.push({ x: food.position.x, y: food.position.y });
    }
  }
}
