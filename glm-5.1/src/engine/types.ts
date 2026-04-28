import type { Vec2 } from './vec2'

export interface SpineSegment {
  pos: Vec2
  angle: number
  width: number
}

export interface LimbConfig {
  attachSpineIndex: number
  upperLength: number
  lowerLength: number
  side: 'left' | 'right'
  elbowBend: number
}

export interface LimbState {
  hip: Vec2
  knee: Vec2
  foot: Vec2
  footTarget: Vec2
  isPlanted: boolean
  plantTimer: number
}

export type BehaviorState = 'wander' | 'hunt' | 'startle' | 'rest'

export interface BehaviorData {
  state: BehaviorState
  target: Vec2
  stateTimer: number
  wanderAngle: number
  speed: number
}

export interface CreatureSnapshot {
  spine: SpineSegment[]
  limbs: LimbState[]
  behavior: BehaviorData
  headPos: Vec2
  headAngle: number
  time: number
}

export interface ParticleData {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  size: number
  hue: number
}
