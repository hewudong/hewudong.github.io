/* 参考站 About 标题的离线版：原站布局、三段文字与粒子参数。
   英文固定字形来自 Snell Roundhand 本地点阵蒙版；中文只读 SITE_CONTENT.name。 */
(() => {
  const root = document.getElementById('about-particle-title');
  if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const name = String(window.SITE_CONTENT?.name || document.getElementById('about-name')?.textContent || '你的名字').trim();
  const sources = {
    iam: { image: window.ENGLISH_MASKS?.iam, base: '#7c8792', light: '#3f4d60' },
    name: { text: name, base: '#1a1e2d', light: '#747771' },
    meet: { image: window.ENGLISH_MASKS?.meet, base: '#7c8792', light: '#3f4d60' },
    nice: { image: window.ENGLISH_MASKS?.nice, base: '#7c8792', light: '#3f4d60' },
    you: { image: window.ENGLISH_MASKS?.you, base: '#7c8792', light: '#3f4d60' }
  };
  const images = {};
  const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const hex = (value) => ({ r: parseInt(value.slice(1, 3), 16), g: parseInt(value.slice(3, 5), 16), b: parseInt(value.slice(5, 7), 16) });
  const blend = (a, b, ratio) => `rgb(${Math.round(a.r + (b.r - a.r) * ratio)},${Math.round(a.g + (b.g - a.g) * ratio)},${Math.round(a.b + (b.b - a.b) * ratio)})`;
  const random = (n) => ((n * 9301 + 49297) % 233280) / 233280;
  let visible = false;
  const instances = [];

  for (const segment of root.querySelectorAll('[data-particle]')) {
    const kind = segment.dataset.particle;
    const source = sources[kind];
    const canvas = segment.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx || !source) continue;
    const state = { segment, kind, source, canvas, ctx, particles: [], width: 0, height: 0, frame: 0, running: false, start: 0, buildId: 0, pointer: null };
    instances.push(state);
    segment.addEventListener('pointerenter', (event) => {
      setPointer(state, event);
      if (state.particles.length) scatter(state);
    });
    segment.addEventListener('pointermove', (event) => setPointer(state, event));
    segment.addEventListener('pointerleave', () => { state.pointer = null; });
  }

  function setPointer(state, event) {
    const rect = state.segment.getBoundingClientRect();
    state.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, smoothX: event.clientX - rect.left, smoothY: event.clientY - rect.top };
  }

  function scatter(state) {
    for (const p of state.particles) {
      const angle = p.seed * Math.PI * 2;
      const spread = 180 * (.35 + p.depth * .75);
      p.x = p.tx + Math.cos(angle) * spread + (p.depth - .5) * 180 * .55;
      p.y = p.ty + Math.sin(angle) * spread + (p.seed - .5) * 180 * .55;
      p.sx = p.x; p.sy = p.y; p.delay = p.seed * 420;
    }
    state.start = performance.now();
  }

  async function build(state) {
    const id = ++state.buildId;
    const rect = state.segment.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width < 20 || height < 20) return;
    state.width = width; state.height = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.canvas.width = Math.round(width * dpr);
    state.canvas.height = Math.round(height * dpr);
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mask = document.createElement('canvas');
    mask.width = width; mask.height = height;
    const ink = mask.getContext('2d', { willReadFrequently: true });
    if (!ink) return;

    if (state.source.image) {
      let image;
      try { image = images[state.kind] ||= await loadImage(state.source.image); }
      catch { return; }
      if (id !== state.buildId) return;
      const fontSize = clamp(window.innerWidth * .12, 80, 176);
      const scale = Math.min(fontSize / 240, width * .92 / image.width, height * .86 / image.height);
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      ink.drawImage(image, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
    } else {
      const fontSize = clamp(window.innerWidth * .10, 64, 144);
      let font = `900 ${fontSize}px "Noto Serif SC Local", serif`;
      try { await document.fonts.load(font); await document.fonts.ready; } catch {}
      if (id !== state.buildId) return;
      ink.textAlign = 'center'; ink.textBaseline = 'middle'; ink.fillStyle = '#fff';
      ink.font = font;
      const measured = ink.measureText(state.source.text).width;
      const fitted = measured > width * .92 ? Math.max(18, fontSize * width * .92 / measured) : fontSize;
      font = `900 ${fitted}px "Noto Serif SC Local", serif`;
      ink.font = font;
      ink.fillText(state.source.text, width / 2, height / 2 + fitted * .025);
    }

    const pixels = ink.getImageData(0, 0, width, height).data;
    const targets = [];
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 40) targets.push({ x, y, alpha: alpha / 255 });
      }
    }
    const cap = Math.max(900, Math.min(5200, Math.floor(width * height / 90)));
    const stride = Math.max(1, Math.ceil(targets.length / cap));
    const base = hex(state.source.base);
    const light = hex(state.source.light);
    state.particles = targets.filter((_, i) => i % stride === 0).map((target, index) => {
      const seed = random(index);
      const depth = .45 + ((index * 233 + 97) % 1000) / 1000 * .9;
      const color = blend(base, light, clamp(target.x / width + (seed - .5) * .35, 0, 1));
      return { tx: target.x, ty: target.y, x: target.x, y: target.y, sx: target.x, sy: target.y, size: Math.max(.6, 2 * (.75 + target.alpha * .45)), color, seed, depth, delay: 0 };
    });
    scatter(state);
    state.segment.classList.add('is-ready');
    if (visible && !state.running) run(state);
  }

  function run(state) {
    if (state.running || !state.particles.length) return;
    state.running = true;
    state.frame = requestAnimationFrame((now) => render(state, now));
  }

  function render(state, now) {
    if (!visible) { state.running = false; return; }
    const { ctx, width, height } = state;
    ctx.clearRect(0, 0, width, height);
    if (state.pointer) {
      state.pointer.smoothX += (state.pointer.x - state.pointer.smoothX) * .18;
      state.pointer.smoothY += (state.pointer.y - state.pointer.smoothY) * .18;
    }
    for (const p of state.particles) {
      const t = clamp((now - state.start - p.delay) / 1600, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      let x = p.sx + (p.tx - p.sx) * eased;
      let y = p.sy + (p.ty - p.sy) * eased;
      if (t === 1) {
        x += Math.sin(now * .0009 + p.seed * 10) * .7 * p.depth;
        y += Math.cos(now * .00075 + p.depth * 10) * .7 * p.depth;
      }
      if (state.pointer) {
        const dx = x - state.pointer.smoothX;
        const dy = y - state.pointer.smoothY;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 120) {
          const force = Math.pow(1 - distance / 120, 2) * 40;
          x += dx / distance * force;
          y += dy / distance * force;
        }
      }
      p.x += (x - p.x) * .22;
      p.y += (y - p.y) * .22;
      ctx.globalAlpha = .35 + t * .65;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    state.frame = requestAnimationFrame((time) => render(state, time));
  }

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) instances.forEach(run);
    else instances.forEach((state) => { cancelAnimationFrame(state.frame); state.running = false; });
  }, { threshold: .02 });
  observer.observe(root);
  let resizeFrame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => instances.forEach(build));
  }).observe(root);
  instances.forEach(build);
})();
