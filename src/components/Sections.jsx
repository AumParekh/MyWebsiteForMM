import Reveal from './Reveal.jsx'
import { PROJECTS } from '../data/projects.jsx'

/*
 * Sections — Phase 3d
 *
 * All six section exports: About, Projects, Writing, AiWorkflows, MentalModels, Footer.
 *
 * Design rules:
 *   - Only --bone / --ink as colours. Hairlines at rgba(25,25,25,0.2).
 *     Faint text at rgba(25,25,25,0.45).
 *   - Every element defaults to its final VISIBLE state in CSS (no hidden-by-default
 *     tricks). Reveal is a no-op stub that Phase 3f will upgrade.
 *   - ( ) portrait treatment follows the Nav/Hero pattern: paren glyphs flanking <img>.
 *   - Image paths: `${import.meta.env.BASE_URL}<file>`.
 *   - All prose copy is VERBATIM from the original Sections.jsx / projects.jsx.
 */

/* ─── shared ordinal helper ───────────────────────────────────────────────── */
/*
 * Renders the ( 0N ) ordinal label: Kumbh Sans 700, uppercase, 0.75rem, ls 0.2em.
 * aria-hidden so screen readers skip the decorative counter.
 */
function Ordinal({ label }) {
  return (
    <span className="sec-ordinal" aria-hidden="true">
      ( {label} )
    </span>
  )
}

/* ─── About ──────────────────────────────────────────────────────────────── */
export function About() {
  return (
    <section id="about" className="sec sec--split" aria-label="About">
      {/* LEFT: ordinal + headline + bio */}
      <div className="sec-left">
        <Reveal>
          <Ordinal label="01" />
          <h2 className="sec-display">
            FIXED INCOME<br />
            &amp; INSURANCE
          </h2>
        </Reveal>

        {/* Serif bio — three paragraphs verbatim */}
        <Reveal delay={120} className="sec-bio">
          <p>
            I'm Aum. I work in fixed income and insurance analytics — the
            kind of work that lives in spreadsheets, actuarial assumptions,
            and cash flow models most people never see.
          </p>
          <p>
            But I'm equally interested in the meta layer: how knowledge gets
            built, how mental models spread across disciplines, and what
            happens when AI becomes a genuine thinking partner rather than
            just a search engine.
          </p>
          <p>
            This site is where those two worlds meet. You'll find writeups on
            financial concepts I've had to really dig into, projects I've
            built, workflows that actually changed how I work, and honest
            notes on using AI as a tool for thinking — not just a shortcut.
          </p>
        </Reveal>
      </div>

      {/* RIGHT: ( portrait ) */}
      <Reveal className="sec-right" delay={80}>
        <div className="sec-portrait-frame">
          <span className="sec-paren" aria-hidden="true">(</span>
          <img
            src={`${import.meta.env.BASE_URL}aum-nav.webp`}
            alt="Aum Parekh — warm, direct eye contact"
            className="sec-portrait-img"
          />
          <span className="sec-paren" aria-hidden="true">)</span>
        </div>
      </Reveal>
    </section>
  )
}

/* ─── Projects ───────────────────────────────────────────────────────────── */
export function Projects({ onOpenProject }) {
  return (
    <section id="projects" className="sec" aria-label="Projects">
      <Reveal>
        <Ordinal label="02" />
        <h2 className="sec-display">WORK</h2>
      </Reveal>

      {/* One project row per entry in PROJECTS */}
      {PROJECTS.map((project) => (
        <Reveal key={project.id} className="proj-row">
          {/* LEFT: ( portrait ) */}
          <div className="proj-portrait-frame">
            <span className="sec-paren sec-paren--proj" aria-hidden="true">(</span>
            <img
              src={`${import.meta.env.BASE_URL}aum-socratic.webp`}
              alt="Aum at a desk with a notebook"
              className="proj-portrait-img"
            />
            <span className="sec-paren sec-paren--proj" aria-hidden="true">)</span>
          </div>

          {/* RIGHT: tag + title + summary + CTA */}
          <div className="proj-info">
            <span className="proj-tag">{project.tag}</span>
            <h3 className="proj-title">{project.title}</h3>
            <p className="proj-summary">{project.summary}</p>
            <button
              type="button"
              className="proj-cta"
              onClick={() => onOpenProject(project)}
            >
              <span className="proj-cta-text">{project.cta}</span>
              <span className="proj-cta-arrow" aria-hidden="true"> →</span>
            </button>
          </div>
        </Reveal>
      ))}

      {/* "More coming" placeholder row */}
      <Reveal delay={60} className="proj-placeholder-row" aria-hidden="true">
        <span className="proj-placeholder-paren">( — )</span>
        <span className="proj-placeholder-label">More coming</span>
      </Reveal>
    </section>
  )
}

/* ─── Writing ────────────────────────────────────────────────────────────── */
export function Writing() {
  return (
    <section id="writing" className="sec" aria-label="Writing">
      <Reveal>
        <Ordinal label="03" />
        <h2 className="sec-display">WRITING</h2>
      </Reveal>

      {/* Three forthcoming writing rows */}
      <div className="writing-list" role="list">
        <Reveal className="writing-row" role="listitem">
          <span className="writing-date">( Soon )</span>
          <span className="writing-title">First essay — in draft.</span>
          <span className="writing-meta">Coming shortly</span>
        </Reveal>

        <Reveal className="writing-row" delay={90} role="listitem">
          <span className="writing-date">( Soon )</span>
          <span className="writing-title">
            A note on duration, convexity, and why most explanations are bad.
          </span>
          <span className="writing-meta">Coming shortly</span>
        </Reveal>

        <Reveal className="writing-row" delay={180} role="listitem">
          <span className="writing-date">( Soon )</span>
          <span className="writing-title">
            What a year of building with AI actually changed.
          </span>
          <span className="writing-meta">Coming shortly</span>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── AI & Workflows ─────────────────────────────────────────────────────── */
export function AiWorkflows() {
  return (
    <section id="ai" className="sec sec--split" aria-label="AI and Workflows">
      {/* LEFT: ordinal + headline + two paragraphs */}
      <div className="sec-left">
        <Reveal>
          <Ordinal label="04" />
          <h2 className="sec-display">AI &amp; TOOLS</h2>
        </Reveal>

        {/* Two AI paragraphs verbatim */}
        <Reveal delay={120} className="sec-bio">
          <p>
            I use AI extensively — for research, for writing, for building
            tools, for thinking through hard problems out loud. This section
            is a running document of what's actually worked.
          </p>
          <p>
            Not productivity advice. More like: here's a workflow, here's why
            it exists, here's what it replaced.
          </p>
        </Reveal>
      </div>

      {/* RIGHT: ( ) pill labels, stacked */}
      <Reveal className="sec-right ai-pills" delay={80}>
        {['Research', 'Writing', 'Code', 'Modeling', 'Thinking out loud'].map(
          (label) => (
            <span key={label} className="ai-pill">
              ( {label} )
            </span>
          )
        )}
      </Reveal>
    </section>
  )
}

/* ─── Mental Models ──────────────────────────────────────────────────────── */
export function MentalModels() {
  return (
    <section id="models" className="sec sec--center" aria-label="Mental Models">
      <Reveal>
        <Ordinal label="05" />
        <h2 className="sec-display sec-display--center">MENTAL MODELS</h2>
      </Reveal>

      {/* Three quotes verbatim — large centered Bodoni Moda italic */}
      <Reveal as="blockquote" className="mm-quote" delay={60}>
        <p>
          "The map is not the territory — but a better map still beats no
          map at all."
        </p>
      </Reveal>

      <Reveal as="blockquote" className="mm-quote" delay={140}>
        <p>
          "Most expensive lessons in finance are about what you assumed
          away."
        </p>
      </Reveal>

      <Reveal as="blockquote" className="mm-quote" delay={220}>
        <p>
          "Borrow models freely; pay them back with better examples."
        </p>
      </Reveal>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="site-footer" aria-label="Footer">
      <div className="footer-inner">
        {/* LEFT: wordmark */}
        <Reveal className="footer-wordmark">
          aum.
        </Reveal>

        {/* RIGHT: tagline + copyright + social links */}
        <Reveal className="footer-right" delay={80}>
          <p className="footer-tagline">
            Built with curiosity. Opinions are my own.
            <br />
            <em>Work in progress — like everything worth doing.</em>
          </p>
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} Aum Parekh
          </p>
          <nav className="footer-links" aria-label="Social">
            <a
              href="mailto:aumparekhh@gmail.com"
              className="footer-link"
            >
              Email
            </a>
            <a href="tel:+919321130281" className="footer-link">
              Phone
            </a>
            <a
              href="https://www.linkedin.com/in/aum-parekh"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LinkedIn
            </a>
          </nav>
        </Reveal>
      </div>
    </footer>
  )
}
