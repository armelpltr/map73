// ============================================================
// CONFIGURATION FIREBASE
//
// Ces valeurs sont publiques par construction : le navigateur les envoie à
// chaque requête. Ce qui protège les données, ce sont les règles Firestore
// (firestore.rules), pas le secret de cette clé.
//
// Le SDK n'est pas importé en haut de ce fichier mais chargé à la demande :
// une page qui n'a pas besoin de Firestore ne télécharge pas les 100 Ko du
// SDK, et le site public n'en charge rien tant que la configuration
// n'est pas remplie.
//
// À remplir après la création du projet :
//   npx firebase-tools login
//   npx firebase-tools projects:create map73-site
//   npx firebase-tools apps:create WEB "Site MAP73" --project map73-site
//   npx firebase-tools apps:sdkconfig WEB --project map73-site
// puis recopier ici les valeurs affichées.
// ============================================================

const SDK = "https://www.gstatic.com/firebasejs/10.13.0";

const firebaseConfig = {
  apiKey: "A_REMPLACER",
  authDomain: "A_REMPLACER.firebaseapp.com",
  projectId: "A_REMPLACER",
  storageBucket: "A_REMPLACER.firebasestorage.app",
  messagingSenderId: "A_REMPLACER",
  appId: "A_REMPLACER"
};

/** Tant que la configuration n'est pas remplie, rien ne doit être tenté. */
export const FIREBASE_CONFIGURE = !firebaseConfig.apiKey.startsWith("A_REMPLACER");

let application = null;

async function obtenirApp() {
  if (!FIREBASE_CONFIGURE) throw new Error("Firebase n’est pas configuré.");
  if (!application) {
    const { initializeApp } = await import(`${SDK}/firebase-app.js`);
    application = initializeApp(firebaseConfig);
  }
  return application;
}

/** Renvoie l'instance Firestore et le module, chargés à la demande. */
export async function obtenirFirestore() {
  const app = await obtenirApp();
  const module = await import(`${SDK}/firebase-firestore.js`);
  return { db: module.getFirestore(app), ...module };
}

/** Renvoie l'instance Auth et le module, chargés à la demande. */
export async function obtenirAuth() {
  const app = await obtenirApp();
  const module = await import(`${SDK}/firebase-auth.js`);
  return { auth: module.getAuth(app), ...module };
}
