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
    titre: "Inquiet sur l’orientation de votre ado ?",
    chapo:
      "MAP73 l’accompagne de la troisième à la terminale pour mieux se connaître, découvrir les métiers, choisir ses études et construire un projet qui lui ressemble. Cabinet de conseil en orientation scolaire à Chambéry, en présentiel ou à distance.",
    note: "Crédit d’impôt de 50 % — services à la personne",
    itineraireIntro: "Où en est votre ado ? Choisissez son étape."
  },

  itineraire: [
    { niveau: "3<sup>e</sup>", quoi: "Quelle voie après le collège", cible: "formule-premiere-orientation" },
    { niveau: "2<sup>de</sup>", quoi: "Choix des spécialités", cible: "formule-premiere-orientation" },
    { niveau: "1<sup>re</sup>", quoi: "Affiner le projet post-bac", cible: "formule-premiere-orientation" },
    { niveau: "Terminale", quoi: "Stratégie Parcoursup", cible: "formule-parcoursup-complet" }
  ],

  reperes: [
    { valeur: "3<sup>e</sup> – T<sup>le</sup>", libelle: "Un accompagnement continu sur toute la scolarité du secondaire" },
    { valeur: "2 expertes", libelle: "Une responsable RH kinésiologue et une enseignante certifiée" },
    { valeur: "−50 %", libelle: "Crédit d’impôt au titre des services à la personne" },
    { valeur: "Chambéry", libelle: "En cabinet, en Savoie, ou en visio partout en France" }
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
    horaires: ["Du lundi au vendredi, 9h – 18h30", "Le samedi, 9h – 12h"]
  },

  formules: [
    {
      id: "formule-a-la-map",
      ordre: 10,
      cible: "Tous niveaux, à la carte",
      titre: "À LA MAP",
      objectif: "Traiter une problématique précise, sans engagement sur la durée.",
      lignes: ["Une séance individuelle de 45 minutes"],
      detailsTitre: "Ce que la séance peut couvrir",
      details: [
        "Rédaction du CV et de la lettre de motivation",
        "Préparation aux oraux",
        "Accompagnement méthodologique",
        "Un point précis d’orientation"
      ],
      prix: "à partir de 60 €",
      prixNote: "la séance",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-premiere-orientation",
      ordre: 20,
      cible: "Collège, seconde et première",
      titre: "MAP’REMIERE ORIENTATION",
      objectif: "Faire le point et décider, à chaque palier du secondaire.",
      lignes: [
        "Bilan d’orientation scolaire complet",
        "Choix de la voie en fin de 3<sup>e</sup>",
        "Choix des spécialités en 2<sup>de</sup> et 1<sup>re</sup>",
        "5 séances de suivi"
      ],
      detailsTitre: "",
      details: [],
      prix: "à partir de 55 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-parcoursup-light",
      ordre: 30,
      cible: "Terminale",
      titre: "MAP’ARCOURSUP LIGHT",
      objectif: "Construire sa stratégie individuelle d’orientation post-bac.",
      lignes: ["5 séances de suivi", "Repérage des formations et des attendus"],
      detailsTitre: "",
      details: [],
      prix: "à partir de 59 €",
      prixNote: "par mois",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: LIEN_RDV
    },
    {
      id: "formule-parcoursup-complet",
      ordre: 40,
      cible: "Terminale, accompagnement complet",
      titre: "MAP’ARCOURSUP COMPLET",
      objectif: "La stratégie post-bac menée jusqu’à la finalisation du dossier Parcoursup.",
      lignes: [
        "8 séances de suivi",
        "Formulation et hiérarchisation des vœux",
        "Relecture des lettres et du projet de formation"
      ],
      detailsTitre: "",
      details: [],
      prix: "Tarif sur mesure",
      prixNote: "contactez-nous pour un devis adapté",
      phare: true,
      libelleBouton: "Demander un devis",
      lienBouton: "#contact"
    }
  ],

  /* Les deux fondatrices, telles qu'elles sont écrites en dur dans index.html.
     Le portrait est un carré de 800 × 800 px déposé dans assets/img/. */
  fondatrices: [
    {
      id: "julie",
      ordre: 10,
      prenom: "Julie",
      role: "Ressources humaines et kinésiologie",
      portrait: "assets/img/portrait-julie.webp",
      portraitAlt:
        "Julie, cofondatrice de MAP73, responsable ressources humaines et kinésiologue",
      chiffres: [
        { valeur: "15 ans", mesure: "en entreprise, côté RH" },
        { valeur: "2", mesure: "certifications" }
      ],
      faits: [
        { intitule: "Formation", texte: "Master en gestion et innovations RH" },
        { intitule: "Expérience", texte: "Gestionnaire RH : responsable de formation et de recrutements" },
        {
          intitule: "Dans les séances",
          texte: "Connaissance de soi, découverte du monde professionnel, candidatures"
        }
      ],
      pastilles: ["Kinésiologie FFK", "Ennéagramme cycle 1 (CEE)"]
    },
    {
      id: "camille",
      ordre: 20,
      prenom: "Camille",
      role: "Enseignement et droit social",
      portrait: "assets/img/portrait-camille.webp",
      portraitAlt: "Camille, cofondatrice de MAP73, enseignante certifiée et juriste",
      chiffres: [
        { valeur: "10 ans", mesure: "d’enseignement" },
        { valeur: "7 ans", mesure: "en juridique et RH" }
      ],
      faits: [
        {
          intitule: "Formation",
          texte: "Licence de droit, master en gestion sociale et CAPES de lettres modernes"
        },
        { intitule: "Expérience", texte: "Enseignante en collège et lycée, puis chargée juridique et RH" },
        {
          intitule: "Dans les séances",
          texte: "Choix des filières et des spécialités, stratégie Parcoursup, écrits"
        }
      ],
      pastilles: ["CAPES de lettres modernes", "Formation en orientation"]
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
      id: "credit-impot",
      ordre: 10,
      question: "Comment fonctionne le crédit d’impôt de 50 % ?",
      reponse:
        "Nos prestations relèvent des services à la personne. Vous réglez la séance, nous vous remettons une attestation fiscale, et 50 % du montant vous sont restitués par l’administration fiscale. Une séance facturée 60 € vous revient à 30 €."
    },
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
