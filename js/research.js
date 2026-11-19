/* =====================================================================
   LA RECHERCHE COLLABORATIVE
   1. Réunion d'équipe (tour de table) avant de commencer : chaque joueur
      présente sa discipline, sa méthode et l'idée de son indice, à l'oral.
   2. Le bilan devient un ARTICLE DE RECHERCHE co-signé par toutes les
      disciplines : personne ne publie seul.
   ===================================================================== */

/* La méthode de recherche que chaque discipline apporte */
const METHODS = {
  geo:  'cartographie et analyse spatiale (SIG)',
  soc:  'entretiens qualitatifs auprès des habitants',
  epi:  'suivi d\'une cohorte et calcul des taux de maladie',
  sp:   'évaluation des actions de prévention',
  inf:  'observation de terrain et consultations',
  stat: 'modèles statistiques et tests',
  dm:   'collecte, nettoyage et qualité des données',
  clin: 'analyse des dossiers médicaux',
  dec:  'analyse des politiques publiques et des budgets',
  pat:  'savoir expérientiel des patients (recherche participative)'
};
const MEET_TIME = 25;                         // secondes de parole par joueur

/** Tour de table plein écran, puis done() */
function teamMeeting(done) {
  if (solo() || state.lvl > 0) { done(); return; }
  const steps = state.players.map((p, i) => ({ n: i + 1, roles: p.roles }));
  let k = 0, left = MEET_TIME, timer = null;
  const o = document.createElement('div'); o.className = 'meet'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
  document.body.appendChild(o);
  const close = () => { clearInterval(timer); o.remove(); done(); };
  const paint = () => {
    if (k >= steps.length) {                  // dernière étape : la question de recherche commune
      clearInterval(timer);
      o.innerHTML = `<div class="meet-box">
        <div class="meet-kick">${icon('flask', 16)} Réunion d'équipe · conclusion</div>
        <div class="meet-q-lbl">Votre question de recherche commune</div>
        <div class="meet-q">« ${askFor()} »</div>
        <p class="meet-p">${steps.length} chercheur·es, ${ROLES.length} disciplines, une seule question.
          Les hypothèses sont au mur : à vous de les tester <b>ensemble</b>.</p>
        <div class="meet-act"><button class="btn btn-go" id="meetGo">${icon('flask', 20)} Lancer la recherche</button></div>
      </div>`;
      o.querySelector('#meetGo').onclick = close;
      sfx('level');
      return;
    }
    const s = steps[k];
    o.innerHTML = `<div class="meet-box">
      <div class="meet-kick">${icon('users', 16)} Réunion d'équipe · tour de table <span>${k + 1} / ${steps.length}</span></div>
      <div class="meet-who">Joueur ${s.n}</div>
      <div class="meet-roles">${s.roles.map(id => { const r = roleById(id);
        return `<div class="meet-role" style="--c:${COLORS[r.color]}"><i>${icon(r.icon, 26)}</i><b>${r.name}</b><small>Méthode : ${METHODS[id]}</small></div>`; }).join('')}</div>
      <p class="meet-p">À vous la parole ! En une ou deux phrases :<br>
        <b>qui vous êtes</b>, <b>ce que votre discipline apporte</b>, et <b>l'idée</b> de votre indice, <u>sans montrer votre écran</u>.</p>
      <div class="meet-bar"><b id="meetFill"></b></div>
      <div class="meet-act">
        <button class="btn btn-line" id="meetSkip">Passer la réunion</button>
        <button class="btn btn-red" id="meetNext">${k + 1 < steps.length ? 'Au suivant' : 'Conclure'} ${icon('arrow')}</button>
      </div>
    </div>`;
    o.querySelector('#meetNext').onclick = () => { k++; left = MEET_TIME; sfx('click'); paint(); };
    o.querySelector('#meetSkip').onclick = close;
    fill();
  };
  const fill = () => { const f = o.querySelector('#meetFill'); if (f) f.style.width = (left / MEET_TIME * 100) + '%'; };
  timer = setInterval(() => {
    if (k >= steps.length) return;
    left--; fill();
    if (left <= 3 && left > 0) sfx('tick');
    if (left <= 0) { k++; left = MEET_TIME; paint(); }
  }, 1000);
  paint();
}

/** Le bilan sous forme d'article de recherche co-signé */
function articleHtml() {
  const found = FAMILIES.filter(f => state.foundIds.has(f.id));
  const rumors = state.scen.clues.filter(c => c.kind === 'rumor').length;
  const authors = solo() ? ['Chercheur·e (toutes disciplines)']
    : state.players.map((p, i) => `Joueur ${i + 1}<sup>${p.roles.map(id => ROLES.indexOf(roleById(id)) + 1).sort((a, b) => a - b).join(',')}</sup>`);
  const affil = ROLES.map((r, i) => `<sup>${i + 1}</sup>${r.short}`).join(' · ');
  const methods = shuffle(Object.keys(METHODS), rng(state.scen.seed)).slice(0, 4).map(id => METHODS[id]);
  const year = new Date().getFullYear();
  return `<article class="article">
    <header class="ar-head"><span>Revue Fil Rouge · Recherche interdisciplinaire en santé</span><span>Centre Léon Bérard · ${year}</span></header>
    <h3 class="ar-title">Pourquoi le nord du Rhône est-il plus touché par ${esc(DISEASE.title)} ? Une approche interdisciplinaire</h3>
    <div class="ar-auth">${state.teamName ? `<b>Équipe « ${esc(state.teamName)} »</b> · ` : ''}${authors.join(', ')}</div>
    <div class="ar-affil">${affil}</div>
    <div class="ar-abs">
      <p><b>Contexte.</b> Dans le nord du Rhône, ${esc(DISEASE.title)} touche davantage d'habitants qu'autour de Lyon.</p>
      <p><b>Méthode.</b> Étude réunissant ${ROLES.length} disciplines, des sciences humaines et sociales à la clinique, qui ont croisé leurs regards :
        ${methods.join(' ; ')}. Chaque hypothèse a été discutée collectivement avant d'être testée.</p>
      <p><b>Résultats.</b> ${found.length} hypothèse${found.length > 1 ? 's' : ''} sur ${GOAL} confirmée${found.length > 1 ? 's' : ''}${found.length ? ' : ' + found.map(f => f.name.toLowerCase()).join(', ') : ''}.
        ${state.errors} hypothèse${state.errors > 1 ? 's' : ''} réfutée${state.errors > 1 ? 's' : ''}${rumors ? `, ${rumors} rumeur${rumors > 1 ? 's' : ''} à écarter` : ''}.
        Aucune discipline, seule, ne détenait l'explication.</p>
      ${state.enigRes ? `<p><b>Recommandation.</b> ${state.enigRes.ok ? 'Installer' : 'Étudier l\'installation d\''} une antenne mobile de dépistage
        dans le territoire <b>${state.enigRes.name}</b>, choisi en croisant ${state.enigRes.conds} critères apportés par l'équipe.</p>` : ''}
      <p><b>Conclusion.</b> Les causes de la maladie sont sociales, territoriales et politiques autant que médicales :
        les comprendre exige une recherche <b>interdisciplinaire et collaborative</b>.</p>
    </div>
    <div class="ar-kw"><b>Mots-clés :</b> interdisciplinarité · inégalités territoriales de santé · SIG · recherche participative</div>
    <footer class="ar-foot">Article fictif généré par le jeu · données inventées · contributions : tous les auteurs ont participé à part égale.</footer>
  </article>`;
}
