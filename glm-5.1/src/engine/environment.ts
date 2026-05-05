import type { Vec2 } from './vec2'
import { add } from './vec2'
import type { EnvironmentObject, FoodItem, FoodCategory } from './types'

const MAX_ENV_OBJECTS = 15
const MAX_FOODS = 12
const FOOD_SPAWN_INTERVAL = 300
const FOOD_LIFE = 800

const FOOD_CATEGORIES: { category: FoodCategory; hue: number; size: number; weight: number }[] = [
  { category: 'favorite', hue: 45, size: 5, weight: 0.3 },
  { category: 'normal', hue: 120, size: 4, weight: 0.5 },
  { category: 'dislike', hue: 280, size: 3, weight: 0.2 },
]

export interface EnvironmentState {
  objects: EnvironmentObject[]
  foods: FoodItem[]
  spawnTimer: number
}

function selectFoodCategory(): { category: FoodCategory; hue: number; size: number } {
  const roll = Math.random()
  let cumulative = 0
  for (const fc of FOOD_CATEGORIES) {
    cumulative += fc.weight
    if (roll < cumulative) return fc
  }
  return FOOD_CATEGORIES[1]
}

function createEnvironmentObject(canvasWidth: number, canvasHeight: number): EnvironmentObject {
  const types: EnvironmentObject['type'][] = ['rock', 'seaweed', 'coral', 'vent']
  const type = types[Math.floor(Math.random() * types.length)]
  const hueMap: Record<string, number> = { rock: 200, seaweed: 130, coral: 350, vent: 25 }
  const sizeMap: Record<string, number> = { rock: 30, seaweed: 20, coral: 25, vent: 15 }

  return {
    pos: {
      x: 80 + Math.random() * (canvasWidth - 160),
      y: 80 + Math.random() * (canvasHeight - 160),
    },
    type,
    size: sizeMap[type] + Math.random() * 20,
    hue: hueMap[type] + (Math.random() - 0.5) * 30,
    phase: Math.random() * Math.PI * 2,
  }
}

export function createEnvironment(canvasWidth: number, canvasHeight: number): EnvironmentState {
  const objects: EnvironmentObject[] = []
  for (let i = 0; i < MAX_ENV_OBJECTS; i++) {
    objects.push(createEnvironmentObject(canvasWidth, canvasHeight))
  }
  return { objects, foods: [], spawnTimer: FOOD_SPAWN_INTERVAL / 2 }
}

export function spawnFood(env: EnvironmentState, canvasWidth: number, canvasHeight: number, time: number): void {
  if (env.foods.filter(f => !f.eaten).length >= MAX_FOODS) return

  const fc = selectFoodCategory()
  const pos: Vec2 = {
    x: 60 + Math.random() * (canvasWidth - 120),
    y: 60 + Math.random() * (canvasHeight - 120),
  }

  env.foods.push({
    pos,
    vel: { x: (Math.random() - 0.5) * 0.2, y: -0.2 - Math.random() * 0.3 },
    life: FOOD_LIFE,
    maxLife: FOOD_LIFE,
    size: fc.size,
    hue: fc.hue,
    eaten: false,
    category: fc.category,
    spawnTime: time,
    bobPhase: Math.random() * Math.PI * 2,
  })
}

export function addFoodAt(env: EnvironmentState, pos: Vec2, time: number): void {
  if (env.foods.filter(f => !f.eaten).length >= MAX_FOODS) return

  const fc = selectFoodCategory()
  env.foods.push({
    pos: { ...pos },
    vel: { x: (Math.random() - 0.5) * 0.3, y: -0.3 - Math.random() * 0.3 },
    life: FOOD_LIFE,
    maxLife: FOOD_LIFE,
    size: fc.size,
    hue: fc.hue,
    eaten: false,
    category: fc.category,
    spawnTime: time,
    bobPhase: Math.random() * Math.PI * 2,
  })
}

export function updateEnvironment(env: EnvironmentState, canvasWidth: number, canvasHeight: number, time: number): void {
  env.spawnTimer--
  if (env.spawnTimer <= 0) {
    spawnFood(env, canvasWidth, canvasHeight, time)
    env.spawnTimer = FOOD_SPAWN_INTERVAL + Math.floor(Math.random() * 150)
  }

  for (let i = env.foods.length - 1; i >= 0; i--) {
    const food = env.foods[i]
    if (food.eaten) {
      env.foods.splice(i, 1)
      continue
    }
    food.pos = add(food.pos, food.vel)
    food.vel = { x: food.vel.x * 0.97, y: food.vel.y * 0.97 + 0.005 }
    food.bobPhase += 0.03
    food.life--
    if (food.life <= 0) {
      env.foods.splice(i, 1)
    }
  }

  for (const obj of env.objects) {
    obj.phase += 0.01
  }
}
