/* Carte SIG du Rhône.
   - Les CONTOURS sont réels (voir js/rhone-data.js) :
       · département : IGN ADMIN EXPRESS (DEPARTEMENT_69.geojson), data/rhone-departement.geojson ;
       · intercommunalités (EPCI) : geo.api.gouv.fr, data/rhone-epci.geojson.
   - Les DONNÉES affichées (cas, revenus, lieux…) sont FICTIVES, inventées pour le jeu.
   Principe : 1 famille de causes = 1 couche cartographique. */

/* Libellé de chaque couche (les identifiants sont ceux de FAMILIES, dans data.js) */
const SIG_LABELS = {
  terr:"Temps d'accès aux soins",
  soc: "Revenus modestes",
  env: "Cadre de vie favorable",
  soin:"Lieux de dépistage",
  comp:"Silence : on n'en parle pas",
  pol: "Actions de prévention"
};

/* ---------- Projection : longitude/latitude vers les coordonnées de la carte ----------
   Calculée automatiquement pour que le contour du département (RHONE_DEP) remplisse la carte. */
const SIG = (() => {
  const W = 300, H = 340, PADX = 30, PADY = 16;
  const pts = RHONE_DEP.features[0].geometry.coordinates.flat(2);
  const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const COS = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
  const K = Math.min((W - 2 * PADX) / ((maxLon - minLon) * COS), (H - 2 * PADY) / (maxLat - minLat));
  return { W, H, COS, K, LON0: minLon, LAT1: maxLat,
           OX: (W - (maxLon - minLon) * COS * K) / 2, OY: (H - (maxLat - minLat) * K) / 2 };
})();
const KM = SIG.K / 111.2;                                  // 1 km en unités de carte
const proj = (lon, lat) => [SIG.OX + (lon - SIG.LON0) * SIG.COS * SIG.K, SIG.OY + (SIG.LAT1 - lat) * SIG.K];
/** Inverse : coordonnées de carte vers [longitude, latitude] */
const unproj = (x, y) => [SIG.LON0 + (x - SIG.OX) / (SIG.COS * SIG.K), SIG.LAT1 - (y - SIG.OY) / SIG.K];
const r1 = n => Math.round(n * 10) / 10;

/* Le nord du département (latitude du centre > 45,88°) est la zone "très touchée" du scénario */
const isNorth = f => f.properties.lat > 45.88;
/** Intensité (fictive) des cas pour un territoire */
function caseLevel(f) {
  const p = f.properties;
  if (p.nom.startsWith('Métropole')) return .1;
  if (isNorth(f)) return Math.min(.92, .6 + (p.lat - 45.88) / .32 * .32);
  if (p.lat > 45.78) return .38;
  return .16 + (+p.code % 5) * .03;
}
/** Tracé SVG d'un territoire (anneaux du GeoJSON) */
function featurePath(f) {
  return f.geometry.coordinates.map(poly => poly.map(ring =>
    'M' + ring.map(([lon, lat]) => proj(lon, lat).map(r1).join(' ')).join('L') + 'Z').join('')).join('');
}

/** Renvoie le SVG de la carte. uid : préfixe pour rendre les identifiants uniques. */
function sigMap(uid) {
  const col = Object.fromEntries(FAMILIES.map(f => [f.id, f.color]));
  const feats = RHONE_GEO.features;
  const paths = feats.map(f => ({ f, d: featurePath(f) }));
  const dep = featurePath(RHONE_DEP.features[0]);          // contour officiel du département (IGN)
  const north = paths.filter(p => isNorth(p.f));
  const mono = 'font-family="Consolas,monospace"';
  const at = (lon, lat) => proj(lon, lat).map(r1);

  // Symboles ponctuels (placés par longitude/latitude réelles ; leur signification est fictive)
  const tri  = ([x, y]) => `<path d="M${x} ${y - 6} l6 10 h-12z" fill="${col.env}" stroke="#062a27"/>`;
  const care = ([x, y]) => `<g><rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" fill="${col.soin}" stroke="#06223f"/><path d="M${x} ${y - 4}v8M${x - 4} ${y}h8" stroke="#fff" stroke-width="2"/></g>`;
  const star = ([x, y]) => `<path transform="translate(${x} ${y})" d="M0 -7 L2 -2 L7 -2 L3 1.5 L4.5 7 L0 3.8 L-4.5 7 L-3 1.5 L-7 -2 L-2 -2Z" fill="${col.pol}" stroke="#3d2f00"/>`;
  const mute = ([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-8 -6 h16 v10 h-9 l-4 4 v-4 h-3z" fill="${col.comp}" stroke="#2a0f3d"/><path d="M-6 6 L6 -8" stroke="#fff" stroke-width="2"/></g>`;
  const label = (lon, lat, txt, op = 1) => { const [x, y] = at(lon, lat); return `<text x="${x}" y="${y}" fill-opacity="${op}">${txt}</text>`; };

  const [lx, ly] = at(4.835, 45.757);                      // Lyon
  // Zone à entourer à la fin : l'emprise des territoires du nord
  const pts = north.flatMap(p => p.f.geometry.coordinates.flatMap(poly => poly[0].map(([a, b]) => proj(a, b))));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const hx = (Math.min(...xs) + Math.max(...xs)) / 2, hy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const hrx = (Math.max(...xs) - Math.min(...xs)) / 2 + 6, hry = (Math.max(...ys) - Math.min(...ys)) / 2 + 6;

  return `<svg viewBox="0 0 ${SIG.W} ${SIG.H}" role="img" aria-label="Carte SIG du Rhône : contour IGN du département et intercommunalités, données fictives">
    <defs>
      <!-- Tout est découpé selon le contour du département : les intercommunalités qui débordent
           (Vienne Condrieu, Monts du Lyonnais) s'arrêtent à la limite départementale -->
      <clipPath id="${uid}clip"><path d="${dep}"/></clipPath>
      <filter id="${uid}glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
      <pattern id="${uid}hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3" height="7" fill="${col.soc}"/></pattern>
      <pattern id="${uid}grat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#2dd4bf" stroke-opacity=".12"/></pattern>
    </defs>

    <!-- Fond de carte et départements voisins -->
    <rect width="${SIG.W}" height="${SIG.H}" fill="#0b1820"/><rect width="${SIG.W}" height="${SIG.H}" fill="url(#${uid}grat)"/>
    <g ${mono} font-size="10" fill="#5f8c88" text-anchor="middle" letter-spacing="2">
      <text x="${r1(at(4.27, 45.84)[0] - 6)}" y="${at(4.27, 45.84)[1]}" transform="rotate(-90 ${r1(at(4.27, 45.84)[0] - 6)} ${at(4.27, 45.84)[1]})">LOIRE</text>
      ${(([x, y]) => `<text x="${x}" y="${y}">AIN</text>`)(at(5.05, 46.05))}
      ${(([x, y]) => `<text x="${x}" y="${y}">ISÈRE</text>`)(at(5.05, 45.52))}
    </g>
    <!-- Halo lumineux sous le département -->
    <path d="${dep}" fill="none" stroke="#2dd4bf" stroke-width="7" stroke-opacity=".35" filter="url(#${uid}glow)"/>
    <path d="${dep}" fill="#13262d"/>
    <!-- Couche de base : cas de maladie par intercommunalité (choroplèthe, valeurs fictives) -->
    <g clip-path="url(#${uid}clip)" stroke="#f3d9d0" stroke-width=".8" stroke-linejoin="round">
      ${paths.map(p => `<path class="terr" data-nom="${p.f.properties.nom.replace(/"/g, '')}" d="${p.d}" fill="#e0362b" fill-opacity="${caseLevel(p.f).toFixed(2)}"><title>${p.f.properties.nom}</title></path>`).join('')}
    </g>
    <!-- Limite départementale (IGN ADMIN EXPRESS) -->
    <path d="${dep}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" pointer-events="none"/>
    <g ${mono} font-size="8" fill="#fff" text-anchor="middle" pointer-events="none">
      ${label(4.60, 46.19, 'Beaujolais')}${label(4.41, 45.99, 'Tarare')}${label(4.69, 46.01, 'Villefranche')}
      ${label(4.45, 45.69, 'Monts du', .75)}${label(4.45, 45.665, 'Lyonnais', .75)}${label(4.84, 45.53, 'Condrieu', .75)}
    </g>
    <!-- Lyon et le Centre Léon Bérard -->
    <g pointer-events="none">
      <rect x="${lx - 4}" y="${ly - 4}" width="8" height="8" fill="#fff" stroke="#0b1820"/>
      <text x="${lx + 8}" y="${ly - 1}" ${mono} font-size="9" font-weight="700" fill="#fff">LYON</text>
      <text x="${lx + 8}" y="${ly + 8}" ${mono} font-size="6.5" fill="#cfe7e3">Centre Léon Bérard</text>
    </g>

    <!-- Couche TERRITOIRE : temps d'accès aux soins depuis Lyon (cercles tous les 15 km environ) -->
    <g class="lyr" data-l="terr" pointer-events="none">
      <g clip-path="url(#${uid}clip)" fill="${col.terr}" fill-opacity=".1" stroke="${col.terr}" stroke-width="1.6" stroke-dasharray="6 4">
        ${[45, 30, 15].map(km => `<circle cx="${lx}" cy="${ly}" r="${r1(km * KM)}"/>`).join('')}
      </g>
      <g ${mono} font-size="8.5" font-weight="700" fill="#b9f5d0" text-anchor="middle">
        ${[[15, '15 min'], [30, '30 min'], [45, '45 min']].map(([km, t]) => `<text x="${r1(lx - km * KM * .62)}" y="${r1(ly - km * KM * .74)}">${t}</text>`).join('')}
      </g>
    </g>
    <!-- Couche SOCIAL : revenus modestes (hachures sur le nord) -->
    <g class="lyr" data-l="soc" clip-path="url(#${uid}clip)" fill="url(#${uid}hatch)" fill-opacity=".75" stroke="${col.soc}" stroke-width="1.6" pointer-events="none">
      ${north.map(p => `<path d="${p.d}"/>`).join('')}
    </g>
    <!-- Couche ENVIRONNEMENT : cadre de vie favorable : surtout autour de Lyon et au sud -->
    <g class="lyr" data-l="env" pointer-events="none">${[[4.855,45.79],[4.96,45.77],[4.94,45.69],[4.75,45.67],[4.67,45.62],[4.77,45.585],[4.77,45.47]].map(p => tri(at(...p))).join('')}</g>
    <!-- Couche ACCÈS AUX SOINS : lieux de dépistage : autour de Lyon -->
    <g class="lyr" data-l="soin" pointer-events="none">${[[4.80,45.80],[4.90,45.70],[4.76,45.74],[4.93,45.76],[4.79,45.60]].map(p => care(at(...p))).join('')}</g>
    <!-- Couche COMPORTEMENTS : là où l'on n'en parle pas : au nord -->
    <g class="lyr" data-l="comp" pointer-events="none">${[[4.59,46.13],[4.50,46.24],[4.43,45.90],[4.32,46.03],[4.72,46.10]].map(p => mute(at(...p))).join('')}</g>
    <!-- Couche POLITIQUES PUBLIQUES : actions de prévention : concentrées sur la métropole -->
    <g class="lyr" data-l="pol" pointer-events="none">
      <circle cx="${lx}" cy="${ly}" r="${r1(13 * KM)}" fill="none" stroke="${col.pol}" stroke-width="1.6" stroke-dasharray="3 4"/>
      ${[[4.83,45.725],[4.915,45.74],[4.87,45.81]].map(p => star(at(...p))).join('')}
    </g>
    <!-- Révélation finale : toutes les couches se superposent au nord -->
    <g class="lyr hot" data-l="hot" pointer-events="none">
      <ellipse cx="${r1(hx)}" cy="${r1(hy)}" rx="${r1(hrx)}" ry="${r1(hry)}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="8 6"/>
      <g ${mono} font-size="10" font-weight="700" fill="#fff"><text x="6" y="30">TOUT SE</text><text x="6" y="43">SUPERPOSE</text><text x="6" y="56">AU NORD</text></g>
    </g>

    <!-- Habillage SIG : flèche du Nord, échelle (20 km), mentions -->
    <g transform="translate(${SIG.W - 16} 300)" fill="#cfe7e3" ${mono} font-size="9" text-anchor="middle">
      <path d="M0 -16 L5 0 L0 -4 L-5 0Z"/><text y="12">N</text></g>
    <g transform="translate(8 328)" stroke="#cfe7e3" fill="#cfe7e3" ${mono} font-size="8">
      <path d="M0 0 H${r1(20 * KM)} M0 -3 V3 M${r1(10 * KM)} -3 V3 M${r1(20 * KM)} -3 V3" fill="none"/><text x="${r1(20 * KM + 5)}" y="3" stroke="none">20 km</text></g>
    <text x="8" y="312" ${mono} font-size="7" fill="#ffc27a">Contours IGN · données fictives</text>
  </svg>`;
}

/** Allume ou éteint une couche (dans la carte et dans la légende) à l'intérieur de root */
function setLayer(root, id, on) {
  if (root) root.querySelectorAll(`[data-l="${id}"]`).forEach(el => el.classList.toggle('on', on));
}
