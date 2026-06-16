import { useEffect, useRef, useState } from 'react'
import AuroraCanvas from './AuroraCanvas.jsx'
import ParticleField from './ParticleField.jsx'
import Magnetic from './Magnetic.jsx'

/*
 * Cinematic full-screen hero: monochrome WebGL smoke backdrop (stands in for
 * a background video), centered serif headline with a masked char-by-char
 * reveal and white vertical-gradient fill, staggered sub/CTA entrance, and a
 * marquee strip. Headline text is identical to the original copy.
 */

// One entry per visual line; `em` marks the serif-italic accent word.
const HERO_LINES = [
  [{ text: 'I work at the' }],
  [{ text: 'intersection', em: true }, { text: ' of' }],
  [{ text: 'Risk, models, and ideas.' }],
]

const HERO_LABEL = 'I work at the intersection of Risk, models, and ideas.'

// Precompute a global stagger index for every character so the reveal
// cascades across line breaks. Pure data — keeps render side-effect free.
let runningIndex = 0
const HERO_SPLIT = HERO_LINES.map((line) =>
  line.map((part) => ({
    em: Boolean(part.em),
    words: part.text.split(' ').map((word) => ({
      word,
      chars: word.split('').map((ch) => {
        runningIndex += 1
        return { ch, i: runningIndex }
      }),
    })),
  })),
)

function Chars({ words }) {
  // Spaces must sit BETWEEN the inline-block word spans (in the parent's
  // inline flow) — whitespace inside an inline-block edge collapses away.
  const out = []
  words.forEach((entry, wi) => {
    if (wi > 0) out.push(' ')
    out.push(
      // eslint-disable-next-line react/no-array-index-key
      <span className="hero-word" key={wi}>
        {entry.chars.map(({ ch, i }, ci) => (
          // eslint-disable-next-line react/no-array-index-key
          <span className="hero-char" style={{ '--i': i }} key={ci}>
            {ch}
          </span>
        ))}
      </span>,
    )
  })
  return out
}

const MARQUEE_ITEMS = [
  'Fixed Income',
  '·',
  'ALM Risk',
  '·',
  'Insurance Analytics',
  '·',
  'AI Workflows',
  '·',
  'Mental Models',
  '·',
  'Writing',
  '·',
]

export default function Hero() {
  const [entered, setEntered] = useState(false)
  const innerRef = useRef(null)

  // Trigger the entrance choreography just after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Cinematic exit: as the hero scrolls away, its content drifts up and fades,
  // handing off to the page below. Composited transform/opacity only, rAF-
  // throttled, and skipped for reduced-motion users (who get a static hero).
  useEffect(() => {
    const el = innerRef.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight || 1
        const p = Math.min(1, window.scrollY / vh)
        el.style.transform = `translateY(${p * 60}px)`
        el.style.opacity = `${1 - p * 0.9}`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="top" className={`hero ${entered ? 'hero--in' : ''}`}>
      <div className="hero-bg" aria-hidden="true">
        <AuroraCanvas className="hero-canvas" />
        <ParticleField className="hero-canvas hero-particles" />
      </div>

      <div className="hero-inner" ref={innerRef}>
        <span className="eyebrow">Portfolio · Notebook · 2026</span>
        <h1 className="hero-title" aria-label={HERO_LABEL}>
          {HERO_SPLIT.map((line, li) => (
            // eslint-disable-next-line react/no-array-index-key
            <span className="hero-line" key={li} aria-hidden="true">
              <span className="hero-line-inner">
                {line.map((part, pi) =>
                  part.em ? (
                    // eslint-disable-next-line react/no-array-index-key
                    <em key={pi}>
                      <Chars words={part.words} />
                    </em>
                  ) : (
                    // eslint-disable-next-line react/no-array-index-key
                    <span key={pi}>
                      <Chars words={part.words} />
                    </span>
                  ),
                )}
              </span>
            </span>
          ))}
        </h1>
        <p className="hero-sub">
          By day, I build models for ALM Risk and fixed income portfolios.
          The rest of the time, I think about how AI changes the way we
          learn, work, and make things — and I write about it here.
        </p>
        <div className="hero-cta">
          <Magnetic>
            <a className="btn btn--primary" href="#about">
              Read more
            </a>
          </Magnetic>
          <Magnetic>
            <a className="btn btn--ghost" href="#projects">
              See projects
            </a>
          </Magnetic>
        </div>
      </div>

      <div className="hero-marquee" aria-hidden="true">
        <div className="hero-marquee-track">
          {/* Sequence rendered twice for a seamless loop */}
          {[0, 1].map((copy) => (
            <span className="hero-marquee-group" key={copy}>
              {MARQUEE_ITEMS.map((item, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={i}>{item}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-line" />
      </div>
    </section>
  )
}
