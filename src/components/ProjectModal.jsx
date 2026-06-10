import { useEffect, useState } from 'react'
import SocraticArticle from './SocraticArticle.jsx'

/*
 * Full-screen project reader: frosted backdrop, glass panel that slides up on
 * open, sticky action bar (copy share link / close). Esc and backdrop-click
 * dismiss. Behaviour matches the original; only the presentation changed.
 */
export default function ProjectModal({ project, onClose }) {
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2200)
    } catch {
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2200)
      } catch {
        /* noop */
      }
      document.body.removeChild(input)
    }
  }

  return (
    <div
      className="project-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="project-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-modal-actions">
          <button
            type="button"
            className={`project-modal-share ${
              linkCopied ? 'project-modal-share--copied' : ''
            }`}
            onClick={copyShareLink}
          >
            {linkCopied ? 'Link copied' : 'Copy link'}
          </button>
          <button
            type="button"
            className="project-modal-close"
            onClick={onClose}
            aria-label="Close project"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div id="project-modal-title">
          {project.id === 'socratic' && <SocraticArticle />}
        </div>
      </div>
    </div>
  )
}
