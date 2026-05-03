import { useEffect, useRef } from 'react'

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
