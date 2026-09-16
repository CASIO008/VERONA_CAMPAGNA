/* ============================================================
   VERONA CAMPAGNA — Gioielli
   Núcleo compartilhado: marca, utilidades, catálogo, atacado,
   carrinho, busca e montagem do chrome (header/rodapé/drawer).
   Todas as páginas dependem deste arquivo.
   ============================================================ */
'use strict';

/* ---------------- utilidades ---------------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PIX_OFF = 0.05;
const INSTALLMENTS = 12;
const pixPrice = v => v * (1 - PIX_OFF);
const installmentLabel = v => `ou ${INSTALLMENTS}x de ${brl(v / INSTALLMENTS)} sem juros`;
const offPct = p => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

/* ---------------- marca ---------------- */
const BRAND = {
  name: 'VERONA CAMPAGNA',
  short: 'Verona Campagna',
  tagline: 'Gioielli — joias para durar gerações',
  instagram: '@veronacampagna',
  instagramUrl: 'https://instagram.com/veronacampagna',
  whatsapp: '5511999991234',
  email: 'atelier@veronacampagna.com.br',
  cnpj: '00.000.000/0001-00',
  city: 'São Paulo · Brasil'
};

/* ---------------- atacado ----------------
   10+ peças  → 25% off
   25+ peças  → 35% off
   50+ peças  → 45% off                                       */
const WHOLESALE = {
  min: 10,
  tiers: [
    { min: 10, off: 0.25, label: 'Atacado' },
    { min: 25, off: 0.35, label: 'Atacado Pro' },
    { min: 50, off: 0.45, label: 'Distribuidor' }
  ]
};
const wholesaleTier = qty => {
  const sorted = WHOLESALE.tiers.slice().sort((a, b) => b.min - a.min);
  for (const t of sorted) if (qty >= t.min) return t;
  return null;
};
const wholesalePrice = (price, qty) => {
  const t = wholesaleTier(qty);
  return t ? price * (1 - t.off) : price;
};
const nextTier = qty => WHOLESALE.tiers.find(t => t.min > qty) || null;

/* ---------------- catálogo ---------------- */
const CATS = [
  { id: 'aneis',     label: 'Anéis',     tagline: 'Prata 925 esculpida',  photo: 'images/aneis/anel-coroa-rainha-1.webp' },
  { id: 'brincos',   label: 'Brincos',   tagline: 'Halo e brilho diário', photo: 'images/brincos/brinco-halo-1.jpg' },
  { id: 'colares',   label: 'Colares',   tagline: 'Luz que acompanha',    photo: 'images/colares/colar-starlit-2.jpg' },
  { id: 'pingentes', label: 'Pingentes', tagline: 'Símbolos pessoais',    photo: 'images/pingentes/pingente-esmeralda-1.jpg' },
  { id: 'pulseiras', label: 'Pulseiras', tagline: 'Brilho no pulso',      photo: 'images/pulseiras/pulseira-tennis-1.jpg' }
];
const CAT_LABEL = Object.fromEntries(CATS.map(c => [c.id, c.label]));

const RING_SIZES = ['14', '16', '18', '20', '22', '24'];
const BRACELET_SIZES = ['16', '18', '20'];
const ONLY = ['Único'];

/* preços de lançamento — ajuste livremente */
const PRODUCTS = [
  /* ---- anéis ---- */
  {
    id: 'anel-coroa-rainha', name: 'Anel Coroa Rainha', cat: 'aneis', price: 269, badge: 'Exclusivo',
    meta: 'Prata 925 oxidada · coroa forjada', material: 'Prata 925',
    colors: ['#6E6E73'], colorLabel: 'Prata oxidada',
    photos: ['images/aneis/anel-coroa-rainha-1.webp', 'images/aneis/anel-coroa-rainha-2.webp', 'images/aneis/anel-coroa-rainha-3.webp'],
    desc: 'Coroa de pontas forjadas à mão em prata 925, com acabamento oxidado que marca o relevo a cada brilho. Uma peça de atitude para o dia todo.',
    specs: ['Prata 925 maciça', 'Acabamento oxidado à mão', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },
  {
    id: 'anel-coroa-espinhos', name: 'Anel Coroa de Espinhos', cat: 'aneis', price: 289,
    meta: 'Prata 925 oxidada · espinhos entrelaçados', material: 'Prata 925',
    colors: ['#6E6E73'], colorLabel: 'Prata oxidada',
    photos: ['images/aneis/anel-coroa-espinhos-1.webp', 'images/aneis/anel-coroa-espinhos-2.webp', 'images/aneis/anel-coroa-espinhos-3.webp', 'images/aneis/anel-coroa-espinhos-4.webp'],
    desc: 'Espinhos entrelaçados em prata 925 com contraste de polido e oxidado. Uma releitura gótica da coroa clássica, feita para ser notada.',
    specs: ['Prata 925 maciça', 'Relevo espinhado', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },
  {
    id: 'anel-garra', name: 'Anel Garra', cat: 'aneis', price: 239,
    meta: 'Prata 925 · garras esculpidas', material: 'Prata 925',
    colors: ['#C6C9CE'], colorLabel: 'Prata polida',
    photos: ['images/aneis/anel-garra-1.jpg', 'images/aneis/anel-garra-2.jpg'],
    desc: 'Garras orgânicas envoltas em prata polida de alto brilho. Escultura de dedo com peso e presença — combina com tudo, sozinho ou empilhado.',
    specs: ['Prata 925 maciça', 'Polimento espelhado', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },
  {
    id: 'anel-onda', name: 'Anel Onda', cat: 'aneis', price: 219, badge: 'Novo',
    meta: 'Prata 925 · formas orgânicas', material: 'Prata 925',
    colors: ['#C6C9CE'], colorLabel: 'Prata escovada',
    photos: ['images/aneis/anel-onda-1.jpg', 'images/aneis/anel-onda-2.jpg', 'images/aneis/anel-onda-3.png'],
    desc: 'Linhas onduladas esculpidas em prata, inspiradas no movimento das marés. Acabamento escovado que absorve a luz sem refletir de mais.',
    specs: ['Prata 925 maciça', 'Acabamento escovado', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },
  {
    id: 'anel-asa', name: 'Anel Asa de Anjo', cat: 'aneis', price: 249, badge: 'Best-seller',
    meta: 'Prata 925 oxidada · penas em relevo', material: 'Prata 925',
    colors: ['#6E6E73'], colorLabel: 'Prata oxidada',
    photos: ['images/aneis/anel-asa-1.jpg', 'images/aneis/anel-asa-2.jpg', 'images/aneis/anel-asa-3.webp', 'images/aneis/anel-asa-4.jpg'],
    desc: 'Asas abertas esculpidas pena por pena em prata 925, com oxidação que destaca cada detalhe. Símbolo de recomeço para usar rente ao dedo.',
    specs: ['Prata 925 maciça', 'Detalhe pena a pena', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },
  {
    id: 'anel-sarca', name: 'Anel Sarça', cat: 'aneis', price: 279,
    meta: 'Prata 925 polida · trama vazada', material: 'Prata 925',
    colors: ['#C6C9CE'], colorLabel: 'Prata polida',
    photos: ['images/aneis/anel-sarca-1.jpg'],
    desc: 'Trama vazada de ramos que se cruzam em prata polida. Leve no dedo, densa no olhar — a peça de quem prefere o inesperado.',
    specs: ['Prata 925 maciça', 'Estrutura vazada', 'Aros do 14 ao 24'],
    sizes: RING_SIZES
  },

  /* ---- brincos ---- */
  {
    id: 'brinco-halo', name: 'Brinco Halo', cat: 'brincos', price: 299, badge: 'Best-seller',
    meta: 'Prata 925 · zircônia halo', material: 'Prata 925',
    colors: ['#E8E8EA'], colorLabel: 'Prata polida',
    photos: ['images/brincos/brinco-halo-1.jpg'],
    desc: 'Uma zircônia central cercada por um halo de pedras menores, engastadas à mão em prata 925. O brilho clássico que atravessa o dia e a noite.',
    specs: ['Prata 925 com marca S925', 'Zircônias lapidadas', 'Certe, com fecho de segurança'],
    sizes: ONLY
  },
  {
    id: 'brinco-argola', name: 'Argola Torcida', cat: 'brincos', price: 219,
    meta: 'Banho de ouro 18k · haste torcida', material: 'Prata com banho de ouro',
    colors: ['#C9A227'], colorLabel: 'Dourado',
    photos: ['images/brincos/brinco-argola-1.jpg'],
    desc: 'Argola de haste torcida com banho de ouro 18k sobre prata. Brilho quente e contínuo, para usar todos os dias sem tirar.',
    specs: ['Prata com banho de ouro 18k', 'Haste torcida polida', 'Fecho de encaixe seguro'],
    sizes: ONLY
  },

  /* ---- colares ---- */
  {
    id: 'colar-starlit', name: 'Colar Starlit', cat: 'colares', price: 349, badge: 'Novo',
    meta: 'Banho de ouro · 7 zircônias', material: 'Prata com banho de ouro',
    colors: ['#C9A227'], colorLabel: 'Dourado',
    photos: ['images/colares/colar-starlit-1.jpg', 'images/colares/colar-starlit-2.jpg'],
    desc: 'Sete zircônias em degradê formam uma linha de luz sobre o colo, presas em corrente de banho de ouro. Presença de cerimônia, conforto de todo dia.',
    specs: ['Banho de ouro 18k sobre prata', '7 zircônias em degradê', 'Corrente 42 cm + extensor'],
    sizes: ONLY
  },

  /* ---- pingentes ---- */
  {
    id: 'pingente-esmeralda', name: 'Pingente Esmeralda Gota', cat: 'pingentes', price: 389, badge: 'Exclusivo',
    meta: 'Banho de ouro · cristal verde gota', material: 'Prata com banho de ouro',
    colors: ['#0F5132'], colorLabel: 'Esmeralda',
    photos: ['images/pingentes/pingente-esmeralda-1.jpg', 'images/pingentes/pingente-esmeralda-2.jpg'],
    desc: 'Cristal facetado em tom esmeralda, cercado por micro-pedras brancas e pendurado em corrente de banho de ouro. A gota de cor que faltava no seu colar.',
    specs: ['Banho de ouro 18k sobre prata', 'Cristal gota facetado', 'Corrente 45 cm inclusa'],
    sizes: ONLY
  },

  /* ---- pulseiras ---- */
  {
    id: 'pulseira-tennis', name: 'Pulseira Tennis', cat: 'pulseiras', price: 429, badge: 'Exclusivo',
    meta: 'Prata 925 · fileira de zircônias', material: 'Prata 925',
    colors: ['#E8E8EA'], colorLabel: 'Prata polida',
    photos: ['images/pulseiras/pulseira-tennis-1.jpg', 'images/pulseiras/pulseira-tennis-2.jpg'],
    desc: 'Fileira contínua de zircônias engastadas uma a uma em prata 925, com fecho duplo de segurança. O clássico tennis — agora em toda a volta do pulso.',
    specs: ['Prata 925 maciça', 'Zircônias engastadas 4 garras', 'Fecho box com trava dupla'],
    sizes: BRACELET_SIZES
  }
];

const productById = id => PRODUCTS.find(p => p.id === id);
const productsByCat = cat => PRODUCTS.filter(p => p.cat === cat);
const isNew = p => p.badge === 'Novo';

/* ---------------- editorial (home) ---------------- */
const EDITORIAL = {
  hero: 'images/editorial/modelo-4.jpg',
  duoA: 'images/editorial/modelo-3.jpg',
  duoB: 'images/editorial/modelo-2.jpg',
  about: 'images/editorial/modelo-1.jpg',
  quote: 'images/editorial/modelo-5.jpg'
};

/* ---------------- carrinho ----------------
   Itens: { id, size, qty }. Preço é calculado na hora, conforme o
   modo ativo (varejo/atacado), então trocar de modo atualiza tudo.  */
const CART_KEY = 'vc_cart';
const MODE_KEY = 'vc_modo';
const INTRO_KEY = 'vc_intro_v1';

const VC = {};
window.VC = VC;

VC.brand = BRAND;
VC.products = PRODUCTS;
VC.cats = CATS;
VC.wholesale = WHOLESALE;
VC.productById = productById;

VC.mode = () => {
  try { return localStorage.getItem(MODE_KEY) === 'atacado' ? 'atacado' : 'varejo'; } catch (e) { return 'varejo'; }
};
VC.setMode = m => {
  const mode = m === 'atacado' ? 'atacado' : 'varejo';
  try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
  document.body.classList.toggle('modo-atacado', mode === 'atacado');
  $$('.mode-toggle button').forEach(x =>
    x.setAttribute('aria-pressed', x.dataset.mode === mode ? 'true' : 'false'));
  document.dispatchEvent(new CustomEvent('vc:mode', { detail: mode }));
};
VC.isWholesale = () => VC.mode() === 'atacado';

VC.loadCart = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(i => productById(i.id) && i.qty > 0) : [];
  } catch (e) { return []; }
};
VC.saveCart = cart => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
};
VC.cart = VC.loadCart();

VC.cartQty = cart => (cart || VC.cart).reduce((s, i) => s + i.qty, 0);
VC.linePrice = item => {
  const p = productById(item.id);
  if (!p) return 0;
  if (!VC.isWholesale()) return p.price;
  return wholesalePrice(p.price, VC.cartQty());
};
VC.cartSubtotal = cart => (cart || VC.cart).reduce((s, i) => s + VC.linePrice(i) * i.qty, 0);
VC.retailSubtotal = cart => (cart || VC.cart).reduce((s, i) => { const p = productById(i.id); return s + (p ? p.price * i.qty : 0); }, 0);

VC.addToCart = (id, size, qty = 1, opts = {}) => {
  const p = productById(id);
  if (!p) return;
  const s = size || p.sizes[0];
  const found = VC.cart.find(i => i.id === id && i.size === s);
  if (found) found.qty += qty;
  else VC.cart.push({ id, size: s, qty });
  VC.saveCart(VC.cart);
  VC.renderCart();
  VC.bumpBadge();
  if (opts.silent !== true) {
    VC.toast(VC.isWholesale()
      ? `${p.name} adicionado — atacado`
      : `${p.name} adicionado à sacola`);
  }
};
VC.updateQty = (id, size, delta) => {
  const it = VC.cart.find(i => i.id === id && i.size === size);
  if (!it) return;
  it.qty = Math.max(0, it.qty + delta);
  VC.cart = VC.cart.filter(i => i.qty > 0);
  VC.saveCart(VC.cart);
  VC.renderCart();
};
VC.removeItem = (id, size) => {
  VC.cart = VC.cart.filter(i => !(i.id === id && i.size === size));
  VC.saveCart(VC.cart);
  VC.renderCart();
};
VC.clearCart = () => {
  VC.cart = [];
  VC.saveCart(VC.cart);
  VC.renderCart();
};

/* preço exibido no card / PDP, conforme o modo */
VC.priceBlockHTML = (p, opts = {}) => {
  if (VC.isWholesale()) {
    const w = wholesalePrice(p.price, Math.max(VC.cartQty(), WHOLESALE.min));
    const off = Math.round((1 - w / p.price) * 100);
    return `<p class="price price--wholesale">
      <span class="price-now">${brl(w)}<em class="price-unit">/peça</em></span>
      <span class="price-old"><s>${brl(p.price)}</s><b>${off}% OFF</b></span>
      <span class="price-hint">a partir de ${WHOLESALE.min} peças · até 45% em 50+</span>
    </p>`;
  }
  const off = offPct(p);
  return `<p class="price">
    ${p.oldPrice ? `<s>${brl(p.oldPrice)}</s>` : ''}${brl(p.price)}${off ? `<b class="price-off">-${off}%</b>` : ''}
    <span class="price-hint">5% off no Pix · ${installmentLabel(p.price)}</span>
  </p>`;
};

/* ---------------- card de produto ---------------- */
VC.badgeHTML = b => {
  if (!b) return '';
  const cls = b === 'Best-seller' ? 'best' : b === 'Novo' ? 'new' : 'exclusive';
  return `<span class="card-badge ${cls}">${b}</span>`;
};
VC.productCardHTML = (p, i) => {
  const alt = p.photos[1]
    ? `<img class="card-photo alt" src="${p.photos[1]}" alt="" loading="lazy" decoding="async">`
    : '';
  return `<article class="card" style="--i:${i}" data-id="${p.id}">
    <div class="card-media" data-reveal>
      ${VC.badgeHTML(p.badge)}
      <span class="card-index">${String(i + 1).padStart(2, '0')}</span>
      <img class="card-photo" src="${p.photos[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async">
      ${alt}
      <div class="card-quick">
        <a class="quick-view" href="produto.html?id=${encodeURIComponent(p.id)}">Ver</a>
        <button class="quick-add" type="button" data-add aria-label="Adicionar ${esc(p.name)} à sacola">Adicionar</button>
      </div>
    </div>
    <div class="card-info">
      <span class="card-cat">${CAT_LABEL[p.cat]}</span>
      <h3><a href="produto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
      <p class="card-meta">${p.meta}</p>
      ${VC.priceBlockHTML(p)}
    </div>
  </article>`;
};

/* ---------------- chrome: header / rodapé / drawer / busca ----------------
   Montados via JS para manter um único ponto de verdade em todas as
   páginas (sem includes no HTML estático).                           */
const ICONS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1.2 12.2a1.6 1.6 0 0 1-1.6 1.4H8.8a1.6 1.6 0 0 1-1.6-1.4L6 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>',
  sun: '<svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',
  moon: '<svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.8 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-2.9-1.3-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4-.1.7.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.3.3c-.1.1-.2.3 0 .6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.9-1.1c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.2.5.4 0 .1 0 .8-.2 1.4Z"/></svg>'
};

const NAV_LINKS = [
  { href: 'catalogo.html?cat=aneis', label: 'Anéis' },
  { href: 'catalogo.html?cat=brincos', label: 'Brincos' },
  { href: 'catalogo.html?cat=colares', label: 'Colares' },
  { href: 'catalogo.html?cat=pingentes', label: 'Pingentes' },
  { href: 'catalogo.html?cat=pulseiras', label: 'Pulseiras' },
  { href: 'atacado.html', label: 'Atacado', highlight: true },
  { href: 'sobre.html', label: 'Sobre' }
];

VC.headerHTML = () => `
  <header class="site-header" id="header">
    <div class="announce">
      <div class="wrap announce-inner">
        <span>Frete grátis acima de ${brl(299)}</span>
        <span class="dot" aria-hidden="true">•</span>
        <span>5% off no Pix</span>
        <span class="dot" aria-hidden="true">•</span>
        <span>12x sem juros</span>
        <span class="dot" aria-hidden="true">•</span>
        <span>Atacado a partir de ${WHOLESALE.min} peças</span>
      </div>
    </div>
    <div class="wrap header-inner">
      <button class="burger" id="burger" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span></button>

      <a class="brand" href="index.html" aria-label="${BRAND.name} — início">
        <span class="brand-word">VERONA <em>CAMPAGNA</em></span>
        <span class="brand-sub">GIOIELLI</span>
      </a>

      <nav class="mainnav" aria-label="Categorias">
        ${NAV_LINKS.map(l => `<a href="${l.href}"${l.highlight ? ' class="nav-atacado"' : ''}>${l.label}</a>`).join('')}
      </nav>

      <div class="header-actions">
        <div class="mode-toggle" role="group" aria-label="Modo de preço">
          <button type="button" data-mode="varejo" aria-pressed="${VC.isWholesale() ? 'false' : 'true'}">Varejo</button>
          <button type="button" data-mode="atacado" aria-pressed="${VC.isWholesale() ? 'true' : 'false'}">Atacado</button>
        </div>
        <a class="icon-btn" id="accountBtn" href="conta.html" aria-label="Minha conta" title="Minha conta">${ICONS.user}</a>
        <button class="icon-btn" id="searchBtn" type="button" aria-label="Buscar joias">${ICONS.search}</button>
        <button class="icon-btn theme-toggle" id="themeToggle" type="button" aria-label="Alternar tema claro e escuro" aria-pressed="false">${ICONS.sun}${ICONS.moon}</button>
        <button class="icon-btn cart-btn" id="cartBtn" type="button" aria-label="Abrir sacola">
          ${ICONS.bag}<span class="cart-count zero" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
    <nav aria-label="Menu">
      <a href="catalogo.html" data-mm>Todas as joias</a>
      ${NAV_LINKS.map(l => `<a href="${l.href}" data-mm>${l.label}</a>`).join('')}
      <a href="conta.html" data-mm>Minha conta</a>
      <a href="contato.html" data-mm>Atendimento</a>
    </nav>
    <div class="mobile-foot">
      <span>${BRAND.instagram}</span>
      <span>Prata 925 · banho de ouro 18k</span>
    </div>
  </div>`;

VC.footerHTML = () => `
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <span class="brand-word big">VERONA <em>CAMPAGNA</em></span>
        <p>${BRAND.tagline}. Peças em prata 925 e banho de ouro, feitas em pequenos lotes no nosso ateliê.</p>
        <p class="footer-contact">
          <a href="mailto:${BRAND.email}">${BRAND.email}</a><br>
          <a href="https://wa.me/${BRAND.whatsapp}" target="_blank" rel="noopener">${BRAND.whatsapp.replace(/^55/, '+55 ').replace(/^(\+55 \d{2})(\d{5})(\d{4})$/, '$1 $2-$3')}</a>
        </p>
      </div>
      <nav class="footer-col" aria-label="Joias">
        <h4>Joias</h4>
        <a href="catalogo.html">Todas as peças</a>
        ${CATS.map(c => `<a href="catalogo.html?cat=${c.id}">${c.label}</a>`).join('')}
      </nav>
      <nav class="footer-col" aria-label="Atacado">
        <h4>Atacado</h4>
        <a href="atacado.html">Seja revendedor</a>
        <a href="atacado.html#faixas">Faixas de desconto</a>
        <a href="atacado.html#duvidas">Dúvidas frequentes</a>
      </nav>
      <nav class="footer-col" aria-label="Ajuda">
        <h4>Ajuda</h4>
        <a href="contato.html">Central de atendimento</a>
        <a href="contato.html#trocas">Trocas e devoluções</a>
        <a href="contato.html#medidas">Guia de medidas</a>
        <a href="contato.html#cuidados">Cuidados com a joia</a>
      </nav>
      <nav class="footer-col" aria-label="Ateliê">
        <h4>Ateliê</h4>
        <a href="sobre.html">Nossa história</a>
        <a href="sobre.html#materiais">Materiais</a>
        <a href="${BRAND.instagramUrl}" target="_blank" rel="noopener">Instagram</a>
      </nav>
    </div>
    <div class="wrap footer-pay">
      <span class="footer-pay-label">Formas de pagamento</span>
      <ul class="pay-list">
        ${['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'pix', 'boleto'].map(n => `<li><img src="images/pay/${n}.svg" alt="${n}" width="54" height="37" loading="lazy" decoding="async"></li>`).join('')}
      </ul>
    </div>
    <div class="wrap footer-bottom">
      <span>© ${new Date().getFullYear()} ${BRAND.name} · CNPJ ${BRAND.cnpj}</span>
      <span>${BRAND.city}</span>
      <span class="footer-love">Feito à mão, como toda joia deve ser.</span>
    </div>
  </footer>`;

VC.cartDrawerHTML = () => `
  <aside class="cart" id="cart" aria-hidden="true" aria-label="Sacola de compras">
    <header class="cart-head">
      <h3>Sacola <span id="cartHeadCount">(0)</span></h3>
      <button class="icon-x" id="cartClose" aria-label="Fechar sacola">✕</button>
    </header>
    <div class="cart-mode" id="cartMode"></div>
    <div class="cart-body" id="cartBody"></div>
    <footer class="cart-foot" id="cartFoot">
      <div class="ship">
        <div class="ship-bar"><i id="shipFill"></i></div>
        <p id="shipMsg"></p>
      </div>
      <div class="cart-total"><span>Subtotal</span><strong id="cartTotal">R$ 0,00</strong></div>
      <p class="cart-save" id="cartSave" hidden></p>
      <button class="btn btn-dark full" id="checkoutBtn" type="button">Finalizar compra</button>
      <p class="cart-note">Frete e cupom calculados no checkout · Pix com 5% de desconto</p>
    </footer>
  </aside>
  <div class="search" id="search" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Buscar joias">
    <button class="icon-x search-close" id="searchClose" type="button" aria-label="Fechar busca">✕</button>
    <div class="search-inner">
      <p class="search-eyebrow">Busca</p>
      <label class="search-label" for="searchInput">Qual joia você procura?</label>
      <input class="search-input" id="searchInput" type="search" placeholder="Anel, colar, esmeralda…" autocomplete="off" spellcheck="false">
      <div class="search-sugg" id="searchSugg"></div>
      <div class="search-results" id="searchResults"></div>
    </div>
  </div>`;

VC.mountChrome = () => {
  const headerSlot = $('#siteHeader');
  if (headerSlot) headerSlot.innerHTML = VC.headerHTML();
  const footerSlot = $('#siteFooter');
  if (footerSlot) footerSlot.innerHTML = VC.footerHTML();
  const drawers = $('#siteDrawers');
  if (drawers) drawers.innerHTML = VC.cartDrawerHTML();

  document.body.classList.toggle('modo-atacado', VC.isWholesale());
  VC.initHeader();
  VC.initSearch();
  VC.renderCart();
  VC.bindReveals();
  document.dispatchEvent(new CustomEvent('vc:chrome'));
};

VC.initHeader = () => {
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', open);
    });
    $$('[data-mm]', menu).forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }));
  }

  $$('.mode-toggle button').forEach(b => b.addEventListener('click', () => {
    if (VC.mode() === b.dataset.mode) return;
    VC.setMode(b.dataset.mode);
    $$('.mode-toggle button').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === VC.mode() ? 'true' : 'false'));
    VC.toast(b.dataset.mode === 'atacado'
      ? `Modo atacado · ${WHOLESALE.min}+ peças, até 45% off`
      : 'Modo varejo restaurado');
    VC.renderCart();
  }));

  const cartBtn = $('#cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', VC.openCart);
  const close = $('#cartClose');
  if (close) close.addEventListener('click', VC.closeCart);
  const scrim = $('#scrim');
  if (scrim) scrim.addEventListener('click', VC.closeCart);
  const ckBtn = $('#checkoutBtn');
  if (ckBtn) ckBtn.addEventListener('click', () => {
    if (!VC.cart.length) { VC.toast('Sua sacola está vazia.'); return; }
    if (VC.isWholesale() && VC.cartQty() < WHOLESALE.min) {
      VC.toast(`Atacado a partir de ${WHOLESALE.min} peças — faltam ${WHOLESALE.min - VC.cartQty()}.`);
      return;
    }
    location.href = 'checkout.html';
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { VC.closeCart(); VC.closeSearch(); } });
};

VC.openCart = () => {
  const cart = $('#cart');
  if (!cart) return;
  cart.classList.add('open');
  cart.setAttribute('aria-hidden', 'false');
  const scrim = $('#scrim');
  if (scrim) scrim.classList.add('show');
  document.body.classList.add('no-scroll');
};
VC.closeCart = () => {
  const cart = $('#cart');
  if (!cart) return;
  cart.classList.remove('open');
  cart.setAttribute('aria-hidden', 'true');
  const scrim = $('#scrim');
  if (scrim) scrim.classList.remove('show');
  document.body.classList.remove('no-scroll');
};

VC.cartLineHTML = item => {
  const p = productById(item.id);
  if (!p) return '';
  const unit = VC.linePrice(item);
  return `<div class="cart-item" data-id="${p.id}" data-size="${esc(item.size)}">
    <a class="cart-thumb" href="produto.html?id=${encodeURIComponent(p.id)}"><img src="${p.photos[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async"></a>
    <div class="cart-info">
      <a class="cart-name" href="produto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
      <span class="cart-meta">${CAT_LABEL[p.cat]} · Tam ${esc(item.size)}</span>
      <span class="cart-unit">${brl(unit)}${VC.isWholesale() ? '<em> atacado</em>' : ''}</span>
      <div class="cart-qty">
        <button type="button" data-minus aria-label="Diminuir">−</button>
        <span>${item.qty}</span>
        <button type="button" data-plus aria-label="Aumentar">+</button>
      </div>
    </div>
    <div class="cart-line">
      <strong>${brl(unit * item.qty)}</strong>
      <button type="button" class="cart-remove" data-remove>Remover</button>
    </div>
  </div>`;
};

VC.renderCart = () => {
  const body = $('#cartBody');
  if (!body) return;
  const count = VC.cartQty();
  const headCount = $('#cartHeadCount');
  if (headCount) headCount.textContent = `(${count})`;
  const badge = $('#cartCount');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('zero', count === 0);
  }

  const modeBar = $('#cartMode');
  if (modeBar) {
    modeBar.innerHTML = VC.isWholesale()
      ? `<span class="cart-mode-tag">ATACADO</span> ${VC.tierProgressHTML(count)}`
      : `<span class="cart-mode-tag retail">VAREJO</span> <span class="cart-mode-note">preços de varejo · 5% off no Pix</span>`;
  }

  body.innerHTML = VC.cart.length
    ? VC.cart.map(VC.cartLineHTML).join('')
    : `<div class="cart-empty">
        <p>Sua sacola está vazia.</p>
        <a class="btn btn-ghost" href="catalogo.html">Explorar joias</a>
      </div>`;

  $$('.cart-item', body).forEach(el => {
    const id = el.dataset.id, size = el.dataset.size;
    const minus = $('[data-minus]', el); if (minus) minus.addEventListener('click', () => VC.updateQty(id, size, -1));
    const plus = $('[data-plus]', el); if (plus) plus.addEventListener('click', () => VC.updateQty(id, size, 1));
    const rm = $('[data-remove]', el); if (rm) rm.addEventListener('click', () => VC.removeItem(id, size));
  });

  const sub = VC.cartSubtotal();
  const total = $('#cartTotal');
  if (total) total.textContent = brl(sub);
  const save = $('#cartSave');
  if (save) {
    if (VC.isWholesale() && count >= WHOLESALE.min) {
      const saved = VC.retailSubtotal() - sub;
      save.hidden = false;
      save.textContent = `Você economiza ${brl(saved)} no atacado`;
    } else save.hidden = true;
  }

  const fill = $('#shipFill');
  const msg = $('#shipMsg');
  if (fill && msg) {
    const goal = 299;
    fill.style.width = Math.min(100, (sub / goal) * 100) + '%';
    msg.innerHTML = sub >= goal
      ? 'Você ganhou <strong>frete grátis</strong>.'
      : `Faltam <strong>${brl(goal - sub)}</strong> para o frete grátis.`;
  }
};

VC.tierProgressHTML = count => {
  const t = wholesaleTier(count);
  const n = nextTier(count);
  if (!t) {
    return `<span class="cart-mode-note">faltam <b>${WHOLESALE.min - count}</b> peças para o mínimo de ${WHOLESALE.min}</span>`;
  }
  const pct = n ? Math.min(100, (count / n.min) * 100) : 100;
  return `<span class="cart-mode-note">${t.label} · <b>${Math.round(t.off * 100)}% off</b>${n ? ` · faltam ${n.min - count} p/ ${Math.round(n.off * 100)}%` : ' · faixa máxima'}</span>
    <span class="tier-bar"><i style="width:${pct}%"></i></span>`;
};

VC.bumpBadge = () => {
  const badge = $('#cartCount');
  if (!badge) return;
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
};

VC.toast = msg => {
  const t = $('#toast');
  if (!t) return;
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  clearTimeout(VC._toastT);
  VC._toastT = setTimeout(() => t.classList.remove('show'), 2600);
};

/* ---------------- busca ---------------- */
VC.initSearch = () => {
  const modal = $('#search');
  if (!modal) return;
  const btn = $('#searchBtn');
  const close = $('#searchClose');
  const input = $('#searchInput');
  const results = $('#searchResults');
  const sugg = $('#searchSugg');

  const open = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => input.focus(), 60);
  };
  VC.openSearch = open;

  if (btn) btn.addEventListener('click', open);
  if (close) close.addEventListener('click', VC.closeSearch);
  modal.addEventListener('click', e => { if (e.target === modal) VC.closeSearch(); });

  const chips = ['Anéis', 'Colares', 'Esmeralda', 'Prata 925', 'Presente'];
  if (sugg) {
    sugg.innerHTML = chips.map(c => `<button type="button" class="chip" data-q="${c}">${c}</button>`).join('');
    $$('button', sugg).forEach(c => c.addEventListener('click', () => { input.value = c.dataset.q; run(); }));
  }

  const run = () => {
    const q = norm(input.value.trim());
    if (!q) { results.innerHTML = ''; return; }
    const list = PRODUCTS.filter(p =>
      norm(p.name + ' ' + p.meta + ' ' + CAT_LABEL[p.cat] + ' ' + p.desc + ' ' + p.material).includes(q)
    ).slice(0, 8);
    results.innerHTML = list.length
      ? list.map(p => `<a class="search-hit" href="produto.html?id=${encodeURIComponent(p.id)}">
          <img src="${p.photos[0]}" alt="" loading="lazy" decoding="async">
          <span class="search-hit-info"><strong>${esc(p.name)}</strong><em>${CAT_LABEL[p.cat]} · ${brl(p.price)}</em></span>
        </a>`).join('')
      : `<p class="search-none">Nada encontrado para "${esc(input.value)}".</p>`;
  };
  input.addEventListener('input', run);
};
VC.closeSearch = () => {
  const modal = $('#search');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
};

/* ---------------- reveals ----------------
   Na primeira visita: entram ao rolar. Com cache (2ª visita em diante):
   tudo visível de imediato, sem animação de scroll.                 */
VC.isCached = () => {
  try { return localStorage.getItem(INTRO_KEY) === '1'; } catch (e) { return false; }
};
VC.markVisited = () => {
  try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
  document.documentElement.classList.add('cached');
};

VC.bindReveals = () => {
  const els = $$('[data-reveal]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (VC.isCached() || reduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));
};

/* comunicação entre abas: carrinho e modo sempre em dia */
window.addEventListener('storage', e => {
  if (e.key === CART_KEY) { VC.cart = VC.loadCart(); VC.renderCart(); }
  if (e.key === MODE_KEY) {
    document.body.classList.toggle('modo-atacado', VC.isWholesale());
    $$('.mode-toggle button').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === VC.mode() ? 'true' : 'false'));
    VC.renderCart();
    document.dispatchEvent(new CustomEvent('vc:mode', { detail: VC.mode() }));
  }
});

/* monta o chrome assim que o DOM estiver pronto */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', VC.mountChrome);
} else {
  VC.mountChrome();
}
