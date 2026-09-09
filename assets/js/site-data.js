// ============================================================
// SITE-DATA — applique sur le site public le contenu géré depuis le panel
//
// Un seul document Firestore, `contenu/site`, porte tout le contenu
// éditable : une lecture par visite, et une publication atomique côté
// panel. Si Firebase n'est pas configuré, injoignable, ou si une section
// manque, le HTML écrit en dur reste affiché — il dit déjà la même chose.
// Rien sur cette page ne dépend de Firestore pour fonctionner.
// ============================================================

import { FIREBASE_CONFIGURE, obtenirFirestore } from "./firebase-config.js?v=20260909-2332";
import { poserTexte, creer, lienSur, sansBalises, parOrdre } from "./texte.js?v=20260909-2332";

const $ = (id) => document.getElementById(id);

/* ---------- Hero ---------- */

function rendreHero(hero) {
  if (!hero) return;
  poserTexte($("hero-titre"), hero.titre);
  poserTexte($("hero-chapo"), hero.chapo);
  poserTexte($("itineraire-intro"), hero.itineraireIntro);
  poserTexte($("legende-titre"), hero.reperesTitre);
}

function rendreItineraire(etapes) {
  const liste = $("itineraire-liste");
  if (!liste || !Array.isArray(etapes) || !etapes.length) return;

  liste.textContent = "";
  for (const etape of parOrdre(etapes)) {
    const lien = creer("a", "etape__lien");
    lien.href = lienSur(etape.cible ? `#${etape.cible}` : "#formules") || "#formules";

    const point = creer("span", "etape__point");
    point.setAttribute("aria-hidden", "true");

    lien.append(point, creer("span", "etape__niveau", etape.niveau), creer("span", "etape__quoi", etape.quoi));

    const item = creer("li", "etape");
    item.appendChild(lien);
    liste.appendChild(item);
  }
}

/* Les quatre dessins de la legende, decrits en donnees plutot qu'en chaines
   de balises : le panel choisit une cle, jamais un dessin. Une cle inconnue
   ne rend aucun glyphe, elle n'ouvre pas la porte a du SVG arbitraire. */
/* Les quatre dessins de la legende. Chacun est cadre pour que son trace
   commence a x = 4 et tienne dans la meme bande verticale : sans ca, une
   epingle etroite et un segment large ne s'alignent pas dans la colonne, et
   ca se voit surtout en mobile, ou le glyphe passe au-dessus du texte. */
const GLYPHES = {
  /* Une echelle cotee, bornes comprises. Un segment jalonne aurait redit
     l'itineraire du hero, deux blocs plus haut : meme trait pointille, memes
     points ronds. Ici c'est une mesure, pas un trajet. */
  etendue: {
    largeur: 38,
    formes: [
      ["path", { d: "M4 11h30" }],
      ["path", { d: "M4 5v12M34 5v12" }]
    ]
  },
  /* Deux jalons cote a cote : le binome. */
  binome: {
    largeur: 38,
    formes: [
      ["circle", { cx: "11", cy: "11", r: "7" }],
      ["circle", { cx: "27", cy: "11", r: "7" }],
      ["circle", { cx: "11", cy: "11", r: "2.2", fill: "currentColor", stroke: "none" }],
      ["circle", { cx: "27", cy: "11", r: "2.2", fill: "currentColor", stroke: "none" }]
    ]
  },
  /* Un tampon barre : la remise fiscale. */
  tampon: {
    largeur: 40,
    formes: [
      ["rect", { x: "4", y: "4", width: "32", height: "14", rx: "1.5", "stroke-dasharray": "3 2.5" }],
      ["path", { d: "M12 16 28 6" }]
    ]
  },
  /* Une epingle : le lieu. */
  epingle: {
    largeur: 22,
    formes: [
      ["path", { d: "M11 20c4.5-5.4 6.8-9 6.8-11.4A6.8 6.8 0 0 0 4.2 8.6C4.2 11 6.5 14.6 11 20Z" }],
      ["circle", { cx: "11", cy: "8.4", r: "2.2", fill: "currentColor", stroke: "none" }]
    ]
  }
};

const SVG_NS = "http://www.w3.org/2000/svg";

function glyphe(cle) {
  const dessin = GLYPHES[cle];
  if (!dessin) return null;

  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [nom, valeur] of Object.entries({
    class: "legende__glyphe",
    width: String(dessin.largeur),
    height: "22",
    viewBox: `0 0 ${dessin.largeur} 22`,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.6",
    "aria-hidden": "true",
    focusable: "false"
  })) {
    svg.setAttribute(nom, valeur);
  }

  for (const [balise, attributs] of dessin.formes) {
    const forme = document.createElementNS(SVG_NS, balise);
    for (const [nom, valeur] of Object.entries(attributs)) forme.setAttribute(nom, valeur);
    svg.appendChild(forme);
  }
  return svg;
}

function rendreReperes(reperes) {
  const liste = $("reperes-liste");
  if (!liste || !Array.isArray(reperes) || !reperes.length) return;

  liste.textContent = "";
  for (const repere of parOrdre(reperes)) {
    /* Un document publie avant la legende porte encore `valeur` et `libelle` :
       on le lit plutot que de vider la section. */
    const fait = repere.fait ?? repere.valeur;
    const quoi = repere.quoi ?? repere.libelle;

    const item = creer("li", "legende__item");
    const dessin = glyphe(repere.glyphe);
    if (dessin) item.appendChild(dessin);

    const texte = document.createElement("div");
    texte.append(creer("span", "legende__fait", fait), creer("p", "legende__quoi", quoi));
    item.appendChild(texte);
    liste.appendChild(item);
  }
}

/* ---------- Formules ---------- */

function rendreFormules(formules) {
  const liste = $("formules-liste");
  if (!liste || !Array.isArray(formules) || !formules.length) return;

  liste.textContent = "";
  for (const f of parOrdre(formules)) {
    const carte = creer("article", f.phare ? "formule formule--phare" : "formule");
    if (f.id) carte.id = f.id;

    carte.append(creer("p", "formule__cible", f.cible), creer("h3", null, f.titre));

    /* Objectif au singulier, ou liste d'objectifs : le client decrit ses
       formules avec ces deux intitules, une carte n'a jamais les deux. */
    if (f.objectif) {
      const bloc = creer("p", "formule__objectif");
      bloc.append(creer("span", "formule__intitule", "Objectif"), document.createTextNode(" "));
      const texte = creer("span");
      poserTexte(texte, f.objectif);
      bloc.appendChild(texte);
      carte.appendChild(bloc);
    }

    /* `lignes` sert de repli : c'est le champ des documents publies avant
       que l'objectif et le contenu soient distingues. */
    const objectifs = Array.isArray(f.objectifs) && f.objectifs.length ? f.objectifs : f.lignes;
    if (Array.isArray(objectifs) && objectifs.length) {
      if (!f.objectif) carte.appendChild(creer("p", "formule__intitule formule__intitule--seul", "Objectifs"));
      const ul = creer("ul", "formule__liste");
      objectifs.forEach((ligne) => ul.appendChild(creer("li", null, ligne)));
      carte.appendChild(ul);
    }

    if (f.contenu) {
      const bloc = creer("p", "formule__contenu");
      bloc.append(creer("span", "formule__intitule", "Contenu"), document.createTextNode(" "));
      const texte = creer("span");
      poserTexte(texte, f.contenu);
      bloc.appendChild(texte);
      carte.appendChild(bloc);
    }

    if (Array.isArray(f.details) && f.details.length) {
      const details = creer("details", "formule__details");
      details.appendChild(creer("summary", null, f.detailsTitre || "En savoir plus"));
      const ul = document.createElement("ul");
      f.details.forEach((item) => ul.appendChild(creer("li", null, item)));
      details.appendChild(ul);
      carte.appendChild(details);
    }

    const pied = creer("div", "formule__pied");
    pied.append(creer("span", "formule__prix", f.prix), creer("span", "formule__prix-note", f.prixNote));

    const url = lienSur(f.lienBouton);
    if (url) {
      const bouton = creer("a", f.phare ? "bouton bouton--clair" : "bouton bouton--contour", f.libelleBouton || "Prendre rendez-vous");
      bouton.href = url;
      if (url.startsWith("http")) {
        bouton.target = "_blank";
        bouton.rel = "noopener";
      }
      pied.appendChild(bouton);
    }

    carte.appendChild(pied);
    liste.appendChild(carte);
  }
}

/* ---------- Fondatrices ---------- */

/* Les deux cartes reprennent le balisage ecrit en dur dans index.html : si
   Firestore repond, elles sont reconstruites a l'identique avec le texte
   publie ; sinon la version du HTML reste en place. */
function rendreFondatrices(fondatrices) {
  const liste = $("fondatrices-liste");
  if (!liste || !Array.isArray(fondatrices) || !fondatrices.length) return;

  liste.textContent = "";
  for (const f of parOrdre(fondatrices)) {
    /* Pas d'ancre ici, contrairement aux formules : rien ne pointe vers une
       fondatrice en particulier, et l'identifiant ne sert qu'au panel. */
    const carte = creer("article", "fondatrice");

    const entete = creer("div", "fondatrice__entete");
    const portrait = lienSur(f.portrait);
    if (portrait) {
      const image = document.createElement("img");
      image.className = "fondatrice__portrait";
      image.src = portrait;
      image.width = 800;
      image.height = 800;
      image.loading = "lazy";
      image.decoding = "async";
      image.alt = sansBalises(f.portraitAlt || f.prenom || "");
      entete.appendChild(image);
    }
    const identite = document.createElement("div");
    identite.append(creer("h3", null, f.prenom), creer("p", "fondatrice__role", f.role));
    entete.appendChild(identite);
    carte.appendChild(entete);

    if (Array.isArray(f.chiffres) && f.chiffres.length) {
      const chiffres = creer("div", "fondatrice__chiffres");
      for (const c of f.chiffres) {
        const bloc = creer("div", "fondatrice__chiffre");
        bloc.append(creer("span", "fondatrice__valeur", c.valeur), creer("span", "fondatrice__mesure", c.mesure));
        chiffres.appendChild(bloc);
      }
      carte.appendChild(chiffres);
    }

    if (Array.isArray(f.faits) && f.faits.length) {
      const faits = creer("dl", "fondatrice__faits");
      for (const fait of f.faits) {
        const ligne = creer("div", "fondatrice__ligne");
        ligne.append(creer("dt", null, fait.intitule), creer("dd", null, fait.texte));
        faits.appendChild(ligne);
      }
      carte.appendChild(faits);
    }

    if (Array.isArray(f.pastilles) && f.pastilles.length) {
      const pastilles = creer("ul", "fondatrice__pastilles");
      f.pastilles.forEach((p) => pastilles.appendChild(creer("li", "pastille", p)));
      carte.appendChild(pastilles);
    }

    liste.appendChild(carte);
  }
}

/* ---------- Témoignages ---------- */

function rendreTemoignages(temoignages) {
  const liste = $("temoignages-liste");
  if (!liste || !Array.isArray(temoignages) || !temoignages.length) return;

  liste.textContent = "";
  for (const t of parOrdre(temoignages)) {
    const figure = creer("figure", "temoignage");
    const citation = document.createElement("blockquote");
    citation.appendChild(creer("p", null, t.texte));
    figure.append(citation, creer("figcaption", null, t.auteur));
    liste.appendChild(figure);
  }
}

/* ---------- Presse ---------- */

function rendrePresse(articles) {
  const liste = $("presse-liste");
  if (!liste || !Array.isArray(articles) || !articles.length) return;

  liste.textContent = "";
  for (const a of parOrdre(articles)) {
    const figure = creer("figure", "presse__article");

    const image = document.createElement("img");
    image.src = lienSur(a.image) || "assets/img/og-preview-560.webp";
    if (a.image2x) image.srcset = `${lienSur(a.image)} 480w, ${lienSur(a.image2x)} 781w`;
    image.sizes = "(max-width: 780px) 100vw, 260px";
    image.width = 480;
    image.height = 471;
    image.loading = "lazy";
    image.decoding = "async";
    image.alt = sansBalises(a.alt || a.source || "");

    const url = lienSur(a.lien);
    let media = image;
    if (url) {
      const lien = creer("a", "presse__lien");
      lien.href = url;
      lien.target = "_blank";
      lien.rel = "noopener";
      lien.appendChild(image);
      media = lien;
    }

    const legende = document.createElement("figcaption");
    legende.append(creer("p", "presse__citation", a.citation), creer("span", "presse__source", a.source));

    figure.append(media, legende);
    liste.appendChild(figure);
  }
}

/* ---------- Questions fréquentes ---------- */

function rendreFaq(questions) {
  const liste = $("questions-liste");
  if (!liste || !Array.isArray(questions) || !questions.length) return;

  liste.textContent = "";
  for (const q of parOrdre(questions)) {
    const bloc = creer("details", "question");
    bloc.appendChild(creer("summary", null, q.question));
    bloc.appendChild(creer("p", null, q.reponse));
    liste.appendChild(bloc);
  }
}

/* ---------- Coordonnées ---------- */

function rendreCoordonnees(c) {
  if (!c) return;

  const adresse = $("contact-adresse");
  if (adresse && c.adresse) {
    adresse.textContent = "";
    const lignes = [c.raisonSociale, c.adresse, `${c.codePostal || ""} ${c.ville || ""}`.trim()].filter(Boolean);
    lignes.forEach((ligne, i) => {
      if (i) adresse.appendChild(document.createElement("br"));
      adresse.appendChild(document.createTextNode(ligne));
    });
  }

  const carte = $("contact-carte");
  const urlCarte = lienSur(c.lienCarte);
  if (carte && urlCarte) carte.href = urlCarte;

  const tel = $("contact-tel");
  if (tel && c.telephone) {
    tel.textContent = c.telephone;
    tel.href = `tel:${(c.telephoneLien || c.telephone).replace(/\s/g, "")}`;
  }

  const email = $("contact-email");
  if (email && c.email) {
    email.textContent = c.email;
    email.href = `mailto:${c.email}`;
  }

  const horaires = $("contact-horaires");
  if (horaires && Array.isArray(c.horaires) && c.horaires.length) {
    horaires.textContent = "";
    c.horaires.forEach((h) => horaires.appendChild(creer("p", null, h)));
  }
}

/* ---------- Chargement ---------- */

async function charger() {
  if (!FIREBASE_CONFIGURE) return;

  try {
    const { db, doc, getDoc } = await obtenirFirestore();
    const instantane = await getDoc(doc(db, "contenu", "site"));
    if (!instantane.exists()) return;

    const d = instantane.data();
    rendreHero(d.hero);
    rendreItineraire(d.itineraire);
    rendreReperes(d.reperes);
    rendreFormules(d.formules);
    rendreFondatrices(d.fondatrices);
    rendreTemoignages(d.temoignages);
    rendrePresse(d.presse);
    rendreFaq(d.faq);
    rendreCoordonnees(d.coordonnees);
  } catch (erreur) {
    // Le HTML par défaut reste affiché : on ne casse pas la page pour ça.
    console.warn("Contenu distant indisponible, affichage de la version du site.", erreur);
  }
}

charger();
