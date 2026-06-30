import { useEffect, useState } from 'react'
import SocraticArticle from './SocraticArticle.jsx'
import FrmPortalArticle from './FrmPortalArticle.jsx'

/*
 * ProjectModal — phase 3e reskin
 *
 * Behaviour preserved from original:
 *   - Esc-to-close, backdrop-click-to-close (panel stopPropagation)
 *   - Body scroll-lock while open
 *   - Copy-share-link with "Link copied" feedback (2.2 s)
 *   - role="dialog", aria-modal, sr-only "Close" text
 *   - Renders the per-project article keyed by project.id
 *     (SocraticArticle for 'socratic', FrmPortalArticle for 'frm-portal')
 *
 * Presentation — bone/ink editorial drawer:
 *   - Backdrop: near-opaque bone, blur(4px), fades in
 *   - Desktop (>768 px): right-aligned drawer, 65 vw, slides in from right
 *   - Mobile (≤768 px): full-width, slides up from bottom
 *   - CSS animation on .project-modal-panel with animation-fill-mode: both
 *   - Reduced-motion: panel appears instantly (no animation)
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
        {/* Sticky actions bar — close + copy-link */}
        <div className="project-modal-actions">
          <button
            type="button"
            className={`project-modal-share${linkCopied ? ' project-modal-share--copied' : ''}`}
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

        {/* Article content */}
        <div id="project-modal-title" className="project-modal-body">
          {project.id === 'socratic' && <SocraticArticle />}
          {project.id === 'frm-portal' && <FrmPortalArticle />}
        </div>
      </div>
    </div>
  )
}
