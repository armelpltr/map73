// ============================================================
// SITE-DATA — applique sur le site public le contenu géré depuis le panel
//
// Un seul document Firestore, `contenu/site`, porte tout le contenu
// éditable : une lecture par visite, et une publication atomique côté
// panel. Si Firebase n'est pas configuré, injoignable, ou si une section
// manque, le HTML écrit en dur reste affiché — il dit déjà la même chose.
// Rien sur cette page ne dépend de Firestore pour fonctionner.
// ============================================================

import { FIREBASE_CONFIGURE, obtenirFirestore } from "./firebase-config.js?v=20260908-2328";
import { poserTexte, creer, lienSur, sansBalises, parOrdre } from "./texte.js?v=20260908-2328";

const $ = (id) => document.getElementById(id);

/* ---------- Hero ---------- */

function rendreHero(hero) {
  if (!hero) return;
  poserTexte($("hero-titre"), hero.titre);
  poserTexte($("hero-chapo"), hero.chapo);
  poserTexte($("hero-note"), hero.note);
  poserTexte($("itineraire-intro"), hero.itineraireIntro);
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

function rendreReperes(reperes) {
  const liste = $("reperes-liste");
  if (!liste || !Array.isArray(reperes) || !reperes.length) return;

  liste.textContent = "";
  for (const repere of parOrdre(reperes)) {
    const bloc = creer("div", "repere");
    bloc.append(creer("span", "repere__valeur", repere.valeur), creer("p", "repere__libelle", repere.libelle));
    liste.appendChild(bloc);
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
    if (f.objectif) carte.appendChild(creer("p", "formule__objectif", f.objectif));

    if (Array.isArray(f.lignes) && f.lignes.length) {
      const ul = creer("ul", "formule__liste");
      f.lignes.forEach((ligne) => ul.appendChild(creer("li", null, ligne)));
      carte.appendChild(ul);
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
