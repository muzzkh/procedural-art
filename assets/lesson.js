/* Turns every <div class="example"> on a lesson page into a live, editable sketch.

   Inside a 2D example your code receives:
     canvas, ctx      the canvas and its 2D context
     W, H             the logical size (600 x 600 unless the example says otherwise)
     loop(fn)         call fn(timeInSeconds, frameNumber) every frame
     mouse            { x, y, down, active } in canvas coordinates
                      (active becomes true once the pointer has moved over the canvas)
     keys             the keys currently held, e.g. keys.arrowleft, keys.a
                      (click the canvas first so that it has keyboard focus)
     ui               ui.slider(label, min, max, value, step) and ui.text(label, value)
                      add a control under the canvas and return a function that reads it;
                      ui.button(label, fn); ui.onChange(fn) runs fn when any control changes
     cleanup(fn)      fn is called when the example is re-run (stop sounds, timers...)
     PA               the helper library from pa.js

   Inside a shader example (data-mode="shader") you write a GLSL fragment shader.
   These uniforms are declared for you:
     u_res (pixels), u_time (seconds), u_mouse (pixels), u_down (1.0 while the mouse is pressed),
     u_frame (frames drawn since the example started),
     u_prev  (a texture holding what this shader drew on the previous frame).
   A shader that reads u_prev has a memory (Shaders 4). Written with one main() its output is
   both the memory and the picture. Written as void update() and void display() instead, update()
   computes the new memory and display() turns it into the colours you see.
   fwidth(), dFdx() and dFdy() are switched on. */
(function () {
  'use strict';

  const VERT = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }';
  const FRAG_HEAD = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;\n' +
    'uniform vec2 u_res;\nuniform float u_time;\nuniform vec2 u_mouse;\nuniform float u_down;\n' +
    'uniform float u_frame;\nuniform sampler2D u_prev;\n';
  const FRAG_HEAD_LINES = 8;
  const all = [];

  function dedent(text) {
    const lines = text.replace(/\t/g, '  ').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    let indent = Infinity;
    for (const l of lines) if (l.trim()) indent = Math.min(indent, l.match(/^ */)[0].length);
    if (!isFinite(indent)) indent = 0;
    return lines.map((l) => l.slice(indent)).join('\n');
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function setup(root, index) {
    const source = dedent(root.querySelector('script').textContent);
    const mode = root.dataset.mode || '2d';
    const W = +(root.dataset.w || 600), H = +(root.dataset.h || 600);
    const pixel = root.hasAttribute('data-pixel');
    const title = root.dataset.title || 'Example ' + (index + 1);

    root.textContent = '';
    const bar = el('div', 'ex-bar');
    bar.appendChild(el('span', 'ex-title', title));
    const runBtn = el('button', 'ex-btn primary', 'Run');
    runBtn.title = 'Run the code (Ctrl + Enter)';
    const resetBtn = el('button', 'ex-btn', 'Reset code');
    const saveBtn = el('button', 'ex-btn', 'Save PNG');
    bar.append(runBtn, resetBtn, saveBtn);

    const body = el('div', 'ex-body');
    const stage = el('div', 'ex-stage');
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.tabIndex = 0;
    stage.appendChild(canvas);
    const controls = el('div', 'ex-controls');
    stage.appendChild(controls);
    const codeWrap = el('div', 'ex-code');
    const ta = document.createElement('textarea');
    ta.value = source;
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('aria-label', title + ' — code');
    codeWrap.appendChild(ta);
    body.append(stage, codeWrap);
    const errBox = el('div', 'ex-error');
    errBox.hidden = true;
    root.append(bar, body, errBox);

    const mouse = { x: W / 2, y: H / 2, down: false, active: false };
    const track = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width * W;
      mouse.y = (e.clientY - r.top) / r.height * H;
      mouse.active = true;
    };
    canvas.addEventListener('pointermove', track);
    canvas.addEventListener('pointerdown', (e) => {
      track(e);
      mouse.down = true;
      canvas.focus({ preventScroll: true });
    });
    window.addEventListener('pointerup', () => { mouse.down = false; });

    const keys = {};
    canvas.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault();   // do not scroll the page
    });
    canvas.addEventListener('keyup', (e) => { delete keys[e.key.toLowerCase()]; });
    canvas.addEventListener('blur', () => { for (const k in keys) delete keys[k]; });

    let raf = 0, loopFn = null, frame = 0, t0 = 0;
    let visible = false, started = false, gl = null;
    let changeFn = null, cleanups = [];
    const state = { title, error: null };

    function changed() {
      if (!changeFn) return;
      try { changeFn(); } catch (e) { showError(e, 3); }
    }
    function addField(labelText, input) {
      const label = el('label');
      label.append(el('span', '', labelText), input);
      controls.appendChild(label);
      return label;
    }
    const ui = {
      slider(label, min, max, value, step) {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min; input.max = max; input.step = step || 'any'; input.value = value;
        const out = el('output', '', String(value));
        addField(label, input).appendChild(out);
        input.addEventListener('input', () => {
          out.textContent = String(+Number(input.value).toFixed(2));
          changed();
        });
        return () => Number(input.value);
      },
      text(label, value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.spellcheck = false;
        addField(label, input);
        input.addEventListener('input', changed);
        return () => input.value;
      },
      button(label, fn) {
        const b = el('button', 'ex-btn', label);
        b.addEventListener('click', () => {
          try { fn(); } catch (e) { showError(e, 3); }
        });
        controls.appendChild(b);
      },
      onChange(fn) { changeFn = fn; },
    };
    const cleanup = (fn) => { cleanups.push(fn); };

    function showError(e, lineOffset) {
      let msg = e && e.message ? e.message : String(e);
      const m = e && e.stack && /<anonymous>:(\d+):(\d+)/.exec(e.stack);
      if (m && lineOffset !== undefined) msg += '  (line ' + (m[1] - lineOffset) + ')';
      state.error = msg;
      errBox.textContent = msg;
      errBox.hidden = false;
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; loopFn = null;
      canvas.onclick = null;
      changeFn = null;
      for (const fn of cleanups) { try { fn(); } catch (e) { /* ignore */ } }
      cleanups = [];
      controls.textContent = '';
    }

    function tick(now) {
      raf = 0;
      if (!loopFn) return;
      if (visible) {
        try {
          loopFn((now - t0) / 1000, frame++);
          state.frames = frame;
        } catch (e) {
          showError(e, 3);
          loopFn = null;
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    }

    function startLoop(fn) {
      loopFn = fn; frame = 0; t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function run2d(code) {
      const dpr = pixel ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;   // also clears and resets all state
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fn = new Function('canvas', 'ctx', 'W', 'H', 'loop', 'PA', 'mouse', 'keys', 'ui', 'cleanup',
        '"use strict";\n' + code);
      fn(canvas, ctx, W, H, startLoop, window.PA, mouse, keys, ui, cleanup);
    }

    function runShader(code) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      gl = gl || canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error('WebGL is not available in this browser.');
      gl.getExtension('OES_standard_derivatives');
      const made = { programs: [], textures: [], buffers: [], frames: [] };
      cleanups.push(() => {                       // free the GPU memory when the example is re-run
        made.programs.forEach((x) => gl.deleteProgram(x));
        made.textures.forEach((x) => gl.deleteTexture(x));
        made.frames.forEach((x) => gl.deleteFramebuffer(x));
        made.buffers.forEach((x) => gl.deleteBuffer(x));
      });
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          const log = (gl.getShaderInfoLog(s) || 'Shader failed to compile')
            .replace(/ERROR: 0:(\d+):/g, (_, n) => 'line ' + (n - FRAG_HEAD_LINES) + ':');
          gl.deleteShader(s);
          throw new Error(log.trim());
        }
        return s;
      };
      const link = (frag) => {
        const prog = gl.createProgram();
        made.programs.push(prog);
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_HEAD + frag));
        gl.bindAttribLocation(prog, 0, 'a_pos');
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        const u = (name) => gl.getUniformLocation(prog, name);
        return { prog, res: u('u_res'), time: u('u_time'), mouse: u('u_mouse'), down: u('u_down'), frame: u('u_frame'), prev: u('u_prev') };
      };

      // One main(): an ordinary shader. update() and display(): a shader with a memory, in two parts.
      const paired = /void\s+update\s*\(/.test(code) && /void\s+display\s*\(/.test(code);
      const feedback = paired || /\bu_prev\b/.test(code);
      const main = link(paired ? code + '\nvoid main() { update(); }' : code);
      const show = !feedback ? null
        : paired ? link(code + '\nvoid main() { display(); }')
        : link('void main() { gl_FragColor = vec4(texture2D(u_prev, gl_FragCoord.xy / u_res).rgb, 1.0); }');

      const buf = gl.createBuffer();
      made.buffers.push(buf);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // The memory: two textures. Each frame reads one and writes the other, then they swap.
      // Decimal (float) textures are used where the graphics card allows, so that small
      // changes are not rounded away; otherwise ordinary 8-bit ones.
      let targets = null;
      if (feedback) {
        const kinds = [];
        if (gl.getExtension('OES_texture_float')) kinds.push([gl.FLOAT, !!gl.getExtension('OES_texture_float_linear')]);
        const half = gl.getExtension('OES_texture_half_float');
        if (half) kinds.push([half.HALF_FLOAT_OES, !!gl.getExtension('OES_texture_half_float_linear')]);
        kinds.push([gl.UNSIGNED_BYTE, true]);
        gl.getExtension('WEBGL_color_buffer_float');
        gl.getExtension('EXT_color_buffer_half_float');
        const make = (type, smooth) => {
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, type, null);
          const filter = smooth ? gl.LINEAR : gl.NEAREST;
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const fbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
          const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
          if (ok) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); made.textures.push(tex); made.frames.push(fbo); }
          else { gl.deleteFramebuffer(fbo); gl.deleteTexture(tex); }
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          return ok ? { tex, fbo } : null;
        };
        for (const [type, smooth] of kinds) {
          const a = make(type, smooth);
          if (!a) continue;
          targets = [a, make(type, smooth)];
          state.memory = type === gl.UNSIGNED_BYTE ? '8-bit' : (type === gl.FLOAT ? 'float' : 'half float');
          break;
        }
        if (!targets) throw new Error('This graphics card cannot draw into a texture.');
      }

      let n = 0;
      const steps = Math.max(1, Math.round(+(root.dataset.steps || 1)));
      const use = (p, t) => {
        gl.useProgram(p.prog);
        gl.uniform2f(p.res, canvas.width, canvas.height);
        gl.uniform1f(p.time, t);
        gl.uniform2f(p.mouse, mouse.x * dpr, (H - mouse.y) * dpr);
        gl.uniform1f(p.down, mouse.down ? 1 : 0);
        gl.uniform1f(p.frame, n);
        gl.uniform1i(p.prev, 0);
      };
      startLoop((t) => {
        if (feedback) {
          gl.activeTexture(gl.TEXTURE0);
          for (let k = 0; k < steps; k++) {                // data-steps="8" runs the memory forward 8 times a frame
            const from = targets[n % 2], to = targets[(n + 1) % 2];
            gl.bindTexture(gl.TEXTURE_2D, from.tex);
            gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo);
            use(main, t);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);        // the new memory
            n++;
          }
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.bindTexture(gl.TEXTURE_2D, targets[n % 2].tex);
          use(show, t);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);          // the picture on the page
        } else {
          use(main, t);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          n++;
        }
      });
    }

    // three.js examples (data-mode="three"). The page loads the library as window.THREE.
    // Your code receives: THREE, renderer (already sized to W x H), orbit(camera) for mouse control,
    // and the usual canvas, W, H, loop, PA, mouse, keys, ui, cleanup.
    let renderer = null, lastScene = null;
    function runThree(code) {
      const THREE = window.THREE;
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
        const draw = renderer.render.bind(renderer);
        renderer.render = (scene, camera) => { lastScene = scene; draw(scene, camera); };
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x16181d, 1);
      renderer.shadowMap.enabled = false;
      const orbit = (camera) => {
        const controls = new window.OrbitControls(camera, canvas);
        cleanups.push(() => controls.dispose());
        return controls;
      };
      cleanups.push(() => {                       // free the GPU memory of whatever was drawn
        if (!lastScene) return;
        lastScene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const m of mats) m.dispose();
        });
        lastScene = null;
      });
      const fn = new Function('THREE', 'renderer', 'orbit', 'canvas', 'W', 'H', 'loop', 'PA', 'mouse', 'keys', 'ui', 'cleanup',
        '"use strict";\n' + code);
      fn(THREE, renderer, orbit, canvas, W, H, startLoop, window.PA, mouse, keys, ui, cleanup);
    }

    function run() {
      stop();
      started = true;
      state.error = null;
      errBox.hidden = true;
      errBox.textContent = '';
      if (mode === 'three' && !window.THREE) {     // the library is still downloading
        errBox.textContent = 'Loading three.js from the internet… (this example needs a connection)';
        errBox.hidden = false;
        window.addEventListener('three-ready', run, { once: true });
        return;
      }
      try {
        if (mode === 'shader') runShader(ta.value);
        else if (mode === 'three') runThree(ta.value);
        else run2d(ta.value);
      } catch (e) {
        showError(e, mode === 'shader' ? undefined : 3);
      }
    }

    runBtn.addEventListener('click', run);
    resetBtn.addEventListener('click', () => { ta.value = source; run(); });
    saveBtn.addEventListener('click', () => {
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
        a.click();
      });
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText('  ', s, ta.selectionEnd, 'end');
      }
    });

    let forced = false;
    state.setVisible = (v) => {
      visible = v || forced;
      if (v && !started) run();
    };
    state.force = () => { forced = true; visible = true; run(); };
    // Advance an animated example by hand (used by the page check below).
    state.stepFrames = (n) => {
      for (let i = 0; i < n && loopFn; i++) {
        try {
          loopFn(frame / 60, frame++);
          state.frames = frame;
        } catch (e) {
          showError(e, 3);
          loopFn = null;
        }
      }
    };
    all.push(state);
    return state;
  }

  function init() {
    const roots = Array.from(document.querySelectorAll('.example'));
    const states = roots.map(setup);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          states[roots.indexOf(entry.target)].setVisible(entry.isIntersecting);
        }
      }, { rootMargin: '200px 0px' });
      roots.forEach((r) => io.observe(r));
    } else {
      states.forEach((s) => s.setVisible(true));
    }
  }

  // Used to check a whole page at once: runs every example and reports any errors.
  window.__lessonTest = async function (waitMs, manualFrames, onlyIndex, keepRunning) {
    const chosen = onlyIndex === undefined ? all : [all[onlyIndex]];
    if (!keepRunning) chosen.forEach((s) => s.force());
    await new Promise((r) => setTimeout(r, waitMs || 800));
    if (manualFrames) chosen.forEach((s) => s.stepFrames(manualFrames));
    return {
      total: all.length,
      animatedFrames: all.filter((s) => s.frames).map((s) => s.title.split(' ')[0] + '=' + s.frames).join(' '),
      errors: all.filter((s) => s.error).map((s) => s.title + ': ' + s.error),
      memory: all.filter((s) => s.memory).map((s) => s.title.split(' ')[0] + '=' + s.memory).join(' '),
    };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
