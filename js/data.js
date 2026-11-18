/* Données du jeu « Fil Rouge » : disciplines, familles de causes, maladies */

/* =====================================================================
   B. DONNÉES
   ===================================================================== */
const COLORS = { blue:'#2f7fd8', green:'#2f9a5e', orange:'#e07b22' };

/* Les 10 disciplines (chacune détient UN indice) */
const ROLES = [
  { id:'geo',  name:'Géographe',                     short:'Géographie',       icon:'map',       color:'green'  },
  { id:'soc',  name:'Sociologue',                    short:'Sociologie',       icon:'users',     color:'orange' },
  { id:'epi',  name:'Épidémiologiste',               short:'Épidémiologie',    icon:'activity',  color:'blue'   },
  { id:'sp',   name:'Chercheur·e en santé publique', short:'Santé publique',   icon:'shield',    color:'green'  },
  { id:'inf',  name:'Infirmier·ère de recherche',    short:'Soins infirmiers', icon:'clipboard', color:'orange' },
  { id:'stat', name:'Statisticien·ne',               short:'Statistique',      icon:'chart',     color:'blue'   },
  { id:'dm',   name:'Data manager',                  short:'Data management',  icon:'database',  color:'blue'   },
  { id:'clin', name:'Clinicien·ne',                  short:'Clinique',         icon:'stetho',    color:'green'  },
  { id:'dec',  name:'Décideur·e public',             short:'Décision publique',icon:'landmark',  color:'orange' },
  { id:'pat',  name:'Représentant·e des patients',   short:'Patients',         icon:'heart',     color:'orange' }
];
const roleById = id => ROLES.find(r => r.id === id);

/* Les 6 familles de causes : une vraie cause par famille.
   « role » = la discipline dont l'indice mène à cette cause. */
const FAMILIES = [
  { id:'terr', name:'Territoire',           color:'#3aa66a', role:'geo'  },
  { id:'soc',  name:'Social',               color:'#e8892b', role:'epi'  },
  { id:'env',  name:'Environnement',        color:'#22b5a8', role:'stat' },
  { id:'soin', name:'Accès aux soins',      color:'#3b8fe6', role:'inf'  },
  { id:'comp', name:'Comportements',        color:'#b46be0', role:'soc'  },
  { id:'pol',  name:'Politiques publiques', color:'#e0b422', role:'sp'   }
];

/* ---------------------------------------------------------------------
   LES MALADIES
   Pour chaque famille : [ texte de la tuile, indice du joueur ].
   « myth » : [ idée reçue (fausse piste), indice du clinicien qui la démonte ].
   Pour ajouter une maladie : copier un bloc et changer les textes.
   --------------------------------------------------------------------- */
const BASE = {
  terr:["Médecin trop loin",              "Dans le Nord, le premier médecin est à 45 minutes."],
  soc: ["Fins de mois difficiles",        "Les plus touchés ont de petits revenus."],
  env: ["Cadre de vie dégradé",           "Dans les quartiers délaissés : deux fois plus de malades."],
  soin:["Jamais de dépistage",            "Sur le terrain, personne n'a jamais fait de test."],
  comp:["Honte d'en parler",              "Les gens ont honte : ils cachent leur maladie."],
  pol: ["Prévention seulement en ville",  "Les ateliers de prévention n'existent qu'en ville."],
  myth:["C'est dans les gènes",           "Les gènes n'expliquent pas tout : la maladie peut s'éviter."]
};
const mk = (key, label, name, title, over) => ({ key, label, name, title, ...BASE, ...over });

const DISEASES = [
  mk('cancer', 'Cancer', 'CANCER', 'le cancer', {
    terr:["Centre de soins trop loin",     "Dans le Nord, le centre de cancérologie est à plus d'une heure."],
    env: ["Métiers exposés",               "Dans certains métiers exposés : deux fois plus de malades."],
    soin:["Dépistage peu suivi",           "Sur le terrain, peu de gens répondent à l'invitation au dépistage."],
    comp:["Peur du mot « cancer »",        "Le mot fait peur : on préfère ne pas savoir."],
    myth:["C'est dans les gènes",          "Les gènes n'expliquent qu'une petite part des cancers."]
  }),
  mk('diab', 'Diabète', 'DIABÈTE', 'le diabète', {
    env: ["Nulle part où marcher", "Sans parc ni trottoir : deux fois plus de malades."]
  }),
  mk('coeur', 'Cœur et vaisseaux', 'INFARCTUS', "les maladies du cœur", {
    terr:["Urgences trop loin",            "Dans le Nord, l'hôpital est à une heure de route."],
    soc: ["Travail stressant et précaire", "Les plus touchés enchaînent les petits contrats."],
    env: ["Air pollué",                    "Près de la grande route : plus d'infarctus qu'ailleurs."],
    soin:["Tension jamais mesurée",        "Beaucoup n'ont pas vu de soignant depuis des années."],
    comp:["« Ça va passer »",              "Ici, on attend que ça passe avant de consulter."],
    pol: ["Aucune aide pour arrêter de fumer", "Hors de la ville, rien n'aide à arrêter le tabac."],
    myth:["C'est l'âge, on n'y peut rien", "Même âgé, un cœur se protège : rien n'est joué."]
  }),
  mk('bpco', 'BPCO (souffle)', 'BPCO', "la BPCO, maladie du souffle", {
    terr:["Spécialiste trop loin",         "Le premier spécialiste du souffle est à 60 km."],
    soc: ["Métiers dans la poussière",     "Les plus touchés ont travaillé à l'usine ou aux champs."],
    env: ["Logements humides",             "Maisons humides et mal chauffées : plus de malades."],
    soin:["Souffle jamais mesuré",         "Personne ici n'a jamais soufflé dans un appareil."],
    comp:["« C'est juste une toux »",      "Tousser est devenu normal : on n'en parle plus."],
    pol: ["Aucune aide pour arrêter de fumer", "Hors de la ville, rien n'aide à arrêter le tabac."],
    myth:["C'est l'âge, on n'y peut rien", "S'essouffler n'est pas normal, même en vieillissant."]
  }),
  mk('dep', 'Dépression', 'DÉPRESSION', 'la dépression', {
    terr:["Villages isolés",               "Dans le Nord, on passe des jours sans croiser personne."],
    soc: ["Chômage",                       "Les plus touchés ont perdu leur emploi à l'usine."],
    env: ["Plus de lieux pour se retrouver", "Là où le café et la poste ont fermé : plus de malades."],
    soin:["Aucun psychologue",             "Six mois d'attente pour un premier rendez-vous."],
    comp:["Honte d'en parler",             "Ici, dire qu'on va mal est vu comme une faiblesse."],
    pol: ["Écoute seulement en ville",     "Les lieux d'écoute n'existent qu'en ville."],
    myth:["Un manque de volonté",          "C'est une vraie maladie : la volonté ne suffit pas."]
  }),
  mk('rein', 'Reins', 'REINS MALADES', "la maladie des reins", {
    terr:["Laboratoire trop loin",         "Pour une simple prise de sang, il faut faire 40 km."],
    env: ["Pas de produits frais",         "Là où l'on ne trouve que des plats tout prêts : plus de malades."],
    soin:["Jamais de dépistage",           "Personne ici n'a jamais fait de test d'urine."],
    comp:["Médicaments sans avis médical", "On se soigne seul, avec ce qu'il y a dans l'armoire."],
    myth:["C'est l'âge, on n'y peut rien", "Dépistée tôt, la maladie se ralentit à tout âge."]
  }),
  mk('foie', 'Foie', 'FOIE MALADE', "la maladie du foie", {
    terr:["Spécialiste trop loin",         "Le premier spécialiste du foie est à 60 km."],
    env: ["Pas de produits frais",         "Là où l'on ne trouve que des plats tout prêts : plus de malades."],
    soin:["Jamais de dépistage",           "Une simple prise de sang suffirait. Personne ne la propose."],
    comp:["Honte d'en parler",             "On croit que c'est l'alcool, alors on se tait."],
    myth:["Seuls les buveurs sont touchés", "Beaucoup de malades ne boivent pas d'alcool."]
  })
];
/** Scénario générique pour une maladie saisie librement */
function customDisease(name) {
  const n = (name || '').trim();
  return mk('autre', 'Autre maladie', n ? n.toUpperCase() : 'LA MALADIE', n || 'une maladie', {});
}

/* ---------------------------------------------------------------------
   VARIANTES : à chaque partie, le jeu tire au sort une version de chaque
   vraie cause et 5 fausses pistes dans la réserve. Toutes les parties
   sont donc différentes, même avec la même maladie.
   Chaque variante : [ texte de la tuile, indice du joueur ].
   --------------------------------------------------------------------- */
const VARIANTS = {
  terr:[["Pas de bus pour aller consulter",  "Dans le Nord, le bus passe deux fois par jour… quand il passe."],
        ["Déserts médicaux",                 "Trois médecins sont partis à la retraite : aucun n'a été remplacé."]],
  soc: [["Travail de nuit et horaires décalés","Les plus touchés travaillent de nuit ou en horaires décalés."],
        ["Personnes isolées",                "Les plus touchés vivent seuls, loin de leur famille."]],
  env: [["Logements dégradés",               "Dans les logements humides et mal isolés : plus de malades."],
        ["Air pollué",                       "Le long de l'autoroute : plus de malades qu'ailleurs."]],
  soin:[["Rendez-vous trop longs à obtenir",  "Ici, il faut attendre six mois pour voir un spécialiste."],
        ["Soins trop chers",                 "Beaucoup renoncent à se soigner : ça coûte trop cher."]],
  comp:[["Méfiance envers les médecins",     "Ici, on ne fait pas confiance aux blouses blanches."],
        ["« Ça va passer »",                 "Ici, on attend que ça passe avant de consulter."]],
  pol: [["Messages de prévention incompris", "Les brochures de prévention sont écrites dans un langage compliqué."],
        ["Budget prévention en baisse",      "Le budget de la prévention a été divisé par deux en cinq ans."]]
};

/* Réserve de fausses pistes : texte, explication (affichée quand on se trompe),
   indice de démenti (donné à un joueur, ou à personne : il faut alors déduire). */
const FAKE_POOL = [
  { id:'eau',    text:"L'eau du robinet",         why:"Contrôlée depuis 10 ans : rien à signaler.",
    clue:"L'eau est contrôlée depuis 10 ans : rien à signaler." },
  { id:'5g',     text:"L'antenne 5G",             why:"Elle respecte toutes les normes.",
    clue:"L'antenne 5G respecte toutes les normes d'exposition." },
  { id:'eol',    text:"Les éoliennes",            why:"Elles respectent toutes les normes.",
    clue:"Les éoliennes respectent toutes les normes de bruit." },
  { id:'faute',  text:"La faute des malades",     why:"Accuser les malades n'explique rien et n'aide personne.",
    clue:"Accuser les malades n'explique rien et n'aide personne." },
  { id:'hasard', text:"La malchance",             why:"Le hasard ne frappe pas toujours les mêmes villages.",
    clue:"Le hasard ne frappe pas toujours les mêmes villages." },
  { id:'lune',   text:"La pleine lune",           why:"Il y a autant de malades à chaque phase de la lune.",
    clue:"Il y a autant de malades à chaque phase de la lune." },
  { id:'climat', text:"Le climat du Beaujolais",  why:"Même climat dans le village voisin, et bien moins de malades.",
    clue:"Le village voisin a le même climat et bien moins de malades." },
  { id:'ecrans', text:"Les écrans",               why:"On utilise autant les écrans à Lyon : ça n'explique pas l'écart.",
    clue:"On utilise autant les écrans à Lyon qu'au Nord : ça n'explique pas l'écart." },
  { id:'pollen', text:"Les pollens",              why:"Les pollens sont les mêmes dans tout le département.",
    clue:"Les pollens sont les mêmes dans tout le département." },
  { id:'chats',  text:"Les chats errants",        why:"Il y en a autant à Lyon : ça n'explique rien.",
    clue:"Il y a autant de chats errants à Lyon : ça n'explique rien." }
];

/* ---------------------------------------------------------------------
   DIFFICULTÉ (choisie à l'accueil, cachée dans le code de partie :
   graine % 3 = 0 Facile, 1 Normal, 2 Expert)
   - lives : vies en plus ou en moins par niveau (jamais moins d'une)
   - time  : multiplicateur du temps de chaque niveau
   - cost  : secondes perdues pour retourner un indice en solo, par niveau
   - rumors: nombre de rumeurs glissées parmi les indices
   --------------------------------------------------------------------- */
const DIFFS = [
  { name:'Facile', lives: 1, time:1.3,  cost:[0, 0, 0],   rumors:0 },
  { name:'Normal', lives: 0, time:1,    cost:[0, 5, 10],  rumors:3 },
  { name:'Expert', lives:-1, time:.75,  cost:[5, 10, 15], rumors:5 }
];

/* Indices complémentaires : un par famille, venus d'une autre source que la discipline */
const EXTRA = {
  terr:['Témoignage',  "« Pour un simple rendez-vous, je dois poser une journée de congé. »"],
  soc: ['Chiffre',     "Dans les communes les plus touchées, les revenus sont deux fois plus bas qu'à Lyon."],
  env: ['Observation', "Dans les communes les plus touchées, le cadre de vie se dégrade depuis dix ans."],
  soin:['Chiffre',     "Un habitant sur deux n'a vu aucun soignant depuis deux ans."],
  comp:['Témoignage',  "« Ici, ces choses-là, on les garde pour soi. »"],
  pol: ['Document',    "9 actions de prévention sur 10 ont lieu dans la métropole de Lyon."]
};

/* Rumeurs : elles poussent vers les fausses pistes. Rien ne les signale comme fausses :
   c'est aux joueurs de juger la source. */
const RUMORS = {
  eau:   "« L'eau a un drôle de goût depuis quelque temps… »",
  '5g':  "« Depuis qu'ils ont mis l'antenne, tout le monde tombe malade ! »",
  eol:   "« Les éoliennes empêchent de dormir : forcément, ça rend malade. »",
  faute: "« S'ils sont malades, c'est qu'ils ne font pas attention. »",
  hasard:"« C'est le destin, on n'y peut rien. »",
  lune:  "« À chaque pleine lune, les urgences sont pleines ! »",
  climat:"« C'est le climat d'ici, ça use les gens. »",
  ecrans:"« Les jeunes sont tout le temps sur leurs écrans, voilà le problème. »",
  pollen:"« Avec tous ces pollens, comment ne pas tomber malade ? »",
  chats: "« Les chats errants transmettent des maladies, c'est bien connu. »"
};
const RUMOR_SOURCES = ['Réseaux sociaux', 'Un voisin', 'Journal local', 'Bouche-à-oreille', 'Forum en ligne'];

/** Tire le scénario d'une partie (même graine = même scénario sur tous les appareils) */
function buildScenario(P, seed) {
  const rand = rng(seed * 104729 + 17);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const diff = seed % 3;
  // Vraies causes : la version propre à la maladie compte double, puis les variantes
  const causes = {};
  FAMILIES.forEach(f => {
    const opts = [P[f.id], P[f.id], ...VARIANTS[f.id].filter(v => v[0] !== P[f.id][0])];
    causes[f.id] = pick(opts);
  });
  // Fausses pistes : l'idée reçue de la maladie + 5 au hasard dans la réserve
  const myth = { id:'myth', text:P.myth[0], why:P.myth[1], clue:P.myth[1], rumor:`« ${P.myth[0]}, tout le monde le sait. »` };
  const drawn = shuffle(FAKE_POOL, rand).slice(0, 5).map(f => ({ ...f, rumor: RUMORS[f.id] }));
  // 3 fausses pistes ont un démenti (Data manager, Décideur, Patients) ; le Clinicien démonte l'idée reçue.
  // Les 2 dernières n'ont aucun démenti : il faut les écarter par déduction.
  const debunk = { clin: myth, dm: drawn[0], dec: drawn[1], pat: drawn[2] };
  // Ordre pour les niveaux : d'abord les fausses pistes démenties (plus faciles), puis les autres
  const fakes = [...shuffle([myth, drawn[0], drawn[1], drawn[2]], rand), ...shuffle(drawn.slice(3), rand)];
  const famOrder = shuffle(FAMILIES.map(f => f.id), rand);

  /* Tous les indices de la partie */
  const clues = [];
  FAMILIES.forEach(f => clues.push({ role:f.role, kind:'fact', source:roleById(f.role).name, text:causes[f.id][1], target:f.id }));
  Object.entries(debunk).forEach(([role, fk]) => clues.push({ role, kind:'debunk', source:roleById(role).name, text:fk.clue, target:fk.id }));
  // Complémentaires et rumeurs : confiés au hasard aux disciplines
  const holders = shuffle(ROLES.map(r => r.id), rand);
  let h = 0;
  FAMILIES.forEach(f => clues.push({ role:holders[h++ % holders.length], kind:'extra', source:EXTRA[f.id][0], text:EXTRA[f.id][1], target:f.id }));
  // Rumeurs : en priorité sur les fausses pistes sans démenti (les plus piégeuses)
  const rumorTargets = [...drawn.slice(3), ...shuffle([myth, ...drawn.slice(0, 3)], rand)].slice(0, DIFFS[diff].rumors);
  rumorTargets.forEach(fk => clues.push({ role:holders[h++ % holders.length], kind:'rumor', source:pick(RUMOR_SOURCES), text:fk.rumor, target:fk.id }));
  return { seed, diff, causes, fakes, debunk, famOrder, clues: shuffle(clues, rand) };
}

/** Les 12 tuiles du mur : 6 vraies causes + 6 fausses pistes */
function buildTiles(P, S) {
  const trues = FAMILIES.map(f => ({ id:f.id, text:S.causes[f.id][0], ok:true, family:f }));
  const falses = S.fakes.map(t => ({ id:t.id, text:t.text, why:t.why, ok:false }));
  return [...trues, ...falses];
}

/** L'indice secret d'une discipline, pour la maladie P et le scénario S */
function clueFor(P, roleId, S) {
  const fam = FAMILIES.find(f => f.role === roleId);
  if (fam) return S.causes[fam.id][1];
  return S.debunk[roleId].clue;
}

/* Scénario actif */
let DISEASE = DISEASES[0];
function setDisease(P) { DISEASE = P; }
