import type p5 from 'p5'
import type { CreatureConfig, CreatureState, SpineSegment, Vec2, Particle } from '../engine/types'
import { BehaviorState } from '../engine/types'
import { add, scale, length, lerp } from '../engine/math'
import { getSpineNormal } from '../engine/spine'
import { getCreatureLegIKResults } from '../engine/creature'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function blendBodyColor(
  t: number,
  headRgb: { r: number; g: number; b: number },
  bodyRgb: { r: number; g: number; b: number },
  tailRgb: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  if (t < 0.3) {
    const lt = t / 0.3
    return {
      r: lerp(headRgb.r, bodyRgb.r, lt),
      g: lerp(headRgb.g, bodyRgb.g, lt),
      b: lerp(headRgb.b, bodyRgb.b, lt),
    }
  }
  const lt = (t - 0.3) / 0.7
  return {
    r: lerp(bodyRgb.r, tailRgb.r, lt),
    g: lerp(bodyRgb.g, tailRgb.g, lt),
    b: lerp(bodyRgb.b, tailRgb.b, lt),
  }
}

export function drawCreature(
  p: p5,
  state: CreatureState,
  config: CreatureConfig
): void {
  const { spine, legs, breathPhase, behaviorState } = state

  p.push()
  p.noStroke()

  // Draw glow aura
  drawGlowAura(p, spine, config, breathPhase)

  // Draw body (filled shape with scale pattern)
  drawBody(p, spine, config, breathPhase)

  // Draw legs
  const ikResults = getCreatureLegIKResults(state, config)
  drawLegs(p, ikResults, config, behaviorState)

  // Draw head
  drawHead(p, spine, config, breathPhase, behaviorState)

  // Draw tail tip
  drawTailTip(p, spine, config)

  p.pop()
}

function drawGlowAura(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number
): void {
  const breathScale = 1 + Math.sin(breathPhase) * 0.15
  const glowColor = hexToRgb(config.color.glow)

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const t = i / (seg.width / config.headWidth)
    const alpha = p.map(i, 0, spine.length, 40, 10) * breathScale
    const size = seg.width * 2.5 * breathScale

    p.fill(glowColor.r, glowColor.g, glowColor.b, alpha)
    p.ellipse(seg.pos.x, seg.pos.y, size, size)
  }
}

function drawBody(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number
): void {
  const breathScale = 1 + Math.sin(breathPhase) * 0.08

  // Build body outline
  const leftEdge: Vec2[] = []
  const rightEdge: Vec2[] = []

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const normal = getSpineNormal(spine, i)
    const halfWidth = seg.width * breathScale * 0.5
    leftEdge.push(add(seg.pos, scale(normal, halfWidth)))
    rightEdge.push(add(seg.pos, scale(normal, -halfWidth)))
  }

  // Draw body shape
  const headRgb = hexToRgb(config.color.head)
  const bodyRgb = hexToRgb(config.color.body)
  const tailRgb = hexToRgb(config.color.tail)

  p.beginShape()
  // Left edge (head to tail)
  for (let i = 0; i < leftEdge.length; i++) {
    const t = i / (leftEdge.length - 1)
    const { r, g, b } = blendBodyColor(t, headRgb, bodyRgb, tailRgb)
    p.fill(r, g, b, 230)
    p.vertex(leftEdge[i].x, leftEdge[i].y)
  }
  // Right edge (tail to head)
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    const t = i / (rightEdge.length - 1)
    const { r, g, b } = blendBodyColor(t, headRgb, bodyRgb, tailRgb)
    p.fill(r, g, b, 230)
    p.vertex(rightEdge[i].x, rightEdge[i].y)
  }
  p.endShape(p.CLOSE)

  // Draw scale pattern
  drawScalePattern(p, spine, config, breathScale)
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

    // Diamond scale pattern
    for (let side = -1; side <= 1; side += 2) {
      const offset = scale(normal, halfWidth * side * 0.5)
      const pos = add(seg.pos, offset)

      p.fill(bodyRgb.r + 20, bodyRgb.g + 30, bodyRgb.b + 15, 80)
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

function drawLegs(
  p: p5,
  ikResults: Array<{ hip: Vec2; knee: Vec2; foot: Vec2 }>,
  config: CreatureConfig,
  state: BehaviorState
): void {
  const bodyRgb = hexToRgb(config.color.body)
  const isFleeing = state === BehaviorState.FLEEING

  for (const { hip, knee, foot } of ikResults) {
    // Leg shadow
    p.stroke(bodyRgb.r - 20, bodyRgb.g - 20, bodyRgb.b - 20, 120)
    p.strokeWeight(4)
    p.noFill()
    p.line(hip.x + 2, hip.y + 2, knee.x + 2, knee.y + 2)
    p.line(knee.x + 2, knee.y + 2, foot.x + 2, foot.y + 2)

    // Upper leg
    p.stroke(isFleeing ? 200 : bodyRgb.r + 30, isFleeing ? 100 : bodyRgb.g + 20, bodyRgb.b + 10, 220)
    p.strokeWeight(3.5)
    p.line(hip.x, hip.y, knee.x, knee.y)

    // Lower leg
    p.strokeWeight(2.5)
    p.line(knee.x, knee.y, foot.x, foot.y)

    // Foot
    p.noStroke()
    p.fill(isFleeing ? 200 : bodyRgb.r + 50, isFleeing ? 80 : bodyRgb.g + 40, bodyRgb.b + 20, 200)
    p.ellipse(foot.x, foot.y, 6, 6)

    // Joint dots
    p.fill(255, 255, 255, 60)
    p.ellipse(knee.x, knee.y, 4, 4)
  }
}

function drawHead(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig,
  breathPhase: number,
  state: BehaviorState
): void {
  if (spine.length < 2) return

  const head = spine[0]
  const neck = spine[1]
  const headAngle = head.angle
  const breathScale = 1 + Math.sin(breathPhase) * 0.05
  const headRgb = hexToRgb(config.color.head)

  p.push()
  p.translate(head.pos.x, head.pos.y)
  p.rotate(headAngle)

  // Head shape (elongated ellipse)
  p.fill(headRgb.r, headRgb.g, headRgb.b, 240)
  p.ellipse(6, 0, 24 * breathScale, 14 * breathScale)

  // Snout
  p.fill(headRgb.r + 20, headRgb.g + 20, headRgb.b + 10, 220)
  p.ellipse(16, 0, 12 * breathScale, 8 * breathScale)

  // Nostrils
  p.fill(headRgb.r - 30, headRgb.g - 30, headRgb.b - 20, 180)
  p.ellipse(19, -2, 2.5, 2.5)
  p.ellipse(19, 2, 2.5, 2.5)

  // Eyes
  const eyeRgb = hexToRgb(config.color.eye)
  const blinkPhase = Math.sin(breathPhase * 0.3)
  const eyeHeight = blinkPhase > 0.95 ? 1 : 4

  // Eye sockets
  p.fill(0, 0, 0, 60)
  p.ellipse(8, -5.5, 7, 6)
  p.ellipse(8, 5.5, 7, 6)

  // Eye whites
  p.fill(240, 240, 230, 230)
  p.ellipse(8, -5.5, 6, eyeHeight + 1)
  p.ellipse(8, 5.5, 6, eyeHeight + 1)

  // Iris
  p.fill(eyeRgb.r, eyeRgb.g, eyeRgb.b, 250)
  p.ellipse(8, -5.5, 3.5, Math.min(eyeHeight, 3.5))
  p.ellipse(8, 5.5, 3.5, Math.min(eyeHeight, 3.5))

  // Pupils (vertical slits - changes with state)
  const pupilWidth = state === BehaviorState.FLEEING ? 1 : 1.5
  const pupilHeight = state === BehaviorState.FLEEING ? 4 : 3
  p.fill(10, 10, 10, 240)
  p.ellipse(8, -5.5, pupilWidth, pupilHeight)
  p.ellipse(8, 5.5, pupilWidth, pupilHeight)

  // Eye shine
  p.fill(255, 255, 255, 180)
  p.ellipse(9, -6.5, 1.5, 1.5)
  p.ellipse(9, 4.5, 1.5, 1.5)

  // Expression indicators
  if (state === BehaviorState.CURIOUS) {
    // Raised "eyebrow" marks
    p.stroke(headRgb.r + 40, headRgb.g + 40, headRgb.b + 20, 150)
    p.strokeWeight(1.5)
    p.noFill()
    p.arc(8, -7, 8, 4, p.PI + 0.3, p.TWO_PI - 0.3)
    p.arc(8, 7, 8, 4, 0.3, p.PI - 0.3)
  } else if (state === BehaviorState.FLEEING) {
    // Dilated nostrils
    p.fill(headRgb.r - 40, headRgb.g - 40, headRgb.b - 30, 120)
    p.ellipse(20, -3, 4, 4)
    p.ellipse(20, 3, 4, 4)
  }

  p.pop()
}

function drawTailTip(
  p: p5,
  spine: SpineSegment[],
  config: CreatureConfig
): void {
  const tail = spine[spine.length - 1]
  const prev = spine[spine.length - 2]
  const tailRgb = hexToRgb(config.color.tail)

  // Tail tip - slightly curved
  p.noFill()
  p.stroke(tailRgb.r, tailRgb.g, tailRgb.b, 180)
  p.strokeWeight(2)
  p.bezier(
    prev.pos.x, prev.pos.y,
    tail.pos.x, tail.pos.y,
    tail.pos.x + Math.cos(tail.angle) * 10, tail.pos.y + Math.sin(tail.angle) * 10,
    tail.pos.x + Math.cos(tail.angle + 0.3) * 15, tail.pos.y + Math.sin(tail.angle + 0.3) * 15
  )
}

export function drawParticles(p: p5, particles: Particle[]): void {
  p.noStroke()
  for (const particle of particles) {
    const rgb = hexToRgb(particle.color)
    p.fill(rgb.r, rgb.g, rgb.b, particle.alpha * 150)
    p.ellipse(particle.pos.x, particle.pos.y, particle.size, particle.size)
  }
}

export function drawBackground(p: p5, time: number): void {
  // Dark gradient background with subtle movement
  p.background(15, 20, 25)

  // Subtle grid
  p.stroke(40, 50, 60, 30)
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

  // Ambient particles (stars)
  p.noStroke()
  for (let i = 0; i < 30; i++) {
    const px = (Math.sin(i * 127.1 + time * 0.1) * 0.5 + 0.5) * p.width
    const py = (Math.cos(i * 269.5 + time * 0.08) * 0.5 + 0.5) * p.height
    const brightness = Math.sin(time * 2 + i) * 30 + 50
    p.fill(100, 180, 220, brightness)
    p.ellipse(px, py, 2, 2)
  }
}

export function drawMouseIndicator(p: p5, mousePos: Vec2 | null, mouseDown: boolean): void {
  if (!mousePos) return

  p.push()
  p.noFill()

  if (mouseDown) {
    // Repel indicator
    p.stroke(255, 100, 100, 150)
    p.strokeWeight(2)
    const pulseSize = 30 + Math.sin(Date.now() * 0.01) * 10
    p.ellipse(mousePos.x, mousePos.y, pulseSize, pulseSize)
    p.ellipse(mousePos.x, mousePos.y, pulseSize * 0.6, pulseSize * 0.6)
  } else {
    // Attract indicator
    p.stroke(100, 220, 180, 120)
    p.strokeWeight(1.5)
    const pulseSize = 20 + Math.sin(Date.now() * 0.008) * 8
    p.ellipse(mousePos.x, mousePos.y, pulseSize, pulseSize)

    // Crosshair
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
  p.textSize(12)
  p.textFont('monospace')
  p.text(`FPS: ${Math.round(fps)}`, 10, 20)
  p.text(`状态: ${state.behaviorState}`, 10, 38)
  p.text(`位置: (${Math.round(state.spine[0].pos.x)}, ${Math.round(state.spine[0].pos.y)})`, 10, 56)
  p.text(`速度: ${length(state.velocity).toFixed(2)}`, 10, 74)
  p.text(`节段: ${state.spine.length}`, 10, 92)
  p.pop()
}
