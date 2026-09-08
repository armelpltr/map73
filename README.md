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

### La porte du panel

Trois barrières, dans cet ordre, et aucune n'est purement décorative :

1. **Turnstile** — le formulaire de connexion est la seule porte publique du panel. Sans contrôle anti-robot, c'est un endpoint d'essai de mots de passe ouvert à tout Internet. Le jeton est vérifié côté Worker, avec la clé secrète.
2. **Appartenance à `admins`** — le Worker cherche le compte, vérifie qu'il est inscrit, et **ne regarde le mot de passe qu'ensuite**. Un compte Firebase absent de `admins` n'obtient rien, et le message de refus est le même dans tous les cas : distinguer « adresse inconnue » de « mot de passe faux » dirait à un inconnu quelles adresses ont un accès.
3. **Code à six chiffres par e-mail** — tiré, salé, haché et comparé dans le Worker. Il vit dans `otpChallenges`, une collection que **personne** ne peut lire, pas même son titulaire : les règles la ferment explicitement. Un code que l'utilisateur peut lire ne serait pas un second facteur.

Le navigateur ne s'adresse jamais directement à Firebase pour se connecter : il reçoit un jeton personnalisé signé par le Worker, et l'échange contre une session. La validation du code pose alors un attribut (`a2fUntil`, `a2fAuthTime`) que **les règles Firestore exigent** pour la moindre écriture. `a2fAuthTime` comparé à `auth_time` est ce qui empêche qu'une session ouverte sur un autre poste hérite du « validé » sans jamais recevoir de code.

Ce que cela ne couvre pas, et qu'il faut savoir : l'API publique d'Identity Toolkit reste joignable avec la clé web du site. Quelqu'un peut toujours s'y créer un compte hors du panel. La session obtenue ne vaut rien — ni entrée dans `admins`, ni attribut de double authentification — mais elle existe. C'est la raison d'être des deux verrous suivants.

### Verrous côté Google

- **Restriction de la clé web** — console Google Cloud > API et services > Identifiants > la clé « Browser key » du projet > Restrictions d'application > **Sites web**, avec `armelpltr.github.io/*` et `www.map73.fr/*`.
- **App Check** — console Firebase > App Check > enregistrer l'application web avec reCAPTCHA v3, puis passer Firestore en **mode surveillance** quelques jours avant d'appliquer l'obligation. Une fois appliqué, Firestore refuse toute requête qui ne vient pas du vrai site, y compris avec la bonne clé. À activer en dernier : mal enregistré, il fait tomber le site public.

### Créer le premier accès

Le panel ne connaît aucune inscription libre, et la création d'accès est réservée au superadministrateur. Le tout premier compte se crée donc à la main, une seule fois :

1. Console Firebase > Authentication > Sign-in method > activer **E-mail/Mot de passe**.
2. Authentication > Users > **Add user** : créer le compte, noter son **UID**.
3. Firestore > collection `admins` > document dont l'**ID est cet UID**, avec les champs :
   - `nom` (texte)
   - `email` (texte, la même adresse)
   - `role` (texte) = `superadmin`
   - `actif` (booléen) = `true`

Les accès suivants se créent depuis l'onglet **Accès** du panel. Le mot de passe provisoire se transmet de vive voix, jamais par e-mail — c'est aussi la boîte où arrivent les codes.

### Le Worker

`worker/` tient la porte et la gestion des accès. Il détient la clé de service, seul endroit où elle peut vivre sans être publique — et, corollaire, le seul endroit que les règles Firestore ne protègent pas, puisqu'elle les contourne. Chaque route y refait donc les vérifications elle-même (`worker/src/membre.js`).

```sh
cd worker
npx wrangler login
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # JSON du compte de service
npx wrangler secret put TURNSTILE_SECRET           # clé secrète du widget
npx wrangler secret put BREVO_API_KEY              # clé API v3 de Brevo
npx wrangler deploy
```

Puis renseigner dans `wrangler.toml` l'adresse `EMAIL_EXPEDITEUR` (validée comme expéditeur chez Brevo), et dans `assets/js/config.js` l'URL du Worker déployé et la clé publique Turnstile.

Sans l'un de ces trois secrets, la connexion est refusée plutôt que dégradée : mieux vaut un panel injoignable qu'une porte sans serrure.

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

- [ ] **Worker et secrets** : déployer `worker/`, injecter les trois secrets, renseigner `WORKER_URL` et `TURNSTILE_SITE_KEY` dans `assets/js/config.js`. Tant que ce n'est pas fait, le panel refuse la connexion et le site public fonctionne normalement sans lui.
- [ ] **Premier superadmin** : créer le compte et son entrée `admins` dans la console (voir plus haut).
- [ ] **Verrous Google** : restreindre la clé web par domaine, puis App Check en surveillance avant application.
- [ ] **Expéditeur des codes** : les codes de connexion partent aujourd'hui d'une adresse Gmail personnelle, validée à la main dans Brevo. Le jour du domaine définitif, authentifier `map73.fr` chez Brevo et basculer `EMAIL_EXPEDITEUR` sur `contacts@map73.fr` — un expéditeur du domaine du site passe bien mieux les filtres, et le message ne semble plus venir d'un tiers.

## Phases suivantes (hors périmètre de cette première version)

- Blog (Parcoursup, Grand Oral, spécialités, orientation post-3ᵉ)
- Pages locales : Chambéry, Aix-les-Bains, Savoie
- Prise de rendez-vous intégrée au site
- Envoi d'images depuis le panel (aujourd'hui les visuels de presse doivent être ajoutés au dépôt)
- Textes des sections Concept et Fondatrices dans le panel (ils bougent rarement, ils sont restés dans le HTML)
