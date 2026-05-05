import type p5 from 'p5'
import type { CreatureSnapshot, ParticleData, BehaviorState, SpineSegment } from '../engine/types'
import type { Vec2 } from '../engine/vec2'
import { sub, add, scale, normalize, perpendicular, fromAngle, rotate } from '../engine/vec2'

const BASE_HUE = 170
const SATURATION = 70
const BRIGHTNESS = 60

function getStateHueShift(state: BehaviorState): number {
  switch (state) {
    case 'startle': return 60
    case 'hunt': return 30
    case 'curious': return 20
    case 'play': return 40
    case 'rest': return -20
    case 'sleep': return -30
    case 'eat': return 25
    default: return 0
  }
}

function getEmotionGlowIntensity(fear: number, curiosity: number, satisfaction: number, happiness: number): number {
  return 0.5 + fear * 0.8 + curiosity * 0.3 + satisfaction * 0.2 + happiness * 0.3
}

function getSegmentNormal(spine: SpineSegment[], i: number): Vec2 {
  const dir = i < spine.length - 1
    ? sub(spine[i + 1].pos, spine[i].pos)
    : sub(spine[i].pos, spine[i - 1].pos)
  return normalize(perpendicular(dir))
}

export function renderCreature(p: p5, snapshot: CreatureSnapshot): void {
  renderBodyGlow(p, snapshot)
  renderDorsalFin(p, snapshot)
  renderBody(p, snapshot)
  renderScalePattern(p, snapshot)
  renderLimbs(p, snapshot)
  renderSpineDetails(p, snapshot)
  renderTentacles(p, snapshot)
  renderHead(p, snapshot)
  renderEyes(p, snapshot)
  renderGills(p, snapshot)
  if (snapshot.behavior.state === 'sleep') renderSleepEffect(p, snapshot)
}

export function renderEnvironment(p: p5, snapshot: CreatureSnapshot): void {
  for (const obj of snapshot.environment) {
    switch (obj.type) {
      case 'rock':
        renderRock(p, obj)
        break
      case 'seaweed':
        renderSeaweed(p, obj, snapshot.time)
        break
      case 'coral':
        renderCoral(p, obj)
        break
      case 'vent':
        renderVent(p, obj, snapshot.time)
        break
    }
  }
}

function renderRock(p: p5, obj: { pos: Vec2; size: number; hue: number }): void {
  p.noStroke()
  p.fill(obj.hue, 15, 20, 80)
  p.ellipse(obj.pos.x, obj.pos.y, obj.size * 1.2, obj.size * 0.8)
  p.fill(obj.hue, 10, 25, 50)
  p.ellipse(obj.pos.x - obj.size * 0.1, obj.pos.y - obj.size * 0.05, obj.size * 0.8, obj.size * 0.5)
}

function renderSeaweed(p: p5, obj: { pos: Vec2; size: number; hue: number; phase: number }, time: number): void {
  p.noFill()
  p.stroke(obj.hue, 50, 40, 100)
  p.strokeWeight(2)
  const segments = 5
  const segHeight = obj.size / segments
  let prevX = obj.pos.x
  let prevY = obj.pos.y
  for (let i = 1; i <= segments; i++) {
    const wave = Math.sin(time * 0.03 + obj.phase + i * 0.5) * (5 + i * 2)
    const x = obj.pos.x + wave
    const y = obj.pos.y - i * segHeight
    p.line(prevX, prevY, x, y)
    prevX = x
    prevY = y
  }
  p.noStroke()
  p.fill(obj.hue, 60, 50, 60)
  p.ellipse(prevX, prevY, 4, 8)
}

function renderCoral(p: p5, obj: { pos: Vec2; size: number; hue: number }): void {
  p.noStroke()
  const branches = 4
  for (let i = 0; i < branches; i++) {
    const angle = -Math.PI / 2 + (i - (branches - 1) / 2) * 0.4
    const len = obj.size * (0.6 + Math.random() * 0.4)
    const tipX = obj.pos.x + Math.cos(angle) * len
    const tipY = obj.pos.y + Math.sin(angle) * len
    p.stroke(obj.hue, 50, 50, 80)
    p.strokeWeight(3)
    p.line(obj.pos.x, obj.pos.y, tipX, tipY)
    p.noStroke()
    p.fill(obj.hue, 60, 60, 100)
    p.ellipse(tipX, tipY, 5, 5)
  }
}

function renderVent(p: p5, obj: { pos: Vec2; size: number; hue: number; phase: number }, time: number): void {
  p.noStroke()
  p.fill(obj.hue, 40, 30, 60)
  p.ellipse(obj.pos.x, obj.pos.y, obj.size, obj.size * 0.5)
  const glowPulse = Math.sin(time * 0.05 + obj.phase) * 0.5 + 0.5
  p.fill(obj.hue, 60, 60, 20 * glowPulse)
  p.ellipse(obj.pos.x, obj.pos.y - obj.size * 0.3, obj.size * 0.6, obj.size * 0.8)
}

export function renderFoods(p: p5, snapshot: CreatureSnapshot): void {
  const { foods, time } = snapshot

  for (const food of foods) {
    if (food.eaten) continue
    const lifeRatio = food.life / food.maxLife
    const bob = Math.sin(food.bobPhase) * 2
    const fx = food.pos.x
    const fy = food.pos.y + bob
    const pulse = Math.sin(time * 0.08 + food.pos.x * 0.01) * 0.3 + 0.7

    p.noStroke()

    p.fill(food.hue, 40, 70, 15 * pulse * lifeRatio)
    p.ellipse(fx, fy, food.size * 6, food.size * 6)

    p.fill(food.hue, 70, 80, 150 * lifeRatio * pulse)
    p.ellipse(fx, fy, food.size * 1.5, food.size * 1.5)

    p.fill(food.hue, 90, 95, 220 * lifeRatio * pulse)
    p.ellipse(fx, fy, food.size, food.size)

    p.fill(food.hue + 20, 50, 100, 120 * lifeRatio)
    p.ellipse(fx, fy, food.size * 0.4, food.size * 0.4)

    if (food.category === 'favorite') {
      const starPulse = Math.sin(time * 0.12 + food.spawnTime * 0.01) * 0.5 + 0.5
      p.fill(45, 90, 100, 80 * starPulse * lifeRatio)
      p.ellipse(fx, fy, food.size * 3, food.size * 3)
    } else if (food.category === 'dislike') {
      const warnPulse = Math.sin(time * 0.06) * 0.5 + 0.5
      p.fill(280, 60, 60, 40 * warnPulse * lifeRatio)
      p.ellipse(fx, fy, food.size * 2.5, food.size * 2.5)
    }
  }
}

function renderBodyGlow(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time, behavior } = snapshot
  const glowIntensity = getEmotionGlowIntensity(behavior.emotion.fear, behavior.emotion.curiosity, behavior.emotion.satisfaction, behavior.emotion.happiness)
  const stateHueShift = getStateHueShift(behavior.state)
  const isSleeping = behavior.state === 'sleep'
  const sleepDim = isSleeping ? 0.4 : 1

  p.noStroke()
  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const glowSize = seg.width * (3 + glowIntensity * 1.5) * sleepDim
    const pulse = Math.sin(time * (isSleeping ? 0.02 : 0.05) + i * 0.3) * 0.3 + 0.7
    const alpha = (15 + glowIntensity * 12) * pulse * sleepDim
    p.fill(BASE_HUE + stateHueShift, SATURATION * 0.5, BRIGHTNESS + 20, alpha)
    p.ellipse(seg.pos.x, seg.pos.y, glowSize, glowSize)
  }
}

function renderBody(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  const leftPoints: Vec2[] = []
  const rightPoints: Vec2[] = []

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const norm = getSegmentNormal(spine, i)
    const w = seg.width
    leftPoints.push(add(seg.pos, scale(norm, w)))
    rightPoints.push(add(seg.pos, scale(norm, -w)))
  }

  p.noStroke()
  p.fill(BASE_HUE + stateHueShift, SATURATION, BRIGHTNESS, 200)
  p.beginShape()
  for (const pt of leftPoints) p.vertex(pt.x, pt.y)
  for (let i = rightPoints.length - 1; i >= 0; i--) p.vertex(rightPoints[i].x, rightPoints[i].y)
  p.endShape(p.CLOSE)

  p.fill(BASE_HUE + stateHueShift, SATURATION * 0.6, BRIGHTNESS + 15, 120)
  p.beginShape()
  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const innerW = seg.width * 0.5
    const norm = getSegmentNormal(spine, i)
    p.vertex(add(seg.pos, scale(norm, innerW)).x, add(seg.pos, scale(norm, innerW)).y)
  }
  for (let i = spine.length - 1; i >= 0; i--) {
    const seg = spine[i]
    const innerW = seg.width * 0.5
    const norm = getSegmentNormal(spine, i)
    p.vertex(add(seg.pos, scale(norm, -innerW)).x, add(seg.pos, scale(norm, -innerW)).y)
  }
  p.endShape(p.CLOSE)

  p.fill(BASE_HUE + stateHueShift, SATURATION * 0.3, BRIGHTNESS + 30, 60)
  p.beginShape()
  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const coreW = seg.width * 0.2
    const norm = getSegmentNormal(spine, i)
    p.vertex(add(seg.pos, scale(norm, coreW)).x, add(seg.pos, scale(norm, coreW)).y)
  }
  for (let i = spine.length - 1; i >= 0; i--) {
    const seg = spine[i]
    const coreW = seg.width * 0.2
    const norm = getSegmentNormal(spine, i)
    p.vertex(add(seg.pos, scale(norm, -coreW)).x, add(seg.pos, scale(norm, -coreW)).y)
  }
  p.endShape(p.CLOSE)
}

function renderScalePattern(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  p.noStroke()
  for (let i = 1; i < spine.length - 1; i += 2) {
    const seg = spine[i]
    const norm = getSegmentNormal(spine, i)
    const dir = sub(spine[Math.min(i + 1, spine.length - 1)].pos, spine[Math.max(i - 1, 0)].pos)

    for (const side of [-1, 1]) {
      const scaleOffset = seg.width * 0.55 * side
      const scalePos = add(seg.pos, scale(norm, scaleOffset))
      const scaleSize = seg.width * 0.25
      const scaleAngle = Math.atan2(dir.y, dir.x)

      p.push()
      p.translate(scalePos.x, scalePos.y)
      p.rotate(scaleAngle)
      p.fill(BASE_HUE + stateHueShift - 10, SATURATION * 0.8, BRIGHTNESS - 10, 50 + Math.sin(time * 0.04 + i * 0.6) * 20)
      p.ellipse(0, 0, scaleSize * 1.2, scaleSize * 0.8)
      p.pop()
    }
  }
}

function renderDorsalFin(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  const finStart = 2
  const finEnd = 14

  for (const side of [-1, 1]) {
    p.noFill()
    p.stroke(BASE_HUE + stateHueShift + 15, SATURATION * 0.6, BRIGHTNESS + 15, 100)
    p.strokeWeight(1.5)

    const points: Vec2[] = []
    for (let i = finStart; i <= finEnd; i++) {
      const seg = spine[i]
      const norm = getSegmentNormal(spine, i)
      const t = (i - finStart) / (finEnd - finStart)
      const finHeight = Math.sin(t * Math.PI) * seg.width * 0.6
      const wave = Math.sin(time * 0.08 + i * 0.4) * 3
      const finPos = add(seg.pos, scale(norm, side * (seg.width + finHeight + wave)))
      points.push(finPos)
    }

    if (points.length > 1) {
      p.beginShape()
      const startNorm = getSegmentNormal(spine, finStart)
      const endNorm = getSegmentNormal(spine, finEnd)
      p.vertex(spine[finStart].pos.x + startNorm.x * side * spine[finStart].width, spine[finStart].pos.y + startNorm.y * side * spine[finStart].width)
      for (const pt of points) p.vertex(pt.x, pt.y)
      p.vertex(spine[finEnd].pos.x + endNorm.x * side * spine[finEnd].width, spine[finEnd].pos.y + endNorm.y * side * spine[finEnd].width)
      p.endShape()
    }
  }
}

function renderSpineDetails(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time } = snapshot
  p.noStroke()
  for (let i = 2; i < spine.length - 2; i += 2) {
    const seg = spine[i]
    const pulse = Math.sin(time * 0.08 + i * 0.5) * 0.5 + 0.5
    const spotSize = seg.width * 0.4 * (0.6 + pulse * 0.4)
    const hue = BASE_HUE + Math.sin(time * 0.02 + i * 0.3) * 40
    p.fill(hue, 90, 90, 100 + pulse * 100)
    p.ellipse(seg.pos.x, seg.pos.y, spotSize, spotSize)
  }

  for (let i = 1; i < spine.length - 1; i++) {
    const seg = spine[i]
    const dir = sub(spine[i + 1].pos, spine[i - 1].pos)
    const stripeW = seg.width * 0.9

    p.push()
    p.translate(seg.pos.x, seg.pos.y)
    p.rotate(Math.atan2(dir.y, dir.x))
    p.fill(BASE_HUE - 20, SATURATION * 0.3, BRIGHTNESS * 0.5, 40)
    p.noStroke()
    p.ellipse(0, 0, 2, stripeW)
    p.pop()
  }
}

function renderLimbs(p: p5, snapshot: CreatureSnapshot): void {
  const { limbs, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  for (const limb of limbs) {
    const limbHue = BASE_HUE + stateHueShift - 10

    p.stroke(limbHue, SATURATION * 0.7, BRIGHTNESS + 10, 180)
    p.strokeWeight(4)
    p.noFill()
    p.line(limb.hip.x, limb.hip.y, limb.knee.x, limb.knee.y)
    p.line(limb.knee.x, limb.knee.y, limb.foot.x, limb.foot.y)

    p.noStroke()
    p.fill(limbHue, SATURATION * 0.5, BRIGHTNESS, 100)
    p.ellipse(limb.hip.x, limb.hip.y, 6, 6)
    p.ellipse(limb.knee.x, limb.knee.y, 5, 5)

    const footPulse = Math.sin(time * 0.1) * 0.3 + 0.7
    p.fill(limbHue + 30, 80, 80, 120 * footPulse)
    p.ellipse(limb.foot.x, limb.foot.y, 7, 5)

    if (!limb.isPlanted) {
      p.fill(limbHue + 40, 60, 90, 30)
      p.ellipse(limb.foot.x, limb.foot.y, 12, 12)
    }
  }
}

function renderTentacles(p: p5, snapshot: CreatureSnapshot): void {
  const { tentacles, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  for (const tentacle of tentacles) {
    p.noFill()
    p.stroke(BASE_HUE + stateHueShift + 10, SATURATION * 0.5, BRIGHTNESS + 20, 150)
    p.strokeWeight(2)

    p.beginShape()
    p.vertex(tentacle.basePos.x, tentacle.basePos.y)
    for (const cp of tentacle.controlPoints) {
      p.vertex(cp.x, cp.y)
    }
    const last = tentacle.controlPoints[tentacle.controlPoints.length - 1]
    p.vertex(last.x, last.y)
    p.endShape()

    p.noStroke()
    const tipPulse = Math.sin(time * 0.12) * 0.5 + 0.5
    p.fill(BASE_HUE + stateHueShift + 30, 80, 90, 120 * tipPulse)
    p.ellipse(tentacle.tipPos.x, tentacle.tipPos.y, 4, 4)
    p.fill(BASE_HUE + stateHueShift + 30, 60, 95, 40 * tipPulse)
    p.ellipse(tentacle.tipPos.x, tentacle.tipPos.y, 10, 10)
  }
}

function renderHead(p: p5, snapshot: CreatureSnapshot): void {
  const { headPos, headAngle, spine, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)

  const headWidth = spine[0].width * 1.3
  const headLength = 20

  p.push()
  p.translate(headPos.x, headPos.y)
  p.rotate(headAngle)

  p.noStroke()
  p.fill(BASE_HUE + stateHueShift, SATURATION, BRIGHTNESS + 5, 220)
  p.ellipse(headLength * 0.3, 0, headLength, headWidth)

  p.fill(BASE_HUE + stateHueShift, SATURATION * 0.4, BRIGHTNESS + 20, 150)
  p.ellipse(headLength * 0.2, 0, headLength * 0.6, headWidth * 0.6)

  p.fill(BASE_HUE + stateHueShift, SATURATION * 0.2, BRIGHTNESS + 30, 80)
  p.ellipse(headLength * 0.15, 0, headLength * 0.3, headWidth * 0.3)

  p.pop()
}

function renderEyes(p: p5, snapshot: CreatureSnapshot): void {
  const { headPos, headAngle, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)
  const glowIntensity = getEmotionGlowIntensity(behavior.emotion.fear, behavior.emotion.curiosity, behavior.emotion.satisfaction, behavior.emotion.happiness)

  const eyeOffset = 10
  const eyeSpread = 7
  const isSleeping = behavior.state === 'sleep'
  const eyeSize = isSleeping ? 3 : behavior.state === 'startle' ? 6 : 5

  for (const side of [-1, 1]) {
    const eyePos = add(
      headPos,
      add(
        scale(fromAngle(headAngle), eyeOffset),
        scale(rotate(fromAngle(headAngle), Math.PI / 2), side * eyeSpread),
      ),
    )

    p.noStroke()

    if (isSleeping) {
      p.stroke(BASE_HUE + stateHueShift + 40, 30, 70, 150)
      p.strokeWeight(1.5)
      p.noFill()
      p.line(eyePos.x - 3, eyePos.y, eyePos.x + 3, eyePos.y)
      continue
    }

    p.fill(BASE_HUE + stateHueShift + 40, 30, 95, 230)
    p.ellipse(eyePos.x, eyePos.y, eyeSize, eyeSize)

    const pupilSize = behavior.state === 'startle' ? eyeSize * 0.3 : eyeSize * 0.5
    const pupilOffset = scale(fromAngle(headAngle), 1.2)
    const pupilPos = add(eyePos, pupilOffset)
    p.fill(0, 0, 10, 250)
    p.ellipse(pupilPos.x, pupilPos.y, pupilSize, pupilSize)

    const glowPulse = Math.sin(time * 0.1) * 0.3 + 0.7
    p.fill(BASE_HUE + stateHueShift + 60, 80, 100, 60 * glowPulse * glowIntensity)
    p.ellipse(eyePos.x, eyePos.y, eyeSize * 2.5, eyeSize * 2.5)

    if (behavior.state === 'curious' || behavior.state === 'hunt') {
      p.fill(BASE_HUE + stateHueShift + 80, 90, 100, 30 * glowPulse)
      p.ellipse(eyePos.x, eyePos.y, eyeSize * 3.5, eyeSize * 3.5)
    }

    if (behavior.emotion.happiness > 0.7) {
      p.fill(45, 80, 100, 20 * glowPulse * behavior.emotion.happiness)
      p.ellipse(eyePos.x, eyePos.y, eyeSize * 4, eyeSize * 4)
    }
  }
}

function renderGills(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time, behavior } = snapshot
  const stateHueShift = getStateHueShift(behavior.state)
  const isSleeping = behavior.state === 'sleep'

  const gillBaseIndex = 2
  const gillCount = 3

  for (let g = 0; g < gillCount; g++) {
    const seg = spine[gillBaseIndex + g]
    if (!seg) continue
    const norm = getSegmentNormal(spine, gillBaseIndex + g)
    const waveFreq = isSleeping ? 0.03 : 0.06
    const wave = Math.sin(time * waveFreq + g * 1.5) * (isSleeping ? 0.1 : 0.3)

    for (const side of [-1, 1]) {
      const gillRoot = add(seg.pos, scale(norm, side * seg.width * 0.7))
      const gillTip = add(
        gillRoot,
        add(
          scale(norm, side * (8 + wave * 4)),
          scale(normalize(sub(spine[Math.min(gillBaseIndex + g + 1, spine.length - 1)].pos, seg.pos)), -3 + wave * 2),
        ),
      )

      p.stroke(BASE_HUE + stateHueShift + 20, 60, 80, isSleeping ? 60 : 120)
      p.strokeWeight(1.5)
      p.noFill()
      p.bezier(
        gillRoot.x, gillRoot.y,
        gillRoot.x + (gillTip.x - gillRoot.x) * 0.3, gillRoot.y + (gillTip.y - gillRoot.y) * 0.8,
        gillRoot.x + (gillTip.x - gillRoot.x) * 0.7, gillRoot.y + (gillTip.y - gillRoot.y) * 1.2,
        gillTip.x, gillTip.y,
      )
    }
  }
}

function renderSleepEffect(p: p5, snapshot: CreatureSnapshot): void {
  const { headPos, headAngle, time } = snapshot

  for (let i = 0; i < 3; i++) {
    const phase = time * 0.03 + i * 2
    const t = (phase % 3) / 3
    const alpha = t < 0.5 ? t * 2 : 2 - t * 2
    const offsetX = Math.sin(phase * 0.7) * 15
    const offsetY = -20 - t * 30
    const bubbleX = headPos.x + Math.cos(headAngle) * 5 + offsetX
    const bubbleY = headPos.y + Math.sin(headAngle) * 5 + offsetY

    p.noStroke()
    p.fill(200, 30, 80, alpha * 80)
    p.ellipse(bubbleX, bubbleY, 6, 6)
    p.fill(200, 20, 95, alpha * 40)
    p.ellipse(bubbleX - 1, bubbleY - 1, 2, 2)
  }

  p.fill(200, 20, 70, 30 + Math.sin(time * 0.02) * 15)
  p.ellipse(headPos.x, headPos.y, 60, 60)
}

export function renderParticles(p: p5, particles: ParticleData[]): void {
  p.noStroke()
  for (const particle of particles) {
    const lifeRatio = particle.life / particle.maxLife
    const alpha = lifeRatio * 150
    const size = particle.size * (0.5 + lifeRatio * 0.5)

    switch (particle.type) {
      case 'bubble':
        p.noFill()
        p.stroke(particle.hue, 30, 80, alpha * 0.5)
        p.strokeWeight(0.5)
        p.ellipse(particle.pos.x, particle.pos.y, size * 2, size * 2)
        p.noStroke()
        p.fill(particle.hue, 20, 95, alpha * 0.3)
        p.ellipse(particle.pos.x - size * 0.3, particle.pos.y - size * 0.3, size * 0.4, size * 0.4)
        break
      case 'eat':
        p.fill(particle.hue, 90, 95, alpha * 1.5)
        p.ellipse(particle.pos.x, particle.pos.y, size * 1.5, size * 1.5)
        p.fill(particle.hue, 60, 100, alpha * 0.5)
        p.ellipse(particle.pos.x, particle.pos.y, size * 3, size * 3)
        break
      case 'startle':
        p.fill(particle.hue, 90, 90, alpha)
        p.ellipse(particle.pos.x, particle.pos.y, size * 1.2, size * 1.2)
        break
      case 'glow':
        p.fill(particle.hue, 60, 90, alpha * 0.6)
        p.ellipse(particle.pos.x, particle.pos.y, size * 2, size * 2)
        break
      case 'happy':
        p.fill(particle.hue, 80, 95, alpha * 1.2)
        p.ellipse(particle.pos.x, particle.pos.y, size * 1.8, size * 1.8)
        p.fill(particle.hue, 50, 100, alpha * 0.4)
        p.ellipse(particle.pos.x, particle.pos.y, size * 3.5, size * 3.5)
        break
      case 'dislike':
        p.fill(particle.hue, 70, 60, alpha * 0.8)
        p.ellipse(particle.pos.x, particle.pos.y, size, size)
        break
      case 'sleep':
        p.noFill()
        p.stroke(particle.hue, 20, 80, alpha * 0.4)
        p.strokeWeight(0.5)
        p.ellipse(particle.pos.x, particle.pos.y, size * 2, size * 2)
        p.noStroke()
        break
      default:
        p.fill(particle.hue, 60, 80, alpha)
        p.ellipse(particle.pos.x, particle.pos.y, size, size)
    }
  }
}

export function renderBehaviorIndicator(p: p5, snapshot: CreatureSnapshot): void {
  const { behavior, headPos } = snapshot
  const stateColors: Record<string, [number, number, number]> = {
    wander: [170, 50, 70],
    hunt: [30, 80, 90],
    startle: [0, 80, 90],
    rest: [200, 30, 60],
    curious: [60, 70, 80],
    play: [280, 60, 80],
    sleep: [220, 40, 50],
    eat: [45, 70, 80],
  }
  const col = stateColors[behavior.state] ?? [170, 50, 70]

  p.noStroke()
  p.fill(col[0], col[1], col[2], 40)
  p.ellipse(headPos.x, headPos.y - 30, 8, 8)
  p.fill(col[0], col[1], col[2], 80)
  p.ellipse(headPos.x, headPos.y - 30, 4, 4)
}

export function renderBackground(p: p5, width: number, height: number, time: number): void {
  p.background(5, 5, 16)

  p.noStroke()
  for (let i = 0; i < 5; i++) {
    const cx = width * (0.2 + i * 0.15) + Math.sin(time * 0.002 + i * 2) * width * 0.1
    const cy = height * 0.5 + Math.cos(time * 0.003 + i * 3) * height * 0.15
    const r = 150 + Math.sin(time * 0.004 + i) * 50
    p.fill(180 + i * 15, 15, 8, 3)
    p.ellipse(cx, cy, r, r)
  }

  for (let i = 0; i < 8; i++) {
    const x = (time * 0.2 + i * 137.5) % width
    const y = height * 0.3 + Math.sin(time * 0.005 + i * 2.3) * height * 0.2
    const size = 1 + Math.sin(time * 0.01 + i) * 0.5
    p.fill(200, 20, 30, 8 + Math.sin(time * 0.02 + i) * 4)
    p.ellipse(x, y, size, size)
  }
}
