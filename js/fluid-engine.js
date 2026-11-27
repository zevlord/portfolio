/* ==================================================
   Portfolio Fluid Ink Engine
   - Real-time WebGL2 Navier-Stokes ink/synapse simulation (Hero & Footer)
   - Automatic capability probing with Canvas2D fallback
   ================================================== */
(function (global) {
  'use strict';

  const state = {
    motionEnabled: true,
    instances: [],
  };

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertSrc, fragSrc) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  const BASE_VERT = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const SPLAT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    uniform float isDye;
    void main() {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / max(radius, 0.00001)) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      if (isDye > 0.5) {
        // Soft saturation prevents flat muddy plateaus when strokes overlap
        vec3 combined = base + splat * (1.0 - min(base, vec3(0.88)));
        gl_FragColor = vec4(combined, 1.0);
      } else {
        gl_FragColor = vec4(clamp(base + splat, vec3(-1600.0), vec3(1600.0)), 1.0);
      }
    }
  `;

  const ADVECTION_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 sourceTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
      vec2 st = uv / tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);
      vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
      vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main() {
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = dissipation * bilerp(uSource, coord, sourceTexelSize);
      gl_FragColor = result;
    }
  `;

  const DIVERGENCE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) { L = -C.x; }
      if (vR.x > 1.0) { R = -C.x; }
      if (vT.y > 1.0) { T = -C.y; }
      if (vB.y < 0.0) { B = -C.y; }
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `;

  const CURL_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `;

  const VORTICITY_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main() {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
  `;

  const PRESSURE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - div) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `;

  const GRADIENT_SUBTRACT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vel.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `;

  // Display ink plumes on transparent canvas with smooth bilinear interpolation & filament edge definition
  const DISPLAY_INK_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uDye;
    uniform vec2 texelSize;
    uniform float uAlphaScale;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;

    vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
      vec2 st = uv / tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);
      vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
      vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main() {
      vec3 dye = bilerp(uDye, vUv, texelSize).rgb;
      float dR = bilerp(uDye, vUv + vec2(texelSize.x * 2.0, 0.0), texelSize).r;
      float dU = bilerp(uDye, vUv + vec2(0.0, texelSize.y * 2.0), texelSize).r;
      float grad = clamp(length(vec2(dR - dye.r, dU - dye.r)) * 3.5, 0.0, 1.0);

      float density = clamp(max(dye.r, dye.g), 0.0, 1.0);
      // Emphasize wispy filaments and curling edges over solid centers
      float wisp = pow(density, 0.92) * 0.72 + grad * 0.48 * smoothstep(0.02, 0.35, density);
      float rimMix = clamp((dye.g - dye.r * 0.6) * 1.6 + grad * 0.45, 0.0, 0.78);
      vec3 outColor = mix(uPrimaryColor, uSecondaryColor, rimMix);
      float alpha = smoothstep(0.025, 0.92, wisp) * uAlphaScale;
      gl_FragColor = vec4(outColor * alpha, alpha);
    }
  `;

  function initFluidInkCanvas(canvas, options) {
    if (!canvas) return null;
    const opts = Object.assign({
      triggerTarget: canvas.parentElement || canvas,
      alphaScale: 0.46,
      dyeDissipation: 0.968,
      velDissipation: 0.978,
      curl: 56,
      splatRadius: 0.00026,
      seedAmbient: false,
      primaryColor: [0.08, 0.068, 0.056],
      secondaryColor: [0.58, 0.28, 0.17],
    }, options || {});

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });

    if (!gl) return initCanvas2DFallback(canvas, opts);

    const floatExt = gl.getExtension('EXT_color_buffer_float');
    const halfLinearExt = gl.getExtension('OES_texture_half_float_linear');
    if (!floatExt) {
      return initCanvas2DFallback(canvas, opts);
    }

    const filterType = halfLinearExt ? gl.LINEAR : gl.NEAREST;

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        tex,
        fbo,
        w,
        h,
        ok: status === gl.FRAMEBUFFER_COMPLETE,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          return id;
        },
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        ok: fbo1.ok && fbo2.ok,
        w,
        h,
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() { const tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; },
      };
    }

    const simW = 192;
    const simH = 128;
    const dyeW = 768;
    const dyeH = 512;

    const velocity = createDoubleFBO(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, filterType);
    const dye = createDoubleFBO(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, filterType);
    const divergence = createFBO(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);
    const curlFbo = createFBO(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);
    const pressure = createDoubleFBO(simW, simH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.NEAREST);

    if (!velocity.ok || !dye.ok || !divergence.ok || !curlFbo.ok || !pressure.ok) {
      return initCanvas2DFallback(canvas, opts);
    }

    const programs = {
      splat: createProgram(gl, BASE_VERT, SPLAT_FRAG),
      advect: createProgram(gl, BASE_VERT, ADVECTION_FRAG),
      div: createProgram(gl, BASE_VERT, DIVERGENCE_FRAG),
      curl: createProgram(gl, BASE_VERT, CURL_FRAG),
      vort: createProgram(gl, BASE_VERT, VORTICITY_FRAG),
      press: createProgram(gl, BASE_VERT, PRESSURE_FRAG),
      grad: createProgram(gl, BASE_VERT, GRADIENT_SUBTRACT_FRAG),
      disp: createProgram(gl, BASE_VERT, DISPLAY_INK_FRAG),
    };

    if (Object.values(programs).some(p => !p)) {
      return initCanvas2DFallback(canvas, opts);
    }

    // Fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

    function blit(target) {
      if (target == null) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.w, target.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function use(prog) {
      gl.useProgram(prog);
      const loc = gl.getAttribLocation(prog, 'aPosition');
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    }

    function splat(x, y, dx, dy, rCol, gCol, radiusMul) {
      const aspect = canvas.width / Math.max(1, canvas.height);
      const rad = (opts.splatRadius || 0.00026) * (radiusMul || 1);

      use(programs.splat);
      gl.uniform1i(gl.getUniformLocation(programs.splat, 'uTarget'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'aspectRatio'), aspect);
      gl.uniform2f(gl.getUniformLocation(programs.splat, 'point'), x, y);
      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), dx, dy, 0.0);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'radius'), rad * 2.1);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'isDye'), 0.0);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(gl.getUniformLocation(programs.splat, 'uTarget'), dye.read.attach(0));
      gl.uniform3f(gl.getUniformLocation(programs.splat, 'color'), rCol, gCol, 0.0);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'radius'), rad);
      gl.uniform1f(gl.getUniformLocation(programs.splat, 'isDye'), 1.0);
      blit(dye.write);
      dye.swap();
    }

    function burstAt(nx, ny, strength) {
      const s = strength || 1.0;
      const count = 7;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const ring = 0.016;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + Math.random() * 0.45;
        const ox = nx + (Math.cos(ang) * ring) / Math.max(0.5, aspect);
        const oy = ny + Math.sin(ang) * ring;
        const speed = (680 + Math.random() * 520) * s;
        splat(
          ox,
          oy,
          Math.cos(ang + 0.35) * speed,
          Math.sin(ang + 0.35) * speed,
          0.26 * s,
          (i % 2 === 0 ? 0.36 : 0.14) * s,
          0.62
        );
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const pointer = { x: null, y: null, queue: [] };
    const target = opts.triggerTarget;

    function handleMove(clientX, clientY) {
      if (!state.motionEnabled) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (clientX - rect.left) / rect.width;
      const ny = 1.0 - (clientY - rect.top) / rect.height;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
      if (pointer.x !== null && pointer.y !== null) {
        const mdx = nx - pointer.x;
        const mdy = ny - pointer.y;
        if (Math.hypot(mdx, mdy) > 0.0005 && Math.hypot(mdx, mdy) < 0.35) {
          if (pointer.queue.length >= 10) pointer.queue.shift();
          pointer.queue.push({ x: nx, y: ny, dx: mdx, dy: mdy });
        }
      }
      pointer.x = nx;
      pointer.y = ny;
    }

    target.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY), { passive: true });
    target.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    target.addEventListener('click', (e) => {
      if (!state.motionEnabled) return;
      // Avoid hijacking interactive button/link clicks or duplicating long-hold discharges
      if (e.target && e.target.closest && e.target.closest('a, button, input')) return;
      if (Date.now() - Number(target.dataset.heldAt || 0) < 200) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1.0 - (e.clientY - rect.top) / rect.height;
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        burstAt(nx, ny, 1.15);
      }
    }, { passive: true });

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Seed gentle organic startup ink drift
    if (opts.seedAmbient) {
      setTimeout(() => {
        if (!state.motionEnabled) return;
        splat(0.32, 0.52, 90, 28, 0.55, 0.25, 2.1);
        splat(0.68, 0.48, -90, -24, 0.45, 0.55, 2.1);
      }, 150);
    }

    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const visObs = new IntersectionObserver((entries) => {
        isVisible = entries[0] ? entries[0].isIntersecting : true;
      }, { threshold: 0.01 });
      visObs.observe(canvas);
    }

    let lastTime = performance.now();
    function step(now) {
      requestAnimationFrame(step);
      if (!state.motionEnabled) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) / 1000, 0.0166);
      lastTime = now;

      while (pointer.queue.length > 0) {
        const pt = pointer.queue.shift();
        const dx = pt.dx * 15000;
        const dy = pt.dy * 15000;
        const speed = Math.min(1.2, Math.hypot(dx, dy) / 950);
        splat(pt.x, pt.y, dx, dy, 0.20 + speed * 0.14, 0.14 + speed * 0.26, 0.85);
      }

      gl.disable(gl.BLEND);

      // Curl
      use(programs.curl);
      gl.uniform2f(gl.getUniformLocation(programs.curl, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.curl, 'uVelocity'), velocity.read.attach(0));
      blit(curlFbo);

      // Vorticity
      use(programs.vort);
      gl.uniform2f(gl.getUniformLocation(programs.vort, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.vort, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(programs.vort, 'uCurl'), curlFbo.attach(1));
      gl.uniform1f(gl.getUniformLocation(programs.vort, 'curl'), opts.curl);
      gl.uniform1f(gl.getUniformLocation(programs.vort, 'dt'), dt);
      blit(velocity.write);
      velocity.swap();

      // Divergence
      use(programs.div);
      gl.uniform2f(gl.getUniformLocation(programs.div, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.div, 'uVelocity'), velocity.read.attach(0));
      blit(divergence);

      // Jacobi Pressure Solver (14 iterations)
      use(programs.press);
      gl.uniform2f(gl.getUniformLocation(programs.press, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.press, 'uDivergence'), divergence.attach(0));
      for (let i = 0; i < 14; i++) {
        gl.uniform1i(gl.getUniformLocation(programs.press, 'uPressure'), pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      // Gradient Subtract
      use(programs.grad);
      gl.uniform2f(gl.getUniformLocation(programs.grad, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.grad, 'uPressure'), pressure.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(programs.grad, 'uVelocity'), velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // Advect Velocity
      use(programs.advect);
      gl.uniform2f(gl.getUniformLocation(programs.advect, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform2f(gl.getUniformLocation(programs.advect, 'sourceTexelSize'), 1 / simW, 1 / simH);
      gl.uniform1i(gl.getUniformLocation(programs.advect, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(programs.advect, 'uSource'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(programs.advect, 'dt'), dt);
      gl.uniform1f(gl.getUniformLocation(programs.advect, 'dissipation'), opts.velDissipation);
      blit(velocity.write);
      velocity.swap();

      // Advect Dye
      gl.uniform2f(gl.getUniformLocation(programs.advect, 'texelSize'), 1 / simW, 1 / simH);
      gl.uniform2f(gl.getUniformLocation(programs.advect, 'sourceTexelSize'), 1 / dyeW, 1 / dyeH);
      gl.uniform1i(gl.getUniformLocation(programs.advect, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(programs.advect, 'uSource'), dye.read.attach(1));
      gl.uniform1f(gl.getUniformLocation(programs.advect, 'dissipation'), opts.dyeDissipation);
      blit(dye.write);
      dye.swap();

      // Render final ink to screen
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      use(programs.disp);
      gl.uniform2f(gl.getUniformLocation(programs.disp, 'texelSize'), 1 / dyeW, 1 / dyeH);
      gl.uniform1i(gl.getUniformLocation(programs.disp, 'uDye'), dye.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(programs.disp, 'uAlphaScale'), opts.alphaScale);
      gl.uniform3f(
        gl.getUniformLocation(programs.disp, 'uPrimaryColor'),
        opts.primaryColor[0], opts.primaryColor[1], opts.primaryColor[2]
      );
      gl.uniform3f(
        gl.getUniformLocation(programs.disp, 'uSecondaryColor'),
        opts.secondaryColor[0], opts.secondaryColor[1], opts.secondaryColor[2]
      );
      blit(null);
    }

    requestAnimationFrame(step);

    const api = {
      burstAt,
      splat,
      clear() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      },
    };
    state.instances.push(api);
    return api;
  }

  // Graceful Canvas2D swirling ink fallback if float FBO WebGL2 unavailable
  function initCanvas2DFallback(canvas, opts) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const drops = [];
    const target = opts.triggerTarget || canvas;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function addDrop(nx, ny, radius, isEmber) {
      drops.push({
        x: nx * canvas.width,
        y: (1 - ny) * canvas.height,
        r: radius || 36,
        alpha: 0.34,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        ember: !!isEmber,
      });
      if (drops.length > 55) drops.shift();
    }

    target.addEventListener('mousemove', (e) => {
      if (!state.motionEnabled) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      addDrop((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height, 44, Math.random() > 0.5);
    }, { passive: true });

    target.addEventListener('click', (e) => {
      if (!state.motionEnabled) return;
      if (e.target && e.target.closest && e.target.closest('a, button, input')) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1 - (e.clientY - rect.top) / rect.height;
      for (let i = 0; i < 6; i++) addDrop(nx, ny, 68, true);
    }, { passive: true });

    function tick() {
      requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!state.motionEnabled) return;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        d.r += 0.95;
        d.alpha *= 0.962;
        if (d.alpha < 0.01) {
          drops.splice(i, 1);
          continue;
        }
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        const col = d.ember ? '140, 72, 48' : '26, 23, 20';
        g.addColorStop(0, `rgba(${col}, ${d.alpha.toFixed(3)})`);
        g.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);

    const api = {
      burstAt(nx, ny) { for (let i = 0; i < 6; i++) addDrop(nx, ny, 70, true); },
      splat() {},
      clear() { drops.length = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); },
    };
    state.instances.push(api);
    return api;
  }

  global.PortfolioFluid = {
    initFluidInkCanvas,
    setMotionEnabled(enabled) {
      state.motionEnabled = !!enabled;
      if (!state.motionEnabled) {
        state.instances.forEach(inst => inst && inst.clear && inst.clear());
      }
    },
    isMotionEnabled() {
      return state.motionEnabled;
    },
  };
})(window);
