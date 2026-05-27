import { useEffect, useMemo, useState } from 'react'
import './App.css'

const LAUNCH_DATE = new Date('2026-09-01T00:00:00Z')

function getTimeLeft(target) {
  const diff = Math.max(0, target.getTime() - Date.now())
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds }
}

function App() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(LAUNCH_DATE))
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(LAUNCH_DATE)), 1000)
    return () => clearInterval(id)
  }, [])

  const units = useMemo(
    () => [
      { label: 'Days', value: timeLeft.days },
      { label: 'Hours', value: timeLeft.hours },
      { label: 'Minutes', value: timeLeft.minutes },
      { label: 'Seconds', value: timeLeft.seconds },
    ],
    [timeLeft],
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div className="page">
      <div className="bg-orb bg-orb--one" />
      <div className="bg-orb bg-orb--two" />
      <div className="bg-grid" />

      <header className="header">
        <div className="logo">
          <span className="logo-mark">M</span>
          <span className="logo-text">MyWebsite</span>
        </div>
      </header>

      <main className="main">
        <span className="eyebrow">Launching soon</span>
        <h1 className="title">
          Something <span className="title-accent">amazing</span>
          <br /> is on the way.
        </h1>
        <p className="subtitle">
          We're putting the finishing touches on a brand new experience.
          Drop your email and we'll let you know the moment we go live.
        </p>

        <ul className="countdown" aria-label="Time until launch">
          {units.map((unit) => (
            <li key={unit.label} className="countdown-cell">
              <span className="countdown-value">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="countdown-label">{unit.label}</span>
            </li>
          ))}
        </ul>

        <form className="signup" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
          />
          <button type="submit">Notify me</button>
        </form>
        <p className={`signup-status ${submitted ? 'is-visible' : ''}`}>
          Thanks! We'll be in touch soon.
        </p>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} MyWebsite</span>
        <nav className="socials">
          <a href="#" aria-label="Twitter">Twitter</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="Contact">Contact</a>
        </nav>
      </footer>
    </div>
  )
}

export default App
