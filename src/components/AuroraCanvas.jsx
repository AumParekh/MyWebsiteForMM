import { useEffect, useRef } from 'react'

/*
 * Full-bleed WebGL aurora for the hero.
 *
 * A single fragment shader renders a domain-warped fbm "aurora" in the site
 * palette, with a soft glow that trails the cursor and a dimming response to
 * scroll. Dependency-free raw WebGL so the bundle stays tiny.
 *
 * Degradation ladder:
 *   - prefers-reduced-motion → renders exactly one static frame
 *   - WebGL unavailable      → bails out; the CSS gradient behind it shows
 *   - offscreen / hidden tab → skips drawing entirely
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_scroll;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.055;

  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t * 0.7));
  vec2 r = vec2(
    fbm(p * 1.8 + q * 1.6 + vec2(1.7, 9.2) + t * 0.5),
    fbm(p * 1.8 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4)
  );
  float f = fbm(p * 1.6 + r * 1.8);

  vec3 deep = vec3(0.020, 0.027, 0.047);
  vec3 indigo = vec3(0.21, 0.22, 0.55);
  vec3 mint = vec3(0.05, 0.46, 0.41);

  vec3 col = deep;
  col = mix(col, indigo, smoothstep(0.25, 0.95, f) * 0.42);
  col = mix(col, mint, smoothstep(0.40, 1.0, q.y * f) * 0.48);

  vec2 ar = vec2(u_res.x / u_res.y, 1.0);
  float d = distance(uv * ar, u_mouse * ar);
  col += vec3(0.10, 0.34, 0.30) * exp(-d * d * 9.0) * 0.5;

  col *= 1.0 - u_scroll * 0.4;

  float vig = smoothstep(1.3, 0.35, length(uv - 0.5));
  col *= mix(0.7, 1.0, vig);

  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.018;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function AuroraCanvas({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return undefined

    const compile = (type, src) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return undefined

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined
    gl.useProgram(program)

    // One oversized triangle covers the viewport with no seams
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uScroll = gl.getUniformLocation(program, 'u_scroll')

    // Cap pixel ratio: full DPR buys nothing visible on a soft gradient
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()

    const mouse = { x: 0.5, y: 0.62, tx: 0.5, ty: 0.62 }
    let scroll = 0
    let visible = true
    let raf = 0
    const start = performance.now()

    const onMove = (e) => {
      mouse.tx = e.clientX / window.innerWidth
      mouse.ty = 1 - e.clientY / window.innerHeight
    }
    const onScroll = () => {
      scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight))
    }

    const draw = (now) => {
      resize()
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uScroll, scroll)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      draw(now)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    const onResize = () => {
      resize()
      // Static mode never loops, so repaint the still frame after resizing
      if (reduced) draw(performance.now())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduced) {
      // Calm fallback: a single still frame of the aurora
      draw(performance.now())
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      const lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
