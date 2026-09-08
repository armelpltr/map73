// ============================================================
// AUTH — connexion au panel
//
// Firebase Auth par e-mail et mot de passe. Être connecté ne suffit pas :
// la clé du site est publique, n'importe qui peut se créer un compte. Le
// panel n'ouvre que si une entrée `admins/<uid>` existe, et ce sont les
// règles Firestore qui refusent réellement les écritures — masquer
// l'interface ne protège rien à soi seul.
//
// Les comptes se créent à la main dans la console Firebase :
//   Authentication > Users > Add user
//   Firestore > collection `admins` > document dont l'ID est l'UID du compte
// ============================================================

import { FIREBASE_CONFIGURE, obtenirAuth, obtenirFirestore } from "../firebase-config.js";
import { $ } from "./ui.js";

const MESSAGES = {
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
  "auth/wrong-password": "Adresse e-mail ou mot de passe incorrect.",
  "auth/user-not-found": "Adresse e-mail ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/network-request-failed": "Connexion au serveur impossible. Vérifiez votre réseau."
};

function afficherErreur(message) {
  const zone = $("connexion-erreur");
  if (!zone) return;
  zone.textContent = message;
  zone.hidden = !message;
}

/**
 * Démarre l'écran de connexion et appelle `onPret(membre)` dès qu'un compte
 * autorisé est en place. `membre` porte l'e-mail et le rôle éventuel.
 */
export async function initAuth(onPret) {
  const ecranConnexion = $("ecran-connexion");
  const ecranPanel = $("ecran-panel");
  const formulaire = $("formulaire-connexion");

  if (!FIREBASE_CONFIGURE) {
    afficherErreur(
      "Firebase n’est pas encore configuré. Renseignez assets/js/firebase-config.js avant d’utiliser le panel."
    );
    formulaire?.querySelectorAll("input, button").forEach((c) => (c.disabled = true));
    return;
  }

  const { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } =
    await obtenirAuth();
  const { db, doc, getDoc } = await obtenirFirestore();

  // La session s'arrête à la fermeture de l'onglet : le panel est souvent
  // ouvert depuis un poste partagé.
  setPersistence(auth, browserSessionPersistence).catch(() => {});

  formulaire?.addEventListener("submit", async (e) => {
    e.preventDefault();
    afficherErreur("");

    const bouton = formulaire.querySelector("button[type=submit]");
    if (bouton) bouton.disabled = true;

    try {
      await signInWithEmailAndPassword(auth, $("connexion-email").value.trim(), $("connexion-mdp").value);
    } catch (erreur) {
      afficherErreur(MESSAGES[erreur.code] || "Connexion impossible. Réessayez.");
    } finally {
      if (bouton) bouton.disabled = false;
    }
  });

  $("bouton-deconnexion")?.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, async (utilisateur) => {
    if (!utilisateur) {
      ecranConnexion.hidden = false;
      ecranPanel.hidden = true;
      return;
    }

    let membre = null;
    try {
      const entree = await getDoc(doc(db, "admins", utilisateur.uid));
      if (entree.exists()) membre = { uid: utilisateur.uid, email: utilisateur.email, ...entree.data() };
    } catch {
      // Une lecture refusée signifie simplement que le compte n'est pas listé.
    }

    if (!membre) {
      await signOut(auth);
      afficherErreur("Ce compte n’a pas accès au panel. Contactez l’administrateur du site.");
      return;
    }

    ecranConnexion.hidden = true;
    ecranPanel.hidden = false;
    const qui = $("admin-qui");
    if (qui) qui.textContent = membre.nom ? `${membre.nom} — ${membre.email}` : membre.email;

    onPret(membre);
  });
}
