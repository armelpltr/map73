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

## Phases suivantes (hors périmètre de cette première version)

- Blog (Parcoursup, Grand Oral, spécialités, orientation post-3ᵉ)
- Pages locales : Chambéry, Aix-les-Bains, Savoie
- Prise de rendez-vous intégrée au site
- CMS léger pour que Julie et Camille modifient le contenu elles-mêmes
