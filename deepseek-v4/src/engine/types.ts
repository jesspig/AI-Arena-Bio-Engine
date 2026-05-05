export interface Vec2 {
  x: number;
  y: number;
}

export interface LegJoint {
  shoulder: Vec2;
  knee: Vec2;
  foot: Vec2;
}

export interface LegState {
  joints: LegJoint;
  planted: boolean;
  plantPos: Vec2;
  swingStartPos: Vec2;
  swingPhase: number;
  side: 'left' | 'right';
  gaitPhase: number;
  legIndex: number;
}

export interface BodySegment {
  position: Vec2;
  prevPosition: Vec2;
  width: number;
  legLeft: LegState;
  legRight: LegState;
}

export type MoodType = 'CONTENT' | 'CURIOUS' | 'EXCITED' | 'NERVOUS' | 'SCARED';

export type BehaviorMainState = 'AWAKE' | 'SLEEPING';

export type BehaviorSubState =
  | 'WANDERING'
  | 'FORAGING'
  | 'HUNTING'
  | 'EXPLORING'
  | 'FLEEING'
  | 'RESTING'
  | 'INTERACTING'
  | 'EATING'
  | 'PLAY'
  | 'BURROWING';

export interface CreatureNeeds {
  hunger: number;
  energy: number;
  curiosity: number;
  fear: number;
  comfort: number;
  mood: MoodType;
}

export interface CreatureConfig {
  segmentCount: number;
  segmentLength: number;
  legSegment1: number;
  legSegment2: number;
  bodyWidthBase: number;
  bodyWidthTip: number;
  moveSpeed: number;
  maxForce: number;
  spineIterations: number;
  hungerDecayRate: number;
  energyMoveDecay: number;
  energyRestoreRate: number;
  curiosityDecayRate: number;
  curiosityExploreGain: number;
  fearDecayRate: number;
  comfortDecayRate: number;
  comfortPetGain: number;
  walkSpeedRatio: number;
  trotSpeedRatio: number;
  waveSpeed: number;
  waveAmplitude: number;
  antennaLength: number;
  mandibleLength: number;
  bioluminescentSpots: number;
  bioluminescentIntensity: number;
  eyeSize: number;
  eyeGlowIntensity: number;
  containmentForce: number;
  hysteresisCooldown: number;
  curlingSpeed: number;
  satiationThreshold: number;
}

export const DEFAULT_CONFIG: CreatureConfig = {
  segmentCount: 28,
  segmentLength: 14,
  legSegment1: 18,
  legSegment2: 22,
  bodyWidthBase: 16,
  bodyWidthTip: 6,
  moveSpeed: 90,
  maxForce: 225,
  spineIterations: 4,
  hungerDecayRate: 0.3,
  energyMoveDecay: 0.4,
  energyRestoreRate: 1.5,
  curiosityDecayRate: 0.2,
  curiosityExploreGain: 2.5,
  fearDecayRate: 1.2,
  comfortDecayRate: 0.15,
  comfortPetGain: 3.0,
  walkSpeedRatio: 0.3,
  trotSpeedRatio: 0.7,
  waveSpeed: 5.0,
  waveAmplitude: 8.0,
  antennaLength: 28,
  mandibleLength: 14,
  bioluminescentSpots: 9,
  bioluminescentIntensity: 0.8,
  eyeSize: 7,
  eyeGlowIntensity: 0.7,
  containmentForce: 500,
  hysteresisCooldown: 60,
  curlingSpeed: 3.0,
  satiationThreshold: 40,
};

export interface CreatureState {
  segments: BodySegment[];
  headPos: Vec2;
  headAngle: number;
  headVelocity: Vec2;
  headAcceleration: Vec2;
  target: Vec2 | null;
  mainState: BehaviorMainState;
  subState: BehaviorSubState;
  stateTimer: number;
  needs: CreatureNeeds;
  config: CreatureConfig;
  wanderTarget: Vec2;
  fleeingFrom: Vec2 | null;
  interactingTarget: Vec2 | null;
  currentSpeed: number;
  breathPhase: number;
  moodTimer: number;
  lastPetTime: number;
  fedTimer: number;
  hysteresisTimers: Record<string, number>;
  cooldownTimer: number;
  eatTimer: number;
  burrowTimer: number;
  curlAmount: number;
  isBurrowed: boolean;
  archAmount: number;
  playPhase: number;
  lastEatPos: Vec2 | null;
  lastEatType: FoodType | null;
  foodMemory: Vec2[];
  targetFoodItem: FoodItem | null;
}

export type FoodType = 'FAVORITE' | 'NEUTRAL' | 'AVOID';

export type ParticleType = 'TRAIL' | 'BREATH' | 'DUST' | 'SPORE' | 'EMOTION' | 'EATING';

export interface Particle {
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: [number, number, number, number];
  type: ParticleType;
}

export interface FoodItem {
  position: Vec2;
  nutrition: number;
  age: number;
  maxAge: number;
  eaten: boolean;
  foodType: FoodType;
}

export interface ScentMarker {
  position: Vec2;
  strength: number;
  age: number;
  maxAge: number;
}

export interface MoistureZone {
  position: Vec2;
  radius: number;
  moisture: number;
}

export interface Obstacle {
  position: Vec2;
  radius: number;
  type: 'ROCK' | 'WOOD' | 'WALL';
}

export type InteractionMode = 'NONE' | 'FEEDING' | 'PETTING' | 'TOY' | 'POKING';

export interface WorldState {
  width: number;
  height: number;
  time: number;
  timeOfDay: number;
  dayLength: number;
  isNight: boolean;
  foodItems: FoodItem[];
  obstacles: Obstacle[];
  scentMarkers: ScentMarker[];
  moistureZones: MoistureZone[];
  creature: CreatureState;
  particles: Particle[];
  mousePos: Vec2;
  mouseActive: boolean;
  mousePressed: boolean;
  mouseDragPos: Vec2 | null;
  mousePrevPos: Vec2;
  interactionMode: InteractionMode;
  visitedGrid: number[][];
  gridCols: number;
  gridRows: number;
  cellSize: number;
  positiveMemories: Vec2[];
  ambientLight: number;
  showHUD: boolean;
  showControls: boolean;
  showScent: boolean;
  toyPos: Vec2 | null;
}
