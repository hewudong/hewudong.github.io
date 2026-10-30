(() => {
  const data = window.SITE_CONTENT || {};
  const put = (id, value) => {
    const element = document.getElementById(id);
    if (element && typeof value === 'string') element.textContent = value;
  };
  const setText = (element, value, fallback = '') => {
    if (element) element.textContent = typeof value === 'string' && value ? value : fallback;
  };
  const localImage = (value) => typeof value === 'string' && /^assets\/[\w\-.\u4e00-\u9fa5]+\.(png|jpe?g|webp|gif)$/i.test(value);
  const name = data.name || '你的名字';
  put('nav-name', name);
  put('stage-name', name);
  put('about-name', name);
  document.getElementById('about-particle-title')?.setAttribute('aria-label', `I am ${name}, nice to meet you !`);
  put('footer-name', name);
  put('hero-eyebrow', data.eyebrow);
  put('hero-intro', data.intro);
  put('about-body', data.about);

  const heading = document.getElementById('hero-title');
  heading.replaceChildren(document.createTextNode(data.headlineFirst || '把我做过的事'), document.createElement('br'));
  const emphasis = document.createElement('em');
  emphasis.textContent = data.headlineSecond || '好好介绍给你。';
  heading.append(emphasis);

  if (localImage(data.portrait)) {
    const picture = document.createElement('img');
    picture.className = 'stage-portrait';
    picture.src = data.portrait;
    picture.alt = '';
    picture.onerror = () => picture.remove();
    document.querySelector('.stage-orbit').append(picture);

    const profileVisual = document.getElementById('about-profile-visual');
    const profilePicture = document.createElement('img');
    profilePicture.src = data.portrait;
    profilePicture.alt = `${name}的照片`;
    profilePicture.onerror = () => profilePicture.remove();
    profileVisual.append(profilePicture);
  }

  const prototype = document.querySelector('.work-card');
  const sourceProjects = Array.isArray(data.projects) && data.projects.length ? data.projects.slice(0, 6) : [data.project || {}];
  const renderCard = (card, project) => {
    setText(card.querySelector('.work-label'), project.category, '真实作品');
    setText(card.querySelector('h3'), project.title, '作品名称待补充');
    setText(card.querySelector('.work-copy > p:not(.work-label)'), project.description, '作品介绍待补充');
    const visual = card.querySelector('.work-visual');
    visual.querySelector('img')?.remove();
    visual.classList.remove('has-image');
    if (localImage(project.image)) {
      const picture = document.createElement('img');
      picture.src = project.image;
      picture.alt = project.title || '作品图片';
      picture.onerror = () => { picture.remove(); visual.classList.remove('has-image'); };
      visual.prepend(picture);
      visual.classList.add('has-image');
    }
    const link = card.querySelector('.work-link');
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (typeof project.link === 'string' && /^https?:\/\//i.test(project.link)) {
      link.href = project.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '打开作品 ↗';
      link.removeAttribute('aria-disabled');
    } else {
      link.href = '#work';
      link.textContent = '作品链接待补充';
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (event) => event.preventDefault());
    }
  };
  sourceProjects.forEach((project, index) => {
    const card = index === 0 ? prototype : prototype.cloneNode(true);
    if (index > 0) {
      card.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      document.getElementById('work-list').append(card);
    }
    renderCard(card, project || {});
  });

  window.SITE_PROJECTS = sourceProjects;
  const contactLink = document.getElementById('contact-link');
  const contactUrl = data.contactUrl;
  if (typeof contactUrl === 'string' && /^(mailto:|https?:\/\/)/i.test(contactUrl)) {
    contactLink.href = contactUrl;
    contactLink.textContent = data.contactLabel || '联系我 ↗';
    contactLink.removeAttribute('aria-disabled');
    if (/^https?:\/\//i.test(contactUrl)) {
      contactLink.target = '_blank';
      contactLink.rel = 'noopener noreferrer';
    }
  } else {
    contactLink.addEventListener('click', (event) => event.preventDefault());
  }
  document.title = `${name}｜个人网站`;
})();
