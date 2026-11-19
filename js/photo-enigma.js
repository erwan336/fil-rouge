/* =====================================================================
   ÉNIGME FINALE (variante) : « PHOTO MYSTÈRE »
   ---------------------------------------------------------------------
   Une photo de terrain a perdu sa géolocalisation : il faut retrouver
   où elle a été prise pour l'intégrer au SIG (géocodage d'une donnée de
   recherche). Les photos sont de VRAIES casernes de pompiers du Rhône
   (SDMIS, data.grandlyon.com, voir js/casernes-data.js).
   - Le grand écran montre la photo, la carte et 8 à 12 lieux candidats.
   - Chaque joueur a UN indice (deux en équipe de 2-3) sur son téléphone.
   - Un seul lieu respecte tous les indices, et chaque indice est
     indispensable (méthode : on choisit les indices, puis on cherche des
     lieux « leurres » que seul cet indice élimine).
   ===================================================================== */

const CLB_AT = [4.884, 45.737];                      // Centre Léon Bérard (Lyon 8e)
const PH_RINGS = [10, 25, 40];                        // cercles de distance (km)
const phKm = x => Math.hypot((x.lon - CLB_AT[0]) * Math.cos(45.74 * Math.PI / 180) * 111.2, (x.lat - CLB_AT[1]) * 111.2);
const phLetter = x => x.c.normalize('NFD').replace(/[̀-ͯ]/g, '')[0].toUpperCase();
const phSaint = x => /^Sainte?-/.test(x.c);

/** Les indices possibles (vrai/faux), calculés à partir du lieu-réponse t */
function phPredicates(t, rand) {
  const N = t.lat > CLB_AT[1], Ea = t.lon > CLB_AT[0], d = phKm(t);
  const half = x => phLetter(x) <= 'L', hyph = x => x.c.includes('-'), zero = x => x.cp.endsWith('0');
  const others = [...new Set(CASERNES.map(x => x.g))].filter(g => g !== t.g);
  const g = others[Math.floor(rand() * others.length)];
  return [
    { id:'ref',  f: x => x.r === t.r, text: t.r === 'Métropole' ? 'La photo a été prise sur le territoire de la Métropole de Lyon.' : 'La photo a été prise hors de la Métropole, dans le reste du département du Rhône.' },
    { id:'ngrp', f: x => x.g !== g, text: `Ce lieu ne dépend pas du groupement de secours « ${g} ».` },
    { id:'ns',   f: x => (x.lat > CLB_AT[1]) === N, text: `Le lieu est au ${N ? 'nord' : 'sud'} du Centre Léon Bérard.` },
    { id:'ew',   f: x => (x.lon > CLB_AT[0]) === Ea, text: `Le lieu est à l'${Ea ? 'est' : 'ouest'} du Centre Léon Bérard.` },
    { id:'d10',  f: x => (phKm(x) < 10) === (d < 10), text: `Le lieu est à ${d < 10 ? 'moins' : 'plus'} de 10 km du Centre Léon Bérard (cercles sur la carte).` },
    { id:'d25',  f: x => (phKm(x) < 25) === (d < 25), text: `Le lieu est à ${d < 25 ? 'moins' : 'plus'} de 25 km du Centre Léon Bérard (cercles sur la carte).` },
    { id:'d40',  f: x => (phKm(x) < 40) === (d < 40), text: `Le lieu est à ${d < 40 ? 'moins' : 'plus'} de 40 km du Centre Léon Bérard (cercles sur la carte).` },
    { id:'let',  f: x => half(x) === half(t), text: `Le nom de la commune commence par une lettre ${half(t) ? 'de A à L' : 'de M à Z'}.` },
    { id:'st',   f: x => phSaint(x) === phSaint(t), text: phSaint(t) ? 'Le nom de la commune commence par « Saint ».' : 'Le nom de la commune ne commence pas par « Saint ».' },
    { id:'hy',   f: x => hyph(x) === hyph(t), text: hyph(t) ? "Le nom de la commune contient un trait d'union." : "Le nom de la commune ne contient aucun trait d'union." },
    { id:'cp',   f: x => zero(x) === zero(t), text: zero(t) ? 'Son code postal se termine par 0.' : 'Son code postal ne se termine pas par 0.' }
  ];
}

/** Construit l'énigme photo (même graine = même énigme sur tous les appareils).
 *  On ajoute les indices un par un : chaque nouvel indice doit avoir son propre « leurre »,
 *  un lieu que lui seul élimine ; les leurres déjà choisis doivent rester valables. */
function buildPhotoEnigma(seed, nb) {
  const rand = rng(seed * 4241 + nb * 17 + 3);
  const K = enigCount(nb), A = Math.min(K, 6), E = K - A, GAP = 4;
  const far = (x, list) => list.every(y => Math.hypot((x.lon - y.lon) * .7 * 111.2, (x.lat - y.lat) * 111.2) >= GAP);
  for (let attempt = 0; attempt < 300; attempt++) {
    const t = CASERNES[Math.floor(rand() * CASERNES.length)];
    const order = shuffle(CASERNES, rand).filter(x => x !== t);
    const preds = [], priv = [], chosen = [t];
    for (const p of shuffle(phPredicates(t, rand), rand)) {
      if (preds.length === A) break;
      if (!priv.every(x => p.f(x))) continue;            // un leurre existant serait aussi éliminé : on saute
      const c = order.find(x => !chosen.includes(x) && !p.f(x) && preds.every(q => q.f(x)) && far(x, chosen));
      if (c) { preds.push(p); priv.push(c); chosen.push(c); }
    }
    if (preds.length < A) continue;
    const passAll = x => preds.every(p => p.f(x));
    const nots = order.filter(x => !chosen.includes(x) && passAll(x));
    const notPick = [];
    for (const x of nots) { if (notPick.length < E && far(x, chosen)) { notPick.push(x); chosen.push(x); } }
    if (notPick.length < E) continue;
    const want = Math.max(8, Math.min(12, chosen.length + 2));
    for (const x of order) { if (chosen.length >= want) break;
      if (!chosen.includes(x) && preds.filter(p => !p.f(x)).length >= 2 && far(x, chosen)) chosen.push(x); }
    const places = shuffle(chosen, rand).map((x, i) => ({ ...x, i }));
    const target = places.findIndex(x => x.n === t.n && x.ph === t.ph);
    const conds = [...preds.map(p => ({ a: p.id, f: p.f, text: p.text })),
      ...notPick.map(x => { const i = places.findIndex(y => y.n === x.n && y.ph === x.ph);
        return { a: 'not', f: y => y.i !== i, text: `Ce n'est pas le lieu n° ${i + 1} (${x.c}) : une autre équipe y a déjà enquêté.` }; })];
    const sol = places.filter(x => conds.every(c => c.f(x)));
    const needed = conds.every((c, k) => places.filter(x => conds.every((d, j) => j === k || d.f(x))).length > 1);
    if (sol.length !== 1 || sol[0].i !== target || !needed) continue;
    return { places, target, clues: shuffle(conds, rand).map(c => ({ ...c, role: PH_ROLE[c.a] })) };
  }
  return null;
}
const PH_ROLE = { ref:'dec', ngrp:'sp', ns:'geo', ew:'geo', d10:'epi', d25:'inf', d40:'clin', let:'soc', st:'pat', hy:'soc', cp:'dm', not:'stat' };

/** Carte SIG : cercles de distance autour du CLB et lieux candidats numérotés */
function photoMap(E) {
  const box = document.createElement('div');
  box.innerHTML = sigMap('p');
  const svg = box.querySelector('svg');
  svg.querySelectorAll('.terr').forEach(p => p.setAttribute('fill-opacity', '.12'));
  const [cx, cy] = proj(...CLB_AT).map(r1);
  const rings = PH_RINGS.map(km => `<circle cx="${cx}" cy="${cy}" r="${r1(km * KM)}" fill="none" stroke="#ffb02e" stroke-width="1.3" stroke-dasharray="5 4" stroke-opacity=".8"/>
    <text x="${cx}" y="${r1(cy - km * KM - 2)}" fill="#ffd9a0" font-size="7.5" font-family="Consolas,monospace" text-anchor="middle">${km} km</text>`).join('');
  const pins = E.places.map(x => { const [px, py] = proj(x.lon, x.lat).map(r1);
    return `<g class="enum" data-pi="${x.i}"><circle cx="${px}" cy="${py}" r="7.5"/><text x="${px}" y="${r1(py + 3.2)}">${x.i + 1}</text></g>`; }).join('');
  svg.insertAdjacentHTML('beforeend', `<g pointer-events="none">${rings}
    <path transform="translate(${cx} ${cy})" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="#fff"/></g>
    <g class="enums">${pins}</g>`);
  return box.innerHTML;
}

/** Lance l'énigme photo ; then(résultat) à la fin */
function startPhotoEnigma(then) {
  const E = buildPhotoEnigma(state.scen.seed, state.nb);
  if (!E) { startEnigma(then); return; }
  const d = state.scen.diff, x0 = E.places[E.target];
  const st = { E, out: new Set(), wrong: new Set(), tries: ENIG_TRIES[d], left: ENIG_TIME[d], done: false, timer: null };
  state.enig = st;
  $('result').innerHTML = `
    <div class="enigma glass photo-en" id="enigma">
      <div class="en-head">
        <span class="en-kick">${icon('target', 16)} Énigme finale · Photo mystère</span>
        <span class="en-clock" id="enClock"></span>
        <span class="en-tries" id="enTries"></span>
      </div>
      <h2>Où cette photo de terrain a-t-elle été prise ?</h2>
      <p class="en-lead">Pendant l'enquête, une photo a perdu sa <b>géolocalisation</b>. Sans elle, impossible de l'intégrer au SIG.
        ${solo() ? 'Croisez les indices ci-dessous avec la photo et la carte.'
                 : `Ouvrez la carte <b>« Énigme finale »</b> sur vos téléphones : chacun détient ${state.nb <= 3 ? 'deux indices' : 'un indice'}.
        <b>Un seul lieu</b> les respecte tous, et chaque indice est indispensable.`}</p>
      ${solo() ? `<ol class="en-conds">${E.clues.map(c => `<li style="--c:${COLORS[roleById(c.role).color]}"><small>${roleById(c.role).name}</small>${c.text}</li>`).join('')}</ol>` : ''}
      <div class="ph-body">
        <figure class="ph-photo">
          <img src="${x0.ph}" alt="Photo mystère : un lieu du Rhône à retrouver" referrerpolicy="no-referrer"
            onerror="this.parentNode.classList.add('noimg')">
          <figcaption id="phCap">Photo de terrain · lieu inconnu</figcaption>
          <div class="ph-noimg">Photo indisponible (pas de connexion ?) : utilisez seulement les indices et la carte.</div>
        </figure>
        <div class="sigmap en-map" id="enMap">${photoMap(E)}</div>
        <ol class="ph-list" id="phList"></ol>
      </div>
      <div class="en-foot">
        <span class="en-help">Touchez un lieu (liste ou carte) pour l'écarter. Quand il n'en reste qu'un, géolocalisez la photo.</span>
        <button class="btn btn-red" id="enGo" disabled></button>
      </div>
    </div>`;
  const rest = () => E.places.filter(x => !st.out.has(x.i));
  const paint = () => {
    $('phList').innerHTML = E.places.map(x => `<li><button class="ph-item ${st.out.has(x.i) ? 'out' : ''} ${st.wrong.has(x.i) ? 'wrong' : ''}" data-pi="${x.i}">
      <b class="ef-n">${x.i + 1}</b><span><b>${x.c}</b><small>${x.cp} · groupement ${x.g} · ${x.r === 'Métropole' ? 'Métropole' : 'Département'}</small></span></button></li>`).join('');
    $('enMap').querySelectorAll('[data-pi]').forEach(el => el.classList.toggle('out', st.out.has(+el.dataset.pi)));
    const r = rest(), go = $('enGo');
    go.disabled = r.length !== 1 || st.done;
    go.innerHTML = r.length === 1 ? `${icon('map', 18)} Géolocaliser la photo : n° ${r[0].i + 1}` : r.length ? `Encore ${r.length - 1} lieu${r.length > 2 ? 'x' : ''} à écarter` : 'Aucun lieu : rétablissez-en un';
    $('enTries').innerHTML = `Essais : ${'●'.repeat(st.tries)}<span class="lost">${'●'.repeat(ENIG_TRIES[d] - st.tries)}</span>`;
    $('enClock').textContent = fmtTime(st.left);
    $('enClock').classList.toggle('hurry', st.left <= 20);
  };
  const toggle = i => { if (st.done || Number.isNaN(i)) return; st.out.has(i) ? st.out.delete(i) : st.out.add(i); sfx('click'); paint(); };
  const end = ok => {
    st.done = true; clearInterval(st.timer); paint();
    $('enMap').querySelectorAll(`[data-pi="${E.target}"]`).forEach(el => el.classList.add('win'));
    document.querySelector(`.ph-item[data-pi="${E.target}"]`).classList.add('win');
    $('phCap').innerHTML = `<b>${x0.n}</b> · ${x0.a}, ${x0.cp} ${x0.c} · photo SDMIS`;
    $('enigma').insertAdjacentHTML('beforeend', `<div class="en-verdict ${ok ? 'ok' : 'ko'}">
      <b>${ok ? 'Photo géolocalisée : la donnée rejoint le SIG !' : 'La photo reste sans lieu…'}</b>
      <span>C'était la caserne de pompiers de <b>${x0.c}</b> (n° ${x0.i + 1}).</span>
      <button class="btn btn-ink" id="enNext">Voir le bilan ${icon('arrow')}</button></div>`);
    $('enNext').onclick = () => then({ kind: 'photo', ok, name: x0.c, conds: E.clues.length });
    sfx(ok ? 'win' : 'lose'); if (ok) confetti();
  };
  $('phList').addEventListener('click', e => { const b = e.target.closest('[data-pi]'); if (b) toggle(+b.dataset.pi); });
  $('enMap').addEventListener('click', e => { const b = e.target.closest('[data-pi]'); if (b) toggle(+b.dataset.pi); });
  $('enGo').onclick = () => {
    const r = rest(); if (r.length !== 1 || st.done) return;
    if (r[0].i === E.target) { end(true); return; }
    st.tries--; st.wrong.add(r[0].i); st.out.add(r[0].i);
    const broken = E.clues.filter(c => !c.f(r[0])).length;
    toast(`Raté : le lieu n° ${r[0].i + 1} contredit ${broken} indice${broken > 1 ? 's' : ''}.`, 'ko');
    sfx('ko'); document.body.classList.remove('hit'); void document.body.offsetWidth; document.body.classList.add('hit');
    if (st.tries <= 0) end(false); else paint();
  };
  paint();
  const tick = () => {
    if (st.done) return;
    st.left--; $('timerTxt').textContent = fmtTime(st.left);
    if (st.left > 0 && st.left <= 5) sfx('tick');
    if (st.left <= 0) { st.left = 0; end(false); } else paint();
  };
  $('timerTxt').textContent = fmtTime(st.left);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  countdown('Photo mystère', `${E.clues.length} indices · ${E.places.length} lieux · 1 seule photo`, () => { if (!st.done) st.timer = setInterval(tick, 1000); });
}

/** Indice(s) « Photo mystère » sur le téléphone */
function photoPhoneHtml(code, n, nb, seed) {
  const E = buildPhotoEnigma(seed, nb); if (!E) return enigPhoneHtml(code, n, nb, seed);
  const mine = E.clues.filter((_, k) => k % nb === n - 1);
  return mine.map((c, i) => { const r = roleById(c.role); return `
    <article class="paper clue dossier enigma-card" style="--c:#c0392b">
      <header class="d-head"><span>Énigme finale · Photo mystère</span><span>N° ${code}-${n}-P${mine.length > 1 ? i + 1 : ''}</span></header>
      <span class="d-stamp">À la fin</span>
      <div class="d-role"><i>${icon('map', 26)}</i><div><small>Indice ${i + 1}${mine.length > 1 ? ' sur ' + mine.length : ''} · ${r.name}</small><b>Où a été prise la photo ?</b></div></div>
      <p>${c.text}</p>
      <div class="d-hold">${icon('finger', 16)} Maintenez le doigt pour lire</div>
      <footer class="d-foot">À lire quand le grand écran montre la photo mystère. Dites-le à voix haute : sans votre indice, impossible de trouver.</footer>
    </article>`; }).join('');
}

/* ---------------------------------------------------------------------
   Choix de l'énigme finale, caché dans la graine du code de partie :
   Math.floor(graine / 3) % 2 → 0 = camion de dépistage, 1 = photo mystère
   --------------------------------------------------------------------- */
const ENIG_KINDS = ['Camion de dépistage', 'Photo mystère', '🎲 Au hasard'];
const enigKind = seed => Math.floor(seed / 3) % 2;
