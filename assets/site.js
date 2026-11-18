/* Procedural Art course: the page chrome.
   Navigation between pages, colour themes, and a few small generative effects.
   Loaded in the <head> of every course page. It needs nothing else, and every page
   still reads correctly if this file fails to load. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- the course map
  // [path, label, title] for every page, in reading order.
  const SECTIONS = [
    { id: 'lessons', name: 'Lessons', pages: [
      ['lessons/01-drawing-with-code.html', 'Lesson 1', 'Drawing with Code'],
      ['lessons/02-controlled-randomness.html', 'Lesson 2', 'Controlled Randomness'],
      ['lessons/03-noise.html', 'Lesson 3', 'Noise'],
      ['lessons/04-curves-and-trigonometry.html', 'Lesson 4', 'Curves and Trigonometry'],
      ['lessons/05-particles-and-flow-fields.html', 'Lesson 5', 'Particles and Flow Fields'],
      ['lessons/06-recursion-and-grammars.html', 'Lesson 6', 'Recursion, Fractals and L-systems'],
      ['lessons/07-packing-and-partitioning.html', 'Lesson 7', 'Packing and Partitioning'],
      ['lessons/08-simulation-and-emergence.html', 'Lesson 8', 'Simulation and Emergence'],
      ['lessons/09-shaders-and-distance-fields.html', 'Lesson 9', 'Shaders and Distance Fields'],
      ['lessons/10-systems-and-finishing.html', 'Lesson 10', 'Systems and Finishing'],
      ['lessons/11-colour.html', 'Lesson 11', 'Colour'],
      ['lessons/12-typography.html', 'Lesson 12', 'Typography and Text'],
      ['lessons/13-images-as-input.html', 'Lesson 13', 'Images as Input'],
      ['lessons/14-wave-function-collapse.html', 'Lesson 14', 'Wave Function Collapse'],
      ['lessons/15-animation-and-looping.html', 'Lesson 15', 'Animation and Looping'],
      ['lessons/16-growth.html', 'Lesson 16', 'Growth Algorithms'],
      ['lessons/17-physics.html', 'Lesson 17', 'Physics'],
      ['lessons/18-geometry.html', 'Lesson 18', 'Geometry Utilities'],
      ['lessons/19-performance.html', 'Lesson 19', 'Performance'],
    ] },
    { id: 'math', name: 'Maths', pages: [
      ['math/01-functions-and-shaping.html', 'Maths 1', 'Functions and Shaping'],
      ['math/02-vectors-and-transformations.html', 'Maths 2', 'Vectors, Matrices and Complex Numbers'],
      ['math/03-calculus.html', 'Maths 3', 'Calculus'],
      ['math/04-differential-equations.html', 'Maths 4', 'Differential Equations'],
      ['math/05-waves-chaos-and-chance.html', 'Maths 5', 'Waves, Curves, Chaos and Chance'],
      ['math/06-linear-algebra.html', 'Maths 6', 'Linear Algebra'],
    ] },
    { id: 'special', name: 'Special topics', pages: [
      ['special/01-interactivity.html', 'Special 1', 'Interactivity'],
      ['special/02-practical-uses.html', 'Special 2', 'Practical Uses'],
      ['special/03-into-the-real-world.html', 'Special 3', 'Into the Real World'],
      ['special/04-sound-and-music.html', 'Special 4', 'Sound and Generative Music'],
      ['special/05-live-hardware.html', 'Special 5', 'Live Hardware'],
      ['special/06-ai-and-procedural.html', 'Special 6', 'AI Alongside Procedural Methods'],
      ['special/07-critique-and-art-direction.html', 'Special 7', 'Critique and Art Direction'],
      ['special/08-publishing.html', 'Special 8', 'Publishing'],
      ['special/09-project-workflow.html', 'Special 9', 'Project Workflow'],
    ] },
    { id: 'printing', name: '3D printing', pages: [
      ['printing/01-how-printing-works.html', 'Printing 1', 'How Printing Works'],
      ['printing/02-models-from-code.html', 'Printing 2', 'Models from Code'],
      ['printing/03-models-from-formulas.html', 'Printing 3', 'Models from Formulas'],
      ['printing/04-gcode-fundamentals.html', 'Printing 4', 'G-code Fundamentals'],
      ['printing/05-generative-toolpaths.html', 'Printing 5', 'Generative Toolpaths'],
    ] },
    { id: 'three', name: 'three.js', pages: [
      ['three/01-scenes-and-objects.html', 'three.js 1', 'Scenes and Objects'],
      ['three/02-geometry-from-code.html', 'three.js 2', 'Geometry from Code'],
      ['three/03-shaders-interaction-export.html', 'three.js 3', 'Shaders, Interaction and Export'],
    ] },
    { id: 'blender', name: 'Blender', pages: [
      ['blender/01-scripting-blender.html', 'Blender 1', 'Scripting Blender'],
      ['blender/02-meshes-and-modifiers.html', 'Blender 2', 'Meshes and Modifiers'],
      ['blender/03-geometry-nodes.html', 'Blender 3', 'Geometry Nodes'],
      ['blender/04-addons-and-libraries.html', 'Blender 4', 'Add-ons and Libraries'],
    ] },
    { id: 'web', name: 'Website design', pages: [
      ['web/01-generative-web-design.html', 'Web 1', 'Generative Effects for Websites'],
      ['web/02-building-real-pages.html', 'Web 2', 'Building Real Pages'],
    ] },
    { id: 'projects', name: 'Projects', pages: [
      ['projects/01-atlas.html', 'Project 1', 'An Atlas of Somewhere That Does Not Exist'],
      ['projects/02-living-identity.html', 'Project 2', 'A Living Identity'],
      ['projects/03-code-to-object.html', 'Project 3', 'From Code to Object'],
    ] },
    { id: 'reference', name: 'Reference', pages: [
      ['reference/glossary.html', '', 'Glossary'],
      ['reference/cheat-sheet.html', '', 'Cheat Sheet'],
      ['reference/artists-and-works.html', '', 'Artists and Works to Study'],
    ] },
  ];

  // Each theme: the name shown, a one-line description, and five colours for its preview.
  const THEMES = [
    { id: 'blueprint', name: 'Blueprint', note: 'Pale lines on blue (the default)', swatch: ['#123a7c', '#eef5ff', '#ffe066', '#9fe3ff', '#ffffff'] },
    { id: 'auto', name: 'Auto', note: 'Riso by day, Dusk by night', swatch: ['#fff6e9', '#19142c', '#ff5b4f', '#2f6df0', '#ffd166'] },
    { id: 'riso', name: 'Riso', note: 'Colourful and light', swatch: ['#fff6e9', '#26213f', '#ff5b4f', '#2f6df0', '#f7a800'] },
    { id: 'dusk', name: 'Dusk', note: 'Colourful and dark', swatch: ['#19142c', '#f4eeff', '#ff6f61', '#3ddcb4', '#ffd166'] },
    { id: 'paper', name: 'Paper', note: 'Plain light', swatch: ['#f6f3ec', '#1c1b19', '#c8451b', '#2a6f97', '#c98a00'] },
    { id: 'ink', name: 'Ink', note: 'Plain dark', swatch: ['#111214', '#ece7dc', '#ff8552', '#5bc0be', '#ffd166'] },
  ];

  // ---------------------------------------------------------------- small helpers
  const root = document.documentElement;
  const TAU = Math.PI * 2;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('pa.' + key); return v === null ? fallback : v; } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem('pa.' + key, value); } catch (e) { /* private window: carry on without it */ } },
    json(key) { try { return JSON.parse(this.get(key, '{}')) || {}; } catch (e) { return {}; } },
  };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // A string to a 32-bit number, a seeded random function, and smooth 2D noise.
  // These are the same ideas as Lessons 2 and 3, kept here so this file stands alone.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise2(seed) {
    function corner(ix, iy) {
      let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    return function (x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      let fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = corner(ix, iy), b = corner(ix + 1, iy), c = corner(ix, iy + 1), d = corner(ix + 1, iy + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  // ---------------------------------------------------------------- where are we?
  const script = document.currentScript;
  const ROOT = script ? new URL('..', script.src).href : '';
  const here = location.href.split('#')[0].split('?')[0];
  let rel = '';
  try { rel = decodeURIComponent(here.indexOf(ROOT) === 0 ? here.slice(ROOT.length) : ''); } catch (e) { rel = ''; }
  const isHome = rel === '' || rel === 'index.html';

  const FLAT = [];
  SECTIONS.forEach((section) => {
    section.pages.forEach((p) => {
      FLAT.push({ path: p[0], num: p[1], title: p[2], section: section.id, sectionName: section.name });
    });
  });
  const index = FLAT.findIndex((p) => p.path === rel);
  const current = index >= 0 ? FLAT[index] : null;
  const prev = index > 0 ? FLAT[index - 1] : null;
  const next = index >= 0 && index < FLAT.length - 1 ? FLAT[index + 1] : null;
  const url = (path) => ROOT + path.split('/').map(encodeURIComponent).join('/');
  const label = (p) => (p.num ? p.num + ' · ' : '') + p.title;

  // ---------------------------------------------------------------- theme (runs before the page paints)
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const calmQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let themeChoice = store.get('theme', 'blueprint');      // Blueprint unless you have chosen another
  let effects = store.get('fx', calmQuery && calmQuery.matches ? 'off' : 'on');
  const listeners = [];           // called whenever the theme or the effects setting changes

  function applyTheme(choice, save) {
    if (!THEMES.some((t) => t.id === choice)) choice = 'blueprint';
    themeChoice = choice;
    const resolved = choice === 'auto' ? (darkQuery && darkQuery.matches ? 'dusk' : 'riso') : choice;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-choice', choice);
    if (save) store.set('theme', choice);
    listeners.forEach((fn) => fn());
  }
  function applyEffects(value, save) {
    effects = value === 'off' ? 'off' : 'on';
    root.setAttribute('data-fx', effects);
    if (save) store.set('fx', effects);
    listeners.forEach((fn) => fn());
  }
  const effectsOn = () => effects === 'on';

  root.classList.add('site-js');
  root.setAttribute('data-section', current ? current.section : 'home');
  applyTheme(themeChoice, false);
  applyEffects(effects, false);
  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', () => { if (themeChoice === 'auto') applyTheme('auto', false); });
  }

  // The current theme's colours, read back from the stylesheet so the drawings always match.
  function palette() {
    const cs = getComputedStyle(root);
    const read = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
    return {
      colours: ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map((n) => read(n, '#888888')),
      ink: read('--ink', '#222222'),
      bg: read('--bg', '#ffffff'),
    };
  }

  // ---------------------------------------------------------------- generative glyphs
  // A small seeded drawing used as a thumbnail: the same seed always gives the same glyph.
  // `t` moves it when the pointer is over it.
  function drawGlyph(g, s, seed, t, pal) {
    const R = rng(seed);
    const style = Math.floor(R() * 6);
    const ia = Math.floor(R() * pal.colours.length);
    const ib = (ia + 1 + Math.floor(R() * (pal.colours.length - 1))) % pal.colours.length;
    const A = pal.colours[ia], B = pal.colours[ib];

    g.clearRect(0, 0, s, s);
    g.save();
    g.beginPath();
    const r = s * 0.2;
    g.moveTo(r, 0); g.arcTo(s, 0, s, s, r); g.arcTo(s, s, 0, s, r); g.arcTo(0, s, 0, 0, r); g.arcTo(0, 0, s, 0, r);
    g.clip();
    g.globalAlpha = 0.2; g.fillStyle = A; g.fillRect(0, 0, s, s); g.globalAlpha = 1;
    g.lineCap = 'round'; g.lineJoin = 'round';

    if (style === 0) {                                   // truchet arcs (Lesson 2)
      const n = 3 + Math.floor(R() * 2), c = s / n;
      g.lineWidth = c * 0.2;
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const phase = R();
          const flip = (R() < 0.5) !== (Math.floor(t * 1.1 + phase) % 2 === 1);
          g.strokeStyle = R() < 0.3 ? pal.ink : B;
          const x = i * c, y = j * c;
          g.beginPath();
          if (flip) { g.arc(x, y, c / 2, 0, TAU / 4); g.moveTo(x + c / 2, y + c); g.arc(x + c, y + c, c / 2, TAU / 2, TAU * 0.75); }
          else { g.arc(x + c, y, c / 2, TAU / 4, TAU / 2); g.moveTo(x + c / 2, y + c); g.arc(x, y + c, c / 2, 0, -TAU / 4, true); }
          g.stroke();
        }
      }
    } else if (style === 1) {                            // broken rings
      const cx = s * (0.3 + R() * 0.4), cy = s * (0.3 + R() * 0.4);
      g.lineWidth = s * 0.055;
      for (let k = 1; k <= 7; k++) {
        const start = R() * TAU + t * (k % 2 ? 0.9 : -0.6);
        g.strokeStyle = k % 3 === 0 ? pal.ink : (k % 2 ? B : A);
        g.beginPath(); g.arc(cx, cy, k * s * 0.105, start, start + TAU * (0.3 + R() * 0.5)); g.stroke();
      }
    } else if (style === 2) {                            // sunflower (Lesson 4)
      const n = 46, spin = R() * TAU + t * 0.5;
      for (let i = 1; i < n; i++) {
        const a = i * 2.39996323 + spin, d = Math.sqrt(i / n) * s * 0.47;
        g.fillStyle = i % 5 === 0 ? pal.ink : (i % 2 ? B : A);
        g.beginPath(); g.arc(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.012 + 0.032 * i / n), 0, TAU); g.fill();
      }
    } else if (style === 3) {                            // hatching
      const a = R() * Math.PI + t * 0.35, gap = s * (0.11 + R() * 0.06);
      const dx = Math.cos(a), dy = Math.sin(a);
      g.lineWidth = s * 0.04;
      for (let k = -8; k <= 8; k++) {
        const ox = s / 2 - dy * k * gap, oy = s / 2 + dx * k * gap;
        g.strokeStyle = ((k % 3) + 3) % 3 === 0 ? pal.ink : (k % 2 ? B : A);
        g.beginPath(); g.moveTo(ox - dx * s, oy - dy * s); g.lineTo(ox + dx * s, oy + dy * s); g.stroke();
      }
    } else if (style === 4) {                            // stacked waves
      g.lineWidth = s * 0.05;
      for (let k = 0; k < 5; k++) {
        const y = s * (0.17 + k * 0.165), amp = s * 0.07 * (0.4 + R()), freq = 1 + R() * 2.2, ph = R() * TAU + t * 2.2;
        g.strokeStyle = k === 2 ? pal.ink : (k % 2 ? B : A);
        g.beginPath();
        for (let x = -2; x <= s + 2; x += 2) g.lineTo(x, y + Math.sin(x / s * TAU * freq + ph) * amp);
        g.stroke();
      }
    } else {                                             // turning squares
      const twist = 0.1 + R() * 0.22;
      g.lineWidth = s * 0.04;
      g.translate(s / 2, s / 2);
      for (let k = 0; k < 7; k++) {
        const h = s * 0.44 * (1 - k / 7.6);
        g.save();
        g.rotate(k * twist + t * 0.6 * (k % 2 ? 1 : -1));
        g.strokeStyle = k % 3 === 2 ? pal.ink : (k % 2 ? B : A);
        g.strokeRect(-h, -h, h * 2, h * 2);
        g.restore();
      }
    }
    g.restore();
  }

  const glyphs = [];
  function makeGlyph(seedText, size, hoverTarget) {
    const cv = el('canvas', 'glyph');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = cv.height = Math.round(size * dpr);
    cv.style.width = cv.style.height = size + 'px';
    cv.setAttribute('aria-hidden', 'true');
    const item = { cv, seed: hash(seedText), t: 0, size: cv.width, frame: 0 };
    item.render = () => drawGlyph(cv.getContext('2d'), item.size, item.seed, item.t, palette());
    glyphs.push(item);
    item.render();
    if (hoverTarget) {
      let last = 0;
      const tick = (now) => {
        item.t += Math.min(0.05, (now - last) / 1000); last = now;
        item.render();
        item.frame = requestAnimationFrame(tick);
      };
      hoverTarget.addEventListener('pointerenter', () => {
        if (!effectsOn() || item.frame) return;
        last = performance.now(); item.frame = requestAnimationFrame(tick);
      });
      hoverTarget.addEventListener('pointerleave', () => { cancelAnimationFrame(item.frame); item.frame = 0; });
    }
    return cv;
  }
  listeners.push(() => glyphs.forEach((g) => g.render()));

  // ---------------------------------------------------------------- hand-drawn underlines
  function squiggle(seed, width) {
    const R = rng(seed);
    let d = 'M 3 ' + (6 + (R() - 0.5) * 4).toFixed(1);
    let px = 3, py = 6;
    for (let x = 14; x <= width - 3; x += 11) {
      const y = 6 + (R() - 0.5) * 7;
      d += ' Q ' + px.toFixed(1) + ' ' + py.toFixed(1) + ' ' + ((px + x) / 2).toFixed(1) + ' ' + ((py + y) / 2).toFixed(1);
      px = x; py = y;
    }
    d += ' T ' + (width - 3) + ' ' + (6 + (R() - 0.5) * 4).toFixed(1);
    return d;
  }
  function addSquiggle(heading, width) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'squiggle');
    svg.setAttribute('viewBox', '0 0 ' + width + ' 12');
    svg.setAttribute('width', width); svg.setAttribute('height', 12);
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let seed = hash(heading.textContent);
    path.setAttribute('d', squiggle(seed, width));
    svg.appendChild(path);
    heading.appendChild(svg);
    heading.addEventListener('pointerenter', () => {          // a fresh wobble each time you point at it
      if (effectsOn()) path.setAttribute('d', squiggle(++seed, width));
    });
  }

  // ---------------------------------------------------------------- progress kept in this browser
  let done = store.json('done');
  let seen = store.json('seen');
  const isDone = (path) => !!done[path];
  function setDone(path, value) {
    if (value) done[path] = 1; else delete done[path];
    store.set('done', JSON.stringify(done));
  }
  if (current) {
    seen[current.path] = 1;
    store.set('seen', JSON.stringify(seen));
    store.set('last', current.path);
  }

  // ---------------------------------------------------------------- build the chrome
  let drawer, backdrop, pop, menuButton, themeButton, progressBar, rail, topButton;
  let headings = [];

  function slug(text, used) {
    let s = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    let n = s, i = 2;
    while (used[n] || document.getElementById(n)) n = s + '-' + i++;
    used[n] = 1;
    return n;
  }

  function collectHeadings() {
    const used = {};
    headings = Array.from(document.querySelectorAll('main h2')).filter((h) => !h.closest('.sheet'));
    headings.forEach((h) => { if (!h.id) h.id = slug(h.textContent, used); });
  }

  function buildBar() {
    const bar = el('div', 'site-bar');
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Course');

    menuButton = el('button', 'sb-btn sb-menu');
    menuButton.type = 'button';
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'site-drawer');
    menuButton.title = 'All lessons (press M)';
    menuButton.appendChild(el('span', 'sb-burger'));
    menuButton.appendChild(el('span', 'sb-label', 'Contents'));
    menuButton.addEventListener('click', () => toggleDrawer());
    bar.appendChild(menuButton);

    const home = el('a', 'sb-home');
    home.href = url('index.html');
    home.title = 'Back to the course home';
    home.appendChild(makeGlyph('brand:' + (rel || 'home'), 26, home));
    home.appendChild(el('span', 'sb-label', 'Procedural Art'));
    bar.appendChild(home);

    const where = el('span', 'sb-where');
    if (current) {
      where.appendChild(el('span', 'sb-sec', current.sectionName));
      where.appendChild(el('span', 'sb-title', label(current)));
    } else {
      where.appendChild(el('span', 'sb-title', isHome ? 'Course home' : document.title));
    }
    bar.appendChild(where);

    const step = (page, cls, arrow, word) => {
      const a = el('a', 'sb-btn sb-step ' + cls);
      a.href = page ? url(page.path) : url('index.html');
      a.title = (page ? word + ': ' + label(page) : 'Back to the course home') + (cls === 'sb-prev' ? '  (press [)' : '  (press ])');
      if (cls === 'sb-prev') a.appendChild(el('span', 'sb-arrow', arrow));
      a.appendChild(el('span', 'sb-label', page ? (page.num || page.title) : 'Course'));
      if (cls === 'sb-next') a.appendChild(el('span', 'sb-arrow', arrow));
      return a;
    };
    if (current) {
      bar.appendChild(step(prev, 'sb-prev', '←', 'Previous'));
      bar.appendChild(step(next, 'sb-next', '→', 'Next'));
    } else if (isHome) {
      const last = FLAT.find((p) => p.path === store.get('last', '')) || FLAT[0];
      const go = el('a', 'sb-btn sb-step sb-next');
      go.href = url(last.path);
      go.title = label(last);
      go.appendChild(el('span', 'sb-label', (seen[last.path] ? 'Continue: ' : 'Start: ') + (last.num || last.title)));
      go.appendChild(el('span', 'sb-arrow', '→'));
      bar.appendChild(go);
    }

    themeButton = el('button', 'sb-btn sb-theme');
    themeButton.type = 'button';
    themeButton.setAttribute('aria-haspopup', 'true');
    themeButton.setAttribute('aria-expanded', 'false');
    themeButton.title = 'Colour theme (press T to cycle)';
    themeButton.appendChild(el('span', 'sb-swatch'));
    themeButton.appendChild(el('span', 'sb-label', 'Theme'));
    themeButton.addEventListener('click', (e) => { e.stopPropagation(); togglePop(); });
    bar.appendChild(themeButton);

    const track = el('div', 'sb-progress');
    progressBar = el('i');
    track.appendChild(progressBar);
    bar.appendChild(track);

    const old = document.querySelector('nav.top');
    if (old) old.remove();
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function buildPop() {
    pop = el('div', 'site-pop');
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Colour theme');
    pop.appendChild(el('p', 'sp-head', 'Colour theme'));

    const list = el('div', 'sp-themes');
    THEMES.forEach((theme) => {
      const b = el('button', 'sp-theme');
      b.type = 'button';
      b.dataset.id = theme.id;
      const chips = el('span', 'sp-chips');
      theme.swatch.forEach((c) => { const i = el('i'); i.style.background = c; chips.appendChild(i); });
      b.appendChild(chips);
      const text = el('span', 'sp-text');
      text.appendChild(el('strong', '', theme.name));
      text.appendChild(el('small', '', theme.note));
      b.appendChild(text);
      b.addEventListener('click', () => applyTheme(theme.id, true));
      list.appendChild(b);
    });
    pop.appendChild(list);

    const fx = el('label', 'sp-fx');
    const box = el('input');
    box.type = 'checkbox';
    box.checked = effectsOn();
    box.addEventListener('change', () => applyEffects(box.checked ? 'on' : 'off', true));
    fx.appendChild(box);
    fx.appendChild(el('span', '', 'Generative effects and motion'));
    pop.appendChild(fx);
    pop.appendChild(el('p', 'sp-keys', 'Keys: [ previous · ] next · M contents · T theme'));

    const mark = () => {
      pop.querySelectorAll('.sp-theme').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === themeChoice ? 'true' : 'false'));
      box.checked = effectsOn();
    };
    listeners.push(mark);
    mark();
    pop.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(pop);
    document.addEventListener('click', () => closePop());
  }
  function togglePop(force) {
    const open = force !== undefined ? force : pop.hidden;
    pop.hidden = !open;
    themeButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closePop() { if (pop && !pop.hidden) togglePop(false); }

  function buildDrawer() {
    backdrop = el('div', 'site-backdrop');
    backdrop.addEventListener('click', () => toggleDrawer(false));
    drawer = el('aside', 'site-drawer');
    drawer.id = 'site-drawer';
    drawer.setAttribute('aria-label', 'Course contents');
    drawer.inert = true;

    const head = el('div', 'sd-head');
    head.appendChild(el('strong', '', 'Course contents'));
    const close = el('button', 'sd-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close contents');
    close.addEventListener('click', () => toggleDrawer(false));
    head.appendChild(close);
    drawer.appendChild(head);

    const filter = el('input', 'sd-filter');
    filter.type = 'search';
    filter.placeholder = 'Find a lesson…';
    filter.setAttribute('aria-label', 'Find a lesson');
    drawer.appendChild(filter);

    const scroller = el('div', 'sd-scroll');
    const homeLink = el('a', 'sd-home', '⌂  Course home');
    homeLink.href = url('index.html');
    if (isHome) homeLink.setAttribute('aria-current', 'page');
    scroller.appendChild(homeLink);

    const total = FLAT.length, finished = FLAT.filter((p) => isDone(p.path)).length;
    const tally = el('p', 'sd-tally', finished + ' of ' + total + ' pages marked done');
    scroller.appendChild(tally);

    SECTIONS.forEach((section) => {
      const box = el('details', 'sd-section');
      box.dataset.section = section.id;
      box.open = !current || current.section === section.id;
      const sum = el('summary');
      sum.appendChild(el('span', 'sd-name', section.name));
      const count = section.pages.filter((p) => isDone(p[0])).length;
      sum.appendChild(el('span', 'sd-count', count + '/' + section.pages.length));
      box.appendChild(sum);
      const list = el('ol', 'sd-list');
      section.pages.forEach((p) => {
        const li = el('li');
        const a = el('a');
        a.href = url(p[0]);
        if (p[1]) a.appendChild(el('span', 'sd-num', p[1].replace(/^\D+/, '')));
        a.appendChild(el('span', 'sd-title', p[2]));
        if (isDone(p[0])) a.appendChild(el('span', 'sd-tick', '✓'));
        else if (seen[p[0]]) a.appendChild(el('span', 'sd-seen', '•'));
        li.appendChild(a);
        if (current && current.path === p[0]) {
          a.setAttribute('aria-current', 'page');
          if (headings.length) {
            const sub = el('ul', 'sd-onpage');
            headings.forEach((h) => {
              const item = el('li');
              const link = el('a', '', h.textContent);
              link.href = '#' + h.id;
              link.addEventListener('click', () => toggleDrawer(false));
              item.appendChild(link);
              sub.appendChild(item);
            });
            li.appendChild(sub);
          }
        }
        list.appendChild(li);
      });
      box.appendChild(list);
      scroller.appendChild(box);
    });
    drawer.appendChild(scroller);

    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      scroller.querySelectorAll('.sd-section').forEach((box) => {
        let any = false;
        box.querySelectorAll('.sd-list > li').forEach((li) => {
          const hit = !q || li.textContent.toLowerCase().indexOf(q) >= 0;
          li.hidden = !hit;
          if (hit) any = true;
        });
        box.hidden = !any;
        if (q && any) box.open = true;
      });
    });
    filter.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const first = scroller.querySelector('.sd-section:not([hidden]) .sd-list > li:not([hidden]) > a');
      if (first) location.href = first.href;
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
  }

  function toggleDrawer(force) {
    const open = force !== undefined ? force : !root.classList.contains('drawer-open');
    root.classList.toggle('drawer-open', open);
    drawer.inert = !open;
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      closePop();
      const here = drawer.querySelector('[aria-current="page"]');
      if (here && here.scrollIntoView) here.scrollIntoView({ block: 'center' });
      const filter = drawer.querySelector('.sd-filter');
      if (filter) filter.focus({ preventScroll: true });
    } else if (drawer.contains(document.activeElement)) {
      menuButton.focus();
    }
  }

  function buildRail() {
    if (headings.length < 3) return;
    rail = el('nav', 'site-rail');
    rail.setAttribute('aria-label', 'On this page');
    rail.appendChild(el('p', 'sr-head', 'On this page'));
    headings.forEach((h) => {
      const a = el('a', '', h.textContent);
      a.href = '#' + h.id;
      rail.appendChild(a);
    });
    document.body.appendChild(rail);
  }

  function buildFooter() {
    const foot = document.querySelector('footer.next');
    if (!foot || !current) return;
    foot.textContent = '';
    foot.classList.add('site-foot');

    const card = (page, cls, word) => {
      const a = el('a', 'sf-card ' + cls);
      a.href = page ? url(page.path) : url('index.html');
      a.dataset.section = page ? page.section : 'home';
      a.appendChild(makeGlyph(page ? page.path : 'home', 46, a));
      const text = el('span', 'sf-text');
      text.appendChild(el('span', 'sf-dir', word));
      text.appendChild(el('strong', '', page ? page.title : 'Course home'));
      text.appendChild(el('span', 'sf-num', page ? (page.num || page.sectionName) : 'All sections'));
      a.appendChild(text);
      return a;
    };
    foot.appendChild(card(prev, 'sf-prev', '← Previous'));

    const mid = el('div', 'sf-mid');
    const tick = el('button', 'sf-done');
    tick.type = 'button';
    const paint = () => {
      const on = isDone(current.path);
      tick.textContent = on ? '✓ Done' : 'Mark as done';
      tick.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    tick.addEventListener('click', () => { setDone(current.path, !isDone(current.path)); paint(); });
    paint();
    mid.appendChild(tick);
    const all = el('button', 'sf-all', 'All lessons');
    all.type = 'button';
    all.addEventListener('click', () => toggleDrawer(true));
    mid.appendChild(all);
    foot.appendChild(mid);

    foot.appendChild(card(next, 'sf-next', 'Next →'));
  }

  function buildTopButton() {
    topButton = el('button', 'site-top', '↑');
    topButton.type = 'button';
    topButton.title = 'Back to the top';
    topButton.setAttribute('aria-label', 'Back to the top');
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: effectsOn() ? 'smooth' : 'auto' }));
    document.body.appendChild(topButton);
  }

  // The course home: a thumbnail and a status on every card, a row of jumps, and a way back in.
  function dressHome() {
    document.querySelectorAll('.lessons a').forEach((a) => {
      const path = (a.getAttribute('href') || '').replace(/^\.\//, '');
      const page = FLAT.find((p) => p.path === path);
      const li = a.closest('li');
      if (li) li.dataset.section = page ? page.section : 'home';
      a.insertBefore(makeGlyph(path, 54, a), a.firstChild);
      if (page && isDone(page.path)) a.appendChild(el('span', 'card-status is-done', '✓ done'));
      else if (page && seen[page.path]) a.appendChild(el('span', 'card-status', 'visited'));
    });

    const header = document.querySelector('main > header');
    if (!header) return;
    if (headings.length) {
      const jump = el('nav', 'jump');
      jump.setAttribute('aria-label', 'Sections');
      headings.forEach((h) => {
        const full = h.textContent;
        const name = /^The /.test(full) ? full.charAt(4).toUpperCase() + full.slice(5) : full;
        const a = el('a', '', name);
        a.href = '#' + h.id;
        jump.appendChild(a);
      });
      header.appendChild(jump);
    }
    const last = FLAT.find((p) => p.path === store.get('last', ''));
    if (last) {
      const again = el('a', 'continue');
      again.href = url(last.path);
      again.dataset.section = last.section;
      again.appendChild(makeGlyph(last.path, 40, again));
      const text = el('span');
      text.appendChild(el('small', '', 'Pick up where you left off'));
      text.appendChild(el('strong', '', label(last)));
      again.appendChild(text);
      again.appendChild(el('span', 'sb-arrow', '→'));
      header.appendChild(again);
    }
  }

  // ---------------------------------------------------------------- the generative cover behind each page title
  // A small flow field (Lesson 5), seeded by the page's address so every page has its own.
  // Each section bends the field differently. The pointer stirs it.
  function buildCover() {
    const header = document.querySelector('main > header');
    if (!header) return;
    const cv = el('canvas', 'cover');
    cv.setAttribute('aria-hidden', 'true');
    header.insertBefore(cv, header.firstChild);
    header.classList.add('has-cover');
    const g = cv.getContext('2d');

    const seed = hash(rel || 'home');
    const N = noise2(seed);
    const pick = rng(seed);
    const styles = { lessons: 0, math: 1, special: 2, printing: 3, three: 2, blender: 0, web: 1, projects: 2, reference: 0, home: 0 };
    const style = styles[current ? current.section : 'home'] || 0;
    const twist = pick() * TAU;
    const centre = [0.55 + pick() * 0.35, 0.2 + pick() * 0.6];

    let W = 0, H = 0, dpr = 1, parts = [], pal = palette(), R = rng(seed + 1);
    let pointer = null, frame = 0, onScreen = true, count = 0;

    function angle(x, y) {
      const n = N(x * 0.0042, y * 0.0042);
      let a = style === 2
        ? Math.atan2(y - centre[1] * H, x - centre[0] * W) + Math.PI / 2 + (n - 0.5) * 2.6
        : n * TAU * 2 + twist;
      if (style === 1) a = Math.round(a / (Math.PI / 3)) * (Math.PI / 3);      // sixths of a turn
      if (style === 3) a = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);      // right angles, like a toolpath
      if (pointer) {
        const dx = x - pointer.x, dy = y - pointer.y;
        const w = Math.exp(-(dx * dx + dy * dy) / (150 * 150));
        const swirl = Math.atan2(dy, dx) + Math.PI / 2;
        a = Math.atan2(Math.sin(a) * (1 - w) + Math.sin(swirl) * w, Math.cos(a) * (1 - w) + Math.cos(swirl) * w);
      }
      return a;
    }
    function spawn(p) {
      p.x = R() * W; p.y = R() * H;
      p.life = 40 + R() * 130; p.age = 0;
      p.c = Math.floor(R() * pal.colours.length);
      p.w = 0.8 + R() * R() * 3.2;
      return p;
    }
    function step() {
      g.lineCap = 'round';
      g.globalAlpha = 0.6;
      for (const p of parts) {
        const a = angle(p.x, p.y);
        const nx = p.x + Math.cos(a) * 1.7, ny = p.y + Math.sin(a) * 1.7;
        g.strokeStyle = pal.colours[p.c];
        g.lineWidth = p.w;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(nx, ny); g.stroke();
        p.x = nx; p.y = ny;
        if (++p.age > p.life || nx < -5 || ny < -5 || nx > W + 5 || ny > H + 5) spawn(p);
      }
      g.globalAlpha = 1;
    }
    function fade() {                           // rub out a little of what is there, so the drawing keeps moving
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = 'rgba(0, 0, 0, 0.09)';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }
    function reset() {
      const box = cv.getBoundingClientRect();
      if (box.width < 10 || box.height < 10) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.width; H = box.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      pal = palette();
      R = rng(seed + 1);
      const n = Math.max(40, Math.min(240, Math.round(W * H / 4200)));
      parts = [];
      for (let i = 0; i < n; i++) parts.push(spawn({}));
      for (let i = 0; i < 150; i++) step();     // a finished drawing straight away, even with motion off
    }
    function tick() {
      frame = 0;
      if (!effectsOn() || !onScreen || document.hidden) return;
      step();
      if (++count % 6 === 0) fade();
      frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame && effectsOn() && onScreen && !document.hidden) frame = requestAnimationFrame(tick); }

    reset();
    header.addEventListener('pointermove', (e) => {
      const box = cv.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    });
    header.addEventListener('pointerleave', () => { pointer = null; });
    if (window.IntersectionObserver) {
      new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; wake(); }).observe(header);
    }
    if (window.ResizeObserver) {
      let timer = 0, lastW = 0;
      new ResizeObserver(() => {
        const w = cv.getBoundingClientRect().width;
        if (Math.abs(w - lastW) < 2) return;
        lastW = w;
        clearTimeout(timer); timer = setTimeout(reset, 150);
      }).observe(header);
    }
    document.addEventListener('visibilitychange', wake);
    listeners.push(() => { reset(); wake(); });
    wake();
  }

  // ---------------------------------------------------------------- clicks bloom, the pointer leaves a trail
  function buildEffects() {
    const cv = el('canvas', 'site-fx');
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const g = cv.getContext('2d');
    const N = noise2(hash('trail'));
    let parts = [], frame = 0, dpr = 1, pal = palette(), clicks = 0, lastPoint = null, travelled = 0;
    listeners.push(() => { pal = palette(); });

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

    // A click plants a sunflower: each seed leaves at the golden angle from the last (Lesson 4).
    function bloom(x, y) {
      const R = rng(hash(rel) + clicks++ * 7919);
      const n = 22 + Math.floor(R() * 14), spin = R() * TAU, shape = Math.floor(R() * 4);
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996323 + spin, speed = 0.9 + Math.sqrt(i) * 0.62;
        parts.push({
          x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          age: 0, life: 38 + R() * 34, size: 3 + R() * 6,
          shape: R() < 0.7 ? shape : Math.floor(R() * 4),
          c: pal.colours[Math.floor(R() * pal.colours.length)],
          rot: R() * TAU, spin: (R() - 0.5) * 0.3, drag: 0.955, fall: 0.035, drift: 0,
        });
      }
    }
    function trail(x, y) {
      if (parts.length > 220) return;
      parts.push({
        x, y, vx: 0, vy: 0, age: 0, life: 26 + Math.random() * 22, size: 2 + Math.random() * 3.5,
        shape: 0, c: pal.colours[Math.floor(Math.random() * pal.colours.length)],
        rot: 0, spin: 0, drag: 0.9, fall: 0, drift: 0.5,
      });
    }
    function tick() {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts = parts.filter((p) => p.age < p.life);
      for (const p of parts) {
        if (p.drift) {                           // trail dots follow a slow noise field
          const a = N(p.x * 0.006, p.y * 0.006) * TAU * 2;
          p.vx += Math.cos(a) * p.drift * 0.2; p.vy += Math.sin(a) * p.drift * 0.2;
        }
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.fall;
        p.x += p.vx; p.y += p.vy; p.rot += p.spin; p.age++;
        const k = 1 - p.age / p.life, s = p.size * (0.4 + 0.6 * k);
        g.globalAlpha = Math.min(1, k * 1.6);
        g.fillStyle = g.strokeStyle = p.c;
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot);
        if (p.shape === 0) { g.beginPath(); g.arc(0, 0, s / 2, 0, TAU); g.fill(); }
        else if (p.shape === 1) g.fillRect(-s / 2, -s / 2, s, s);
        else if (p.shape === 2) { g.beginPath(); g.moveTo(0, -s * 0.6); g.lineTo(s * 0.55, s * 0.45); g.lineTo(-s * 0.55, s * 0.45); g.fill(); }
        else { g.lineWidth = Math.max(1.2, s * 0.28); g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * 0.7, 0); g.lineTo(s * 0.7, 0); g.stroke(); }
        g.restore();
      }
      g.globalAlpha = 1;
      frame = parts.length ? requestAnimationFrame(tick) : 0;
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const quiet = (target) => !target || !target.closest ||
      !!target.closest('.example, textarea, input, select, iframe, pre, .site-drawer, .site-pop, .site-backdrop');

    document.addEventListener('pointerdown', (e) => {
      if (!effectsOn() || quiet(e.target)) return;
      bloom(e.clientX, e.clientY);
      wake();
    });
    document.addEventListener('pointermove', (e) => {
      if (!effectsOn() || e.pointerType !== 'mouse' || quiet(e.target)) { lastPoint = null; return; }
      if (lastPoint) {
        travelled += Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);
        if (travelled > 26) { travelled = 0; trail(e.clientX, e.clientY); wake(); }
      }
      lastPoint = { x: e.clientX, y: e.clientY };
    });
    listeners.push(() => { if (!effectsOn()) parts = []; });
  }

  // ---------------------------------------------------------------- scrolling and keys
  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const y = window.scrollY || doc.scrollTop;
    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (topButton) topButton.classList.toggle('show', y > 900);
    if (rail) {
      let active = -1;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top < 140) active = i; else break;
      }
      const links = rail.querySelectorAll('a');
      links.forEach((a, i) => a.classList.toggle('on', i === active));
    }
  }

  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|CANVAS)$/.test(t.tagName));
    if (e.key === 'Escape') { toggleDrawer(false); closePop(); return; }
    if (typing) return;
    if (e.key === '[' && current) location.href = prev ? url(prev.path) : url('index.html');
    else if (e.key === ']' && current) location.href = next ? url(next.path) : url('index.html');
    else if (e.key === 'm' || e.key === 'M') toggleDrawer();
    else if (e.key === 't' || e.key === 'T') {
      const i = THEMES.findIndex((th) => th.id === themeChoice);
      applyTheme(THEMES[(i + 1) % THEMES.length].id, true);
    }
  }

  function start() {
    collectHeadings();
    buildBar();
    buildPop();
    buildDrawer();
    buildRail();
    buildFooter();
    buildTopButton();
    if (isHome) dressHome();

    const h1 = document.querySelector('main > header h1');
    if (h1) addSquiggle(h1, 240);
    headings.forEach((h) => addSquiggle(h, 110 + (hash(h.textContent) % 70)));

    buildCover();
    buildEffects();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    document.addEventListener('keydown', onKey);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
