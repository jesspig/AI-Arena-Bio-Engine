import type p5 from 'p5'
import type { CreatureSnapshot } from '../engine/types'
import type { ParticleData } from '../engine/types'
import { sub, add, scale, normalize, perpendicular, fromAngle, rotate } from '../engine/vec2'

const BASE_HUE = 170
const SATURATION = 70
const BRIGHTNESS = 60

export function renderCreature(p: p5, snapshot: CreatureSnapshot): void {
  renderBodyGlow(p, snapshot)
  renderBody(p, snapshot)
  renderLimbs(p, snapshot)
  renderSpineDetails(p, snapshot)
  renderHead(p, snapshot)
  renderEyes(p, snapshot)
  renderGills(p, snapshot)
}

function renderBodyGlow(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time } = snapshot
  p.noStroke()
  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const glowSize = seg.width * 3
    const pulse = Math.sin(time * 0.05 + i * 0.3) * 0.3 + 0.7
    const alpha = 15 * pulse
    p.fill(BASE_HUE, SATURATION * 0.5, BRIGHTNESS + 20, alpha)
    p.ellipse(seg.pos.x, seg.pos.y, glowSize, glowSize)
  }
}

function renderBody(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, behavior } = snapshot
  const stateHueShift = behavior.state === 'startle' ? 60 : behavior.state === 'hunt' ? 30 : 0

  const leftPoints: { x: number; y: number }[] = []
  const rightPoints: { x: number; y: number }[] = []

  for (let i = 0; i < spine.length; i++) {
    const seg = spine[i]
    const dir = i < spine.length - 1 ? sub(spine[i + 1].pos, seg.pos) : sub(seg.pos, spine[i - 1].pos)
    const norm = normalize(perpendicular(dir))
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
    const dir = i < spine.length - 1 ? sub(spine[i + 1].pos, seg.pos) : sub(seg.pos, spine[i - 1].pos)
    const norm = normalize(perpendicular(dir))
    p.vertex(add(seg.pos, scale(norm, innerW)).x, add(seg.pos, scale(norm, innerW)).y)
  }
  for (let i = spine.length - 1; i >= 0; i--) {
    const seg = spine[i]
    const innerW = seg.width * 0.5
    const dir = i < spine.length - 1 ? sub(spine[i + 1].pos, seg.pos) : sub(seg.pos, spine[i - 1].pos)
    const norm = normalize(perpendicular(dir))
    p.vertex(add(seg.pos, scale(norm, -innerW)).x, add(seg.pos, scale(norm, -innerW)).y)
  }
  p.endShape(p.CLOSE)
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
  const stateHueShift = behavior.state === 'startle' ? 60 : behavior.state === 'hunt' ? 30 : 0

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
  }
}

function renderHead(p: p5, snapshot: CreatureSnapshot): void {
  const { headPos, headAngle, spine, behavior } = snapshot
  const stateHueShift = behavior.state === 'startle' ? 60 : behavior.state === 'hunt' ? 30 : 0

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

  p.pop()
}

function renderEyes(p: p5, snapshot: CreatureSnapshot): void {
  const { headPos, headAngle, time, behavior } = snapshot
  const stateHueShift = behavior.state === 'startle' ? 60 : behavior.state === 'hunt' ? 30 : 0

  const eyeOffset = 10
  const eyeSpread = 7
  const eyeSize = 5

  for (const side of [-1, 1]) {
    const eyePos = add(
      headPos,
      add(
        scale(fromAngle(headAngle), eyeOffset),
        scale(rotate(fromAngle(headAngle), Math.PI / 2), side * eyeSpread),
      ),
    )

    p.noStroke()
    p.fill(BASE_HUE + stateHueShift + 40, 30, 95, 230)
    p.ellipse(eyePos.x, eyePos.y, eyeSize, eyeSize)

    const pupilOffset = scale(fromAngle(headAngle), 1.2)
    const pupilPos = add(eyePos, pupilOffset)
    p.fill(0, 0, 10, 250)
    p.ellipse(pupilPos.x, pupilPos.y, eyeSize * 0.5, eyeSize * 0.5)

    const glowPulse = Math.sin(time * 0.1) * 0.3 + 0.7
    p.fill(BASE_HUE + stateHueShift + 60, 80, 100, 60 * glowPulse)
    p.ellipse(eyePos.x, eyePos.y, eyeSize * 2.5, eyeSize * 2.5)
  }
}

function renderGills(p: p5, snapshot: CreatureSnapshot): void {
  const { spine, time, behavior } = snapshot
  const stateHueShift = behavior.state === 'startle' ? 60 : 0

  const gillBaseIndex = 2
  const gillCount = 3

  for (let g = 0; g < gillCount; g++) {
    const seg = spine[gillBaseIndex + g]
    if (!seg) continue
    const dir = sub(spine[Math.min(gillBaseIndex + g + 1, spine.length - 1)].pos, seg.pos)
    const norm = normalize(perpendicular(dir))
    const wave = Math.sin(time * 0.06 + g * 1.5) * 0.3

    for (const side of [-1, 1]) {
      const gillRoot = add(seg.pos, scale(norm, side * seg.width * 0.7))
      const gillTip = add(
        gillRoot,
        add(
          scale(norm, side * (8 + wave * 4)),
          scale(normalize(dir), -3 + wave * 2),
        ),
      )

      p.stroke(BASE_HUE + stateHueShift + 20, 60, 80, 120)
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

export function renderParticles(p: p5, particles: ParticleData[]): void {
  p.noStroke()
  for (const particle of particles) {
    const lifeRatio = particle.life / particle.maxLife
    const alpha = lifeRatio * 150
    const size = particle.size * (0.5 + lifeRatio * 0.5)
    p.fill(particle.hue, 60, 80, alpha)
    p.ellipse(particle.pos.x, particle.pos.y, size, size)
  }
}

export function renderBehaviorIndicator(p: p5, snapshot: CreatureSnapshot): void {
  const { behavior, headPos } = snapshot
  const stateColors: Record<string, [number, number, number]> = {
    wander: [170, 50, 70],
    hunt: [30, 80, 90],
    startle: [0, 80, 90],
    rest: [200, 30, 60],
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
  for (let i = 0; i < 3; i++) {
    const cx = width * 0.3 + Math.sin(time * 0.003 + i * 2) * width * 0.2
    const cy = height * 0.5 + Math.cos(time * 0.004 + i * 3) * height * 0.2
    const r = 200 + Math.sin(time * 0.005 + i) * 50
    p.fill(180 + i * 20, 20, 10, 3)
    p.ellipse(cx, cy, r, r)
  }
}
