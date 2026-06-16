import { useEffect } from 'react'
import { getWormhole } from '../lib/wormhole.js'

/*
 * Wires the wormhole transition to all in-page section navigation. A single
 * capture-phase click listener catches same-page hash links (nav pills, the
 * mobile overlay, hero CTAs, the brand mark) and routes them through the
 * portal: the real scroll happens instantly at the hidden midpoint, so the
 * outgoing section dissolves in and the incoming one emerges out.
 *
 * Project-route links (#project/...) are left alone — App drives those through
 * the same wormhole around its modal state. Renders nothing; the overlay canvas
 * is managed imperatively on <body>.
 */
export default function WormholeProvider() {
  useEffect(() => {
    const wh = getWormhole()

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest && e.target.closest('a[href^="#"]')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || href === '#') return
      const id = href.slice(1)
      if (id.startsWith('project/')) return // modal route handled by App

      const target =
        id === 'top' ? document.body : document.getElementById(id)
      if (!target) return

      e.preventDefault()
      wh.run(() => {
        const root = document.documentElement
        const prev = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto' // jump, don't smooth-scroll under cover
        if (id === 'top') window.scrollTo(0, 0)
        else target.scrollIntoView({ block: 'start' })
        root.style.scrollBehavior = prev
        try {
          window.history.pushState(null, '', href)
        } catch {
          /* ignore */
        }
      })
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
