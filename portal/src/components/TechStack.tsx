import { useEffect, useRef } from 'react'

export function TechStack() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="tech-stack reveal" ref={ref}>
      <div className="tech-pills">
        <span className="tech-pill">
          <span className="tech-dot tech-dot-cyan" />
          React 19
        </span>
        <span className="tech-pill">
          <span className="tech-dot tech-dot-orange" />
          p5.js
        </span>
        <span className="tech-pill">
          <span className="tech-dot tech-dot-teal" />
          Tailwind CSS 4
        </span>
        <span className="tech-pill">
          <span className="tech-dot tech-dot-purple" />
          Vite 8
        </span>
      </div>
    </section>
  )
}
