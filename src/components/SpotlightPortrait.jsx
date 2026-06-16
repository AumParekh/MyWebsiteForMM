import { useEffect, useRef } from 'react'

/*
 * About portrait with a cursor-following "spotlight" that reveals a second
 * exposure (aum1.jpg) beneath the first — a quiet nod to the section's
 * "thinker between two worlds" line. Desktop pointer only: on touch or for
 * reduced-motion users the base portrait stands alone, unchanged. Either
 * layer degrades to the "AP" monogram if its image fails to load.
 *
 * The markup, classes, alt text and caption mirror the original portrait
 * exactly; this only adds the masked overlay layer and its pointer wiring.
 */
export default function SpotlightPortrait() {
  const frameRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    const frame = frameRef.current
    const overlay = overlayRef.current
    if (!frame || !overlay) return undefined
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return undefined

    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = frame.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        overlay.style.setProperty('--sx', `${x}%`)
        overlay.style.setProperty('--sy', `${y}%`)
      })
    }
    const onEnter = () => overlay.classList.add('portrait-overlay--on')
    const onLeave = () => overlay.classList.remove('portrait-overlay--on')

    frame.addEventListener('pointermove', onMove)
    frame.addEventListener('pointerenter', onEnter)
    frame.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      frame.removeEventListener('pointermove', onMove)
      frame.removeEventListener('pointerenter', onEnter)
      frame.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="portrait">
      <div className="portrait-deco" aria-hidden="true" />
      <div className="portrait-frame" ref={frameRef}>
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
        <img
          ref={overlayRef}
          className="portrait-overlay"
          src={`${import.meta.env.BASE_URL}aum1.jpg`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.remove()
          }}
        />
      </div>
      <span className="portrait-caption">Aum Parekh</span>
    </div>
  )
}
