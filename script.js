/* ============================================================
   VERONA CAMPAGNA — home
   Depende de data.js (catálogo, card, carrinho, chrome).
   ============================================================ */
'use strict';

(function () {
  const state = { filter: 'all', sort: 'relevancia' };

  const grid = $('#grid');
  const catGrid = $('#catGrid');

  /* ---------------- lista ---------------- */
  function listFor() {
    let list = state.filter === 'all'
      ? VC.products.slice()
      : VC.products.filter(p => p.cat === state.filter);

    if (state.sort === 'menor') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'maior') list.sort((a, b) => b.price - a.price);
    else if (state.sort === 'novidades') list.sort((a, b) => (b.badge === 'Novo' ? 1 : 0) - (a.badge === 'Novo' ? 1 : 0));
    return list;
  }

  function renderGrid() {
    if (!grid) return;
    const list = listFor();
    grid.innerHTML = list.length
      ? list.map((p, i) => VC.productCardHTML(p, i)).join('')
      : `<p class="grid-empty">Nada por aqui nesta categoria — volte para “Todas”.</p>`;

    VC.bindReveals();

    $$('.card', grid).forEach(card => {
      const id = card.dataset.id;
      const p = VC.productById(id);
      const media = $('.card-media', card);

      media.addEventListener('click', e => {
        if (e.target.closest('a') || e.target.closest('[data-add]')) return;
        location.href = 'produto.html?id=' + encodeURIComponent(id);
      });

      const add = $('[data-add]', card);
      if (add) add.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        VC.addToCart(id, p.sizes[0], 1);
      });
    });
  }

  function renderCats() {
    if (!catGrid) return;
    catGrid.innerHTML = VC.cats.map(c => {
      const n = VC.products.filter(p => p.cat === c.id).length;
      return `<a class="cat-card" href="catalogo.html?cat=${c.id}" data-reveal>
        <span class="cat-media"><img src="${c.photo}" alt="${c.label}" loading="lazy" decoding="async"></span>
        <span class="cat-body">
          <span class="cat-name">${c.label}</span>
          <span class="cat-count">${n} ${n === 1 ? 'peça' : 'peças'}</span>
          <span class="cat-tag">${c.tagline}</span>
        </span>
      </a>`;
    }).join('');
    VC.bindReveals();
  }

  function syncCount() {
    const el = $('#collectionCount');
    if (!el) return;
    const n = listFor().length;
    el.textContent = `${n} ${n === 1 ? 'peça' : 'peças'}`;
    const eyebrow = $('#collectionEyebrow');
    if (eyebrow) eyebrow.textContent = state.filter === 'all' ? 'A coleção' : CAT_LABEL[state.filter];
  }

  /* ---------------- controles ---------------- */
  $$('#filters .chip').forEach(chip => chip.addEventListener('click', () => {
    state.filter = chip.dataset.filter;
    $$('#filters .chip').forEach(c => c.classList.toggle('is-active', c === chip));
    renderGrid();
    syncCount();
  }));

  const sortSel = $('#sortSelect');
  if (sortSel) sortSel.addEventListener('change', () => {
    state.sort = sortSel.value;
    renderGrid();
  });

  /* ---------------- newsletter ---------------- */
  const newsForm = $('#newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#newsEmail').value.trim();
      const note = $('#newsNote');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (note) { note.textContent = 'Confira o e-mail digitado para receber o cupom.'; note.style.color = 'var(--red)'; }
        return;
      }
      try {
        const list = JSON.parse(localStorage.getItem('vc_news') || '[]');
        if (!list.includes(email)) list.push(email);
        localStorage.setItem('vc_news', JSON.stringify(list));
      } catch (err) {}
      newsForm.reset();
      if (note) { note.textContent = 'Pronto! Use o cupom VIA10 na primeira compra.'; note.style.color = 'var(--emerald)'; }
      VC.toast('Cupom VIA10 reservado para você');
    });
  }

  /* ---------------- modo varejo/atacado ---------------- */
  document.addEventListener('vc:mode', () => { renderGrid(); renderCats(); syncCount(); });

  /* ---------------- boot ---------------- */
  renderCats();
  renderGrid();
  syncCount();
})();
