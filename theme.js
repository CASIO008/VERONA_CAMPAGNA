/* ============================================================
   VERONA CAMPAGNA — tema claro/escuro (chave vc_theme)
   ============================================================ */
'use strict';

(function () {
  const KEY = 'vc_theme';
  const root = document.documentElement;

  function current() {
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') return root.dataset.theme;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(t, persist) {
    root.dataset.theme = t;
    root.style.colorScheme = t;
    if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    const btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    document.dispatchEvent(new CustomEvent('vc:theme', { detail: t }));
  }

  function toggle() {
    const next = current() === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition) {
      document.startViewTransition(() => apply(next, true));
    } else {
      apply(next, true);
    }
  }

  /* data.js carrega antes deste arquivo em todas as páginas */
  VC.toggleTheme = toggle;
  VC.theme = current;

  /* aplica já o tema resolvido (o <head> inline evita o flash precoce) */
  apply(current(), false);

  /* o header é montado pelo data.js; tenta ligar agora e depois */
  function wire() {
    const btn = document.getElementById('themeToggle');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', toggle);
    }
  }
  wire();
  document.addEventListener('DOMContentLoaded', wire);
  document.addEventListener('vc:chrome', wire);
})();
