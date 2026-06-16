import { useEffect, useRef, useState } from 'react'

/*
 * Scroll-triggered reveal. Children rise, unblur and fade in once when they
 * enter the viewport (IntersectionObserver — no scroll listeners).
 * `delay` (ms) staggers siblings. Reduced-motion users see content instantly.
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      // No bottom dead-zone: elements at the very end of the page (e.g. the
      // footer contact block) must still reveal when scrolled fully into view.
      { threshold: 0.12, rootMargin: '0px 0px 0px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'reveal--in' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
