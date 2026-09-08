# MAP73 — refonte du site

Refonte du site de MAP73, cabinet de conseil en orientation scolaire à Chambéry (Savoie).
Première version : site statique, sans framework ni dépendance JavaScript externe.

## Ce qui change par rapport à l'ancien site

| | Avant | Après |
|---|---|---|
| Poids des images | ~3,4 Mo | ~0,5 Mo (WebP + `srcset`) |
| Dépendances | Bootstrap 5.0.1, jQuery 3.6.1, FancyBox, widget Taggbox, reCAPTCHA | aucune |
| Balises `<h1>` | 2 | 1 |
| Données structurées | aucune | `LocalBusiness`, `Offer`, `Review`, `FAQPage` |
| Lazy loading / `srcset` | absents | sur toutes les images hors logo |
| Attributs `alt` | bourrés de mots-clés | descriptifs |

## Structure

```
index.html              page unique (hero, concept, formules, fondatrices, témoignages, presse, FAQ, contact)
mentions-legales.html   mentions légales et protection des données
favicon.ico
assets/
  css/style.css         feuille de style unique, variables CSS
  js/main.js            menu mobile, état de l'en-tête, formulaire
  img/                  images WebP en deux densités
  docs/                 PDF à télécharger
robots.txt
sitemap.xml
```

## Direction artistique

Métaphore cartographique : MAP73, la Savoie, le parcours scolaire.
L'élément signature est l'**itinéraire** du hero (3ᵉ → terminale), qui sert aussi de sélecteur de profil et renvoie vers la formule correspondante.

- Papier `#f7f6f1`, encre `#14243b`, vert `#2e9e58`, lac `#2e7da8`, ambre `#e8a33d`
- Titres : Bricolage Grotesque — Texte : Newsreader
- Une seule animation, le tracé de l'itinéraire au chargement, désactivée si `prefers-reduced-motion`

## Panel d'administration

`/admin/` permet à Julie et Camille de modifier les textes de la page d'accueil sans passer par le code : accueil et itinéraire, repères, formules et tarifs, témoignages, presse, questions fréquentes, coordonnées.

Tout le contenu tient dans **un seul document Firestore**, `contenu/site` : une lecture par visite du site, une écriture par publication. Le site public s'en sert s'il est disponible, et retombe sur le HTML écrit en dur sinon — une panne de Firebase n'a aucun effet visible.

Aucun texte saisi n'est injecté en `innerHTML`. Seule la balise `<sup>` est interprétée, par un analyseur maison (`assets/js/texte.js`), pour pouvoir écrire 3ᵉ ou 1ʳᵉ correctement.

### Mise en service de Firebase

```sh
npx firebase-tools login
npx firebase-tools projects:create map73-site
npx firebase-tools apps:create WEB "Site MAP73" --project map73-site
npx firebase-tools apps:sdkconfig WEB --project map73-site
```

1. Recopier les valeurs affichées dans `assets/js/firebase-config.js`.
2. Renseigner l'identifiant du projet dans `.firebaserc`.
3. Créer la base Firestore (console Firebase > Firestore Database > Créer, mode production, région `europe-west1`).
4. Déployer les règles — **par la CLI, jamais par copier-coller dans la console** :

```sh
npx firebase-tools deploy --only firestore:rules --project map73-site
```

### Créer un accès

Un compte Firebase seul ne donne rien : la clé du site est publique, n'importe qui peut s'en créer un. C'est l'existence d'une entrée dans `admins` qui ouvre le panel, et ce sont les règles Firestore qui refusent réellement les écritures.

1. Console Firebase > Authentication > Sign-in method > activer **E-mail/Mot de passe**.
2. Authentication > Users > Add user : créer le compte, noter son **UID**.
3. Firestore > collection `admins` > document dont l'**ID est cet UID**, avec le champ `nom` (texte).

La session se ferme avec l'onglet : le panel est souvent ouvert depuis un poste partagé.

### Premier démarrage

Tant que rien n'est publié, les formulaires sont pré-remplis avec le texte actuel du site (`assets/js/contenu-defaut.js`, copie exacte de `index.html`). Un clic sur **Publier les modifications** en fait la version de référence.

## Développement

Aucune étape de build. Ouvrir `index.html`, ou servir le dossier :

```sh
python -m http.server 8000
```

### Régénérer les images

Le script d'optimisation lit les originaux de l'ancien site (`../www.map73.fr/img`) et produit les WebP. Les images sources ne sont pas versionnées ici.

## À faire avant la mise en ligne

- [ ] **Formulaire de contact** : `index.html` pointe vers `https://formspree.io/f/REMPLACER_PAR_VOTRE_ID`. Tant que l'identifiant n'est pas renseigné, le formulaire bascule automatiquement sur le client mail de l'internaute. Remplacer par le service d'envoi retenu.
- [ ] **Numéro d'agrément préfectoral** : absent de l'ancien site (`N°…`), à récupérer auprès de MAP73 pour la mention du crédit d'impôt.
- [ ] **Logo en SVG** : le logo est pour l'instant un WebP de 4 Ko issu du PNG d'origine (256 Ko). Demander le fichier vectoriel.
- [ ] **Photos** : prévoir de vraies photos de Julie et Camille, et une image d'ouverture.
- [ ] **Image Open Graph** : `assets/img/og-preview.jpg` fait 560 × 292 px, en produire une en 1200 × 630 px.
- [ ] **Google Fonts** : envisager l'auto-hébergement des polices pour supprimer la connexion tierce mentionnée dans les mentions légales.

- [ ] **Firebase** : créer le projet, remplir `assets/js/firebase-config.js` et `.firebaserc`, déployer les règles, créer les deux accès (voir plus haut). Tant que ce n'est pas fait, le panel affiche un message et le site fonctionne normalement sans lui.

## Phases suivantes (hors périmètre de cette première version)

- Blog (Parcoursup, Grand Oral, spécialités, orientation post-3ᵉ)
- Pages locales : Chambéry, Aix-les-Bains, Savoie
- Prise de rendez-vous intégrée au site
- Envoi d'images depuis le panel (aujourd'hui les visuels de presse doivent être ajoutés au dépôt)
- Textes des sections Concept et Fondatrices dans le panel (ils bougent rarement, ils sont restés dans le HTML)
