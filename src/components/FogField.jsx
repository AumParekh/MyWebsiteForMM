import { useEffect, useRef } from 'react'

/*
 * Volumetric fog + depth-particle background for the 3D scene — raw WebGL.
 *
 * A single full-screen fragment shader renders slowly drifting domain-warped
 * fog plus three parallax dust layers that shift at different rates with
 * scroll, so the space reads as vast and deep. Fixed behind all content;
 * opaque, dark, in the Studio Aurora palette.
 *
 * Degradation: prefers-reduced-motion → one static frame; no WebGL → the
 * component is never mounted (Scene3D gates it); hidden tab → skips drawing.
 */

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// one parallax dust layer: sparse glints on a scrolling grid
float dust(vec2 uv, float scale, float speed, float tw){
  vec2 p = uv * scale;
  p.y += u_scroll * speed + u_time * 0.02 * scale;
  vec2 g = floor(p), f = fract(p);
  float h = hash(g);
  float on = step(0.975, h);
  vec2 c = vec2(hash(g + 1.3), hash(g + 2.7));
  float d = length(f - c);
  float dot = on * smoothstep(0.10, 0.0, d);
  dot *= 0.55 + 0.45 * sin(u_time * tw + h * 30.0);
  return dot;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  // drifting volumetric fog
  float t = u_time * 0.03;
  vec2 q = vec2(fbm(p * 1.6 + vec2(t, -t * 0.5)), fbm(p * 1.6 - vec2(t * 0.7, t)));
  float f = fbm(p * 1.8 + q * 1.4 + u_scroll * 0.15);

  vec3 deep = vec3(0.018, 0.022, 0.038);
  vec3 lift = vec3(0.07, 0.085, 0.20);
  vec3 col = mix(deep, lift, smoothstep(0.25, 0.95, f));

  // depth particles: far (dim/blue) → near (bright/white), parallax by scroll
  col += vec3(0.30, 0.34, 0.55) * dust(uv, 18.0, 0.6, 1.3);
  col += vec3(0.55, 0.60, 0.85) * dust(uv, 11.0, 1.4, 0.9);
  col += vec3(0.85, 0.88, 1.0) * dust(uv, 6.5, 2.8, 1.7);

  // gentle indigo bloom drifting near top, and a vignette for depth
  col += vec3(0.10, 0.12, 0.30) * smoothstep(0.7, 0.0, length(uv - vec2(0.5, 0.18))) * 0.5;
  col *= mix(0.65, 1.0, smoothstep(1.25, 0.2, length(uv - 0.5)));

  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.015;
  gl_FragColor = vec4(col, 1.0);
}
`

export default function FogField() {
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

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uScroll = gl.getUniformLocation(program, 'u_scroll')

    const small = Math.min(window.innerWidth, window.innerHeight) < 760
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.0 : 1.25)
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

    let scroll = 0
    let visible = true
    let raf = 0
    const start = performance.now()

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scroll = max > 0 ? window.scrollY / max : 0
    }
    onScroll()

    const draw = (now) => {
      resize()
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.uniform1f(uScroll, scroll)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      draw(now)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(canvas)

    const onResize = () => {
      resize()
      if (reduced) draw(performance.now())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduced) draw(performance.now())
    else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      const lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
    }
  }, [])

  return <canvas ref={canvasRef} className="fog-field" aria-hidden="true" />
}
