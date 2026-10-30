/* 由参考网站的 CircularCarousel、AccordionGallery、ScrollStack 交互思路改写。
   课堂版只用浏览器原生 API，方便离线双击打开与替换真实内容。 */
(() => {
  const data = window.SITE_CONTENT || {};
  const projects = Array.isArray(window.SITE_PROJECTS) ? window.SITE_PROJECTS : [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const localImage = (value) => typeof value === 'string' && /^assets\/[\w\-.\u4e00-\u9fa5]+\.(png|jpe?g|webp|gif)$/i.test(value);
  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };
  const addImage = (parent, path, alt) => {
    if (!localImage(path)) return;
    const image = el('img');
    image.src = path;
    image.alt = alt;
    image.draggable = false;
    image.onerror = () => image.remove();
    parent.append(image);
  };

  // 参考站 About 的环形卡片：前后景深、自动轮转、拖动、按钮和键盘控制。
  const stage = document.querySelector('.hero-stage');
  if (stage) {
    const entries = [
      { label: '认识我', title: data.name || '你的名字', detail: data.intro || '从这里介绍自己', image: data.portrait },
      { label: '看作品', title: projects[0]?.title || '一件真实作品', detail: projects[0]?.category || '让作品说话', image: projects[0]?.image },
      { label: '读经历', title: data.experiences?.[0]?.title || '一段真实经历', detail: data.experiences?.[0]?.detail || '记录真实过程', image: projects[1]?.image }
    ];
    stage.replaceChildren();
    const ring = el('div', 'orbit-ring');
    const portraitSet = Array.isArray(data.portraits) ? data.portraits.filter(localImage) : [];
    const cards = entries.map((item, index) => {
      const card = el('div', 'orbit-card');
      card.dataset.index = index;
      const media = el('div', `orbit-media orbit-media-${index + 1}`);
      if (index === 0 && portraitSet.length >= 2) {
        const stack = el('div', 'orbit-portrait-stack');
        portraitSet.forEach((path, pi) => {
          const image = el('img');
          image.src = path;
          image.alt = pi === 0 ? item.title : `${item.title} ${pi + 1}`;
          image.draggable = false;
          image.onerror = () => image.remove();
          if (pi === 0) image.className = 'is-front';
          stack.append(image);
        });
        media.append(stack);
      } else {
        addImage(media, item.image, item.title);
      }
      card.append(media, el('span', 'orbit-kicker', item.label), el('strong', 'orbit-title', item.title), el('span', 'orbit-detail', item.detail));
      ring.append(card);
      return card;
    });
    const controls = el('div', 'orbit-controls');
    const previous = el('button', 'orbit-arrow', '←');
    previous.type = 'button'; previous.setAttribute('aria-label', '上一张卡片');
    const current = el('span', 'orbit-count');
    const next = el('button', 'orbit-arrow', '→');
    next.type = 'button'; next.setAttribute('aria-label', '下一张卡片');
    controls.append(previous, current, next);
    stage.append(ring, controls);
    let active = 0;
    let paused = false;
    const paint = () => {
      cards.forEach((card, i) => {
        const relative = (i - active + cards.length) % cards.length;
        card.dataset.position = relative === 0 ? 'front' : relative === 1 ? 'right' : 'left';
        card.setAttribute('aria-hidden', relative === 0 ? 'false' : 'true');
      });
      current.textContent = `0${active + 1} / 0${cards.length}`;
    };
    const move = (direction) => { active = (active + direction + cards.length) % cards.length; paint(); };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    stage.addEventListener('mouseenter', () => { paused = true; });
    stage.addEventListener('mouseleave', () => { paused = false; });
    stage.addEventListener('focusin', () => { paused = true; });
    stage.addEventListener('focusout', () => { paused = false; });
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    let pointerX = null;
    ring.addEventListener('pointerdown', (event) => { pointerX = event.clientX; ring.setPointerCapture(event.pointerId); });
    ring.addEventListener('pointerup', (event) => {
      if (pointerX == null) return;
      const distance = event.clientX - pointerX;
      if (Math.abs(distance) > 30) move(distance < 0 ? 1 : -1);
      pointerX = null;
    });
    if (!reduced) window.setInterval(() => { if (!paused && !document.hidden) move(1); }, 4800);
    // 「认识我」卡内三张肖像 3D 翻转轮换，与环形轮转错开节奏。
    const stackImgs = ring.querySelectorAll('.orbit-portrait-stack img');
    if (stackImgs.length >= 2 && !reduced) {
      let pi = 0;
      window.setInterval(() => {
        if (paused || document.hidden) return;
        stackImgs[pi].classList.remove('is-front');
        pi = (pi + 1) % stackImgs.length;
        stackImgs[pi].classList.add('is-front');
      }, 2800);
    }
    paint();
  }

  // 参考站 Work 的展开画廊：悬停与聚焦切换，触屏点击展开。
  const gallery = document.getElementById('work-gallery');
  if (gallery && projects.length >= 2) {
    document.getElementById('work-list').hidden = true;
    const panels = projects.slice(0, 6).map((project, index) => {
      const panel = el('div', 'gallery-panel');
      panel.tabIndex = 0;
      panel.setAttribute('role', 'button');
      panel.setAttribute('aria-label', `展开${project.title || `作品${index + 1}`}`);
      const media = el('div', `gallery-media gallery-media-${index % 4}`);
      media.append(el('span', 'gallery-mark', String(index + 1).padStart(2, '0')));
      addImage(media, project.image, project.title || '作品图片');
      const copy = el('div', 'gallery-copy');
      copy.append(el('small', '', project.category || '真实作品'), el('h3', '', project.title || '作品名称待补充'), el('p', '', project.description || '作品介绍待补充'));
      if (typeof project.link === 'string' && /^https?:\/\//i.test(project.link)) {
        const link = el('a', 'gallery-link', '查看作品 ↗');
        link.href = project.link; link.target = '_blank'; link.rel = 'noopener noreferrer';
        copy.append(link);
      }
      panel.append(media, copy);
      gallery.append(panel);
      return panel;
    });
    let active = Math.min(1, panels.length - 1);
    const paint = () => panels.forEach((panel, index) => {
      panel.classList.toggle('is-active', index === active);
      panel.setAttribute('aria-expanded', index === active ? 'true' : 'false');
    });
    panels.forEach((panel, index) => {
      panel.addEventListener('mouseenter', () => { active = index; paint(); });
      panel.addEventListener('focusin', () => { active = index; paint(); });
      panel.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        active = index; paint();
      });
      panel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault(); active = (index + (event.key === 'ArrowRight' ? 1 : -1) + panels.length) % panels.length; paint(); panels[active].focus();
        }
      });
    });
    paint();
  } else if (gallery) gallery.hidden = true;

  // 参考站 Approach 的经历叠卡：原生 sticky + 随滚动缩放。
  const stack = document.getElementById('experience-stack');
  const experiences = Array.isArray(data.experiences) ? data.experiences.filter(item => item && (item.title || item.detail)).slice(0, 5) : [];
  if (!stack || !experiences.length) {
    document.getElementById('experience')?.remove();
  } else {
    const cards = experiences.map((item, index) => {
      const card = el('article', 'stack-card');
      card.style.setProperty('--stack-index', index);
      card.style.top = `calc(16vh + ${index * 24}px)`;
      card.append(el('span', 'stack-number', `0${index + 1}`), el('h3', '', item.title || '一段真实经历'), el('p', '', item.detail || ''));
      stack.append(card);
      return card;
    });
    if (!reduced && cards.length > 1) {
      let queued = false;
      const update = () => {
        const top = window.innerHeight * 0.18;
        cards.forEach((card, index) => {
          const start = card.offsetTop + stack.getBoundingClientRect().top + window.scrollY - top - index * 24;
          const progress = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, window.innerHeight * .48)));
          card.style.setProperty('--stack-scale', String(1 - progress * .035 * (cards.length - index - 1)));
        });
        queued = false;
      };
      window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  }
})();
