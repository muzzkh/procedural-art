/* PA — a tiny helper library for the Procedural Art course.
   Everything in here is explained (and built from scratch) in the lessons:
   seeded randomness in Lesson 2, noise in Lesson 3, cosine palettes in Lesson 9.
   Read it. It is short on purpose. */
(function (global) {
  'use strict';

  // ---------- maths ----------
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
  const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const fract = (x) => x - Math.floor(x);

  // ---------- seeded randomness ----------
  // Turns any string into a 32-bit integer (xmur3 hash).
  function hashString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // PA.rng(seed) -> a function R() returning numbers in [0, 1).
  // Same seed, same sequence. No seed: a different sequence every time.
  function rng(seed) {
    let s = seed === undefined || seed === null
      ? (Math.random() * 4294967296) >>> 0
      : hashString(String(seed));

    const R = function () {            // mulberry32
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // R.range(hi) -> [0, hi)      R.range(lo, hi) -> [lo, hi)
    R.range = (lo, hi) => (hi === undefined ? R() * lo : lo + R() * (hi - lo));
    // whole number, both ends included
    R.int = (lo, hi) => Math.floor(lo + R() * (hi - lo + 1));
    R.chance = (p = 0.5) => R() < p;
    R.sign = () => (R() < 0.5 ? -1 : 1);
    R.pick = (arr) => arr[Math.floor(R() * arr.length)];
    // bell curve (Box–Muller)
    R.gauss = (mean = 0, sd = 1) => {
      const u = 1 - R(), v = R();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    };
    // R.weighted(['a','b','c'], [6, 3, 1]) -> 'a' 60% of the time
    R.weighted = (items, weights) => {
      let total = 0;
      for (const w of weights) total += w;
      let r = R() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    };
    // Fisher–Yates shuffle (returns a new array)
    R.shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(R() * (i + 1));
        const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    };
    return R;
  }

  // ---------- noise ----------
  // PA.noise(seed) -> { get(x, y, z), fbm(x, y, options) }, both returning 0..1.
  // Classic "improved" Perlin gradient noise with a seeded permutation table.
  function noise(seed) {
    const R = rng(seed);
    const order = [];
    for (let i = 0; i < 256; i++) order.push(i);
    const shuffled = R.shuffle(order);
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = shuffled[i & 255];

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (hash, x, y, z) => {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    };

    function raw(x, y, z) {
      const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
      const X = fx & 255, Y = fy & 255, Z = fz & 255;
      x -= fx; y -= fy; z -= fz;
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(
        lerp(
          lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
          lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
        lerp(
          lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
          lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
        w);
    }

    // The small offsets keep 1D and 2D samples away from the integer lattice,
    // where gradient noise is always exactly zero.
    const get = (x, y = 0, z = 0) => clamp(raw(x + 0.123, y + 0.371, z + 0.713) * 0.65 + 0.5);

    // Fractal Brownian motion: several octaves of noise stacked together.
    const fbm = (x, y = 0, opts = {}) => {
      const octaves = opts.octaves || 4;
      const lacunarity = opts.lacunarity || 2;
      const gain = opts.gain || 0.5;
      const z = opts.z || 0;
      let amp = 1, freq = 1, sum = 0, norm = 0;
      for (let o = 0; o < octaves; o++) {
        sum += amp * get(x * freq, y * freq, z + o * 17.3);
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
      }
      return sum / norm;
    };

    return { get, fbm };
  }

  // ---------- colour ----------
  const hsl = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // blend two '#rrggbb' colours, t from 0 to 1
  function mix(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(lerp(a[2], b[2], t))})`;
  }

  // Cosine palette: colour(t) = a + b * cos(TAU * (c * t + d)), per channel.
  function cosPaletteRGB(t, a = [0.5, 0.5, 0.5], b = [0.5, 0.5, 0.5], c = [1, 1, 1], d = [0, 0.33, 0.67]) {
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      out[i] = Math.round(255 * clamp(a[i] + b[i] * Math.cos(TAU * (c[i] * t + d[i]))));
    }
    return out;
  }
  function cosPalette(t, a, b, c, d) {
    const [r, g, bl] = cosPaletteRGB(t, a, b, c, d);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  // OKLCH: a colour space built to match how we see (Lesson 11).
  // L is lightness 0..1, C is chroma (colourfulness, about 0..0.37), H is hue in degrees.
  // Returns [r, g, b] from 0 to 255. Colours a screen cannot show are clipped.
  function oklchRGB(L, C, H) {
    const h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const linear = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
    return linear.map((v) => Math.round(255 * clamp(v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)));
  }
  function oklch(L, C, H, alpha = 1) {
    const [r, g, b] = oklchRGB(L, C, H);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // How light a colour looks, 0 (black) to 1 (white), and the contrast ratio between two colours (1 to 21).
  function luminance(rgb) {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  function contrast(rgbA, rgbB) {
    const a = luminance(rgbA), b = luminance(rgbB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  // A generated test photograph for Lesson 13: a lit ball on a floor, in greyscale.
  // Returns { width, height, data, at(x, y) } where at() gives brightness from 0 (black) to 1 (white).
  function testImage(size = 300) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, '#f2f2f2'); sky.addColorStop(0.62, '#9a9a9a'); sky.addColorStop(0.63, '#5c5c5c'); sky.addColorStop(1, '#bdbdbd');
    g.fillStyle = sky;
    g.fillRect(0, 0, size, size);
    g.fillStyle = 'rgba(0, 0, 0, 0.45)';                                     // the ball's shadow
    g.beginPath(); g.ellipse(size * 0.58, size * 0.8, size * 0.3, size * 0.06, 0, 0, TAU); g.fill();
    const ball = g.createRadialGradient(size * 0.4, size * 0.36, size * 0.02, size * 0.5, size * 0.5, size * 0.33);
    ball.addColorStop(0, '#ffffff'); ball.addColorStop(0.5, '#8c8c8c'); ball.addColorStop(1, '#101010');
    g.fillStyle = ball;
    g.beginPath(); g.arc(size * 0.5, size * 0.5, size * 0.3, 0, TAU); g.fill();
    const img = g.getImageData(0, 0, size, size);
    img.at = (x, y) => {
      const ix = clamp(Math.floor(x), 0, size - 1), iy = clamp(Math.floor(y), 0, size - 1);
      return img.data[(iy * size + ix) * 4] / 255;
    };
    return img;
  }

  // Wave Function Collapse (Lesson 14, where it is built step by step).
  // tiles: [{ edges: [top, right, bottom, left], weight }]. Two tiles may touch if the edges that meet are equal.
  // Returns { ok, grid, restarts }: grid[row * cols + col] is the index of the tile placed there.
  function wfc(opts) {
    const { tiles, cols, rows } = opts;
    const R = opts.rng || rng();
    const maxRestarts = opts.maxRestarts === undefined ? 60 : opts.maxRestarts;
    const opposite = [2, 3, 0, 1], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
    // fits[d][a] lists every tile that may sit in direction d from tile a
    const fits = [0, 1, 2, 3].map((d) => tiles.map((a) => {
      const list = [];
      tiles.forEach((b, j) => { if (a.edges[d] === b.edges[opposite[d]]) list.push(j); });
      return list;
    }));

    for (let attempt = 0; attempt <= maxRestarts; attempt++) {
      const cells = [];
      for (let i = 0; i < cols * rows; i++) cells.push(tiles.map((_, k) => k));     // every cell starts able to be anything

      const propagate = (start) => {                   // push the consequences of a change outward
        const stack = [start];
        while (stack.length) {
          const c = stack.pop(), cx = c % cols, cy = Math.floor(c / cols);
          for (let d = 0; d < 4; d++) {
            const nx = cx + dx[d], ny = cy + dy[d];
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const nb = ny * cols + nx;
            const allowed = new Set();
            for (const a of cells[c]) for (const b of fits[d][a]) allowed.add(b);
            const before = cells[nb].length;
            cells[nb] = cells[nb].filter((b) => allowed.has(b));
            if (cells[nb].length === 0) return false;  // contradiction: nothing fits here
            if (cells[nb].length < before) stack.push(nb);
          }
        }
        return true;
      };

      let failed = false;
      if (opts.border !== undefined) {                 // optional: every edge on the outside must equal this
        for (let i = 0; i < cols * rows && !failed; i++) {
          const x = i % cols, y = Math.floor(i / cols);
          if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) continue;
          cells[i] = cells[i].filter((k) =>
            (y > 0 || tiles[k].edges[0] === opts.border) && (x < cols - 1 || tiles[k].edges[1] === opts.border) &&
            (y < rows - 1 || tiles[k].edges[2] === opts.border) && (x > 0 || tiles[k].edges[3] === opts.border));
          if (cells[i].length === 0 || !propagate(i)) failed = true;
        }
      }

      while (!failed) {
        let best = -1, fewest = Infinity;              // the undecided cell with the fewest options left
        for (let i = 0; i < cells.length; i++) {
          const k = cells[i].length;
          if (k > 1 && (k < fewest || (k === fewest && R() < 0.3))) { best = i; fewest = k; }
        }
        if (best < 0) break;                           // every cell is decided
        const options = cells[best];
        cells[best] = [R.weighted(options, options.map((k) => (tiles[k].weight === undefined ? 1 : tiles[k].weight)))];
        if (!propagate(best)) failed = true;
      }
      if (!failed) return { ok: true, grid: cells.map((c) => c[0]), restarts: attempt };
    }
    return { ok: false, grid: null, restarts: maxRestarts };
  }

  // Small curated palettes. The first colour is always the background.
  const palettes = {
    dusk:   ['#0b132b', '#5bc0be', '#ffd166', '#3a506b', '#ef476f'],
    citrus: ['#f4efe6', '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
    riso:   ['#efe6d5', '#1d3557', '#e63946', '#f1a208', '#2a9d8f'],
    mono:   ['#f2f0eb', '#1a1a1a', '#6e6e6e', '#b8b8b8'],
  };

  global.PA = {
    TAU, lerp, clamp, map, smoothstep, dist, fract,
    hashString, rng, noise,
    hsl, hexToRgb, mix, cosPalette, cosPaletteRGB, palettes,
    oklch, oklchRGB, luminance, contrast, testImage, wfc,
  };
})(window);
