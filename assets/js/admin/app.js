// ============================================================
// APP — point d'entrée du panel
//
// Charge `contenu/site`, construit les formulaires, et republie le document
// entier à l'enregistrement. Une seule lecture et une seule écriture par
// session de travail : le quota gratuit de Firestore ne le voit pas passer.
// ============================================================

import { obtenirFirestore } from "../firebase-config.js";
import { CONTENU_DEFAUT } from "../contenu-defaut.js";
import { initAuth } from "./auth.js";
import { initAcces } from "./acces.js";
import { construirePanneaux } from "./panneaux.js";
import { $, etat, confirmer } from "./ui.js";

let firestore = null;
const REFERENCE = () => firestore.doc(firestore.db, "contenu", "site");

let contenu = null;
let modifie = false;
let membre = null;

function marquerModifie() {
  if (modifie) return;
  modifie = true;
  etat("Modifications non publiées.");
  $("bouton-publier").disabled = false;
}

function marquerPublie() {
  modifie = false;
  $("bouton-publier").disabled = true;
}

/* ---------- Onglets ---------- */

function initOnglets() {
  document.querySelectorAll(".admin-onglet").forEach((onglet) => {
    onglet.addEventListener("click", () => {
      document.querySelectorAll(".admin-onglet").forEach((o) => o.classList.remove("est-actif"));
      document.querySelectorAll(".admin-panneau").forEach((p) => p.classList.remove("est-actif"));
      onglet.classList.add("est-actif");
      $(`panneau-${onglet.dataset.panneau}`).classList.add("est-actif");
    });
  });
}

/* ---------- Chargement et publication ---------- */

/* Copie profonde : le contenu par défaut sert de base de travail, il ne doit
   pas être modifié en place, sinon un « Annuler » repartirait du texte déjà
   édité au lieu de la version d'origine. */
const copie = (valeur) => JSON.parse(JSON.stringify(valeur));

async function charger() {
  etat("Chargement…");
  try {
    firestore = await obtenirFirestore();
    const instantane = await firestore.getDoc(REFERENCE());
    if (instantane.exists()) {
      contenu = instantane.data();
      etat(`Dernière publication : ${formaterDate(contenu.publieLe)}.`);
      $("bandeau-initial").hidden = true;
    } else {
      contenu = copie(CONTENU_DEFAUT);
      etat("Aucun contenu publié pour l’instant : les formulaires reprennent le texte actuel du site.");
      $("bandeau-initial").hidden = false;
    }
  } catch (erreur) {
    contenu = copie(CONTENU_DEFAUT);
    etat("Lecture impossible, les formulaires reprennent le texte actuel du site.", "erreur");
    console.error(erreur);
  }

  construirePanneaux(contenu, marquerModifie);
  marquerPublie();
}

async function publier() {
  const bouton = $("bouton-publier");
  bouton.disabled = true;
  etat("Publication…");

  try {
    await firestore.setDoc(REFERENCE(), {
      ...contenu,
      publieLe: firestore.serverTimestamp(),
      publiePar: membre?.email || null
    });
    marquerPublie();
    etat("Publié. Le site affiche la nouvelle version au prochain chargement.", "succes");
    $("bandeau-initial").hidden = true;
  } catch (erreur) {
    bouton.disabled = false;
    etat("Publication refusée. Vérifiez que votre compte figure bien dans les accès.", "erreur");
    console.error(erreur);
  }
}

async function retablirDefaut() {
  if (!confirmer("Remplacer tout le contenu en cours d’édition par le texte d’origine du site ?")) return;
  contenu = copie(CONTENU_DEFAUT);
  construirePanneaux(contenu, marquerModifie);
  marquerModifie();
  etat("Texte d’origine rechargé. Rien n’est publié tant que vous ne cliquez pas sur Publier.");
}

function formaterDate(horodatage) {
  if (!horodatage?.toDate) return "inconnue";
  return horodatage.toDate().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

/* ---------- Démarrage ---------- */

initOnglets();

$("bouton-publier").addEventListener("click", publier);
$("bouton-defaut").addEventListener("click", retablirDefaut);

window.addEventListener("beforeunload", (e) => {
  if (!modifie) return;
  e.preventDefault();
  e.returnValue = "";
});

initAuth((compte) => {
  membre = compte;
  initAcces(compte.role);
  charger();
});
