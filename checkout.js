/* ============================================================
   VERONA CAMPAGNA — checkout (convidado, 100% local)
   5 passos: sacola → identificação → entrega → pagamento → pronto
   ============================================================ */
'use strict';

(function () {
  const FREE_SHIP = 299;
  const SHIP = { pac: 19.9, sedex: 34.9 };
  const SHIP_LABEL = { pac: 'Entrega padrão (3 a 7 dias úteis)', sedex: 'Entrega expressa (1 a 3 dias úteis)' };
  const PIX_OFF = 0.05;
  const COUPONS = { VIA10: 0.10 };

  const state = {
    step: 1,
    coupon: null,
    ship: 'pac',
    pay: 'pix',
    completed: false,
    order: null
  };

  /* ---------------- campos ---------------- */
  const F = {
    nome: $('#ckNome'), email: $('#ckEmail'), zap: $('#ckZap'),
    doc: $('#ckDoc'), razao: $('#ckRazao'), razaoField: $('#ckRazaoField'), docLabel: $('#ckDocLabel'),
    cep: $('#ckCep'), rua: $('#ckRua'), numero: $('#ckNumero'), bairro: $('#ckBairro'),
    cidade: $('#ckCidade'), uf: $('#ckUf'), compl: $('#ckCompl'),
    ccNumber: $('#ccNumber'), ccName: $('#ccName'), ccExp: $('#ckCard') && $('#ccExp'), ccCvv: $('#ccCvv'), ccParcelas: $('#ccParcelas')
  };

  const isWs = () => VC.isWholesale();

  /* ---------------- totais ---------------- */
  function totals() {
    const subtotal = VC.cartSubtotal();
    const couponOff = state.coupon ? subtotal * COUPONS[state.coupon] : 0;
    const baseForPix = subtotal - couponOff;
    const pixOff = state.pay === 'pix' ? baseForPix * PIX_OFF : 0;
    let frete = subtotal >= FREE_SHIP || subtotal === 0 ? 0 : SHIP[state.ship];
    const total = Math.max(0, subtotal - couponOff - pixOff + frete);
    const retail = VC.retailSubtotal();
    return { subtotal, couponOff, pixOff, frete, total, retail, wsSaving: isWs() ? retail - subtotal : 0 };
  }

  /* ---------------- resumo ---------------- */
  function renderSummary() {
    const el = $('#ckSummary');
    if (!el) return;
    const t = totals();
    const items = VC.cart.map(item => {
      const p = VC.productById(item.id);
      const unit = VC.linePrice(item);
      return `<div class="ck-sum-item">
        <img src="${p.photos[0]}" alt="">
        <span class="info"><strong>${esc(p.name)}</strong><em>Tam ${esc(item.size)} · ${item.qty}x</em></span>
        <span class="val">${brl(unit * item.qty)}</span>
      </div>`;
    }).join('');

    el.innerHTML = `
      <h3>Resumo do pedido</h3>
      ${isWs() ? `<p class="cart-mode" style="border:0;padding:0 0 14px"><span class="cart-mode-tag">ATACADO</span> ${VC.tierProgressHTML(VC.cartQty())}</p>` : ''}
      <div class="ck-sum-items">${items || '<p style="color:var(--ink-3)">Sua sacola está vazia.</p>'}</div>

      <div class="ck-coupon">
        <input id="ckCoupon" placeholder="Cupom (ex.: VIA10)" aria-label="Cupom de desconto" value="${state.coupon || ''}">
        <button type="button" id="ckCouponBtn">Aplicar</button>
      </div>

      <div class="ck-totals">
        <div class="ck-tot"><span>Subtotal</span><strong>${brl(t.subtotal)}</strong></div>
        ${t.wsSaving > 0 ? `<div class="ck-tot save"><span>Economia atacado</span><strong>− ${brl(t.wsSaving)}</strong></div>` : ''}
        ${t.couponOff > 0 ? `<div class="ck-tot save"><span>Cupom ${state.coupon}</span><strong>− ${brl(t.couponOff)}</strong></div>` : ''}
        <div class="ck-tot"><span>Frete (${state.ship.toUpperCase()})</span><strong>${t.frete === 0 ? 'Grátis' : brl(t.frete)}</strong></div>
        ${t.pixOff > 0 ? `<div class="ck-tot save"><span>Desconto Pix (5%)</span><strong>− ${brl(t.pixOff)}</strong></div>` : ''}
        <div class="ck-tot grand"><span>Total</span><strong>${brl(t.total)}</strong></div>
      </div>
      <p class="ck-sum-note">${isWs()
        ? `Pedido de atacado com ${VC.cartQty()} peça(s) · mínimo de ${VC.wholesale.min}.`
        : `Frete grátis em compras acima de ${brl(FREE_SHIP)}.`}</p>`;

    const btn = $('#ckCouponBtn');
    if (btn) btn.addEventListener('click', applyCoupon);
    const input = $('#ckCoupon');
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });

    /* valores nas opções de pagamento */
    const cardVal = $('#payCardVal');
    if (cardVal) cardVal.textContent = `12x de ${brl((t.subtotal - t.couponOff) / 12)}`;
    const pixVal = $('#payPixVal');
    if (pixVal) pixVal.textContent = brl(t.subtotal - t.couponOff - t.pixOff);
    const boletoVal = $('#payBoletoVal');
    if (boletoVal) boletoVal.textContent = brl(t.subtotal - t.couponOff + t.frete);

    /* parcelas do cartão */
    renderInstallments(t.subtotal - t.couponOff);
  }

  function applyCoupon() {
    const input = $('#ckCoupon');
    const code = norm(input.value.trim()).toUpperCase();
    if (COUPONS[code]) {
      state.coupon = code;
      VC.toast(`Cupom ${code} aplicado — ${Math.round(COUPONS[code] * 100)}% off`);
    } else {
      state.coupon = null;
      VC.toast('Cupom inválido ou expirado.');
    }
    renderSummary();
  }

  function renderInstallments(base) {
    if (!F.ccParcelas) return;
    const value = F.ccParcelas.value;
    F.ccParcelas.innerHTML = VCPAY.installments(base).map(i =>
      `<option value="${i.n}"${String(i.n) === value ? ' selected' : ''}>${i.label}</option>`).join('');
  }

  /* ---------------- itens da sacola (passo 1) ---------------- */
  function renderItems() {
    const el = $('#ckItems');
    if (!el) return;
    if (!VC.cart.length && !state.completed) {
      el.innerHTML = `<div class="ac-empty" style="margin-top:10px">
        <p>Sua sacola está vazia.</p>
        <a class="btn btn-dark" href="catalogo.html">Escolher joias</a>
      </div>`;
      return;
    }
    el.innerHTML = VC.cart.map(item => {
      const p = VC.productById(item.id);
      const unit = VC.linePrice(item);
      return `<div class="cart-item" data-id="${p.id}" data-size="${esc(item.size)}">
        <a class="cart-thumb" href="produto.html?id=${encodeURIComponent(p.id)}"><img src="${p.photos[0]}" alt=""></a>
        <div class="cart-info">
          <a class="cart-name" href="produto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
          <span class="cart-meta">${CAT_LABEL[p.cat]} · Tam ${esc(item.size)}</span>
          <span class="cart-unit">${brl(unit)}${isWs() ? ' <em>atacado</em>' : ''}</span>
          <div class="cart-qty">
            <button type="button" data-minus aria-label="Diminuir">−</button><span>${item.qty}</span><button type="button" data-plus aria-label="Aumentar">+</button>
          </div>
        </div>
        <div class="cart-line">
          <strong>${brl(unit * item.qty)}</strong>
          <button type="button" class="cart-remove" data-remove>Remover</button>
        </div>
      </div>`;
    }).join('');

    $$('.cart-item', el).forEach(row => {
      const id = row.dataset.id, size = row.dataset.size;
      $('[data-minus]', row).addEventListener('click', () => { VC.updateQty(id, size, -1); renderItems(); renderSummary(); });
      $('[data-plus]', row).addEventListener('click', () => { VC.updateQty(id, size, 1); renderItems(); renderSummary(); });
      $('[data-remove]', row).addEventListener('click', () => { VC.removeItem(id, size); renderItems(); renderSummary(); });
    });
  }

  /* ---------------- navegação ---------------- */
  const stepsList = $$('#ckSteps li');
  const panels = $$('.ck-step');

  function goStep(n) {
    if (n === 5 && !state.completed) return;
    state.step = n;
    stepsList.forEach(li => {
      const s = Number(li.dataset.step);
      li.classList.toggle('is-active', s === n);
      li.classList.toggle('is-done', s < n);
    });
    panels.forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === n));

    const back = $('#ckBack');
    const next = $('#ckNext');
    const nav = $('#ckNav');
    if (!back || !next || !nav) return;
    back.style.visibility = n === 1 || n === 5 ? 'hidden' : 'visible';
    next.style.visibility = n === 5 ? 'hidden' : 'visible';
    next.innerHTML = n === 4 ? 'Finalizar pedido <span class="arr">✦</span>' : 'Continuar <span class="arr">→</span>';

    if (n === 1) { renderItems(); }
    renderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- validações ---------------- */
  function validateStep(n) {
    if (n === 1) {
      if (!VC.cart.length) { VC.toast('Sua sacola está vazia.'); return false; }
      if (isWs() && VC.cartQty() < VC.wholesale.min) {
        VC.toast(`Atacado a partir de ${VC.wholesale.min} peças — faltam ${VC.wholesale.min - VC.cartQty()}.`);
        return false;
      }
      return true;
    }
    if (n === 2) {
      if (F.nome.value.trim().length < 3) { VC.toast('Informe seu nome completo.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(F.email.value.trim())) { VC.toast('Confira o e-mail.'); return false; }
      if (VCPAY.onlyDigits(F.zap.value).length < 10) { VC.toast('Confira o WhatsApp com DDD.'); return false; }
      if (isWs()) {
        if (!F.razao.value.trim()) { VC.toast('Informe a razão social para o pedido de atacado.'); return false; }
        if (!VCPAY.validCNPJ(F.doc.value)) { VC.toast('CNPJ inválido — confira os dígitos.'); return false; }
      } else if (!VCPAY.validCPF(F.doc.value)) {
        VC.toast('CPF inválido — confira os dígitos.'); return false;
      }
      return true;
    }
    if (n === 3) {
      if (VCPAY.onlyDigits(F.cep.value).length !== 8) { VC.toast('Cadê o CEP completo?'); return false; }
      if (!F.rua.value.trim() || !F.numero.value.trim() || !F.bairro.value.trim() || !F.cidade.value.trim() || F.uf.value.trim().length !== 2) {
        VC.toast('Complete o endereço de entrega.'); return false;
      }
      return true;
    }
    if (n === 4) {
      if (state.pay !== 'card') return true;
      if (!VCPAY.luhn(F.ccNumber.value)) { VC.toast('Número do cartão inválido.'); return false; }
      if (!VCPAY.brandOf(F.ccNumber.value)) { VC.toast('Bandeira não identificada — confira o número.'); return false; }
      if (F.ccName.value.trim().length < 3) { VC.toast('Informe o nome impresso no cartão.'); return false; }
      if (!VCPAY.validExp(F.ccExp.value)) { VC.toast('Validade inválida (use MM/AA).'); return false; }
      const brand = VCPAY.brandOf(F.ccNumber.value);
      const cvvLen = brand && brand.id === 'amex' ? 4 : 3;
      if (VCPAY.onlyDigits(F.ccCvv.value).length !== cvvLen) { VC.toast(`CVV deve ter ${cvvLen} dígitos.`); return false; }
      return true;
    }
    return true;
  }

  /* ---------------- pedido ---------------- */
  function nextOrderId() {
    const y = new Date().getFullYear();
    let seq = 1;
    try {
      const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      seq = orders.length + 1;
    } catch (e) {}
    return `VC-${y}-${String(seq).padStart(4, '0')}`;
  }

  function finalize() {
    const t = totals();
    const brand = state.pay === 'card' ? VCPAY.brandOf(F.ccNumber.value) : null;
    const order = {
      id: nextOrderId(),
      criadoEm: new Date().toISOString(),
      tipo: isWs() ? 'atacado' : 'varejo',
      itens: VC.cart.map(item => {
        const p = VC.productById(item.id);
        const unit = VC.linePrice(item);
        return { id: p.id, nome: p.name, tamanho: item.size, qtd: item.qty, unitario: unit, total: unit * item.qty };
      }),
      subtotal: t.subtotal,
      cupom: state.coupon,
      descontoCupom: t.couponOff,
      descontoPix: t.pixOff,
      frete: t.frete,
      servicoEntrega: SHIP_LABEL[state.ship],
      total: t.total,
      cliente: {
        nome: F.nome.value.trim(),
        email: F.email.value.trim(),
        zap: F.zap.value.trim(),
        documento: F.doc.value.trim(),
        razao: isWs() ? F.razao.value.trim() : null
      },
      endereco: {
        cep: F.cep.value.trim(), rua: F.rua.value.trim(), numero: F.numero.value.trim(),
        complemento: F.compl.value.trim(), bairro: F.bairro.value.trim(),
        cidade: F.cidade.value.trim(), uf: F.uf.value.trim().toUpperCase()
      },
      pagamento: {
        metodo: state.pay,
        parcelas: state.pay === 'card' ? Number(F.ccParcelas.value) : null,
        bandeira: brand ? brand.name : null,
        ultimos4: state.pay === 'card' ? VCPAY.onlyDigits(F.ccNumber.value).slice(-4) : null
      },
      status: state.pay === 'card' ? 'Pago' : 'Aguardando pagamento'
    };

    try {
      const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      orders.push(order);
      localStorage.setItem('vc_orders', JSON.stringify(orders));
      localStorage.setItem('vc_profile', JSON.stringify({
        nome: order.cliente.nome, email: order.cliente.email, zap: order.cliente.zap,
        doc: order.cliente.documento, endereco: order.endereco
      }));
    } catch (e) {}

    state.order = order;
    state.completed = true;
    VC.clearCart();
    renderOrderBox(order);
    goStep(5);
    VC.toast('Pedido ' + order.id + ' registrado');
  }

  function renderOrderBox(order) {
    const box = $('#ckOrderBox');
    if (!box) return;
    box.innerHTML = `
      <div class="ord-line"><span>Pedido</span><strong>${order.id}</strong></div>
      <div class="ord-line"><span>Tipo</span><strong>${order.tipo === 'atacado' ? 'Atacado' : 'Varejo'}</strong></div>
      <div class="ord-line"><span>Pagamento</span><strong>${order.pagamento.metodo === 'pix' ? 'Pix' : order.pagamento.metodo === 'card' ? `Cartão ${order.pagamento.bandeira} •••• ${order.pagamento.ultimos4} em ${order.pagamento.parcelas}x` : 'Boleto'}</strong></div>
      <div class="ord-line"><span>Entrega</span><strong>${order.servicoEntrega}</strong></div>
      <div class="ord-line"><span>Itens</span><strong>${order.itens.reduce((s, i) => s + i.qtd, 0)} peça(s)</strong></div>
      <div class="ord-line"><span>Total</span><strong>${brl(order.total)}</strong></div>`;

    const sub = $('#ckDoneSub');
    if (sub) {
      sub.textContent = state.pay === 'pix'
        ? 'Seu código Pix está reservado — enviamos também por e-mail e WhatsApp junto com o resumo.'
        : state.pay === 'boleto'
          ? 'O boleto foi gerado e segue para o seu e-mail. Após a confirmação, sua joia entra em produção de envio.'
          : 'Pagamento aprovado no cartão. Sua joia segue embalada em até 48h úteis.';
    }
    const wa = $('#ckWhats');
    if (wa) {
      const msg = encodeURIComponent(`Olá! Acabei de fazer o pedido ${order.id} no site (${order.tipo}). Total ${brl(order.total)}.`);
      wa.href = `https://wa.me/${VC.brand.whatsapp}?text=${msg}`;
    }
  }

  /* ---------------- máscaras + interações ---------------- */
  function wireMasks() {
    F.doc.addEventListener('input', () => { F.doc.value = isWs() ? VCPAY.maskCnpj(F.doc.value) : VCPAY.maskCpf(F.doc.value); });
    F.zap.addEventListener('input', () => { F.zap.value = VCPAY.maskPhone(F.zap.value); });
    F.cep.addEventListener('input', () => { F.cep.value = VCPAY.maskCep(F.cep.value); });
    F.ccNumber.addEventListener('input', () => {
      F.ccNumber.value = VCPAY.maskCard(F.ccNumber.value);
      const brand = VCPAY.brandOf(F.ccNumber.value);
      $('#ccNum').textContent = (F.ccNumber.value || '•••• •••• •••• ••••').padEnd(19, ' ') || '•••• •••• •••• ••••';
      $('#ccBrandNote').textContent = brand ? `Bandeira identificada: ${brand.name}.` : '';
    });
    F.ccName.addEventListener('input', () => { $('#ccHolder').textContent = (F.ccName.value || 'NOME NO CARTÃO').toUpperCase(); });
    F.ccExp.addEventListener('input', () => { F.ccExp.value = VCPAY.maskExp(F.ccExp.value); $('#ccExp').textContent = F.ccExp.value || '••/••'; });
    F.ccCvv.addEventListener('input', () => { F.ccCvv.value = VCPAY.maskCvv(F.ccCvv.value); });
  }

  function wireShipping() {
    $$('input[name="ship"]').forEach(r => r.addEventListener('change', () => {
      state.ship = r.value;
      $$('#ckShip .ck-radio').forEach(l => l.classList.toggle('is-active', l.querySelector('input').checked));
      renderSummary();
    }));
    $('#shipPac').textContent = brl(SHIP.pac);
    $('#shipSedex').textContent = brl(SHIP.sedex);
  }

  function wirePayment() {
    $$('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
      state.pay = r.value;
      $$('#ckPay .ck-radio').forEach(l => l.classList.toggle('is-active', l.querySelector('input').checked));
      const pix = $('#ckPix');
      const card = $('#ckCard');
      if (pix) pix.hidden = state.pay !== 'pix';
      if (card) card.hidden = state.pay !== 'card';
      renderSummary();
    }));
    const pix = $('#ckPix');
    const card = $('#ckCard');
    if (pix) pix.hidden = state.pay !== 'pix';
    if (card) card.hidden = state.pay !== 'card';
  }

  function wireCep() {
    const tryLookup = async () => {
      if (VCPAY.onlyDigits(F.cep.value).length !== 8) return;
      const data = await VCPAY.cepLookup(F.cep.value);
      if (!data) return;
      if (!F.rua.value) F.rua.value = data.rua;
      if (!F.bairro.value) F.bairro.value = data.bairro;
      if (!F.cidade.value) F.cidade.value = data.cidade;
      if (!F.uf.value) F.uf.value = data.uf;
    };
    F.cep.addEventListener('blur', tryLookup);
    F.cep.addEventListener('input', () => { if (VCPAY.onlyDigits(F.cep.value).length === 8) tryLookup(); });
  }

  function prefill() {
    try {
      const profile = JSON.parse(localStorage.getItem('vc_profile') || 'null');
      if (!profile) return;
      F.nome.value = profile.nome || '';
      F.email.value = profile.email || '';
      F.zap.value = profile.zap || '';
      if (!isWs() && profile.doc) F.doc.value = VCPAY.maskCpf(profile.doc);
      const a = profile.endereco || {};
      F.cep.value = a.cep || '';
      F.rua.value = a.rua || '';
      F.numero.value = a.numero || '';
      F.bairro.value = a.bairro || '';
      F.cidade.value = a.cidade || '';
      F.uf.value = a.uf || '';
      F.compl.value = a.complemento || '';
    } catch (e) {}
  }

  function syncWholesale() {
    F.razaoField.hidden = !isWs();
    F.docLabel.textContent = isWs() ? 'CNPJ *' : 'CPF *';
    F.doc.placeholder = isWs() ? '00.000.000/0000-00' : '000.000.000-00';
    if (F.doc.value) F.doc.value = isWs() ? VCPAY.maskCnpj(F.doc.value) : VCPAY.maskCpf(F.doc.value);
    const sub = $('#ckBagSub');
    if (sub) sub.textContent = isWs()
      ? `Pedido de atacado: mínimo de ${VC.wholesale.min} peças, desconto aplicado automaticamente.`
      : 'Confira as peças e as quantidades antes de continuar.';
  }

  /* ---------------- boot ---------------- */
  wireMasks();
  wireShipping();
  wirePayment();
  wireCep();
  prefill();
  syncWholesale();

  $('#ckNext').addEventListener('click', () => {
    if (!validateStep(state.step)) return;
    if (state.step === 4) { finalize(); return; }
    goStep(state.step + 1);
  });
  $('#ckBack').addEventListener('click', () => goStep(state.step - 1));

  document.addEventListener('vc:mode', () => { syncWholesale(); renderSummary(); renderItems(); });

  renderItems();
  renderSummary();
})();
