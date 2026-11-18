/* =====================================================================
   ÉNIGME FINALE : « Où installer l'antenne mobile de dépistage ? »
   ---------------------------------------------------------------------
   Après l'enquête, le Centre Léon Bérard peut envoyer UN camion de
   dépistage dans UNE intercommunalité du Rhône (hors Métropole).
   - Le grand écran montre 12 fiches de territoires (données publiques).
   - Chaque joueur a reçu sur son téléphone UNE condition secrète
     (deux en équipe de 2 ou 3).
   - Un seul territoire respecte toutes les conditions, et CHAQUE
     condition est indispensable : sans la vôtre, il resterait au moins
     deux territoires possibles. Personne ne peut trouver seul.
   Tout est calculé à partir de la graine du code de partie : le grand
   écran et les téléphones obtiennent la même énigme, sans connexion.
   Les données des fiches sont FICTIVES (sauf le nom, le type CA/CC,
   la position et le fait de toucher la Métropole, qui sont réels).
   ===================================================================== */

/* Les 12 intercommunalités candidates (ordre = numéro affiché).
   key : début du nom dans RHONE_GEO ; ca : communauté d'agglomération ;
   met : touche la Métropole de Lyon ; zone : 0 nord, 1 ouest, 2 sud, 3 est ;
   at : position de l'étiquette sur la carte (longitude, latitude). */
const ENIG_TERR = [
  { key:"CA de l'Ouest Rhodanien",      name:"Ouest Rhodanien",              ca:1, met:0, zone:0, at:[4.40, 46.00] },
  { key:"CC Saône-Beaujolais",          name:"Saône-Beaujolais",             ca:0, met:0, zone:0, at:[4.60, 46.20] },
  { key:"CA Villefranche",              name:"Villefranche Beaujolais Saône",ca:1, met:0, zone:0, at:[4.66, 46.02] },
  { key:"CC Beaujolais Pierres",        name:"Beaujolais Pierres Dorées",    ca:0, met:1, zone:0, at:[4.66, 45.92] },
  { key:"CC du Pays de l'Arbresle",     name:"Pays de l'Arbresle",           ca:0, met:1, zone:1, at:[4.59, 45.82] },
  { key:"CC des Monts du Lyonnais",     name:"Monts du Lyonnais",            ca:0, met:0, zone:1, at:[4.46, 45.68] },
  { key:"CC des Vallons du Lyonnais",   name:"Vallons du Lyonnais",          ca:0, met:1, zone:1, at:[4.66, 45.73] },
  { key:"CC de l'Est Lyonnais",         name:"Est Lyonnais",                 ca:0, met:1, zone:3, at:[5.04, 45.70] },
  { key:"CC de la Vallée du Garon",     name:"Vallée du Garon",              ca:0, met:1, zone:2, at:[4.76, 45.665] },
  { key:"CC du Pays Mornantais",        name:"Pays Mornantais",              ca:0, met:1, zone:2, at:[4.66, 45.61] },
  { key:"CC du Pays de l'Ozon",         name:"Pays de l'Ozon",               ca:0, met:1, zone:2, at:[4.89, 45.63] },
  { key:"CA Vienne Condrieu",           name:"Vienne Condrieu",              ca:1, met:1, zone:2, at:[4.78, 45.52] }
];
const ZONES = ['le nord', "l'ouest", 'le sud', "l'est"];
const ZONE_TAG = ['Nord', 'Ouest', 'Sud', 'Est'];
const MAL = ['faible', 'moyen', 'fort'];

/* Données fictives tirées à chaque partie. n : nombre de valeurs possibles. */
const ENIG_FICT = {
  mal:  { n:3, role:'epi' },   // niveau de malades
  dep:  { n:2, role:'inf' },   // lieu de dépistage (1 = oui)
  gare: { n:2, role:'geo' },   // gare (1 = oui)
  med:  { n:2, role:'clin' },  // médecins (1 = nombreux, 0 = rares)
  pop:  { n:2, role:'soc' },   // population (1 = âgée, 0 = jeune)
  asso: { n:2, role:'pat' }    // association de patients (1 = oui)
};
const ENIG_REAL_ROLE = { met:'geo', ca:'dec', zone:'stat' };

/** Texte d'une condition. c : { a (attribut), eq (vrai = « est », faux = « n'est pas »), v (valeur) } */
function enigText(c, terr) {
  const T = {
    mal:  c.eq ? ["On vise un territoire où la maladie est encore faible : prévenir avant qu'elle monte.",
                  "Le niveau de malades y est moyen : ni le pire, ni le meilleur.",
                  "Le territoire choisi compte beaucoup de malades (niveau fort)."][c.v]
               : `Le niveau de malades n'y est pas ${MAL[c.v]}.`,
    dep:  c.v ? "Il y a déjà un lieu de dépistage : le camion s'appuiera sur son équipe."
              : "Il n'y a encore aucun lieu de dépistage : c'est là qu'il manque.",
    gare: c.v ? "Il faut une gare : beaucoup d'habitants n'ont pas de voiture."
              : "Pas de gare : ces habitants ne peuvent pas venir jusqu'à Lyon.",
    med:  c.v ? "Les médecins y sont nombreux : ils pourront orienter les patients vers le camion."
              : "Les médecins y sont rares : personne ne propose le dépistage.",
    pop:  c.v ? "La population y est plutôt âgée : c'est elle qu'il faut dépister."
              : "La population y est plutôt jeune : on veut agir tôt.",
    asso: c.v ? "Une association de patients doit être présente pour relayer l'information."
              : "Aucune association de patients n'y est présente : le camion comblera ce vide.",
    met:  c.v ? "Le territoire touche la Métropole de Lyon : le camion doit pouvoir revenir vite au Centre."
              : "Le territoire ne touche pas la Métropole de Lyon : on veut aller loin.",
    ca:   c.v ? "Notre budget ne finance qu'une communauté d'agglomération (CA)."
              : "Notre budget ne finance qu'une communauté de communes (CC).",
    zone: c.eq ? `Le territoire est dans ${ZONES[c.v]} du département.`
               : `Le territoire n'est pas dans ${ZONES[c.v]} du département.`,
    not:  `Ce n'est pas le n° ${c.v + 1} (${terr[c.v].name}) : ${['un camion y passe déjà', 'un projet y est déjà financé', 'ses données sont incomplètes'][c.why]}.`
  };
  return T[c.a];
}
/** Le territoire x respecte-t-il la condition c ? */
const enigPass = (c, x) => c.a === 'not' ? x.i !== c.v : c.eq ? x[c.a] === c.v : x[c.a] !== c.v;

/** Nombre de conditions selon le nombre de joueurs */
const enigCount = nb => nb === 1 ? 5 : nb <= 3 ? nb * 2 : nb;

/** Construit l'énigme de la partie (même graine = même énigme partout).
 *  Méthode : on choisit d'abord la réponse, puis on fabrique les données pour que
 *  chaque condition élimine au moins un territoire qu'aucune autre n'élimine. */
function buildEnigma(seed, nb) {
  const rand = rng(seed * 7727 + nb * 13 + 5);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const K = enigCount(nb), FICT = Object.keys(ENIG_FICT);
  for (let attempt = 0; attempt < 400; attempt++) {
    const T = ENIG_TERR.map((b, i) => ({ ...b, i }));
    const t = Math.floor(rand() * T.length), others = T.filter(x => x.i !== t);
    // 1. Une condition « réelle » (géographie, type), une fois sur deux
    let real = null;
    if (rand() < .55) {
      const a = pick(['met', 'ca', 'zone']);
      const c = a === 'zone' && rand() < .5
        ? { a, eq:false, v: pick([0, 1, 2, 3].filter(z => z !== T[t].zone)) }
        : { a, eq:true, v: T[t][a] };
      real = { c, fails: others.filter(x => !enigPass(c, x)) };
      if (!real.fails.length) real = null;
    }
    const nReal = real ? 1 : 0;
    const nFict = Math.min(FICT.length, K - nReal);
    const nNot = K - nReal - nFict;                       // conditions « ce n'est pas le n° … »
    const free = others.filter(x => !real || !real.fails.includes(x));
    if (free.length < nFict + nNot) continue;
    // 2. Conditions fictives : un attribut chacune, valeur tirée au sort
    const fict = shuffle(FICT, rand).slice(0, nFict).map(a => {
      const n = ENIG_FICT[a].n;
      return a === 'mal' && rand() < .4 ? { a, eq:false, v: Math.floor(rand() * n) } : { a, eq:true, v: Math.floor(rand() * n) };
    });
    // 3. Qui échoue à quoi ? (indices des conditions fictives non respectées)
    const fails = new Map(T.map(x => [x.i, []]));
    const fr = shuffle(free, rand);
    const notList = fr.slice(0, nNot);                    // respectent tout, sauf leur « ce n'est pas »
    fr.slice(nNot, nNot + nFict).forEach((x, j) => fails.set(x.i, [j]));   // éliminés par une seule condition
    const subset = (min) => { let s; do { s = fict.map((_, j) => j).filter(() => rand() < .45); } while (s.length < min); return s; };
    fr.slice(nNot + nFict).forEach(x => fails.set(x.i, subset(1)));
    if (real) {                                           // l'un d'eux n'est éliminé QUE par la condition réelle
      const rf = shuffle(real.fails, rand);
      rf.forEach((x, k) => fails.set(x.i, k === 0 ? [] : subset(0)));
    }
    // 4. Valeurs fictives cohérentes avec ce plan
    T.forEach(x => {
      FICT.forEach(a => { x[a] = Math.floor(rand() * ENIG_FICT[a].n); });
      fict.forEach((c, j) => {
        const n = ENIG_FICT[c.a].n, all = Array.from({ length: n }, (_, v) => v);
        const want = !fails.get(x.i).includes(j);         // doit respecter la condition j ?
        const ok = all.filter(v => enigPass(c, { [c.a]: v }) === want);
        x[c.a] = pick(ok);
      });
    });
    // 5. Toutes les conditions, puis vérification
    const conds = [...(real ? [real.c] : []), ...fict,
      ...notList.map(x => ({ a:'not', eq:true, v:x.i, why: Math.floor(rand() * 3) }))];
    const sol = T.filter(x => conds.every(c => enigPass(c, x)));
    const needed = conds.every((c, k) => T.filter(x => conds.every((d, j) => j === k || enigPass(d, x))).length > 1);
    if (sol.length !== 1 || sol[0].i !== t || !needed) continue;
    const clues = shuffle(conds, rand).map(c => ({ ...c, role: c.a === 'not' ? pick(['dm', 'sp']) : ENIG_FICT[c.a] ? ENIG_FICT[c.a].role : ENIG_REAL_ROLE[c.a], text: enigText(c, T) }));
    return { terr: T, target: t, clues };
  }
  return null;                                            // (n'arrive pas : vérifié sur toutes les graines)
}
/** Conditions confiées au joueur n (1 à nb) */
const enigFor = (E, nb, n) => E.clues.filter((_, k) => k % nb === n - 1);

/* ---------------------------------------------------------------------
   Affichage sur le grand écran
   --------------------------------------------------------------------- */
const ENIG_TIME = [180, 150, 120];        // secondes selon la difficulté
const ENIG_TRIES = [3, 2, 1];             // essais selon la difficulté

function enigCard(x, st, filt) {
  const yn = (v, a, b) => `<span class="ec ${v ? 'y' : 'n'}">${v ? a : b}</span>`;
  return `<button class="efiche ${st.out.has(x.i) ? 'out' : ''} ${filt ? 'filt' : ''} ${st.wrong.has(x.i) ? 'wrong' : ''}" data-ei="${x.i}" aria-pressed="${st.out.has(x.i)}">
    ${filt && !st.out.has(x.i) ? `<span class="ef-why">Écarté : ${qText(filt)}</span>` : ''}
    <span class="ef-top"><b class="ef-n">${x.i + 1}</b><span class="ef-name">${x.name}</span></span>
    <span class="ef-meta">${x.ca ? 'CA' : 'CC'} · ${ZONE_TAG[x.zone]} · ${x.met ? 'touche la Métropole' : 'ne touche pas la Métropole'}</span>
    <span class="ef-chips">
      <span class="ec mal m${x.mal}">Malades : ${MAL[x.mal]}</span>
      ${yn(x.dep, 'Dépistage : oui', 'Dépistage : non')}
      ${yn(x.gare, 'Gare : oui', 'Gare : non')}
      <span class="ec">Médecins : ${x.med ? 'nombreux' : 'rares'}</span>
      <span class="ec">Population : ${x.pop ? 'âgée' : 'jeune'}</span>
      ${yn(x.asso, 'Association : oui', 'Association : non')}
    </span>
  </button>`;
}

/** Carte SIG de l'énigme : malades selon les fiches, numéros cliquables */
function enigMap(E) {
  const box = document.createElement('div');
  box.innerHTML = sigMap('e');
  const svg = box.querySelector('svg');
  svg.querySelectorAll('.terr').forEach(p => {
    const i = E.terr.findIndex(x => p.dataset.nom.startsWith(x.key.replace(/"/g, '')));
    if (i < 0) { p.classList.add('lyon'); p.setAttribute('fill-opacity', '.08'); return; }
    p.dataset.ei = i;
    p.setAttribute('fill-opacity', [.18, .5, .88][E.terr[i].mal]);
  });
  const g = E.terr.map(x => { const [cx, cy] = proj(...x.at).map(r1);
    return `<g class="enum" data-ei="${x.i}"><circle cx="${cx}" cy="${cy}" r="8"/><text x="${cx}" y="${r1(cy + 3.4)}">${x.i + 1}</text></g>`; }).join('');
  svg.insertAdjacentHTML('beforeend', `<g class="enums">${g}</g>`);
  return box.innerHTML;
}

/* Requêtes SIG : les champs de la table attributaire (valeur = indice dans vals) */
const QFIELDS = [
  { a:'mal',  label:'Malades',              vals:['faible', 'moyen', 'fort'] },
  { a:'dep',  label:'Dépistage',            vals:['non', 'oui'] },
  { a:'gare', label:'Gare',                 vals:['non', 'oui'] },
  { a:'med',  label:'Médecins',             vals:['rares', 'nombreux'] },
  { a:'pop',  label:'Population',           vals:['jeune', 'âgée'] },
  { a:'asso', label:'Association',          vals:['non', 'oui'] },
  { a:'met',  label:'Touche la Métropole',  vals:['non', 'oui'] },
  { a:'ca',   label:'Type',                 vals:['CC', 'CA'] },
  { a:'zone', label:'Zone',                 vals:ZONE_TAG },
  { a:'not',  label:'Numéro',               vals:ENIG_TERR.map((_, i) => String(i + 1)) }
];
const qField = a => QFIELDS.find(f => f.a === a);
const qText = q => `${qField(q.a).label} ${q.a === 'not' || !q.eq ? '≠' : '='} ${qField(q.a).vals[q.v]}`;

/** Lance l'énigme finale ; then(résultat) est appelé à la fin */
function startEnigma(then) {
  const E = buildEnigma(state.scen.seed, state.nb);
  if (!E) { then(null); return; }
  const d = state.scen.diff;
  const st = { E, filters: [], out: new Set(), wrong: new Set(), tries: ENIG_TRIES[d], left: ENIG_TIME[d], done: false, timer: null };
  state.enig = st;
  $('result').innerHTML = `
    <div class="enigma glass" id="enigma">
      <div class="en-head">
        <span class="en-kick">${icon('target', 16)} Énigme finale</span>
        <span class="en-clock" id="enClock"></span>
        <span class="en-tries" id="enTries"></span>
      </div>
      <h2>Où envoyer le camion de dépistage ?</h2>
      <p class="en-lead">Le Centre Léon Bérard peut envoyer <b>un seul</b> camion de dépistage, dans <b>un seul</b> territoire.
        ${solo() ? 'Voici vos conditions. Un seul territoire les respecte toutes.'
                 : `Ouvrez la carte <b>« Énigme finale »</b> sur vos téléphones : chacun a ${state.nb <= 3 ? 'deux conditions' : 'une condition'}.
        <b>Un seul territoire les respecte toutes</b>, et sans la condition de chacun, impossible de trouver.`}</p>
      ${solo() ? `<ol class="en-conds">${E.clues.map(c => `<li style="--c:${COLORS[roleById(c.role).color]}"><small>${roleById(c.role).name}</small>${c.text}</li>`).join('')}</ol>` : ''}
      <div class="en-body">
        <div class="sigmap en-map" id="enMap">${enigMap(E)}</div>
        <div class="en-right">
          <div class="en-query" aria-label="Requête SIG">
            <div class="q-title">${icon('database', 15)} Requête SIG <small>table attributaire des 12 territoires</small></div>
            <div class="q-row">
              <span class="q-kw">SÉLECTIONNER OÙ</span>
              <select id="qA" aria-label="Champ">${QFIELDS.map(f => `<option value="${f.a}">${f.label}</option>`).join('')}</select>
              <select id="qOp" aria-label="Opérateur"><option value="1">=</option><option value="0">≠</option></select>
              <select id="qV" aria-label="Valeur"></select>
              <button class="btn btn-go q-add" id="qAdd">Appliquer</button>
            </div>
            <ol class="q-hist" id="qHist"></ol>
            <div class="q-count"><span id="qCount"></span><i><b id="qBar"></b></i></div>
          </div>
          <div class="en-grid" id="enGrid"></div>
        </div>
      </div>
      <div class="en-foot">
        <span class="en-help">Traduisez chaque condition en requête : la carte se filtre à chaque étape. Vous pouvez aussi rayer une fiche à la main.</span>
        <button class="btn btn-red" id="enGo" disabled></button>
      </div>
    </div>`;
  const failing = x => st.filters.find(q => !enigPass(q, x));          // 1re requête qui écarte x
  const remaining = () => E.terr.filter(x => !st.out.has(x.i) && !failing(x));
  const paintQuery = () => {
    let n = E.terr.length;
    $('qHist').innerHTML = st.filters.map((q, k) => {
      const after = E.terr.filter(x => st.filters.slice(0, k + 1).every(f => enigPass(f, x))).length;
      const html = `<li><span class="q-step">${k + 1}</span><code>${qText(q)}</code><span class="q-n">${n} → <b>${after}</b></span>
        <button data-qdel="${k}" aria-label="Retirer la requête">✕</button></li>`;
      n = after; return html; }).join('') || '<li class="q-empty">Aucune requête : les 12 territoires sont sélectionnés.</li>';
  };
  const paint = () => {
    $('enGrid').innerHTML = E.terr.map(x => enigCard(x, st, failing(x))).join('');
    const rest = remaining(), few = rest.length <= 3;
    $('enMap').querySelectorAll('[data-ei]').forEach(el => { const i = +el.dataset.ei;
      el.classList.toggle('out', st.out.has(i) || !!failing(E.terr[i]));
      el.classList.toggle('sel', few && rest.some(x => x.i === i)); });
    $('qCount').innerHTML = `Sélection : <b>${rest.length}</b> territoire${rest.length > 1 ? 's' : ''} sur ${E.terr.length}`;
    $('qBar').style.width = ((E.terr.length - rest.length) / (E.terr.length - 1) * 100) + '%';
    const go = $('enGo');
    go.disabled = rest.length !== 1 || st.done;
    go.innerHTML = rest.length === 1 ? `${icon('check', 18)} Envoyer le camion : n° ${rest[0].i + 1}`
      : rest.length ? `Encore ${rest.length - 1} territoire${rest.length > 2 ? 's' : ''} à écarter` : 'Aucun territoire : retirez une requête';
    $('enTries').innerHTML = `Essais : ${'●'.repeat(st.tries)}<span class="lost">${'●'.repeat(ENIG_TRIES[d] - st.tries)}</span>`;
    $('enClock').textContent = fmtTime(st.left);
    $('enClock').classList.toggle('hurry', st.left <= 20);
  };
  const toggle = i => {
    if (st.done || Number.isNaN(i)) return;
    st.out.has(i) ? st.out.delete(i) : st.out.add(i);
    sfx('click'); paint();
  };
  const end = ok => {
    st.done = true; clearInterval(st.timer);
    const x = E.terr[E.target];
    $('enMap').querySelectorAll(`[data-ei="${E.target}"]`).forEach(el => el.classList.add('win'));
    paint();
    document.querySelector(`.efiche[data-ei="${E.target}"]`).classList.add('win');
    $('enigma').insertAdjacentHTML('beforeend', `<div class="en-verdict ${ok ? 'ok' : 'ko'}">
      <b>${ok ? 'Bravo, toutes les conditions sont respectées !' : 'Le camion n\'est pas parti…'}</b>
      <span>La bonne réponse : <b>n° ${x.i + 1} · ${x.name}</b>.</span>
      <button class="btn btn-ink" id="enNext">Voir le bilan ${icon('arrow')}</button></div>`);
    $('enNext').onclick = () => then({ ok, name: x.name, tries: ENIG_TRIES[d] - st.tries, conds: E.clues.length });
    sfx(ok ? 'win' : 'lose'); if (ok) confetti();
  };
  $('enGrid').addEventListener('click', e => { const b = e.target.closest('[data-ei]'); if (b) toggle(+b.dataset.ei); });
  $('enMap').addEventListener('click', e => { const b = e.target.closest('[data-ei]'); if (b) toggle(+b.dataset.ei); });
  // Construction des requêtes
  const fillVals = () => { const f = qField($('qA').value);
    $('qV').innerHTML = f.vals.map((v, i) => `<option value="${i}">${v}</option>`).join('');
    $('qOp').value = f.a === 'not' ? '0' : $('qOp').value; $('qOp').disabled = f.a === 'not'; };
  $('qA').onchange = fillVals; fillVals();
  $('qAdd').onclick = () => {
    if (st.done) return;
    const q = { a: $('qA').value, eq: $('qOp').value === '1', v: +$('qV').value };
    if (q.a === 'not') q.eq = true;
    if (st.filters.some(f => f.a === q.a && f.eq === q.eq && f.v === q.v)) { toast('Cette requête est déjà appliquée.'); return; }
    const before = remaining().length;
    st.filters.push(q); paintQuery(); paint();
    const after = remaining().length;
    toast(`${qText(q)} : ${before - after} territoire${before - after > 1 ? 's' : ''} écarté${before - after > 1 ? 's' : ''}`, after ? 'ok' : 'ko');
    sfx(after ? 'ok' : 'ko');
  };
  $('qHist').addEventListener('click', e => { const b = e.target.closest('[data-qdel]'); if (!b || st.done) return;
    st.filters.splice(+b.dataset.qdel, 1); sfx('click'); paintQuery(); paint(); });
  paintQuery();
  $('enGo').onclick = () => {
    const rest = remaining();
    if (rest.length !== 1 || st.done) return;
    if (rest[0].i === E.target) { end(true); return; }
    st.tries--; st.wrong.add(rest[0].i); st.out.add(rest[0].i);
    const broken = E.clues.filter(c => !enigPass(c, rest[0])).length;
    toast(`Raté : le n° ${rest[0].i + 1} ne respecte pas ${broken} condition${broken > 1 ? 's' : ''}. Relisez-les !`, 'ko');
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
  countdown('Énigme finale', `${E.clues.length} conditions · ${E.terr.length} territoires · 1 seul camion`, () => { if (!st.done) st.timer = setInterval(tick, 1000); });
}

/** Carte « Énigme finale » sur le téléphone du joueur */
function enigPhoneHtml(code, n, nb, seed) {
  const E = buildEnigma(seed, nb); if (!E) return '';
  const mine = enigFor(E, nb, n);
  return mine.map((c, i) => { const r = roleById(c.role); return `
    <article class="paper clue dossier enigma-card" style="--c:#c0392b">
      <header class="d-head"><span>Énigme finale</span><span>N° ${code}-${n}-E${mine.length > 1 ? i + 1 : ''}</span></header>
      <span class="d-stamp">À la fin</span>
      <div class="d-role"><i>${icon('target', 26)}</i><div><small>Condition ${i + 1}${mine.length > 1 ? ' sur ' + mine.length : ''} · ${r.name}</small><b>Où envoyer le camion ?</b></div></div>
      <p>${c.text}</p>
      <div class="d-hold">${icon('finger', 16)} Maintenez le doigt pour lire</div>
      <footer class="d-foot">Ne la lisez que lorsque le grand écran affiche l'énigme finale. Dites-la à voix haute : sans elle, personne ne trouvera.</footer>
    </article>`; }).join('');
}
