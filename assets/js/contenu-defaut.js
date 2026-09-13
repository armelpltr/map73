// ============================================================
// CONTENU PAR DÉFAUT — la copie de référence du site
//
// Ce fichier reproduit exactement ce qui est écrit en dur dans index.html.
// Il sert à deux choses :
//   1. pré-remplir les formulaires du panel quand Firestore est encore vide ;
//   2. alimenter le bouton « Publier le contenu initial », qui écrit tout
//      d'un coup dans Firestore au premier démarrage.
// Le site public, lui, ne s'en sert pas : si Firestore ne répond pas, c'est
// le HTML qui reste affiché, et il dit déjà la même chose.
//
// Le seul balisage toléré dans ces textes est <sup>, rendu par un petit
// analyseur maison (cf. poserTexte). Tout le reste est posé en textContent.
// ============================================================

export const LIEN_RDV = "https://calendly.com/map73/formation";

export const CONTENU_DEFAUT = {
  hero: {
    titre: "L’orientation scolaire. Plus qu’un choix, un avenir.",
    chapo:
      "MAP Orientation l’accompagne de la troisième à la terminale pour mieux se connaître, explorer des voies auxquelles il n’avait pas pensé auparavant, découvrir les métiers, choisir ses études et construire un projet qui lui ressemble. Cabinet de conseil en orientation scolaire à Chambéry, en présentiel ou à distance. À l’issue de l’accompagnement individualisé avec Camille et Julie, votre enfant aura toutes les cartes en main pour Maîtriser son Avenir et son Parcours.",
    itineraireIntro:
      "MAP propose des formules en fonction de l’âge de votre enfant. « Votre enfant est en quelle classe ? »",
    reperesTitre: "Ce que couvre l’accompagnement"
  },

  itineraire: [
    { niveau: "3<sup>e</sup>", quoi: "Quelle voie après le collège", cible: "formule-map-troisieme" },
    { niveau: "2<sup>de</sup>", quoi: "Choix des spécialités", cible: "formule-map-seconde" },
    { niveau: "1<sup>re</sup>", quoi: "Affiner le projet post-bac", cible: "formule-map-premiere" },
    { niveau: "Terminale", quoi: "Stratégie Parcoursup", cible: "formule-map-terminale" }
  ],

  /* Les quatre reperes, en legende de carte. `glyphe` designe l'un des
     dessins connus du site (etendue, binome, tampon, epingle) et rien
     d'autre : le panel choisit dans cette liste, il ne saisit pas de dessin. */
  reperes: [
    {
      id: "duree",
      ordre: 10,
      glyphe: "etendue",
      fait: "De la troisième à la terminale",
      quoi: "Un suivi personnalisé de la fin du collège jusqu’au bac."
    },
    {
      id: "equipe",
      ordre: 20,
      glyphe: "binome",
      fait: "Deux expertes en orientation scolaire",
      quoi: "Une responsable ressources humaines et une enseignante certifiée."
    },
    {
      id: "lieu",
      ordre: 40,
      glyphe: "epingle",
      fait: "Chambéry",
      quoi: "Au cabinet à Chambéry en Savoie, ou en visio partout en France."
    }
  ],

  /* Les nouveautes du haut de page. Ce sont des textes de depart : le panel
     les remplace, et vider la liste fait disparaitre la rubrique du site. */
  news: [
    {
      id: "news-inscriptions",
      ordre: 10,
      date: "Rentrée 2026",
      titre: "Les inscriptions sont ouvertes",
      texte:
        "Les créneaux d’accompagnement de l’année scolaire se réservent dès maintenant, en présentiel ou à distance.",
      libelleLien: "Prendre rendez-vous",
      lien: LIEN_RDV
    },
    {
      id: "news-ateliers",
      ordre: 20,
      date: "Nouveau",
      titre: "Ateliers collectifs",
      texte:
        "Des séances en petit groupe pour explorer les métiers autrement, en complément du suivi individuel.",
      libelleLien: "Voir les formules",
      lien: "#formules"
    },
    {
      id: "news-portes-ouvertes",
      ordre: 30,
      date: "Toute l’année",
      titre: "Venez nous rencontrer",
      texte:
        "Le cabinet est ouvert rue de Saint-Ombre à Chambéry : poussez la porte pour en parler de vive voix.",
      libelleLien: "Nous trouver",
      lien: "#contact"
    }
  ],

  coordonnees: {
    raisonSociale: "MAP73",
    adresse: "56 rue de Saint-Ombre",
    codePostal: "73000",
    ville: "Chambéry",
    lienCarte: "https://goo.gl/maps/HuJMSF4q4vzvLanLA",
    telephone: "06 78 36 90 06",
    telephoneLien: "+33678369006",
    email: "contacts@map73.fr",
    horaires: ["Du lundi au vendredi, de 9h à 18h30", "Le samedi, de 9h à 12h"]
  },

  /* Les sept formules, reprises du site en ligne : chacune porte un
     objectif (ou une liste d'objectifs) et un contenu, les deux intitules
     que le client utilise pour les decrire. `lignes` reste lu par le rendu
     pour les documents publies avant cette distinction. */
  formules: [
    {
      id: "formule-a-la-map",
      ordre: 10,
      cible: "Tous niveaux, à la carte",
      titre: "À LA MAP",
      objectif: "Accompagner les enfants sur des problématiques précises.",
      objectifs: [],
      contenu: "Une séance individuelle d’une heure.",
      detailsTitre: "Séance à la carte, parmi les services proposés",
      details: [
        "Création du CV et de la lettre de motivation",
        "Accompagnement pour les oraux",
        "Accompagnement méthodologique",
        "Un point précis sur la stratégie d’orientation"
      ],
      prix: "60 €",
      prixNote: "la séance",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-troisieme",
      ordre: 15,
      cible: "Élèves de troisième",
      titre: "MAP TROISIÈME 1 AN",
      objectif: "Aider votre enfant à choisir entre la voie générale et technologique et la voie professionnelle en seconde.",
      objectifs: [],
      contenu: "5 séances individuelles.",
      detailsTitre: "Le programme",
      details: [
        "Test de personnalité",
        "Exploration des différentes options d’orientation en fin de troisième"
      ],
      prix: "à partir de 40 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-seconde",
      ordre: 20,
      cible: "Élèves de seconde",
      titre: "MAP SECONDE 1 AN",
      objectif: "Préparer votre enfant à faire les bons choix de spécialités et l’initier aux orientations post-bac.",
      objectifs: [],
      contenu: "5 séances individuelles.",
      detailsTitre: "Le programme",
      details: [
        "Méthodologie de travail",
        "Test de personnalité",
        "Cartographie des talents et des compétences"
      ],
      prix: "à partir de 40 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-integrale",
      ordre: 30,
      cible: "Élèves de seconde, sur les trois années de lycée",
      titre: "MAP INTÉGRALE 3 ANS",
      objectif: "Accompagner votre enfant sur ses trois années au lycée.",
      objectifs: [],
      contenu: "15 séances sur 3 ans.",
      detailsTitre: "Le programme",
      details: [
        "Méthodologie de travail",
        "Préparation aux oraux",
        "Élaboration d’une stratégie d’orientation scolaire",
        "Stratégie Parcoursup"
      ],
      prix: "45 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-premiere",
      ordre: 40,
      cible: "Élèves de première",
      titre: "MAP PREMIÈRE 1 AN",
      objectif: "Se préparer à aborder la dernière année de lycée avec des bases méthodologiques consolidées.",
      objectifs: [],
      contenu: "4 séances individuelles ou sous forme d’atelier méthodologique.",
      detailsTitre: "Le programme",
      details: [
        "Méthodologie et préparation aux oraux du bac français",
        "Apprendre à rédiger un CV et une lettre de motivation",
        "Cartographie des talents et des compétences"
      ],
      prix: "à partir de 35 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-premium",
      ordre: 50,
      cible: "Élèves de première et de terminale",
      titre: "MAP PREMIUM 2 ANS",
      objectif: "Établir une stratégie personnalisée d’orientation jusqu’à l’étape Parcoursup.",
      objectifs: [],
      contenu: "5 séances en première et 7 séances en terminale.",
      detailsTitre: "Le programme",
      details: [
        "Bilan d’orientation scolaire",
        "Préparation aux oraux et test de personnalité",
        "Coaching",
        "Stratégie d’orientation post-bac et gestion des étapes Parcoursup"
      ],
      prix: "50 €",
      prixNote: "par mois",
      phare: true,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-map-terminale",
      ordre: 60,
      cible: "Élèves de terminale",
      titre: "TERMINALE PARCOURSUP 1 AN",
      objectif: "Élaborer la stratégie complète du parcours Parcoursup.",
      objectifs: [],
      contenu: "7 séances.",
      detailsTitre: "Le programme",
      details: [
        "Exploration des différentes orientations post-bac",
        "Gestion des différentes étapes Parcoursup"
      ],
      prix: "89 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    }
  ],

  temoignages: [
    {
      id: "angelique",
      ordre: 10,
      texte:
        "Merci à Camille et Julie pour leur gentillesse et leur savoir-faire. Camille a accompagné ma fille pour ses vœux sur Parcoursup, la rédaction de ses lettres, les attentes des personnes en charge de la sélection, le choix de ses vœux. Aujourd’hui nous avons le plaisir de découvrir que ma fille est acceptée à tous ses vœux d’office. Encore merci de votre aide pour comprendre les méandres de Parcoursup.",
      auteur: "Maman d’Angélique, terminale STMG"
    },
    {
      id: "clemence",
      ordre: 20,
      texte:
        "Camille et Julie forment un tandem de choc aussi sympathique qu’efficace. Elles mettent les ados à l’aise, les aident à une auto-analyse pertinente et cohérente. Je ne peux que recommander cette structure sans hésitation.",
      auteur: "Maman de Clémence, première générale"
    },
    {
      id: "caroline",
      ordre: 30,
      texte:
        "En 2022, les séances d’orientation de Camille m’ont permis de trouver et d’intégrer une super école qui me plaît beaucoup, pourtant on partait de loin.",
      auteur: "Caroline, terminale STL"
    },
    {
      id: "jade",
      ordre: 40,
      texte:
        "Les conseils de Julie et Camille m’ont beaucoup aidé pour mon orientation et pour compléter Parcoursup. Je recommande.",
      auteur: "Jade, terminale générale"
    },
    {
      id: "alexandra",
      ordre: 50,
      texte:
        "Julie est quelqu’un de très humain et également une excellente professionnelle. Elle est très à l’écoute et vous met à l’aise, je ne peux que recommander.",
      auteur: "Alexandra"
    },
    {
      id: "claire",
      ordre: 60,
      texte:
        "J’étais perdue, je ne savais pas comment m’y prendre. J’ai eu recours aux conseils de Camille et Julie : super organisation, ça m’a beaucoup aidée, je recommande.",
      auteur: "Claire, terminale ST2S"
    }
  ],

  presse: [
    {
      id: "hebdo-des-savoie",
      ordre: 10,
      source: "L’Hebdo des Savoie",
      citation:
        "« L’éducation aux médias et techniques de production radiophonique : rédaction de scripts, prise de parole, interviews, création d’affiche et gestion du temps d’antenne. »",
      lien: "https://www.hebdo-des-savoie.com/actualite/a-la-une/l’éducation-aux-médias-une-mission-essentielle-pour-radio-grand-lac",
      image: "assets/img/presse-hebdo-savoie-480.webp",
      image2x: "assets/img/presse-hebdo-savoie-781.webp",
      alt: "Article de L’Hebdo des Savoie sur l’atelier d’éducation aux médias animé avec Radio Grand Lac"
    },
    {
      id: "petit-reporter-compass",
      ordre: 20,
      source: "Le Petit Reporter du 73",
      citation:
        "« Le programme Compass ouvre le champ des possibles à des jeunes âgés de 14 à 19 ans en quête de repères, qu’il s’agisse d’orientation ou d’épanouissement. »",
      lien: "https://lepetitreporterdu73.com/2023/04/chambery-pour-les-jeunes-une-semaine-qui-peut-tout-changer/",
      image: "assets/img/presse-petit-reporter-480.webp",
      image2x: "assets/img/presse-petit-reporter-781.webp",
      alt: "Logo du Petit Reporter du 73, qui a consacré un article au programme Compass"
    },
    {
      id: "petit-reporter-horizons",
      ordre: 30,
      source: "Le Petit Reporter du 73",
      citation:
        "« Balayer les turpitudes, ouvrir des perspectives, penser différemment, ouvrir un œil bienveillant sur le monde, tout un programme. »",
      lien: "https://lepetitreporterdu73.com/2023/04/chambery-une-jeunesse-ivre-dhorizons/",
      image: "assets/img/presse-petit-reporter-480.webp",
      image2x: "assets/img/presse-petit-reporter-781.webp",
      alt: "Logo du Petit Reporter du 73, auteur de l’article « Chambéry, une jeunesse ivre d’horizons »"
    },
    {
      id: "place-aux-possibles",
      ordre: 40,
      source: "Radio Grand Lac",
      citation:
        "« Le concept de l’émission Place aux Possibles de Radio Grand Lac : rapprocher les jeunes de l’univers du travail, co-animée avec Camille et Julie. »",
      lien: "https://www.youtube.com/watch?v=bJVYx-nD5W0",
      image: "assets/img/presse-place-aux-possibles-480.webp",
      image2x: "assets/img/presse-place-aux-possibles-781.webp",
      alt: "Visuel de l’émission Place aux Possibles sur Radio Grand Lac, co-animée par Julie et Camille"
    },
    {
      id: "adie",
      ordre: 50,
      source: "Adie",
      citation:
        "« Dédramatiser l’orientation scolaire et aider les jeunes à trouver leur voie : l’engagement de Julie et Camille, fondatrices de MAP73 en Savoie. »",
      lien: "https://www.adie.org/a-la-une/portrait/camille-et-julie-entrepreneures-en-savoie",
      image: "assets/img/presse-adie-480.webp",
      image2x: "assets/img/presse-adie-781.webp",
      alt: "Portrait de Camille et Julie publié par l’Adie dans sa série sur les entrepreneures en Savoie"
    }
  ],

  faq: [
    {
      id: "lieu",
      ordre: 20,
      question: "Les séances se déroulent-elles à Chambéry uniquement ?",
      reponse:
        "Nous recevons à notre cabinet, 56 rue de Saint-Ombre à Chambéry. Toutes nos formules existent également en visio, ce qui permet d’accompagner des familles hors de Savoie."
    },
    {
      id: "age",
      ordre: 30,
      question: "À partir de quel âge accompagnez-vous les jeunes ?",
      reponse:
        "Dès la classe de 3<sup>e</sup>, au moment du premier vrai choix de voie, et jusqu’à la terminale avec le dossier Parcoursup."
    },
    {
      id: "metier",
      ordre: 40,
      question: "Faut-il savoir quel métier on veut faire avant de venir ?",
      reponse:
        "Non, c’est même rarement le cas. Le travail commence par la connaissance de soi : fonctionnement, valeurs, besoins. Le projet se construit ensuite."
    }
  ]
};
