/* ============================================================================
   VERONA CAMPAGNA — checagem de colisões no escopo global
   ----------------------------------------------------------------------------
   Em scripts clássicos (sem módulos), `const`/`let`/`function` de nível
   superior dividem o MESMO escopo. Declarar o mesmo nome em dois arquivos
   derruba o segundo com "Identifier 'x' has already been declared".

   Uso:  node tools/check-globals.js
   ========================================================================== */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function topLevelNames(src) {
  const names = [];
  let depth = 0;
  for (const raw of src.split(/\r?\n/)) {
    const code = raw.replace(/\/\/.*$/, '');
    if (depth === 0) {
      const m = code.match(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);
      if (m) names.push(m[1]);
    }
    depth += (code.match(/[{([]/g) || []).length - (code.match(/[})\]]/g) || []).length;
    if (depth < 0) depth = 0;
  }
  return names;
}

const PAGES = {
  'index.html': ['data.js', 'theme.js', 'intro.js', 'script.js', 'motion.js'],
  'catalogo.html': ['data.js', 'theme.js', 'pages.js', 'motion.js'],
  'produto.html': ['data.js', 'theme.js', 'produto.js', 'motion.js'],
  'atacado.html': ['data.js', 'theme.js', 'pages.js', 'motion.js'],
  'sobre.html': ['data.js', 'theme.js', 'pages.js', 'motion.js'],
  'contato.html': ['data.js', 'theme.js', 'pages.js', 'motion.js'],
  'checkout.html': ['data.js', 'theme.js', 'pay-core.js', 'checkout.js'],
  'conta.html': ['data.js', 'theme.js', 'pay-core.js', 'conta.js'],
  '404.html': ['data.js', 'theme.js']
};

let problems = 0;
for (const [page, scripts] of Object.entries(PAGES)) {
  const seen = new Map();
  const clashes = [];
  for (const file of scripts) {
    for (const name of topLevelNames(read(file))) {
      if (seen.has(name)) clashes.push(`${name} (${seen.get(name)} × ${file})`);
      else seen.set(name, file);
    }
  }
  const ok = clashes.length === 0;
  if (!ok) problems++;
  console.log(`${ok ? 'PASS ' : 'FALHA'}  ${page} — ${seen.size} nomes globais${ok ? '' : ' — COLISÕES: ' + clashes.join(', ')}`);
}

for (const g of ['VC', 'VCPAY']) {
  const hits = [...new Set(Object.values(PAGES).flat().filter(f => read(f).includes(`window.${g} =`)))];
  const ok = hits.length <= 1;
  if (!ok) problems++;
  console.log(`${ok ? 'PASS ' : 'FALHA'}  window.${g} definido em ${hits.join(', ') || '(nenhum)'}`);
}

for (const [page, scripts] of Object.entries(PAGES)) {
  const html = read(page);
  const order = scripts.map(s => html.indexOf(`<script src="${s}"></script>`));
  const ok = order.every(v => v > -1) && order.every((v, i) => i === 0 || v > order[i - 1]);
  if (!ok) problems++;
  console.log(`${ok ? 'PASS ' : 'FALHA'}  ordem dos scripts em ${page}`);
}

console.log(`\n${problems === 0 ? 'SEM COLISÕES' : problems + ' PROBLEMA(S)'}`);
process.exitCode = problems ? 1 : 0;
