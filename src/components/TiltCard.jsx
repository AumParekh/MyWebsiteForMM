import { useEffect, useRef } from 'react'

/*
 * Pointer-tracked tilt + glow. Writes CSS custom properties consumed by the
 * stylesheet: --rx/--ry (rotation, deg) and --mx/--my (cursor position, %)
 * for the radial glow. GPU-only transforms; no React re-renders on move.
 * Inert on touch devices and for reduced-motion users.
 */
export default function TiltCard({
  as: Tag = 'div',
  max = 7,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return undefined

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      el.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
      el.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
    }
    const onLeave = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [max])

  return (
    <Tag ref={ref} className={`tilt ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
