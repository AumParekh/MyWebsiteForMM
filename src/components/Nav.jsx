import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const NAV_LINKS = [
  { href: '#about',    label: 'About' },
  { href: '#projects', label: 'Projects' },
  { href: '#writing',  label: 'Writing' },
  { href: '#ai',       label: 'AI & Workflows' },
  { href: '#models',   label: 'Mental Models' },
]

const CONTACT_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aum-parekh',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  { label: 'Email',  href: 'mailto:aumparekhh@gmail.com' },
  { label: 'Phone',  href: 'tel:+919321130281' },
]

/*
 * Nav — Phase 3b
 * Two states:
 *   Resting: fixed top bar (bone bg), wordmark left, Menu button right.
 *   Open:    full-screen ink overlay with three-column layout (links /
 *             portrait / contact), animated in with GSAP.
 */
export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Refs for GSAP targets
  const overlayRef   = useRef(null)   // the full-screen ink panel
  const linksRef     = useRef([])     // primary nav link wrappers
  const portraitRef  = useRef(null)   // center portrait group
  const contactRef   = useRef(null)   // right contact column
  const progressRef  = useRef(null)   // 1px reading-progress hairline

  // ── Reading-progress hairline ──────────────────────────────────────────────
  // Lenis re-dispatches native scroll events, so window.scroll still fires.
  // We write transform directly (no re-render) to track at ~60fps.
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = progressRef.current
        if (!el) return
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p   = max > 0 ? Math.min(1, window.scrollY / max) : 0
        // Direct style write: avoids a React re-render on every scroll tick
        el.style.transform = `scaleX(${p})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // ── Scroll-lock + Esc-to-close ─────────────────────────────────────────────
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

  // ── GSAP open / close choreography ────────────────────────────────────────
  // useLayoutEffect fires before paint, so GSAP sets initial states before
  // the browser renders — prevents a flash of un-animated content.
  useLayoutEffect(() => {
    // Respect prefers-reduced-motion: show everything statically, no GSAP.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    if (!menuOpen) return  // close path: overlay is removed from DOM; nothing to do

    // Scope all GSAP work to the overlay element.
    // ctx.revert() undoes everything (transforms, opacity) on cleanup so
    // a re-open starts from a clean slate.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // (1) Overlay panel — instant alpha fill so the ink surface appears first.
      //     We set autoAlpha so GSAP controls both opacity AND visibility.
      tl.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: 'power2.inOut' }
      )

      // (2) Primary nav links — stagger each from below (translateY 60px) at
      //     80ms intervals. power2.inOut approximates --ease-tx.
      tl.fromTo(
        linksRef.current,
        { y: 60, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.55,
          ease: 'power2.inOut',
          stagger: 0.08,   // 80ms between each link
        },
        '-=0.1'            // overlap slightly with the panel fade
      )

      // (3) Portrait group and contact column fade in together after links land.
      tl.fromTo(
        [portraitRef.current, contactRef.current],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.45, ease: 'power2.inOut' },
        '-=0.2'
      )
    }, overlayRef)  // scope to overlay

    return () => ctx.revert()  // clean up on close / unmount — prevents leaks
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* ── Reading-progress hairline — 1px, ink, scaleX driven by scroll ── */}
      <div className="nav-progress" aria-hidden="true">
        <div className="nav-progress-bar" ref={progressRef} />
      </div>

      {/* ── Resting top bar ─────────────────────────────────────────────── */}
      <nav className={`nav-bar${menuOpen ? ' nav-bar--open' : ''}`}>
        {/* Wordmark */}
        <a href="#top" className="nav-wordmark" onClick={closeMenu}>
          aum.
        </a>

        {/* Menu / Close toggle */}
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </nav>

      {/* ── Full-screen overlay (mounted while open) ─────────────────────── */}
      {menuOpen && (
        <div className="nav-overlay" ref={overlayRef} role="dialog" aria-modal="true">

          {/* Left column — primary nav links */}
          <div className="nav-overlay__links">
            {NAV_LINKS.map((link, i) => (
              /*
               * Clip-flip hover: the outer wrapper clips overflow so the
               * sliding labels never escape their bounding box.
               * Inside: two layers — the sans label (slides UP on hover) and
               * the serif italic duplicate (slides IN from below).
               * Both stay --bone. transition uses --ease-tx.
               */
              <a
                key={link.href}
                href={link.href}
                className="nav-primary-link"
                onClick={closeMenu}
                ref={(el) => { linksRef.current[i] = el }}
              >
                <span className="nav-primary-link__inner" aria-hidden="true">
                  {/* Sans label — slides out on hover */}
                  <span className="nav-primary-link__sans">{link.label}</span>
                  {/* Bodoni italic duplicate — slides in on hover */}
                  <span className="nav-primary-link__serif">{link.label}</span>
                </span>
                {/* Screen-reader text — always visible to AT */}
                <span className="sr-only">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Center column — portrait flanked by parentheses */}
          <div className="nav-overlay__portrait" ref={portraitRef}>
            <span className="nav-portrait-paren nav-portrait-paren--left" aria-hidden="true">(</span>
            <img
              src={`${import.meta.env.BASE_URL}aum-nav.webp`}
              alt="Aum Parekh"
              className="nav-portrait-img"
              /* Visible by default; the portrait group's GSAP autoAlpha fade
                 provides the entrance. (No inline opacity — nothing animated
                 the img itself, so a hard-coded 0.01 left it permanently dim.) */
            />
            <span className="nav-portrait-paren nav-portrait-paren--right" aria-hidden="true">)</span>
          </div>

          {/* Right column — contact links */}
          <div className="nav-overlay__contact" ref={contactRef}>
            {CONTACT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-contact-link"
                target={link.target}
                rel={link.rel}
                onClick={!link.target ? closeMenu : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
