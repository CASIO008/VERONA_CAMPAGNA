/* ============================================================
   VERONA CAMPAGNA — núcleo de pagamento (demo, 100% local)
   Bandeiras, máscaras, validações de CPF/CNPJ, parcelas, Pix
   e consulta de CEP. Nenhum dado de cartão sai do navegador.
   ============================================================ */
'use strict';

const VCPAY = (() => {
  const onlyDigits = s => String(s).replace(/\D+/g, '');

  /* ---------------- bandeiras ---------------- */
  const BRANDS = [
    { id: 'visa',       name: 'Visa',       icon: 'images/pay/visa.svg',       re: /^4/ },
    { id: 'mastercard', name: 'Mastercard', icon: 'images/pay/mastercard.svg', re: /^(5[1-5]|2[2-7])/ },
    { id: 'amex',       name: 'Amex',       icon: 'images/pay/amex.svg',       re: /^3[47]/ },
    { id: 'elo',        name: 'Elo',        icon: 'images/pay/elo.svg',        re: /^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650[0-9]|6516|6550)/ },
    { id: 'hipercard',  name: 'Hipercard',  icon: 'images/pay/hipercard.svg',  re: /^(606282|3841)/ }
  ];

  function brandOf(number) {
    const n = onlyDigits(number);
    if (n.length < 4) return null;
    return BRANDS.find(b => b.re.test(n)) || null;
  }

  /* ---------------- Luhn ---------------- */
  function luhn(number) {
    const n = onlyDigits(number);
    if (n.length < 13) return false;
    let sum = 0, dbl = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = Number(n[i]);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  /* ---------------- CPF / CNPJ ---------------- */
  function validCPF(value) {
    const c = onlyDigits(value);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(c[i]) * (10 - i);
    let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0;
    if (d1 !== Number(c[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(c[i]) * (11 - i);
    let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0;
    return d2 === Number(c[10]);
  }

  function validCNPJ(value) {
    const c = onlyDigits(value);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    const calc = (base, weights) => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i];
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc(c, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (d1 !== Number(c[12])) return false;
    const d2 = calc(c, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return d2 === Number(c[13]);
  }

  /* ---------------- máscaras ---------------- */
  const maskCard = v => onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  const maskExp = v => {
    const d = onlyDigits(v).slice(0, 4);
    return d.length <= 2 ? d : d.slice(0, 2) + '/' + d.slice(2);
  };
  const maskCvv = v => onlyDigits(v).slice(0, 4);
  const maskCpf = v => onlyDigits(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  const maskCnpj = v => onlyDigits(v).slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  const maskPhone = v => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const maskCep = v => {
    const d = onlyDigits(v).slice(0, 8);
    return d.length <= 5 ? d : d.slice(0, 5) + '-' + d.slice(5);
  };

  function validExp(value) {
    const d = onlyDigits(value);
    if (d.length !== 4) return false;
    const mm = Number(d.slice(0, 2)), yy = Number(d.slice(2));
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const curY = now.getFullYear() % 100, curM = now.getMonth() + 1;
    return yy > curY || (yy === curY && mm >= curM);
  }

  /* ---------------- parcelas ---------------- */
  function installments(total) {
    const list = [];
    for (let n = 1; n <= 12; n++) {
      const value = total / n;
      list.push({ n, value, label: `${n}x de ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${n <= 6 ? ' sem juros' : ' sem juros'}` });
    }
    return list;
  }

  /* ---------------- Pix (demo) ---------------- */
  function pixCode(orderId, total) {
    const amount = total.toFixed(2);
    return `00020126580014BR.GOV.BCB.PIX0136verona-campagna-${orderId}520400005303986540${String(amount.length).padStart(2, '0')}${amount}5802BR5915VERONA CAMPAGNA6009SAO PAULO62070503***6304VC${String(orderId).slice(-2)}`;
  }

  /* ---------------- CEP (ViaCEP, com fallback offline) ---------------- */
  async function cepLookup(cep) {
    const d = onlyDigits(cep);
    if (d.length !== 8) return null;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { cache: 'force-cache' });
      const data = await res.json();
      if (data.erro) return null;
      return {
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || ''
      };
    } catch (e) {
      return null;
    }
  }

  return {
    onlyDigits, BRANDS, brandOf, luhn,
    validCPF, validCNPJ, validExp,
    maskCard, maskExp, maskCvv, maskCpf, maskCnpj, maskPhone, maskCep,
    installments, pixCode, cepLookup
  };
})();
