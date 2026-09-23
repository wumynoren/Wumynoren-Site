/* Custom block renderers. Each returns an HTML string.
   Register new types: BLOCKS.mytype = (b, ctx) => `...`
   ctx = { L, esc, frame, head }  (see app.js) */
window.BLOCKS = {
  text(b, { L, esc, head }) {
    return head(b) + `<div class="blk-text body">${(b.paragraphs || []).map(p => `<p>${esc(L(p))}</p>`).join('')}</div>`;
  },
  images(b, { L, esc, frame, head }) {
    return head(b) + `<div class="blk-images">${(b.images || []).map(im => frame(im)).join('')}</div>`;
  },
  cards(b, { L, esc, head }) {
    return head(b) + `<div class="blk-cards">${(b.cards || []).map(c => `
      <div class="card"><h3>${esc(L(c.title))}</h3><p class="body">${esc(L(c.text))}</p>${c.link ? `<a class="btn small ghost" style="margin-top:16px" href="${esc(c.link.href)}">${esc(L(c.link.label))}</a>` : ''}</div>`).join('')}</div>`;
  },
  cta(b, { L, esc, head }) {
    const btn = b.button ? `<a class="btn ${esc(b.button.style || 'solid')}" href="${esc(b.button.href || '#')}">${esc(L(b.button.label))}</a>` : '';
    return head(b) + `<div class="blk-cta"><div><h3>${esc(L(b.heading))}</h3><p>${esc(L(b.text))}</p></div>${btn}</div>`;
  },
  html(b, { L, head }) {
    // Raw HTML from JSON. Only use with content you wrote yourself.
    return head(b) + `<div class="blk-html">${L(b.html) || ''}</div>`;
  }
};
