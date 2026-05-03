import { useStickyNav } from '../hooks/useScrollAnimation'
import { MODELS } from '../data/models'

export function Nav() {
  useStickyNav()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#" className="nav-logo">Bio-Engine</a>
        <div className="nav-links">
          {MODELS.map((m) => (
            <a key={m.id} href={`#${m.id}`} className="nav-link">
              {m.name.split('-')[0]}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
