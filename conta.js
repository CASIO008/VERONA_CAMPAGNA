/* ============================================================
   VERONA CAMPAGNA — minha conta (100% local no navegador)
   dados · pedidos · endereço · privacidade
   ============================================================ */
'use strict';

(function () {
  const PROFILE_KEY = 'vc_profile';
  const ORDERS_KEY = 'vc_orders';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (e) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  };

  /* ---------------- painéis ---------------- */
  $$('.ac-nav button').forEach(btn => btn.addEventListener('click', () => {
    $$('.ac-nav button').forEach(b => b.classList.toggle('is-active', b === btn));
    $$('.ac-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === btn.dataset.ac));
  }));

  /* ---------------- perfil ---------------- */
  const f = {
    nome: $('#pfNome'), email: $('#pfEmail'), zap: $('#pfZap'), doc: $('#pfDoc')
  };

  function loadProfile() {
    const p = read(PROFILE_KEY, null) || {};
    f.nome.value = p.nome || '';
    f.email.value = p.email || '';
    f.zap.value = p.zap || '';
    f.doc.value = p.doc ? VCPAY.maskCpf(p.doc) : '';
  }

  f.zap.addEventListener('input', () => { f.zap.value = VCPAY.maskPhone(f.zap.value); });
  f.doc.addEventListener('input', () => { f.doc.value = VCPAY.maskCpf(f.doc.value); });

  $('#pfForm').addEventListener('submit', e => {
    e.preventDefault();
    const profile = read(PROFILE_KEY, null) || {};
    const updated = {
      ...profile,
      nome: f.nome.value.trim(),
      email: f.email.value.trim(),
      zap: f.zap.value.trim(),
      doc: f.doc.value.trim()
    };
    write(PROFILE_KEY, updated);
    VC.toast('Dados salvos neste navegador');
  });

  /* ---------------- pedidos ---------------- */
  function renderOrders() {
    const list = read(ORDERS_KEY, []);
    const el = $('#odList');
    if (!el) return;

    if (!list.length) {
      el.innerHTML = `<div class="ac-empty">
        <p>Você ainda não fez pedidos por aqui.</p>
        <a class="btn btn-dark" href="catalogo.html">Encontrar minha joia</a>
      </div>`;
      return;
    }

    el.innerHTML = list.slice().reverse().map(o => {
      const date = new Date(o.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      const itens = o.itens.map(i => `${i.qtd}x ${esc(i.nome)} (${esc(i.tamanho)})`).join(' · ');
      return `<div class="ac-card" data-order="${o.id}">
        <div class="ac-item" style="border-bottom:0;padding-top:0">
          <span class="ac-item-info">
            <strong>${o.id} · ${brl(o.total)}</strong>
            <span>${date} · ${o.tipo === 'atacado' ? 'Atacado' : 'Varejo'} · ${o.pagamento.metodo === 'pix' ? 'Pix' : o.pagamento.metodo === 'card' ? 'Cartão' : 'Boleto'}</span>
          </span>
          <span class="order-status${o.status === 'Pago' ? ' pago' : ''}">${o.status}</span>
        </div>
        <p style="font-size:13.5px;color:var(--ink-2);margin-top:10px">${itens}</p>
        <div class="ac-item-actions" style="margin-top:14px;display:flex;gap:14px">
          <a href="https://wa.me/${VC.brand.whatsapp}?text=${encodeURIComponent('Olá! Sobre o pedido ' + o.id + '…')}" target="_blank" rel="noopener">Falar do pedido</a>
          <button type="button" data-del="${o.id}">Apagar registro</button>
        </div>
      </div>`;
    }).join('');

    $$('[data-del]', el).forEach(btn => btn.addEventListener('click', () => {
      const kept = read(ORDERS_KEY, []).filter(o => o.id !== btn.dataset.del);
      write(ORDERS_KEY, kept);
      renderOrders();
      VC.toast('Registro removido');
    }));
  }

  /* ---------------- endereço ---------------- */
  function renderAddress() {
    const profile = read(PROFILE_KEY, null) || {};
    const a = profile.endereco;
    const el = $('#adWrap');
    if (!el) return;

    if (!a || !a.cep) {
      el.innerHTML = `<div class="ac-empty">
        <p>Nenhum endereço salvo ainda.</p>
        <a class="btn btn-dark" href="checkout.html">Cadastrar no checkout</a>
      </div>`;
      return;
    }

    el.innerHTML = `<div class="ac-card">
      <h3>Endereço salvo</h3>
      <p style="color:var(--ink-2);font-size:14.5px;line-height:1.7">
        ${esc(a.rua)}, ${esc(a.numero)}${a.complemento ? ' — ' + esc(a.complemento) : ''}<br>
        ${esc(a.bairro)} · ${esc(a.cidade)}/${esc(a.uf)}<br>
        CEP ${esc(a.cep)}
      </p>
      <div style="display:flex;gap:14px;margin-top:18px">
        <a class="btn btn-ghost" href="checkout.html">Editar no checkout</a>
        <button class="btn btn-ghost" type="button" id="adDel">Remover endereço</button>
      </div>
    </div>`;

    const del = $('#adDel');
    if (del) del.addEventListener('click', () => {
      delete profile.endereco;
      write(PROFILE_KEY, profile);
      renderAddress();
      VC.toast('Endereço removido');
    });
  }

  /* ---------------- apagar tudo ---------------- */
  const wipe = $('#wipeBtn');
  if (wipe) wipe.addEventListener('click', () => {
    if (!confirm('Apagar todos os dados salvos neste navegador?')) return;
    ['vc_profile', 'vc_orders', 'vc_cart', 'vc_ck_draft', 'vc_news', 'vc_leads'].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    VC.cart = [];
    VC.renderCart();
    loadProfile();
    renderOrders();
    renderAddress();
    VC.toast('Dados apagados');
  });

  /* ---------------- boot ---------------- */
  loadProfile();
  renderOrders();
  renderAddress();
})();
