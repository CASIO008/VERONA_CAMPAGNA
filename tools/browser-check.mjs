#!/usr/bin/env node
/* ============================================================================
   VERONA CAMPAGNA — verificação no Chrome headless (CDP, zero dependências)
   ----------------------------------------------------------------------------
   Roteiro de ponta a ponta: abertura 3D na primeira visita, cache na segunda,
   catálogo, produto, modo atacado com faixas, checkout completo (Pix) e conta.

   Uso:
     node tools/serve.mjs &            # ou use BASE_URL apontando para o site
     node tools/browser-check.mjs      # tudo
     node tools/browser-check.mjs --shots .tmp/bc
   ========================================================================== */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const CHROME = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(p => { try { return fs.existsSync(p); } catch { return false; } });

const argv = process.argv.slice(2);
const shotsIdx = argv.indexOf('--shots');
const shots = shotsIdx > -1 ? path.resolve(ROOT, argv[shotsIdx + 1]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

/* --------------------------------------------------------------- relatório */
let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  if (ok) pass++; else fail++;
  console.log(`${ok ? '  ok  ' : ' FALHA'} ${name}${detail ? '  →  ' + detail : ''}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ chrome */
const pageErrors = [];
let msgId = 0;
const pending = new Map();
let ws;

let chromeProc = null;

async function startChrome() {
  if (!CHROME) throw new Error('Chrome não encontrado — defina CHROME_PATH');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-chrome-'));
  const port = 9444 + Math.floor(Math.random() * 400);
  chromeProc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--mute-audio',
    '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return port;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome não abriu a porta de depuração');
}

async function connect(port) {
  let target = null;
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find(t => t.type === 'page');
    if (target) break;
    await sleep(200);
  }
  if (!target) throw new Error('Nenhuma aba encontrada');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      pageErrors.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(msg.params.args.map(a => a.value || a.description || '').join(' '));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
}

async function waitFor(expr, timeout = 10000, step = 150) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await ev(expr); if (v) return v; } catch {}
    await sleep(step);
  }
  throw new Error('timeout esperando: ' + expr);
}

async function go(rel) {
  await send('Page.navigate', { url: BASE + rel });
  await waitFor('document.readyState === "complete"', 15000);
  await sleep(300);
}

async function shot(name) {
  if (!shots) return;
  /* rola até o fim para disparar o lazy-loading antes de capturar */
  await ev('window.scrollTo(0, document.body.scrollHeight)');
  await sleep(1200);
  await ev('window.scrollTo(0, 0)');
  await sleep(500);
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(shots, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log(`  img ${name}.png`);
}

/* ------------------------------------------------------------------ roteiro */
let chromePort;
try {
  chromePort = await startChrome();
  await connect(chromePort);

  /* ---------- 1 · home: abertura 3D na primeira visita ---------- */
  console.log('\n— Home e abertura 3D —');
  await go('/index.html');
  await sleep(700);
  const hadIntro = await ev('!!document.getElementById("intro")');
  check('abertura 3D montada na primeira visita', hadIntro === true);
  await ev('document.getElementById("introSkip") && document.getElementById("introSkip").click()');
  try {
    await waitFor('localStorage.getItem("vc_intro_v1") === "1"', 9000);
    check('flag vc_intro_v1 gravada ao terminar/pular', true);
  } catch {
    check('flag vc_intro_v1 gravada ao terminar/pular', false, 'timeout');
  }
  await sleep(900);
  check('overlay da intro removido', await ev('!document.getElementById("intro")') === true);

  /* capturas seguem no tema claro (padrão do site; o headless abre em dark) */
  await ev('localStorage.setItem("vc_theme","light");true');
  await go('/index.html');
  await sleep(400);

  check('grid da home com peças', (await ev('document.querySelectorAll("#grid .card").length')) >= 8,
    String(await ev('document.querySelectorAll("#grid .card").length')));
  check('card de categorias com 5 famílias', await ev('document.querySelectorAll("#catGrid .cat-card").length') === 5);
  check('imagem do hero carregada', await ev('(function(){var i=document.querySelector(".hero-frame img");return !!(i&&i.complete&&i.naturalWidth>0)})()') === true);
  await shot('01-home');

  /* ---------- 2 · segunda visita: sem intro e sem animação de scroll ---------- */
  console.log('\n— Segunda visita (cache) —');
  await go('/index.html');
  await sleep(500);
  check('html.cached ativo', await ev('document.documentElement.classList.contains("cached")') === true);
  check('sem overlay de intro com cache', await ev('!document.getElementById("intro")') === true);
  check('motion.js desligado com cache', await ev('document.documentElement.classList.contains("motion-off")') === true);

  /* ---------- 3 · catálogo ---------- */
  console.log('\n— Catálogo —');
  await go('/catalogo.html?cat=aneis');
  check('6 anéis listados', await ev('document.querySelectorAll("#grid .card").length') === 6);
  await ev('document.querySelector("#grid .quick-add").click()');
  await sleep(300);
  check('item adicionado à sacola', await ev('JSON.parse(localStorage.getItem("vc_cart")||"[]").length') === 1);
  check('badge do carrinho atualizado', await ev('document.getElementById("cartCount").textContent') === '1');
  await shot('02-catalogo');

  /* ---------- 4 · produto ---------- */
  console.log('\n— Produto —');
  await go('/produto.html?id=anel-garra');
  check('título da joia', (await ev('document.querySelector(".pd-info h1").textContent')).includes('Garra'));
  check('galeria com thumbs', await ev('document.querySelectorAll(".pd-thumb").length') >= 2);
  await ev('document.getElementById("pdAdd").click()');
  await sleep(300);
  check('produto adicionado (2 peças no total)', await ev('(VC.cart.reduce((s,i)=>s+i.qty,0))') === 2);
  await shot('03-produto');

  /* ---------- 5 · modo atacado ---------- */
  console.log('\n— Modo atacado —');
  await ev('document.querySelector(".mode-toggle [data-mode=\\"atacado\\"]").click()');
  await sleep(400);
  check('body em modo atacado', await ev('document.body.classList.contains("modo-atacado")') === true);
  check('preço de atacado na PDP', await ev('!!document.querySelector(".pd-price .price--wholesale")') === true);
  await go('/catalogo.html');
  check('preços de atacado no catálogo', (await ev('document.querySelectorAll(".price--wholesale").length')) > 0);
  await shot('04-catalogo-atacado');

  /* ---------- 6 · atacado ---------- */
  console.log('\n— Página de atacado —');
  await go('/atacado.html');
  check('faixas 25/35/45 na página', await ev('document.body.innerText.includes("25%") && document.body.innerText.includes("35%") && document.body.innerText.includes("45%")') === true);
  check('botão de modo ativo sincronizado', (await ev('document.getElementById("wsAtivar").innerText')).toLowerCase().includes('ativo'));
  await shot('05-atacado');

  /* ---------- 7 · checkout convidado (atacado, Pix) ---------- */
  console.log('\n— Checkout atacado —');
  await go('/index.html');
  await ev('VC.cart=[{id:"anel-garra",size:"18",qty:10}];VC.saveCart(VC.cart);VC.renderCart();true');
  await go('/checkout.html');
  check('passo 1 ativo', await ev('document.querySelector(".ck-step[data-panel=\\"1\\"]").classList.contains("is-active")') === true);
  check('resumo mostra modo atacado', (await ev('document.getElementById("ckSummary").innerText')).includes('ATACADO'));
  await ev('document.getElementById("ckNext").click()'); await sleep(400);
  check('passo 2 ativo', await ev('document.querySelector(".ck-step[data-panel=\\"2\\"]").classList.contains("is-active")') === true);
  check('campo de CNPJ visível no atacado', await ev('!document.getElementById("ckRazaoField").hidden') === true);
  await ev(`(function(){
    document.getElementById('ckNome').value='Teste Verona';
    document.getElementById('ckEmail').value='teste@veronacampagna.com.br';
    document.getElementById('ckZap').value='(11) 99999-8888';
    document.getElementById('ckRazao').value='Verona Teste Comercio ME';
    document.getElementById('ckDoc').value='11.222.333/0001-81';
    return true;
  })()`);
  await ev('document.getElementById("ckNext").click()'); await sleep(400);
  check('passo 3 ativo', await ev('document.querySelector(".ck-step[data-panel=\\"3\\"]").classList.contains("is-active")') === true);
  await ev(`(function(){
    document.getElementById('ckCep').value='01001-000';
    document.getElementById('ckRua').value='Praca da Se';
    document.getElementById('ckNumero').value='1';
    document.getElementById('ckBairro').value='Se';
    document.getElementById('ckCidade').value='Sao Paulo';
    document.getElementById('ckUf').value='SP';
    return true;
  })()`);
  await ev('document.getElementById("ckNext").click()'); await sleep(400);
  check('passo 4 ativo', await ev('document.querySelector(".ck-step[data-panel=\\"4\\"]").classList.contains("is-active")') === true);
  check('desconto Pix no resumo', (await ev('document.getElementById("ckSummary").innerText')).includes('Pix'));
  await shot('06-checkout');
  await ev('document.getElementById("ckNext").click()'); await sleep(900);
  check('pedido concluído (passo 5)', await ev('document.querySelector(".ck-step[data-panel=\\"5\\"]").classList.contains("is-active")') === true);
  const order = await ev('JSON.parse(localStorage.getItem("vc_orders")||"[]")[0]');
  check('pedido salvo como atacado', order && order.tipo === 'atacado', order ? order.id : 'sem pedido');
  check('10 peças no pedido', order && order.itens.reduce((s, i) => s + i.qtd, 0) === 10);
  check('desconto de 25% aplicado (R$ 1.792,50)', order && Math.abs(order.subtotal - 1792.5) < 0.01, order ? String(order.subtotal) : '');
  check('sacola esvaziada após o pedido', await ev('VC.cart.length') === 0);
  await shot('07-checkout-pronto');

  /* ---------- 8 · conta ---------- */
  console.log('\n— Conta —');
  await go('/conta.html');
  await ev('document.querySelector(".ac-nav [data-ac=\\"pedidos\\"]").click()');
  await sleep(300);
  check('pedido listado na conta', await ev('document.querySelectorAll("#odList [data-order]").length') === 1);
  await shot('08-conta');

  /* ---------- 9 · sem erros de página ---------- */
  console.log('\n— Erros de JavaScript —');
  check('nenhuma exceção/console.error durante o roteiro', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | ') || '');

} catch (err) {
  check('roteiro completo', false, err.message);
} finally {
  try { ws && ws.close(); } catch {}
  try { chromeProc && chromeProc.kill(); } catch {}
}

console.log(`\n${fail === 0 ? 'TUDO CERTO' : fail + ' FALHA(S)'} — ${pass} ok, ${fail} falhas`);
process.exitCode = fail ? 1 : 0;
