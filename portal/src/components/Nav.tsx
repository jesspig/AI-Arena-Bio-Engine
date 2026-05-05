import { useEffect, useState } from 'react'
import { MODELS } from '../data/models'

export function Nav() {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const sectionIds = ['project-intro', ...MODELS.map(m => m.id)]

    const observers = new Map<string, IntersectionObserverEntry>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          observers.set(entry.target.id, entry)
        })

        for (const id of sectionIds) {
          const entry = observers.get(id)
          if (entry && entry.isIntersecting) {
            setActiveId(id)
            break
          }
        }
      },
      {
        threshold: 0.3,
        rootMargin: '-10% 0px -60% 0px'
      }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <nav className="nav">
      <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Bio-Engine</a>
      <div className="nav-links">
        <a
          key="project-intro"
          href="#project-intro"
          className={`nav-link ${activeId === 'project-intro' ? 'active' : ''}`}
          onClick={(e) => handleNavClick(e, 'project-intro')}
        >
          <span className="nav-link-dot" style={{ background: '#1a88ff' }}></span>
          <span className="nav-link-name">关于项目</span>
        </a>
        {MODELS.map((m) => (
          <a
            key={m.id}
            href={`#${m.id}`}
            className={`nav-link ${activeId === m.id ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, m.id)}
          >
            <span className="nav-link-dot" style={{ background: m.color }}></span>
            <span className="nav-link-name">{m.name.split('-')[0]}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}