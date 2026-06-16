import { useEffect, useRef } from 'react'

/*
 * Ambient "aurora light" that eases toward the pointer — a soft, blurred
 * indigo glow (screen blend) echoing the hero shader and the brand's name.
 * It augments rather than replaces the native cursor, so precision, the text
 * I-beam, and accessibility are untouched. Purely decorative: a fixed overlay
 * with pointer-events: none. Skipped entirely on touch devices and for
 * reduced-motion users, where it never renders any motion.
 */
export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return undefined

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let tx = x
    let ty = y
    let on = false
    let raf = 0

    const onMove = (e) => {
      tx = e.clientX
      ty = e.clientY
      if (!on) {
        on = true
        el.classList.add('cursor-glow--on')
      }
    }
    const onLeave = () => {
      on = false
      el.classList.remove('cursor-glow--on')
    }
    // pointerover fires only on element changes (not every pixel), so the
    // closest() lookup here is cheap.
    const onOver = (e) => {
      const interactive =
        e.target.closest &&
        e.target.closest('a, button, [role="button"], .tilt, summary, label')
      el.classList.toggle('cursor-glow--active', Boolean(interactive))
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      x += (tx - x) * 0.15
      y += (ty - y) * 0.15
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className="cursor-glow" aria-hidden="true">
      <span className="cursor-glow-core" />
    </div>
  )
}
