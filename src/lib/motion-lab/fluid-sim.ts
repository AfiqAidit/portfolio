/**
 * Lightweight stable-fluids style dye simulation for /demos/motion-lab.
 * Coordinates: splat x,y in 0..1 with origin top-left (converted internally).
 */

export type FluidSplat = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /** RGB 0..1, default purple-blue */
  color?: [number, number, number];
};

type GL = WebGL2RenderingContext;

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
};

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = (body: string) => `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uTexelSize;
uniform float uAspect;
${body}`;

const DISPLAY = FRAG(`
uniform sampler2D uTexture;
void main() {
  vec3 c = texture(uTexture, vUv).rgb;
  c = pow(c, vec3(0.9));
  outColor = vec4(c, 1.0);
}`);

const SPLAT = FRAG(`
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 base = texture(uTarget, vUv).rgb;
  float d = exp(-dot(p, p) / uRadius);
  outColor = vec4(base + uColor * d, 1.0);
}`);

const ADVECT = FRAG(`
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float uDissipation;
uniform float uDt;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy;
  vec3 col = texture(uSource, coord).rgb;
  outColor = vec4(col * uDissipation, 1.0);
}`);

const DIVERGENCE = FRAG(`
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
  float div = 0.5 * (R - L + T - B);
  outColor = vec4(div, 0.0, 0.0, 1.0);
}`);

const PRESSURE = FRAG(`
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float C = texture(uPressure, vUv).x;
  float div = texture(uDivergence, vUv).x;
  float p = (L + R + B + T - div) * 0.25;
  outColor = vec4(p, 0.0, 0.0, 1.0);
}`);

const GRAD_SUB = FRAG(`
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel -= vec2(R - L, T - B) * 0.5;
  outColor = vec4(vel, 0.0, 1.0);
}`);

const CURL = FRAG(`
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
  float vort = R - L - T + B;
  outColor = vec4(vort, 0.0, 0.0, 1.0);
}`);

const VORTICITY = FRAG(`
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = vec2(abs(T) - abs(B), abs(R) - abs(L));
  force *= 1.0 / length(force + 1e-5);
  force *= uCurlStrength * C;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel += force * uDt;
  outColor = vec4(vel, 0.0, 1.0);
}`);

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "compile error";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function link(gl: GL, vert: string, frag: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!prog) throw new Error("program");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? "link error";
    gl.deleteProgram(prog);
    throw new Error(log);
  }
  return prog;
}

function createFBO(gl: GL, w: number, h: number, internal: number, format: number, type: number): FBO {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error("fbo");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, fbo, width: w, height: h };
}

function createDouble(
  gl: GL,
  w: number,
  h: number,
  internal: number,
  format: number,
  type: number,
): [FBO, FBO] {
  return [createFBO(gl, w, h, internal, format, type), createFBO(gl, w, h, internal, format, type)];
}

function swapPair<T>(pair: [T, T]) {
  const t = pair[0];
  pair[0] = pair[1];
  pair[1] = t;
}

export function createFluidSimulation(
  canvas: HTMLCanvasElement,
  simResolution?: number,
  dyeResolution?: number,
): FluidSimulation | null {
  try {
    return new FluidSimulation(canvas, simResolution, dyeResolution);
  } catch {
    return null;
  }
}

export class FluidSimulation {
  private gl: GL;
  private quad: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private displayProg: WebGLProgram;
  private splatProg: WebGLProgram;
  private advectProg: WebGLProgram;
  private divProg: WebGLProgram;
  private pressProg: WebGLProgram;
  private gradProg: WebGLProgram;
  private curlProg: WebGLProgram;
  private vortProg: WebGLProgram;

  private dye: [FBO, FBO];
  private velocity: [FBO, FBO];
  private pressure: [FBO, FBO];
  private divergence: FBO;
  private curl: FBO;

  private simW = 0;
  private simH = 0;
  private dyeW = 0;
  private dyeH = 0;
  private aspect = 1;
  private splatQueue: FluidSplat[] = [];
  private idleFrames = 0;

  readonly supported: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    private simResolution = 128,
    private dyeResolution = 512,
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      this.supported = false;
      throw new Error("WebGL2 unavailable");
    }
    this.gl = gl;
    this.supported = true;

    this.displayProg = link(gl, VERT, DISPLAY);
    this.splatProg = link(gl, VERT, SPLAT);
    this.advectProg = link(gl, VERT, ADVECT);
    this.divProg = link(gl, VERT, DIVERGENCE);
    this.pressProg = link(gl, VERT, PRESSURE);
    this.gradProg = link(gl, VERT, GRAD_SUB);
    this.curlProg = link(gl, VERT, CURL);
    this.vortProg = link(gl, VERT, VORTICITY);

    this.vao = gl.createVertexArray()!;
    this.quad = gl.createBuffer()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.displayProg, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const fmt = gl.RGBA16F;
    const type = gl.HALF_FLOAT;
    const ifmt = gl.RGBA;
    this.dye = createDouble(gl, 1, 1, fmt, ifmt, type);
    this.velocity = createDouble(gl, 1, 1, fmt, ifmt, type);
    this.pressure = createDouble(gl, 1, 1, fmt, ifmt, type);
    this.divergence = createFBO(gl, 1, 1, fmt, ifmt, type);
    this.curl = createFBO(gl, 1, 1, fmt, ifmt, type);
  }

  resize(width: number, height: number) {
    const gl = this.gl;
    this.aspect = width / Math.max(height, 1);
    gl.viewport(0, 0, width, height);

    const simAspect = this.aspect;
    let sw = this.simResolution;
    let sh = Math.round(sw / simAspect);
    if (sh < 2) sh = 2;

    let dw = this.dyeResolution;
    let dh = Math.round(dw / simAspect);
    if (dh < 2) dh = 2;

    if (sw === this.simW && sh === this.simH && dw === this.dyeW && dh === this.dyeH) return;

    this.disposeFBOs();
    const fmt = gl.RGBA16F;
    const type = gl.HALF_FLOAT;
    const ifmt = gl.RGBA;
    this.dye = createDouble(gl, dw, dh, fmt, ifmt, type);
    this.velocity = createDouble(gl, sw, sh, fmt, ifmt, type);
    this.pressure = createDouble(gl, sw, sh, fmt, ifmt, type);
    this.divergence = createFBO(gl, sw, sh, fmt, ifmt, type);
    this.curl = createFBO(gl, sw, sh, fmt, ifmt, type);
    this.simW = sw;
    this.simH = sh;
    this.dyeW = dw;
    this.dyeH = dh;
  }

  private disposeFBOs() {
    const gl = this.gl;
    const all = [
      ...this.dye,
      ...this.velocity,
      ...this.pressure,
      this.divergence,
      this.curl,
    ];
    for (const f of all) {
      gl.deleteFramebuffer(f.fbo);
      gl.deleteTexture(f.texture);
    }
  }

  pushSplat(s: FluidSplat) {
    this.splatQueue.push(s);
    this.idleFrames = 0;
  }

  step(dt: number) {
    const gl = this.gl;
    if (this.splatQueue.length === 0) {
      this.idleFrames++;
      if (this.idleFrames > 180) return false;
    }

    gl.bindVertexArray(this.vao);

    while (this.splatQueue.length > 0) {
      const s = this.splatQueue.shift()!;
      const py = 1 - s.y;
      const point = [s.x, py] as const;
      const velColor: [number, number, number] = [s.dx * 22000, s.dy * 22000, 0];
      const dyeColor = s.color ?? [0.72, 0.92, 0.45];
      this.splatInto(this.velocity[1], this.velocity[0], point, velColor, 0.0011);
      swapPair(this.velocity);
      this.splatInto(this.dye[1], this.dye[0], point, dyeColor, 0.0022);
      swapPair(this.dye);
    }

    this.runCurl();
    this.runVorticity(dt);
    this.runDivergence();
    this.runPressure(20);
    this.runGradientSubtract();
    this.advectField(this.velocity[1], this.velocity[0], this.velocity[0], 0.992, dt, this.simW, this.simH);
    swapPair(this.velocity);
    this.advectField(this.dye[1], this.dye[0], this.velocity[0], 0.988, dt, this.dyeW, this.dyeH);
    swapPair(this.dye);

    return true;
  }

  draw() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.displayProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dye[0].texture);
    gl.uniform1i(gl.getUniformLocation(this.displayProg, "uTexture"), 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.disposeFBOs();
    this.gl.deleteProgram(this.displayProg);
    this.gl.deleteProgram(this.splatProg);
    this.gl.deleteProgram(this.advectProg);
    this.gl.deleteProgram(this.divProg);
    this.gl.deleteProgram(this.pressProg);
    this.gl.deleteProgram(this.gradProg);
    this.gl.deleteProgram(this.curlProg);
    this.gl.deleteProgram(this.vortProg);
    this.gl.deleteBuffer(this.quad);
    this.gl.deleteVertexArray(this.vao);
  }

  private blit(
    target: FBO,
    prog: WebGLProgram,
    w: number,
    h: number,
    setup: (loc: (n: string) => WebGLUniformLocation | null) => void,
  ) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);
    const loc = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform2f(loc("uTexelSize"), 1 / w, 1 / h);
    gl.uniform1f(loc("uAspect"), w / h);
    setup(loc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private splatInto(
    dest: FBO,
    source: FBO,
    point: readonly [number, number],
    color: [number, number, number],
    radius: number,
  ) {
    this.blit(dest, this.splatProg, dest.width, dest.height, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uTarget"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.uniform2f(loc("uPoint"), point[0], point[1]);
      gl.uniform3f(loc("uColor"), color[0], color[1], color[2]);
      gl.uniform1f(loc("uRadius"), radius);
    });
  }

  private advectField(
    dest: FBO,
    src: FBO,
    velocity: FBO,
    dissipation: number,
    dt: number,
    w: number,
    h: number,
  ) {
    this.blit(dest, this.advectProg, w, h, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uVelocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.texture);
      gl.uniform1i(loc("uSource"), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, src.texture);
      gl.uniform1f(loc("uDissipation"), dissipation);
      gl.uniform1f(loc("uDt"), dt);
    });
  }

  private runDivergence() {
    this.blit(this.divergence, this.divProg, this.simW, this.simH, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uVelocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.velocity[0].texture);
    });
  }

  private runPressure(iterations: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure[0].fbo);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let i = 0; i < iterations; i++) {
      this.blit(this.pressure[1], this.pressProg, this.simW, this.simH, (loc) => {
        gl.uniform1i(loc("uPressure"), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.pressure[0].texture);
        gl.uniform1i(loc("uDivergence"), 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.divergence.texture);
      });
      swapPair(this.pressure);
    }
  }

  private runGradientSubtract() {
    this.blit(this.velocity[1], this.gradProg, this.simW, this.simH, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uPressure"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pressure[0].texture);
      gl.uniform1i(loc("uVelocity"), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.velocity[0].texture);
    });
    swapPair(this.velocity);
  }

  private runCurl() {
    this.blit(this.curl, this.curlProg, this.simW, this.simH, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uVelocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.velocity[0].texture);
    });
  }

  private runVorticity(dt: number) {
    this.blit(this.velocity[1], this.vortProg, this.simW, this.simH, (loc) => {
      const gl = this.gl;
      gl.uniform1i(loc("uVelocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.velocity[0].texture);
      gl.uniform1i(loc("uCurl"), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.curl.texture);
      gl.uniform1f(loc("uCurlStrength"), 32);
      gl.uniform1f(loc("uDt"), dt);
    });
    swapPair(this.velocity);
  }
}

export function fluidQuality(): { sim: number; dye: number; grass: number } {
  if (typeof window === "undefined") return { sim: 128, dye: 512, grass: 9000 };
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (coarse || mem <= 4) return { sim: 96, dye: 384, grass: 4500 };
  return { sim: 128, dye: 512, grass: 9000 };
}
