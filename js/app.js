/* VECTOR-7 — JSON-driven single-page portfolio. No build step. */
(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = async f => (await fetch(`content/${f}.json?v=${Date.now()}`)).json();

  let C;
  try {
    const [site, gallery, commissions, operations, support, blocks] =
      await Promise.all(['site', 'gallery', 'commissions', 'operations', 'support', 'blocks'].map(load));
    C = { site, gallery, commissions, operations, support, blocks };
  } catch (e) {
    $('#app').innerHTML = `<div class="boot mono">CONTENT FAILED TO LOAD.<br><br>Run a local server (python -m http.server) — file:// cannot fetch JSON.</div>`;
    console.error(e); return;
  }

  // ── i18n ──
  let lang = localStorage.getItem('v7-lang') || C.site.defaultLang || 'EN';
  const L = v => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? v.EN ?? Object.values(v)[0] ?? '') : (v ?? '');
  const fmt = n => Number(n).toLocaleString('en-US');

  // ── shared partials ──
  const frame = (im, extra = '') =>
    `<div class="frame ${extra}">${im.src ? `<img src="${esc(im.src)}" alt="${esc(im.alt || im.label || '')}" loading="lazy">` : `<div class="ph">${esc(im.label || '')}</div>`}${im.cjk ? `<div class="wm">${esc(im.cjk)}</div>` : ''}</div>`;
  const idx = (num, label) => `<div class="idx" data-num="${esc(num)}"><i></i><span class="label">${esc(L(label))}</span></div>`;
  const title = (t, cjk) => `<div class="title"><h2>${esc(L(t))}</h2>${cjk ? `<span class="cjk">${esc(cjk)}</span>` : ''}</div>`;
  const head = b => `${idx(b.num || '', b.title)}<div class="sec-head">${title(b.title, b.cjk)}</div>`;
  const wrapSec = (id, inner, label) => `<section class="sec" id="${esc(id)}" data-nav="${esc(L(label))}"><div class="wrap">${inner}</div></section>`;

  // ── section renderers ──
  const R = {
    hero() {
      const h = C.site.hero, [a, b, c] = h.art || [];
      return `<section class="hero" id="about">
        <div class="hero-txt">
          ${idx('01', C.site.nav[0].label)}
          <h1>${esc(C.site.callsign)}</h1>
          <div class="role">${esc(L(h.role))}</div>
          <div class="paras body">${h.paragraphs.map(p => `<p>${esc(L(p))}</p>`).join('')}</div>
          <div class="chips">${h.tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          <div class="ctas">${h.buttons.map(bt => `<a class="btn ${esc(bt.style)}" href="${esc(bt.href)}">${esc(L(bt.label))}</a>`).join('')}</div>
        </div>
        <div class="hero-art">
          <div class="code mono">${esc(C.site.unitCode)}</div>
          <div class="hero-grid">${a ? frame(a, 'main') : ''}<div class="stack">${b ? frame(b) : ''}${c ? frame(c) : ''}</div></div>
          <div class="hud"><span class="loc">LOC · ${esc(L(h.hud.location))}</span><span class="st">STATUS · ${esc(L(h.hud.status))}</span></div>
        </div>
      </section>`;
    },
    gallery() {
      const g = C.gallery;
      return wrapSec('gallery', `${idx('02', C.site.nav[1].label)}
        <div class="sec-head">${title(g.title, g.cjk)}<div class="filters" id="filters">${g.filters.map((f, i) => `<button data-f="${esc(f)}" class="${i === 0 ? 'on' : ''}">${esc(f)}</button>`).join('')}</div></div>
        <div id="grid"></div>`, g.title);
    },
    commissions() {
      const c = C.commissions;
      const tier = t => {
        const full = t.slots === 0, low = t.slots === 1;
        return `<div class="card">
          <div class="card-head"><div><h3>${esc(t.title)}</h3><div class="price">FROM ${esc(t.usd)} <span>/</span> ${esc(t.rub)}</div></div>
          <div class="slots ${full ? 'full' : low ? 'low' : 'ok'}">SLOTS ${t.slots}/${t.max}</div></div>
          <div class="deliv">${t.items.map(i => `<div>${esc(i)}</div>`).join('')}</div>
          ${full ? `<span class="btn block dim">QUEUE FULL</span>` : `<a class="btn block ghost" href="${esc(t.requestUrl || '#')}">REQUEST</a>`}
        </div>`;
      };
      return wrapSec('commissions', `${idx('03', C.site.nav[2].label)}<div class="sec-head">${title(c.title, c.cjk)}</div>
        <div class="two">
          <div class="brief">
            ${c.brief.map(b => `<div><div class="label">${esc(L(b.label))}</div><p class="body">${esc(L(b.text))}</p></div>`).join('')}
            <div><div class="label" style="margin-bottom:12px">PROCESS</div><div class="steps">${c.process.map((p, i) => `<div><b>${String(i + 1).padStart(2, '0')}</b><span><em>${esc(p.step)}</em> — ${esc(L(p.text))}</span></div>`).join('')}</div></div>
            <div class="pair">
              <div><div class="label">TURNAROUND</div><div class="mono">${c.turnaround.map(esc).join('<br>')}</div></div>
              <div><div class="label">LANGUAGES</div><div class="mono">${c.languages.map(esc).join('<br>')}</div></div>
            </div>
          </div>
          <div class="cards">${c.tiers.map(tier).join('')}
            <div class="terms"><div class="label">TERMS</div><div class="terms-grid">${c.terms.map(t => `<div><b>${esc(t.k)}</b><span>${esc(L(t.v))}</span></div>`).join('')}</div></div>
          </div>
        </div>`, c.title);
    },
    operations() {
      const o = C.operations, cur = o.currency || '$';
      const op = x => `<div class="card op">
        <div class="op-top"><span class="code">${esc(x.code)}</span><span class="status ${esc(x.status)}">${esc(x.status)}</span></div>
        <div><h3>${esc(x.title)}</h3><div class="sub">// ${esc(x.sub)}</div></div>
        <p class="obj body">${esc(L(x.objective))}</p>
        <div><div class="raised"><span>RAISED</span><span>${cur}${fmt(x.raised)} <i>/ ${cur}${fmt(x.goal)}</i></span></div>
        <div class="bar"><b data-pct="${Math.min(100, Math.round(x.raised / x.goal * 100))}"></b></div></div>
        <a class="follow" href="${esc(x.url || '#')}" style="text-align:center">FOLLOW UPDATE</a>
      </div>`;
      return wrapSec('operations', `${idx('04', C.site.nav[3].label)}
        <div class="sec-head">${title(o.title, o.cjk)}<div class="label">${esc(L(o.tagline))}</div></div>
        <div class="ops">${o.items.map(op).join('')}</div>
        <div class="label" style="margin-bottom:24px">TIMELINE</div>
        <div class="rail"><div class="rail-in">${o.timeline.map(m => `<div class="ms"><div class="d">${esc(m.date)}</div><div class="l">${esc(L(m.label))}</div></div>`).join('')}</div></div>`, o.title);
    },
    support() {
      const s = C.support, f = C.operations.items[0], cur = C.operations.currency || '$';
      const row = (m, i) => `<div class="row">
        <div class="row-l"><div class="ic">${esc(m.abbr)}</div><div style="min-width:0"><div class="nm">${esc(m.name)}</div><div class="nt">${esc(m.note)}</div></div></div>
        ${m.copy ? `<button class="act" data-copy="${esc(m.copy)}">COPY</button>` : `<a class="act" href="${esc(m.url || '#')}" target="_blank" rel="noopener">OPEN</a>`}
      </div>`;
      return wrapSec('support', `${idx('05', C.site.nav[4].label)}<div class="sec-head" style="margin-bottom:16px">${title(s.title, s.cjk)}</div>
        <p class="intro body">${esc(L(s.intro))}</p>
        <div class="two narrow">
          <div class="why">
            <div><div class="label" style="margin-bottom:12px">${esc(L(s.whyLabel))}</div><div class="paras body">${s.why.map(p => `<p>${esc(L(p))}</p>`).join('')}</div></div>
            ${f ? `<div class="featured"><div class="label">${esc(L(s.featuredLabel))} — ${esc(f.code)}</div><h3>${esc(f.title)}</h3>
              <div class="raised"><span style="color:var(--fg)">${cur}${fmt(f.raised)}</span><span style="color:var(--fg2)">GOAL ${cur}${fmt(f.goal)}</span></div>
              <div class="bar"><b data-pct="${Math.min(100, Math.round(f.raised / f.goal * 100))}"></b></div>
              <a class="btn block gold" href="#donation-methods">${esc(L(s.donateLabel))}</a></div>` : ''}
          </div>
          <div id="donation-methods"><div class="label" style="margin-bottom:16px">${esc(L(s.methodsLabel))}</div><div class="rows">${s.methods.map(row).join('')}</div></div>
        </div>`, s.title);
    },
    block(sec) {
      const b = C.blocks.blocks.find(x => x.id === sec.id);
      if (!b) return `<!-- block ${sec.id} not found -->`;
      const fn = window.BLOCKS && window.BLOCKS[b.type];
      if (!fn) return `<!-- unknown block type ${b.type} -->`;
      return wrapSec(b.id, fn(b, { L, esc, frame, head }), b.title);
    }
  };

  // ── header / menu / footer ──
  function renderChrome() {
    const s = C.site, st = s.commissionStatus || 'open';
    const links = s.nav.map(n => `<a href="#${esc(n.id)}" data-id="${esc(n.id)}">${esc(L(n.label))}</a>`).join('');
    const pill = `<div class="pill ${esc(st)}">${esc(L(s.statusLabels[st]))}</div>`;
    $('#hdr').innerHTML = `<a class="logo" href="#about"><span class="mark"></span><span class="logo-txt">${esc(s.callsign)}</span></a>
      <nav class="nav">${links}</nav>
      <div class="hdr-r"><div class="lang">${['EN', 'RU'].map(l => `<button data-lang="${l}" class="${l === lang ? 'on' : ''}">${l}</button>`).join('')}</div>${pill}
      <button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button></div>`;
    $('#menu').innerHTML = `<button class="close" id="menu-close">[ CLOSE ]</button><div class="label">MENU // 目錄</div>${links}<div style="margin-top:24px">${pill}</div>`;
    $('#ftr').innerHTML = `<div class="ftr-in"><div class="ftr-l">
      <div class="logo"><span class="mark sm"></span><span class="logo-txt" style="font-size:12px">${esc(s.callsign)}</span></div>
      <div class="mono">© ${esc(s.year)} · ${esc(s.unitCode)}</div><div class="mono disc">${esc(L(s.footer.disclaimer))}</div></div>
      <div class="ftr-links">${s.footer.links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div></div>`;
  }

  // ── gallery grid + lightbox ──
  let filter = 'ALL';
  function renderGrid() {
    const g = C.gallery, all = filter === 'ALL';
    const items = all ? g.items : g.items.filter(i => i.tag === filter);
    if (!items.length) { $('#grid').innerHTML = `<div class="empty">${esc(L(g.emptyText))}</div>`; return; }
    $('#grid').innerHTML = `<div class="bento">${items.map(it => {
      const pos = all && it.col ? `grid-column:${esc(it.col)};grid-row:${esc(it.row || 'auto')}` : 'grid-column:span 4;grid-row:span 2';
      return `<div class="frame tile" data-id="${esc(it.id)}" style="${pos}">
        ${it.src ? `<img src="${esc(it.src)}" alt="${esc(it.label)}" loading="lazy">` : `<div class="ph">${esc(it.label)}</div>`}
        ${it.cjk ? `<div class="wm">${esc(it.cjk)}</div>` : ''}
        <div class="cap"><div class="tag">${esc(it.tag)}</div><div class="ser">${esc(it.series)}</div><div class="meta">${esc(it.year)} · ${esc(it.medium)} · ${esc(it.dims)}</div></div>
      </div>`; }).join('')}</div>`;
  }
  function openLb(id) {
    const it = C.gallery.items.find(i => i.id === id); if (!it) return;
    const lb = $('#lightbox');
    lb.innerHTML = `<div class="lb"><button class="close" data-close>[ CLOSE × ESC ]</button>${frame(it)}
      <div class="lb-info"><div><div class="tag">${esc(it.tag)}</div><div class="ser">${esc(it.series)}</div><div class="meta">${esc(it.year)} · ${esc(it.medium)} · ${esc(it.dims)}${it.tools ? ' · ' + esc(it.tools) : ''}</div></div>
      <button class="lb-more" data-series="${esc(it.tag)}">MORE FROM THIS SERIES ›</button></div></div>`;
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  const closeLb = () => { $('#lightbox').hidden = true; document.body.style.overflow = ''; };

  // ── full render ──
  function render() {
    document.documentElement.lang = lang.toLowerCase();
    document.body.classList.toggle('scanlines', C.site.scanlines !== false);
    renderChrome();
    $('#app').innerHTML = C.site.sections.map(s => (R[s.type] || (() => `<!-- unknown section ${s.type} -->`))(s)).join('');
    if ($('#grid')) renderGrid();
    $('#filters')?.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === filter));
    observeBars(); spy();
  }

  // ── progress bars fill on scroll ──
  function observeBars() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.style.width = e.target.dataset.pct + '%'; io.unobserve(e.target); } }), { threshold: 0.3 });
    document.querySelectorAll('.bar b').forEach(b => io.observe(b));
  }

  // ── scroll-spy + smooth scroll offset ──
  function spy() {
    const ids = C.site.sections.map(s => s.type === 'hero' ? 'about' : s.type === 'block' ? s.id : s.type);
    const y = window.scrollY + 90; let act = ids[0];
    ids.forEach(id => { const el = document.getElementById(id); if (el && el.offsetTop <= y) act = id; });
    document.querySelectorAll('.nav a, .menu a').forEach(a => a.classList.toggle('on', a.dataset.id === act));
  }
  window.addEventListener('scroll', spy, { passive: true });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) {
      const el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 63, behavior: 'smooth' }); $('#menu').hidden = true; document.body.style.overflow = ''; }
    }
  });

  // ── events ──
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-lang]')) { lang = t.closest('[data-lang]').dataset.lang; localStorage.setItem('v7-lang', lang); render(); }
    if (t.closest('#burger')) { $('#menu').hidden = false; document.body.style.overflow = 'hidden'; }
    if (t.closest('#menu-close')) { $('#menu').hidden = true; document.body.style.overflow = ''; }
    if (t.closest('#filters button')) { filter = t.closest('button').dataset.f; renderGrid(); $('#filters').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === filter)); }
    const tile = t.closest('.tile'); if (tile) openLb(tile.dataset.id);
    if (t.closest('[data-close]') || t === $('#lightbox')) closeLb();
    const more = t.closest('[data-series]'); if (more) { filter = more.dataset.series; closeLb(); renderGrid(); document.querySelectorAll('#filters button').forEach(b => b.classList.toggle('on', b.dataset.f === filter)); window.scrollTo({ top: document.getElementById('gallery').offsetTop - 63, behavior: 'smooth' }); }
    const cp = t.closest('[data-copy]'); if (cp) { navigator.clipboard?.writeText(cp.dataset.copy); cp.textContent = 'COPIED'; cp.classList.add('done'); setTimeout(() => { cp.textContent = 'COPY'; cp.classList.remove('done'); }, 2000); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeLb(); $('#menu').hidden = true; document.body.style.overflow = ''; } });

  render();
})();
