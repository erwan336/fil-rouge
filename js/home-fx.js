/* Effets interactifs de la page d'accueil « Fil Rouge »
   1. Lampe qui suit la souris + poussière qui danse dans la lumière (canvas)
   2. Parallaxe : les notes épinglées bougent légèrement avec la souris
   3. Ficelles rouges tendues entre les notes du tableau d'enquête
   4. Sous-titre tapé à la machine
   5. Disciplines : fiche descriptive au survol ou au toucher
   6. Carte SIG : démonstration automatique des couches, loupe d'enquêteur,
      info-bulle sur chaque intercommunalité
   7. Bouton « Lancer l'enquête » : scan d'empreinte avant le départ
   Tout s'arrête quand on quitte l'accueil, et les animations sont réduites
   si le système demande moins de mouvement. */
(() => {
  const home = $('s-home');
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;       // souris (et pas écran tactile)
  const onHome = () => !home.classList.contains('hidden');
  const mouse = { x: innerWidth * .2, y: innerHeight * .15, tx: innerWidth * .2, ty: innerHeight * .15, moved: false };
  addEventListener('pointermove', e => { mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.moved = true; }, { passive: true });

  /* ---------- Info-bulle partagée ---------- */
  const tip = document.createElement('div');
  tip.className = 'fxtip'; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(innerWidth - w - 8, Math.max(8, x + 14)) + 'px';
    tip.style.top = (y + h + 24 > innerHeight ? y - h - 14 : y + 18) + 'px';
  }
  const hideTip = () => tip.classList.remove('on');

  /* ---------- 1. Lampe + poussière ---------- */
  const lamp = document.createElement('div'); lamp.id = 'lamp';
  const dust = document.createElement('canvas'); dust.id = 'dust';
  document.body.prepend(lamp, dust);
  const ctx = dust.getContext('2d');
  let DPR = 1, motes = [];
  function sizeDust() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    dust.width = innerWidth * DPR; dust.height = innerHeight * DPR;
    const n = REDUCE ? 0 : Math.round(Math.min(80, innerWidth * innerHeight / 22000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - .5) * .15, vy: -.05 - Math.random() * .18,
      r: .6 + Math.random() * 1.8, a: .25 + Math.random() * .5, p: Math.random() * 6.28
    }));
  }
  sizeDust(); addEventListener('resize', sizeDust);

  /* ---------- 2. Parallaxe des notes ---------- */
  const DEPTH = [['.books', 5], ['.chalk', 12], ['.title-paper', 8], ['.note-vo', 14], ['.mission', 10], ['.sigwin', 3], ['.folders', 2]];
  const layers = DEPTH.map(([sel, d]) => [document.querySelector(sel), d]).filter(([el]) => el);

  /* Boucle d'animation unique (lampe, poussière, parallaxe) */
  let t = 0;
  function frame() {
    requestAnimationFrame(frame);
    const visible = onHome() && !document.hidden;
    document.body.classList.toggle('offhome', !visible);
    if (!visible) return;
    t += .016;
    // la lumière rejoint la souris en douceur ; sans souris, elle se balance seule
    if (!mouse.moved || !FINE) { mouse.tx = innerWidth * (.25 + .12 * Math.sin(t * .4)); mouse.ty = innerHeight * (.2 + .06 * Math.cos(t * .3)); }
    mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
    lamp.style.setProperty('--lx', mouse.x + 'px'); lamp.style.setProperty('--ly', mouse.y + 'px');

    if (!REDUCE && FINE) {
      const dx = (mouse.x / innerWidth - .5) * 2, dy = (mouse.y / innerHeight - .5) * 2;
      layers.forEach(([el, d]) => { el.style.translate = `${(-dx * d).toFixed(1)}px ${(-dy * d).toFixed(1)}px`; });
    }
    // poussière : plus brillante dans le faisceau de la lampe
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const m of motes) {
      m.x += m.vx + Math.sin(t + m.p) * .12; m.y += m.vy;
      if (m.y < -5) { m.y = innerHeight + 5; m.x = Math.random() * innerWidth; }
      if (m.x < -5) m.x = innerWidth + 5; else if (m.x > innerWidth + 5) m.x = -5;
      const dist = Math.hypot(m.x - mouse.x, m.y - mouse.y);
      const glow = Math.max(0, 1 - dist / 420);
      ctx.globalAlpha = m.a * (.12 + glow * .9);
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * (1 + glow * .6), 0, 6.283); ctx.fill();
    }
  }
  requestAnimationFrame(frame);

  /* ---------- 3. Ficelles rouges entre les notes ---------- */
  const board = document.querySelector('.board');
  const strings = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  strings.classList.add('strings'); strings.setAttribute('aria-hidden', 'true');
  board.prepend(strings);
  const LINKS = [['.chalk', '.title-paper'], ['.title-paper', '.note-vo'], ['.title-paper', '.sigwin'], ['.note-vo', '.mission']];
  let animateStrings = !REDUCE;
  function drawStrings() {
    if (!onHome()) return;
    const B = board.getBoundingClientRect();
    const pin = sel => {
      const el = document.querySelector(sel); if (!el) return null;
      const r = el.getBoundingClientRect(); if (!r.width) return null;   // note masquée (petit écran)
      return [r.left + r.width / 2 - B.left, r.top + 2 - B.top];
    };
    let html = '';
    LINKS.forEach(([a, b], i) => {
      const p = pin(a), q = pin(b); if (!p || !q) return;
      const sag = Math.min(60, Math.hypot(q[0] - p[0], q[1] - p[1]) * .18);   // la ficelle pend un peu
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + sag;
      html += `<path d="M${p[0]} ${p[1]} Q${mx} ${my} ${q[0]} ${q[1]}" style="animation-delay:${.3 + i * .25}s"/>`;
    });
    strings.innerHTML = html;
    strings.querySelectorAll('path').forEach(p => {
      const len = Math.ceil(p.getTotalLength());
      p.style.setProperty('--len', len);
      if (!animateStrings) p.classList.add('still');
    });
    animateStrings = false;               // seulement la première fois
  }
  addEventListener('resize', () => requestAnimationFrame(drawStrings));
  new MutationObserver(() => { if (onHome()) requestAnimationFrame(drawStrings); else hideTip(); })
    .observe(home, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 4. Sous-titre tapé à la machine ---------- */
  const sub = document.querySelector('.title-paper .sub:not(#homeSub)');
  if (sub && !REDUCE) {
    const lines = ['Une maladie.', 'Six causes cachées.'];
    sub.innerHTML = '&nbsp;';
    let li = 0, ci = 0;
    const type = () => {
      ci++;
      if (ci > lines[li].length) { li++; ci = 0; if (li >= lines.length) { sub.innerHTML = lines.join('<br>') + '<span class="caret"></span>'; return; } }
      sub.innerHTML = lines.slice(0, li).map(l => l + '<br>').join('') + lines[li].slice(0, ci) + '<span class="caret"></span>';
      setTimeout(type, ci === 0 ? 350 : 55 + Math.random() * 60);
    };
    setTimeout(type, 600);
  }
  // Changement de maladie : le sous-titre rouge s'anime
  const hs = $('homeSub');
  new MutationObserver(() => { hs.classList.remove('flash'); void hs.offsetWidth; hs.classList.add('flash'); })
    .observe(hs, { childList: true, characterData: true, subtree: true });

  /* ---------- 5. Disciplines : fiche au survol ---------- */
  const BLURB = {
    geo:  "Je lis le territoire : distances, quartiers, cartes.",
    soc:  "J'écoute les gens : ce qu'ils vivent, ce qu'ils taisent.",
    epi:  "Je compte les malades et je compare les populations.",
    sp:   "Je cherche ce qui protège la santé de tous.",
    inf:  "Je suis sur le terrain, au plus près des patients.",
    stat: "Je fais parler les chiffres… sans les tordre.",
    dm:   "Je vérifie que les données sont fiables.",
    clin: "Je soigne : je sais ce que la maladie fait au corps.",
    dec:  "Je décide et je finance les actions.",
    pat:  "Je porte la voix de celles et ceux qui vivent la maladie."
  };
  document.querySelectorAll('#avatars .av').forEach((av, i) => {
    const r = ROLES[i]; if (!r) return;
    av.tabIndex = 0; av.setAttribute('role', 'button');
    av.setAttribute('aria-label', `${r.name} : ${BLURB[r.id]}`);
    av.style.setProperty('--c', COLORS[r.color]);
    const html = `<b style="color:${COLORS[r.color]}">${r.name}</b>${BLURB[r.id]}<small>Dans le jeu : un indice secret.</small>`;
    const at = () => { const b = av.getBoundingClientRect(); showTip(html, b.left, b.bottom - 6); };
    av.addEventListener('mouseenter', at);
    av.addEventListener('focus', at);
    av.addEventListener('mouseleave', hideTip);
    av.addEventListener('blur', hideTip);
    av.addEventListener('click', () => {
      document.querySelectorAll('#avatars .av.lit').forEach(x => x !== av && x.classList.remove('lit'));
      av.classList.toggle('lit'); at();
    });
  });

  /* ---------- 6. Carte SIG de l'accueil ---------- */
  const map = $('homeMap'), svg = map && map.querySelector('svg');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    // Loupe : une copie de toutes les couches, visible seulement dans un cercle
    const defs = svg.querySelector('defs');
    const clip = document.createElementNS(NS, 'clipPath'); clip.id = 'lensClip';
    const hole = document.createElementNS(NS, 'circle'); hole.setAttribute('r', 34);
    clip.appendChild(hole); defs.appendChild(clip);
    const lens = document.createElementNS(NS, 'g'); lens.classList.add('lens');
    const inside = document.createElementNS(NS, 'g'); inside.setAttribute('clip-path', 'url(#lensClip)');
    const bg = document.createElementNS(NS, 'circle'); bg.setAttribute('r', 34); bg.setAttribute('fill', 'rgba(255,255,255,.06)');
    inside.appendChild(bg);
    svg.querySelectorAll('.lyr[data-l]:not(.hot)').forEach(g => {
      const c = g.cloneNode(true); c.removeAttribute('data-l'); c.classList.add('on'); inside.appendChild(c);
    });
    const ring = document.createElementNS(NS, 'g'); ring.classList.add('lens-ring');
    ring.innerHTML = '<circle r="34"/><path d="M24 24 L40 40"/><text y="-40" text-anchor="middle">LOUPE</text>';
    lens.append(inside, ring); svg.appendChild(lens);
    const toSvg = (cx, cy) => { const m = svg.getScreenCTM(); return m ? new DOMPoint(cx, cy).matrixTransform(m.inverse()) : null; };
    const moveLens = e => {
      const p = toSvg(e.clientX, e.clientY); if (!p) return;
      hole.setAttribute('cx', p.x); hole.setAttribute('cy', p.y);
      bg.setAttribute('cx', p.x); bg.setAttribute('cy', p.y);
      ring.setAttribute('transform', `translate(${p.x} ${p.y})`);
      lens.classList.add('on');
    };
    map.addEventListener('pointermove', moveLens);
    map.addEventListener('pointerdown', moveLens);
    map.addEventListener('pointerleave', () => { lens.classList.remove('on'); hideTip(); });

    // Info-bulle sur chaque intercommunalité (niveau de cas FICTIF)
    map.addEventListener('pointermove', e => {
      const terr = e.target.closest && e.target.closest('.terr');
      if (!terr) { hideTip(); return; }
      const v = +terr.getAttribute('fill-opacity');
      const lvlTxt = v > .6 ? 'très nombreux' : v > .35 ? 'nombreux' : v > .2 ? 'moyens' : 'peu nombreux';
      showTip(`<b>${terr.dataset.nom}</b>Malades : ${lvlTxt}<small>Données fictives</small>`, e.clientX, e.clientY);
    });

    // Démonstration automatique : les couches s'allument une à une, jusqu'au premier clic
    const boxes = [...document.querySelectorAll('#sigHome [data-layer]')];
    let step = 0, demo = REDUCE ? null : setInterval(() => {
      if (!onHome() || document.hidden) return;
      if (step < boxes.length) { const b = boxes[step++]; b.checked = true; b.dispatchEvent(new Event('change')); b.closest('label').classList.add('blink'); setTimeout(() => b.closest('label').classList.remove('blink'), 700); }
      else if (step++ > boxes.length + 1) { boxes.forEach(b => { b.checked = false; b.dispatchEvent(new Event('change')); }); step = 0; }
    }, 1400);
    const stopDemo = () => { if (demo) { clearInterval(demo); demo = null; } };
    $('sigHome').addEventListener('pointerdown', stopDemo);
    $('sigHome').addEventListener('keydown', stopDemo);
  }

  /* ---------- 7. Bouton de lancement : scan d'empreinte ---------- */
  const go = $('startBtn');
  go.onclick = () => {
    if (REDUCE) { startGame(); return; }
    go.classList.add('scan'); go.disabled = true;
    setTimeout(() => { go.classList.remove('scan'); go.disabled = false; startGame(); }, 750);
  };
  // Après quelques secondes sans action, le bouton attire l'œil
  let idle = setTimeout(() => go.classList.add('nudge'), 9000);
  addEventListener('pointerdown', () => { clearTimeout(idle); go.classList.remove('nudge'); }, { once: true });

  // Premier tracé des ficelles une fois la page et les polices prêtes
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(drawStrings, 250));
})();
