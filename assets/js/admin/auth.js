// ============================================================
// AUTH — la porte du panel, côté navigateur
//
// Trois écrans successifs :
//   1. identifiants + contrôle anti-robot Turnstile ;
//   2. code à six chiffres reçu par e-mail ;
//   3. le panel.
//
// Le navigateur ne s'adresse jamais directement à Firebase pour se
// connecter. Il envoie les identifiants au Worker, qui vérifie le jeton
// Turnstile, l'appartenance à `admins`, puis le mot de passe, et ne rend un
// jeton personnalisé que si les trois passent. Le code de la seconde étape
// est tiré et comparé côté serveur : il n'existe dans le navigateur qu'une
// fois saisi par la personne qui l'a lu dans sa boîte mail.
//
// Rien de tout cela n'est une protection à soi seul : ce qui protège
// réellement les données, ce sont les règles Firestore, qui exigent une
// entrée dans `admins` ET l'attribut posé par le Worker à la validation du
// code. L'interface ne fait que refuser plus tôt, et plus clairement.
// ============================================================

import { FIREBASE_CONFIGURE, obtenirAuth, obtenirFirestore } from "../firebase-config.js";
import { WORKER_URL, TURNSTILE_SITE_KEY } from "../config.js";
import { $ } from "./ui.js";

const MESSAGES_FIREBASE = {
  "auth/invalid-custom-token": "Session refusée. Réessayez de vous connecter.",
  "auth/network-request-failed": "Connexion au serveur impossible. Vérifiez votre réseau."
};

let firebase = null;      // { auth, signInWithCustomToken, ... }
let widgetTurnstile = null;
let surPret = null;

function afficherErreur(id, message) {
  const zone = $(id);
  if (!zone) return;
  zone.textContent = message;
  zone.hidden = !message;
}

function montrer(ecran) {
  for (const id of ["ecran-connexion", "ecran-code", "ecran-panel"]) {
    $(id).hidden = id !== ecran;
  }
}

/* ---------- Appels au Worker ---------- */

async function appelerWorker(chemin, donnees) {
  let reponse;
  try {
    reponse = await fetch(`${WORKER_URL}${chemin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees)
    });
  } catch {
    throw new Error("Serveur injoignable. Vérifiez votre connexion.");
  }

  const corps = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(corps.error || "Erreur inattendue.");
  return corps;
}

/** Le jeton de session courant, rafraîchi pour porter les attributs à jour. */
async function jetonCourant(forcer = false) {
  const utilisateur = firebase.auth.currentUser;
  if (!utilisateur) throw new Error("Session expirée. Reconnectez-vous.");
  return utilisateur.getIdToken(forcer);
}

/* ---------- Turnstile ---------- */

/* `window.turnstile` apparaît avant d'être utilisable : l'objet est posé dès
   les premières lignes du script, `render` n'arrive qu'à la fin de son
   initialisation. Tester l'objet ne disait donc rien, et `render(...)`
   levait « is not a function ». C'est la méthode qu'on attend. */
function turnstilePret() {
  return typeof window.turnstile?.render === "function";
}

function poserTurnstile() {
  if (widgetTurnstile !== null) return true;
  if (!turnstilePret()) return false;

  try {
    widgetTurnstile = window.turnstile.render("#turnstile", {
      sitekey: TURNSTILE_SITE_KEY,
      language: "fr",
      theme: "light"
    });
  } catch (erreur) {
    console.error("Turnstile :", erreur);
    return false;
  }
  return widgetTurnstile !== null && widgetTurnstile !== undefined;
}

/*
 * Le script de Turnstile est chargé en `async defer` : rien ne garantit
 * qu'il soit prêt quand ce module s'exécute. S'accrocher à l'événement
 * `load` ne suffisait pas — l'écouteur était posé après un `await` sur le
 * SDK Firebase, donc parfois après que `load` soit déjà passé, et le widget
 * n'apparaissait jamais. On attend activement, et on le dit si ça n'arrive
 * pas : un formulaire sans case anti-robot est un formulaire mort.
 */
function attendreTurnstile(essaisRestants = 100) {
  if (poserTurnstile() === true) return;
  if (essaisRestants <= 0) {
    afficherErreur(
      "connexion-erreur",
      "Le contrôle anti-robot n’a pas pu se charger. Vérifiez qu’aucun bloqueur ne filtre challenges.cloudflare.com, puis rechargez la page."
    );
    return;
  }
  setTimeout(() => attendreTurnstile(essaisRestants - 1), 100);
}

function reinitialiserTurnstile() {
  if (turnstilePret() && widgetTurnstile !== null) window.turnstile.reset(widgetTurnstile);
}

function jetonTurnstile() {
  if (!turnstilePret() || widgetTurnstile === null) return "";
  return window.turnstile.getResponse(widgetTurnstile) || "";
}

/* ---------- Étape 1 : identifiants ---------- */

async function connecter(e) {
  e.preventDefault();
  afficherErreur("connexion-erreur", "");

  const bouton = $("formulaire-connexion").querySelector("button[type=submit]");
  bouton.disabled = true;

  try {
    if (!firebase) throw new Error("Chargement en cours, réessayez dans un instant.");

    const jeton = jetonTurnstile();
    if (!jeton) throw new Error("Patientez le temps du contrôle anti-robot, puis réessayez.");

    const { jeton: jetonPersonnalise } = await appelerWorker("/connexion", {
      email: $("connexion-email").value.trim(),
      motDePasse: $("connexion-mdp").value,
      turnstile: jeton
    });

    await firebase.signInWithCustomToken(firebase.auth, jetonPersonnalise);
    $("connexion-mdp").value = "";
    await demanderCode(false);
  } catch (erreur) {
    afficherErreur("connexion-erreur", MESSAGES_FIREBASE[erreur.code] || erreur.message);
    // Un jeton Turnstile ne sert qu'une fois : sans remise à zéro, la
    // tentative suivante échouerait sur le contrôle et non sur le motif réel.
    reinitialiserTurnstile();
  } finally {
    bouton.disabled = false;
  }
}

/* ---------- Étape 2 : code à six chiffres ---------- */

async function demanderCode(renvoi) {
  montrer("ecran-code");
  afficherErreur("code-erreur", "");
  $("code-etat").textContent = "Envoi du code…";

  try {
    const reponse = await appelerWorker("/a2f/request", {
      idToken: await jetonCourant(),
      renvoi
    });
    $("code-etat").textContent = reponse.dejaEnvoye
      ? `Un code est déjà en route vers ${reponse.indice}.`
      : `Code envoyé à ${reponse.indice}. Il est valable dix minutes.`;
    $("code-saisie").focus();
  } catch (erreur) {
    $("code-etat").textContent = "";
    afficherErreur("code-erreur", erreur.message);
  }
}

async function verifierCode(e) {
  e.preventDefault();
  afficherErreur("code-erreur", "");

  const bouton = $("formulaire-code").querySelector("button[type=submit]");
  bouton.disabled = true;

  try {
    await appelerWorker("/a2f/verify", {
      idToken: await jetonCourant(),
      code: $("code-saisie").value.trim()
    });

    /* L'attribut vient d'être posé sur le compte : sans jeton rafraîchi, la
       session en cours ne le porte pas et Firestore refuserait la première
       écriture. */
    await jetonCourant(true);
    await ouvrirPanel();
  } catch (erreur) {
    afficherErreur("code-erreur", erreur.message);
    $("code-saisie").select();
  } finally {
    bouton.disabled = false;
  }
}

/* ---------- Étape 3 : le panel ---------- */

async function ouvrirPanel() {
  const utilisateur = firebase.auth.currentUser;
  const { db, doc, getDoc } = await obtenirFirestore();

  let membre = { email: utilisateur.email, role: "editeur" };
  try {
    const entree = await getDoc(doc(db, "admins", utilisateur.uid));
    if (entree.exists()) membre = { uid: utilisateur.uid, email: utilisateur.email, ...entree.data() };
  } catch { /* la lecture peut échouer : le rôle par défaut est le moins ouvert */ }

  montrer("ecran-panel");
  const qui = $("admin-qui");
  if (qui) {
    qui.textContent = membre.nom ? `${membre.nom} — ${membre.email}` : membre.email;
  }

  surPret(membre);
}

/* ---------- Démarrage ---------- */

export async function initAuth(onPret) {
  surPret = onPret;

  if (!FIREBASE_CONFIGURE) {
    afficherErreur(
      "connexion-erreur",
      "Firebase n’est pas encore configuré. Renseignez assets/js/firebase-config.js avant d’utiliser le panel."
    );
    $("formulaire-connexion").querySelectorAll("input, button").forEach((c) => (c.disabled = true));
    return;
  }

  if (TURNSTILE_SITE_KEY.startsWith("A_REMPLACER")) {
    afficherErreur(
      "connexion-erreur",
      "Le contrôle anti-robot n’est pas configuré. Renseignez la clé Turnstile dans assets/js/config.js."
    );
    $("formulaire-connexion").querySelectorAll("input, button").forEach((c) => (c.disabled = true));
    return;
  }

  /* Les écouteurs d'abord, et avant tout `await` : une panne du CDN Turnstile
     ou de Firebase ne doit pas laisser un formulaire dont le bouton ne fait
     rien. C'est exactement ce qui arrivait quand `render(...)` levait une
     exception depuis cette ligne. */
  montrer("ecran-connexion");

  $("formulaire-connexion").addEventListener("submit", connecter);
  $("formulaire-code").addEventListener("submit", verifierCode);
  $("bouton-renvoyer").addEventListener("click", () => demanderCode(true));

  attendreTurnstile();

  try {
    const { auth, signInWithCustomToken, signOut, setPersistence, browserSessionPersistence } =
      await obtenirAuth();
    firebase = { auth, signInWithCustomToken };

    // La session s'arrête à la fermeture de l'onglet : le panel peut être
    // ouvert depuis un poste partagé.
    await setPersistence(auth, browserSessionPersistence).catch(() => {});

    const deconnecter = async () => {
      await signOut(auth);
      reinitialiserTurnstile();
      montrer("ecran-connexion");
    };
    $("bouton-deconnexion").addEventListener("click", deconnecter);
    $("bouton-annuler-code").addEventListener("click", deconnecter);
  } catch (erreur) {
    console.error(erreur);
    afficherErreur("connexion-erreur", "Chargement de Firebase impossible : " + erreur.message);
  }
}

/** Utilisé par l'onglet Accès, qui parle au Worker et non à Firestore. */
export { appelerWorker, jetonCourant };
