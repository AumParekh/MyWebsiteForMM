import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

/*
 * Hero — Adcker-style editorial-brutalist treatment of a three-line reflection.
 *
 *   Between the  RISK     I measure
 *   and the      MEANING  I chase
 *   a            MACHINE ( portrait )  thinks alongside me
 *
 * The three nouns (RISK / MEANING / MACHINE) are viewport-filling Kumbh Sans
 * "giants"; the connective phrases are small Bodoni serif asides floated beside
 * them (the ~20:1 sans/serif scale ratio is the Adcker signature). The portrait
 * sits inline inside ( ) next to MACHINE, like Adcker's ( showreel ).
 *
 * Motion: each giant clip-masks up from its own overflow-hidden box; the serif
 * asides fade in; the portrait does the media fade (opacity 0.01 -> 1). Every
 * element's CSS default is its final visible state, so a GSAP revert (e.g.
 * React 18 StrictMode double-invoking this effect) can never leave it hidden.
 */
export default function Hero() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })

      // Giants rise out of their clip boxes, staggered 120ms.
      tl.fromTo(
        '.hero-giant',
        { yPercent: 115 },
        { yPercent: 0, duration: 1.1, stagger: 0.12 },
      )

      // Serif asides fade in alongside the giants.
      tl.fromTo(
        '.hero-aside',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 },
        '-=0.9',
      )

      // Portrait media fade — overlaps the MACHINE line.
      tl.fromTo(
        '.hero-portrait-img',
        { opacity: 0.01 },
        { opacity: 1, duration: 0.7, ease: 'power2.inOut' },
        '-=0.7',
      )

      // Hairline rule, then the scroll cue.
      tl.fromTo(
        '.hero-rule',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.55, ease: 'power2.inOut', transformOrigin: 'left center' },
        '-=0.3',
      )
      tl.fromTo(
        '.hero-scroll-indicator',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' },
        '-=0.2',
      )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="top" className="hero" ref={rootRef} aria-label="Hero">
      <div className="hero-content">
        <div className="hero-headline-block">

          {/* The reflection. Giants are Kumbh Sans (uppercased in CSS); asides
              are small Bodoni serif. Each giant rides in its own clip box. */}
          <h1
            className="hero-display"
            aria-label="Between the risk I measure and the meaning I chase, intelligent systems think alongside me."
          >
            {/* Line 1 */}
            <span className="hero-line">
              <span className="hero-aside" aria-hidden="true">Between the</span>
              <span className="hero-giant-clip">
                <span className="hero-giant" aria-hidden="true">Risk</span>
              </span>
              <span className="hero-aside" aria-hidden="true">I measure</span>
            </span>

            {/* Line 2 */}
            <span className="hero-line">
              <span className="hero-aside" aria-hidden="true">and the</span>
              <span className="hero-giant-clip">
                <span className="hero-giant" aria-hidden="true">meaning</span>
              </span>
              <span className="hero-aside" aria-hidden="true">I chase</span>
            </span>

            {/* Line 3 — SYSTEMS with the inline ( portrait ) */}
            <span className="hero-line hero-line--machine">
              <span className="hero-aside" aria-hidden="true">intelligent</span>
              {/* Giant + portrait stay together as one justified unit so
                  space-between never splits SYSTEMS from its ( portrait ). */}
              <span className="hero-machine-core">
                <span className="hero-giant-clip">
                  <span className="hero-giant" aria-hidden="true">systems</span>
                </span>
                <span className="hero-portrait-group">
                  <span className="hero-paren" aria-hidden="true">(</span>
                  <img
                    src={`${import.meta.env.BASE_URL}aum-hero.webp`}
                    alt="Aum Parekh"
                    className="hero-portrait-img"
                  />
                  <span className="hero-paren" aria-hidden="true">)</span>
                </span>
              </span>
              <span className="hero-aside" aria-hidden="true">think alongside me</span>
            </span>
          </h1>

          {/* Thin hairline rule */}
          <div className="hero-rule" aria-hidden="true" />
        </div>
      </div>

      {/* Scroll cue */}
      <p className="hero-scroll-indicator" aria-hidden="true">( scroll )</p>
    </section>
  )
}
