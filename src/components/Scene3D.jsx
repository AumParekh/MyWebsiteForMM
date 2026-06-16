import { useEffect, useState } from 'react'
import FogField from './FogField.jsx'

/*
 * Turns the flat page into a 3D space you scroll through — without sacrificing
 * the real DOM (text stays selectable, accessible, and crawlable).
 *
 * Each .section's content (.section-inner) becomes a plane suspended in a
 * per-section perspective. Scroll position is the camera path parameter: a
 * section rises out of depth, banks, straightens to face the camera as it
 * reaches centre (pull-focus), then recedes and dims into darkness as the
 * camera flies past. A key-light highlight and opacity track that distance, so
 * sections "light up" on approach. Each plane idle-floats, and on fine pointers
 * tilts toward the cursor with a magnetic spring. A raw-WebGL fog field sits
 * behind it all.
 *
 * Fallback: if WebGL is unavailable or prefers-reduced-motion is set, none of
 * this engages — the original flat, scrollable layout is left untouched.
 */
function detectSupport() {
  try {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export default function Scene3D() {
  const [enabled] = useState(detectSupport)

  useEffect(() => {
    if (!enabled) return undefined
    const site = document.querySelector('.site')
    if (!site) return undefined

    const sections = Array.from(site.querySelectorAll('main .section'))
    if (!sections.length) return undefined

    site.classList.add('is-3d')
    const fine = window.matchMedia('(pointer: fine)').matches
    const small = Math.min(window.innerWidth, window.innerHeight) < 760
    const DEPTH = small ? 360 : 640
    const BANK = small ? 0 : 9

    const state = sections.map((el, i) => ({
      el,
      inner: el.querySelector('.section-inner') || el,
      bank: i % 2 === 0 ? 1 : -1,
      tRX: 0,
      tRY: 0,
      rx: 0,
      ry: 0,
    }))

    // Cursor tilt (raycast-style): map pointer position within a plane to a
    // target tilt, sprung toward in the loop. Fine pointers only.
    const cleanups = []
    if (fine) {
      state.forEach((s) => {
        const onMove = (e) => {
          const r = s.inner.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          s.tRY = px * 10
          s.tRX = -py * 8
        }
        const onLeave = () => {
          s.tRX = 0
          s.tRY = 0
        }
        s.inner.addEventListener('pointermove', onMove)
        s.inner.addEventListener('pointerleave', onLeave)
        cleanups.push(() => {
          s.inner.removeEventListener('pointermove', onMove)
          s.inner.removeEventListener('pointerleave', onLeave)
        })
      })
    }

    let raf = 0
    const start = performance.now()

    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const time = (now - start) / 1000
      const center = window.innerHeight / 2

      for (const s of state) {
        const r = s.el.getBoundingClientRect()
        const cy = r.top + r.height / 2
        const c = (cy - center) / window.innerHeight // ≈ -1 (above) .. 1 (below)
        const ac = Math.min(1, Math.abs(c))
        const centerness = 1 - Math.min(1, ac * 1.25) // 1 at focus, 0 far off

        // spring the cursor tilt
        s.rx += (s.tRX - s.rx) * 0.08
        s.ry += (s.tRY - s.ry) * 0.08

        const tz = -DEPTH * ac
        const idle = Math.sin(time * 0.8 + s.bank * 2.0) * 4 * (0.4 + centerness * 0.6)
        const ty = c * (small ? 20 : 38) + idle
        const rX = -c * (small ? 5 : 8) + s.rx
        const rY = s.bank * (1 - centerness) * BANK + s.ry

        s.inner.style.transform =
          `translate3d(0, ${ty.toFixed(2)}px, ${tz.toFixed(1)}px) ` +
          `rotateX(${rX.toFixed(2)}deg) rotateY(${rY.toFixed(2)}deg)`
        s.inner.style.opacity = (0.4 + centerness * 0.6).toFixed(3)
        s.inner.style.setProperty('--lit', (0.3 + centerness * 0.7).toFixed(3))
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      cleanups.forEach((fn) => fn())
      site.classList.remove('is-3d')
      state.forEach((s) => {
        s.inner.style.transform = ''
        s.inner.style.opacity = ''
        s.inner.style.removeProperty('--lit')
      })
    }
  }, [enabled])

  return enabled ? <FogField /> : null
}
