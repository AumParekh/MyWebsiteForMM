import { useEffect, useRef, useState } from 'react'

/*
 * Scroll-triggered reveal — Phase 3f (Adcker motion system).
 *
 * Two variants, both fired once by IntersectionObserver (threshold 0.15):
 *   - default (text/blocks): a CLIP-MASK rise. The element animates from
 *     translateY + a bottom-clipped clip-path to its resting state, so content
 *     is *uncovered as it rises* — never a blur/fade (per the design rules:
 *     "reveal text by clip-mask, not by fade").
 *   - media: images fade only (opacity 0.01 → 1) — the one place a fade is
 *     allowed.
 *
 * Both transform and clip-path are paint-only, so this works on ANY tag without
 * an extra DOM wrapper — critical because callers use <Reveal as="li"> on grid
 * rows and split-section flex parents, which an inner wrapper would break.
 *
 * Reduced-motion users get content instantly (no observer, no transition).
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  media = false,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return undefined
    }

    let done = false

    // Geometry check — true once the element's top has risen into the lower
    // ~90% of the viewport (and it hasn't scrolled past the top). Works for
    // elements taller than the viewport, where an IO ratio threshold can be
    // hard to reach.
    const inView = () => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.9 && r.bottom > 0
    }

    const reveal = () => {
      if (done) return
      done = true
      setShown(true)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }

    // IntersectionObserver is the fast path. But Lenis' rAF-driven smooth
    // scroll doesn't always re-trigger IO callbacks, so we also listen to the
    // native scroll event Lenis re-dispatches (same technique Nav uses for the
    // progress bar) as a guaranteed fallback — plus an immediate check for
    // anything already on screen at mount.
    const onScroll = () => {
      if (inView()) reveal()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal()
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)

    if (inView()) {
      reveal()
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
    }

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${media ? 'reveal--media' : ''} ${
        shown ? 'reveal--in' : ''
      } ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      // delay staggers siblings; applies to whichever transition is active
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
