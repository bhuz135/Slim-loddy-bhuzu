'use strict';

const D = window.SLB || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- scroll reveal ---------- */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' })
  : null;
const observe = (root = document) => $$('.reveal:not(.in)', root).forEach(el => (io ? io.observe(el) : el.classList.add('in')));

/* ---------- ticker: every release title, looping ---------- */
(function ticker() {
  const el = $('#ticker');
  const titles = (D.releases || []).map(r => r.title);
  if (!titles.length) { el.parentElement.hidden = true; return; }
  const row = titles.map(t => `<span>${esc(t)}</span>`).join('');
  el.innerHTML = row + row; // doubled so the loop is seamless
})();

/* ---------- discography grouped by year ---------- */
(function discography() {
  const root = $('#discography');
  const list = D.releases || [];
  const years = [...new Set(list.map(r => r.year))].sort((a, b) => b - a);

  root.innerHTML = years.map(y => {
    const rows = list.filter(r => r.year === y).map(r => {
      const tag = r.link ? 'a' : 'div';
      const attrs = r.link ? ` href="${esc(r.link)}" target="_blank" rel="noopener"` : '';
      return `
        <${tag} class="rel"${attrs}>
          <span>
            <span class="rel-title">${esc(r.title)}</span>
            ${r.note ? `<span class="rel-note">${r.type === 'Feature' ? 'With ' : ''}${esc(r.note)}</span>` : ''}
          </span>
          <span class="rel-tag${r.type === 'Feature' ? ' feature' : ''}">${esc(r.type || 'Single')}</span>
        </${tag}>`;
    }).join('');
    return `
      <div class="year-block reveal">
        <h3 class="year">${y}</h3>
        <div class="rel-list">${rows}</div>
      </div>`;
  }).join('');
  observe(root);

  // "Find the rest" buttons
  const find = $('#find');
  const soc = Object.entries(D.socials || {}).filter(([, u]) => u);
  if (soc.length) {
    find.innerHTML = '<p>More on:</p>' + soc.map(([n, u]) =>
      `<a class="btn btn-outline-black" href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('');
  } else {
    find.hidden = true;
  }
})();

/* ---------- videos: click-to-play, YouTube or local files ---------- */
(function videos() {
  const list = D.videos || [];
  const stage = $('#videoStage');
  const grid = $('#videoGrid');
  const find = $('#videoFind');
  const yt = (D.socials || {}).YouTube;

  const PLAY = '<span class="vid-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg></span>';
  const ytId = v => {
    const s = String(v || '');
    const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(s) ? s : null);
  };
  const posterOf = v => v.poster || (ytId(v.youtube) ? `https://i.ytimg.com/vi/${ytId(v.youtube)}/hqdefault.jpg` : '');
  const metaOf = v => [v.type, v.year].filter(Boolean).join('. ');

  function showStage(i, autoplay) {
    const v = list[i];
    const poster = posterOf(v);
    stage.innerHTML = `
      <button class="vid" type="button" aria-label="Play ${esc(v.title)}">
        ${poster ? `<img src="${esc(poster)}" alt="" loading="lazy">` : '<span class="vid-art" aria-hidden="true"><span>Bhuzu</span></span>'}
        ${PLAY}
        <span class="vid-title">${esc(v.title)}${metaOf(v) ? `<small>${esc(metaOf(v))}</small>` : ''}</span>
      </button>`;
    $$('.v-card', grid).forEach((c, n) => c.setAttribute('aria-current', String(n === i)));

    const play = () => {
      const id = ytId(v.youtube);
      if (id) {
        stage.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      } else if (v.src) {
        stage.innerHTML = `<video controls autoplay playsinline src="${esc(v.src)}" ${v.poster ? `poster="${esc(v.poster)}"` : ''}></video>`;
      }
    };
    $('.vid', stage).addEventListener('click', play);
    if (autoplay) play();
  }

  if (!list.length) {
    stage.innerHTML = '<div class="vid" role="img" aria-label="Videos coming soon"><span class="vid-art"><span>Videos coming soon</span></span></div>';
  } else {
    grid.innerHTML = list.map((v, i) => `
      <button class="v-card reveal" type="button" data-i="${i}" style="--d:${(i % 4) * 70}ms" aria-label="Show ${esc(v.title)}">
        <span class="v-thumb">
          ${posterOf(v) ? `<img src="${esc(posterOf(v))}" alt="" loading="lazy">` : '<span class="vid-art" aria-hidden="true"></span>'}
          ${PLAY}
        </span>
        <h3>${esc(v.title)}</h3>
        ${metaOf(v) ? `<p class="v-meta">${esc(metaOf(v))}</p>` : ''}
      </button>`).join('');
    $$('.v-card', grid).forEach(card => card.addEventListener('click', () => {
      showStage(Number(card.dataset.i), true);
      stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }));
    showStage(0, false);
    observe(grid);
  }

  if (yt) {
    find.innerHTML = `<a class="btn btn-line" href="${esc(yt)}" target="_blank" rel="noopener">Watch more on YouTube</a>`;
  } else {
    find.hidden = true;
  }
})();

/* ---------- 100 counter ---------- */
(function counter() {
  const el = $('#barsNum');
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  el.textContent = '0';
  const o = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    o.disconnect();
    const start = performance.now(), dur = 1500;
    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(100 * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }, { threshold: 0.4 });
  o.observe(el);
})();

/* ---------- photos: auto-detect images/slim-1.jpg, slim-2.jpg ... ---------- */
(function photos() {
  const probe = src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(src);
    im.onerror = () => res(null);
    im.src = src;
  });
  const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'PNG'];

  async function find() {
    const out = [];
    let misses = 0;
    for (let n = 1; n <= 24 && misses < 2; n++) {
      const hits = await Promise.all(exts.map(e => probe(`images/slim-${n}.${e}`)));
      const hit = hits.find(Boolean);
      if (hit) { out.push(hit); misses = 0; } else { misses++; }
    }
    return out;
  }

  const gallery = $('#photos');
  const navPhotos = $('#navPhotos');
  const grid = $('#grid');
  const dlg = $('#lightbox');
  const lbImg = $('img', dlg);
  let imgs = [], idx = 0;

  const show = () => { lbImg.src = imgs[idx]; lbImg.alt = `Slim Loddy Bhuzu, photo ${idx + 1} of ${imgs.length}`; };
  const open = i => { idx = i; show(); dlg.showModal(); };
  const step = d => { idx = (idx + d + imgs.length) % imgs.length; show(); };

  $('.lb-close', dlg).addEventListener('click', () => dlg.close());
  $('.lb-prev', dlg).addEventListener('click', () => step(-1));
  $('.lb-next', dlg).addEventListener('click', () => step(1));
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lb')) dlg.close(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });

  find().then(found => {
    imgs = found;
    if (!imgs.length) { gallery.hidden = true; navPhotos.hidden = true; return; }

    // hero portrait = first photo
    const p = new Image();
    p.src = imgs[0];
    p.alt = 'Slim Loddy Bhuzu';
    p.decoding = 'async';
    $('#portrait').append(p);
    requestAnimationFrame(() => p.classList.add('on'));

    imgs.forEach((src, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'shot';
      b.setAttribute('aria-label', `Open photo ${i + 1}`);
      const im = new Image();
      im.src = src;
      im.alt = `Slim Loddy Bhuzu, photo ${i + 1}`;
      im.decoding = 'async';
      im.addEventListener('load', () => im.classList.add('on'));
      if (im.complete) im.classList.add('on');
      b.append(im);
      b.addEventListener('click', () => open(i));
      grid.append(b);
    });
  });
})();

/* ---------- contact + footer ---------- */
(function contact() {
  const wrap = $('#links');
  if (D.email) {
    const a = document.createElement('a');
    a.className = 'btn btn-ink';
    a.href = `mailto:${D.email}`;
    a.textContent = D.email;
    wrap.append(a);
  }
  Object.entries(D.socials || {}).filter(([, u]) => u).forEach(([n, u]) => {
    const a = document.createElement('a');
    a.className = 'btn btn-outline-black';
    a.href = u; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = n;
    wrap.append(a);
  });
  if (!wrap.children.length) wrap.hidden = true;
  $('#year').textContent = new Date().getFullYear();
})();

observe();
