/* =====================================================================
   ÉNIGME FINALE (variante) : « HÔPITAL MYSTÈRE »
   ---------------------------------------------------------------------
   Dans la base de données des établissements de santé, une EMPRISE
   (le contour d'un bâtiment) a perdu son nom. Sans nom, impossible de
   relier les patients de la cohorte à leur hôpital : il faut la retrouver
   (appariement de données, un vrai travail de data management).
   Données réelles : contours des hôpitaux et des 9 arrondissements de
   Lyon (data.grandlyon.com, voir js/hopitaux-data.js).
   Même moteur que la photo mystère : js/photo-enigma.js.
   ===================================================================== */

const HO_EAST = [3, 6, 7, 8];                         // arrondissements à l'est du Rhône
const HO_RINGS = [3, 6, 10];                          // cercles de distance (km)
const hoArr = x => x.arr ? `Lyon ${x.arr}${x.arr === 1 ? 'er' : 'e'}` : 'autre commune';
const hoHa = x => x.ha.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Les indices possibles (vrai/faux), calculés à partir de l'établissement-réponse t */
function hoPredicates(t) {
  const N = t.lat > CLB_AT[1], Ea = t.lon > CLB_AT[0], d = phKm(t);
  const cli = x => /^Clinique/.test(x.n), hop = x => /H[oô]pital/i.test(x.n), sa = x => /Saint|\bSt\b/.test(x.n);
  const east = x => HO_EAST.includes(x.arr), big = x => x.ha >= 2, old = x => x.y < 2005;
  const ring = km => ({ id: 'd' + km, f: x => (phKm(x) < km) === (d < km),
    text: `Il est à ${d < km ? 'moins' : 'plus'} de ${km} km du Centre Léon Bérard (cercles sur la carte).` });
  return [
    { id:'lyon', f: x => !!x.arr === !!t.arr, text: t.arr ? 'Il se trouve dans la ville de Lyon (dans un arrondissement).' : "Il ne se trouve pas dans la ville de Lyon, mais dans une autre commune de la Métropole." },
    t.arr && { id:'par', f: x => x.arr > 0 && x.arr % 2 === t.arr % 2, text: `Il est dans un arrondissement de Lyon au numéro ${t.arr % 2 ? 'impair' : 'pair'}.` },
    t.arr && { id:'rive', f: x => x.arr > 0 && east(x) === east(t), text: east(t) ? "Il est dans un arrondissement de Lyon à l'est du Rhône (3e, 6e, 7e ou 8e)." : "Il est dans un arrondissement de Lyon à l'ouest du Rhône (1er, 2e, 4e, 5e ou 9e)." },
    { id:'ns',   f: x => (x.lat > CLB_AT[1]) === N, text: `Il est au ${N ? 'nord' : 'sud'} du Centre Léon Bérard.` },
    { id:'ew',   f: x => (x.lon > CLB_AT[0]) === Ea, text: `Il est à l'${Ea ? 'est' : 'ouest'} du Centre Léon Bérard.` },
    ring(3), ring(6), ring(10),
    { id:'cli',  f: x => cli(x) === cli(t), text: cli(t) ? 'Son nom commence par « Clinique ».' : 'Son nom ne commence pas par « Clinique ».' },
    { id:'hop',  f: x => hop(x) === hop(t), text: hop(t) ? 'Son nom contient le mot « Hôpital ».' : 'Son nom ne contient pas le mot « Hôpital ».' },
    { id:'st',   f: x => sa(x) === sa(t), text: sa(t) ? 'Son nom contient « Saint » (ou « St »).' : 'Son nom ne contient pas « Saint ».' },
    { id:'s2',   f: x => x.s2 === t.s2, text: t.s2 ? 'Dans la base, son numéro SIRET commence par 2.' : 'Dans la base, son numéro SIRET ne commence pas par 2.' },
    { id:'old',  f: x => old(x) === old(t), text: `Sa fiche a été créée dans la base ${old(t) ? 'avant' : 'en'} 2005${old(t) ? '' : ' ou après'}.` },
    { id:'big',  f: x => big(x) === big(t), text: `Son emprise fait ${big(t) ? 'au moins' : 'moins de'} 2 hectares.` }
  ];
}
const HO_ROLE = { lyon:'dec', par:'soc', rive:'geo', ns:'geo', ew:'geo', d3:'epi', d6:'inf', d10:'clin', cli:'pat', hop:'sp', st:'soc', s2:'dm', old:'dm', big:'geo', not:'stat' };
const buildHospEnigma = (seed, nb) => buildPlaceEnigma(HOPITAUX, hoPredicates, HO_ROLE, 7, .9,
  (x, n) => `Ce n'est pas l'établissement n° ${n} (${x.n}) : ses données sont déjà appariées.`, seed, nb);

/* Petite projection pour la carte de Lyon */
const HO_BOX = { w: 4.69, e: 5.015, n: 45.875, s: 45.68 };
const HO_K = 400 / ((HO_BOX.e - HO_BOX.w) * .6976 * 111.2);           // pixels par km
const hoXY = (lon, lat) => [r1((lon - HO_BOX.w) * .6976 * 111.2 * HO_K), r1((HO_BOX.n - lat) * 111.2 * HO_K)];

/** Carte : les 9 arrondissements, cercles autour du CLB, établissements numérotés */
function hospMap(E) {
  const H = r1((HO_BOX.n - HO_BOX.s) * 111.2 * HO_K);
  const arr = ARRONDS.map(a => {
    const d = a.rings.map(r => 'M' + r.map(p => hoXY(...p).join(' ')).join('L') + 'Z').join('');
    const all = a.rings.flat(), c = hoXY(all.reduce((s, p) => s + p[0], 0) / all.length, all.reduce((s, p) => s + p[1], 0) / all.length);
    return { d, c, n: a.n };
  });
  const [cx, cy] = hoXY(...CLB_AT);
  const rings = HO_RINGS.map(km => `<circle cx="${cx}" cy="${cy}" r="${r1(km * HO_K)}" fill="none" stroke="#ffb02e" stroke-width="1.2" stroke-dasharray="5 4" stroke-opacity=".8"/>
    <text x="${cx}" y="${r1(cy - km * HO_K - 2)}" fill="#ffd9a0" font-size="7.5" font-family="Consolas,monospace" text-anchor="middle">${km} km</text>`).join('');
  const pins = E.places.map(x => { const [px, py] = hoXY(x.lon, x.lat);
    return `<g class="enum" data-pi="${x.i}"><circle cx="${px}" cy="${py}" r="7.5"/><text x="${px}" y="${r1(py + 3.2)}">${x.i + 1}</text></g>`; }).join('');
  return `<svg viewBox="0 0 400 ${H}" role="img" aria-label="Carte de Lyon et de sa métropole : établissements candidats">
    <rect width="400" height="${H}" fill="#0e2230"/>
    <g fill="#2dd4bf" fill-opacity=".14" stroke="#7fe3d4" stroke-width=".8" stroke-opacity=".7">${arr.map(a => `<path d="${a.d}"/>`).join('')}</g>
    <g fill="#9fe9dc" font-size="9" font-family="Consolas,monospace" text-anchor="middle" font-weight="700" opacity=".75" pointer-events="none">
      ${arr.map(a => `<text x="${a.c[0]}" y="${a.c[1] + 3}">${a.n}${a.n === 1 ? 'er' : 'e'}</text>`).join('')}</g>
    <g pointer-events="none">${rings}
      <path transform="translate(${cx} ${cy})" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="#fff"/>
      <text x="${cx + 8}" y="${cy + 12}" fill="#fff" font-size="7.5" font-family="Consolas,monospace">CLB</text>
      <text x="8" y="14" fill="#9fe9dc" font-size="8" font-family="Consolas,monospace">Lyon (9 arrondissements) et Métropole</text>
      <line x1="8" y1="${H - 10}" x2="${r1(8 + 2 * HO_K)}" y2="${H - 10}" stroke="#fff" stroke-width="2"/>
      <text x="8" y="${H - 14}" fill="#fff" font-size="7.5" font-family="Consolas,monospace">2 km</text></g>
    <g class="enums">${pins}</g></svg>`;
}

/** Lance l'énigme « hôpital mystère » ; then(résultat) à la fin */
function startHospEnigma(then) {
  const E = buildHospEnigma(state.scen.seed, state.nb);
  if (!E) { startEnigma(then); return; }
  const t = E.places[E.target];
  startPlaceEnigma({ E, kind: 'hosp', kick: 'Hôpital mystère', title: 'À quel établissement appartient cette emprise ?',
    lead: "Dans la base de données des établissements de santé, une <b>emprise</b> (le contour d'un bâtiment) a perdu son nom. Sans nom, impossible de relier les patients de la cohorte à leur hôpital.",
    figure: `<figure class="ph-photo ho-fig">
          <svg viewBox="-8 -8 116 116" class="ho-fp" aria-label="Contour du bâtiment mystère"><path d="${t.fp}" fill-rule="evenodd"/></svg>
          <figcaption id="phCap">Emprise sans nom · ${t.m} m dans sa plus grande longueur</figcaption>
        </figure>`,
    map: hospMap(E),
    item: x => `<b>${x.n}</b><small>${hoArr(x)} · ${hoHa(x)} ha · fiche ${x.y} · SIRET ${x.s2 ? '2…' : 'autre'}</small>`,
    go: x => `Rendre son nom à l'emprise : n° ${x.i + 1}`,
    cap: x => `<b>${x.n}</b> · ${hoArr(x)} · emprise ${hoHa(x)} ha · données Métropole de Lyon`,
    okTxt: 'Emprise identifiée : les données sont appariées !', koTxt: "L'emprise reste sans nom…",
    verdict: x => `C'était <b>${x.n}</b> (n° ${x.i + 1}).`, name: x => x.n,
    help: "Touchez un établissement (liste ou carte) pour l'écarter. Quand il n'en reste qu'un, rendez-lui son nom.",
    cdTitle: 'Hôpital mystère', cdSub: 'établissements · 1 seule emprise' }, then);
}

/** Indice(s) « Hôpital mystère » sur le téléphone */
function hospPhoneHtml(code, n, nb, seed) {
  const E = buildHospEnigma(seed, nb); if (!E) return enigPhoneHtml(code, n, nb, seed);
  return placePhoneHtml(E, code, n, nb, 'H', 'Hôpital mystère', 'Quel est cet établissement ?',
    "À lire quand le grand écran montre l'emprise mystère. Dites-le à voix haute : sans votre indice, impossible de trouver.");
}
