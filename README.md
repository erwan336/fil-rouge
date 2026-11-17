# Fil Rouge

Jeu collaboratif interdisciplinaire (5 à 10 minutes) créé pour une journée SHS au Centre Léon Bérard (Lyon).
Une maladie, six causes cachées : chaque joueur reçoit sur son téléphone un indice secret lié à sa discipline,
et l'équipe doit parler pour retrouver les vraies causes sur le mur d'enquête. Chaque cause trouvée allume
une couche sur une carte SIG du Rhône.

## Jouer

- Ouvrir le site sur un grand écran, choisir la maladie et le mode (solo, équipe de 2-3 avec 3 niveaux, grand groupe).
- Chaque joueur ouvre le même site sur son téléphone, touche « Rejoindre avec mon téléphone » et saisit le code affiché.
- Aucun serveur : le code suffit pour que chaque téléphone retrouve ses indices.

## Structure

```
index.html            pages du jeu
css/                  styles (base, mur d'enquête, SIG, effets d'accueil, finition)
js/data.js            contenu : disciplines, maladies, pistes et indices
js/map.js             carte SIG
js/rhone-data.js      contours du Rhône utilisés par la carte
js/app.js             logique du jeu
js/home-fx.js         effets interactifs de l'accueil
data/                 contours au format GeoJSON
```

## Données

- Contour du département : IGN ADMIN EXPRESS. Intercommunalités : geo.api.gouv.fr.
- **Toutes les valeurs affichées (nombre de malades, revenus, lieux de dépistage…) sont fictives** et servent uniquement au jeu.
