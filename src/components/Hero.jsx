import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

/*
 * Hero — Phase 3c
 *
 * Full-screen bone section. Content is vertically centred with a slight upward
 * offset. The visual anchor is an inline portrait sitting between display-scale
 * parentheses on line 2.
 *
 * Structure (top → bottom):
 *   1. Serif italic aside  — "I work at the intersection of"
 *   2. Three stacked display lines — RISK / ( portrait ) MODELS / & IDEAS
 *   3. Thin 1px hairline rule
 *   4. Scroll indicator — "( scroll )", pulsing CSS animation
 *
 * Motion design (GSAP timeline, one-shot entrance):
 *   - All animated elements default to their FINAL visible state in CSS.
 *     GSAP uses fromTo to set the hidden start state each run; ctx.revert()
 *     therefore restores elements to visible rather than leaving them hidden.
 *     (This was the exact bug in the Nav phase — never fixed with this pattern.)
 *   - Reduced-motion guard: skip GSAP entirely if the OS preference is set.
 */

export default function Hero() {
  // Root ref: GSAP context is scoped to this element so all selectors and
  // targets are contained, and ctx.revert() only affects this component's tweens.
  const rootRef   = useRef(null)
  const asideRef  = useRef(null)
  const line1Ref  = useRef(null)   // inner sliding element for RISK
  const line2Ref  = useRef(null)   // inner sliding element for ( portrait ) MODELS
  const line3Ref  = useRef(null)   // inner sliding element for & IDEAS
  const imgRef    = useRef(null)   // portrait <img>
  const ruleRef   = useRef(null)   // 1px hairline
  const scrollRef = useRef(null)   // ( scroll ) text

  useLayoutEffect(() => {
    // ── Reduced-motion guard ───────────────────────────────────────────────────
    // Everything is CSS-visible by default, so skipping GSAP is safe.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // ── Scope all GSAP to the hero root ───────────────────────────────────────
    // ctx.revert() on cleanup rolls back every tween/set, restoring CSS defaults
    // (which are the final visible states — intentional).
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })

      // (1) Serif aside — clip-mask up from below.
      //     The wrapper has overflow:hidden; this inner element starts below.
      tl.fromTo(
        asideRef.current,
        { y: '100%' },
        { y: '0%', duration: 0.9 }
      )

      // (2a) Line 1 "RISK" — clip-mask up, 120ms after aside starts.
      tl.fromTo(
        line1Ref.current,
        { y: '100%' },
        { y: '0%', duration: 1.1 },
        '-=0.7'          // overlap with aside — line 1 starts 0.2s into aside's 0.9s
      )

      // (2b) Line 2 "( portrait ) MODELS" — staggered 120ms after line 1.
      tl.fromTo(
        line2Ref.current,
        { y: '100%' },
        { y: '0%', duration: 1.1 },
        '<0.12'          // 120ms after line 1 starts
      )

      // (2c) Line 3 "& IDEAS" — staggered 120ms after line 2.
      tl.fromTo(
        line3Ref.current,
        { y: '100%' },
        { y: '0%', duration: 1.1 },
        '<0.12'          // 120ms after line 2 starts
      )

      // (3) Portrait image — media fade, overlaps with line 2 reveal.
      //     IMPORTANT: img CSS opacity is 1 (default visible state).
      //     fromTo drives it from 0.01 → 1 each entrance run.
      //     power2.inOut approximates --ease-media (both are smooth ease-in-out
      //     profiles; GSAP cannot parse raw cubic-bezier without CustomEase).
      tl.fromTo(
        imgRef.current,
        { opacity: 0.01 },
        { opacity: 1, duration: 0.7, ease: 'power2.inOut' },
        '<'              // starts at the same time as line 2's reveal
      )

      // (4) Hairline rule — quick scaleX reveal after headline lands.
      tl.fromTo(
        ruleRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.55, ease: 'power2.inOut', transformOrigin: 'left center' },
        '-=0.4'
      )

      // (5) Scroll indicator — simple opacity fade after rule.
      tl.fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' },
        '-=0.2'
      )
    }, rootRef)   // scope to hero root

    return () => ctx.revert()   // cleanup on unmount — restores CSS defaults (all visible)
  }, [])

  return (
    <section id="top" className="hero" ref={rootRef} aria-label="Hero">

      {/* ── Content wrapper — vertically centred with slight upward offset ─── */}
      <div className="hero-content">

        {/* ── Headline block: aside + three display lines ─────────────────── */}
        <div className="hero-headline-block">

          {/* 1. Serif italic aside */}
          {/* Outer .hero-clip clips overflow so the sliding inner never escapes */}
          <div className="hero-clip hero-aside-clip" aria-hidden="true">
            <p className="hero-aside" ref={asideRef}>
              I work at the intersection of
            </p>
          </div>

          {/* 2. Three stacked display lines */}
          <h1 className="hero-display" aria-label="Risk, models, and ideas.">

            {/* Line 1 — RISK */}
            <span className="hero-clip hero-display-line-clip">
              <span className="hero-display-line-inner" ref={line1Ref} aria-hidden="true">
                RISK
              </span>
            </span>

            {/* Line 2 — ( portrait ) MODELS
                A flex row so the portrait sits inline at display scale.
                align-items:center keeps the paren glyphs and img on the same
                baseline-ish axis; the img height is set in em so it scales
                with the display font-size (--display = 0.75em + 12vw). */}
            <span className="hero-clip hero-display-line-clip">
              <span className="hero-display-line-inner hero-display-line-inner--row" ref={line2Ref} aria-hidden="true">
                <span className="hero-paren">(</span>
                <img
                  src={`${import.meta.env.BASE_URL}aum-hero.webp`}
                  alt="Aum Parekh — portrait, amber-lit"
                  className="hero-portrait-img"
                  ref={imgRef}
                  /* Visible by default (opacity:1 in CSS).
                     GSAP fromTo drives the entrance from 0.01 each run.
                     No inline opacity here — avoids the Nav bug where a
                     hard-coded 0.01 made the image permanently near-invisible
                     after ctx.revert(). */
                />
                <span className="hero-paren">)</span>
                {/* Non-breaking space before MODELS so it reads as one unit
                    and never orphans the paren on a separate line */}
                &nbsp;MODELS
              </span>
            </span>

            {/* Line 3 — & IDEAS */}
            <span className="hero-clip hero-display-line-clip">
              <span className="hero-display-line-inner" ref={line3Ref} aria-hidden="true">
                &amp; IDEAS
              </span>
            </span>

          </h1>

          {/* 3. Thin 1px hairline rule below headline */}
          {/* scaleX starts at 0 in GSAP; CSS default is scaleX(1) so revert
              leaves it visible. transform-origin set in GSAP call above. */}
          <div className="hero-rule" ref={ruleRef} aria-hidden="true" />

        </div>{/* /hero-headline-block */}

      </div>{/* /hero-content */}

      {/* 4. Scroll indicator — near bottom, CSS pulse animation */}
      <p
        className="hero-scroll-indicator"
        ref={scrollRef}
        aria-hidden="true"
      >
        ( scroll )
      </p>

    </section>
  )
}
