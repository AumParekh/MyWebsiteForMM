/*
 * Portal / wormhole transition controller — raw WebGL, no dependencies.
 *
 * A single overlay canvas (appended to <body>, above everything) plays a
 * two-pass render-to-texture wormhole whenever the site navigates between
 * sections or opens/closes the project route:
 *
 *   Pass 1 (scene → FBO): radial/barrel distortion + a spiralling UV twist
 *     toward a vanishing centre, an animated fbm "noise tunnel", and starfield
 *     streaks. Writes RGBA, where alpha is the overlay's compositing mask.
 *   Pass 2 (FBO → screen): per-channel chromatic aberration (RGB sampled at
 *     offset radii) + vignette.
 *
 * The whole thing is driven by one normalised progress value p (0 → 1) eased
 * with easeInOutCubic over ~850ms. The real DOM change (scroll / route) is
 * applied once at the hidden midpoint (p ≈ 0.5): the outgoing view dissolves
 * into the tunnel, the incoming view emerges as the overlay opens back up.
 *
 * Degradation ladder:
 *   - prefers-reduced-motion → no animation; the change is applied instantly
 *   - WebGL unavailable       → a quick ~360ms opacity fade through black
 *   - any internal error      → the navigation still happens (never blocks)
 */

const DURATION = 850 // ms
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

// Pass 1 — the tunnel scene, rendered into a texture.
const SCENE_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_p;
uniform vec2 u_res;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.04; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = v_uv;
  vec2 c = uv - 0.5;
  c.x *= u_res.x / u_res.y;          // aspect-correct so the tunnel stays round

  float coverIn = smoothstep(0.0, 0.4, u_p);
  float coverOut = smoothstep(0.6, 1.0, u_p);
  float tm = coverIn * (1.0 - coverOut);                       // tunnel intensity 0..1..0
  float A = min(smoothstep(0.0, 0.38, u_p), 1.0 - smoothstep(0.62, 1.0, u_p)); // overlay alpha

  // radial / barrel distortion that deepens with the tunnel
  float r0 = length(c);
  vec2 cd = c * (1.0 + r0 * r0 * 1.3 * tm);
  float r = length(cd);
  float ang = atan(cd.y, cd.x);

  // spiralling twist toward the vanishing centre and with progress
  ang += (0.75 * u_p + 0.28 / (r + 0.12)) * (0.6 + tm);

  // tunnel depth coordinate streaking inward
  float depth = 0.30 / (r + 0.06) + u_time * 0.9 + u_p * 3.2;
  float a2 = ang / 6.28318 + 0.5;
  float n = fbm(vec2(a2 * 5.0, depth));

  vec3 deep = vec3(0.02, 0.03, 0.06);
  vec3 glow = vec3(0.34, 0.40, 1.0);
  vec3 col = mix(deep, glow, smoothstep(0.35, 0.95, n));
  col += vec3(0.5, 0.55, 1.0) * pow(max(n, 0.0), 3.0) * 0.7;

  // starfield streaks: sparse angular slots, racing radially inward
  float slot = floor(a2 * 220.0);
  float rnd = fract(sin(slot * 92.17) * 43758.5453);
  float streak = step(0.86, rnd);
  float along = fract(depth * 0.7 + rnd * 10.0);
  col += vec3(0.85, 0.9, 1.0) * streak * pow(along, 6.0) * smoothstep(0.0, 0.4, r) * 1.4;

  // vanishing-point glow
  col += glow * smoothstep(0.22, 0.0, r) * 1.2;

  gl_FragColor = vec4(col, A);
}
`

// Pass 2 — chromatic aberration + vignette on the scene texture.
const POST_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform float u_p;
void main(){
  vec2 uv = v_uv;
  vec2 c = uv - 0.5;
  float r = length(c);
  float coverIn = smoothstep(0.0, 0.4, u_p);
  float coverOut = smoothstep(0.6, 1.0, u_p);
  float tm = coverIn * (1.0 - coverOut);

  vec2 dir = c / (r + 1e-4);
  float ab = (0.004 + 0.022 * tm) * (0.4 + r);

  vec4 g = texture2D(u_scene, uv);
  float rr = texture2D(u_scene, uv + dir * ab).r;
  float bb = texture2D(u_scene, uv - dir * ab).b;
  vec3 col = vec3(rr, g.g, bb);
  col *= 1.0 - r * r * 0.5 * tm;            // vignette
  gl_FragColor = vec4(col, g.a);
}
`

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

class Wormhole {
  constructor() {
    this.running = false
    this.supported = false
    this.reduced = false
    this.canvas = null
    this.fade = null
    this.gl = null
    if (typeof document !== 'undefined') this._init()
  }

  _init() {
    try {
      this.reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      // Plain DOM fade element used as the no-WebGL fallback.
      this.fade = document.createElement('div')
      this.fade.className = 'wormhole-fade'
      this.fade.setAttribute('aria-hidden', 'true')
      document.body.appendChild(this.fade)

      const canvas = document.createElement('canvas')
      canvas.className = 'wormhole-canvas'
      canvas.setAttribute('aria-hidden', 'true')
      this.canvas = canvas
      document.body.appendChild(canvas)

      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      })
      if (!gl) return
      this.gl = gl
      if (this._buildGL()) this.supported = true
    } catch {
      this.supported = false
    }
  }

  _compile(type, src) {
    const gl = this.gl
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s)
      return null
    }
    return s
  }

  _program(fragSrc) {
    const gl = this.gl
    const vs = this._compile(gl.VERTEX_SHADER, VERT)
    const fs = this._compile(gl.FRAGMENT_SHADER, fragSrc)
    if (!vs || !fs) return null
    const p = gl.createProgram()
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.bindAttribLocation(p, 0, 'a_pos')
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
    return p
  }

  _buildGL() {
    const gl = this.gl
    this.scene = this._program(SCENE_FRAG)
    this.post = this._program(POST_FRAG)
    if (!this.scene || !this.post) return false

    this.quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )

    this.uScene = {
      time: gl.getUniformLocation(this.scene, 'u_time'),
      p: gl.getUniformLocation(this.scene, 'u_p'),
      res: gl.getUniformLocation(this.scene, 'u_res'),
    }
    this.uPost = {
      scene: gl.getUniformLocation(this.post, 'u_scene'),
      p: gl.getUniformLocation(this.post, 'u_p'),
    }

    this.fbo = gl.createFramebuffer()
    this.fboTex = gl.createTexture()
    this._w = 0
    this._h = 0
    return true
  }

  _ensureSize() {
    const gl = this.gl
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    const w = Math.max(1, Math.floor(window.innerWidth * dpr))
    const h = Math.max(1, Math.floor(window.innerHeight * dpr))
    if (w === this._w && h === this._h) return
    this._w = w
    this._h = h
    this.canvas.width = w
    this.canvas.height = h
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.fboTex,
      0,
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  _bindQuad(program) {
    const gl = this.gl
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }

  _renderFrame(time, p) {
    const gl = this.gl
    const w = this._w
    const h = this._h

    // Pass 1 → FBO (no blend: store straight, non-premultiplied RGBA)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
    gl.viewport(0, 0, w, h)
    gl.disable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    this._bindQuad(this.scene)
    gl.uniform1f(this.uScene.time, time)
    gl.uniform1f(this.uScene.p, p)
    gl.uniform2f(this.uScene.res, w, h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Pass 2 → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    this._bindQuad(this.post)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
    gl.uniform1i(this.uPost.scene, 0)
    gl.uniform1f(this.uPost.p, p)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // Public: run the transition around an applyChange() callback.
  run(applyChange) {
    const change = () => {
      try {
        if (applyChange) applyChange()
      } catch {
        /* navigation must never throw */
      }
    }

    if (this.reduced || this.running) {
      change()
      return Promise.resolve()
    }
    if (!this.supported || !this.gl) return this._fade(change)

    this.running = true
    return new Promise((resolve) => {
      let applied = false
      let raf = 0
      let safety = 0
      const start = performance.now()

      const finish = () => {
        if (!applied) {
          applied = true
          change()
        }
        cancelAnimationFrame(raf)
        clearTimeout(safety)
        this.canvas.classList.remove('is-active')
        this.running = false
        resolve()
      }

      try {
        this._ensureSize()
        this.canvas.classList.add('is-active')
      } catch {
        finish()
        return
      }

      // Hard safety net: never leave the overlay stuck on screen.
      safety = setTimeout(finish, DURATION + 600)

      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION)
        const p = easeInOutCubic(t)
        if (!applied && p >= 0.5) {
          applied = true
          change()
        }
        try {
          this._renderFrame((now - start) / 1000, p)
        } catch {
          finish()
          return
        }
        if (t >= 1) {
          finish()
          return
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
  }

  // No-WebGL fallback: a quick fade through black.
  _fade(change) {
    if (!this.fade) {
      change()
      return Promise.resolve()
    }
    this.running = true
    return new Promise((resolve) => {
      const el = this.fade
      el.classList.add('is-active')
      let done = false
      const end = () => {
        if (done) return
        done = true
        el.classList.remove('is-active')
        this.running = false
        resolve()
      }
      window.setTimeout(() => {
        change()
        window.setTimeout(end, 200)
      }, 180)
      window.setTimeout(end, 900) // safety
    })
  }
}

let instance = null
export function getWormhole() {
  if (!instance) instance = new Wormhole()
  return instance
}
