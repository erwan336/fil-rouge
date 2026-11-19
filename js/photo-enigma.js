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
   Ce fichier contient aussi le MOTEUR COMMUN des énigmes « lieu mystère »
   (réutilisé par js/hosp-enigma.js).
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

/** Moteur commun aux énigmes « lieu mystère » (même graine = même énigme sur tous les appareils).
 *  On ajoute les indices un par un : chaque nouvel indice doit avoir son propre « leurre »,
 *  un lieu que lui seul élimine ; les leurres déjà choisis doivent rester valables.
 *  pool : lieux {lon, lat, ...} · predsOf(t, rand) : indices possibles
 *  gapKm : écart minimal entre deux lieux (lisibilité de la carte) · notText(x, n) : « ce n'est pas le n° n » */
function buildPlaceEnigma(pool, predsOf, roles, salt, gapKm, notText, seed, nb) {
  const rand = rng(seed * 4241 + nb * 17 + salt);
  const K = enigCount(nb), A = Math.min(K, 6), E = K - A;
  const far = (x, list) => list.every(y => Math.hypot((x.lon - y.lon) * .7 * 111.2, (x.lat - y.lat) * 111.2) >= gapKm);
  for (let attempt = 0; attempt < 300; attempt++) {
    const t = pool[Math.floor(rand() * pool.length)];
    const order = shuffle(pool, rand).filter(x => x !== t);
    const preds = [], priv = [], chosen = [t];
    for (const p of shuffle(predsOf(t, rand).filter(Boolean), rand)) {
      if (preds.length === A) break;
      if (!priv.every(x => p.f(x))) continue;            // un leurre existant serait aussi éliminé : on saute
      const c = order.find(x => !chosen.includes(x) && !p.f(x) && preds.every(q => q.f(x)) && far(x, chosen));
      if (c) { preds.push(p); priv.push(c); chosen.push(c); }
    }
    if (preds.length < A) continue;
    const passAll = x => preds.every(p => p.f(x));
    const notPick = [];
    for (const x of order) { if (notPick.length < E && !chosen.includes(x) && passAll(x) && far(x, chosen)) { notPick.push(x); chosen.push(x); } }
    if (notPick.length < E) continue;
    const want = Math.max(8, Math.min(12, chosen.length + 2));
    for (const x of order) { if (chosen.length >= want) break;
      if (!chosen.includes(x) && preds.filter(p => !p.f(x)).length >= 2 && far(x, chosen)) chosen.push(x); }
    const sh = shuffle(chosen, rand), places = sh.map((x, i) => ({ ...x, i })), target = sh.indexOf(t);
    const conds = [...preds.map(p => ({ a: p.id, f: p.f, text: p.text })),
      ...notPick.map(x => { const i = sh.indexOf(x); return { a: 'not', f: y => y.i !== i, text: notText(x, i + 1) }; })];
    const sol = places.filter(x => conds.every(c => c.f(x)));
    const needed = conds.every((c, k) => places.filter(x => conds.every((d, j) => j === k || d.f(x))).length > 1);
    if (sol.length !== 1 || sol[0].i !== target || !needed) continue;
    return { places, target, clues: shuffle(conds, rand).map(c => ({ ...c, role: roles[c.a] })) };
  }
  return null;
}
const PH_ROLE = { ref:'dec', ngrp:'sp', ns:'geo', ew:'geo', d10:'epi', d25:'inf', d40:'clin', let:'soc', st:'pat', hy:'soc', cp:'dm', not:'stat' };
const buildPhotoEnigma = (seed, nb) => buildPlaceEnigma(CASERNES, phPredicates, PH_ROLE, 3, 4,
  (x, n) => `Ce n'est pas le lieu n° ${n} (${x.c}) : une autre équipe y a déjà enquêté.`, seed, nb);

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

/** Interface commune des énigmes « lieu mystère ».
 *  cfg : E, kind, kick, title, lead, figure, map, item(x), go(x), cap(x0), okTxt, koTxt, verdict(x0), name(x0), help, cdTitle, cdSub */
function startPlaceEnigma(cfg, then) {
  const { E } = cfg, d = state.scen.diff, x0 = E.places[E.target];
  const st = { E, out: new Set(), wrong: new Set(), tries: ENIG_TRIES[d], left: ENIG_TIME[d], done: false, timer: null };
  state.enig = st;
  $('result').innerHTML = `
    <div class="enigma glass photo-en" id="enigma">
      <div class="en-head">
        <span class="en-kick">${icon('target', 16)} Énigme finale · ${cfg.kick}</span>
        <span class="en-clock" id="enClock"></span>
        <span class="en-tries" id="enTries"></span>
      </div>
      <h2>${cfg.title}</h2>
      <p class="en-lead">${cfg.lead}
        ${solo() ? 'Croisez les indices ci-dessous avec la carte.'
                 : `Ouvrez la carte <b>« Énigme finale »</b> sur vos téléphones : chacun détient ${state.nb <= 3 ? 'deux indices' : 'un indice'}.
        <b>Un seul lieu</b> les respecte tous, et chaque indice est indispensable.`}</p>
      ${solo() ? `<ol class="en-conds">${E.clues.map(c => `<li style="--c:${COLORS[roleById(c.role).color]}"><small>${roleById(c.role).name}</small>${c.text}</li>`).join('')}</ol>` : ''}
      <div class="ph-body">
        ${cfg.figure}
        <div class="sigmap en-map" id="enMap">${cfg.map}</div>
        <ol class="ph-list" id="phList"></ol>
      </div>
      <div class="en-foot">
        <span class="en-help">${cfg.help}</span>
        <button class="btn btn-red" id="enGo" disabled></button>
      </div>
    </div>`;
  const rest = () => E.places.filter(x => !st.out.has(x.i));
  const paint = () => {
    $('phList').innerHTML = E.places.map(x => `<li><button class="ph-item ${st.out.has(x.i) ? 'out' : ''} ${st.wrong.has(x.i) ? 'wrong' : ''}" data-pi="${x.i}">
      <b class="ef-n">${x.i + 1}</b><span>${cfg.item(x)}</span></button></li>`).join('');
    $('enMap').querySelectorAll('[data-pi]').forEach(el => el.classList.toggle('out', st.out.has(+el.dataset.pi)));
    const r = rest(), go = $('enGo');
    go.disabled = r.length !== 1 || st.done;
    go.innerHTML = r.length === 1 ? `${icon('map', 18)} ${cfg.go(r[0])}` : r.length ? `Encore ${r.length - 1} lieu${r.length > 2 ? 'x' : ''} à écarter` : 'Aucun lieu : rétablissez-en un';
    $('enTries').innerHTML = `Essais : ${'●'.repeat(st.tries)}<span class="lost">${'●'.repeat(ENIG_TRIES[d] - st.tries)}</span>`;
    $('enClock').textContent = fmtTime(st.left);
    $('enClock').classList.toggle('hurry', st.left <= 20);
  };
  const toggle = i => { if (st.done || Number.isNaN(i)) return; st.out.has(i) ? st.out.delete(i) : st.out.add(i); sfx('click'); paint(); };
  const end = ok => {
    st.done = true; clearInterval(st.timer); paint();
    $('enMap').querySelectorAll(`[data-pi="${E.target}"]`).forEach(el => el.classList.add('win'));
    document.querySelector(`.ph-item[data-pi="${E.target}"]`).classList.add('win');
    $('phCap').innerHTML = cfg.cap(x0);
    $('enigma').insertAdjacentHTML('beforeend', `<div class="en-verdict ${ok ? 'ok' : 'ko'}">
      <b>${ok ? cfg.okTxt : cfg.koTxt}</b>
      <span>${cfg.verdict(x0)}</span>
      <button class="btn btn-ink" id="enNext">Voir le bilan ${icon('arrow')}</button></div>`);
    $('enNext').onclick = () => then({ kind: cfg.kind, ok, name: cfg.name(x0), conds: E.clues.length });
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
  countdown(cfg.cdTitle, `${E.clues.length} indices · ${E.places.length} ${cfg.cdSub}`, () => { if (!st.done) st.timer = setInterval(tick, 1000); });
}

/** Lance l'énigme photo ; then(résultat) à la fin */
function startPhotoEnigma(then) {
  const E = buildPhotoEnigma(state.scen.seed, state.nb);
  if (!E) { startEnigma(then); return; }
  startPlaceEnigma({ E, kind: 'photo', kick: 'Photo mystère', title: 'Où cette photo de terrain a-t-elle été prise ?',
    lead: "Pendant l'enquête, une photo a perdu sa <b>géolocalisation</b>. Sans elle, impossible de l'intégrer au SIG.",
    figure: `<figure class="ph-photo">
          <img src="${E.places[E.target].ph}" alt="Photo mystère : un lieu du Rhône à retrouver" referrerpolicy="no-referrer"
            onerror="this.parentNode.classList.add('noimg')">
          <figcaption id="phCap">Photo de terrain · lieu inconnu</figcaption>
          <div class="ph-noimg">Photo indisponible (pas de connexion ?) : utilisez seulement les indices et la carte.</div>
        </figure>`,
    map: photoMap(E),
    item: x => `<b>${x.c}</b><small>${x.cp} · groupement ${x.g} · ${x.r === 'Métropole' ? 'Métropole' : 'Département'}</small>`,
    go: x => `Géolocaliser la photo : n° ${x.i + 1}`,
    cap: x => `<b>${x.n}</b> · ${x.a}, ${x.cp} ${x.c} · photo SDMIS`,
    okTxt: 'Photo géolocalisée : la donnée rejoint le SIG !', koTxt: 'La photo reste sans lieu…',
    verdict: x => `C'était la caserne de pompiers de <b>${x.c}</b> (n° ${x.i + 1}).`, name: x => x.c,
    help: "Touchez un lieu (liste ou carte) pour l'écarter. Quand il n'en reste qu'un, géolocalisez la photo.",
    cdTitle: 'Photo mystère', cdSub: 'lieux · 1 seule photo' }, then);
}

/** Indice(s) d'une énigme « lieu mystère » sur le téléphone */
function placePhoneHtml(E, code, n, nb, tag, kick, q, foot) {
  const mine = E.clues.filter((_, k) => k % nb === n - 1);
  return mine.map((c, i) => { const r = roleById(c.role); return `
    <article class="paper clue dossier enigma-card" style="--c:#c0392b">
      <header class="d-head"><span>Énigme finale · ${kick}</span><span>N° ${code}-${n}-${tag}${mine.length > 1 ? i + 1 : ''}</span></header>
      <span class="d-stamp">À la fin</span>
      <div class="d-role"><i>${icon('map', 26)}</i><div><small>Indice ${i + 1}${mine.length > 1 ? ' sur ' + mine.length : ''} · ${r.name}</small><b>${q}</b></div></div>
      <p>${c.text}</p>
      <div class="d-hold">${icon('finger', 16)} Maintenez le doigt pour lire</div>
      <footer class="d-foot">${foot}</footer>
    </article>`; }).join('');
}
function photoPhoneHtml(code, n, nb, seed) {
  const E = buildPhotoEnigma(seed, nb); if (!E) return enigPhoneHtml(code, n, nb, seed);
  return placePhoneHtml(E, code, n, nb, 'P', 'Photo mystère', 'Où a été prise la photo ?',
    'À lire quand le grand écran montre la photo mystère. Dites-le à voix haute : sans votre indice, impossible de trouver.');
}

/* ---------------------------------------------------------------------
   Choix de l'énigme finale, caché dans la graine du code de partie :
   Math.floor(graine / 3) % 3 → 0 = camion de dépistage, 1 = photo mystère, 2 = hôpital mystère
   --------------------------------------------------------------------- */
const ENIG_KINDS = ['Camion de dépistage', 'Photo mystère', 'Hôpital mystère', '🎲 Au hasard'];
const enigKind = seed => Math.floor(seed / 3) % 3;
const enigOk = (seed, nb) => [() => true, buildPhotoEnigma, buildHospEnigma][enigKind(seed)](seed, nb) !== null;
const enigStarter = seed => [startEnigma, startPhotoEnigma, startHospEnigma][enigKind(seed)];
const enigPhone = seed => [enigPhoneHtml, photoPhoneHtml, hospPhoneHtml][enigKind(seed)];
