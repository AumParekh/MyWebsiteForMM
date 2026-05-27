import { useEffect, useState } from 'react'
import './App.css'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#projects', label: 'Projects' },
  { href: '#writing', label: 'Writing' },
  { href: '#ai', label: 'AI & Workflows' },
  { href: '#models', label: 'Mental Models' },
]

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site">
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
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
          <span />
        </button>
        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Portfolio · Notebook · 2026</span>
            <h1 className="hero-title">
              I work at the
              <br />
              <em>intersection</em> of
              <br />
              Risk, models, <br />
              and ideas.
            </h1>
            <p className="hero-sub">
              By day, I build models for ALM Risk and fixed income portfolios.
              The rest of the time, I think about how AI changes the way we
              learn, work, and make things — and I write about it here.
            </p>
            <div className="hero-cta">
              <a className="btn btn--primary" href="#about">
                Read more
              </a>
              <a className="btn btn--ghost" href="#projects">
                See projects
              </a>
            </div>
          </div>
          <div className="hero-photo">
            <div className="hero-photo-deco" aria-hidden="true" />
            <div className="hero-photo-frame">
              <img
                src="./aum.jpg"
                alt="Aum Parekh"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="hero-photo-fallback" aria-hidden="true">
                AP
              </span>
            </div>
            <span className="hero-photo-caption">Aum Parekh</span>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true">
          <span>Fixed Income</span>
          <span>·</span>
          <span>ALM Risk</span>
          <span>·</span>
          <span>Insurance Analytics</span>
          <span>·</span>
          <span>AI Workflows</span>
          <span>·</span>
          <span>Mental Models</span>
          <span>·</span>
          <span>Writing</span>
        </div>
      </section>

      <section id="about" className="section section--light">
        <div className="section-inner section-inner--split">
          <div className="section-head">
            <span className="section-label">About</span>
            <h2 className="section-title">
              A thinker between <em>two worlds.</em>
            </h2>
          </div>
          <div className="prose">
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
          </div>
        </div>
      </section>

      <section id="projects" className="section">
        <div className="section-inner">
          <div className="section-head section-head--row">
            <div>
              <span className="section-label">Projects</span>
              <h2 className="section-title">
                Things I've built, shipped, or <em>hacked together.</em>
              </h2>
            </div>
            <p className="section-lede">
              Usually to solve a real problem, sometimes just to see if it was
              possible. Each project comes with context: what the problem was,
              what I tried, what I'd do differently. Not just a demo — a log of
              how thinking happened.
            </p>
          </div>
          <div className="card-grid">
            <article className="card">
              <span className="card-tag">In progress</span>
              <h3>Project one</h3>
              <p>
                Short description of what it does, what problem it solves, and
                why it was worth building.
              </p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
            </article>
            <article className="card">
              <span className="card-tag">In progress</span>
              <h3>Project two</h3>
              <p>
                Short description of what it does, what problem it solves, and
                why it was worth building.
              </p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
            </article>
            <article className="card">
              <span className="card-tag">In progress</span>
              <h3>Project three</h3>
              <p>
                Short description of what it does, what problem it solves, and
                why it was worth building.
              </p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
            </article>
          </div>
        </div>
      </section>

      <section id="writing" className="section section--light">
        <div className="section-inner">
          <div className="section-head section-head--row">
            <div>
              <span className="section-label">Writing</span>
              <h2 className="section-title">
                Pieces, when something's <em>worth saying.</em>
              </h2>
            </div>
            <p className="section-lede">
              Finance concepts that deserve better explanations, mental models
              worth borrowing from other fields, and what it actually looks
              like to use AI as a daily work tool. No newsletter cadence to
              keep up with — just pieces when something's worth saying.
            </p>
          </div>
          <ul className="writing-list">
            <li>
              <span className="writing-date">Soon</span>
              <span className="writing-title">First essay — in draft.</span>
              <span className="writing-meta">Coming shortly</span>
            </li>
            <li>
              <span className="writing-date">Soon</span>
              <span className="writing-title">
                A note on duration, convexity, and why most explanations are
                bad.
              </span>
              <span className="writing-meta">Coming shortly</span>
            </li>
            <li>
              <span className="writing-date">Soon</span>
              <span className="writing-title">
                What a year of building with AI actually changed.
              </span>
              <span className="writing-meta">Coming shortly</span>
            </li>
          </ul>
        </div>
      </section>

      <section id="ai" className="section">
        <div className="section-inner section-inner--split">
          <div className="section-head">
            <span className="section-label">AI &amp; Workflows</span>
            <h2 className="section-title">
              Running notes from a <em>daily user.</em>
            </h2>
          </div>
          <div className="prose">
            <p>
              I use AI extensively — for research, for writing, for building
              tools, for thinking through hard problems out loud. This section
              is a running document of what's actually worked.
            </p>
            <p>
              Not productivity advice. More like: here's a workflow, here's why
              it exists, here's what it replaced.
            </p>
            <div className="pill-row">
              <span className="pill">Research</span>
              <span className="pill">Writing</span>
              <span className="pill">Code</span>
              <span className="pill">Modeling</span>
              <span className="pill">Thinking out loud</span>
            </div>
          </div>
        </div>
      </section>

      <section id="models" className="section section--accent">
        <div className="section-inner">
          <span className="section-label section-label--accent">
            Mental Models
          </span>
          <h2 className="section-title section-title--center">
            Good mental models are <em>portable.</em>
          </h2>
          <p className="section-lede section-lede--center">
            A concept from insurance pricing helps you understand software
            architecture. A framework from options theory clarifies a
            negotiation. I collect and stress-test these across domains. This
            is where they live.
          </p>
          <div className="quote-grid">
            <blockquote className="quote">
              <p>
                "The map is not the territory — but a better map still beats no
                map at all."
              </p>
            </blockquote>
            <blockquote className="quote">
              <p>
                "Most expensive lessons in finance are about what you assumed
                away."
              </p>
            </blockquote>
            <blockquote className="quote">
              <p>
                "Borrow models freely; pay them back with better examples."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-tag">
            Built with curiosity. Opinions are my own.
            <br />
            <em>Work in progress — like everything worth doing.</em>
          </p>
          <div className="footer-meta">
            <p className="footer-copy">© {new Date().getFullYear()} Aum Parekh</p>
            <nav className="footer-links" aria-label="Social">
              <a href="#" aria-label="Email">Email</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
              <a href="#" aria-label="Twitter">Twitter</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
