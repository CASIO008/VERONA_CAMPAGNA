/* ============================================================
   VERONA CAMPAGNA — abertura 3D (three.js)
   Roda apenas na PRIMEIRA visita (sem localStorage vc_intro_v1).
   Partículas douradas se reúnem num anel, a câmera atravessa o
   aro e a marca se revela. Pulável a qualquer toque/tecla/scroll.
   Com cache: nem monta — o site abre direto, sem animações.
   ============================================================ */
'use strict';

(function () {
  if (typeof VC === 'undefined') return;

  const overlay = document.createElement('div');
  overlay.className = 'intro';
  overlay.id = 'intro';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <canvas class="intro-canvas" id="introCanvas"></canvas>
    <div class="intro-word">
      <span class="intro-name">VERONA <em>CAMPAGNA</em></span>
      <span class="intro-sub">GIOIELLI</span>
    </div>
    <button class="intro-skip" id="introSkip" type="button">Entrar</button>`;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  /* ---------- encerramento ---------- */
  let done = false;
  function finish(instant) {
    if (done) return;
    done = true;
    VC.markVisited();
    overlay.classList.add('done');
    document.body.classList.remove('intro-lock');
    dispatchDone(instant ? 0 : 560);
    setTimeout(() => overlay.remove(), instant ? 0 : 700);
  }
  let doneTimer = null;
  function dispatchDone(delay) {
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('vc:intro-done'));
    }, delay);
  }

  function skip() { if (!done) finish(false); }

  document.body.appendChild(overlay);
  document.body.classList.add('intro-lock');

  if (VC.isCached() || reduced || !canWebGL || !window.THREE) {
    /* sem 3D: entrada curta em CSS e segue o jogo */
    overlay.classList.add('intro--css');
    requestAnimationFrame(() => overlay.classList.add('intro--show'));
    if (VC.isCached() || reduced) { finish(true); }
    else {
      setTimeout(() => finish(false), 1500);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
        window.addEventListener(ev, skip, { once: true, passive: true }));
    }
    return;
  }

  /* ---------- cena three.js ---------- */
  const canvas = document.getElementById('introCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0c09, 0.012);

  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 1.6, 34);

  /* sprite de brilho para as partículas */
  function glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,236,190,1)');
    g.addColorStop(0.35, 'rgba(226,178,94,.85)');
    g.addColorStop(1, 'rgba(226,178,94,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  const COUNT = 2600;
  const RING_R = 9.2;   // raio do aro
  const RING_T = 2.6;   // espessura

  const start = new Float32Array(COUNT * 3);
  const target = new Float32Array(COUNT * 3);
  const pos = new Float32Array(COUNT * 3);
  const delays = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    /* origem: esfera larga */
    const r = 34 + Math.random() * 26;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    start[i * 3] = r * Math.sin(ph) * Math.cos(th);
    start[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    start[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 18;

    /* destino: aro (torus com leve dispersão) */
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const rad = RING_T * Math.sqrt(Math.random());
    const tx = (RING_R + rad * Math.cos(v)) * Math.cos(u);
    const ty = (RING_R + rad * Math.cos(v)) * Math.sin(u);
    const tz = rad * Math.sin(v) * 1.15;
    target[i * 3] = tx;
    target[i * 3 + 1] = ty;
    target[i * 3 + 2] = tz;

    pos[i * 3] = start[i * 3];
    pos[i * 3 + 1] = start[i * 3 + 1];
    pos[i * 3 + 2] = start[i * 3 + 2];

    delays[i] = Math.random() * 0.55;
    seeds[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.42,
    map: glowTexture(),
    color: 0xE2B25E,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* poeira ambiente */
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(420 * 3);
  for (let i = 0; i < 420; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 90;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.16, color: 0xB08D57, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(dust);

  /* ---------- linha do tempo ---------- */
  const T_FORM = 1.9;    // formação do anel
  const T_HOLD = 3.1;    // anel girando + marca
  const T_FLY  = 4.1;    // câmera atravessa o aro
  const T_END  = 4.55;

  const clock = new THREE.Clock();
  let skipped = false;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame() {
    if (done) return;
    const t = clock.getElapsedTime();
    const k = Math.min(1, t / T_FORM);

    /* posições: lerp com atraso por partícula */
    for (let i = 0; i < COUNT; i++) {
      const local = Math.min(1, Math.max(0, (k - delays[i]) / (1 - delays[i] || 1)));
      const e = easeOutCubic(local);
      pos[i * 3] = start[i * 3] + (target[i * 3] - start[i * 3]) * e;
      pos[i * 3 + 1] = start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * e;
      pos[i * 3 + 2] = start[i * 3 + 2] + (target[i * 3 + 2] - start[i * 3 + 2]) * e;
    }
    geo.attributes.position.needsUpdate = true;

    /* vida do anel */
    const spin = t * 0.5;
    points.rotation.y = spin;
    points.rotation.x = -0.42 + Math.sin(t * 0.6) * 0.06;
    dust.rotation.y = -spin * 0.2;

    /* brilho cintilante */
    mat.opacity = 0.72 + Math.sin(t * 6.2) * 0.06;

    /* câmera: aproxima, depois atravessa o aro */
    if (t < T_HOLD) {
      const z = 34 - easeInOut(Math.min(1, t / T_HOLD)) * 12;
      camera.position.z = z;
      camera.position.y = 1.6 - Math.min(1, t / T_HOLD) * 0.6;
      camera.lookAt(0, 0, 0);
    } else {
      const ft = easeInOut(Math.min(1, (t - T_HOLD) / (T_FLY - T_HOLD)));
      camera.position.z = 22 - ft * 17.5;
      camera.position.y = 1 - ft * 0.4;
      camera.lookAt(0, 0, 0);
      points.scale.setScalar(1 + ft * 1.6);
      mat.opacity = (0.95 - ft * 0.9);
      dust.material.opacity = 0.5 - ft * 0.45;
    }

    /* marca aparece junto */
    if (t > 1.15) overlay.classList.add('intro--show');

    renderer.render(scene, camera);

    if (t >= T_END && !skipped) { finish(false); return; }
    requestAnimationFrame(frame);
  }

  function fastForward() {
    if (skipped || done) return;
    skipped = true;
    finish(false);
  }

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, fastForward, { once: true, passive: true }));
  document.getElementById('introSkip').addEventListener('click', fastForward);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  requestAnimationFrame(frame);
})();
