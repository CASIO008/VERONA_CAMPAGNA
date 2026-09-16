/* ============================================================
   VERONA CAMPAGNA — movimento (GSAP + ScrollTrigger)
   Só roda na PRIMEIRA visita. Existe cache (vc_intro_v1) ou
   "reduzir movimento" ligado → nenhuma animação de scroll.
   ============================================================ */
'use strict';

(function () {
  if (typeof VC === 'undefined' || !window.gsap) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (VC.isCached() || reduced) {
    document.documentElement.classList.add('motion-off');
    return;
  }

  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- título em palavras ---------- */
  function splitWords(el) {
    if (el.dataset.split === 'done') return [];
    const parts = el.textContent.trim().split(/\s+/);
    el.innerHTML = parts.map(w => `<span class="word"><span>${w}</span></span>`).join(' ');
    el.dataset.split = 'done';
    return Array.from(el.querySelectorAll('.word > span'));
  }

  /* ---------- entrada da home ---------- */
  function heroIntro() {
    const words = [];
    document.querySelectorAll('[data-split]').forEach(el => words.push(...splitWords(el)));
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero .eyebrow', { y: 24, opacity: 0, duration: 0.7 })
      .from(words, { yPercent: 115, opacity: 0, duration: 0.9, stagger: 0.045 }, '-=0.35')
      .from('.hero-sub', { y: 22, opacity: 0, duration: 0.7 }, '-=0.55')
      .from('.hero-cta', { y: 18, opacity: 0, duration: 0.6 }, '-=0.45')
      .from('.hero-note', { y: 12, opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.hero-media', { y: 34, opacity: 0, scale: 0.98, duration: 1.1 }, '-=0.9')
      .from('.hero-badge', { y: 16, opacity: 0, duration: 0.6 }, '-=0.6');
  }

  /* ---------- parallax suave ---------- */
  function parallax() {
    if (!window.ScrollTrigger) return;
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      const amount = Number(el.dataset.parallax) || 10;
      gsap.fromTo(el, { yPercent: -amount / 2 }, {
        yPercent: amount / 2,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- ímã nos botões (ponteiro fino) ---------- */
  function magnetize() {
    if (!matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('.btn, .cat-card').forEach(el => {
      let raf = null;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          gsap.to(el, { x: dx * 6, y: dy * 5, duration: 0.4, ease: 'power2.out' });
        });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.5)' });
      });
    });
  }

  function boot() {
    heroIntro();
    parallax();
    magnetize();
    document.documentElement.dataset.motion = 'on';
  }

  if (document.querySelector('.intro')) {
    document.addEventListener('vc:intro-done', boot, { once: true });
  } else {
    boot();
  }
})();
