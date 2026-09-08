// ============================================================
// PANNEAUX — construction des formulaires du panel
//
// Tout le contenu du site tient dans un seul objet, image du document
// Firestore `contenu/site`. Chaque champ modifie cet objet en mémoire ;
// rien n'est écrit tant que « Publier les modifications » n'est pas cliqué.
// ============================================================

import { $, el, champ, sousListe, confirmer } from "./ui.js";

/* Schémas de saisie : ce que l'on montre, dans quel ordre, sous quelle forme. */

const SCHEMA_FORMULE = [
  { cle: "titre", label: "Nom de la formule" },
  { cle: "cible", label: "À qui elle s’adresse", indice: "Affiché en petit au-dessus du nom." },
  { cle: "objectif", label: "Objectif", type: "zone", large: true },
  { cle: "lignes", label: "Ce que la formule contient", type: "liste", indice: "Une ligne par point. <sup>e</sup> écrit un exposant." },
  { cle: "detailsTitre", label: "Titre du bloc dépliant", indice: "Laisser vide s’il n’y a pas de bloc dépliant." },
  { cle: "details", label: "Contenu du bloc dépliant", type: "liste" },
  { cle: "prix", label: "Prix affiché", indice: "Par exemple : à partir de 60 €" },
  { cle: "prixNote", label: "Précision sous le prix", indice: "Par exemple : la séance, par mois" },
  { cle: "libelleBouton", label: "Texte du bouton" },
  { cle: "lienBouton", label: "Lien du bouton", indice: "Une adresse complète, ou #contact pour la section contact." },
  { cle: "id", label: "Identifiant d’ancre", indice: "Sert aux liens de l’itinéraire. À ne changer qu’en connaissance de cause." },
  { cle: "phare", label: "Mettre en avant (carte foncée)", type: "case" }
];

const SCHEMA_TEMOIGNAGE = [
  { cle: "texte", label: "Témoignage", type: "zone", large: true },
  { cle: "auteur", label: "Signature", indice: "Par exemple : Maman de Clémence, première générale" }
];

const SCHEMA_PRESSE = [
  { cle: "source", label: "Média" },
  { cle: "citation", label: "Citation", type: "zone", large: true },
  { cle: "lien", label: "Lien vers l’article", large: true },
  { cle: "image", label: "Image (480 px)", indice: "Chemin dans le dépôt, par exemple assets/img/presse-adie-480.webp" },
  { cle: "image2x", label: "Image (781 px)", indice: "La même image en plus grand, pour les écrans à forte densité." },
  { cle: "alt", label: "Description de l’image", type: "zone", large: true, indice: "Lue par les lecteurs d’écran et par les moteurs de recherche." }
];

const SCHEMA_FAQ = [
  { cle: "question", label: "Question", large: true },
  { cle: "reponse", label: "Réponse", type: "zone", large: true }
];

const SCHEMA_ITINERAIRE = [
  { cle: "niveau", label: "Niveau", indice: "Par exemple : 3<sup>e</sup>" },
  { cle: "quoi", label: "Ce qui s’y joue" },
  { cle: "cible", label: "Formule visée", indice: "L’identifiant d’ancre d’une formule, sans le dièse." }
];

const SCHEMA_REPERE = [
  { cle: "valeur", label: "Chiffre ou mot-clé" },
  { cle: "libelle", label: "Explication", type: "zone", large: true }
];

/* ---------- Éditeur de liste générique ---------- */

function editeurListe({ conteneur, entrees, schema, titrer, nouvelle, libelleAjout, onChange }) {
  const redessiner = () => {
    conteneur.textContent = "";

    entrees.forEach((entree, index) => {
      const grille = el("div", { classe: "grille-champs" });

      for (const def of schema) {
        if (def.type === "liste") {
          grille.appendChild(
            sousListe({
              label: def.label,
              indice: def.indice,
              valeurs: entree[def.cle],
              onChange: (valeurs) => {
                entree[def.cle] = valeurs;
                onChange();
              }
            })
          );
        } else {
          grille.appendChild(
            champ({
              label: def.label,
              indice: def.indice,
              type: def.type,
              large: def.large,
              valeur: entree[def.cle],
              onChange: (valeur) => {
                entree[def.cle] = valeur;
                onChange();
                if (def.cle === titrer) majTitre();
              }
            })
          );
        }
      }

      const monter = el("button", { classe: "icone-bouton", texte: "↑", attributs: { type: "button", title: "Monter" } });
      monter.disabled = index === 0;
      monter.addEventListener("click", () => {
        [entrees[index - 1], entrees[index]] = [entrees[index], entrees[index - 1]];
        reordonner();
        onChange();
        redessiner();
      });

      const descendre = el("button", { classe: "icone-bouton", texte: "↓", attributs: { type: "button", title: "Descendre" } });
      descendre.disabled = index === entrees.length - 1;
      descendre.addEventListener("click", () => {
        [entrees[index + 1], entrees[index]] = [entrees[index], entrees[index + 1]];
        reordonner();
        onChange();
        redessiner();
      });

      const supprimer = el("button", {
        classe: "icone-bouton icone-bouton--danger",
        texte: "×",
        attributs: { type: "button", title: "Supprimer" }
      });
      supprimer.addEventListener("click", () => {
        if (!confirmer("Supprimer définitivement cette entrée ?")) return;
        entrees.splice(index, 1);
        reordonner();
        onChange();
        redessiner();
      });

      const titre = el("p", { classe: "fiche__titre", texte: entree[titrer] || "Sans titre" });
      const entete = el("div", {
        classe: "fiche__entete",
        enfants: [titre, el("div", { classe: "fiche__outils", enfants: [monter, descendre, supprimer] })]
      });

      function majTitre() {
        titre.textContent = entree[titrer] || "Sans titre";
      }

      conteneur.appendChild(el("article", { classe: "fiche", enfants: [entete, grille] }));
    });

    const ajouter = el("button", { classe: "bouton bouton--contour", texte: libelleAjout, attributs: { type: "button" } });
    ajouter.addEventListener("click", () => {
      entrees.push(nouvelle());
      reordonner();
      onChange();
      redessiner();
    });
    conteneur.appendChild(ajouter);
  };

  /* L'ordre d'affichage sur le site vient du champ `ordre`, pas de la
     position dans le tableau : on le renumérote après chaque déplacement. */
  const reordonner = () => entrees.forEach((entree, i) => (entree.ordre = (i + 1) * 10));

  redessiner();
}

/* ---------- Construction de tous les panneaux ---------- */

export function construirePanneaux(contenu, onChange) {
  /* Hero */
  const hero = (contenu.hero ||= {});
  const panneauHero = $("panneau-hero-champs");
  panneauHero.textContent = "";
  const grilleHero = el("div", { classe: "grille-champs" });
  [
    { cle: "titre", label: "Titre principal (H1)", large: true },
    { cle: "chapo", label: "Texte d’introduction", type: "zone", large: true },
    { cle: "note", label: "Mention sous les boutons" },
    { cle: "itineraireIntro", label: "Phrase au-dessus de l’itinéraire" }
  ].forEach((def) =>
    grilleHero.appendChild(
      champ({
        label: def.label,
        type: def.type,
        large: def.large,
        valeur: hero[def.cle],
        onChange: (v) => {
          hero[def.cle] = v;
          onChange();
        }
      })
    )
  );
  panneauHero.appendChild(el("article", { classe: "fiche", enfants: [grilleHero] }));

  editeurListe({
    conteneur: $("panneau-itineraire-liste"),
    entrees: (contenu.itineraire ||= []),
    schema: SCHEMA_ITINERAIRE,
    titrer: "niveau",
    nouvelle: () => ({ niveau: "", quoi: "", cible: "formules" }),
    libelleAjout: "Ajouter une étape",
    onChange
  });

  editeurListe({
    conteneur: $("panneau-reperes-liste"),
    entrees: (contenu.reperes ||= []),
    schema: SCHEMA_REPERE,
    titrer: "valeur",
    nouvelle: () => ({ valeur: "", libelle: "" }),
    libelleAjout: "Ajouter un repère",
    onChange
  });

  /* Formules */
  editeurListe({
    conteneur: $("panneau-formules-liste"),
    entrees: (contenu.formules ||= []),
    schema: SCHEMA_FORMULE,
    titrer: "titre",
    nouvelle: () => ({
      id: `formule-${Date.now().toString(36)}`,
      titre: "Nouvelle formule",
      cible: "",
      objectif: "",
      lignes: [],
      detailsTitre: "",
      details: [],
      prix: "",
      prixNote: "",
      phare: false,
      libelleBouton: "Prendre rendez-vous",
      lienBouton: "https://calendly.com/map73/formation"
    }),
    libelleAjout: "Ajouter une formule",
    onChange
  });

  /* Témoignages */
  editeurListe({
    conteneur: $("panneau-temoignages-liste"),
    entrees: (contenu.temoignages ||= []),
    schema: SCHEMA_TEMOIGNAGE,
    titrer: "auteur",
    nouvelle: () => ({ texte: "", auteur: "" }),
    libelleAjout: "Ajouter un témoignage",
    onChange
  });

  /* Presse */
  editeurListe({
    conteneur: $("panneau-presse-liste"),
    entrees: (contenu.presse ||= []),
    schema: SCHEMA_PRESSE,
    titrer: "source",
    nouvelle: () => ({ source: "", citation: "", lien: "", image: "", image2x: "", alt: "" }),
    libelleAjout: "Ajouter un article",
    onChange
  });

  /* FAQ */
  editeurListe({
    conteneur: $("panneau-faq-liste"),
    entrees: (contenu.faq ||= []),
    schema: SCHEMA_FAQ,
    titrer: "question",
    nouvelle: () => ({ question: "", reponse: "" }),
    libelleAjout: "Ajouter une question",
    onChange
  });

  /* Coordonnées */
  const c = (contenu.coordonnees ||= {});
  const panneauContact = $("panneau-contact-champs");
  panneauContact.textContent = "";
  const grilleContact = el("div", { classe: "grille-champs" });
  [
    { cle: "raisonSociale", label: "Nom affiché" },
    { cle: "adresse", label: "Rue" },
    { cle: "codePostal", label: "Code postal" },
    { cle: "ville", label: "Ville" },
    { cle: "lienCarte", label: "Lien vers la carte", large: true },
    { cle: "telephone", label: "Téléphone affiché" },
    { cle: "telephoneLien", label: "Téléphone au format international", indice: "Par exemple : +33678369006" },
    { cle: "email", label: "Adresse e-mail", large: true }
  ].forEach((def) =>
    grilleContact.appendChild(
      champ({
        label: def.label,
        indice: def.indice,
        large: def.large,
        valeur: c[def.cle],
        onChange: (v) => {
          c[def.cle] = v;
          onChange();
        }
      })
    )
  );
  grilleContact.appendChild(
    sousListe({
      label: "Horaires",
      indice: "Une ligne par plage affichée.",
      valeurs: c.horaires,
      onChange: (v) => {
        c.horaires = v;
        onChange();
      }
    })
  );
  panneauContact.appendChild(el("article", { classe: "fiche", enfants: [grilleContact] }));
}
