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

/** Les 12 tuiles du mur : 6 vraies causes + 6 fausses pistes */
function buildTiles(P) {
  const trues = FAMILIES.map(f => ({ id:f.id, text:P[f.id][0], ok:true, family:f }));
  const falses = [
    { id:'eau',    text:"L'eau du robinet",     why:"Contrôlée depuis 10 ans : rien à signaler." },
    { id:'myth',   text:P.myth[0],              why:P.myth[1] },
    { id:'5g',     text:"L'antenne 5G",         why:"Elle respecte toutes les normes." },
    { id:'eol',    text:"Les éoliennes",        why:"Elles respectent toutes les normes." },
    { id:'faute',  text:"La faute des malades", why:"Accuser les malades n'explique rien et n'aide personne." },
    { id:'hasard', text:"La malchance",         why:"Le hasard ne frappe pas toujours les mêmes quartiers." }
  ].map(t => ({ ...t, ok:false }));
  return [...trues, ...falses];
}

/** L'indice secret d'une discipline pour la maladie P */
function clueFor(P, roleId) {
  const fam = FAMILIES.find(f => f.role === roleId);
  if (fam) return P[fam.id][1];
  return { dm:"L'eau est contrôlée depuis 10 ans : rien à signaler.",
           clin:P.myth[1],
           dec:"Antennes et éoliennes respectent toutes les normes.",
           pat:"On fait ce qu'on peut. Nous accuser n'aide personne." }[roleId];
}

/* Scénario actif */
let DISEASE = DISEASES[0];
function setDisease(P) { DISEASE = P; }
