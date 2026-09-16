/* ============================================================
   VERONA CAMPAGNA — páginas internas
   catálogo · atacado · sobre · contato · 404
   ============================================================ */
'use strict';

(function () {
  const page = document.body.dataset.page;

  /* ================= catálogo ================= */
  if (page === 'catalogo') {
    const state = { filter: 'all', sort: 'relevancia' };
    const grid = $('#grid');

    const params = new URLSearchParams(location.search);
    const cat = params.get('cat');
    if (cat && CAT_LABEL[cat]) state.filter = cat;

    function syncHead() {
      const isAll = state.filter === 'all';
      const label = isAll ? 'Todas as joias' : CAT_LABEL[state.filter];
      const elTitle = $('#catTitle');
      const elEyebrow = $('#catEyebrow');
      const elSub = $('#catSub');
      if (elEyebrow) elEyebrow.textContent = isAll ? 'A coleção completa' : 'Família';
      if (elTitle) elTitle.textContent = isAll ? 'Todas as joias' : label;
      if (elSub) {
        elSub.textContent = isAll
          ? 'Prata 925 maciça e banho de ouro 18k, feitos à mão em pequenos lotes. Ative o modo atacado no topo para ver os preços de revenda.'
          : taglineFor(state.filter);
      }
      $$('#filters .chip').forEach(c =>
        c.classList.toggle('is-active', c.dataset.filter === state.filter));
    }

    function taglineFor(id) {
      const found = VC.cats.find(c => c.id === id);
      return found ? found.tagline + '. Peças conferidas uma a uma e embaladas para presente.' : '';
    }

    function listFor() {
      let list = state.filter === 'all'
        ? VC.products.slice()
        : VC.products.filter(p => p.cat === state.filter);
      if (state.sort === 'menor') list.sort((a, b) => a.price - b.price);
      else if (state.sort === 'maior') list.sort((a, b) => b.price - a.price);
      else if (state.sort === 'novidades') list.sort((a, b) => (b.badge === 'Novo' ? 1 : 0) - (a.badge === 'Novo' ? 1 : 0));
      return list;
    }

    function render() {
      const list = listFor();
      grid.innerHTML = list.length
        ? list.map((p, i) => VC.productCardHTML(p, i)).join('')
        : `<p class="grid-empty">Nada por aqui ainda — explore outra família.</p>`;
      const count = $('#catCount');
      if (count) count.textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'}`;
      VC.bindReveals();

      $$('.card', grid).forEach(card => {
        const id = card.dataset.id;
        const p = VC.productById(id);
        $('.card-media', card).addEventListener('click', e => {
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

    $$('#filters .chip').forEach(chip => chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      history.replaceState(null, '', state.filter === 'all' ? 'catalogo.html' : `catalogo.html?cat=${state.filter}`);
      syncHead();
      render();
    }));

    const sortSel = $('#sortSelect');
    if (sortSel) sortSel.addEventListener('change', () => { state.sort = sortSel.value; render(); });

    document.addEventListener('vc:mode', render);

    syncHead();
    render();
  }

  /* ================= atacado ================= */
  if (page === 'atacado') {
    const ativar = $('#wsAtivar');
    if (ativar) {
      const sync = () => {
        ativar.innerHTML = VC.isWholesale()
          ? 'Modo atacado ativo — ver catálogo <span class="arr">→</span>'
          : 'Ativar modo atacado <span class="arr">→</span>';
      };
      sync();
      ativar.addEventListener('click', () => {
        if (VC.isWholesale()) { location.href = 'catalogo.html'; return; }
        VC.setMode('atacado');
        VC.toast(`Preços de atacado ativos — mínimo de ${VC.wholesale.min} peças`);
        sync();
      });
      document.addEventListener('vc:mode', sync);
    }

    const form = $('#wsForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
          razao: $('#wsRazao').value.trim(),
          cnpj: $('#wsCnpj').value.trim(),
          nome: $('#wsNome').value.trim(),
          zap: $('#wsZap').value.trim(),
          cidade: $('#wsCidade').value.trim(),
          obs: $('#wsObs').value.trim(),
          criadoEm: new Date().toISOString()
        };
        if (!data.razao || !data.cnpj || !data.nome || !data.zap) {
          VC.toast('Preencha razão social, CNPJ, nome e WhatsApp.');
          return;
        }
        try {
          const leads = JSON.parse(localStorage.getItem('vc_leads') || '[]');
          leads.push(data);
          localStorage.setItem('vc_leads', JSON.stringify(leads));
        } catch (err) {}

        const msg = encodeURIComponent(
          `Olá, Verona Campagna! Quero ser revendedor.\n\n` +
          `Razão social: ${data.razao}\nCNPJ: ${data.cnpj}\n` +
          `Contato: ${data.nome}\nWhatsApp: ${data.zap}\nCidade: ${data.cidade}` +
          (data.obs ? `\nObs.: ${data.obs}` : '')
        );
        VC.toast('Cadastro enviado — abrindo o WhatsApp');
        window.open(`https://wa.me/${VC.brand.whatsapp}?text=${msg}`, '_blank', 'noopener');
        form.reset();
      });
    }
  }

  /* ================= contato ================= */
  if (page === 'contato') {
    const form = $('#ctForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = $('#ctNome').value.trim();
        const assunto = $('#ctAssunto').value.trim();
        const msg = $('#ctMsg').value.trim();
        if (!nome || !msg) { VC.toast('Escreva seu nome e a mensagem.'); return; }
        const text = encodeURIComponent(`Olá! Sou ${nome}.\nAssunto: ${assunto || 'Atendimento'}\n\n${msg}`);
        window.open(`https://wa.me/${VC.brand.whatsapp}?text=${text}`, '_blank', 'noopener');
        VC.toast('Abrindo o WhatsApp do ateliê');
        form.reset();
      });
    }
  }
})();
