export interface Vec2 {
  x: number
  y: number
}

export interface SpineSegment {
  pos: Vec2
  angle: number
  width: number
}

export interface LegConfig {
  attachIndex: number
  side: -1 | 1
  upperLength: number
  lowerLength: number
  restAngle: number
}

export interface LegState {
  footPos: Vec2
  targetPos: Vec2
  isPlanted: boolean
  liftPhase: number
  kneeSide: -1 | 1
}

export enum BehaviorState {
  RESTING = 'resting',
  IDLE = 'idle',
  WANDERING = 'wandering',
  EXPLORING = 'exploring',
  EATING = 'eating',
  GROOMING = 'grooming',
  CURIOUS = 'curious',
  FLEEING = 'fleeing',
  SLEEPING = 'sleeping',
  PLAYING = 'playing',
  SOCIALIZING = 'socializing',
  PATROLLING = 'patrolling',
}

export enum GaitMode {
  WALK = 'walk',
  RUN = 'run',
  STALK = 'stalk',
}

export enum SpinePose {
  NORMAL = 'normal',
  RESTING = 'resting',
  ALERT = 'alert',
  CURLING = 'curling',
  LOW = 'low',
}

export enum ParticleType {
  TRAIL = 'trail',
  BREATH = 'breath',
  EMOTION = 'emotion',
  FOOTPRINT = 'footprint',
  PETTING = 'petting',
  FOOD = 'food',
  FIREFLY = 'firefly',
  DUST = 'dust',
}

export enum FoodType {
  BERRY = 'berry',
  MUSHROOM = 'mushroom',
  BUG = 'bug',
}

export interface FoodPreference {
  type: FoodType
  nutrition: number
  moodEffect: number
  color: string
  label: string
}

export const FOOD_PREFERENCES: Record<FoodType, FoodPreference> = {
  [FoodType.BERRY]: { type: FoodType.BERRY, nutrition: 0.5, moodEffect: 0.1, color: '#4ade80', label: '浆果' },
  [FoodType.MUSHROOM]: { type: FoodType.MUSHROOM, nutrition: 0.3, moodEffect: 0, color: '#a78bfa', label: '蘑菇' },
  [FoodType.BUG]: { type: FoodType.BUG, nutrition: 0.7, moodEffect: -0.05, color: '#fb923c', label: '虫子' },
}

export interface Needs {
  hunger: number
  energy: number
  curiosity: number
  social: number
  mood: number
}

export interface Personality {
  boldness: number
  activity: number
  sociability: number
  curiosity: number
}

export interface InterestPoint {
  pos: Vec2
  type: 'food' | 'user' | 'explore' | 'rest'
  strength: number
  lastVisit: number
}

export interface Memory {
  interestPoints: InterestPoint[]
  homePos: Vec2
  lastAteTime: number
  lastSleptTime: number
  totalInteractions: number
}

export interface Stimulus {
  pos: Vec2
  type: 'food' | 'danger' | 'toy' | 'user' | 'comfort'
  intensity: number
}

export interface Perception {
  visionAngle: number
  visionRange: number
  stimuli: Stimulus[]
}

export interface FoodItem {
  pos: Vec2
  nutrition: number
  remaining: number
  createdAt: number
  foodType: FoodType
}

export interface Obstacle {
  pos: Vec2
  radius: number
}

export interface EnvironmentStimulus {
  pos: Vec2
  type: 'toy' | 'danger_zone' | 'comfort_zone'
  radius: number
  life: number
  maxLife: number
}

export interface EmotionBubble {
  type: 'heart' | 'question' | 'sweat' | 'zzz' | 'happy' | 'hunger' | 'play' | 'social'
  pos: Vec2
  life: number
  maxLife: number
}

export interface SteeringForce {
  force: Vec2
}

export interface PhysicsState {
  position: Vec2
  velocity: Vec2
  acceleration: Vec2
  mass: number
  maxSpeed: number
  maxForce: number
}

export enum TimeOfDay {
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
}

export interface CircadianState {
  timeOfDay: TimeOfDay
  cycle: number
  daylight: number
}

export interface BehaviorConfig {
  wanderSpeed: number
  curiousSpeed: number
  fleeSpeed: number
  turnRate: number
  curiosityRadius: number
  fleeRadius: number
  idleDuration: [number, number]
  wanderDuration: [number, number]
}

export interface CreatureConfig {
  segmentCount: number
  segmentLength: number
  headWidth: number
  tailTaper: number
  legs: LegConfig[]
  behavior: BehaviorConfig
  color: {
    head: string
    body: string
    tail: string
    eye: string
    glow: string
  }
  personality?: Partial<Personality>
}

export const MIN_DWELL_TIME: Record<BehaviorState, number> = {
  [BehaviorState.IDLE]: 1.0,
  [BehaviorState.WANDERING]: 2.0,
  [BehaviorState.RESTING]: 3.0,
  [BehaviorState.SLEEPING]: 5.0,
  [BehaviorState.FLEEING]: 1.5,
  [BehaviorState.EXPLORING]: 2.0,
  [BehaviorState.EATING]: 2.0,
  [BehaviorState.GROOMING]: 3.0,
  [BehaviorState.CURIOUS]: 1.5,
  [BehaviorState.PLAYING]: 2.5,
  [BehaviorState.SOCIALIZING]: 2.0,
  [BehaviorState.PATROLLING]: 3.0,
}

export interface CreatureState {
  spine: SpineSegment[]
  legs: LegState[]
  behaviorState: BehaviorState
  target: Vec2 | null
  velocity: Vec2
  heading: number
  noiseOffset: number
  stateTimer: number
  breathPhase: number
  needs: Needs
  personality: Personality
  memory: Memory
  perception: Perception
  physics: PhysicsState
  gaitMode: GaitMode
  spinePose: SpinePose
  circadian: CircadianState
  emotionBubbles: EmotionBubble[]
  foodItems: FoodItem[]
  obstacles: Obstacle[]
  envStimuli: EnvironmentStimulus[]
  interactionCooldown: number
  lookAt: Vec2 | null
  accumulatedTime: number
  stateCooldown: number
  lastFoodSpawnTime: number
  playChaseAngle: number
}

export interface Particle {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
  type: ParticleType
}

export interface WorldBounds {
  width: number
  height: number
}
