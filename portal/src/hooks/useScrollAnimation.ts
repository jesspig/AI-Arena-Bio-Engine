import { useEffect, useRef, useState, useCallback } from 'react'

interface ScrollAnimationState {
  progress: number
  direction: 'up' | 'down' | null
  velocity: number
}

interface UseScrollAnimationOptions {
  offset?: number
  clamp?: boolean
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { offset = 0, clamp = true } = options
  const [state, setState] = useState<ScrollAnimationState>({
    progress: 0,
    direction: null,
    velocity: 0,
  })
  const lastScrollY = useRef(0)
  const lastTime = useRef(Date.now())
  const rafId = useRef<number>()

  useEffect(() => {
    let lastScrollY = window.scrollY
    let lastTime = Date.now()

    const handleScroll = () => {
      if (rafId.current) return

      rafId.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const now = Date.now()
        const dt = now - lastTime

        let progress = (scrollY - offset) / (document.documentElement.scrollHeight - window.innerHeight)
        if (clamp) {
          progress = Math.max(0, Math.min(1, progress))
        }

        const velocity = dt > 0 ? (scrollY - lastScrollY) / dt : 0
        const direction: 'up' | 'down' | null = scrollY > lastScrollY ? 'down' : scrollY < lastScrollY ? 'up' : null

        setState({ progress, direction, velocity })
        lastScrollY = scrollY
        lastTime = now
        rafId.current = undefined
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [offset, clamp])

  return state
}

export function useSectionAnimation(sectionRef: React.RefObject<HTMLElement>) {
  const [animation, setAnimation] = useState({
    progress: 0,
    opacity: 1,
    translateY: 0,
    scale: 1,
  })

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let rafId: number

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const sectionHeight = rect.height

        let progress = 0
        if (rect.top <= 0) {
          progress = Math.abs(rect.top) / (sectionHeight - viewportHeight)
        } else {
          progress = 0
        }
        progress = Math.max(0, Math.min(1, progress))

        const fadeOutStart = 0.7
        const opacity = progress > fadeOutStart ? 1 - ((progress - fadeOutStart) / (1 - fadeOutStart)) : 1

        const translateY = progress * 60
        const scale = 1 - progress * 0.15

        setAnimation({ progress, opacity, translateY, scale })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [sectionRef])

  return animation
}

export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0)
  const lastScrollY = useRef(0)
  const rafId = useRef<number>()

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) return

      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        setOffset(scrollY * speed)
        lastScrollY.current = scrollY
        rafId.current = undefined
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [speed])

  return offset
}

export function useRevealOnScroll(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    const children = el.querySelectorAll('.reveal')
    children.forEach((child) => observer.observe(child))
    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold])

  return ref
}

export function useScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progressRef
}

export function useStickyNav() {
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.nav')
      if (nav) {
        if (window.scrollY > 20) nav.classList.add('scrolled')
        else nav.classList.remove('scrolled')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}