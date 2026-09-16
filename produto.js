/* ============================================================
   VERONA CAMPAGNA — página do produto (PDP)
   produto.html?id=<slug>
   ============================================================ */
'use strict';

(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = VC.productById(id);

  if (!p) { location.replace('catalogo.html'); return; }

  document.title = `${p.name} — Verona Campagna Gioielli`;

  const state = { size: p.sizes[0], qty: 1 };

  /* ---------------- galeria ---------------- */
  const main = $('#pdMain');
  const thumbs = $('#pdThumbs');

  function renderGallery() {
    main.innerHTML = `${VC.badgeHTML(p.badge)}<img id="pdPhoto" src="${p.photos[0]}" alt="${esc(p.name)}" decoding="async">`;
    thumbs.innerHTML = p.photos.map((src, i) =>
      `<button class="pd-thumb${i === 0 ? ' is-active' : ''}" type="button" data-i="${i}" aria-label="Foto ${i + 1}">
        <img src="${src}" alt="" loading="lazy" decoding="async">
      </button>`).join('');
    $$('.pd-thumb', thumbs).forEach(t => t.addEventListener('click', () => {
      $$('.pd-thumb', thumbs).forEach(x => x.classList.toggle('is-active', x === t));
      $('#pdPhoto').src = p.photos[Number(t.dataset.i)];
    }));
  }

  /* ---------------- informações ---------------- */
  const crumb = $('#pdCrumb');
  if (crumb) crumb.textContent = p.name;

  const info = $('#pdInfo');

  function tierTableHTML() {
    return `<table class="size-table">
      <thead><tr><th>Quantidade</th><th>Desconto</th><th>Preço unitário</th></tr></thead>
      <tbody>
        <tr><td>10 a 24 peças</td><td>25%</td><td>${brl(p.price * 0.75)}</td></tr>
        <tr><td>25 a 49 peças</td><td>35%</td><td>${brl(p.price * 0.65)}</td></tr>
        <tr><td>50+ peças</td><td>45%</td><td>${brl(p.price * 0.55)}</td></tr>
      </tbody>
    </table>
    <p style="margin-top:10px;color:var(--ink-3);font-size:12.5px">Os descontos são aplicados automaticamente sobre o total de peças do pedido — pode misturar modelos e tamanhos.</p>`;
  }

  function renderInfo() {
    const sizeLabel = p.sizes.length > 1 ? 'Escolha o tamanho' : 'Tamanho';
    const sizeValue = p.sizes.length > 1 ? state.size : 'Único (ajuste no aro)';

    info.innerHTML = `
      <p class="pd-cat">${CAT_LABEL[p.cat]}</p>
      <h1>${esc(p.name)}</h1>
      <p class="pd-meta">${p.meta} · ${p.material}</p>

      <div class="pd-price">
        ${VC.priceBlockHTML(p)}
        ${VC.isWholesale()
          ? `<p class="pd-ws-note">Mínimo de ${VC.wholesale.min} peças por pedido · <b>até 45% off</b> em 50+</p>`
          : `<p class="pd-ws-note">Revende? <a href="atacado.html" style="text-decoration:underline">Atacado a partir de ${VC.wholesale.min} peças</a></p>`}
      </div>

      <p class="pd-desc">${esc(p.desc)}</p>

      <div class="pd-field">
        <span class="pd-field-label"><span>${sizeLabel}</span><span>${p.sizes.length > 1 ? 'aros do 14 ao 24 · guia abaixo' : ''}</span></span>
        <div class="pd-sizes" id="pdSizes">
          ${p.sizes.map(s => `<button type="button" class="pd-size${s === state.size ? ' is-active' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>

      <div class="pd-buy">
        <div class="pd-qty">
          <button type="button" data-minus aria-label="Diminuir quantidade">−</button>
          <span id="pdQty">${state.qty}</span>
          <button type="button" data-plus aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="btn btn-dark" id="pdAdd" type="button">Adicionar à sacola</button>
      </div>

      <ul class="pd-perks">
        <li><i>✦</i> Prata 925 e banho de ouro 18k — livre de níquel</li>
        <li><i>✦</i> Estoque com envio em até 48h úteis</li>
        <li><i>✦</i> Embalada em estojo Verona Campagna</li>
        <li><i>✦</i> Frete grátis acima de R$ 299 · 5% off no Pix</li>
      </ul>

      <div class="pd-acc">
        <details open>
          <summary>Detalhes e materiais</summary>
          <div class="acc-body">
            <ul>${p.specs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
        </details>
        <details>
          <summary>Preços de atacado</summary>
          <div class="acc-body">${tierTableHTML()}</div>
        </details>
        <details>
          <summary>Guia de medidas</summary>
          <div class="acc-body">
            ${p.cat === 'aneis' ? `
            <table class="size-table">
              <thead><tr><th>Aro (BR)</th><th>Diâmetro interno</th><th>Circunferência</th></tr></thead>
              <tbody>
                <tr><td>14</td><td>14 mm</td><td>44 mm</td></tr>
                <tr><td>16</td><td>16 mm</td><td>50 mm</td></tr>
                <tr><td>18</td><td>18 mm</td><td>56,5 mm</td></tr>
                <tr><td>20</td><td>20 mm</td><td>63 mm</td></tr>
                <tr><td>22</td><td>22 mm</td><td>69 mm</td></tr>
                <tr><td>24</td><td>24 mm</td><td>75,4 mm</td></tr>
              </tbody>
            </table>
            <p style="margin-top:10px;color:var(--ink-3);font-size:12.5px">Dica: meça o diâmetro interno de um anel que já serve bem na sua mão.</p>` : ''}
            ${p.cat === 'pulseiras' ? `<p>Cada pulseira é ajustada à mão. Informe a medida do seu pulso em cm ao finalizar — ajustamos antes do envio.</p>` : ''}
            ${p.cat === 'colares' || p.cat === 'pingentes' ? `<p>Os colares acompanham corrente de 42 a 45 cm com extensor para regular o caimento. O tamanho se adapta ao seu colo.</p>` : ''}
            ${p.cat === 'brincos' ? `<p>Brinco com fecho seguro — o poste padrão veste confortavelmente a maioria dos lóbulos.</p>` : ''}
          </div>
        </details>
        <details>
          <summary>Envio, trocas e cuidados</summary>
          <div class="acc-body">
            <ul>
              <li>Enviamos para todo o Brasil em até 48h úteis.</li>
              <li>Frete grátis acima de R$ 299; expresso disponível no checkout.</li>
              <li>Troca ou arrependimento em até 7 dias após o recebimento.</li>
              <li>Evite perfume, cloro e atrito para manter o brilho por muito mais tempo.</li>
              <li>Limpe com flanela seca; guarde no estojo individual.</li>
            </ul>
          </div>
        </details>
      </div>`;

    wireInfo();
  }

  function wireInfo() {
    $$('#pdSizes .pd-size').forEach(b => b.addEventListener('click', () => {
      state.size = b.dataset.size;
      $$('#pdSizes .pd-size').forEach(x => x.classList.toggle('is-active', x === b));
    }));

    const qtyEl = $('#pdQty');
    const minus = $('.pd-qty [data-minus]', info);
    const plus = $('.pd-qty [data-plus]', info);
    if (minus) minus.addEventListener('click', () => {
      state.qty = Math.max(1, state.qty - 1);
      qtyEl.textContent = state.qty;
    });
    if (plus) plus.addEventListener('click', () => {
      state.qty += 1;
      qtyEl.textContent = state.qty;
    });

    const add = $('#pdAdd', info);
    if (add) add.addEventListener('click', () => {
      VC.addToCart(p.id, state.size, state.qty);
    });
  }

  /* ---------------- relacionados ---------------- */
  function renderRelated() {
    const grid = $('#pdRelated');
    if (!grid) return;
    const same = VC.products.filter(x => x.cat === p.cat && x.id !== p.id);
    const others = VC.products.filter(x => x.cat !== p.cat);
    const list = same.concat(others).slice(0, 4);
    grid.innerHTML = list.map((x, i) => VC.productCardHTML(x, i)).join('');
    VC.bindReveals();

    $$('.card', grid).forEach(card => {
      const cid = card.dataset.id;
      const prod = VC.productById(cid);
      $('.card-media', card).addEventListener('click', e => {
        if (e.target.closest('a') || e.target.closest('[data-add]')) return;
        location.href = 'produto.html?id=' + encodeURIComponent(cid);
      });
      const add = $('[data-add]', card);
      if (add) add.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        VC.addToCart(cid, prod.sizes[0], 1);
      });
    });
  }

  /* ---------------- boot ---------------- */
  renderGallery();
  renderInfo();
  renderRelated();
  document.addEventListener('vc:mode', renderInfo);
})();
