import type { Vec2 } from './vec2'
import { add, scale, fromAngle, dist, normalize, sub, length } from './vec2'
import type { BehaviorData, BehaviorState, EmotionData, FoodCategory } from './types'

const WANDER_SPEED = 1.0
const HUNT_SPEED = 2.2
const STARTLE_SPEED = 3.5
const REST_SPEED = 0.15
const CURIOUS_SPEED = 0.7
const PLAY_SPEED = 1.8
const SLEEP_SPEED = 0.05
const EAT_SPEED = 0.3

const WANDER_DURATION_MIN = 180
const WANDER_DURATION_MAX = 400
const HUNT_DURATION = 500
const STARTLE_DURATION = 60
const REST_DURATION_MIN = 250
const REST_DURATION_MAX = 500
const CURIOUS_DURATION_MIN = 200
const CURIOUS_DURATION_MAX = 400
const PLAY_DURATION_MIN = 120
const PLAY_DURATION_MAX = 300
const SLEEP_DURATION_MIN = 400
const SLEEP_DURATION_MAX = 700
const EAT_DURATION = 40

const STARTLE_DISTANCE = 60
const CURIOUS_DISTANCE_MIN = 60
const CURIOUS_DISTANCE_MAX = 220
const HUNT_DISTANCE_MAX = 300
const FOOD_HUNT_DISTANCE = 280

const FEAR_DECAY = 0.004
const CURIOSITY_DECAY = 0.002
const ENERGY_DECAY = 0.0008
const SATISFACTION_DECAY = 0.0015
const HUNGER_INCREASE = 0.0012
const HAPPINESS_DECAY = 0.002
const ENERGY_REST_GAIN = 0.006
const ENERGY_SLEEP_GAIN = 0.015
const SATISFACTION_EAT_FAVORITE = 0.4
const SATISFACTION_EAT_NORMAL = 0.2
const SATISFACTION_EAT_DISLIKE = -0.1
const HUNGER_EAT_FAVORITE = 0.5
const HUNGER_EAT_NORMAL = 0.3
const HUNGER_EAT_DISLIKE = 0.05
const HAPPINESS_EAT_FAVORITE = 0.3
const HAPPINESS_EAT_NORMAL = 0.1
const HAPPINESS_EAT_DISLIKE = -0.2

const STATE_BLEND_SPEED = 0.04

const HUNGER_THRESHOLD_HUNT = 0.4
const HUNGER_THRESHOLD_URGENT = 0.75
const ENERGY_THRESHOLD_SLEEP = 0.15
const ENERGY_THRESHOLD_REST = 0.3

function createEmotion(): EmotionData {
  return { fear: 0, curiosity: 0.3, energy: 1.0, satisfaction: 0.5, hunger: 0.1, happiness: 0.5 }
}

export function createBehavior(startPos: Vec2): BehaviorData {
  return {
    state: 'wander',
    target: add(startPos, { x: 100, y: 0 }),
    stateTimer: 200,
    wanderAngle: Math.random() * Math.PI * 2,
    speed: WANDER_SPEED,
    emotion: createEmotion(),
    lastMousePos: null,
    lastMouseTime: 0,
    stateBlend: 1.0,
    prevState: 'wander',
    intent: '探索周围环境',
    approachTarget: null,
  }
}

function isInFieldOfView(headPos: Vec2, headAngle: number, target: Vec2, fov: number): boolean {
  const toTarget = sub(target, headPos)
  const d = length(toTarget)
  if (d < 1e-8) return true
  const targetAngle = Math.atan2(toTarget.y, toTarget.x)
  let diff = targetAngle - headAngle
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return Math.abs(diff) < fov / 2
}

function updateEmotion(emotion: EmotionData, behavior: BehaviorData, mouseDist: number, hasMouse: boolean): void {
  emotion.fear = Math.max(0, emotion.fear - FEAR_DECAY)
  emotion.curiosity = Math.max(0, Math.min(1, emotion.curiosity - CURIOSITY_DECAY))
  emotion.energy = Math.max(0, Math.min(1, emotion.energy - ENERGY_DECAY))
  emotion.satisfaction = Math.max(0, emotion.satisfaction - SATISFACTION_DECAY)
  emotion.hunger = Math.min(1, emotion.hunger + HUNGER_INCREASE)
  emotion.happiness = Math.max(0, Math.min(1, emotion.happiness - HAPPINESS_DECAY))

  if (behavior.state === 'rest') {
    emotion.energy = Math.min(1, emotion.energy + ENERGY_REST_GAIN)
  }
  if (behavior.state === 'sleep') {
    emotion.energy = Math.min(1, emotion.energy + ENERGY_SLEEP_GAIN)
    emotion.fear = Math.max(0, emotion.fear - 0.01)
  }
  if (behavior.state === 'wander' || behavior.state === 'play') {
    emotion.energy = Math.max(0, emotion.energy - ENERGY_DECAY * 1.5)
  }

  if (emotion.hunger > HUNGER_THRESHOLD_URGENT) {
    emotion.happiness = Math.max(0, emotion.happiness - 0.005)
    emotion.energy = Math.max(0, emotion.energy - 0.001)
  }

  if (hasMouse) {
    if (mouseDist < STARTLE_DISTANCE) {
      emotion.fear = Math.min(1, emotion.fear + 0.04)
    } else if (mouseDist < CURIOUS_DISTANCE_MAX) {
      emotion.curiosity = Math.min(1, emotion.curiosity + 0.015)
    }
  }
}

function selectNextState(
  behavior: BehaviorData,
  mouseDist: number,
  hasMouse: boolean,
  _nearestFoodDist: number,
  nearestFoodCategory: FoodCategory | null,
  hasFood: boolean,
): BehaviorState {
  const { emotion, state } = behavior

  if (emotion.fear > 0.6 && hasMouse && mouseDist < STARTLE_DISTANCE * 2.5) {
    behavior.intent = '感知到威胁，准备逃跑'
    return 'startle'
  }

  if (emotion.hunger > HUNGER_THRESHOLD_URGENT && hasFood) {
    behavior.intent = '非常饥饿，急需觅食'
    return 'hunt'
  }

  if (emotion.hunger > HUNGER_THRESHOLD_HUNT && hasFood && nearestFoodCategory === 'favorite') {
    behavior.intent = '发现了喜欢的食物'
    return 'hunt'
  }

  if (emotion.energy < ENERGY_THRESHOLD_SLEEP && emotion.fear < 0.2) {
    behavior.intent = '精疲力竭，需要睡眠'
    return 'sleep'
  }

  if (emotion.energy < ENERGY_THRESHOLD_REST && emotion.fear < 0.3 && emotion.hunger < 0.5) {
    behavior.intent = '有些疲惫，休息一下'
    return 'rest'
  }

  if (hasMouse && mouseDist < CURIOUS_DISTANCE_MAX && mouseDist > CURIOUS_DISTANCE_MIN) {
    if (emotion.fear < 0.3 && emotion.happiness > 0.4 && emotion.energy > 0.5) {
      behavior.intent = '想和那个东西玩耍'
      return 'play'
    }
    if (emotion.curiosity > 0.3) {
      behavior.intent = '好奇地观察那个东西'
      return 'curious'
    }
  }

  if (emotion.hunger > HUNGER_THRESHOLD_HUNT && hasFood) {
    behavior.intent = '肚子饿了，去找食物'
    return 'hunt'
  }

  if (state === 'rest' && emotion.energy > 0.6) {
    behavior.intent = '休息够了，继续探索'
    return 'wander'
  }

  if (state === 'sleep' && emotion.energy > 0.8) {
    behavior.intent = '睡醒了，精神焕发'
    return 'wander'
  }

  if (state === 'wander' && Math.random() < 0.05 && emotion.energy < 0.5) {
    behavior.intent = '走累了，歇一歇'
    return 'rest'
  }

  behavior.intent = '悠闲地漫游'
  return 'wander'
}

export function updateBehavior(
  behavior: BehaviorData,
  headPos: Vec2,
  headAngle: number,
  mousePos: Vec2 | null,
  canvasWidth: number,
  canvasHeight: number,
  foods: { pos: Vec2; eaten: boolean; category: FoodCategory }[],
  time: number,
): Vec2 {
  behavior.stateTimer--
  behavior.stateBlend = Math.min(1, behavior.stateBlend + STATE_BLEND_SPEED)

  const mouseDist = mousePos ? dist(headPos, mousePos) : Infinity
  const hasMouse = mousePos !== null && mousePos.x > 0 && mousePos.x < canvasWidth && mousePos.y > 0 && mousePos.y < canvasHeight

  if (hasMouse && mousePos) {
    behavior.lastMousePos = { ...mousePos }
    behavior.lastMouseTime = time
  }

  updateEmotion(behavior.emotion, behavior, mouseDist, hasMouse)

  let nearestFoodDist = Infinity
  let nearestFoodPos: Vec2 | null = null
  let nearestFoodCategory: FoodCategory | null = null

  let bestFoodDist = Infinity
  let bestFoodPos: Vec2 | null = null
  for (const food of foods) {
    if (food.eaten) continue
    const d = dist(headPos, food.pos)
    if (d < nearestFoodDist) {
      nearestFoodDist = d
      nearestFoodPos = food.pos
      nearestFoodCategory = food.category
    }
    const preference = food.category === 'favorite' ? 0.6 : food.category === 'normal' ? 1.0 : 1.8
    const weightedDist = d * preference
    if (weightedDist < bestFoodDist) {
      bestFoodDist = weightedDist
      bestFoodPos = food.pos
    }
  }

  if (behavior.state !== 'startle' && behavior.state !== 'sleep' && hasMouse && mouseDist < STARTLE_DISTANCE) {
    if (isInFieldOfView(headPos, headAngle, mousePos!, Math.PI * 1.2)) {
      behavior.intent = '被突然靠近，受到惊吓'
      transitionTo(behavior, 'startle', headPos, mousePos)
    }
  }

  if (behavior.stateTimer <= 0) {
    const nextState = selectNextState(behavior, mouseDist, hasMouse, nearestFoodDist, nearestFoodCategory, nearestFoodPos !== null)
    if (nextState === 'hunt' && bestFoodPos) {
      transitionTo(behavior, nextState, headPos, bestFoodPos)
    } else {
      transitionTo(behavior, nextState, headPos, mousePos)
    }
  }

  if (behavior.state === 'hunt') {
    if (bestFoodPos && bestFoodDist < FOOD_HUNT_DISTANCE * 1.5) {
      behavior.target = { ...bestFoodPos }
      behavior.approachTarget = { ...bestFoodPos }
    } else if (hasMouse && mouseDist < HUNT_DISTANCE_MAX && behavior.emotion.hunger > 0.3) {
      behavior.target = { ...mousePos! }
      behavior.approachTarget = { ...mousePos! }
    }
  }

  if (behavior.state === 'curious' && hasMouse) {
    const toMouse = sub(mousePos!, headPos)
    const d = length(toMouse)
    const approachDist = CURIOUS_DISTANCE_MIN + (CURIOUS_DISTANCE_MAX - CURIOUS_DISTANCE_MIN) * 0.6
    if (d > approachDist) {
      behavior.target = add(headPos, scale(normalize(toMouse), d - approachDist))
    } else {
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 30))
    }
    behavior.approachTarget = { ...mousePos! }
  }

  if (behavior.state === 'play' && hasMouse) {
    const toMouse = sub(mousePos!, headPos)
    const perpAngle = Math.atan2(toMouse.y, toMouse.x) + Math.PI / 2
    const circlePhase = time * 0.04
    const circleRadius = 70
    behavior.target = add(mousePos!, add(
      scale(fromAngle(perpAngle + circlePhase), circleRadius * Math.cos(circlePhase)),
      scale(fromAngle(Math.atan2(toMouse.y, toMouse.x)), circleRadius * 0.3),
    ))
    behavior.approachTarget = { ...mousePos! }
  }

  const margin = 100
  if (behavior.target.x < margin) behavior.target.x = margin
  if (behavior.target.x > canvasWidth - margin) behavior.target.x = canvasWidth - margin
  if (behavior.target.y < margin) behavior.target.y = margin
  if (behavior.target.y > canvasHeight - margin) behavior.target.y = canvasHeight - margin

  const toTarget = sub(behavior.target, headPos)
  const distToTarget = length(toTarget)

  if (behavior.state === 'wander' && distToTarget < 30) {
    behavior.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.4
    behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 120 + Math.random() * 80))
    behavior.intent = '换个方向继续探索'
  }

  const dir = normalize(toTarget)
  return scale(dir, behavior.speed)
}

export function onFoodEaten(behavior: BehaviorData, category: FoodCategory): void {
  switch (category) {
    case 'favorite':
      behavior.emotion.satisfaction = Math.min(1, behavior.emotion.satisfaction + SATISFACTION_EAT_FAVORITE)
      behavior.emotion.hunger = Math.max(0, behavior.emotion.hunger - HUNGER_EAT_FAVORITE)
      behavior.emotion.happiness = Math.min(1, behavior.emotion.happiness + HAPPINESS_EAT_FAVORITE)
      behavior.emotion.energy = Math.min(1, behavior.emotion.energy + 0.2)
      behavior.intent = '吃到美味的食物，心满意足'
      break
    case 'normal':
      behavior.emotion.satisfaction = Math.min(1, behavior.emotion.satisfaction + SATISFACTION_EAT_NORMAL)
      behavior.emotion.hunger = Math.max(0, behavior.emotion.hunger - HUNGER_EAT_NORMAL)
      behavior.emotion.happiness = Math.min(1, behavior.emotion.happiness + HAPPINESS_EAT_NORMAL)
      behavior.emotion.energy = Math.min(1, behavior.emotion.energy + 0.1)
      behavior.intent = '填饱了肚子'
      break
    case 'dislike':
      behavior.emotion.satisfaction = Math.max(0, behavior.emotion.satisfaction + SATISFACTION_EAT_DISLIKE)
      behavior.emotion.hunger = Math.max(0, behavior.emotion.hunger - HUNGER_EAT_DISLIKE)
      behavior.emotion.happiness = Math.max(0, behavior.emotion.happiness + HAPPINESS_EAT_DISLIKE)
      behavior.intent = '这个味道不好，很失望'
      break
  }
}

function transitionTo(behavior: BehaviorData, newState: BehaviorState, headPos: Vec2, targetPos: Vec2 | null): void {
  behavior.prevState = behavior.state
  behavior.state = newState
  behavior.stateBlend = 0

  switch (newState) {
    case 'wander':
      behavior.speed = WANDER_SPEED
      behavior.stateTimer = WANDER_DURATION_MIN + Math.random() * (WANDER_DURATION_MAX - WANDER_DURATION_MIN)
      behavior.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.4
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 120 + Math.random() * 80))
      behavior.approachTarget = null
      break
    case 'hunt':
      behavior.speed = HUNT_SPEED
      behavior.stateTimer = HUNT_DURATION
      if (targetPos) behavior.target = { ...targetPos }
      behavior.approachTarget = targetPos ? { ...targetPos } : null
      break
    case 'startle':
      behavior.speed = STARTLE_SPEED
      behavior.stateTimer = STARTLE_DURATION
      behavior.emotion.fear = Math.min(1, behavior.emotion.fear + 0.25)
      if (targetPos) {
        const fleeDir = normalize(sub(headPos, targetPos))
        behavior.target = add(headPos, scale(fleeDir, 200))
      }
      behavior.approachTarget = null
      break
    case 'rest':
      behavior.speed = REST_SPEED
      behavior.stateTimer = REST_DURATION_MIN + Math.random() * (REST_DURATION_MAX - REST_DURATION_MIN)
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 15))
      behavior.approachTarget = null
      break
    case 'curious':
      behavior.speed = CURIOUS_SPEED
      behavior.stateTimer = CURIOUS_DURATION_MIN + Math.random() * (CURIOUS_DURATION_MAX - CURIOUS_DURATION_MIN)
      behavior.emotion.curiosity = Math.min(1, behavior.emotion.curiosity + 0.15)
      if (targetPos) behavior.target = { ...targetPos }
      behavior.approachTarget = targetPos ? { ...targetPos } : null
      break
    case 'play':
      behavior.speed = PLAY_SPEED
      behavior.stateTimer = PLAY_DURATION_MIN + Math.random() * (PLAY_DURATION_MAX - PLAY_DURATION_MIN)
      behavior.emotion.energy = Math.max(0, behavior.emotion.energy - 0.08)
      behavior.emotion.happiness = Math.min(1, behavior.emotion.happiness + 0.1)
      if (targetPos) behavior.target = { ...targetPos }
      behavior.approachTarget = targetPos ? { ...targetPos } : null
      break
    case 'sleep':
      behavior.speed = SLEEP_SPEED
      behavior.stateTimer = SLEEP_DURATION_MIN + Math.random() * (SLEEP_DURATION_MAX - SLEEP_DURATION_MIN)
      behavior.target = add(headPos, scale(fromAngle(behavior.wanderAngle), 5))
      behavior.approachTarget = null
      break
    case 'eat':
      behavior.speed = EAT_SPEED
      behavior.stateTimer = EAT_DURATION
      behavior.target = { ...headPos }
      behavior.approachTarget = null
      break
  }
}
