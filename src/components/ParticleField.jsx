import { useEffect, useRef } from 'react'

/*
 * 3D GPU particle galaxy for the hero — raw WebGL, no dependencies.
 *
 * ~16k points are seeded onto a spiral-galaxy disk in real 3D space, then
 * rotated and perspective-projected entirely in the vertex shader. Additive
 * blending makes them glow; colour runs warm-white at the core to deep indigo
 * at the rim, matching the Studio Aurora palette. The disk spins on its axis,
 * tilts toward the cursor (parallax), flies in from the centre on load, and
 * dims as the hero scrolls away.
 *
 * Degradation ladder:
 *   - prefers-reduced-motion → one static, fully-formed frame, no spin
 *   - WebGL unavailable      → bails out; the aurora / CSS gradient shows
 *   - small screens          → fewer points, lower DPR
 *   - offscreen / hidden tab → skips drawing
 */

const VERT = `
precision highp float;
attribute vec3 a_pos;
attribute float a_seed;
uniform float u_time;
uniform float u_spin;
uniform float u_tiltX;
uniform float u_yaw;
uniform float u_intro;
uniform float u_aspect;
uniform float u_dpr;
varying float v_seed;
varying float v_depth;

mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }

void main(){
  vec3 p = a_pos;
  // breathing vertical drift so the field feels alive
  p.y += sin(u_time * 0.6 + a_seed * 12.0) * 0.03;
  // intro: points rush out from the core
  p *= u_intro;
  // model spin, fixed disk tilt, cursor yaw
  p = rotY(u_spin) * p;
  p = rotX(u_tiltX) * p;
  p = rotY(u_yaw) * p;
  // nudge the bright core up so it sits behind the eyebrow, not the headline
  p.y += 0.28;
  // camera + perspective
  p.z += 4.2;
  float focal = 2.0;
  vec2 proj = vec2(p.x / u_aspect, p.y) * focal / p.z;
  gl_Position = vec4(proj, 0.0, 1.0);
  gl_PointSize = clamp(focal * 11.0 * u_dpr / p.z * (0.45 + a_seed * 0.9) * u_intro, 0.0, 14.0 * u_dpr);
  v_seed = a_seed;
  v_depth = p.z;
}
`

const FRAG = `
precision highp float;
varying float v_seed;
varying float v_depth;
uniform float u_scroll;

void main(){
  // soft round sprite
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(c));
  a *= a;

  vec3 inner = vec3(0.86, 0.89, 1.0);
  vec3 mid   = vec3(0.43, 0.48, 1.0);
  vec3 outer = vec3(0.20, 0.13, 0.46);
  vec3 col = mix(inner, mid, smoothstep(0.0, 0.5, v_seed));
  col = mix(col, outer, smoothstep(0.5, 1.0, v_seed));

  float depthFade = smoothstep(7.0, 2.6, v_depth);
  float alpha = a * (0.2 + 0.65 * depthFade) * (1.0 - u_scroll * 0.85);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`

export default function ParticleField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return undefined

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s)
        return null
      }
      return s
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

    // ---- generate the galaxy ------------------------------------------------
    const small = Math.min(window.innerWidth, window.innerHeight) < 760
    const COUNT = small ? 6000 : 16000
    const ARMS = 3
    const RADIUS = 2.0
    const SPIN = 1.05
    const SPREAD = 0.45
    const POW = 2.6

    const data = new Float32Array(COUNT * 4)
    for (let i = 0; i < COUNT; i += 1) {
      const r = Math.pow(Math.random(), 1.5) * RADIUS
      const branch = ((i % ARMS) / ARMS) * Math.PI * 2
      const ang = branch + r * SPIN
      const sign = () => (Math.random() < 0.5 ? 1 : -1)
      const rx = Math.pow(Math.random(), POW) * sign() * SPREAD * r
      const ry = Math.pow(Math.random(), POW) * sign() * SPREAD * r * 0.4
      const rz = Math.pow(Math.random(), POW) * sign() * SPREAD * r
      data[i * 4 + 0] = Math.cos(ang) * r + rx
      data[i * 4 + 1] = ry
      data[i * 4 + 2] = Math.sin(ang) * r + rz
      data[i * 4 + 3] = r / RADIUS // seed → normalised radius (drives colour/size)
    }

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

    const aPos = gl.getAttribLocation(program, 'a_pos')
    const aSeed = gl.getAttribLocation(program, 'a_seed')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(aSeed)
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 16, 12)

    const u = (name) => gl.getUniformLocation(program, name)
    const uTime = u('u_time')
    const uSpin = u('u_spin')
    const uTiltX = u('u_tiltX')
    const uYaw = u('u_yaw')
    const uIntro = u('u_intro')
    const uAspect = u('u_aspect')
    const uDpr = u('u_dpr')
    const uScroll = u('u_scroll')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE) // additive glow
    gl.clearColor(0, 0, 0, 0)

    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5)
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

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    let scroll = 0
    let spin = 0
    let intro = reduced ? 1 : 0
    let visible = true
    let raf = 0
    const start = performance.now()

    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onScroll = () => {
      scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight))
    }

    const draw = (now) => {
      resize()
      const t = (now - start) / 1000
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      if (!reduced) {
        spin += 0.0016
        intro += (1 - intro) * 0.03 // eased fly-in
      }
      gl.uniform1f(uTime, t)
      gl.uniform1f(uSpin, spin)
      gl.uniform1f(uTiltX, -1.02 + mouse.y * 0.22)
      gl.uniform1f(uYaw, mouse.x * 0.5)
      gl.uniform1f(uIntro, intro)
      gl.uniform1f(uAspect, canvas.width / canvas.height)
      gl.uniform1f(uDpr, dpr)
      gl.uniform1f(uScroll, scroll)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.POINTS, 0, COUNT)
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
      if (reduced) draw(performance.now())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduced) {
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
