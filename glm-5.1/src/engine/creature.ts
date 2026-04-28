import type { Vec2 } from './vec2'
import { add, scale, fromAngle, angle, length } from './vec2'
import type { LimbConfig, CreatureSnapshot } from './types'
import { createSpine, updateSpine, type SpineState } from './spine'
import { createLimbState, updateLimb, computeHipPosition } from './limb'
import { createBehavior, updateBehavior } from './behavior'
import type { BehaviorData } from './types'

const LIMB_CONFIGS: LimbConfig[] = [
  { attachSpineIndex: 3, upperLength: 22, lowerLength: 20, side: 'left', elbowBend: 1 },
  { attachSpineIndex: 3, upperLength: 22, lowerLength: 20, side: 'right', elbowBend: 1 },
  { attachSpineIndex: 9, upperLength: 20, lowerLength: 18, side: 'left', elbowBend: 1 },
  { attachSpineIndex: 9, upperLength: 20, lowerLength: 18, side: 'right', elbowBend: 1 },
]

const HEAD_TURN_RATE = 0.08
const BODY_WAVE_AMPLITUDE = 0.3
const BODY_WAVE_FREQUENCY = 0.15

export interface Creature {
  spine: SpineState
  limbStates: ReturnType<typeof createLimbState>[]
  behavior: BehaviorData
  headPos: Vec2
  headAngle: number
  headVelocity: Vec2
  time: number
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
  }
}

export function updateCreature(
  creature: Creature,
  mousePos: Vec2 | null,
  canvasWidth: number,
  canvasHeight: number,
): void {
  creature.time++

  const desiredVelocity = updateBehavior(
    creature.behavior,
    creature.headPos,
    mousePos,
    canvasWidth,
    canvasHeight,
  )

  const waveOffset = Math.sin(creature.time * BODY_WAVE_FREQUENCY) * BODY_WAVE_AMPLITUDE
  const velocity = add(desiredVelocity, scale(fromAngle(creature.headAngle + Math.PI / 2), waveOffset))

  creature.headPos = add(creature.headPos, velocity)
  creature.headVelocity = velocity

  if (length(velocity) > 0.1) {
    const desiredAngle = angle(velocity)
    let diff = desiredAngle - creature.headAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    creature.headAngle += diff * HEAD_TURN_RATE
  }

  updateSpine(creature.spine, creature.headPos, creature.headAngle)

  for (let i = 0; i < LIMB_CONFIGS.length; i++) {
    updateLimb(creature.limbStates[i], LIMB_CONFIGS[i], creature.spine, creature.headVelocity, creature.time)
  }
}

export function getCreatureSnapshot(creature: Creature): CreatureSnapshot {
  return {
    spine: creature.spine.segments.map(s => ({ ...s, pos: { ...s.pos } })),
    limbs: creature.limbStates.map(l => ({
      hip: { ...l.hip },
      knee: { ...l.knee },
      foot: { ...l.foot },
      footTarget: { ...l.footTarget },
      isPlanted: l.isPlanted,
      plantTimer: l.plantTimer,
    })),
    behavior: { ...creature.behavior, target: { ...creature.behavior.target } },
    headPos: { ...creature.headPos },
    headAngle: creature.headAngle,
    time: creature.time,
  }
}
