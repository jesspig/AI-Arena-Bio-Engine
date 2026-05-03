import { useEffect, useRef, useCallback } from 'react'
import p5 from 'p5'
import type { CreatureConfig, CreatureState, Vec2, Particle } from '../engine/types'
import { createCreature, updateCreature, createDefaultConfig } from '../engine/creature'
import { drawCreature, drawParticles, drawBackground, drawMouseIndicator, drawDebugInfo } from '../renderer/creatureRenderer'
import { updateParticles, emitTrailParticles, emitBreathParticles } from '../renderer/particles'

interface BioCanvasProps {
  showDebug: boolean
  config?: Partial<CreatureConfig>
  onStateChange?: (state: string) => void
}

export default function BioCanvas({ showDebug, config: configOverrides, onStateChange }: BioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)

  const sketchRef = useRef<{
    creature: { state: CreatureState; config: CreatureConfig }
    particles: Particle[]
    time: number
    mousePos: Vec2 | null
    mouseDown: boolean
    lastState: string
  } | null>(null)

  const handleStateChange = useCallback((state: string) => {
    onStateChange?.(state)
  }, [onStateChange])

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      const fullConfig = { ...createDefaultConfig(), ...configOverrides }
      const initial = createCreature(p.windowWidth / 2, p.windowHeight / 2, fullConfig)

      sketchRef.current = {
        creature: initial,
        particles: [],
        time: 0,
        mousePos: null,
        mouseDown: false,
        lastState: initial.state.behaviorState,
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.frameRate(60)
      }

      p.draw = () => {
        if (!sketchRef.current) return

        const s = sketchRef.current
        const dt = p.deltaTime / 1000
        s.time += dt

        const mousePos: Vec2 | null = p.mouseX > 0 && p.mouseY > 0
          ? { x: p.mouseX, y: p.mouseY }
          : null

        s.mousePos = mousePos
        s.mouseDown = p.mouseIsPressed

        // Update creature
        s.creature.state = updateCreature(
          s.creature.state,
          s.creature.config,
          mousePos,
          p.mouseIsPressed,
          { width: p.width, height: p.height },
          dt
        )

        // Report state changes
        if (s.creature.state.behaviorState !== s.lastState) {
          s.lastState = s.creature.state.behaviorState
          handleStateChange(s.lastState)
        }

        // Update particles
        s.particles = updateParticles(s.particles, dt)

        // Emit trail particles
        const head = s.creature.state.spine[0]
        s.particles = emitTrailParticles(head.pos, s.creature.state.velocity, s.particles, 80)

        // Emit breath particles
        s.particles = emitBreathParticles(
          head.pos,
          s.creature.state.heading,
          s.creature.state.breathPhase,
          s.particles,
          40
        )

        // Draw
        drawBackground(p, s.time)
        drawParticles(p, s.particles)
        drawCreature(p, s.creature.state, s.creature.config)
        drawMouseIndicator(p, s.mousePos, s.mouseDown)

        if (showDebug) {
          drawDebugInfo(p, s.creature.state, p.frameRate())
        }
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
      }
    }

    p5Ref.current = new p5(sketch, containerRef.current)

    return () => {
      p5Ref.current?.remove()
      p5Ref.current = null
    }
  }, [configOverrides, showDebug, handleStateChange])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
    />
  )
}
