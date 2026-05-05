import type p5 from 'p5'
import type {
  CreatureConfig, CreatureState, SpineSegment, Vec2, Particle,
  Needs, BehaviorState, EmotionBubble, FoodItem, Obstacle, CircadianState, EnvironmentStimulus,
} from '../engine/types'
import { BehaviorState as BS, TimeOfDay, SpinePose, GaitMode, FoodType } from '../engine/types'
import { add, scale, length, lerp, clamp } from '../engine/math'
import { getSpineNormal } from '../engine/spine'
import { getCreatureLegIKResults } from '../engine/creature'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) }
}

function blendBodyColor(
  t: number,
  headRgb: { r: number; g: number; b: number },
  bodyRgb: { r: number; g: number; b: number },
  tailRgb: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  if (t < 0.3) return lerpColor(headRgb, bodyRgb, t / 0.3)
  return lerpColor(bodyRgb, tailRgb, (t - 0.3) / 0.7)
}

function getMoodColorShift(needs: Needs): { r: number; g: number; b: number } {
  let dr = 0, dg = 0, db = 0
  if (needs.hunger > 0.6) { dr += 20; dg -= 10; db -= 15 }
  if (needs.energy < 0.3) { dr -= 15; dg -= 10; db += 20 }
  if (needs.mood > 0.8) { dr += 10; dg += 15; db += 5 }
  if (needs.mood < 0.3) { dr -= 10; dg -= 15; db -= 10 }
  return { r: dr, g: dg, b: db }
}

export function drawCreature(
  p: p5,
  state: CreatureState,
  config: CreatureConfig
): void {
  const { spine, breathPhase, behaviorState, needs, spinePose, lookAt } = state

  p.push()
  p.noStroke()

  drawGlowAura(p, spine, config, breathPhase, needs)
  drawBody(p, spine, config, breathPhase, needs, spinePose)

  const ikResults = getCreatureLegIKResults(state, config)
  drawLegs(p, ikResults, config, behaviorState, state.gaitMode)

  drawAntennae(p, spine, config, breathPhase, lookAt, state.accumulatedTime)
  drawHead(p, spine, config, breathPhase, behaviorState, needs, lookAt)
  drawTailTip(p, spine, config, state.accumulatedTime)

  p.pop()
}

function drawGlowAura(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number,
  needs: Needs
): void {
  const breathScale = 1 + Math.sin(breathPhase) * 0.15
  const glowRgb = hexToRgb(config.color.glow)
  const moodShift = getMoodColorShift(needs)

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const alpha = p.map(i, 0, spine.length, 35, 8) * breathScale
    const size = seg.width * 2.5 * breathScale
    p.fill(
      clamp(glowRgb.r + moodShift.r, 0, 255),
      clamp(glowRgb.g + moodShift.g, 0, 255),
      clamp(glowRgb.b + moodShift.b, 0, 255),
      alpha
    )
    p.ellipse(seg.pos.x, seg.pos.y, size, size)
  }
}

function drawBody(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number,
  needs: Needs,
  pose: SpinePose
): void {
  const breathScale = 1 + Math.sin(breathPhase) * 0.08
  const poseScale = pose === SpinePose.RESTING ? 0.8 : pose === SpinePose.LOW ? 0.85 : 1.0

  const leftEdge: Vec2[] = []
  const rightEdge: Vec2[] = []

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const normal = getSpineNormal(spine, i)
    const halfWidth = seg.width * breathScale * poseScale * 0.5
    leftEdge.push(add(seg.pos, scale(normal, halfWidth)))
    rightEdge.push(add(seg.pos, scale(normal, -halfWidth)))
  }

  const headRgb = hexToRgb(config.color.head)
  const bodyRgb = hexToRgb(config.color.body)
  const tailRgb = hexToRgb(config.color.tail)
  const moodShift = getMoodColorShift(needs)

  const step = 3
  for (let i = 0; i < spine.length - 1; i += step) {
    const end = Math.min(i + step + 1, spine.length)
    const t = i / (spine.length - 1)
    const base = blendBodyColor(t, headRgb, bodyRgb, tailRgb)
    const r = clamp(base.r + moodShift.r, 0, 255)
    const g = clamp(base.g + moodShift.g, 0, 255)
    const b = clamp(base.b + moodShift.b, 0, 255)

    p.fill(r, g, b, 230)
    p.beginShape()
    for (let j = i; j < end; j++) {
      p.vertex(leftEdge[j].x, leftEdge[j].y)
    }
    for (let j = end - 1; j >= i; j--) {
      p.vertex(rightEdge[j].x, rightEdge[j].y)
    }
    p.endShape(p.CLOSE)
  }

  drawScalePattern(p, spine, config, breathScale)
  drawBackRidge(p, spine, config)
}

function drawScalePattern(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathScale: number
): void {
  const bodyRgb = hexToRgb(config.color.body)

  for (let i = 2; i < spine.length - 1; i += 2) {
    const seg = spine[i]
    const normal = getSpineNormal(spine, i)
    const halfWidth = seg.width * breathScale * 0.35

    for (let side = -1; side <= 1; side += 2) {
      const offset = scale(normal, halfWidth * side * 0.5)
      const pos = add(seg.pos, offset)

      p.fill(bodyRgb.r + 20, bodyRgb.g + 30, bodyRgb.b + 15, 70)
      p.push()
      p.translate(pos.x, pos.y)
      p.rotate(seg.angle)
      p.beginShape()
      const sw = seg.width * 0.15
      const sh = config.segmentLength * 0.35
      p.vertex(0, -sw)
      p.vertex(sh, 0)
      p.vertex(0, sw)
      p.vertex(-sh, 0)
      p.endShape(p.CLOSE)
      p.pop()
    }
  }
}

function drawBackRidge(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig
): void {
  const headRgb = hexToRgb(config.color.head)
  const tailRgb = hexToRgb(config.color.tail)

  p.noFill()
  p.strokeWeight(1.5)
  for (let i = 1; i < spine.length - 1; i++) {
    const t = i / (spine.length - 1)
    const rgb = lerpColor(headRgb, tailRgb, t)
    const normal = getSpineNormal(spine, i)
    const ridgePos = add(spine[i].pos, scale(normal, -spine[i].width * 0.08))
    const alpha = 60 * (1 - t)
    p.stroke(rgb.r + 40, rgb.g + 40, rgb.b + 30, alpha)
    p.point(ridgePos.x, ridgePos.y)
  }
}

function drawAntennae(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number,
  lookAt: Vec2 | null,
  time: number
): void {
  if (spine.length < 2) return

  const head = spine[0]
  const headAngle = head.angle
  const headRgb = hexToRgb(config.color.head)

  const baseLeftAngle = headAngle - 0.4
  const baseRightAngle = headAngle + 0.4

  let leftTargetAngle = baseLeftAngle + Math.sin(time * 2.5) * 0.2
  let rightTargetAngle = baseRightAngle + Math.sin(time * 2.5 + 1) * 0.2

  if (lookAt) {
    const toLook = Math.atan2(lookAt.y - head.pos.y, lookAt.x - head.pos.x)
    const lookInfluence = 0.15
    leftTargetAngle += (toLook - headAngle) * lookInfluence
    rightTargetAngle += (toLook - headAngle) * lookInfluence
  }

  const antLen = 18 + Math.sin(breathPhase * 0.5) * 2

  p.stroke(headRgb.r + 20, headRgb.g + 30, headRgb.b + 10, 180)
  p.strokeWeight(1.5)
  p.noFill()

  const startX = head.pos.x + Math.cos(headAngle) * 12
  const startY = head.pos.y + Math.sin(headAngle) * 12

  p.bezier(
    startX, startY,
    startX + Math.cos(leftTargetAngle) * antLen * 0.5, startY + Math.sin(leftTargetAngle) * antLen * 0.5,
    startX + Math.cos(leftTargetAngle + 0.2) * antLen * 0.8, startY + Math.sin(leftTargetAngle + 0.2) * antLen * 0.8,
    startX + Math.cos(leftTargetAngle + 0.3) * antLen, startY + Math.sin(leftTargetAngle + 0.3) * antLen
  )

  p.bezier(
    startX, startY,
    startX + Math.cos(rightTargetAngle) * antLen * 0.5, startY + Math.sin(rightTargetAngle) * antLen * 0.5,
    startX + Math.cos(rightTargetAngle - 0.2) * antLen * 0.8, startY + Math.sin(rightTargetAngle - 0.2) * antLen * 0.8,
    startX + Math.cos(rightTargetAngle - 0.3) * antLen, startY + Math.sin(rightTargetAngle - 0.3) * antLen
  )

  p.noStroke()
  p.fill(headRgb.r + 40, headRgb.g + 50, headRgb.b + 20, 200)
  const tipL = {
    x: startX + Math.cos(leftTargetAngle + 0.3) * antLen,
    y: startY + Math.sin(leftTargetAngle + 0.3) * antLen,
  }
  const tipR = {
    x: startX + Math.cos(rightTargetAngle - 0.3) * antLen,
    y: startY + Math.sin(rightTargetAngle - 0.3) * antLen,
  }
  p.ellipse(tipL.x, tipL.y, 3, 3)
  p.ellipse(tipR.x, tipR.y, 3, 3)
}

function drawLegs(
  p: p5,
  ikResults: Array<{ hip: Vec2; knee: Vec2; foot: Vec2 }>,
  config: CreatureConfig,
  state: BehaviorState,
  gaitMode: GaitMode
): void {
  const bodyRgb = hexToRgb(config.color.body)
  const isFleeing = state === BS.FLEEING
  const isRunning = gaitMode === GaitMode.RUN

  for (const { hip, knee, foot } of ikResults) {
    p.stroke(bodyRgb.r - 20, bodyRgb.g - 20, bodyRgb.b - 20, 100)
    p.strokeWeight(isRunning ? 5 : 4)
    p.noFill()
    p.line(hip.x + 2, hip.y + 2, knee.x + 2, knee.y + 2)
    p.line(knee.x + 2, knee.y + 2, foot.x + 2, foot.y + 2)

    const legColorR = isFleeing ? 200 : bodyRgb.r + 30
    const legColorG = isFleeing ? 100 : bodyRgb.g + 20
    p.stroke(legColorR, legColorG, bodyRgb.b + 10, 220)
    p.strokeWeight(3.5)
    p.line(hip.x, hip.y, knee.x, knee.y)
    p.strokeWeight(2.5)
    p.line(knee.x, knee.y, foot.x, foot.y)

    p.noStroke()
    p.fill(isFleeing ? 200 : bodyRgb.r + 50, isFleeing ? 80 : bodyRgb.g + 40, bodyRgb.b + 20, 200)
    p.ellipse(foot.x, foot.y, 6, 6)

    p.fill(255, 255, 255, 50)
    p.ellipse(knee.x, knee.y, 4, 4)
  }
}

function drawHead(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number,
  state: BehaviorState,
  needs: Needs,
  lookAt: Vec2 | null
): void {
  if (spine.length < 2) return

  const head = spine[0]
  const headAngle = head.angle
  const breathScale = 1 + Math.sin(breathPhase) * 0.05
  const headRgb = hexToRgb(config.color.head)
  const moodShift = getMoodColorShift(needs)

  const cr = clamp(headRgb.r + moodShift.r, 0, 255)
  const cg = clamp(headRgb.g + moodShift.g, 0, 255)
  const cb = clamp(headRgb.b + moodShift.b, 0, 255)

  p.push()
  p.translate(head.pos.x, head.pos.y)
  p.rotate(headAngle)

  p.fill(cr, cg, cb, 240)
  p.ellipse(6, 0, 24 * breathScale, 14 * breathScale)

  p.fill(cr + 20, cg + 20, cb + 10, 220)
  p.ellipse(16, 0, 12 * breathScale, 8 * breathScale)

  const nostrilScale = state === BS.FLEEING ? 1.3 : 1.0
  p.fill(cr - 30, cg - 30, cb - 20, 180)
  p.ellipse(19, -2, 2.5 * nostrilScale, 2.5 * nostrilScale)
  p.ellipse(19, 2, 2.5 * nostrilScale, 2.5 * nostrilScale)

  const eyeRgb = hexToRgb(config.color.eye)
  const blinkPhase = Math.sin(breathPhase * 0.3)
  const eyeHeight = blinkPhase > 0.95 ? 1 : 4

  let pupilWidth = 1.5
  let pupilHeight = 3
  if (state === BS.FLEEING) { pupilWidth = 1; pupilHeight = 4 }
  if (state === BS.CURIOUS) { pupilWidth = 2; pupilHeight = 2.5 }
  if (state === BS.SLEEPING) { pupilWidth = 3; pupilHeight = 0.5 }

  let eyeOffsetX = 0
  let eyeOffsetY = 0
  if (lookAt) {
    const toLook = Math.atan2(lookAt.y - head.pos.y, lookAt.x - head.pos.x)
    const relAngle = toLook - headAngle
    eyeOffsetX = Math.cos(relAngle) * 1.2
    eyeOffsetY = Math.sin(relAngle) * 0.8
  }

  p.fill(0, 0, 0, 50)
  p.ellipse(8, -5.5, 7, 6)
  p.ellipse(8, 5.5, 7, 6)

  p.fill(240, 240, 230, 230)
  p.ellipse(8, -5.5, 6, eyeHeight + 1)
  p.ellipse(8, 5.5, 6, eyeHeight + 1)

  p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, 250)
  p.ellipse(8 + eyeOffsetX, -5.5 + eyeOffsetY, 3.5, Math.min(eyeHeight, 3.5))
  p.ellipse(8 + eyeOffsetX, 5.5 - eyeOffsetY, 3.5, Math.min(eyeHeight, 3.5))

  p.fill(10, 10, 10, 240)
  p.ellipse(8 + eyeOffsetX, -5.5 + eyeOffsetY, pupilWidth, pupilHeight)
  p.ellipse(8 + eyeOffsetX, 5.5 - eyeOffsetY, pupilWidth, pupilHeight)

  p.fill(255, 255, 255, 180)
  p.ellipse(9, -6.5, 1.5, 1.5)
  p.ellipse(9, 4.5, 1.5, 1.5)

  if (state === BS.CURIOUS) {
    p.stroke(cr + 40, cg + 40, cb + 20, 150)
    p.strokeWeight(1.5)
    p.noFill()
    p.arc(8, -7, 8, 4, p.PI + 0.3, p.TWO_PI - 0.3)
    p.arc(8, 7, 8, 4, 0.3, p.PI - 0.3)
  } else if (state === BS.FLEEING) {
    p.fill(cr - 40, cg - 40, cb - 30, 120)
    p.noStroke()
    p.ellipse(20, -3, 4, 4)
    p.ellipse(20, 3, 4, 4)
  } else if (state === BS.SLEEPING) {
    p.stroke(cr - 20, cg - 20, cb - 20, 120)
    p.strokeWeight(1.5)
    p.noFill()
    p.line(5, -5.5, 11, -5.5)
    p.line(5, 5.5, 11, 5.5)
  } else if (state === BS.PLAYING) {
    p.fill(cr + 30, cg + 30, cb + 20, 160)
    p.noStroke()
    p.arc(16, 0, 8, 6, 0, p.PI)
  }

  if (state === BS.EATING) {
    const tongueLen = 5 + Math.sin(breathPhase * 3) * 2
    p.stroke(200, 80, 80, 180)
    p.strokeWeight(2)
    p.line(20, 0, 20 + tongueLen, 1)
    p.noStroke()
    p.fill(200, 80, 80, 160)
    p.ellipse(20 + tongueLen, 1, 3, 2)
  }

  p.pop()
}

function drawTailTip(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  time: number
): void {
  const tail = spine[spine.length - 1]
  const prev = spine[spine.length - 2]
  const tailRgb = hexToRgb(config.color.tail)
  const tailWag = Math.sin(time * 3) * 0.2

  p.noFill()
  p.stroke(tailRgb.r, tailRgb.g, tailRgb.b, 180)
  p.strokeWeight(2)
  p.bezier(
    prev.pos.x, prev.pos.y,
    tail.pos.x, tail.pos.y,
    tail.pos.x + Math.cos(tail.angle + tailWag) * 10, tail.pos.y + Math.sin(tail.angle + tailWag) * 10,
    tail.pos.x + Math.cos(tail.angle + 0.3 + tailWag) * 15, tail.pos.y + Math.sin(tail.angle + 0.3 + tailWag) * 15
  )
}

export function drawParticles(p: p5, particles: Particle[]): void {
  p.noStroke()
  const time = Date.now() / 1000

  for (const particle of particles) {
    const rgb = hexToRgb(particle.color)

    switch (particle.type) {
      case 'footprint' as any: {
        p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 60)
        p.ellipse(particle.pos.x, particle.pos.y, particle.size, particle.size * 0.5)
        break
      }
      case 'firefly' as any: {
        const pulse = Math.sin(time * 2 + particle.pos.x) * 0.3 + 0.7
        p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 180 * pulse)
        p.ellipse(particle.pos.x, particle.pos.y, particle.size, particle.size)
        p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 60 * pulse)
        p.ellipse(particle.pos.x, particle.pos.y, particle.size * 3, particle.size * 3)
        break
      }
      case 'petting' as any: {
        p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 200)
        const starSize = particle.size * (1 + Math.sin(time * 8 + particle.pos.x) * 0.3)
        p.push()
        p.translate(particle.pos.x, particle.pos.y)
        p.rotate(time * 2)
        p.beginShape()
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2
          p.vertex(Math.cos(a) * starSize, Math.sin(a) * starSize)
          const inner = a + Math.PI / 5
          p.vertex(Math.cos(inner) * starSize * 0.4, Math.sin(inner) * starSize * 0.4)
        }
        p.endShape(p.CLOSE)
        p.pop()
        break
      }
      default: {
        p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 150)
        p.ellipse(particle.pos.x, particle.pos.y, particle.size, particle.size)
        break
      }
    }
  }
}

export function drawFoodItems(p: p5, foods: FoodItem[]): void {
  for (const food of foods) {
    const alpha = food.remaining * 200
    const pulse = 1 + Math.sin(Date.now() / 1000 * 3) * 0.1
    const foodColor = hexToRgb(
      food.foodType === FoodType.BERRY ? '#4ade80' :
      food.foodType === FoodType.MUSHROOM ? '#a78bfa' :
      '#fb923c'
    )
    p.noStroke()

    p.fill(foodColor.r, foodColor.g, foodColor.b, alpha * 0.2)
    p.ellipse(food.pos.x, food.pos.y, 20 * pulse, 20 * pulse)

    if (food.foodType === FoodType.BERRY) {
      p.fill(foodColor.r, foodColor.g, foodColor.b, alpha)
      p.ellipse(food.pos.x, food.pos.y, 8 * pulse, 8 * pulse)
      p.fill(foodColor.r + 40, foodColor.g + 40, foodColor.b + 20, alpha * 0.6)
      p.ellipse(food.pos.x - 1, food.pos.y - 1, 3, 3)
    } else if (food.foodType === FoodType.MUSHROOM) {
      p.fill(foodColor.r, foodColor.g, foodColor.b, alpha)
      p.arc(food.pos.x, food.pos.y, 10 * pulse, 10 * pulse, p.PI, p.TWO_PI)
      p.fill(foodColor.r - 30, foodColor.g - 30, foodColor.b - 20, alpha * 0.8)
      p.rect(food.pos.x - 2, food.pos.y, 4, 6)
    } else {
      p.fill(foodColor.r, foodColor.g, foodColor.b, alpha)
      p.ellipse(food.pos.x, food.pos.y, 6 * pulse, 4 * pulse)
      p.stroke(foodColor.r - 20, foodColor.g - 20, foodColor.b - 20, alpha * 0.5)
      p.strokeWeight(1)
      p.line(food.pos.x - 3, food.pos.y, food.pos.x + 3, food.pos.y)
    }
  }
}

export function drawObstacles(p: p5, obstacles: Obstacle[]): void {
  for (const obs of obstacles) {
    p.fill(60, 60, 70, 150)
    p.stroke(80, 80, 90, 100)
    p.strokeWeight(1)
    p.ellipse(obs.pos.x, obs.pos.y, obs.radius * 2, obs.radius * 2)
    p.noStroke()
    p.fill(50, 50, 60, 100)
    p.ellipse(obs.pos.x, obs.pos.y, obs.radius * 1.4, obs.radius * 1.4)
  }
}

export function drawEnvStimuli(p: p5, stimuli: EnvironmentStimulus[]): void {
  const time = Date.now() / 1000
  for (const s of stimuli) {
    const lifeRatio = s.life / s.maxLife
    const pulse = 1 + Math.sin(time * 2) * 0.1

    if (s.type === 'toy') {
      const spin = time * 3
      p.noStroke()
      p.fill(255, 220, 80, 120 * lifeRatio)
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI / 2)
        const px = s.pos.x + Math.cos(a) * 15 * pulse
        const py = s.pos.y + Math.sin(a) * 15 * pulse
        p.ellipse(px, py, 5, 5)
      }
      p.fill(255, 255, 200, 180 * lifeRatio)
      p.ellipse(s.pos.x, s.pos.y, 6, 6)
    } else if (s.type === 'danger_zone') {
      p.noFill()
      p.stroke(255, 60, 60, 80 * lifeRatio * pulse)
      p.strokeWeight(2)
      p.ellipse(s.pos.x, s.pos.y, s.radius * 2 * pulse, s.radius * 2 * pulse)
      p.fill(255, 40, 40, 20 * lifeRatio * pulse)
      p.noStroke()
      p.ellipse(s.pos.x, s.pos.y, s.radius * 1.5 * pulse, s.radius * 1.5 * pulse)
    } else if (s.type === 'comfort_zone') {
      p.noFill()
      p.stroke(255, 200, 100, 50 * lifeRatio)
      p.strokeWeight(1.5)
      p.ellipse(s.pos.x, s.pos.y, s.radius * 2 * pulse, s.radius * 2 * pulse)
      p.fill(255, 200, 100, 15 * lifeRatio)
      p.noStroke()
      p.ellipse(s.pos.x, s.pos.y, s.radius * 1.5, s.radius * 1.5)
    }
  }
}

export function drawEmotionBubbles(p: p5, bubbles: EmotionBubble[]): void {
  for (const bubble of bubbles) {
    const alpha = (bubble.life / bubble.maxLife) * 220
    const y = bubble.pos.y
    p.textSize(16)
    p.textAlign(p.CENTER, p.CENTER)
    p.fill(255, 255, 255, alpha)

    switch (bubble.type) {
      case 'heart': p.text('\u2764', bubble.pos.x, y); break
      case 'question': p.text('?', bubble.pos.x, y); break
      case 'sweat': p.text('\uD83D\uDCA6', bubble.pos.x, y); break
      case 'zzz': p.text('z', bubble.pos.x, y); break
      case 'happy': p.text('\u2726', bubble.pos.x, y); break
      case 'hunger': p.text('\uD83C\uDF56', bubble.pos.x, y); break
      case 'play': p.text('\u266B', bubble.pos.x, y); break
      case 'social': p.text('\u2665', bubble.pos.x, y); break
    }
  }
}

export function drawBackground(p: p5, time: number, circadian: CircadianState): void {
  const daylight = circadian.daylight
  const bgR = lerp(8, 20, daylight)
  const bgG = lerp(10, 25, daylight)
  const bgB = lerp(18, 30, daylight)
  p.background(bgR, bgG, bgB)

  const groundY = p.height * 0.75
  for (let y = groundY; y < p.height; y += 2) {
    const t = (y - groundY) / (p.height - groundY)
    p.stroke(
      lerp(bgR, bgR + 15, t),
      lerp(bgG, bgG + 20, t),
      lerp(bgB, bgB + 10, t),
      80
    )
    p.line(0, y, p.width, y)
  }

  p.stroke(40, 50, 60, 20 * daylight)
  p.strokeWeight(0.5)
  const gridSize = 40
  const offsetX = (time * 5) % gridSize
  const offsetY = (time * 3) % gridSize
  for (let x = -gridSize + offsetX; x < p.width + gridSize; x += gridSize) {
    p.line(x, 0, x, p.height)
  }
  for (let y = -gridSize + offsetY; y < p.height + gridSize; y += gridSize) {
    p.line(0, y, p.width, y)
  }

  p.noStroke()
  const starAlpha = clamp((1 - daylight) * 2, 0, 1)
  if (starAlpha > 0.1) {
    for (let i = 0; i < 40; i++) {
      const px = (Math.sin(i * 127.1 + time * 0.05) * 0.5 + 0.5) * p.width
      const py = (Math.cos(i * 269.5 + time * 0.03) * 0.5 + 0.5) * p.height * 0.7
      const brightness = (Math.sin(time * 1.5 + i * 0.7) * 30 + 50) * starAlpha
      const size = 1 + Math.sin(i * 43.7) * 0.5
      p.fill(180, 200, 240, brightness)
      p.ellipse(px, py, size, size)
    }
  }

  if (daylight < 0.5) {
    const fireflyAlpha = (1 - daylight * 2) * 150
    for (let i = 0; i < 12; i++) {
      const fx = (Math.sin(i * 73.2 + time * 0.3) * 0.5 + 0.5) * p.width
      const fy = (Math.cos(i * 191.3 + time * 0.2) * 0.5 + 0.5) * p.height
      const pulse = Math.sin(time * 2 + i * 1.7) * 0.5 + 0.5
      p.fill(200, 255, 100, fireflyAlpha * pulse)
      p.ellipse(fx, fy, 3, 3)
      p.fill(200, 255, 100, fireflyAlpha * pulse * 0.3)
      p.ellipse(fx, fy, 10, 10)
    }
  }
}

export function drawMouseIndicator(p: p5, mousePos: Vec2 | null, mouseDown: boolean): void {
  if (!mousePos) return

  p.push()
  p.noFill()

  if (mouseDown) {
    p.stroke(255, 100, 100, 150)
    p.strokeWeight(2)
    const pulseSize = 30 + Math.sin(Date.now() * 0.01) * 10
    p.ellipse(mousePos.x, mousePos.y, pulseSize, pulseSize)
    p.ellipse(mousePos.x, mousePos.y, pulseSize * 0.6, pulseSize * 0.6)
  } else {
    p.stroke(100, 220, 180, 120)
    p.strokeWeight(1.5)
    const pulseSize = 20 + Math.sin(Date.now() * 0.008) * 8
    p.ellipse(mousePos.x, mousePos.y, pulseSize, pulseSize)

    p.stroke(100, 220, 180, 80)
    p.strokeWeight(1)
    p.line(mousePos.x - 12, mousePos.y, mousePos.x - 6, mousePos.y)
    p.line(mousePos.x + 6, mousePos.y, mousePos.x + 12, mousePos.y)
    p.line(mousePos.x, mousePos.y - 12, mousePos.x, mousePos.y - 6)
    p.line(mousePos.x, mousePos.y + 6, mousePos.x, mousePos.y + 12)
  }

  p.pop()
}

export function drawDebugInfo(
  p: p5,
  state: CreatureState,
  fps: number
): void {
  p.push()
  p.fill(255, 255, 255, 180)
  p.noStroke()
  p.textSize(11)
  p.textFont('monospace')
  const lines = [
    `FPS: ${Math.round(fps)}`,
    `状态: ${state.behaviorState}`,
    `步态: ${state.gaitMode}`,
    `姿态: ${state.spinePose}`,
    `位置: (${Math.round(state.spine[0].pos.x)}, ${Math.round(state.spine[0].pos.y)})`,
    `速度: ${length(state.velocity).toFixed(2)}`,
    `饥饿: ${state.needs.hunger.toFixed(2)}`,
    `精力: ${state.needs.energy.toFixed(2)}`,
    `好奇: ${state.needs.curiosity.toFixed(2)}`,
    `社交: ${state.needs.social.toFixed(2)}`,
    `心情: ${state.needs.mood.toFixed(2)}`,
    `昼夜: ${state.circadian.timeOfDay} (${state.circadian.daylight.toFixed(2)})`,
    `个性: B${state.personality.boldness.toFixed(1)} A${state.personality.activity.toFixed(1)} S${state.personality.sociability.toFixed(1)} C${state.personality.curiosity.toFixed(1)}`,
    `食物: ${state.foodItems.length} | 障碍: ${state.obstacles.length} | 环境: ${state.envStimuli.length}`,
    `时间: ${state.accumulatedTime.toFixed(0)}s`,
  ]
  for (let i = 0; i < lines.length; i++) {
    p.text(lines[i], 10, 18 + i * 16)
  }
  p.pop()
}
