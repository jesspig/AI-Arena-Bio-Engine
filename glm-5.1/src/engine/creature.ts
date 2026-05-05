import type { Vec2 } from './vec2'
import { add, scale, fromAngle, angle, length, sub, normalize, dist, rotate } from './vec2'
import type { LimbConfig, CreatureSnapshot, TentacleState, FoodCategory } from './types'
import { createSpine, updateSpine, type SpineState } from './spine'
import { createLimbState, updateLimb, computeHipPosition } from './limb'
import { createBehavior, updateBehavior, onFoodEaten } from './behavior'
import type { BehaviorData } from './types'
import type { EnvironmentState } from './environment'

const LIMB_CONFIGS: LimbConfig[] = [
  { attachSpineIndex: 3, upperLength: 22, lowerLength: 20, side: 'left', elbowBend: 1, phaseOffset: 0 },
  { attachSpineIndex: 3, upperLength: 22, lowerLength: 20, side: 'right', elbowBend: 1, phaseOffset: Math.PI },
  { attachSpineIndex: 9, upperLength: 20, lowerLength: 18, side: 'left', elbowBend: 1, phaseOffset: Math.PI },
  { attachSpineIndex: 9, upperLength: 20, lowerLength: 18, side: 'right', elbowBend: 1, phaseOffset: 0 },
]

const HEAD_TURN_RATE = 0.1
const FOOD_EAT_DISTANCE = 22
const TENTACLE_COUNT = 2
const TENTACLE_SEGMENTS = 5
const TENTACLE_SEGMENT_LENGTH = 6

const BOUNDARY_MARGIN = 60
const BOUNDARY_FORCE = 0.15

export interface Creature {
  spine: SpineState
  limbStates: ReturnType<typeof createLimbState>[]
  behavior: BehaviorData
  headPos: Vec2
  headAngle: number
  headVelocity: Vec2
  time: number
  tentacles: TentacleState[]
  stepPhase: number
  lastEatenFoodCategory: FoodCategory | null
  eatCooldown: number
}

function createTentacles(headPos: Vec2, headAngle: number): TentacleState[] {
  const tentacles: TentacleState[] = []
  for (let t = 0; t < TENTACLE_COUNT; t++) {
    const side = t === 0 ? -1 : 1
    const baseAngle = headAngle + side * 0.4
    const basePos = add(headPos, scale(fromAngle(baseAngle), 10))
    const controlPoints: Vec2[] = []
    let currentPos = basePos
    for (let i = 0; i < TENTACLE_SEGMENTS; i++) {
      currentPos = add(currentPos, scale(fromAngle(baseAngle + side * 0.3), TENTACLE_SEGMENT_LENGTH))
      controlPoints.push(currentPos)
    }
    tentacles.push({
      basePos,
      tipPos: currentPos,
      controlPoints,
      phase: t * Math.PI,
    })
  }
  return tentacles
}

export function createCreature(x: number, y: number): Creature {
  const spine = createSpine(x, y)
  const limbStates = LIMB_CONFIGS.map(() => createLimbState())
  const behavior = createBehavior({ x, y })

  for (let i = 0; i < LIMB_CONFIGS.length; i++) {
    const hip = computeHipPosition(spine, LIMB_CONFIGS[i])
    limbStates[i].hip = hip
    limbStates[i].knee = { x: hip.x, y: hip.y + 20 }
    limbStates[i].foot = { x: hip.x, y: hip.y + 38 }
    limbStates[i].footTarget = { ...limbStates[i].foot }
  }

  return {
    spine,
    limbStates,
    behavior,
    headPos: { x, y },
    headAngle: 0,
    headVelocity: { x: 0, y: 0 },
    time: 0,
    tentacles: createTentacles({ x, y }, 0),
    stepPhase: 0,
    lastEatenFoodCategory: null,
    eatCooldown: 0,
  }
}

function computeBoundaryForce(pos: Vec2, canvasWidth: number, canvasHeight: number): Vec2 {
  let fx = 0
  let fy = 0

  if (pos.x < BOUNDARY_MARGIN) {
    fx = BOUNDARY_FORCE * (1 - pos.x / BOUNDARY_MARGIN)
  } else if (pos.x > canvasWidth - BOUNDARY_MARGIN) {
    fx = -BOUNDARY_FORCE * (1 - (canvasWidth - pos.x) / BOUNDARY_MARGIN)
  }

  if (pos.y < BOUNDARY_MARGIN) {
    fy = BOUNDARY_FORCE * (1 - pos.y / BOUNDARY_MARGIN)
  } else if (pos.y > canvasHeight - BOUNDARY_MARGIN) {
    fy = -BOUNDARY_FORCE * (1 - (canvasHeight - pos.y) / BOUNDARY_MARGIN)
  }

  return { x: fx, y: fy }
}

function clampPosition(pos: Vec2, canvasWidth: number, canvasHeight: number): Vec2 {
  const hardMargin = 20
  return {
    x: Math.max(hardMargin, Math.min(canvasWidth - hardMargin, pos.x)),
    y: Math.max(hardMargin, Math.min(canvasHeight - hardMargin, pos.y)),
  }
}

function updateTentacles(creature: Creature, mousePos: Vec2 | null): void {
  const { tentacles, headPos, headAngle } = creature

  for (let t = 0; t < tentacles.length; t++) {
    const tentacle = tentacles[t]
    const side = t === 0 ? -1 : 1
    const baseAngle = headAngle + side * 0.5
    tentacle.basePos = add(headPos, add(
      scale(fromAngle(headAngle), 8),
      scale(rotate(fromAngle(headAngle), Math.PI / 2), side * 8),
    ))

    const isSleeping = creature.behavior.state === 'sleep'
    const isEating = creature.behavior.state === 'eat'
    tentacle.phase += isSleeping ? 0.02 : isEating ? 0.1 : 0.06

    const waveAmplitude = isSleeping ? 0.05 : creature.behavior.state === 'curious' ? 0.4 : 0.2
    const targetDir = mousePos && !isSleeping
      ? normalize(sub(mousePos, tentacle.basePos))
      : fromAngle(baseAngle)

    let currentPos = tentacle.basePos
    for (let i = 0; i < tentacle.controlPoints.length; i++) {
      const segT = (i + 1) / tentacle.controlPoints.length
      const waveAngle = Math.sin(tentacle.phase + i * 0.8) * waveAmplitude * segT
      const blendAngle = baseAngle + (Math.atan2(targetDir.y, targetDir.x) - baseAngle) * 0.3 * segT
      const segAngle = blendAngle + waveAngle + side * 0.3
      currentPos = add(currentPos, scale(fromAngle(segAngle), TENTACLE_SEGMENT_LENGTH))
      tentacle.controlPoints[i] = currentPos
    }
    tentacle.tipPos = currentPos
  }
}

export function updateCreature(
  creature: Creature,
  mousePos: Vec2 | null,
  canvasWidth: number,
  canvasHeight: number,
  environment: EnvironmentState,
): { eatenFoods: { pos: Vec2; category: FoodCategory }[] } {
  creature.time++
  if (creature.eatCooldown > 0) creature.eatCooldown--

  const desiredVelocity = updateBehavior(
    creature.behavior,
    creature.headPos,
    creature.headAngle,
    mousePos,
    canvasWidth,
    canvasHeight,
    environment.foods,
    creature.time,
  )

  const speed = length(desiredVelocity)
  creature.stepPhase += speed * 0.15

  const boundaryForce = computeBoundaryForce(creature.headPos, canvasWidth, canvasHeight)
  const finalVelocity = add(desiredVelocity, boundaryForce)

  creature.headPos = add(creature.headPos, finalVelocity)
  creature.headPos = clampPosition(creature.headPos, canvasWidth, canvasHeight)
  creature.headVelocity = finalVelocity

  if (length(desiredVelocity) > 0.05) {
    const desiredAngle = angle(desiredVelocity)
    let diff = desiredAngle - creature.headAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    const turnRate = creature.behavior.state === 'startle' ? HEAD_TURN_RATE * 1.5 : HEAD_TURN_RATE
    creature.headAngle += diff * turnRate
  }

  updateSpine(creature.spine, creature.headPos, creature.headAngle, speed, creature.time, creature.behavior.state === 'startle')

  for (let i = 0; i < LIMB_CONFIGS.length; i++) {
    updateLimb(creature.limbStates[i], LIMB_CONFIGS[i], creature.spine, creature.headVelocity, creature.time, creature.stepPhase)
  }

  const eatenFoods: { pos: Vec2; category: FoodCategory }[] = []
  for (const food of environment.foods) {
    if (food.eaten) continue
    const d = dist(creature.headPos, food.pos)
    if (d < FOOD_EAT_DISTANCE && creature.eatCooldown <= 0) {
      const shouldEat = food.category === 'dislike'
        ? creature.behavior.emotion.hunger > 0.7
        : true

      if (shouldEat) {
        food.eaten = true
        onFoodEaten(creature.behavior, food.category)
        creature.lastEatenFoodCategory = food.category
        creature.eatCooldown = 30
        eatenFoods.push({ pos: { ...food.pos }, category: food.category })
      }
    }
  }

  updateTentacles(creature, mousePos)

  return { eatenFoods }
}

export function getCreatureSnapshot(creature: Creature, environment: EnvironmentState): CreatureSnapshot {
  return {
    spine: creature.spine.segments.map(s => ({ ...s, pos: { ...s.pos } })),
    limbs: creature.limbStates.map(l => ({
      hip: { ...l.hip },
      knee: { ...l.knee },
      foot: { ...l.foot },
      footTarget: { ...l.footTarget },
      isPlanted: l.isPlanted,
      plantTimer: l.plantTimer,
      stepPhase: l.stepPhase,
    })),
    behavior: { ...creature.behavior, target: { ...creature.behavior.target }, emotion: { ...creature.behavior.emotion }, approachTarget: creature.behavior.approachTarget ? { ...creature.behavior.approachTarget } : null },
    headPos: { ...creature.headPos },
    headAngle: creature.headAngle,
    time: creature.time,
    tentacles: creature.tentacles.map(t => ({
      basePos: { ...t.basePos },
      tipPos: { ...t.tipPos },
      controlPoints: t.controlPoints.map(p => ({ ...p })),
      phase: t.phase,
    })),
    foods: environment.foods.map(f => ({ ...f, pos: { ...f.pos }, vel: { ...f.vel } })),
    breathPhase: creature.spine.breathPhase,
    bodyWavePhase: creature.spine.wavePhase,
    environment: environment.objects.map(o => ({ ...o, pos: { ...o.pos } })),
  }
}
