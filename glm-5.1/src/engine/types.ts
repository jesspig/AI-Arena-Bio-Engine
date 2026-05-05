import type { Vec2 } from './vec2'

export interface SpineSegment {
  pos: Vec2
  angle: number
  width: number
  breathOffset: number
}

export interface LimbConfig {
  attachSpineIndex: number
  upperLength: number
  lowerLength: number
  side: 'left' | 'right'
  elbowBend: number
  phaseOffset: number
}

export interface LimbState {
  hip: Vec2
  knee: Vec2
  foot: Vec2
  footTarget: Vec2
  isPlanted: boolean
  plantTimer: number
  stepPhase: number
}

export type BehaviorState = 'wander' | 'hunt' | 'startle' | 'rest' | 'curious' | 'play' | 'sleep' | 'eat'

export type FoodCategory = 'favorite' | 'normal' | 'dislike'

export interface EmotionData {
  fear: number
  curiosity: number
  energy: number
  satisfaction: number
  hunger: number
  happiness: number
}

export interface BehaviorData {
  state: BehaviorState
  target: Vec2
  stateTimer: number
  wanderAngle: number
  speed: number
  emotion: EmotionData
  lastMousePos: Vec2 | null
  lastMouseTime: number
  stateBlend: number
  prevState: BehaviorState
  intent: string
  approachTarget: Vec2 | null
}

export interface FoodItem {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  size: number
  hue: number
  eaten: boolean
  category: FoodCategory
  spawnTime: number
  bobPhase: number
}

export interface TentacleState {
  basePos: Vec2
  tipPos: Vec2
  controlPoints: Vec2[]
  phase: number
}

export interface EnvironmentObject {
  pos: Vec2
  type: 'rock' | 'seaweed' | 'coral' | 'vent'
  size: number
  hue: number
  phase: number
}

export interface CreatureSnapshot {
  spine: SpineSegment[]
  limbs: LimbState[]
  behavior: BehaviorData
  headPos: Vec2
  headAngle: number
  time: number
  tentacles: TentacleState[]
  foods: FoodItem[]
  breathPhase: number
  bodyWavePhase: number
  environment: EnvironmentObject[]
}

export interface ParticleData {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  size: number
  hue: number
  type: 'ambient' | 'trail' | 'startle' | 'eat' | 'bubble' | 'glow' | 'dislike' | 'happy' | 'sleep'
}
