/* MESH — 3D helpers for the 3D-printing lessons.

   A mesh here is simply an array of triangles. A triangle is three points,
   and a point is [x, y, z] in millimetres with Z pointing up:

       const tris = [ [[0,0,0], [10,0,0], [0,10,0]],  ... ];

   The corners of each triangle go ANTICLOCKWISE when seen from outside the object.

   MESH.view(ctx, W, H, tris, options)    draw a shaded preview (wrong-way triangles show red)
   MESH.lines(ctx, W, H, segments, opts)  draw 3D line segments, e.g. a toolpath
   MESH.check(tris)                       is it printable? open edges, volume, size
   MESH.stl(tris)                         binary STL file contents
   MESH.download(name, data)              save a file
   MESH.heightfield(nx, ny, w, d, fn)     closed solid from a height function (Lesson 2)
   MESH.fromSDF(fn, min, max, cells)      surface of a 3D distance function (Lesson 3)        */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------- viewer
  let glCanvas = null, gl = null, prog = null, loc = null;
  const cache = new WeakMap();

  const VS = `
    precision highp float;
    attribute vec3 a_pos; attribute vec3 a_aux;
    uniform vec3 u_center; uniform float u_scale, u_spin, u_tilt, u_aspect;
    varying vec3 v_aux; varying float v_depth;
    vec3 turn(vec3 q) {
      float c = cos(u_spin), s = sin(u_spin);
      vec3 r = vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z);     // spin about the vertical axis
      float ct = cos(u_tilt), st = sin(u_tilt);
      return vec3(r.x, r.z * ct + r.y * st, r.y * ct - r.z * st);   // x: right, y: up, z: away
    }
    void main() {
      vec3 p = turn((a_pos - u_center) * u_scale);
      gl_Position = vec4(p.x / u_aspect, p.y, p.z * 0.5, 1.0);
      v_aux = a_aux; v_depth = p.z;
    }`;
  const FS = `
    precision highp float;
    uniform vec3 u_colour; uniform float u_spin, u_tilt; uniform int u_mode;
    varying vec3 v_aux; varying float v_depth;
    vec3 turn(vec3 q) {
      float c = cos(u_spin), s = sin(u_spin);
      vec3 r = vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z);
      float ct = cos(u_tilt), st = sin(u_tilt);
      return vec3(r.x, r.z * ct + r.y * st, r.y * ct - r.z * st);
    }
    void main() {
      if (u_mode == 1) {                                  // lines: a_aux is the colour
        gl_FragColor = vec4(v_aux * (1.0 - 0.35 * v_depth), 1.0);
        return;
      }
      vec3 n = normalize(turn(v_aux));                    // triangles: a_aux is the normal
      float light = 0.3 + 0.7 * max(dot(n, normalize(vec3(-0.45, 0.6, -0.65))), 0.0);
      vec3 col = gl_FrontFacing ? u_colour * light : vec3(0.95, 0.15, 0.2);    // inside-out faces in red
      gl_FragColor = vec4(col * (1.0 - 0.25 * v_depth), 1.0);
    }`;

  function setup() {
    if (gl) return true;
    glCanvas = document.createElement('canvas');
    gl = glCanvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true });
    if (!gl) return false;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    loc = {};
    for (const n of ['u_center', 'u_scale', 'u_spin', 'u_tilt', 'u_aspect', 'u_colour', 'u_mode']) {
      loc[n] = gl.getUniformLocation(prog, n);
    }
    loc.pos = gl.getAttribLocation(prog, 'a_pos');
    loc.aux = gl.getAttribLocation(prog, 'a_aux');
    gl.enable(gl.DEPTH_TEST);
    return true;
  }

  function boundsOf(points) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const p of points) {
      for (let k = 0; k < 3; k++) { if (p[k] < min[k]) min[k] = p[k]; if (p[k] > max[k]) max[k] = p[k]; }
    }
    return { min, max };
  }

  function upload(key, build) {
    let entry = cache.get(key);
    if (!entry) {
      entry = build();
      entry.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, entry.data, gl.STATIC_DRAW);
      entry.data = null;
      cache.set(key, entry);
    }
    return entry;
  }

  function draw(ctx, W, H, entry, opts, mode, primitive) {
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    if (glCanvas.width !== W * dpr || glCanvas.height !== H * dpr) {
      glCanvas.width = W * dpr; glCanvas.height = H * dpr;
    }
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    const bg = opts.background || [0.086, 0.094, 0.114];
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer);
    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.aux);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(loc.aux, 3, gl.FLOAT, false, 24, 12);
    const b = opts.bounds || entry.bounds;
    const size = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    const radius = 0.5 * Math.hypot(size[0], size[1], size[2]) || 1;
    gl.uniform3f(loc.u_center, (b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2);
    gl.uniform1f(loc.u_scale, (opts.zoom || 1) * 0.92 / radius);
    gl.uniform1f(loc.u_spin, opts.spin || 0);
    gl.uniform1f(loc.u_tilt, opts.tilt === undefined ? 0.45 : opts.tilt);
    gl.uniform1f(loc.u_aspect, W / H);
    const c = opts.colour || [0.96, 0.62, 0.3];
    gl.uniform3f(loc.u_colour, c[0], c[1], c[2]);
    gl.uniform1i(loc.u_mode, mode);
    gl.drawArrays(primitive, 0, entry.count);
    ctx.drawImage(glCanvas, 0, 0, W, H);
  }

  function noWebGL(ctx, W, H) {
    ctx.fillStyle = '#16181d'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#cfd6dd'; ctx.font = '14px monospace';
    ctx.fillText('3D preview needs WebGL, which is not available here.', 20, H / 2);
  }

  function view(ctx, W, H, tris, opts) {
    opts = opts || {};
    if (!setup()) return noWebGL(ctx, W, H);
    const entry = upload(tris, () => {
      const data = new Float32Array(tris.length * 18);
      const pts = [];
      let o = 0;
      for (const t of tris) {
        const [a, b, c] = t;
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];   // points outward for anticlockwise corners
        for (const p of t) {
          data[o++] = p[0]; data[o++] = p[1]; data[o++] = p[2];
          data[o++] = n[0]; data[o++] = n[1]; data[o++] = n[2];
          pts.push(p);
        }
      }
      return { data, count: tris.length * 3, bounds: boundsOf(pts) };
    });
    draw(ctx, W, H, entry, opts, 0, gl.TRIANGLES);
  }

  // segments: [[x1, y1, z1, x2, y2, z2, r, g, b], ...] with colours from 0 to 1
  function lines(ctx, W, H, segments, opts) {
    opts = opts || {};
    if (!setup()) return noWebGL(ctx, W, H);
    const entry = upload(segments, () => {
      const data = new Float32Array(segments.length * 12);
      const pts = [];
      let o = 0;
      for (const s of segments) {
        const r = s[6] === undefined ? 1 : s[6], g = s[7] === undefined ? 0.7 : s[7], b = s[8] === undefined ? 0.3 : s[8];
        data[o++] = s[0]; data[o++] = s[1]; data[o++] = s[2]; data[o++] = r; data[o++] = g; data[o++] = b;
        data[o++] = s[3]; data[o++] = s[4]; data[o++] = s[5]; data[o++] = r; data[o++] = g; data[o++] = b;
        pts.push([s[0], s[1], s[2]], [s[3], s[4], s[5]]);
      }
      return { data, count: segments.length * 2, bounds: boundsOf(pts) };
    });
    draw(ctx, W, H, entry, opts, 1, gl.LINES);
  }

  // ---------------------------------------------------------------- checking
  function check(tris) {
    // give every distinct corner position a number. two corners are the same only if x, y and z match exactly
    const xs = new Map();
    let corners = 0;
    const idOf = (p) => {
      let ys = xs.get(p[0]);
      if (!ys) { ys = new Map(); xs.set(p[0], ys); }
      let zs = ys.get(p[1]);
      if (!zs) { zs = new Map(); ys.set(p[1], zs); }
      let id = zs.get(p[2]);
      if (id === undefined) { id = corners++; zs.set(p[2], id); }
      return id;
    };
    const M = 4194304;                       // room for four million distinct corners
    const edges = new Map();
    const pts = [];
    let volume = 0;
    for (const t of tris) {
      const [a, b, c] = t;
      volume += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
      pts.push(a, b, c);
      const k0 = idOf(a), k1 = idOf(b), k2 = idOf(c);
      if (k0 === k1 || k1 === k2 || k2 === k0) continue;      // a sliver too thin to matter: its edges cancel out
      for (const e of [k0 * M + k1, k1 * M + k2, k2 * M + k0]) edges.set(e, (edges.get(e) || 0) + 1);
    }
    let openEdges = 0;                       // every edge must be used once in each direction
    for (const [e, n] of edges) {
      const a = Math.floor(e / M), b = e % M;
      if (n !== 1 || edges.get(b * M + a) !== 1) openEdges++;
    }
    const b = boundsOf(pts);
    return {
      triangles: tris.length,
      openEdges,
      watertight: openEdges === 0 && tris.length > 0,
      insideOut: volume < 0,
      volume: Math.abs(volume),              // cubic millimetres
      min: b.min, max: b.max,
      size: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]],
    };
  }

  // one-line summary for drawing on the canvas
  function report(tris) {
    const c = check(tris);
    return {
      ok: c.watertight && !c.insideOut,
      text: c.triangles + ' triangles · ' + c.size.map((v) => v.toFixed(1)).join(' x ') + ' mm · ' +
        (c.volume / 1000).toFixed(1) + ' cm3 · ' +
        (c.watertight ? 'watertight' : c.openEdges + ' open edges') + (c.insideOut ? ' · INSIDE OUT' : ''),
    };
  }

  // ---------------------------------------------------------------- export
  function stl(tris) {
    const buf = new ArrayBuffer(84 + tris.length * 50);
    const dv = new DataView(buf);
    dv.setUint32(80, tris.length, true);
    let o = 84;
    for (const t of tris) {
      const [a, b, c] = t;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const len = Math.hypot(n[0], n[1], n[2]) || 1;
      n = [n[0] / len, n[1] / len, n[2] / len];
      for (const v of [n, a, b, c]) {
        dv.setFloat32(o, v[0], true); dv.setFloat32(o + 4, v[1], true); dv.setFloat32(o + 8, v[2], true);
        o += 12;
      }
      o += 2;
    }
    return buf;
  }

  function download(name, data, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: type || 'application/octet-stream' }));
    link.download = name;
    link.click();
  }

  // ---------------------------------------------------------------- builders
  // A closed solid whose top surface is z = heightAt(x, y), on a flat bottom at z = 0.
  // nx by ny cells, w by d millimetres.
  function heightfield(nx, ny, w, d, heightAt) {
    const tris = [];
    const X = (i) => (i / nx) * w, Y = (j) => (j / ny) * d;
    const Z = [];
    for (let j = 0; j <= ny; j++) {
      Z.push([]);
      for (let i = 0; i <= nx; i++) Z[j].push(Math.max(0.01, heightAt(X(i), Y(j))));
    }
    const top = (i, j) => [X(i), Y(j), Z[j][i]], bot = (i, j) => [X(i), Y(j), 0];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        tris.push([top(i, j), top(i + 1, j), top(i + 1, j + 1)], [top(i, j), top(i + 1, j + 1), top(i, j + 1)]);   // top, facing up
        tris.push([bot(i, j), bot(i + 1, j + 1), bot(i + 1, j)], [bot(i, j), bot(i, j + 1), bot(i + 1, j + 1)]);   // bottom, facing down
      }
    }
    for (let i = 0; i < nx; i++) {            // front and back walls
      tris.push([bot(i, 0), bot(i + 1, 0), top(i + 1, 0)], [bot(i, 0), top(i + 1, 0), top(i, 0)]);
      tris.push([bot(i + 1, ny), bot(i, ny), top(i, ny)], [bot(i + 1, ny), top(i, ny), top(i + 1, ny)]);
    }
    for (let j = 0; j < ny; j++) {            // left and right walls
      tris.push([bot(0, j + 1), bot(0, j), top(0, j)], [bot(0, j + 1), top(0, j), top(0, j + 1)]);
      tris.push([bot(nx, j), bot(nx, j + 1), top(nx, j + 1)], [bot(nx, j), top(nx, j + 1), top(nx, j)]);
    }
    return tris;
  }

  // The surface where f(x, y, z) = 0, with f negative inside the object.
  // "Marching tetrahedra": sample f on a grid, cut every grid cube into six tetrahedra,
  // and wherever f changes sign along a tetrahedron's edge, put a triangle corner there.
  function fromSDF(f, lo, hi, cells) {
    const size = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    const h = Math.max(size[0], size[1], size[2]) / cells;
    const n = [Math.ceil(size[0] / h), Math.ceil(size[1] / h), Math.ceil(size[2] / h)];
    const sx = n[0] + 1, sy = n[1] + 1, sz = n[2] + 1;
    const val = new Float32Array(sx * sy * sz);
    for (let k = 0; k < sz; k++) {
      for (let j = 0; j < sy; j++) {
        for (let i = 0; i < sx; i++) {
          let v = f(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
          // the edge of the grid always counts as outside, so the mesh is closed
          if (i === 0 || j === 0 || k === 0 || i === n[0] || j === n[1] || k === n[2]) v = Math.max(v, h * 0.05);
          if (v === 0) v = 1e-6;
          val[i + sx * (j + sy * k)] = v;
        }
      }
    }
    // The eight corners of a grid cube are numbered 0 to 7: bit 0 is +x, bit 1 is +y, bit 2 is +z.
    // Each of the six tetrahedra is a path of three steps from corner 0 to corner 7.
    const TETS = [[0, 1, 3, 7], [0, 1, 5, 7], [0, 2, 3, 7], [0, 2, 6, 7], [0, 4, 5, 7], [0, 4, 6, 7]];
    const tris = [];
    const cv = new Float64Array(8);               // the values at the corners of the current cube
    let ci = 0, cj = 0, ck = 0;                   // which cube we are in

    const cut = (a, b) => {                       // where the surface crosses the edge from corner a to corner b
      if (a > b) { const s = a; a = b; b = s; }   // same answer whichever way round it is asked
      const t = cv[a] / (cv[a] - cv[b]);
      const ax = ci + (a & 1), ay = cj + ((a >> 1) & 1), az = ck + (a >> 2);
      const bx = ci + (b & 1), by = cj + ((b >> 1) & 1), bz = ck + (b >> 2);
      return [lo[0] + (ax + (bx - ax) * t) * h, lo[1] + (ay + (by - ay) * t) * h, lo[2] + (az + (bz - az) * t) * h];
    };
    // add a triangle, or a four-sided patch as two triangles, facing from the inside corners toward the outside ones
    const emit = (p, q, r, s, ox, oy, oz) => {
      const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2];
      const vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;          // normal of p, q, r
      if (s) {                                                                             // plus the normal of p, r, s
        const wx = s[0] - p[0], wy = s[1] - p[1], wz = s[2] - p[2];
        nx += vy * wz - vz * wy; ny += vz * wx - vx * wz; nz += vx * wy - vy * wx;
      }
      const facing = nx * ox + ny * oy + nz * oz;
      if (facing >= 0) { tris.push([p, q, r]); if (s) tris.push([p, r, s]); }
      else { tris.push([p, r, q]); if (s) tris.push([p, s, r]); }
    };

    for (ck = 0; ck < n[2]; ck++) {
      for (cj = 0; cj < n[1]; cj++) {
        for (ci = 0; ci < n[0]; ci++) {
          let neg = 0;
          for (let c = 0; c < 8; c++) {
            cv[c] = val[(ci + (c & 1)) + sx * ((cj + ((c >> 1) & 1)) + sy * (ck + (c >> 2)))];
            if (cv[c] < 0) neg++;
          }
          if (neg === 0 || neg === 8) continue;   // the surface does not pass through this cube

          for (const tet of TETS) {
            const ins = [], outs = [];
            for (const c of tet) (cv[c] < 0 ? ins : outs).push(c);
            if (ins.length === 0 || ins.length === 4) continue;
            // direction from the middle of the inside corners to the middle of the outside corners
            let ox = 0, oy = 0, oz = 0;
            for (const c of outs) { ox += (c & 1) / outs.length; oy += ((c >> 1) & 1) / outs.length; oz += (c >> 2) / outs.length; }
            for (const c of ins) { ox -= (c & 1) / ins.length; oy -= ((c >> 1) & 1) / ins.length; oz -= (c >> 2) / ins.length; }

            if (ins.length === 1) emit(cut(ins[0], outs[0]), cut(ins[0], outs[1]), cut(ins[0], outs[2]), null, ox, oy, oz);
            else if (ins.length === 3) emit(cut(outs[0], ins[0]), cut(outs[0], ins[1]), cut(outs[0], ins[2]), null, ox, oy, oz);
            else emit(cut(ins[0], outs[0]), cut(ins[0], outs[1]), cut(ins[1], outs[1]), cut(ins[1], outs[0]), ox, oy, oz);
          }
        }
      }
    }
    return tris;
  }

  global.MESH = { view, lines, check, report, stl, download, heightfield, fromSDF };
})(window);
