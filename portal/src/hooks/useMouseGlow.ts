import { useEffect, useRef } from 'react'

const LIQUID_SELECTORS = '.liquid-glass, .liquid-card, .liquid-surface, .quick-card, .intro-card, .philosophy-item, .tech-pills, .toggle-capsule, .nav'

function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let inThrottle = false
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

export function useMouseGlow() {
  const activeElementsRef = useRef<Set<HTMLElement>>(new Set())
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeElementsRef.current.size === 0) return

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        activeElementsRef.current.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          el.style.setProperty('--mouse-x', `${x}px`)
          el.style.setProperty('--mouse-y', `${y}px`)
        })
      })
    }

    const throttledMouseMove = throttle(handleMouseMove, 16)

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest) {
        const liquidEl = target.closest(LIQUID_SELECTORS) as HTMLElement
        if (liquidEl) {
          liquidEl.classList.add('mouse-glow')
          activeElementsRef.current.add(liquidEl)
        }
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest) {
        const liquidEl = target.closest(LIQUID_SELECTORS) as HTMLElement
        if (liquidEl) {
          liquidEl.classList.remove('mouse-glow')
          activeElementsRef.current.delete(liquidEl)
        }
      }
    }

    document.addEventListener('mousemove', throttledMouseMove)
    document.addEventListener('mouseenter', handleMouseEnter, true)
    document.addEventListener('mouseleave', handleMouseLeave, true)

    return () => {
      document.removeEventListener('mousemove', throttledMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter, true)
      document.removeEventListener('mouseleave', handleMouseLeave, true)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      activeElementsRef.current.clear()
    }
  }, [])
}