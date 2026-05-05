import { useEffect, useState } from 'react'

const THEME_KEY = 'bio-engine-theme'

export function ThemeToggle() {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const toggle = document.getElementById('theme-toggle')
    const html = document.documentElement

    const applyTheme = (theme: string) => {
      html.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_KEY, theme)
    }

    toggle?.addEventListener('click', () => {
      const current = html.getAttribute('data-theme')
      applyTheme(current === 'dark' ? 'light' : 'dark')
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`toggle-capsule ${isAtTop ? 'at-top' : ''}`}>
      <button className="theme-toggle" id="theme-toggle" aria-label="切换深浅色模式">
        <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      <button className="back-to-top" onClick={scrollToTop} aria-label="回到顶部">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  )
}