import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#projects', label: 'Projects' },
  { href: '#writing', label: 'Writing' },
  { href: '#ai', label: 'AI & Workflows' },
  { href: '#models', label: 'Mental Models' },
]

/*
 * Sticky nav: transparent over the hero, frosted glass once scrolled, with a
 * gradient reading-progress bar along its bottom edge. Mobile gets a
 * full-screen overlay menu with staggered link entrances.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24)
        const el = progressRef.current
        if (el) {
          const max = document.documentElement.scrollHeight - window.innerHeight
          const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
          // Direct style write: progress updates at 60fps without re-renders
          el.style.transform = `scaleX(${p})`
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Lock page scroll while the overlay menu is open
  useEffect(() => {
    if (!menuOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav
      className={`nav ${scrolled ? 'nav--scrolled' : ''} ${
        menuOpen ? 'nav--open' : ''
      }`}
    >
      <a className="nav-brand" href="#top" onClick={closeMenu}>
        Aum<span className="nav-brand-dot">.</span>
      </a>
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
      <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
        {NAV_LINKS.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            style={{ '--i': i }}
          >
            {link.label}
          </a>
        ))}
      </div>
      <span className="nav-progress" aria-hidden="true">
        <span className="nav-progress-bar" ref={progressRef} />
      </span>
    </nav>
  )
}
