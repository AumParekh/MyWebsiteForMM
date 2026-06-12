import Reveal from './Reveal.jsx'
import TiltCard from './TiltCard.jsx'
import { PROJECTS } from '../data/projects.jsx'

/*
 * Content sections. All copy is preserved verbatim from the original site —
 * these components only change layout, motion and styling.
 */

export function About() {
  return (
    <section id="about" className="section section--light">
      <div className="section-inner section-inner--split">
        <Reveal className="section-head">
          <span className="section-label">About</span>
          <h2 className="section-title">
            A thinker between <em>two worlds.</em>
          </h2>
          <div className="portrait">
            <div className="portrait-deco" aria-hidden="true" />
            <div className="portrait-frame">
              <span className="portrait-fallback" aria-hidden="true">
                AP
              </span>
              <img
                src={`${import.meta.env.BASE_URL}aum.jpg`}
                alt="Aum Parekh"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <span className="portrait-caption">Aum Parekh</span>
          </div>
        </Reveal>
        <Reveal className="prose" delay={120}>
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
    </section>
  )
}

export function Projects({ onOpenProject }) {
  return (
    <section id="projects" className="section">
      <div className="section-inner">
        <div className="section-head section-head--row">
          <Reveal>
            <span className="section-label">Projects</span>
            <h2 className="section-title">
              Things I've built, shipped, or <em>hacked together.</em>
            </h2>
          </Reveal>
          <Reveal as="p" className="section-lede" delay={120}>
            Usually to solve a real problem, sometimes just to see if it was
            possible. Each project comes with context: what the problem was,
            what I tried, what I'd do differently. Not just a demo — a log of
            how thinking happened.
          </Reveal>
        </div>
        <div className="project-grid">
          {PROJECTS.map((project) => (
            <Reveal key={project.id}>
              <TiltCard
                as="button"
                type="button"
                className="project-card"
                onClick={() => onOpenProject(project)}
              >
                <div className="project-card-icon">{project.icon}</div>
                <span className="project-card-tag">{project.tag}</span>
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-summary">{project.summary}</p>
                <span className="project-card-cta">
                  {project.cta} <span aria-hidden="true">→</span>
                </span>
              </TiltCard>
            </Reveal>
          ))}
          <Reveal delay={100}>
            <TiltCard as="article" className="card card--placeholder">
              <span className="card-tag">More soon</span>
              <h3>Project two</h3>
              <p>
                Another writeup in progress. Each one starts as a real problem
                worth thinking through in public.
              </p>
            </TiltCard>
          </Reveal>
          <Reveal delay={200}>
            <TiltCard as="article" className="card card--placeholder">
              <span className="card-tag">More soon</span>
              <h3>Project three</h3>
              <p>
                Another writeup in progress. Each one starts as a real problem
                worth thinking through in public.
              </p>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Writing() {
  return (
    <section id="writing" className="section section--light">
      <div className="section-inner">
        <div className="section-head section-head--row">
          <Reveal>
            <span className="section-label">Writing</span>
            <h2 className="section-title">
              Pieces, when something's <em>worth saying.</em>
            </h2>
          </Reveal>
          <Reveal as="p" className="section-lede" delay={120}>
            Finance concepts that deserve better explanations, mental models
            worth borrowing from other fields, and what it actually looks
            like to use AI as a daily work tool. No newsletter cadence to
            keep up with — just pieces when something's worth saying.
          </Reveal>
        </div>
        <ul className="writing-list">
          <Reveal as="li">
            <span className="writing-date">Soon</span>
            <span className="writing-title">First essay — in draft.</span>
            <span className="writing-meta">Coming shortly</span>
          </Reveal>
          <Reveal as="li" delay={90}>
            <span className="writing-date">Soon</span>
            <span className="writing-title">
              A note on duration, convexity, and why most explanations are
              bad.
            </span>
            <span className="writing-meta">Coming shortly</span>
          </Reveal>
          <Reveal as="li" delay={180}>
            <span className="writing-date">Soon</span>
            <span className="writing-title">
              What a year of building with AI actually changed.
            </span>
            <span className="writing-meta">Coming shortly</span>
          </Reveal>
        </ul>
      </div>
    </section>
  )
}

export function AiWorkflows() {
  return (
    <section id="ai" className="section">
      <div className="section-inner section-inner--split">
        <Reveal className="section-head">
          <span className="section-label">AI &amp; Workflows</span>
          <h2 className="section-title">
            Running notes from a <em>daily user.</em>
          </h2>
        </Reveal>
        <Reveal className="prose" delay={120}>
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
        </Reveal>
      </div>
    </section>
  )
}

export function MentalModels() {
  return (
    <section id="models" className="section section--accent">
      <div className="section-inner">
        <Reveal>
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
        </Reveal>
        <div className="quote-grid">
          <Reveal as="blockquote" className="quote">
            <p>
              "The map is not the territory — but a better map still beats no
              map at all."
            </p>
          </Reveal>
          <Reveal as="blockquote" className="quote" delay={110}>
            <p>
              "Most expensive lessons in finance are about what you assumed
              away."
            </p>
          </Reveal>
          <Reveal as="blockquote" className="quote" delay={220}>
            <p>
              "Borrow models freely; pay them back with better examples."
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Reveal as="p" className="footer-tag">
          Built with curiosity. Opinions are my own.
          <br />
          <em>Work in progress — like everything worth doing.</em>
        </Reveal>
        <Reveal className="footer-meta" delay={100}>
          <p className="footer-copy">© {new Date().getFullYear()} Aum Parekh</p>
          <nav className="footer-links" aria-label="Social">
            <a href="mailto:aumparekhh@gmail.com">Email</a>
            <a
              href="https://www.linkedin.com/in/aum-parekh"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </nav>
        </Reveal>
      </div>
    </footer>
  )
}
