# À faire — section fondatrices

**Décidé le 2026-09-08. Réalisé le 2026-09-09.**

## La décision

La section « Julie et Camille » passe sur la **piste E — Fiches**, mais **sous forme de cartes**, pas de tableau.

Cinq pistes avaient été maquettées et comparées :
[maquettes des fondatrices](https://claude.ai/code/artifact/b291192b-3ca9-4bf2-99a5-88579588f3d2) — A Diptyque, B Itinéraire, C Alternance, D Vis-à-vis, E Fiches.

Ce qui a emporté la décision : c'est la piste qui rassure un parent en train de comparer des prestataires. Formation, années d'expérience, certifications, chacune à sa ligne, vérifiables. C'est aussi la plus facile à tenir à jour depuis le panel.

Le passage en cartes garde ce fond factuel mais abandonne la grille clé/valeur, trop administrative pour une page qui doit aussi donner envie.

## Ce qui a été fait

- [x] Réécrire la section `#fondatrices` de `index.html` en cartes, sur la base de la piste E
- [x] Ajouter les emplacements photo — **carré 1:1, 800 × 800 px**, cadrage serré sur le visage, fond uni de préférence
- [x] Répercuter sur les breakpoints mobile, pas seulement en desktop
- [x] Ouvrir la section à l'édition depuis le panel

La section n'est plus écrite en dur : elle vit dans le document `contenu/site`
sous la clé `fondatrices`, comme les formules et les témoignages. Le panel a son
onglet « Fondatrices » : prénom, rôle, repères chiffrés, lignes de parcours,
certifications, chemin du portrait et texte alternatif s'y modifient. Le HTML de
`index.html` reste en place et dit la même chose — c'est lui qui s'affiche si
Firestore ne répond pas.

Les repères chiffrés et les lignes de parcours vont par paires (intitulé +
texte) : `sousListePaires`, ajouté à `assets/js/admin/ui.js`, les édite sur deux
colonnes, et sur deux lignes en dessous de 640 px.

Le rendu construit par `rendreFondatrices` a été comparé au HTML statique : les
deux sont identiques balise pour balise, avec le contenu par défaut.

## Les photos

C'est le seul point encore ouvert, et il dépend du client.

Il n'y a **aucune photo de Julie et Camille** à ce jour ; `assets/img/portrait-julie.webp`
et `portrait-camille.webp` existent mais sont le même fichier provisoire.
Les remplacer dès la séance faite ne demande aucune modification de code : les
chemins se saisissent depuis le panel.

Contrainte à rappeler au client avant la séance : les deux portraits doivent être faits **le même jour, dans la même lumière**, au même cadrage. Deux photos d'allures différentes cassent le duo — et c'est ce duo que le site vend.

## Dossier dédié

Fait : le projet a été sorti du miroir HTTrack et vit désormais dans
`C:\Users\Armel\Documents\map73`.

## Contenu de référence

Il ne change pas d'une piste à l'autre, il est déjà dans `index.html` et dans `assets/js/contenu-defaut.js`.

**Julie** — ressources humaines et kinésiologie
- Master en gestion et innovations RH
- Plus de 15 ans en entreprise comme gestionnaire RH : formation, recrutement
- Kinésiologie certifiée par la Fédération française de kinésiologie
- Cycle 1 de l'outil Ennéagramme (CEE)

**Camille** — enseignement et droit social
- Licence de droit et master en gestion sociale
- 7 ans en entreprise comme chargée juridique et RH
- CAPES de lettres modernes, plus de 10 ans d'enseignement
- Formation spécialisée en orientation
