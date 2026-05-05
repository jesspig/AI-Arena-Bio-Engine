import type { Vec2, FoodItem, Obstacle, EmotionBubble, EnvironmentStimulus, FoodType, WorldBounds } from './types'
import { FOOD_PREFERENCES } from './types'
import { vec2, distance, add, sub, normalize, scale, randomRange, clamp } from './math'

export function createFood(pos: Vec2, foodType?: FoodType): FoodItem {
  const types = Object.keys(FOOD_PREFERENCES) as FoodType[]
  const ft = foodType || types[Math.floor(Math.random() * types.length)]
  const pref = FOOD_PREFERENCES[ft]
  return {
    pos: { ...pos },
    nutrition: pref.nutrition,
    remaining: 1,
    createdAt: Date.now() / 1000,
    foodType: ft,
  }
}

export function createObstacle(pos: Vec2, radius: number = 25): Obstacle {
  return { pos: { ...pos }, radius }
}

export function createEnvStimulus(pos: Vec2, type: EnvironmentStimulus['type'], radius: number = 60): EnvironmentStimulus {
  const lifetimes = { toy: 30, danger_zone: 20, comfort_zone: 40 }
  return { pos: { ...pos }, type, radius, life: lifetimes[type], maxLife: lifetimes[type] }
}

export function updateFoodItems(foods: FoodItem[], dt: number): FoodItem[] {
  return foods
    .map(f => ({ ...f, remaining: f.remaining - dt * 0.008 }))
    .filter(f => f.remaining > 0)
}

export function updateEnvStimuli(stimuli: EnvironmentStimulus[], dt: number): EnvironmentStimulus[] {
  return stimuli
    .map(s => ({ ...s, life: s.life - dt }))
    .filter(s => s.life > 0)
}

export function spawnFoodAuto(
  foods: FoodItem[],
  bounds: WorldBounds,
  currentTime: number,
  lastSpawnTime: number,
  maxFood: number = 5,
  interval: number = 12
): { foods: FoodItem[]; lastSpawnTime: number } {
  if (foods.length >= maxFood) return { foods, lastSpawnTime }
  if (currentTime - lastSpawnTime < interval) return { foods, lastSpawnTime }

  const count = Math.random() < 0.6 ? 1 : 2
  const newFoods = [...foods]
  for (let i = 0; i < count && newFoods.length < maxFood; i++) {
    const pos = vec2(
      randomRange(80, bounds.width - 80),
      randomRange(80, bounds.height - 80)
    )
    newFoods.push(createFood(pos))
  }
  return { foods: newFoods, lastSpawnTime: currentTime }
}

export function spawnEnvStimulusAuto(
  stimuli: EnvironmentStimulus[],
  bounds: WorldBounds,
  dt: number,
  accumulatedTime: number
): EnvironmentStimulus[] {
  if (stimuli.length >= 3) return stimuli
  if (Math.random() > 0.001) return stimuli

  const types: EnvironmentStimulus['type'][] = ['toy', 'danger_zone', 'comfort_zone']
  const type = types[Math.floor(Math.random() * types.length)]
  const pos = vec2(
    randomRange(100, bounds.width - 100),
    randomRange(100, bounds.height - 100)
  )
  return [...stimuli, createEnvStimulus(pos, type)]
}

export function checkFoodEating(
  headPos: Vec2,
  foods: FoodItem[],
  eatRadius: number = 30
): { eaten: FoodItem; index: number } | null {
  for (let i = 0; i < foods.length; i++) {
    if (distance(headPos, foods[i].pos) < eatRadius && foods[i].remaining > 0.2) {
      return { eaten: foods[i], index: i }
    }
  }
  return null
}

export function createEmotionBubble(type: EmotionBubble['type'], pos: Vec2): EmotionBubble {
  return {
    type,
    pos: { x: pos.x + randomRange(-10, 10), y: pos.y - 20 },
    life: 2.0,
    maxLife: 2.0,
  }
}

export function updateEmotionBubbles(bubbles: EmotionBubble[], dt: number): EmotionBubble[] {
  return bubbles
    .map(b => ({
      ...b,
      pos: { x: b.pos.x, y: b.pos.y - 15 * dt },
      life: b.life - dt,
    }))
    .filter(b => b.life > 0)
}

export function checkObstacleCollision(
  pos: Vec2,
  obstacles: Obstacle[],
  avoidRadius: number = 40
): Vec2 | null {
  for (const obs of obstacles) {
    const dist = distance(pos, obs.pos)
    if (dist < obs.radius + avoidRadius) {
      const dir = normalize(sub(pos, obs.pos))
      const pushDist = (obs.radius + avoidRadius) - dist
      return add(pos, scale(dir, pushDist))
    }
  }
  return null
}
