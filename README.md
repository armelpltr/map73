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
blog/                   index et articles
tools/versionner.py     estampille de cache sur main.js
robots.txt
sitemap.xml
```

## Direction artistique

Métaphore cartographique : MAP73, la Savoie, le parcours scolaire.
L'élément signature est l'**itinéraire** du hero (3ᵉ → terminale), qui sert aussi de sélecteur de profil et renvoie vers la formule correspondante.

- Papier `#f7f6f1`, encre `#14243b`, vert `#2e9e58`, lac `#2e7da8`, ambre `#e8a33d`
- Titres : Bricolage Grotesque — Texte : Newsreader
- Une seule animation, le tracé de l'itinéraire au chargement, désactivée si `prefers-reduced-motion`

## Le contenu

Tout le texte du site est écrit dans `index.html`. Il n'y a ni base de données,
ni panneau d'administration, ni compte à créer : modifier une formule, un tarif
ou un témoignage, c'est modifier le HTML et pousser.

Une première version confiait ce contenu à un document Firestore, édité depuis un
panel `/admin/` derrière Turnstile, mot de passe et code à six chiffres, le tout
tenu par un Worker Cloudflare. L'ensemble a été retiré : pour un site d'une page
dont les textes bougent quelques fois par an, la machinerie coûtait plus cher que
ce qu'elle faisait gagner — et une page qui ne dépend de rien ne tombe jamais à
moitié. Le code reste dans l'historique git si le besoin revient.

## Développement

Aucune étape de build, à une exception près : **après toute modification du JavaScript**, lancer

```sh
python tools/versionner.py
```

qui estampille `?v=<horodatage>` sur l'URL de `main.js` dans chaque page. GitHub Pages sert les fichiers avec `Cache-Control: max-age=600` : sans cette estampille, le navigateur peut servir l'ancien script pendant dix minutes après la publication.

Ouvrir `index.html`, ou servir le dossier :

```sh
python -m http.server 8000
```

### Régénérer les images

Le script d'optimisation lit les originaux de l'ancien site (`../www.map73.fr/img`) et produit les WebP. Les images sources ne sont pas versionnées ici.

## À faire avant la mise en ligne

- [ ] **Formulaire de contact** : `index.html` pointe vers `https://formspree.io/f/REMPLACER_PAR_VOTRE_ID`. Tant que l'identifiant n'est pas renseigné, le formulaire bascule automatiquement sur le client mail de l'internaute. Remplacer par le service d'envoi retenu.
- [ ] **Logo en SVG** : le logo est pour l'instant un WebP de 4 Ko issu du PNG d'origine (256 Ko). Demander le fichier vectoriel.
- [ ] **Photos** : prévoir de vraies photos de Julie et Camille, et une image d'ouverture.
- [ ] **Image Open Graph** : `assets/img/og-preview.jpg` fait 560 × 292 px, en produire une en 1200 × 630 px.
- [ ] **Google Fonts** : envisager l'auto-hébergement des polices pour supprimer la connexion tierce mentionnée dans les mentions légales.

## Phases suivantes (hors périmètre de cette première version)

- Blog (Parcoursup, Grand Oral, spécialités, orientation post-3ᵉ)
- Pages locales : Chambéry, Aix-les-Bains, Savoie
- Prise de rendez-vous intégrée au site
- Reprise en main du contenu par le cabinet, si les textes se mettent à bouger souvent
