/* Logique du jeu « Fil Rouge » */

/* =====================================================================
   C. HASARD REPRODUCTIBLE (même code = mêmes indices sur chaque appareil)
   ===================================================================== */
function rng(seed) {             // générateur pseudo-aléatoire "mulberry32"
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Répartit les 10 disciplines entre nb joueurs (chacune = 1 indice) */
function deal(nb, seed) {
  const rand = rng(seed * 7919 + nb);
  const players = Array.from({ length: nb }, () => ({ roles: [] }));
  shuffle(ROLES, rand).forEach((r, i) => players[i % nb].roles.push(r.id));
  return players;
}
/** Code de partie à 5 chiffres :
 *  1er = nb de joueurs (0 = 10), 2e = maladie (6 = « autre »), 3 derniers = tirage */
const makeCode = (nb, dis, seed) => `${nb % 10}${dis}${seed}`;
function parseCode(code) {
  if (!/^\d{5}$/.test(code)) return null;
  const nb = +code[0] || 10, dis = +code[1], seed = +code.slice(2);
  return seed >= 100 && dis <= DISEASES.length ? { nb, dis, seed } : null;
}
const diseaseFor = (dis, name) => dis < DISEASES.length ? DISEASES[dis] : customDisease(name);

/* =====================================================================
   D. ÉTAT ET OUTILS
   ===================================================================== */
const DURATIONS = [3, 4, 5];     // minutes d'enquête
const GOAL = 6;                  // 6 vraies causes au total
const state = {
  mode: 'team', nb: 3, teamName: '',             // mode : 'solo', 'team' (2-3) ou 'group' (4-10)
  durIdx: 1, disIdx: 0, customName: '',          // autres réglages de l'accueil
  code: '', players: [], allTiles: [], tiles: [],
  levels: [], lvl: 0, levelFound: 0, foundIds: new Set(), errors: 0, livesKept: 0, timeBank: 0,
  lives: 3, picked: null, over: false,
  timeLeft: 0, timerId: null, running: false
};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const solo = () => state.nb === 1;

function show(id) {
  ['home', 'lobby', 'wall', 'join', 'player'].forEach(s => $('s-' + s).classList.toggle('hidden', s !== id));
  $('topbar').classList.toggle('hidden', !['lobby', 'wall'].includes(id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
/** Joue un son (js/sfx.js) sans jamais bloquer le jeu si le son est indisponible */
function sfx(name) { try { SFX[name](); } catch (e) {} }
const REDUCED = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Compte à rebours plein écran « 3, 2, 1, Enquêtez ! » puis done() */
function countdown(label, sub, done) {
  const o = document.createElement('div'); o.className = 'cd'; o.setAttribute('aria-live', 'assertive');
  document.body.appendChild(o);
  const steps = ['3', '2', '1', 'GO'];
  let i = 0;
  const step = () => {
    if (i >= steps.length) { o.remove(); done(); return; }
    const s = steps[i++], go = s === 'GO';
    o.innerHTML = `<div><div class="cd-lbl">${label}</div><div class="cd-sub">${sub}</div>
      <div class="cd-n ${go ? 'go' : ''}">${go ? 'Enquêtez !' : s}</div></div>`;
    sfx(go ? 'go' : 'tick');
    setTimeout(step, REDUCED() ? 250 : go ? 650 : 700);
  };
  step();
}

/** Gerbe d'étincelles autour d'un élément (vraie cause trouvée) */
function burst(el, color) {
  if (REDUCED()) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const a = Math.random() * 6.283, d = 50 + Math.random() * 80;
    s.style.cssText = `left:${cx}px;top:${cy}px;background:${i % 3 ? color : '#fff'};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 800);
  }
}

/** Notification. kind : 'ko' (erreur), 'ok' (réussite) ou rien (information) */
function toast(msg, kind = '') {
  document.querySelectorAll('.toast').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'toast ' + kind;
  t.innerHTML = `<span class="ti">${kind === 'ko' ? '✕' : kind === 'ok' ? '✓' : '!'}</span><span></span>`;
  t.lastChild.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
}
function openModal(html) {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="paper modal" role="dialog" aria-modal="true">${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(o);
}
function closeModal() { const o = $('overlay'); if (o) o.remove(); }
function roleBadge(id) {
  const r = roleById(id);
  return `<span class="rb" style="--c:${COLORS[r.color]}"><i>${icon(r.icon, 13)}</i>${r.name}</span>`;
}
/** Petite mémoire locale (facultative) : le téléphone retrouve son indice après un rechargement */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* =====================================================================
   E. ACCUEIL
   ===================================================================== */
const RULES_HTML = `<ol class="rules3" style="color:inherit">
  <li>Trouvez les 6 vraies causes sur le mur.</li>
  <li>Chacun a un indice secret. Ne le montrez pas : parlez !</li>
  <li>3 erreurs et l'enquête est perdue.</li></ol>`;

const FOLDERS = [
  { key:'brief', title:'Dossier confidentiel', art:'<span class="stamp">TOP SECRET</span>',
    body:() => `<p>Dans le <b>Rhône</b>, le nord du département compte de plus en plus d'habitants touchés par <b>${esc(DISEASE.title)}</b>.
        <span class="small">(Scénario et chiffres inventés pour le jeu.)</span></p>
      <p>Sur le mur d'enquête : 12 pistes. Six sont de vraies causes. Les six autres sont des rumeurs ou des idées reçues.</p>
      <p>À vous de tirer les bons fils.</p>` },
  { key:'rules', title:'Règles du jeu', art:icon('compass', 34),
    body:() => `${RULES_HTML}
      <p class="small"><b>Mode équipe : 3 niveaux.</b> Niveau 1 : 4 pistes, 3 vies, 2 min. Niveau 2 : 6 pistes, 2 vies, 1 min 30. Niveau 3 : 8 pistes, 1 vie, 1 min.</p>
      <p class="small"><b>Avec les téléphones :</b> l'écran commun affiche un code. Chaque joueur touche « Rejoindre avec mon téléphone », entre le code et son numéro, et découvre son indice.</p>
      <p class="small"><b>Solo :</b> tous les indices s'affichent sous le mur.
        <b>Équipe de 2 à 3 :</b> chaque équipe lance sa propre partie, puis on compare les scores.
        <b>Grand groupe :</b> tout le monde joue autour du même écran.</p>
      <p class="small"><b>La carte :</b> chaque vraie cause trouvée allume une couche sur la carte du Rhône.</p>` },
  { key:'roles', title:'Rôles des joueurs', art:icon('users', 34),
    body:() => `<p>Dix disciplines, dix indices. Avec moins de 10 joueurs, certains reçoivent plusieurs indices.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${ROLES.map(r =>
        `<span class="rb" style="--c:${COLORS[r.color]};background:rgba(0,0,0,.08)"><i>${icon(r.icon, 13)}</i>${r.name}</span>`).join('')}</div>` },
  { key:'debrief', title:'Débriefing', art:icon('chart', 34),
    body:() => `<p>À la fin, le mur révèle les 6 causes : territoire, social, environnement, accès aux soins, comportements, politiques publiques.</p>
      <p>Deux questions lancent la discussion : quelle piste auriez-vous choisie seul·e ? Quel indice vous a surpris ?</p>` }
];

/* Nombre de joueurs autorisé selon le mode */
const MODES = {
  solo:  { min:1, max:1,  def:1, tip:"Vous jouez seul·e : les 10 indices s'affichent sous le mur." },
  team:  { min:2, max:3,  def:3, tip:"3 niveaux de plus en plus durs (★ ★★ ★★★), environ 5 minutes. 8 ou 9 participants ? Formez 3 équipes de 2 ou 3, chacune sur son écran, puis comparez les scores." },
  group: { min:4, max:10, def:8, tip:"Tout le groupe joue ensemble autour d'un seul grand écran." }
};
function setMode(mode) {
  state.mode = mode;
  const m = MODES[mode];
  if (state.nb < m.min || state.nb > m.max) state.nb = m.def;
  renderSettings();
}

/** Fenêtre SIG de l'accueil : couches à cocher + coordonnées sous la souris */
function renderSigHome() {
  const defaults = ['terr', 'soin'];           // couches allumées au départ
  $('sigHome').innerHTML = `
    <div class="sigbar"><i></i><i></i><i></i>SIG · Rhône (69)<b>Cas de maladie par intercommunalité</b></div>
    <div class="sigbody">
      <div class="siglayers">
        <h5>Couches</h5>
        <label class="base" style="--f:#e0362b"><input type="checkbox" checked disabled><span class="sw"></span>Cas de maladie</label>
        ${FAMILIES.map(f => `<label style="--f:${f.color}"><input type="checkbox" data-layer="${f.id}" ${defaults.includes(f.id) ? 'checked' : ''}>
          <span class="sw"></span>${SIG_LABELS[f.id]}</label>`).join('')}
        <p class="lhint">Cochez les couches : pourquoi le nord du Rhône est-il si rouge ?</p>
      </div>
      <div class="sigmap" id="homeMap">${sigMap('h')}</div>
    </div>
    <div class="sigstatus"><span id="sigXY">Survolez la carte</span><span>Contours : IGN ADMIN EXPRESS, geo.api.gouv.fr · données fictives</span></div>`;
  const map = $('homeMap');
  defaults.forEach(id => setLayer(map, id, true));
  $('sigHome').querySelectorAll('[data-layer]').forEach(cb => cb.onchange = () => setLayer(map, cb.dataset.layer, cb.checked));
  // Comme dans un vrai SIG : longitude/latitude réelles sous la souris + nom du territoire survolé
  map.onmousemove = e => {
    const svg = map.querySelector('svg'), m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const [lon, lat] = unproj(p.x, p.y);
    const nom = e.target.dataset && e.target.dataset.nom;
    $('sigXY').textContent = `Lon ${lon.toFixed(3).replace('.', ',')}° E · Lat ${lat.toFixed(3).replace('.', ',')}° N${nom ? ' · ' + nom : ''}`;
  };
}

function renderHome() {
  renderSigHome();
  $('avatars').innerHTML = ROLES.map(r =>
    `<div class="av"><span class="face" style="--c:${COLORS[r.color]}">${icon(r.icon, 24)}</span><span>${r.short}</span></div>`).join('');
  $('folders').innerHTML = FOLDERS.map(f => `<button class="folder" data-folder="${f.key}">${f.title}<span>${f.art}</span></button>`).join('');
  renderSettings();
}
function renderSettings() {
  document.querySelectorAll('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
  $('playersRow').classList.toggle('hidden', state.mode === 'solo');
  $('durRow').classList.toggle('hidden', state.mode === 'team');   // en équipe, chaque niveau a son temps
  $('teamName').classList.toggle('hidden', state.mode !== 'team');
  $('modeTip').textContent = MODES[state.mode].tip;
  state.teamName = state.mode === 'team' ? $('teamName').value.trim() : '';
  $('pVal').textContent = state.nb;
  $('dVal').textContent = DURATIONS[state.durIdx] + ' minutes';
  const isCustom = state.disIdx === DISEASES.length;
  $('mVal').textContent = isCustom ? 'Autre maladie…' : DISEASES[state.disIdx].label;
  $('customName').classList.toggle('hidden', !isCustom);
  state.customName = $('customName').value.trim();
  setDisease(diseaseFor(state.disIdx, state.customName));
  $('homeSub').textContent = 'Enquête sur ' + DISEASE.title;
}

/* ---------------------------------------------------------------------
   NIVEAUX
   - Mode équipe (2-3 joueurs) : 3 niveaux de difficulté croissante.
     À chaque niveau : 2 nouvelles vraies causes à trouver, mais plus de
     fausses pistes, moins de vies et moins de temps. La carte SIG se
     complète d'un niveau à l'autre.
   - Solo et grand groupe : un seul niveau avec les 12 pistes.
   --------------------------------------------------------------------- */
const ALL_FAKES = ['eau', '5g', 'eol', 'myth', 'faute', 'hasard'];
const TEAM_LEVELS = [
  { name:'Repérage',  stars:1, fams:['terr', 'soin'], fakes:['eau', '5g'],                  lives:3, time:120 },
  { name:'Enquête',   stars:2, fams:['soc', 'env'],   fakes:['eau', '5g', 'eol', 'myth'],    lives:2, time:90  },
  { name:'Expertise', stars:3, fams:['comp', 'pol'],  fakes:ALL_FAKES,                       lives:1, time:60  }
];
function levelsFor() {
  if (state.mode === 'team') return TEAM_LEVELS;
  return [{ name:'Enquête', stars:0, fams:FAMILIES.map(f => f.id), fakes:ALL_FAKES, lives:3, time:DURATIONS[state.durIdx] * 60 }];
}
const multi = () => state.levels.length > 1;
const lvl = () => state.levels[state.lvl];
const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const starsHtml = n => '★'.repeat(n) + '<span style="opacity:.3">' + '★'.repeat(3 - n) + '</span>';
/** Petite fiche « niveau » (lobby et transitions) */
function levelCard(L, i) {
  const n = L.fams.length + L.fakes.length;
  return `<div class="lvcard"><span class="lvstars">${starsHtml(L.stars)}</span>
    <b>Niveau ${i + 1} · ${L.name}</b><span>${n} pistes · ${'♥'.repeat(L.lives)} · ${fmtTime(L.time)}</span></div>`;
}

/* =====================================================================
   F. ÉTAPE 1 : LIRE (lobby avec le code)
   ===================================================================== */
function startGame() {
  renderSettings();
  const seed = 100 + Math.floor(Math.random() * 900);
  state.code = makeCode(state.nb, state.disIdx, seed);
  state.players = deal(state.nb, seed);
  state.allTiles = buildTiles(DISEASE);
  state.levels = levelsFor();
  state.lvl = 0; state.foundIds = new Set(); state.errors = 0; state.livesKept = 0; state.timeBank = 0; state.log = [];
  state.picked = null; state.over = false;
  prepareLevel(); stopTimer(); renderHud();
  if (solo()) { startWall(); return; }
  renderLobby(); show('lobby');
}

/** Prépare les tuiles, les vies et le temps du niveau courant */
function prepareLevel() {
  const L = lvl(), keep = [...L.fams, ...L.fakes];
  state.tiles = shuffle(state.allTiles.filter(t => keep.includes(t.id))).map(t => ({ ...t, done: false }));
  state.lives = L.lives; state.levelFound = 0; state.timeLeft = L.time;
}

/** Les 3 règles (la 3e change selon le mode) */
function rulesHtml() {
  return `<ol class="rules3" style="color:inherit">
    <li>Trouvez les vraies causes sur le mur.</li>
    <li>Chacun a des indices secrets. Ne les montrez pas : parlez !</li>
    <li>${multi() ? '3 niveaux : toujours plus de fausses pistes, toujours moins de vies.' : "3 erreurs et l'enquête est perdue."}</li></ol>`;
}

/** Lien direct vers l'écran « Rejoindre » avec le code pré-rempli */
function joinLink() {
  const extra = state.disIdx === DISEASES.length && state.customName ? '-' + encodeURIComponent(state.customName) : '';
  return location.href.split('#')[0] + '#' + state.code + extra;
}

function renderLobby() {
  const isFile = location.protocol === 'file:';
  $('s-lobby').innerHTML = `
    <div class="lobby">
      <div class="glass">
        <h3>${icon('phone', 16)} Prenez vos téléphones</h3>
        <div>Code de la partie</div>
        <div class="bigcode" aria-label="Code ${state.code}">${[...state.code].map(d => `<span>${d}</span>`).join('')}</div>
        <ol class="how">
          <li>Ouvrez cette page sur votre téléphone.</li>
          <li>Touchez « Rejoindre avec mon téléphone ».</li>
          <li>Entrez le code, puis votre numéro de joueur.</li>
        </ol>
        <div class="link-box">${esc(joinLink())}</div>
        ${isFile ? `<p class="small" style="color:#ffc27a;margin-top:10px">⚠ Cette page est ouverte depuis un fichier de l'ordinateur :
          les téléphones ne peuvent pas ouvrir ce lien. Mettez le dossier en ligne pour le partager.</p>` : ''}
        <p class="small" style="margin-top:12px;color:#c8dcd8">Numéros des joueurs :</p>
        <div class="roster">
          ${state.players.map((p, i) => `<div class="roster-row"><span class="pnum">${i + 1}</span>${p.roles.map(roleBadge).join('')}</div>`).join('')}
        </div>
      </div>
      <div class="glass">
        ${state.teamName ? `<span class="teamtag">Équipe « ${esc(state.teamName)} »</span>` : ''}
        <h3>Enquête sur ${esc(DISEASE.title)}</h3>
        ${rulesHtml()}
        ${multi() ? `<div class="lvlist">${state.levels.map(levelCard).join('')}</div>`
                  : `<p class="hand" style="color:#ffd9a0;font-size:1.05rem">Lisez vos indices en silence… puis c'est parti pour ${fmtTime(lvl().time)} !</p>`}
        <button class="btn btn-go" id="goWall" style="margin-top:8px">Tout le monde a lu : enquêtons ! ${icon('arrow')}</button>
      </div>
    </div>`;
  $('goWall').onclick = startWall;
}

/* =====================================================================
   G. ÉTAPE 2 : ENQUÊTER (le mur)
   ===================================================================== */
function renderHud() {
  // Sur téléphone, seul le niveau reste visible (le code est masqué par css/mobile.css)
  const base = solo() ? `${icon('target', 15)} <span class="cc-code">Solo${multi() ? ' ·' : ''}</span>`
                      : `${icon('phone', 15)} <span class="cc-code">Code ${state.code}${multi() ? ' ·' : ''}</span>`;
  $('codeChip').innerHTML = base + (multi() ? ` <span>Niv. ${state.lvl + 1}/${state.levels.length}</span>` : '');
  $('livesChip').innerHTML = '♥'.repeat(state.lives) + `<span class="lost">${'♥'.repeat(lvl().lives - state.lives)}</span>`;
  // Objectif : 6 cases qui prennent la couleur de chaque famille trouvée
  $('scoreChip').innerHTML = `<span class="slots">${FAMILIES.map(f =>
    `<i title="${f.name}" style="--f:${f.color}" class="${state.foundIds.has(f.id) ? 'on' : ''}"></i>`).join('')}</span>
    <b>${state.foundIds.size}/${GOAL}</b>`;
}

/** Journal d'enquête : une ligne par piste validée */
function logHtml() {
  if (!state.log.length) return `<li class="empty">Aucune piste validée pour l'instant.<br>Parlez, puis touchez une piste.</li>`;
  return state.log.slice().reverse().map(e => `<li class="${e.ok ? 'ok' : 'ko'}" style="--f:${e.color}">
    <span class="lt">${e.when}</span><span class="li">${e.ok ? '✓' : '✕'}</span>
    <span class="lx"><b>${e.text}</b>${e.detail}</span></li>`).join('');
}
function logEntry(t) {
  const L = lvl(), used = L.time - state.timeLeft;
  state.log.push({ ok: t.ok, text: t.text, color: t.ok ? t.family.color : '#7a6a5a',
    detail: t.ok ? t.family.name : 'Fausse piste', when: (multi() ? `N${state.lvl + 1} · ` : '') + fmtTime(used) });
  const box = $('caseLog'); if (box) box.innerHTML = logHtml();
}

function startWall() {
  const L = lvl();
  state.over = false; state.picked = null;
  $('s-wall').innerHTML = `
    <div id="result"></div>
    ${multi() ? `<div class="lvbanner"><span class="lvstars">${starsHtml(L.stars)}</span>
      <b>Niveau ${state.lvl + 1} · ${L.name}</b><span>Trouvez ${L.fams.length} vraies causes parmi ${state.tiles.length} pistes</span></div>` : ''}
    <div class="wall-layout">
    <div class="wall" id="wall">
      <svg class="threads" id="threads" aria-hidden="true"></svg>
      <!-- Le cœur du mur : l'écran SIG. Chaque cause trouvée y allume une couche. -->
      <div class="core sig" id="core">
        <div class="sigbar"><i></i><i></i><i></i>SIG · Rhône (69)<b>${esc(DISEASE.name)}</b></div>
        <div class="sigmap">${sigMap('g')}</div>
        <div class="sigleg">${FAMILIES.map(f => `<span data-l="${f.id}" style="--f:${f.color}">${f.name}</span>`).join('')}</div>
        <div class="ask" id="coreAsk">Pourquoi le nord du Rhône est-il si touché ?</div>
      </div>
      ${state.tiles.map((t, i) => `<button class="tile" data-id="${t.id}"><span class="tn">Piste ${String(i + 1).padStart(2, '0')}</span>
        <span class="tx">${t.text}</span><span class="sub"></span></button>`).join('')}
    </div>
    <!-- Journal d'enquête -->
    <aside class="caselog glass">
      <h3>${icon('clipboard', 15)} Journal d'enquête</h3>
      <div class="cl-head"><span>Dossier ${solo() ? 'solo' : state.code}</span><span>${esc(DISEASE.name)}</span></div>
      <ol id="caseLog">${logHtml()}</ol>
      <div class="cl-rule"><b>Règle</b>1 toucher = choisir · 2 touchers = valider</div>
    </aside>
    </div>
    <p class="wall-help" id="wallHelp">Touchez une piste pour la choisir, touchez-la encore pour valider.</p>
    ${solo() ? `<div class="glass" style="margin-top:24px"><h3>Vos indices</h3><div class="solo-clues">
      ${ROLES.map(r => `<div style="--c:${COLORS[r.color]}"><b>${r.name}</b>${clueFor(DISEASE, r.id)}</div>`).join('')}</div></div>` : ''}`;
  // Les couches trouvées aux niveaux précédents restent allumées
  state.foundIds.forEach(id => setLayer($('core'), id, true));
  $('wall').addEventListener('click', e => { const b = e.target.closest('.tile'); if (b) clickTile(b.dataset.id); });
  show('wall'); renderHud(); renderTimer();
  // Compte à rebours, puis le chronomètre démarre
  state.over = true;
  const label = multi() ? `Niveau ${state.lvl + 1} · ${L.name}` : `Enquête sur ${esc(DISEASE.title)}`;
  const sub = `${multi() ? '★'.repeat(L.stars) + ' · ' : ''}${state.tiles.length} pistes · ${'♥'.repeat(L.lives)}`;
  countdown(label, sub, () => { state.over = false; startTimer(); });
}

const tileEl = id => document.querySelector(`.tile[data-id="${id}"]`);

/** 1er toucher = sélection, 2e toucher = validation */
function clickTile(id) {
  const t = state.tiles.find(x => x.id === id);
  if (state.over || !t || t.done) return;
  document.querySelectorAll('.tile.pick').forEach(el => el.classList.remove('pick'));
  if (state.picked !== id) { state.picked = id; tileEl(id).classList.add('pick'); sfx('click'); return; }

  state.picked = null; t.done = true;
  const el = tileEl(id); el.classList.add('done');
  if (t.ok) {                                   // vraie cause : un fil rouge
    state.foundIds.add(id); state.levelFound++;
    el.classList.add('ok'); el.style.setProperty('--f', t.family.color);
    el.querySelector('.sub').textContent = t.family.name;
    setLayer($('core'), id, true);              // … et une couche s'allume sur la carte
    $('coreAsk').textContent = `Couche « ${SIG_LABELS[id]} » : ${state.foundIds.size} sur ${GOAL}`;
    drawThreads(id);
    toast(`Vraie cause : ${t.family.name}`, 'ok');
    sfx('ok'); burst(el, t.family.color);
  } else {                                      // fausse piste : une vie en moins
    state.lives--; state.errors++;
    el.classList.add('ko');
    el.querySelector('.sub').textContent = t.why;
    toast('Fausse piste ! ' + t.why, 'ko');
    sfx('ko');
    document.body.classList.remove('hit'); void document.body.offsetWidth; document.body.classList.add('hit');
  }
  logEntry(t);
  renderHud();
  if (state.levelFound === lvl().fams.length) setTimeout(() => endLevel('win'), 900);
  else if (state.lives === 0) setTimeout(() => endLevel('lost'), 900);
}

/** Dessine les fils entre les causes trouvées et la maladie.
 *  animateId : la tuile dont le fil vient d'être tiré (animation). */
function drawThreads(animateId) {
  const wall = $('wall'); if (!wall) return;
  const W = wall.getBoundingClientRect();
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - W.left, r.top + r.height / 2 - W.top]; };
  const [cx, cy] = center($('core'));
  let svg = '';
  state.tiles.filter(t => t.ok && (t.done || state.over)).forEach(t => {
    const [x, y] = center(tileEl(t.id));
    const len = Math.ceil(Math.hypot(cx - x, cy - y));
    const cls = !t.done ? 'th ghost' : t.id === animateId ? 'th new' : 'th';
    svg += `<line class="${cls}" style="--len:${len}" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
  });
  $('threads').innerHTML = svg;
}

/** Fin d'un niveau : révèle le mur, puis passe au niveau suivant ou au résultat final */
function endLevel(reason) {
  if (state.over) return;
  state.over = true; state.picked = null; stopTimer();
  state.livesKept += state.lives; state.timeBank += state.timeLeft;
  $('wall').classList.add('over');
  $('wallHelp').classList.add('hidden');
  document.querySelectorAll('.tile.pick').forEach(el => el.classList.remove('pick'));
  state.tiles.filter(t => !t.done).forEach(t => {
    const el = tileEl(t.id);
    if (t.ok) { el.classList.add('missed'); el.style.setProperty('--f', t.family.color); el.querySelector('.sub').textContent = t.family.name + ' (manquée)'; }
    else el.classList.add('dim');
  });
  drawThreads();
  if (state.lvl < state.levels.length - 1) showInterlude(reason); else finish(reason);
}

/** Écran de transition entre deux niveaux */
function showInterlude(reason) {
  const L = lvl(), next = state.levels[state.lvl + 1];
  const title = reason === 'win' ? `Niveau ${state.lvl + 1} réussi !` : reason === 'lost' ? 'Plus de vies pour ce niveau…' : 'Temps écoulé pour ce niveau…';
  const lit = L.fams.filter(id => state.foundIds.has(id));
  $('result').innerHTML = `
    <div class="paper pin result">
      <div class="kicker">${title}</div>
      <h2>${lit.length} couche${lit.length > 1 ? 's' : ''} sur ${L.fams.length} allumée${lit.length > 1 ? 's' : ''} sur la carte</h2>
      <p>${L.fams.map(id => { const f = FAMILIES.find(x => x.id === id);
        return `<span class="rb" style="--c:${f.color};background:rgba(0,0,0,.08);margin:3px"><i>${state.foundIds.has(id) ? '✔' : '✘'}</i>${f.name}</span>`; }).join('')}</p>
      <p class="bigline">Attention : ça se corse !</p>
      <div class="lvlist" style="max-width:420px;margin:0 auto">${levelCard(next, state.lvl + 1)}</div>
      <p class="small">Plus de fausses pistes, moins de vies, moins de temps. Relisez bien vos indices.</p>
      <div class="center-actions"><button class="btn btn-red" id="nextLvl">Niveau ${state.lvl + 2} ${icon('arrow')}</button></div>
    </div>`;
  $('nextLvl').onclick = () => { state.lvl++; prepareLevel(); startWall(); };
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(drawThreads, 500);
  if (reason === 'win') confetti();
  sfx(reason === 'win' ? 'level' : 'lose');
}

/* =====================================================================
   H. ÉTAPE 3 : RÉVÉLER
   ===================================================================== */
function finish(reason) {
  // Carte : toutes les couches se superposent, le nord ressort
  FAMILIES.forEach(fa => setLayer($('core'), fa.id, true));
  setLayer($('core'), 'hot', true);
  $('coreAsk').textContent = 'Six couches, une seule carte : tout se superpose au nord du Rhône.';

  const f = state.foundIds.size, win = f === GOAL;
  const rank = win && state.errors === 0 ? "Enquêteurs d'élite" : win ? 'Fins limiers' : f >= 4 ? 'Sur la bonne piste' : 'Enquête à rouvrir';
  const status = multi() ? 'Les 3 niveaux sont terminés !'
    : reason === 'win' ? 'Toutes les causes sont trouvées !' : reason === 'lost' ? "Trois erreurs : l'enquête s'arrête." : 'Temps écoulé !';
  const legend = FAMILIES.map(fa => {
    const t = state.allTiles.find(x => x.id === fa.id), ok = state.foundIds.has(fa.id);
    return `<div style="--f:${fa.color}" class="${ok ? '' : 'miss'}"><span>${ok ? '✔' : '✘'}</span>
      <span><b>${fa.name}</b> : ${t.text}<br><span class="small">Indice du rôle « ${roleById(fa.role).name} »</span></span></div>`;
  }).join('');
  const maxLives = state.levels.reduce((s, L) => s + L.lives, 0);
  $('result').innerHTML = `
    <div class="paper pin result">
      <div class="kicker">${status}</div>
      <h2>6 causes. 6 regards. 1 maladie.</h2>
      <div class="rank">${rank}</div>
      <div class="bigslots">${FAMILIES.map(fa => `<i title="${fa.name}" style="--f:${fa.color}" class="${state.foundIds.has(fa.id) ? 'on' : ''}"></i>`).join('')}</div>
      <p>${state.teamName ? `Équipe « ${esc(state.teamName)} » · ` : ''}<b>${f} fil${f > 1 ? 's' : ''} sur ${GOAL}</b>
        · ${state.livesKept} vie${state.livesKept > 1 ? 's' : ''} gardée${state.livesKept > 1 ? 's' : ''} sur ${maxLives}
        · ${state.timeBank} s d'avance</p>
      ${state.mode === 'team' ? `<p class="small">Annoncez ce score aux autres équipes : le plus de fils gagne, puis le plus de vies gardées, puis le plus d'avance.</p>` : ''}
      <div class="legend">${legend}</div>
      <p class="bigline">Chaque regard a allumé une couche. Personne n'avait la carte complète seul.</p>
      <ol class="qs">
        <li>Quelle piste auriez-vous choisie sans les autres ?</li>
        <li>Quel indice vous a le plus surpris ?</li>
      </ol>
      <div class="center-actions">
        <button class="btn btn-red" id="again">${icon('restart')} Rejouer</button>
        <button class="btn btn-ink" id="toHome">${icon('home')} Accueil</button>
      </div>
    </div>`;
  $('again').onclick = startGame;
  $('toHome').onclick = () => show('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(drawThreads, 500);            // le panneau décale le mur : on retrace les fils
  if (win) confetti();
  sfx(win ? 'win' : 'lose');
}

function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#e0362b', '#ffb02e', '#2dd4bf', '#3b8fe6', '#b46be0', '#3aa66a'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    c.style.animationDelay = Math.random() * .8 + 's';
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 6000);
}

/* =====================================================================
   I. CHRONOMÈTRE
   ===================================================================== */
function startTimer() {
  clearInterval(state.timerId); state.running = true;
  state.timerId = setInterval(() => {
    if (state.timeLeft > 0) state.timeLeft--;
    renderTimer();
    if (state.timeLeft > 0 && state.timeLeft <= 5) sfx('tick');     // les 5 dernières secondes
    if (state.timeLeft === hurryAt()) toast(hurryAt() === 60 ? 'Plus qu\'une minute !' : 'Plus que 20 secondes !');
    if (state.timeLeft === 0) endLevel('time');
  }, 1000);
  renderTimer();
}
/** Seuil d'alerte : 20 s pour les niveaux courts, 1 min sinon */
const hurryAt = () => (state.levels.length && lvl().time <= 120 ? 20 : 60);
function stopTimer() { clearInterval(state.timerId); state.running = false; renderTimer(); }
function renderTimer() {
  const t = state.timeLeft;
  $('timerTxt').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  $('timerChip').classList.toggle('hurry', state.running && t <= hurryAt());
  $('timerBtn').innerHTML = icon(state.running ? 'pause' : 'play', 13);
  // Barre de temps sous l'en-tête
  const total = state.levels.length ? lvl().time : t || 1;
  $('timeFill').style.width = Math.max(0, Math.min(100, t / total * 100)) + '%';
  $('timeFill').classList.toggle('hurry', t <= hurryAt());
}

/* =====================================================================
   J. TÉLÉPHONE DU JOUEUR : rejoindre, puis lire son indice
   ===================================================================== */
function renderJoin(prefill = '', name = '') {
  $('s-join').innerHTML = `
    <div class="phone">
      <div class="glass">
        <h3>${icon('phone', 18)} Rejoindre l'enquête</h3>
        <p>Entrez le code affiché sur le grand écran :</p>
        <input class="codein" id="codeIn" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="00000" value="${esc(prefill)}">
        <div class="msg" id="codeMsg"></div>
        <div id="numZone"></div>
        <button class="btn btn-line" id="backHome" style="width:100%;margin-top:14px">${icon('home', 16)} Retour à l'accueil</button>
      </div>
    </div>`;
  const inp = $('codeIn');
  const check = () => {
    inp.value = inp.value.replace(/\D/g, '').slice(0, 5);
    const g = parseCode(inp.value);
    $('codeMsg').textContent = inp.value.length === 5 && !g ? 'Code invalide, vérifiez-le.' : '';
    const custom = g && g.dis === DISEASES.length;
    $('numZone').innerHTML = g ? `
      ${custom && !name ? `<input type="text" id="joinName" maxlength="40" placeholder="Nom de la maladie (facultatif)"
        style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--glass-line);background:rgba(0,0,0,.3);color:#e6f2ef;font:inherit">` : ''}
      <p style="margin-top:8px">Votre numéro de joueur ?</p>
      <div class="numgrid">${Array.from({ length: g.nb }, (_, i) => `<button data-n="${i + 1}">${i + 1}</button>`).join('')}</div>` : '';
    $('numZone').querySelectorAll('[data-n]').forEach(b => b.onclick = () =>
      openPlayer(inp.value, +b.dataset.n, name || ($('joinName') ? $('joinName').value.trim() : '')));
  };
  inp.oninput = check; check();
  $('backHome').onclick = () => { history.replaceState(null, '', location.pathname); show('home'); };
  show('join');
  if (!prefill) setTimeout(() => inp.focus(), 300);
}

function openPlayer(code, n, name = '') {
  const g = parseCode(code); if (!g || n < 1 || n > g.nb) return renderJoin(code, name);
  const P = diseaseFor(g.dis, name);
  const me = deal(g.nb, g.seed)[n - 1];
  store.set('fr-player', `${code}:${n}:${encodeURIComponent(name)}`);
  const many = me.roles.length > 1;
  $('s-player').innerHTML = `
    <div class="phone">
      <div class="phone-head">
        <span class="chip code">${icon('phone', 14)} Partie ${code} · Joueur ${n}</span>
        <div class="secret">${many ? `Vos ${me.roles.length} indices secrets` : 'Votre indice secret'}</div>
        <div class="small" style="color:#c8dcd8">Enquête sur ${esc(P.title)} · Rhône</div>
      </div>
      ${me.roles.map((id, i) => { const r = roleById(id); return `
        <article class="paper clue dossier" style="--c:${COLORS[r.color]}">
          <header class="d-head"><span>Dossier confidentiel</span><span>N° ${code}-${n}${many ? '.' + (i + 1) : ''}</span></header>
          <span class="d-stamp">Secret</span>
          <div class="d-role"><i>${icon(r.icon, 26)}</i><div><small>Votre regard</small><b>${r.name}</b></div></div>
          <p>« ${clueFor(P, id)} »</p>
          <div class="d-hold">${icon('finger', 16)} Maintenez le doigt pour lire</div>
          <footer class="d-foot">Cet indice confirme une vraie cause… ou démonte une fausse piste.</footer>
        </article>`; }).join('')}
      <div class="glass" style="text-align:center">
        <b style="font-size:1.15rem">Ne montrez pas votre écran. Parlez !</b>
        <p class="small" style="margin:8px 0 0;color:#c8dcd8">Gardez le doigt sur une carte pour lire votre indice : il se cache dès que vous lâchez.</p>
      </div>
      <button class="btn btn-line" id="leave" style="width:100%;margin-top:18px">Changer de partie ou de joueur</button>
    </div>`;
  $('leave').onclick = () => { store.del('fr-player'); renderJoin(code, name); };
  // Indice flouté : on le lit en gardant le doigt (ou la souris) appuyé dessus
  document.querySelectorAll('#s-player .dossier').forEach(d => {
    d.tabIndex = 0; d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Maintenir pour lire l\'indice');
    const on = () => { d.classList.add('peek'); sfx('peek'); };
    const off = () => d.classList.remove('peek');
    d.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(t => d.addEventListener(t, off));
    d.addEventListener('contextmenu', e => e.preventDefault());
    d.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); d.classList.toggle('peek'); } });
  });
  show('player');
}

/* =====================================================================
   K. INITIALISATION
   ===================================================================== */
function init() {
  $('logoIc').innerHTML = icon('flask', 18);
  $('timerIc').innerHTML = icon('clock', 15);
  $('badgeIc').innerHTML = icon('users', 20);
  $('icPlayers').innerHTML = icon('users', 18);
  $('icClock').innerHTML = icon('clock', 18);
  $('icDisease').innerHTML = icon('activity', 18);
  $('startBtn').innerHTML = `${icon('finger', 22)} Lancer l'enquête ${icon('arrow')}`;
  $('joinBtn').innerHTML = `${icon('phone', 18)} Rejoindre avec mon téléphone`;
  renderHome();

  document.querySelectorAll('#modeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('teamName').oninput = renderSettings;
  $('pMinus').onclick = () => { state.nb = Math.max(MODES[state.mode].min, state.nb - 1); renderSettings(); };
  $('pPlus').onclick = () => { state.nb = Math.min(MODES[state.mode].max, state.nb + 1); renderSettings(); };
  $('dMinus').onclick = () => { state.durIdx = Math.max(0, state.durIdx - 1); renderSettings(); };
  $('dPlus').onclick = () => { state.durIdx = Math.min(DURATIONS.length - 1, state.durIdx + 1); renderSettings(); };
  const nDis = DISEASES.length + 1;               // 6 maladies + « Autre maladie »
  $('mMinus').onclick = () => { state.disIdx = (state.disIdx + nDis - 1) % nDis; renderSettings(); };
  $('mPlus').onclick = () => { state.disIdx = (state.disIdx + 1) % nDis; renderSettings(); };
  $('customName').oninput = renderSettings;
  $('startBtn').onclick = startGame;
  $('joinBtn').onclick = () => renderJoin();
  $('qjBtn').innerHTML = `${icon('phone', 20)} J'ai un code : rejoindre`;
  $('qjBtn').onclick = () => renderJoin();
  $('timerBtn').onclick = () => { if (!state.over && !$('s-wall').classList.contains('hidden')) state.running ? stopTimer() : startTimer(); };
  $('folders').addEventListener('click', e => {
    const b = e.target.closest('[data-folder]'); if (!b) return;
    const f = FOLDERS.find(x => x.key === b.dataset.folder);
    openModal(`<h3>${f.title}</h3>${f.body()}<div class="center-actions"><button class="btn btn-ink" data-close>Fermer</button></div>`);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('resize', () => drawThreads());     // les fils suivent les tuiles

  // Arrivée par un lien "…#12345" (ou "#62345-Nom") : écran Rejoindre pré-rempli
  const [hc, hn] = location.hash.slice(1).split('-');
  if (parseCode(hc)) { renderJoin(hc, hn ? decodeURIComponent(hn) : ''); return; }
  // Téléphone déjà inscrit (page rechargée) : on retrouve son indice
  const saved = store.get('fr-player');
  if (saved) { const [c, n, nm] = saved.split(':'); if (parseCode(c)) { openPlayer(c, +n, decodeURIComponent(nm || '')); return; } }
}
init();
